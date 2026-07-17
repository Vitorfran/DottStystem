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
app.use(express.json());



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


app.post("/api/contato", async (req,res) => {
    // pegar dados com o fecth do Front ( papel do cliente )

    const { nome, email, mensagem } = req.body;


    if(!nome || !email || !mensagem) {
        return res.status(400).json({message: "Todos os campos são obrigatórios!"});
    }

    console.log("Validação passou! Dados:", nome, email, mensagem);



    // salvar no banco usando o prisma ORM 
    const novoContato = await prisma.contato.create({
     data: {
        nome: nome,
        email: email,
        mensagem: mensagem
    }
});




    console.log("Contato salvo no banco de dados:", novoContato);


    console.log ("Enviando email para o administrador do site...");

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
        
    res.status(200).json({message: "Mensagem recebida com sucesso!"});
});


// Cadastro/ Login 

app.post("/api/auth/register" , async(req,res) =>{

    try{
        const {nome, email, senha, role} = req.body; // para pegar do front 
        
        if(!nome || !email || !senha) {
            return res.status(400).json({message: "Todos os campos são obrigatórios!"}); // verifica para ver se nao está vazio 
        }

        // Verificar se tem ususario existente 
        const usuarioExistente = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(usuarioExistente){
            return res.status(400).json({message: "Usuario ja cadastrado!"});
        }




        // Criar Usuario 


        // hash da senha 

        const hashSenha = await bcrypt.hash(senha, 10);
        const novoUsuario = await prisma.user.create({
            data: {
                nome: nome,
                email: email,
                senha: hashSenha,
                role: role || "cliente"
            }
        }); 

        res.status(200).json({message: "Usuario cadastrado com sucesso!"});
    }
    catch(error){
        console.error("Erro ao cadastrar usuario:", error);
        res.status(500).json({message: "Erro ao cadastrar usuario."});
    }    





});


app.post("/api/auth/login" , async(req,res)=>{
    try {
        const {email,senha} = req.body;

        if(!email || !senha) {
            return res.status(400).json({message: "Todos os campos são obrigatórios!"});
        }

        const usuario = await prisma.user.findUnique({ //Verifica no banco de dados 
            where: {
                email: email
            }
        });

        const hashSenha = usuario ? await bcrypt.compare(senha, usuario.senha) : false;
        if(!hashSenha || !usuario){
            return res.status(500).json({message: "Email ou Senha invalidos!"});
        }


        // Criar JWT


        const token = jwt.sign(
            {
                id: usuario.id,
                role: usuario.role
            },
            process.env.JWT_SECRET, // A sua "chave secreta" definida no .env
            { expiresIn: "1h" } // O token expira em 1 hora
        );

        // Mandar de volta para o React usar 
        res.status(200).json({message: "Login realizado com sucesso!", token, role: usuario.role});


    } catch (error) {
        res.status(500).json({message: "Erro ao fazer login."});
    }
});


// Listar Projetos usando o middleware


app.get("/api/projetos", authMiddleware, async (req,res) => {

    try {
        const clienteId = req.usuarioId; 



        const projeto = await prisma.project.findFirst({
            where: {
                clienteId: clienteId
            },
            include: {
                payments: true // Inclui os pagamentos do projeto
            }        
        });
        
        if(!projeto){
            return res.status(404).json({message: "Projeto nao encontrado!"});
        }


        res.status(200).json({projeto: projeto});
    } catch (error) {
        res.status(500).json({message: "Erro ao buscar projeto."});
    }



});

// CHAT Bot 

app.post("/api/chat", async (req, res) => {
    const { mensagemUsuario } = req.body;

    if (!mensagemUsuario) {
        return res.status(400).json({message: "A mensagem não pode estar vazia."});
    }

    try {
        // A função isolada é chamada aqui!
        const respostaDaIa = await enviarMensagemParaLangflow(mensagemUsuario);
        
        // Devolvemos o texto da IA para o React desenhar na tela
        res.status(200).json({ resposta: respostaDaIa });
    } catch (error) {
        console.error("Erro no chat:", error);
        res.status(500).json({ error: "Erro ao processar mensagem na IA." });
    }
});

// Função modular fica "solta" no arquivo, fora das rotas, para organizar
async function enviarMensagemParaLangflow(mensagemUsuario) {
    const url = "http://localhost:7860/api/v1/run/6e203c0f-fbd9-47a7-980f-0923c09c95ae";
    const sessionId = crypto.randomUUID();
    
    const payload = {
        output_type: "chat",
        input_type: "chat",
        input_value: mensagemUsuario,
        session_id: sessionId
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

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));