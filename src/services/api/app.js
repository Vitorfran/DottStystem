import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


function authMiddleware(req, res, next) {
    // 1. Pegar o cabeçalho 'authorization'
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não fornecido!" });
    }

    // O header vem no formato: "Bearer TOKEN_AQUI". Precisamos dividir a string para pegar só o token.
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: "Erro no formato do Token! Use 'Bearer TOKEN'" });
    }

    const token = parts[1];

    // 2. Verificar a validade do Token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Token expirado ou assinatura inválida
            return res.status(401).json({ message: "Token inválido ou expirado!" });
        }

        // 3. Injetar o ID do usuário na requisição para que a rota final saiba QUEM está logado
        req.usuarioId = decoded.id;
        req.usuarioRole = decoded.role;

        // 4. Autorizar a passagem para a rota final!
        next();
    });
}


app.post("/api/contato", async (req, res) => {
    // pegar dados com o fecth do Front ( papel do cliente )

    const { nome, email, mensagem, fotos } = req.body;


    if (!nome || !email || !mensagem) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
    }

    console.log("Validação passou! Dados:", nome, email, mensagem);



    // salvar no banco usando o prisma ORM 
    const novoContato = await prisma.contato.create({
        data: {
            nome: nome,
            email: email,
            mensagem: mensagem,
            fotos: fotos || null
        }
    });




    console.log("Contato salvo no banco de dados:", novoContato);


    console.log("Enviando email para o administrador do site...");

    // enviar email Responder 

    const infoEmail = await transporter.sendMail({
        from: `"Dott System" <${process.env.EMAIL_USER}>`, // Quem envia (o sistema)
        to: process.env.EMAIL_USER, // Para quem vai (para você mesmo receber o aviso)
        subject: `Novo orçamento recebido: ${nome}`, // Assunto do e-mail
        html: `
                <h2>Novo contato pelo site!</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>E-mail do Cliente:</strong> ${email}</p>
                <p><strong>Mensagem:</strong></p>
                <p>${mensagem}</p>
            `
    });
    console.log("E-mail enviado com sucesso!", infoEmail.messageId);

    res.status(200).json({ message: "Mensagem recebida com sucesso!" });
});


// Cadastro/ Login 

