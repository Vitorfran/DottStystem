import { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/home.css";
import desktopMockup from "../assets/imagens/desktop_mockup.png";
import mobileMockup from "../assets/imagens/mobile_mockup.png";
import mestreDesktop from "../assets/imagens/mestre_das_aliancas_desktop.png";
import mestreMobile from "../assets/imagens/mestre_das_aliancas_mobile.png";
import mestreLogo from "../assets/imagens/mestre_das_aliancas_logo.jpg";
import meuBoneDesktop from "../assets/imagens/meu_bone_desktop.png";
import meuBoneMobile from "../assets/imagens/meu_bone_mobile.png";
import meuBoneEditorDesktop from "../assets/imagens/meu_bone_editor_desktop.png";
import meuBoneEditorMobile from "../assets/imagens/meu_bone_editor_mobile.png";
import meuBoneLogo from "../assets/imagens/meu_bone_logo.png";
import dottOdontoLogo from "../assets/imagens/dott_odontologia_logo.jpg";
import dottOdontoDesktop from "../assets/imagens/dott_odontologia_desktop.png";
import dottOdontoMobile from "../assets/imagens/dott_odontologia_mobile.png";
import heroVideo from "../assets/Tire_o_get_started_o_fundo_me-ezremove.mp4";
import { motion } from "framer-motion";
import Chatbot from '../components/Chatbot';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

function Home() {
  const navigate = useNavigate();

  // Estado da aba de projeto em destaque
  const [activeProjectTab, setActiveProjectTab] = useState<"mestre" | "meubone" | "odonto">("mestre");
  const [meuBoneSubView, setMeuBoneSubView] = useState<"landing" | "customizer">("landing");

  // Dados do Formulário
  const [dadosFormulario, setDadosFormulario] = useState({
    nome: "",
    email: "",
    mensagem: ""
  });
  
  // Envia o JSON de contato/briefing para a rota do backend
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const resposta = await fetch(`${apiUrl}/api/contato`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosFormulario)
      });
      if (resposta.ok) {
        setDadosFormulario({ nome: "", email: "", mensagem: "" });
        alert("Mensagem recebida com sucesso! A equipe comercial analisará suas especificações.");
      } else {
        alert("Ocorreu um erro ao enviar. Verifique se os dados estão corretos.");
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      alert("Erro de conexão ao enviar.");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDadosFormulario(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Header />

      <main className="home-main">
        {/* Glow Effects */}
        <div className="glow-effect glow-1" />
        <div className="glow-effect glow-2" />

        {/* ==========================================
            HERO SECTION
            ========================================== */}
        <section className="hero-section">
          <motion.video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="hero-bg-video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 1.2 }}
          />

          <div className="hero-video-overlay" />
          <div className="hero-container">
            
            {/* Lado Esquerdo: Textos & CTAs */}
            <div className="hero-text-content">

              {/* Atalho Interativo para Criar Projeto */}
              <motion.button
                onClick={() => navigate("/criar-projeto")}
                className="hero-badge-shortcut"
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <span className="badge-sparkle">✨</span>
                <span>Assistente de Briefing Inteligente Dott IA</span>
                <span className="badge-arrow">➔</span>
              </motion.button>

              <motion.h1
                className="hero-title"
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                Alavanque seu negócio com{" "}
                <span className="text-gradient">soluções digitais inteligentes.</span>
              </motion.h1>

              <motion.p
                className="hero-description"
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                Desenvolvemos sites profissionais de alta performance, e-commerces e sistemas corporativos sob medida para fazer sua empresa crescer no digital.
              </motion.p>

              <motion.div
                className="hero-cta-group"
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <button
                  onClick={() => navigate("/criar-projeto")}
                  className="btn-hero btn-hero-primary"
                >
                  🚀 Iniciar Proposta de Projeto
                </button>
                <a
                  href="#preview"
                  className="btn-hero btn-hero-secondary"
                >
                  🔍 Ver Cases de Sucesso
                </a>
              </motion.div>

              {/* Card Banner de Atalho Rápido */}
              <motion.div
                onClick={() => navigate("/criar-projeto")}
                className="hero-quick-banner-shortcut"
                custom={4}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center gap-3">
                  <div className="shortcut-icon-circle">💡</div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-slate-900 text-sm">Tem uma ideia para o seu projeto?</h4>
                    <p className="text-xs text-slate-500 font-medium">Clique aqui, monte seu briefing por voz ou texto e receba o escopo gerado por IA.</p>
                  </div>
                </div>
                <div className="shortcut-arrow-badge">Começar Agora ➔</div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ==========================================
            CLIENTS SECTION
            ========================================== */}
        <section className="clients-section">
          <div className="clients-container">
            <p className="clients-title">Clientes que confiam em nosso ecossistema</p>
            <div className="clients-grid">
              <div 
                className="client-logo-featured-wrapper" 
                onClick={() => {
                  setActiveProjectTab("mestre");
                  const elem = document.getElementById("preview");
                  elem?.scrollIntoView({ behavior: "smooth" });
                }}
                title="Mestre das Alianças — Clique para ver o projeto em destaque"
              >
                <img src={mestreLogo} alt="Mestre das Alianças" className="client-logo-img-large" />
              </div>
              <div 
                className="client-logo-featured-wrapper" 
                onClick={() => {
                  setActiveProjectTab("meubone");
                  const elem = document.getElementById("preview");
                  elem?.scrollIntoView({ behavior: "smooth" });
                }}
                title="Meu Boné Bordado — Clique para ver o projeto em destaque"
              >
                <img src={meuBoneLogo} alt="Meu Boné Bordado" className="client-logo-img-large blue-border" />
              </div>
              <div 
                className="client-logo-featured-wrapper" 
                onClick={() => {
                  setActiveProjectTab("odonto");
                  const elem = document.getElementById("preview");
                  elem?.scrollIntoView({ behavior: "smooth" });
                }}
                title="Dott. Odontologia — Clique para ver o projeto em destaque"
              >
                <img src={dottOdontoLogo} alt="Dott. Odontologia" className="client-logo-img-large dark-border" />
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            PREVIEW SECTION
            ========================================== */}
        <section className="preview-section" id="preview">
          <div className="preview-container">
            <div className="section-header">
              <span className="inline-block text-indigo-600 font-extrabold uppercase tracking-widest text-[11px] bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full mb-3">
                Portfólio Corporativo
              </span>
              <h2 className="section-title">Cases de Sucesso & Engenharia</h2>
              <p className="section-subtitle">
                Plataformas desenvolvidas com arquitetura limpa, design exclusivo de alta conversão e infraestrutura escalável.
              </p>
            </div>

            {/* Abas de Seleção Minimalistas */}
            <div className="project-tabs-container">
              <button
                onClick={() => setActiveProjectTab("mestre")}
                className={`project-tab-btn ${activeProjectTab === "mestre" ? "active" : ""}`}
              >
                <img src={mestreLogo} alt="Mestre das Alianças" className="w-5 h-5 rounded-full object-cover" />
                <span>Mestre das Alianças</span>
              </button>
              <button
                onClick={() => setActiveProjectTab("meubone")}
                className={`project-tab-btn ${activeProjectTab === "meubone" ? "active" : ""}`}
              >
                <img src={meuBoneLogo} alt="Meu Boné Bordado" className="w-5 h-5 rounded-full object-contain bg-white p-0.5 border border-slate-200" />
                <span>Meu Boné Bordado</span>
              </button>
              <button
                onClick={() => setActiveProjectTab("odonto")}
                className={`project-tab-btn ${activeProjectTab === "odonto" ? "active" : ""}`}
              >
                <img src={dottOdontoLogo} alt="Dott. Odontologia" className="w-5 h-5 rounded-full object-contain bg-white p-0.5 border border-slate-200" />
                <span>Dott. Odontologia</span>
              </button>
            </div>

            {/* Detalhes Minimalistas do Projeto */}
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              {activeProjectTab === "mestre" ? (
                <>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Mestre das Alianças</h3>
                  <p className="text-slate-600 text-base font-medium leading-relaxed">
                    E-commerce de joias finas com catálogo responsivo de Alianças de Ouro 18k e Prata 950.
                  </p>
                  <a 
                    href="https://mestredasaliancas.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-sm transition pt-1"
                  >
                    <span>mestredasaliancas.com.br</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H5v12h12v-6h2v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2z"/></svg>
                  </a>
                </>
              ) : activeProjectTab === "meubone" ? (
                <>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Meu Boné Bordado</h3>
                  <p className="text-slate-600 text-base font-medium leading-relaxed">
                    E-Commerce com Studio Editor nativo para customização de bordados e cálculo de matriz em tempo real.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Dott. Odontologia</h3>
                  <p className="text-slate-600 text-base font-medium leading-relaxed">
                    Plataforma institucional de odontologia com agendamento online e atendimento personalizado.
                  </p>
                  <a 
                    href="https://odontodott.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-sm transition pt-1"
                  >
                    <span>odontodott.com.br</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H5v12h12v-6h2v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2z"/></svg>
                  </a>
                </>
              )}
            </div>

            {/* Alternador de Visão para o Case Meu Boné Bordado */}
            {activeProjectTab === "meubone" && (
              <div className="subview-toggle-container">
                <button
                  onClick={() => setMeuBoneSubView("landing")}
                  className={`subview-btn ${meuBoneSubView === "landing" ? "active" : ""}`}
                >
                  <span className="subview-icon">🌐</span> E-Commerce Storefront
                </button>
                <button
                  onClick={() => setMeuBoneSubView("customizer")}
                  className={`subview-btn ${meuBoneSubView === "customizer" ? "active" : ""}`}
                >
                  <span className="subview-icon">🎨</span> Studio Editor Nativo
                </button>
              </div>
            )}

            {/* BROWSER MOCKUP CONTAINER (PADRÃO CORPORATIVO BIG TECH) */}
            <div className="browser-mockup-container">
              {/* Barra do Navegador */}
              <div className="browser-mockup-bar">
                <div className="browser-mockup-dots">
                  <span className="browser-dot browser-dot-red" />
                  <span className="browser-dot browser-dot-yellow" />
                  <span className="browser-dot browser-dot-green" />
                </div>
                
                <div className="browser-mockup-url">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457-.312-2.841-.873-4.084" />
                  </svg>
                  <span>
                    {activeProjectTab === "mestre"
                      ? "https://mestredasaliancas.com.br"
                      : activeProjectTab === "meubone"
                      ? "https://meubonebordado.com.br"
                      : "https://odontodott.com.br"}
                  </span>
                </div>

                {activeProjectTab === "mestre" || activeProjectTab === "odonto" ? (
                  <a
                    href={activeProjectTab === "mestre" ? "https://mestredasaliancas.com.br" : "https://odontodott.com.br"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="corporate-visit-link-btn"
                  >
                    <span>Acessar</span>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H5v12h12v-6h2v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2z"/></svg>
                  </a>
                ) : (
                  <div className="w-20" />
                )}
              </div>

              {/* Conteúdo dos Mockups dentro do Browser Frame */}
              <div className="preview-devices">
                <motion.div
                  key={activeProjectTab + "-" + meuBoneSubView + "-desktop"}
                  className={`preview-desktop ${activeProjectTab === "mestre" || activeProjectTab === "odonto" ? "clickable" : ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  onClick={() => {
                    if (activeProjectTab === "mestre") {
                      window.open("https://mestredasaliancas.com.br", "_blank", "noopener,noreferrer");
                    } else if (activeProjectTab === "odonto") {
                      window.open("https://odontodott.com.br", "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <img 
                    src={
                      activeProjectTab === "mestre"
                        ? mestreDesktop
                        : activeProjectTab === "meubone"
                        ? (meuBoneSubView === "landing" ? meuBoneDesktop : meuBoneEditorDesktop)
                        : activeProjectTab === "odonto"
                        ? dottOdontoDesktop
                        : desktopMockup
                    } 
                    alt={
                      activeProjectTab === "mestre"
                        ? "Site Mestre das Alianças Desktop"
                        : activeProjectTab === "meubone"
                        ? (meuBoneSubView === "landing" ? "Site Meu Boné Bordado Desktop" : "Editor Customizador Meu Boné Bordado Desktop")
                        : activeProjectTab === "odonto"
                        ? "Site Dott. Odontologia Desktop"
                        : "Mockup de Plataforma Desktop Dott"
                    } 
                    className="preview-img" 
                  />
                </motion.div>

                <motion.div
                  key={activeProjectTab + "-" + meuBoneSubView + "-mobile"}
                  className={`preview-mobile ${activeProjectTab === "mestre" || activeProjectTab === "odonto" ? "clickable" : ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                  onClick={() => {
                    if (activeProjectTab === "mestre") {
                      window.open("https://mestredasaliancas.com.br", "_blank", "noopener,noreferrer");
                    } else if (activeProjectTab === "odonto") {
                      window.open("https://odontodott.com.br", "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <img 
                    src={
                      activeProjectTab === "mestre"
                        ? mestreMobile
                        : activeProjectTab === "meubone"
                        ? (meuBoneSubView === "landing" ? meuBoneMobile : meuBoneEditorMobile)
                        : activeProjectTab === "odonto"
                        ? dottOdontoMobile
                        : mobileMockup
                    } 
                    alt={
                      activeProjectTab === "mestre"
                        ? "Site Mestre das Alianças Mobile"
                        : activeProjectTab === "meubone"
                        ? (meuBoneSubView === "landing" ? "Site Meu Boné Bordado Mobile" : "Editor Customizador Meu Boné Bordado Mobile")
                        : activeProjectTab === "odonto"
                        ? "Site Dott. Odontologia Mobile"
                        : "Mockup Mobile Dott"
                    } 
                    className="preview-img preview-img-mobile" 
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            FEATURES SECTION
            ========================================== */}
        <section className="features-section" id="features">
          <div className="features-container">
            <div className="section-header">
              <h2 className="section-title">O que criamos</h2>
              <p className="section-subtitle">
                Desenvolvemos soluções robustas voltadas para a automação e crescimento do seu negócio.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">🌐</span>
                </div>
                <h3 className="feature-card-title">Portais Institucionais</h3>
                <p className="feature-card-text">
                  Sites sofisticados que carregam instantaneamente e estabelecem sua autoridade online frente à concorrência.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">🛒</span>
                </div>
                <h3 className="feature-card-title">E-commerce de Alta Conversão</h3>
                <p className="feature-card-text">
                  Lojas virtuais com checkout ágil, cálculos de frete integrados e painel de vendas robusto.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">⚙️</span>
                </div>
                <h3 className="feature-card-title">Sistemas e APIs</h3>
                <p className="feature-card-text">
                  Sistemas internos de controle, CRM e fluxos inteligentes para a automatização dos processos diários.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            METODOLOGIA SECTION
            ========================================== */}
        <section className="metodologia-section" id="metodologia">
          <div className="metodologia-container">
            <div className="section-header">
              <h2 className="section-title">Nossa Metodologia</h2>
              <p className="section-subtitle">Um fluxo transparente e linear do escopo à publicação.</p>
            </div>
            
            <div className="metodologia-steps">
              {[
                { num: "01", titulo: "Alinhamento & Briefing", desc: "Entendemos seu negócio e metas para desenhar a melhor estratégia de requisitos do projeto.", icon: "💬" },
                { num: "02", titulo: "Design de Telas", desc: "Criamos a interface visual interativa (UI) no Figma alinhada à identidade visual da sua marca.", icon: "🎨" },
                { num: "03", titulo: "Código e Integrações", desc: "Desenvolvemos o sistema utilizando arquitetura moderna, responsiva, rápida e segura.", icon: "💻" },
                { num: "04", titulo: "Ajustes & Homologação", desc: "Apresentamos a prévia do projeto para validação de testes e correções finas.", icon: "✅" },
                { num: "05", titulo: "Lançamento Oficial", desc: "Publicamos seu sistema em produção na nuvem com garantia de suporte técnico contínuo.", icon: "🚀" },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  className="metod-step"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="metod-icon">{step.icon}</div>
                  <div className="metod-num">{step.num}</div>
                  <h3 className="metod-titulo">{step.titulo}</h3>
                  <p className="metod-desc">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            PLANOS SECTION
            ========================================== */}
        <section className="planos-section" id="planos">
          <div className="planos-container">
            <div className="section-header">
              <h2 className="section-title">Planos de Serviço</h2>
              <p className="section-subtitle">Escopos bem definidos e adequados para cada necessidade empresarial.</p>
            </div>
            
            <div className="planos-grid">
              {[
                {
                  nome: "Landing Page",
                  tagline: "Otimizado para captação",
                  tag: "🎯 Lançamentos",
                  desc: "Página única de conversão rápida ideal para campanhas específicas e leads.",
                  features: ["1 Página completa", "Design exclusivo Figma", "Formulário integrado", "SEO básico e velocidade", "Entrega ágil"],
                  destaque: false
                },
                {
                  nome: "Site Premium",
                  tagline: "Para empresas em crescimento",
                  tag: "⭐ Mais Escolhido",
                  desc: "Site institucional completo com páginas internas para credibilidade e SEO no Google.",
                  features: ["Até 6 Páginas completas", "Design UI/UX sob medida", "Integração com WhatsApp", "Otimização SEO Completa", "Suporte técnico incluso"],
                  destaque: true
                },
                {
                  nome: "Corporativo / Custom",
                  tagline: "Sistemas integrados completos",
                  tag: "🏢 Enterprise",
                  desc: "Plataformas complexas, e-commerce robusto ou desenvolvimento sob demanda.",
                  features: ["Páginas/Telas ilimitadas", "Banco de dados e API", "Painel Administrativo", "Integrações personalizadas", "Segurança avançada"],
                  destaque: false
                }
              ].map((plano, i) => (
                <motion.div
                  key={plano.nome}
                  className={`plano-card ${plano.destaque ? "plano-destaque" : ""}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  <div className="plano-tag">{plano.tag}</div>
                  <h3 className="plano-nome">{plano.nome}</h3>
                  <p className="plano-tagline">{plano.tagline}</p>
                  <p className="plano-desc">{plano.desc}</p>
                  <ul className="plano-features">
                    {plano.features.map(f => <li key={f}><span className="plano-check">✓</span> {f}</li>)}
                  </ul>
                  <button
                    onClick={() => navigate("/criar-projeto")}
                    className={`plano-btn ${plano.destaque ? "plano-btn-destaque" : ""}`}
                  >
                    Iniciar Proposta
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            FORMULÁRIO DE BRIEFING / CONTATO
            ========================================== */}
        <section className="contact-section-wrapper" id="contato">
          <div className="contact-card-glass">
            <h2 className="contact-card-title">Fale Conosco</h2>
            <p className="contact-card-subtitle">
              Quer iniciar um projeto? Envie uma mensagem rápida para nossa equipe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label-premium">Seu Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={dadosFormulario.nome}
                  onChange={handleChange}
                  className="form-input-premium"
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div>
                <label className="form-label-premium">Seu E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={dadosFormulario.email}
                  onChange={handleChange}
                  className="form-input-premium"
                  placeholder="exemplo@empresa.com"
                  required
                />
              </div>

              <div>
                <label className="form-label-premium">Mensagem / Ideia Inicial</label>
                <textarea
                  name="mensagem"
                  value={dadosFormulario.mensagem}
                  onChange={handleChange}
                  rows={4}
                  className="form-input-premium"
                  placeholder="Escreva brevemente o que você precisa..."
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-form-submit"
              >
                Enviar Mensagem
              </button>
            </form>
          </div>
        </section>

      </main>

      {/* Chatbot Oficial Dott System */}
      <Chatbot />

      <Footer />
    </>
  );
}

export default Home;
