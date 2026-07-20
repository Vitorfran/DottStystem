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
import heroVideo from "../assets/Tire_o_get_started_o_fundo_me-ezremove.mp4";
import { motion } from "framer-motion";
import Chatbot from '../components/Chatbot';
import ChatbotMestre from '../components/ChatbotMestre';

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
  const [activeProjectTab, setActiveProjectTab] = useState<"mestre" | "dott">("mestre");

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
              <motion.div
                className="hero-badge"
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
           
              </motion.div>

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
                  Criar Proposta de Projeto
                </button>
                <a
                  href="#preview"
                  className="btn-hero btn-hero-secondary"
                >
                  Ver Projetos
                </a>
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
              <div className="client-logo">🍕 Bella Restaurante</div>
              <div className="client-logo">🏋️ FitLife Academia</div>
              <div className="client-logo">🏠 ImobMax Corretora</div>
              <div className="client-logo">⚖️ Advocacia Melo</div>
              <div className="client-logo">🛒 Moda Prime Store</div>
            </div>
          </div>
        </section>

        {/* ==========================================
            PREVIEW SECTION
            ========================================== */}
        <section className="preview-section" id="preview">
          <div className="preview-container">
            <div className="section-header">
              <h2 className="section-title">Nossos Projetos & Cases de Sucesso</h2>
              <p className="section-subtitle">
                Desenvolvemos plataformas com design exclusivo, arquitetura limpa de software e alta taxa de conversão.
              </p>
            </div>

            {/* Abas de Seleção de Projetos */}
            <div className="project-tabs-container">
              <button
                onClick={() => setActiveProjectTab("mestre")}
                className={`project-tab-btn ${activeProjectTab === "mestre" ? "active gold-tab" : ""}`}
              >
                <img src={mestreLogo} alt="Mestre das Alianças" className="w-5 h-5 rounded-full object-cover" />
                <span>Mestre das Alianças (Joalheria Premium)</span>
              </button>
              <button
                onClick={() => setActiveProjectTab("dott")}
                className={`project-tab-btn ${activeProjectTab === "dott" ? "active" : ""}`}
              >
                <span>💻 Dott System Dashboard</span>
              </button>
            </div>

            {/* Card Detalhes do Projeto Ativo */}
            <div className="project-details-card">
              {activeProjectTab === "mestre" ? (
                <>
                  <span className="project-details-tag">👑 Case em Destaque — Joalheria & E-commerce</span>
                  <h3 className="project-details-title">Mestre das Alianças</h3>
                  <p className="project-details-desc">
                    Plataforma e-commerce e Landing Page desenvolvida com alta performance para exibição e venda de Alianças de Ouro 18k e Prata 950. Conta com gravação gratuita, garantia eterna e integração para atendimento nacional.
                  </p>
                  <div className="project-badges-list">
                    <span className="project-badge-pill">✨ Ouro 18k & Prata 950</span>
                    <span className="project-badge-pill">📱 Layout 100% Responsivo</span>
                    <span className="project-badge-pill">🚀 Alta Velocidade & SEO</span>
                    <span className="project-badge-pill">🛡️ Gravação & Garantia Eterna</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="project-details-tag" style={{ background: "rgba(79,70,229,0.12)", color: "#4f46e5" }}>💻 Sistema Corporativo — Gestão & Dashboard</span>
                  <h3 className="project-details-title">Plataforma Dott System</h3>
                  <p className="project-details-desc">
                    Ecossistema interno de acompanhamento de etapas de desenvolvimento, gestão financeira de faturas via PIX/Boleto e painel interativo de clientes.
                  </p>
                  <div className="project-badges-list">
                    <span className="project-badge-pill">⚡ React & TypeScript</span>
                    <span className="project-badge-pill">🔒 Autenticação JWT</span>
                    <span className="project-badge-pill">💳 Pagamentos PIX</span>
                    <span className="project-badge-pill">📊 Painel em Tempo Real</span>
                  </div>
                </>
              )}
            </div>

            {/* Mockups Visualizadores */}
            <div className="preview-devices">
              <motion.div
                key={activeProjectTab + "-desktop"}
                className="preview-desktop"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="preview-label">
                  {activeProjectTab === "mestre" ? "💻 Site Mestre das Alianças — Desktop" : "💻 Dott System — Desktop"}
                </div>
                <img 
                  src={activeProjectTab === "mestre" ? mestreDesktop : desktopMockup} 
                  alt={activeProjectTab === "mestre" ? "Site Mestre das Alianças Desktop" : "Mockup de Plataforma Desktop Dott"} 
                  className="preview-img" 
                />
              </motion.div>

              <motion.div
                key={activeProjectTab + "-mobile"}
                className="preview-mobile"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              >
                <div className="preview-label">
                  {activeProjectTab === "mestre" ? "📱 Site Mestre das Alianças — Mobile" : "📱 Dott System — Mobile"}
                </div>
                <img 
                  src={activeProjectTab === "mestre" ? mestreMobile : mobileMockup} 
                  alt={activeProjectTab === "mestre" ? "Site Mestre das Alianças Mobile" : "Mockup Mobile Dott"} 
                  className="preview-img preview-img-mobile" 
                />
              </motion.div>
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

      {/* Chatbots (Direita: Dott System | Esquerda: Mestre das Alianças) */}
      <Chatbot />
      <ChatbotMestre />

      <Footer />
    </>
  );
}

export default Home;
