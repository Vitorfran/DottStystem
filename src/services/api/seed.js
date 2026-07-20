import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando semeadura do banco de dados...");

  // Limpa tabelas para evitar duplicados
  await prisma.payment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.contato.deleteMany();

  const hashSenha = await bcrypt.hash("dott123", 10);

  // 1. Cria usuário Admin
  const admin = await prisma.user.create({
    data: {
      nome: "Dott Administrador",
      email: "admin@dott.com",
      senha: hashSenha,
      role: "admin",
      emailVerificado: true
    }
  });
  console.log("Admin criado: admin@dott.com / password: dott123");

  // 2. Cria usuário Cliente
  const cliente = await prisma.user.create({
    data: {
      nome: "Francisco Tavares",
      email: "cliente@dott.com",
      senha: hashSenha,
      role: "cliente",
      emailVerificado: true
    }
  });
  console.log("Cliente criado: cliente@dott.com / password: dott123");

  // 2b. Cria usuário Cliente - Mestre das Alianças
  const clienteMestre = await prisma.user.create({
    data: {
      nome: "Mestre das Alianças",
      email: "contato@mestredasaliancas.com.br",
      senha: hashSenha,
      role: "cliente",
      emailVerificado: true
    }
  });
  console.log("Cliente Mestre das Alianças criado: contato@mestredasaliancas.com.br / password: dott123");

  // 2c. Cria usuário Cliente - Meu Boné Bordado
  const clienteMeuBone = await prisma.user.create({
    data: {
      nome: "Meu Boné Bordado",
      email: "contato@meubonebordado.com.br",
      senha: hashSenha,
      role: "cliente",
      emailVerificado: true
    }
  });
  console.log("Cliente Meu Boné Bordado criado: contato@meubonebordado.com.br / password: dott123");

  // 3. Cria Projeto Francisco
  const projeto = await prisma.project.create({
    data: {
      nome: "E-commerce Premium Francisco",
      mensagem: "Desenvolvimento de uma loja virtual robusta com catálogo de produtos, carrinho de compras, checkout transparente, cálculo de frete automático e painel administrativo de vendas integrado.",
      etapa_atual: "DESENVOLVIMENTO",
      figma_link: "https://figma.com/file/dott-mock-preview-figma",
      trello_link: "https://trello.com/b/dott-mock-preview-trello",
      contrato_link: "https://zapsign.com.br/sign/dott-system-contrato-modelo",
      contrato_assinado: true,
      designAprovado: true,
      dataEntrega: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de hoje
      clienteId: cliente.id,
      responsavelId: admin.id
    }
  });

  // 3b. Cria Projeto Mestre das Alianças
  const projetoMestre = await prisma.project.create({
    data: {
      nome: "Mestre das Alianças - Portal E-commerce",
      mensagem: "Plataforma e-commerce e Landing Page de alta conversão para Alianças de Ouro 18k e Prata 950 com gravação gratuita, garantia eterna e entrega nacional.",
      etapa_atual: "ENTREGA",
      figma_link: "https://figma.com/file/mestre-das-aliancas-figma",
      trello_link: "https://trello.com/b/mestre-das-aliancas-trello",
      contrato_link: "https://zapsign.com.br/sign/mestre-das-aliancas-contrato",
      contrato_assinado: true,
      designAprovado: true,
      dataEntrega: new Date(),
      clienteId: clienteMestre.id,
      responsavelId: admin.id
    }
  });

  // 2d. Cria usuário Cliente - Dott. Odontologia
  const clienteOdonto = await prisma.user.create({
    data: {
      nome: "Dott. Odontologia",
      email: "contato@dottodontologia.com.br",
      senha: hashSenha,
      role: "cliente",
      emailVerificado: true
    }
  });
  console.log("Cliente Dott. Odontologia criado: contato@dottodontologia.com.br / password: dott123");

  // 3c. Cria Projeto Meu Boné Bordado
  const projetoMeuBone = await prisma.project.create({
    data: {
      nome: "Meu Boné Bordado - E-Commerce & Customizador 3D/2D",
      mensagem: "Plataforma e-commerce e simulador de bordados em tempo real. Permite criação de bonés personalizados com orçamento automático de matrizes de pontos e editor interativo.",
      etapa_atual: "ENTREGA",
      figma_link: "https://figma.com/file/meu-bone-bordado-figma",
      trello_link: "https://trello.com/b/meu-bone-bordado-trello",
      contrato_link: "https://zapsign.com.br/sign/meu-bone-bordado-contrato",
      contrato_assinado: true,
      designAprovado: true,
      dataEntrega: new Date(),
      clienteId: clienteMeuBone.id,
      responsavelId: admin.id
    }
  });

  // 3d. Cria Projeto Dott. Odontologia
  const projetoOdonto = await prisma.project.create({
    data: {
      nome: "Dott. Odontologia - Portal & Agendamento Online",
      mensagem: "Plataforma institucional e sistema de agendamento de consultas para clínica odontológica de alta especialização com integração ao WhatsApp.",
      etapa_atual: "ENTREGA",
      figma_link: "https://figma.com/file/dott-odontologia-figma",
      trello_link: "https://trello.com/b/dott-odontologia-trello",
      contrato_link: "https://zapsign.com.br/sign/dott-odontologia-contrato",
      contrato_assinado: true,
      designAprovado: true,
      dataEntrega: new Date(),
      clienteId: clienteOdonto.id,
      responsavelId: admin.id
    }
  });
  console.log("Projetos criados com sucesso!");

  // 4. Cria Faturas
  // Fatura 1: Entrada (Paga)
  await prisma.payment.create({
    data: {
      value: 3000.00,
      status: "PAID",
      method: "PIX",
      projectId: projeto.id,
      pixQrcode: "00020126580014BR.GOV.BCB.PIX0114contato@dott.com52040000530398654063000.005802BR5911Dott System6006Itajai62070503***6304CA42",
      confirmedAt: new Date()
    }
  });

  // Fatura 2: Parcela Final (Pendente)
  await prisma.payment.create({
    data: {
      value: 3000.00,
      status: "PENDING",
      method: "BOLETO",
      projectId: projeto.id
    }
  });
  console.log("Faturas criadas com sucesso!");

  // 5. Cria um Contato de Briefing na fila para demonstração
  await prisma.contato.create({
    data: {
      nome: "Carlos Eduardo",
      email: "carlos@gmail.com",
      mensagem: "Olá Dott, preciso de um site institucional simples com 4 páginas (Home, Quem Somos, Serviços e Contato) para minha clínica odontológica."
    }
  });
  console.log("Contato de demonstração criado!");

  console.log("Semeadura concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro na semeadura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