app.post("/api/auth/register", async (req, res) => {
    try {
        const { nome, email, senha, role } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
        }

        // Verifica se e-mail já está cadastrado
        const usuarioExistente = await prisma.user.findUnique({ where: { email } });
        if (usuarioExistente) {
            // Se já existe mas não verificou, reenviar o código
            if (!usuarioExistente.emailVerificado) {
                const novoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
                await prisma.user.update({
                    where: { email },
                    data: { codigoVerificacao: novoCodigo }
                });
                await transporter.sendMail({
                    from: `"Dott System" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: "Seu novo código de verificação - Dott System",
                    html: `
                        <div style="font-family:sans-serif;max-width:480px;margin:auto">
                            <h2 style="color:#4f46e5">Dott System</h2>
                            <p>Olá <strong>${usuarioExistente.nome}</strong>! Aqui está seu novo código de verificação:</p>
                            <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#1e293b;background:#f1f5f9;padding:24px;border-radius:12px;text-align:center;margin:20px 0">${novoCodigo}</div>
                            <p style="color:#64748b;font-size:13px">Este código expira em 15 minutos. Caso não reconheça, ignore este e-mail.</p>
                        </div>
                    `
                });
                return res.status(200).json({ message: "Código reenviado! Verifique seu e-mail.", reenviado: true });
            }
            return res.status(400).json({ message: "Este e-mail já possui uma conta ativa." });
        }

        // Gera código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        // Cria o usuário com e-mail NÃO verificado
        const hashSenha = await bcrypt.hash(senha, 10);
        await prisma.user.create({
            data: {
                nome,
                email,
                senha: hashSenha,
                role: role || "cliente",
                emailVerificado: false,
                codigoVerificacao: codigo
            }
        });

        // Envia o e-mail com o código formatado
        await transporter.sendMail({
            from: `"Dott System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Confirme seu e-mail - Dott System",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto">
                    <h2 style="color:#4f46e5">Bem-vindo(a) à Dott System! 🚀</h2>
                    <p>Olá <strong>${nome}</strong>! Para ativar sua conta, use o código abaixo:</p>
                    <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#1e293b;background:#f1f5f9;padding:24px;border-radius:12px;text-align:center;margin:20px 0">${codigo}</div>
                    <p style="color:#64748b;font-size:13px">Digite este código na tela de cadastro para confirmar seu e-mail.<br/>Ele expira em 15 minutos.</p>
                </div>
            `
        });

        res.status(200).json({ message: "Código enviado! Verifique seu e-mail." });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        res.status(500).json({ message: "Erro ao criar conta. Tente novamente." });
    }
});

// Verificar código de confirmação de e-mail
app.post("/api/auth/verificar-codigo", async (req, res) => {
    try {
        const { email, codigo } = req.body;
        if (!email || !codigo) {
            return res.status(400).json({ message: "E-mail e código são obrigatórios." });
        }

        const usuario = await prisma.user.findUnique({ where: { email } });
        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        if (usuario.emailVerificado) {
            return res.status(400).json({ message: "E-mail já verificado! Faça login normalmente." });
        }

        if (usuario.codigoVerificacao !== codigo.trim()) {
            return res.status(400).json({ message: "Código incorreto. Verifique e tente novamente." });
        }

        // Ativa a conta e apaga o código usado
        await prisma.user.update({
            where: { email },
            data: {
                emailVerificado: true,
                codigoVerificacao: null
            }
        });

        res.status(200).json({ message: "E-mail verificado com sucesso! Bem-vindo(a) à Dott System!" });
    } catch (error) {
        console.error("Erro ao verificar código:", error);
        res.status(500).json({ message: "Erro ao verificar código." });
    }
});


// Retorna dados do usuário logado (para pré-preencher formulários)
app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
        const usuario = await prisma.user.findUnique({
            where: { id: req.usuarioId },
            select: { id: true, nome: true, email: true, role: true }
        });
        if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });
        res.status(200).json({ usuario });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar dados do usuário." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
        }

        const usuario = await prisma.user.findUnique({ where: { email } });
        const senhaCorreta = usuario ? await bcrypt.compare(senha, usuario.senha) : false;

        if (!usuario || !senhaCorreta) {
            return res.status(401).json({ message: "E-mail ou senha inválidos!" });
        }

        // Bloqueia login se o e-mail não foi verificado
        if (!usuario.emailVerificado) {
            return res.status(403).json({
                message: "Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada e complete o cadastro.",
                naoVerificado: true,
                email: usuario.email
            });
        }

        const token = jwt.sign(
            { id: usuario.id, role: usuario.role },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.status(200).json({ message: "Login realizado com sucesso!", token, role: usuario.role });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro ao fazer login." });
    }
});


// Listar Projetos usando o middleware


app.get("/api/projetos", authMiddleware, async (req, res) => {

    try {
        const { projectId } = req.query;
        let queryCondition = { clienteId: req.usuarioId };

        // Se for admin ou funcionário e passar o projectId por query param, permite o bypass
        if (req.usuarioRole === 'admin' || req.usuarioRole === 'funcionario') {
            if (projectId) {
                queryCondition = { id: parseInt(projectId) };
            } else {
                // Se for admin e não passar projectId, busca o primeiro projeto do sistema como fallback para testes
                const primeiroProjeto = await prisma.project.findFirst({
                    include: {
                        payments: true
                    }
                });
                if (primeiroProjeto) {
                    return res.status(200).json({ projeto: primeiroProjeto });
                }
            }
        }

        const projeto = await prisma.project.findFirst({
            where: queryCondition,
            include: {
                payments: true // Inclui os pagamentos do projeto
            }
        });

        if (!projeto) {
            return res.status(404).json({ message: "Projeto nao encontrado!" });
        }


        res.status(200).json({ projeto: projeto });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar projeto." });
    }



});

// --- NOVAS ROTAS DE BRIEFING INTELIGENTE E APROVAÇÃO ADMIN ---

// Rota para refinar briefing via IA
app.post("/api/contato/refinar", async (req, res) => {
    const { mensagem } = req.body;
    if (!mensagem) {
        return res.status(400).json({ message: "A mensagem é obrigatória." });
    }
    try {
        const prompt = `Formate e estruture o texto abaixo em um escopo limpo e legível de projeto de software.
ATENÇÃO: Responda em Português do Brasil com linguagem simples, sem jargões técnicos.

Ideia original do cliente: "${mensagem}"

Escreva seguindo exatamente esta estrutura Markdown:

## 📌 Nome do Projeto
(Sugira um nome criativo)

## 🎯 O que será criado
(Explicação simples e objetiva do projeto em 2 a 3 frases)

## ✅ Principais Funcionalidades
(Lista com 3 a 5 pontos-chave do sistema)

## 👥 Usuários
(Quem vai utilizar a plataforma)

## 📱 Formato
(Se é site, aplicativo móvel, e-commerce, sistema de computador, etc.)`;

        let escopoRefinado = null;

        // 1. Tenta via Groq (Llama 3) se a API key estiver disponível
        if (process.env.GROQ_API_KEY) {
            try {
                escopoRefinado = await enviarMensagemParaGroqLlama(prompt);
            } catch (errGroq) {
                console.log("Groq Llama indisponível para briefing:", errGroq.message);
            }
        }

        // 2. Tenta via Gemini se disponível
        if ((!escopoRefinado || escopoRefinado.length < 50) && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
            try {
                escopoRefinado = await enviarMensagemParaGeminiMestre(prompt);
            } catch (errGemini) {
                console.log("Gemini indisponível para briefing:", errGemini.message);
            }
        }

        // 3. Remove caracteres indesejados ou blocos brutos se necessário
        if (escopoRefinado) {
            escopoRefinado = escopoRefinado.replace(/\{[\s\S]*?\}/g, '');
            escopoRefinado = escopoRefinado.replace(/Aqui está[\s\S]*?:/gi, '');
            escopoRefinado = escopoRefinado.trim();
        }

        // 4. Fallback dinâmico caso serviços de IA estejam offline ou sem chave configurada
        if (!escopoRefinado || escopoRefinado.length < 50) {
            const palavras = mensagem.trim().split(/\s+/);
            const nomeSugerido = palavras.length <= 4 
                ? `Projeto ${mensagem.trim()}`
                : `Sistema ${palavras.slice(0, 3).join(' ')}`;

            escopoRefinado = `## 📌 Nome do Projeto\n${nomeSugerido}\n\n## 🎯 O que será criado\nPlataforma digital desenvolvida sob medida com base nos requisitos especificados: "${mensagem}".\n\n## ✅ Principais Funcionalidades\n- Interface moderna e responsiva (adaptada para computadores e celulares)\n- Painel de controle e gerenciamento seguro\n- Formulários de cadastro, interações e fluxos operacionais\n- Integrações automatizadas e relatórios de acompanhamento\n\n## 👥 Usuários\nAdministradores, gestores e clientes finais da plataforma.\n\n## 📱 Formato\nPlataforma digital responsiva Web & Mobile (PWA).`;
        }

        res.status(200).json({ escopo: escopoRefinado });
    } catch (error) {
        console.error("Erro ao refinar briefing:", error);
        const nomeFallback = mensagem.length < 30 ? mensagem : "Projeto Sob Medida";
        const escopoFallback = `## 📌 Nome do Projeto\n${nomeFallback}\n\n## 🎯 O que será criado\nSistema digital sob medida desenvolvido a partir da especificação: "${mensagem}".\n\n## ✅ Principais Funcionalidades\n- Layout responsivo e intuitivo\n- Painel administrativo e controle de acessos\n- Notificações e comunicação integrada\n\n## 👥 Usuários\nGestores e usuários do sistema.\n\n## 📱 Formato\nPlataforma Web Responsiva.`;
        res.status(200).json({ escopo: escopoFallback });
    }
});

function gerarPixQrCode(valor) {
    const valorFormatado = parseFloat(valor).toFixed(2);
    const len = String(valorFormatado).length;
    const lenStr = len.toString().padStart(2, '0');
    return `00020126580014BR.GOV.BCB.PIX0114contato@dott.com52040000530398654${lenStr}${valorFormatado}5802BR5911Dott System6006Itajai62070503***6304CA42`;
}

// Rota Administrativa para aprovar contatos/briefing e criar o Onboarding do Cliente
app.post("/api/admin/aprovar-contato/:id", async (req, res) => {
    const contatoId = parseInt(req.params.id);
    if (isNaN(contatoId)) {
        return res.status(400).json({ message: "ID do contato inválido." });
    }

    const { nome, valorTotal, valorEntrada, valorFinal, trelloLink, contratoLink } = req.body;

    try {
        // 1. Busca o contato no banco
        const contato = await prisma.contato.findUnique({
            where: { id: contatoId }
        });
        if (!contato) {
            return res.status(404).json({ message: "Contato não encontrado." });
        }

        // 2. Cria o usuário com senha temporária se ele já não existir
        let cliente = await prisma.user.findUnique({
            where: { email: contato.email }
        });

        const senhaTemporaria = "dott123";
        const hashSenha = await bcrypt.hash(senhaTemporaria, 10);

        if (!cliente) {
            cliente = await prisma.user.create({
                data: {
                    nome: contato.nome,
                    email: contato.email,
                    senha: hashSenha,
                    role: "cliente"
                }
            });
        }

        // 3. Cria o projeto associado a esse cliente
        const nomeFinalProjeto = nome || `Projeto ${contato.nome}`;
        const contratoLinkFinal = contratoLink || "https://zapsign.com.br/sign/dott-system-contrato-modelo";

        const projeto = await prisma.project.create({
            data: {
                nome: nomeFinalProjeto,
                mensagem: contato.mensagem,
                etapa_atual: "BRIEFING",
                contrato_link: contratoLinkFinal,
                trello_link: trelloLink || null,
                fotos: contato.fotos || null, // Copia as fotos anexadas no contato
                contrato_assinado: false,
                clienteId: cliente.id
            }
        });

        // 4. Cria as faturas dinamicamente
        const vEntrada = parseFloat(valorEntrada) || 2500.00;
        const vTotal = parseFloat(valorTotal) || 5000.00;
        const vFinal = valorFinal !== undefined ? parseFloat(valorFinal) : (vTotal - vEntrada);

        // Fatura 1: Entrada
        await prisma.payment.create({
            data: {
                value: vEntrada,
                status: "PENDING",
                method: "PIX",
                projectId: projeto.id,
                pixQrcode: gerarPixQrCode(vEntrada)
            }
        });

        // Fatura 2: Parcela Final (se houver valor restante)
        if (vFinal > 0) {
            await prisma.payment.create({
                data: {
                    value: vFinal,
                    status: "PENDING",
                    method: "BOLETO", // ou CARD/PIX
                    projectId: projeto.id
                }
            });
        }

        // 5. Envia o e-mail de acesso para o cliente com layout HTML elegante
        console.log("Enviando e-mail de onboarding...");
        await transporter.sendMail({
            from: `"Dott System" <${process.env.EMAIL_USER}>`,
            to: contato.email,
            subject: `Seu projeto na Dott System foi pré-aprovado: ${nomeFinalProjeto}! 🚀`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #080c14; padding: 40px 20px; color: #f1f5f9; text-align: left; margin: 0; line-height: 1.6;">
                    <div style="max-width: 580px; margin: 0 auto; background: linear-gradient(145deg, #0f172a, #0b0f19); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                        <!-- Header Banner with Gradient -->
                        <div style="background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 32px 40px; text-align: center;">
                            <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 6px;">Dott<span style="color: #a78bfa;">.</span>System</div>
                            <div style="font-size: 13px; color: #c084fc; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">Soluções Digitais Premium</div>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 40px 30px 40px;">
                            <h2 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; letter-spacing: -0.5px;">Parabéns! Seu projeto foi aprovado 🚀</h2>
                            <p style="color: #94a3b8; font-size: 15px; margin-bottom: 24px;">Olá, <strong>${contato.nome}</strong>! Nossa equipe analisou suas especificações e a sua proposta foi montada e ativada no sistema.</p>
                            
                            <!-- Proposta / Detalhes do Projeto -->
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-bottom: 12px;">Detalhes do Projeto</div>
                                <div style="margin-bottom: 8px; font-size: 14px;"><strong style="color: #94a3b8;">Projeto:</strong> <span style="color: #f1f5f9; font-weight: 600;">${nomeFinalProjeto}</span></div>
                                <div style="margin-bottom: 8px; font-size: 14px;"><strong style="color: #94a3b8;">Investimento Total:</strong> <span style="color: #818cf8; font-weight: bold;">R$ ${vTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                <div style="font-size: 14px;"><strong style="color: #94a3b8;">Condição:</strong> <span style="color: #f1f5f9;">Entrada de R$ ${vEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + R$ ${vFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} na entrega.</span></div>
                            </div>

                            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">Para iniciar, acesse seu painel do cliente para assinar o contrato digital e realizar o pagamento da entrada:</p>
                            
                            <!-- Acesso Box -->
                            <div style="background: rgba(79, 70, 229, 0.1); border: 1px dashed rgba(79, 70, 229, 0.4); border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
                                <div style="font-size: 13px; color: #a5b4fc; font-weight: 600; margin-bottom: 10px;">Suas Credenciais de Acesso:</div>
                                <div style="font-size: 14px; color: #94a3b8; margin-bottom: 6px;">E-mail: <strong style="color: #ffffff;">${contato.email}</strong></div>
                                <div style="font-size: 14px; color: #94a3b8;">Senha Temporária: <strong style="color: #ffffff;">${senhaTemporaria}</strong></div>
                            </div>

                            <!-- Button CTA -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <a href="http://localhost:5173/login" style="background: linear-gradient(to right, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 700; font-size: 14px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); transition: transform 0.2s;">Acessar Painel do Cliente</a>
                            </div>
                            
                            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">Por motivos de segurança, altere sua senha após o primeiro acesso.</p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background: rgba(0,0,0,0.2); padding: 24px; border-top: 1px solid rgba(255,255,255,0.04); text-align: center; font-size: 12px; color: #475569;">
                            Este é um e-mail automático. Dúvidas? Fale com nosso suporte pelo WhatsApp: (47) 99999-0000<br/>
                            © 2026 Dott System. Todos os direitos reservados.
                        </div>
                    </div>
                </div>
            `
        });

        // 6. Deleta o contato da tabela para que suma da fila de briefings pendentes do admin
        await prisma.contato.delete({
            where: { id: contatoId }
        });

        res.status(200).json({ message: "Contato aprovado, usuário e projeto criados com sucesso!" });
    } catch (error) {
        console.error("Erro ao aprovar contato:", error);
        res.status(500).json({ message: "Erro ao aprovar contato e gerar onboarding." });
    }
});

// Rota Cliente para simular a assinatura de contrato
app.post("/api/projetos/:id/assinar-contrato", authMiddleware, async (req, res) => {
    const projetoId = parseInt(req.params.id);
    const clienteId = req.usuarioId;
    if (isNaN(projetoId)) {
        return res.status(400).json({ message: "ID do projeto inválido." });
    }
    try {
        const projeto = await prisma.project.findFirst({
            where: { id: projetoId, clienteId: clienteId }
        });
        if (!projeto) {
            return res.status(404).json({ message: "Projeto não encontrado ou não pertence a esta conta." });
        }

        const projetoAtualizado = await prisma.project.update({
            where: { id: projetoId },
            data: { contrato_assinado: true }
        });

        res.status(200).json({ message: "Contrato assinado com sucesso!", projeto: projetoAtualizado });
    } catch (error) {
        console.error("Erro ao assinar contrato:", error);
        res.status(500).json({ message: "Erro ao registrar assinatura." });
    }
});

// Rota Cliente para simular o pagamento de faturas (ex: Pix de entrada) e avançar etapa
app.post("/api/projetos/:id/pagar-fatura/:paymentId", authMiddleware, async (req, res) => {
    const projetoId = parseInt(req.params.id);
    const paymentId = parseInt(req.params.paymentId);
    const clienteId = req.usuarioId;
    if (isNaN(projetoId) || isNaN(paymentId)) {
        return res.status(400).json({ message: "IDs inválidos." });
    }
    try {
        const projeto = await prisma.project.findFirst({
            where: { id: projetoId, clienteId: clienteId }
        });
        if (!projeto) {
            return res.status(404).json({ message: "Projeto não encontrado." });
        }

        // Atualiza a fatura para PAID
        await prisma.payment.update({
            where: { id: paymentId },
            data: { status: "PAID" }
        });

        // Se o contrato já estiver assinado e o projeto estiver em BRIEFING,
        // o pagamento de entrada avança o status do projeto automaticamente para DESIGN
        let etapaAtualizada = projeto.etapa_atual;
        if (projeto.contrato_assinado && projeto.etapa_atual === "BRIEFING") {
            etapaAtualizada = "DESIGN";
            await prisma.project.update({
                where: { id: projetoId },
                data: { etapa_atual: "DESIGN" }
            });
        }

        res.status(200).json({ message: "Fatura paga com sucesso!", etapa: etapaAtualizada });
    } catch (error) {
        console.error("Erro ao pagar fatura:", error);
        res.status(500).json({ message: "Erro ao registrar pagamento." });
    }
});

// Rota Cliente para aprovar o design e liberar desenvolvimento
app.post("/api/projetos/:id/aprovar-design", authMiddleware, async (req, res) => {
    const projetoId = parseInt(req.params.id);
    const clienteId = req.usuarioId;
    if (isNaN(projetoId)) {
        return res.status(400).json({ message: "ID do projeto inválido." });
    }
    try {
        const projeto = await prisma.project.findFirst({
            where: { id: projetoId, clienteId: clienteId }
        });
        if (!projeto) {
            return res.status(404).json({ message: "Projeto não encontrado." });
        }

        // Registra a aprovação do design
        const projetoAtualizado = await prisma.project.update({
            where: { id: projetoId },
            data: {
                designAprovado: true,
                etapa_atual: "DESENVOLVIMENTO" // Avança para Desenvolvimento
            }
        });

        res.status(200).json({ message: "Design aprovado com sucesso! Iniciando desenvolvimento.", projeto: projetoAtualizado });
    } catch (error) {
        console.error("Erro ao aprovar design:", error);
        res.status(500).json({ message: "Erro ao registrar aprovação de design." });
    }
});


// --- ROTAS DO PAINEL DE ADMIN / FUNCIONÁRIOS ---

// Middleware exclusivo para admins e funcionários
function adminMiddleware(req, res, next) {
    if (!req.usuarioRole || (req.usuarioRole !== 'admin' && req.usuarioRole !== 'funcionario')) {
        return res.status(403).json({ message: "Acesso restrito a administradores e funcionários." });
    }
    next();
}

// GET /api/admin/briefings - Lista todos os contatos/briefings recebidos
app.get("/api/admin/briefings", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const briefings = await prisma.contato.findMany({
            orderBy: { criadoEm: 'desc' }
        });
        res.status(200).json({ briefings });
    } catch (error) {
        console.error("Erro ao buscar briefings:", error);
        res.status(500).json({ message: "Erro ao buscar briefings." });
    }
});

// GET /api/admin/projetos - Lista todos os projetos com cliente e responsável
app.get("/api/admin/projetos", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const projetos = await prisma.project.findMany({
            include: {
                cliente: { select: { id: true, nome: true, email: true } },
                responsavel: { select: { id: true, nome: true, email: true } },
                payments: true
            },
            orderBy: { criadoEm: 'desc' }
        });
        res.status(200).json({ projetos });
    } catch (error) {
        console.error("Erro ao buscar projetos:", error);
        res.status(500).json({ message: "Erro ao buscar projetos." });
    }
});

// POST /api/admin/projetos/:id/assumir - Funcionário/admin assume o projeto (limite de 2 projetos ativos)
app.post("/api/admin/projetos/:id/assumir", authMiddleware, adminMiddleware, async (req, res) => {
    const projetoId = parseInt(req.params.id);
    const funcionarioId = req.usuarioId;

    try {
        // Verifica quantos projetos ativos o funcionário já possui
        const projetosAtivos = await prisma.project.count({
            where: {
                responsavelId: funcionarioId,
                NOT: { etapa_atual: 'ENTREGA' }
            }
        });

        if (projetosAtivos >= 2) {
            return res.status(400).json({
                message: "Você atingiu o limite máximo de 2 projetos ativos. Conclua ou transfira um projeto antes de assumir outro."
            });
        }

        const projeto = await prisma.project.update({
            where: { id: projetoId },
            data: { responsavelId: funcionarioId }
        });

        res.status(200).json({ message: "Projeto assumido com sucesso!", projeto });
    } catch (error) {
        console.error("Erro ao assumir projeto:", error);
        res.status(500).json({ message: "Erro ao assumir projeto." });
    }
});

// PUT /api/admin/projetos/:id - Atualiza link do Figma, Trello, Contrato, etapa e prazo do projeto
app.put("/api/admin/projetos/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const projetoId = parseInt(req.params.id);
    const funcionarioId = req.usuarioId;
    const { figma_link, trello_link, contrato_link, etapa_atual, dataEntrega } = req.body;

    try {
        // Somente o responsável ou um admin podem editar o projeto
        const projeto = await prisma.project.findUnique({ where: { id: projetoId } });
        if (!projeto) return res.status(404).json({ message: "Projeto não encontrado." });

        const usuario = await prisma.user.findUnique({ where: { id: funcionarioId } });
        if (projeto.responsavelId !== funcionarioId && usuario.role !== 'admin') {
            return res.status(403).json({ message: "Você não tem permissão para editar este projeto." });
        }

        const dadosAtualizados = {};
        if (figma_link !== undefined) dadosAtualizados.figma_link = figma_link;
        if (trello_link !== undefined) dadosAtualizados.trello_link = trello_link;
        if (contrato_link !== undefined) dadosAtualizados.contrato_link = contrato_link;
        if (etapa_atual !== undefined) dadosAtualizados.etapa_atual = etapa_atual;
        if (dataEntrega !== undefined) dadosAtualizados.dataEntrega = dataEntrega ? new Date(dataEntrega) : null;

        const projetoAtualizado = await prisma.project.update({
            where: { id: projetoId },
            data: dadosAtualizados,
            include: {
                cliente: { select: { nome: true, email: true } },
                responsavel: { select: { nome: true } }
            }
        });

        res.status(200).json({ message: "Projeto atualizado com sucesso!", projeto: projetoAtualizado });
    } catch (error) {
        console.error("Erro ao atualizar projeto:", error);
        res.status(500).json({ message: "Erro ao atualizar projeto." });
    }
});

// CHAT Bot com Assistente Proativo e Memória de Sessão

app.post("/api/chat", async (req, res) => {
    const { mensagemUsuario, sessionId } = req.body;

    if (!mensagemUsuario) {
        return res.status(400).json({ message: "A mensagem não pode estar vazia." });
    }

    try {
        const idSessao = sessionId || "session_dott_default";
        let respostaDaIa = "";

        try {
            respostaDaIa = await enviarMensagemParaLangflow(mensagemUsuario, idSessao);
        } catch (errLangflow) {
            console.log("Langflow indisponível, usando motor de IA local Dott:", errLangflow.message);
        }

        // Se Langflow for repetitivo (ex: só fala "prazer em ajudar" sem dar preço/opções), ou se estiver vazio:
        const ehRepetitivoOuCurto = !respostaDaIa || respostaDaIa.length < 30 || (respostaDaIa.includes("prazer") && !respostaDaIa.includes("R$") && !respostaDaIa.includes("criar-projeto"));

        if (ehRepetitivoOuCurto) {
            respostaDaIa = processarRespostaInteligenteDott(mensagemUsuario, respostaDaIa);
        }

        res.status(200).json({ resposta: respostaDaIa });
    } catch (error) {
        console.error("Erro no chat:", error);
        res.status(200).json({ resposta: processarRespostaInteligenteDott(mensagemUsuario, "") });
    }
});

async function enviarMensagemParaLangflow(mensagemUsuario, sessionId) {
    const url = "http://localhost:7860/api/v1/run/6e203c0f-fbd9-47a7-980f-0923c09c95ae";
    const idSessao = sessionId || crypto.randomUUID();

    const payload = {
        output_type: "chat",
        input_type: "chat",
        input_value: mensagemUsuario,
        session_id: idSessao
    };

    const headers = {
        "Content-Type": "application/json"
    };
    if (process.env.LANGFLOW_API_KEY) {
        headers["x-api-key"] = process.env.LANGFLOW_API_KEY;
    }

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();
    return data.outputs[0].outputs[0].results.message.text;
}

function processarRespostaInteligenteDott(mensagemUsuario, respostaBase) {
    const msg = mensagemUsuario.toLowerCase();

    // 1. Petshop ou negócios específicos
    if (msg.includes("petshop") || msg.includes("pet shop") || msg.includes("pet")) {
        return "Com certeza! Para o seu **Petshop**, desenvolvemos soluções completas focadas em captação de clientes e agendamentos:\n\n" +
            "🐶 **Recursos ideais para Petshop:**\n" +
            "• Catálogo de serviços (Banho, Tosa, Clínica Veterinária)\n" +
            "• Botão de Agendamento direto no WhatsApp\n" +
            "• Vitrine de rações e acessórios\n" +
            "• Fotos, localização e depoimentos de clientes\n\n" +
            "💰 **Opções de Investimento:**\n" +
            "• **Landing Page Express:** R$ 890 (Entrega em 5-7 dias, foco em agendamentos no WhatsApp)\n" +
            "• **Site Institucional:** R$ 2.490 (Entrega em 10-15 dias, até 6 páginas com serviços e fotos)\n" +
            "• **Loja Virtual / E-commerce:** R$ 7.990 (Entrega em 30-40 dias, catálogo e vendas online)\n\n" +
            "Quer iniciar a proposta para o seu Petshop agora mesmo? Clique em [Criar Proposta de Projeto](/criar-projeto)!";
    }

    // 2. Preço / Orçamento / Quanto custa
    if (msg.includes("custa") || msg.includes("preço") || msg.includes("preco") || msg.includes("valor") || msg.includes("orçamento") || msg.includes("orcamento") || msg.includes("quanto")) {
        return "Nossos valores na **Dott System** são transparentes e se adaptam ao tamanho do seu negócio:\n\n" +
            "🚀 **Landing Page:** R$ 890 (Entrega em 5 a 7 dias)\n" +
            "🌐 **Site Institucional:** R$ 2.490 (Entrega em 10 a 15 dias - até 6 páginas)\n" +
            "⭐ **Site Institucional Premium:** R$ 4.990 (Entrega em 20 a 25 dias - até 12 páginas)\n" +
            "🛒 **E-commerce Completo:** R$ 7.990 (Entrega em 30 a 40 dias)\n" +
            "📱 **Aplicativo Mobile MVP:** R$ 6.990 (Entrega em 20 a 30 dias)\n\n" +
            "💳 *Pagamento via Pix, Boleto ou Cartão em até 12x.*\n\n" +
            "Você pode simular e montar os requisitos do seu projeto agora em [Criar Proposta](/criar-projeto)!";
    }

    // 3. Etapas / Prazos / Como funciona
    if (msg.includes("funciona") || msg.includes("prazo") || msg.includes("etapa") || msg.includes("demora") || msg.includes("passo")) {
        return "Nosso processo de desenvolvimento é 100% transparente e estruturado em 5 etapas principais:\n\n" +
            "1️⃣ **Briefing:** Entendemos suas ideias e requisitos.\n" +
            "2️⃣ **Design no Figma:** Criamos a prévia visual interativa do seu site.\n" +
            "3️⃣ **Programação:** Desenvolvemos o sistema com tecnologia moderna e rápida.\n" +
            "4️⃣ **Testes & Homologação:** Você aprova todas as telas e ajustes.\n" +
            "5️⃣ **Lançamento:** Publicamos seu site na nuvem com suporte contínuo.\n\n" +
            "Gostaria de dar o primeiro passo? Monte seu briefing em [Criar Proposta de Projeto](/criar-projeto)!";
    }

    // 4. Se a resposta da IA for aceitável mas sem CTA, adicionar o CTA
    if (respostaBase && respostaBase.length > 20) {
        return respostaBase + "\n\nSe quiser dar andamento, você pode criar uma proposta direto em [Criar Proposta de Projeto](/criar-projeto).";
    }

    // 5. Fallback padrão proativo
    return "Olá! Sou o assistente virtual da **Dott System**. Desenvolvemos sites institucionais, landing pages, e-commerces e aplicativos sob medida para o seu negócio.\n\n" +
        "Como posso ajudar você hoje? Você pode me perguntar sobre **preços**, **prazos** ou me contar qual é o seu ramo (ex: Petshop, Restaurante, Advocacia, Loja Virtual)!\n\n" +
        "Se preferir, você também pode montar a proposta do seu projeto diretamente em [Criar Proposta](/criar-projeto).";
}

// ==========================================
// CHAT BOT MESTRE DAS ALIANÇAS (Langflow Dedicado)
// ==========================================

app.post("/api/chat-mestre", async (req, res) => {
    const { mensagemUsuario, sessionId, historico } = req.body;

    if (!mensagemUsuario) {
        return res.status(400).json({ message: "A mensagem não pode estar vazia." });
    }

    try {
        const msgLower = (mensagemUsuario || "").toLowerCase();

        // 0. VERIFICAÇÃO PRIORITÁRIA ABSOLUTA: Pedido de Atendente Humano / WhatsApp / Zap / Pessoa
        const termosHumano = ["pessoa", "humano", "atendente", "whatsapp", "whats", "zap", "wats", "vendedor", "suporte", "falar", "faar", "alguem", "alguém", "contato", "atendimento", "conversar", "ligar"];
        const querHumano = termosHumano.some(t => msgLower.includes(t));

        if (querHumano) {
            return res.status(200).json({
                resposta: "💬 **Certamente! Nosso atendimento humano está à disposição.**\n\n" +
                    "⏰ **Horário de Atendimento:**\n" +
                    "• **Segunda a Sexta:** 09h às 18h\n" +
                    "• **Sábado:** 09h às 13h\n\n" +
                    "Clique no link abaixo para conversar diretamente com nossa equipe no WhatsApp:\n\n" +
                    "👉 [Falar no WhatsApp (81 98840-4020)](https://api.whatsapp.com/send?phone=5581988404020&text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20falar%20com%20um%20atendente)"
            });
        }

        const idSessao = sessionId || "session_mestre_default";
        let respostaDaIa = "";

        // 1. Tentar Groq Llama 3 (Nuvem Gratuita)
        if (process.env.GROQ_API_KEY) {
            try {
                respostaDaIa = await enviarMensagemParaGroqLlama(mensagemUsuario, historico);
            } catch (errGroq) {
                console.log("Groq Llama 3 indisponível:", errGroq.message);
            }
        }

        // 2. Se Groq falhou, tentar Gemini API
        if ((!respostaDaIa || respostaDaIa.length < 10) && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
            try {
                respostaDaIa = await enviarMensagemParaGeminiMestre(mensagemUsuario, historico);
            } catch (errGemini) {
                console.log("Gemini API Mestre indisponível:", errGemini.message);
            }
        }

        // 3. Tentar Langflow
        if (!respostaDaIa || respostaDaIa.length < 10) {
            try {
                respostaDaIa = await enviarMensagemParaLangflowMestre(mensagemUsuario, idSessao);
            } catch (errLangflow) {
                console.log("Langflow Mestre offline/indisponível:", errLangflow.message);
            }
        }

        // Filtro de Segurança Reforçado
        const respLower = (respostaDaIa || "").toLowerCase();
        const termosProibidos = ["negócio", "negocio", "parceria", "boné", "bone", "peito", "costas", "dst", "pes", "tecido", "matriz", "bordad", "bastidor", "agulha", "encomenda", "encomendas", "almofada", "almofadas", "desenho", "aplicação pretendida", "[inserir localização]"];
        const temInvasaoEstranha = termosProibidos.some(t => respLower.includes(t));

        if (!respostaDaIa || respostaDaIa.length < 10 || temInvasaoEstranha) {
            respostaDaIa = processarRespostaInteligenteMestre(mensagemUsuario);
        }

        res.status(200).json({ resposta: respostaDaIa });
    } catch (error) {
        console.error("Erro no chat Mestre das Alianças:", error);
        res.status(200).json({ resposta: processarRespostaInteligenteMestre(mensagemUsuario) });
    }
});

async function enviarMensagemParaOllamaLlama(mensagemUsuario, historico = []) {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
    const model = process.env.OLLAMA_MODEL || "llama3";

    const systemInstruction = `Você é o Consultor Oficial Especialista em Joias da Mestre das Alianças (Recife - PE).
Sua missão é atender os clientes com cordialidade e precisão sobre alianças de Prata 950 (Compromisso/Namoro, a partir de R$ 199) e Ouro 18k / 10k (Noivado/Casamento, a partir de R$ 1.290).
Gravação interna de nomes e datas é 100% gratuita. Lojas físicas em Recife: Boa Viagem e Santo Antônio.
NUNCA invente materiais que não vendemos (como prata sterling, prata oxidada ou ouro 24k).`;

    const messages = [
        { role: "system", content: systemInstruction }
    ];

    if (Array.isArray(historico)) {
        historico.forEach(item => {
            if (item.texto && typeof item.texto === 'string') {
                messages.push({
                    role: item.autor === 'usuario' ? 'user' : 'assistant',
                    content: item.texto
                });
            }
        });
    }

    messages.push({ role: "user", content: mensagemUsuario });

    const payload = {
        model: model,
        messages: messages,
        stream: false
    };

    const response = await fetch(ollamaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();
    return data.message?.content || null;
}

async function enviarMensagemParaGroqLlama(mensagemUsuario, historico = []) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;

    const url = "https://api.groq.com/openai/v1/chat/completions";
    const model = process.env.GROQ_MODEL || "llama3-8b-8192";

    const systemInstruction = `Você é o Consultor Oficial Especialista da Mestre das Alianças (Recife - PE).
Sua missão é dar suporte rápido, responder dúvidas de clientes e recomendar nossos produtos e coleções do site.

--- REGRAS DE OURO ---
1. FOCO EXCLUSIVO NA LOJA (RECUSAR PERGUNTAS GERAIS): NUNCA responda perguntas de conhecimentos gerais, geografia (ex: capital do Brasil), política, futebol, receitas ou curiosidades fora do tema. Se o cliente fizer uma pergunta aleatória, responda educadamente: "Sou o assistente virtual exclusivo da **Mestre das Alianças**! Meu foco é tirar dúvidas sobre nossas alianças de Prata 950 e Ouro 18k/10k. Como posso te ajudar a escolher a joia perfeita hoje?"
2. RESPOSTAS DIRETAS: Seja objetivo e atencioso (máximo 2 a 3 parágrafos). NUNCA faça questionários compridos.
3. NUNCA FAÇA SIMULAÇÃO DE PEDIDO FAKE: NUNCA peça endereço, rua, número, CEP, bairro ou dados pessoais do cliente.
4. LINKS DE CATÁLOGO:
   • Coleção de Prata 950 (Namoro/Compromisso, a partir de R$ 199): [Ver Coleção Prata 950](https://mestredasaliancas.com.br/prata.html)
   • Coleção de Ouro 18k / 10k (Noivado/Casamento, a partir de R$ 1.290): [Ver Coleção de Ouro](https://mestredasaliancas.com.br/ouro.html)
5. DIREIONAMENTO PARA O WHATSAPP DE VENDAS:
   • Quando o cliente quiser fechar pedido, encomendar modelo ou falar com atendente, envie IMEDIATAMENTE o link direto do WhatsApp Humano:
     👉 [Atendimento no WhatsApp (81 98840-4020)](https://api.whatsapp.com/send?phone=5581988404020&text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20atendimento)

--- DADOS IMPORTANTES DE SUPORTE ---
• Gravação Interna de nomes e datas é 100% GRATUITA.
• Garantia Eterna na autenticidade do metal (Prata 950, Ouro 18k e Ouro 10k).
• Acabamento Anatômico super confortável.
• Lojas Físicas em Recife: Boa Viagem (Av. Conselheiro Aguiar, 2333) e Santo Antônio (Rua Camboa Do Carmo, 123).`;

    const messages = [
        { role: "system", content: systemInstruction }
    ];

    if (Array.isArray(historico)) {
        historico.forEach(item => {
            if (item.texto && typeof item.texto === 'string') {
                messages.push({
                    role: item.autor === 'usuario' ? 'user' : 'assistant',
                    content: item.texto
                });
            }
        });
    }

    messages.push({ role: "user", content: mensagemUsuario });

    const payload = {
        model: model,
        messages: messages,
        temperature: 0.7
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
}

async function enviarMensagemParaGeminiMestre(mensagemUsuario, historico = []) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `Você é o Consultor Oficial Especialista em Joias da Mestre das Alianças (Recife - PE).
Sua missão é dar suporte rápido, tirar dúvidas sobre nossas alianças de Prata 950 e Ouro 18k/10k, e direcionar o cliente para o nosso catálogo no site ou para o WhatsApp de Atendimento.

--- REGRAS DE ATENDIMENTO E VENDAS ---
1. RESPOSTAS DIRETAS E OBJETIVAS: Responda a dúvida do cliente em poucas frases (máximo 2 a 3 parágrafos) de forma acolhedora, elegante e clara.
2. NUNCA FAÇA QUESTIONÁRIOS DE COMPRA FAKE:
   • NUNCA peça endereço, rua, número, CEP, bairro, fonte de letra ou dados pessoais para simular formulário de compra ou entrega.
   • Faça no máximo 1 pergunta por resposta.
3. MOSTRE OS LINKS DO CATÁLOGO DO SITE:
   • Coleção de Prata 950 (Namoro/Compromisso, a partir de R$ 199): [Ver Coleção Prata 950](https://mestredasaliancas.com.br/prata.html)
   • Coleção de Ouro 18k / 10k (Noivado/Casamento, a partir de R$ 1.290): [Ver Coleção de Ouro](https://mestredasaliancas.com.br/ouro.html)
4. DIREIONAMENTO PARA O WHATSAPP:
   • Quando o cliente quiser encomendar, fechar um pedido, passar nomes/datas para gravação ou pedir orçamento sob medida, forneça IMEDIATAMENTE o link direto do WhatsApp Humano:
     👉 [Atendimento VIP no WhatsApp](https://api.whatsapp.com/send?phone=5581999999999&text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20atendimento%20para%20escolher%20minhas%20alian%C3%A7as)

--- INFORMAÇÕES DE SUPORTE ---
• Gravação Interna de nomes e datas: 100% GRATUITA em todas as alianças.
• Garantia: Eterna na autenticidade do metal (Prata 950, Ouro 18k e Ouro 10k).
• Conforto: Acabamento Anatômico curva interna para uso diário.
• Lojas Físicas em Recife - PE:
  - Boa Viagem: Av. Conselheiro Aguiar, 2333 (Empresarial João Roma, Loja 11 - Térreo)
  - Santo Antônio: Rua Camboa Do Carmo, 123 (Próximo à Igreja do Carmo)`;

    const contents = [
        {
            role: "user",
            parts: [{ text: systemInstruction }]
        },
        {
            role: "model",
            parts: [{ text: "Entendido! Sou o assistente especialista da Mestre das Alianças. Seguirei todas as regras e manterei o contexto da conversa." }]
        }
    ];

    // Adiciona o histórico recente de conversas para manter o contexto
    if (Array.isArray(historico)) {
        historico.forEach(item => {
            if (item.texto && typeof item.texto === 'string') {
                contents.push({
                    role: item.autor === 'usuario' ? 'user' : 'model',
                    parts: [{ text: item.texto }]
                });
            }
        });
    }

    // Adiciona a mensagem atual
    contents.push({
        role: "user",
        parts: [{ text: mensagemUsuario }]
    });

    const payload = { contents };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return texto || null;
}

async function enviarMensagemParaLangflowMestre(mensagemUsuario, sessionId) {
    // Endpoint fornecido pelo usuário no Langflow para a Mestre das Alianças
    const url = process.env.LANGFLOW_MESTRE_URL || "http://localhost:7860/api/v1/run/89e42945-3b76-4636-a80d-604703a98be8";

    const payload = {
        output_type: "chat",
        input_type: "chat",
        input_value: mensagemUsuario,
        session_id: sessionId
    };

    const headers = { "Content-Type": "application/json" };
    if (process.env.LANGFLOW_API_KEY) {
        headers["x-api-key"] = process.env.LANGFLOW_API_KEY;
    }

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();
    return data.outputs[0].outputs[0].results.message.text;
}

function processarRespostaInteligenteMestre(mensagemUsuario) {
    const msg = mensagemUsuario.toLowerCase();

    // Tratamento para "desisto" ou "calma"
    if (msg.includes("desisto") || msg.includes("calma")) {
        return "Não desista! Estou aqui 100% focado em ajudar você a escolher a aliança perfeita da **Mestre das Alianças**! 💍\n\nNossos principais modelos:\n• **Ouro 18k (750)** — Ouro Nobre com garantia eterna\n• **Ouro 10k (416)** — Ouro legítimo com excelente custo-benefício\n• **Prata 950** — Prata de lei de alto brilho\n\nTodas acompanham **gravação grátis** e **garantia eterna**!\n\nQual modelo ou ocasião você gostaria de ver agora?";
    }

    // 1. ESPECÍFICO: Prata 950 (verificar PRIMEIRO se o usuário pediu prata)
    if (msg.includes("prata") || msg.includes("950")) {
        return "💎 **Excelente escolha! Nossas Alianças de Prata 950 são perfeitas para Compromisso e Namoro!**\n\n" +
            "Nossas peças são confeccionadas em **Prata 950 Legítima** de máxima pureza, com brilho espelhado e altíssima durabilidade.\n\n" +
            "✨ **Diferenciais incluídos:**\n" +
            "• ✏️ **Gravação Grátis** de nomes e datas no interior de todas as peças\n" +
            "• 🛡️ **Garantia Eterna** do metal\n" +
            "• ☁️ Opção de **Acabamento Anatômico** (extremo conforto no uso diário)\n" +
            "• 💰 Pares de Prata a partir de **R$ 199,00**!\n\n" +
            "🎨 **Estilos:** Clássicas (lisas), Trabalhadas (frisos e chanfros), Simples ou Detalhadas (com zircônias).\n\n" +
            "🔗 Acesse nossa coleção de Prata completa em: [Ver Alianças de Prata 950](https://mestredasaliancas.com.br/prata.html)\n\n" +
            "Gostaria de ver algum modelo em específico (Clássica, Trabalhada ou com Pedras)?";
    }

    // 2. ESPECÍFICO: Ouro 18k e 10k (verificar se o usuário pediu ouro)
    if (msg.includes("ouro") || msg.includes("18k") || msg.includes("10k")) {
        return "✨ **As Alianças em Ouro são perfeitas para Noivado e Casamento!**\n\n" +
            "• **Ouro 18k (750):** Ouro Nobre certificado com brilho impecável e garantia eterna do metal para a vida toda.\n" +
            "• **Ouro 10k (416):** Ouro legítimo de altíssima resistência com excelente custo-benefício.\n\n" +
            "✨ **Diferenciais inclusos:**\n" +
            "• ✏️ **Gravação Grátis** de nomes e datas\n" +
            "• 🛡️ **Garantia Eterna** do metal\n" +
            "• ☁️ **Acabamento Anatômico** confort super ajustável no dedo\n\n" +
            "🔗 Veja nossa coleção completa de Ouro em: [Ver Alianças de Ouro](https://mestredasaliancas.com.br/ouro.html)\n\n" +
            "Você prefere Ouro 18k ou Ouro 10k?";
    }

    // 3. ESPECÍFICO: Endereços e Lojas Físicas
    if (msg.includes("onde") || msg.includes("endereço") || msg.includes("endereco") || msg.includes("loja") || msg.includes("fica") || msg.includes("recife") || msg.includes("boa viagem") || msg.includes("santo antônio") || msg.includes("santo antonio")) {
        return "📍 **Nossas Lojas Físicas em Recife - PE:**\n\n" +
            "🏢 **Unidade 1 - Boa Viagem:**\n" +
            "Av. Conselheiro Aguiar, 2333 - Boa Viagem (Empresarial João Roma, Loja 11 - Térreo)\n" +
            "⏰ *Horários:* Seg a Sex: 09:00 às 17:00 | Sáb: 09:00 às 13:00\n\n" +
            "🏢 **Unidade 2 - Santo Antônio:**\n" +
            "Rua Camboa Do Carmo, 123 - Santo Antônio (Próx. à Igreja do Carmo, em frente à Beto Ótica)\n" +
            "⏰ *Horários:* Seg a Sex: 09:00 às 17:00 | Sáb: 09:00 às 14:00\n\n" +
            "🇧🇷 *Enviamos com frete seguro para todo o Brasil!* Ou acesse nosso catálogo online em [Mestre das Alianças](https://mestredasaliancas.com.br/index.html)";
    }

    // 4. ESPECÍFICO: Horários de Funcionamento
    if (msg.includes("horario") || msg.includes("horário") || msg.includes("abre") || msg.includes("fecha") || msg.includes("sábado") || msg.includes("sabado")) {
        return "⏰ **Horários de Atendimento:**\n\n" +
            "• **Boa Viagem:** Seg a Sex das 09:00 às 17:00 | Sábados das 09:00 às 13:00\n" +
            "• **Santo Antônio:** Seg a Sex das 09:00 às 17:00 | Sábados das 09:00 às 14:00\n" +
            "• *Domingos e Feriados:* Fechado (Atendimento online 24h em nosso site)\n\n" +
            "Acesse [Mestre das Alianças](https://mestredasaliancas.com.br/index.html)";
    }

    // 5. ESPECÍFICO: Valores e Preços
    if (msg.includes("preço") || msg.includes("quanto") || msg.includes("valor") || msg.includes("custo")) {
        return "✨ Na **Mestre das Alianças** temos opções para todos os orçamentos:\n\n" +
            "• 💎 **Par de Alianças em Prata 950:** A partir de **R$ 199,00**\n" +
            "• ✨ **Par de Alianças em Ouro:** A partir de **R$ 1.290,00**\n\n" +
            "💳 Parcelamos em até 12x sem juros no cartão ou com desconto especial no Pix!\n\n" +
            "• Catálogo de Prata: [Ver Prata 950](https://mestredasaliancas.com.br/prata.html)\n" +
            "• Catálogo de Ouro: [Ver Ouro 18k / 10k](https://mestredasaliancas.com.br/ouro.html)";
    }

    // 6. ESPECÍFICO: Gravação, Garantia e Anatômico
    if (msg.includes("grava") || msg.includes("nome") || msg.includes("garantia") || msg.includes("anatômico") || msg.includes("anatomico")) {
        return "✨ **Diferenciais Exclusivos Mestre das Alianças:**\n\n" +
            "• ✏️ **Gravação Grátis:** Nomes e datas gravados internamente sem custo adicional em todas as alianças.\n" +
            "Trabalhamos com **Ouro 18k (750)** e **Ouro 10k (416)** com acabamento anatômico e gravação interna gratuita.\n\n" +
            "🔗 Acesse nosso catálogo completo de ouro em: [Ver Coleção de Ouro](https://mestredasaliancas.com.br/ouro.html)\n\n" +
            "💬 Para encomendar ou falar com nosso consultor no WhatsApp:\n" +
            "👉 [Falar no WhatsApp (81 98840-4020)](https://api.whatsapp.com/send?phone=5581988404020&text=Ol%C3%A1!%20Gostaria%20de%20ver%20alian%C3%A7as%20de%20ouro)";
    }

    return "👑 **Mestre das Alianças - Atendimento ao Cliente**\n\n" +
        "Estou aqui para ajudar a escolher suas alianças de **Ouro 18k, 10k e Prata 950**!\n\n" +
        "⏰ **Horários:** Seg a Sex (09h às 18h) | Sáb (09h às 13h)\n" +
        "• 💎 **Coleção Prata 950:** [Ver Prata 950](https://mestredasaliancas.com.br/prata.html)\n" +
        "• ✨ **Coleção Ouro:** [Ver Ouro](https://mestredasaliancas.com.br/ouro.html)\n" +
        "• 📍 **Lojas Físicas:** Boa Viagem e Santo Antônio (Recife - PE)\n" +
        "• 💬 **WhatsApp de Vendas:** [Falar com Consultor](https://api.whatsapp.com/send?phone=5581999999999&text=Ol%C3%A1!%20Gostaria%20de%20atendimento)";
}

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));