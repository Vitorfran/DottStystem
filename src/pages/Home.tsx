
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/home.css";
import heroVideo from "../assets/Tire_o_get_started_o_fundo_me-ezremove.mp4";
import desktopMockup from "../assets/imagens/desktop_mockup.png";
import mobileMockup from "../assets/imagens/mobile_mockup.png";
import { motion } from "framer-motion";
import Chatbot from '../components/Chatbot';
import { useState, type FormEvent, type ChangeEvent } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: "easeOut" as const },
  }),
};


function Home() {
  /* Pega os dados do Formulário*/
  const [dadosFormulario, setDadosFormulario] = useState({
      nome: "",
      email: "",
      mensagem: ""
    });
  
  /* Envia o Json da Respota do Cliente para a nossa Rota do backend */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Dados do formulário:", dadosFormulario);
    
    try{
      const resposta = await fetch("http://localhost:3000/api/contato", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosFormulario)
      });
      if (resposta.ok) {
      // Limpa os campos da tela chamando a memória!
      setDadosFormulario({
        nome: "",
        email: "",
        mensagem: ""
      });

      alert("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      }
      console.log("Resposta do servidor:", resposta);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
  };
  
  
  
  /* Handlechange para verificar atualização no formulario e regras de  */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const campo = e.target.name;
    const valorDigitado = e.target.value;
  
    setDadosFormulario({
      ...dadosFormulario,
      [campo]: valorDigitado
    });
  
    if (valorDigitado.trim() === "") {
      console.log(`Por favor, preencha o campo ${campo}.`);
    }
  
  };
  return (
    <>
      <Header />

      <main className="home-main">
        {/* Glow Effects */}
        <div className="glow-effect glow-1"></div>
        <div className="glow-effect glow-2"></div>

        {/* Hero Section */}
        <section className="hero-section">
          <motion.video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="hero-bg-video"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <div className="hero-container">
            <div className="hero-text-content">
              <motion.h1
                className="hero-title"
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                Criamos sites e sistemas que fazem o seu negócio{" "}
                <span className="text-gradient">crescer de verdade.</span>
              </motion.h1>

              <motion.p
                className="hero-description"
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                Somos uma empresa especializada em desenvolvimento de sites profissionais, e-commerce e sistemas sob medida. Do design à entrega, cuidamos de tudo para você focar no seu negócio.
              </motion.p>

              <motion.div
                className="hero-cta-group"
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <button className="btn-hero btn-hero-primary">
                  Solicitar Orçamento
                </button>
                <button className="btn-hero btn-hero-secondary" style={{ color: 'white' }}>
                  Ver Serviços
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Clients Section */}
        <section className="clients-section">
          <div className="clients-container">
            <p className="clients-title">Clientes que já transformaram sua presença digital</p>
            <div className="clients-grid">
              <div className="client-logo"><span>🍕 Restaurante Bella</span></div>
              <div className="client-logo"><span>🏋️ FitLife Academia</span></div>
              <div className="client-logo"><span>🏠 ImobMax</span></div>
              <div className="client-logo"><span>⚖️ Advocacia Melo</span></div>
              <div className="client-logo"><span>🛒 Moda Prime</span></div>
            </div>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="metrics-section">
          <div className="metrics-container">
            <div className="metric-item">
              <h3 className="metric-number">+120</h3>
              <p className="metric-label">Projetos Entregues</p>
            </div>
            <div className="metric-item">
              <h3 className="metric-number">+80</h3>
              <p className="metric-label">Clientes Satisfeitos</p>
            </div>
            <div className="metric-item">
              <h3 className="metric-number">5 anos</h3>
              <p className="metric-label">de Experiência</p>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="preview-section" id="preview">
          <div className="preview-container">
            <div className="section-header">
              <h2 className="section-title">Sites que entregamos</h2>
              <p className="section-subtitle">
                Cada projeto é desenvolvido com design exclusivo, responsivo e otimizado para converter visitantes em clientes.
              </p>
            </div>

            <div className="preview-devices">
              <motion.div
                className="preview-desktop"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="preview-label">💻 Versão Desktop</div>
                <img src={desktopMockup} alt="Exemplo de site criado pela DottSystem" className="preview-img preview-img-desktop" />
              </motion.div>

              <motion.div
                className="preview-mobile"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              >
                <div className="preview-label">📱 Versão Mobile</div>
                <img src={mobileMockup} alt="Site responsivo criado pela DottSystem" className="preview-img preview-img-mobile" />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="features-container">
            <div className="section-header">
              <h2 className="section-title">O que fazemos</h2>
              <p className="section-subtitle">
                Desenvolvemos soluções digitais completas para negócios de todos os tamanhos, do zero ao ar.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">🌐</span>
                </div>
                <h3 className="feature-card-title">Sites Profissionais</h3>
                <p className="feature-card-text">
                  Criamos sites institucionais modernos, rápidos e responsivos que transmitem credibilidade e convertem visitantes em clientes.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">🛒</span>
                </div>
                <h3 className="feature-card-title">Lojas Virtuais</h3>
                <p className="feature-card-text">
                  Desenvolvemos e-commerces completos com integração de pagamento, estoque e gestão de pedidos para você vender online.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">⚙️</span>
                </div>
                <h3 className="feature-card-title">Sistemas Sob Medida</h3>
                <p className="feature-card-text">
                  Desenvolvemos sistemas e painéis administrativos personalizados para automatizar processos e resolver problemas reais do seu negócio.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">📈</span>
                </div>
                <h3 className="feature-card-title">SEO & Performance</h3>
                <p className="feature-card-text">
                  Otimizamos seu site para aparecer no Google, aumentar o tráfego orgânico e garantir carregamento rápido em todos os dispositivos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Metodologia Section */}
        <section className="metodologia-section" id="metodologia">
          <div className="metodologia-container">
            <motion.div className="section-header" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 className="section-title">Nossa Metodologia</h2>
              <p className="section-subtitle">Um processo claro e transparente do início ao fim do seu projeto.</p>
            </motion.div>
            <div className="metodologia-steps">
              {[
                { num: "01", titulo: "Briefing", desc: "Entendemos profundamente o seu negócio, público-alvo e objetivos para construir uma estratégia digital certeira.", icon: "💬" },
                { num: "02", titulo: "Design", desc: "Criamos o layout exclusivo do seu site com foco em experiência do usuário, identidade visual e conversão.", icon: "🎨" },
                { num: "03", titulo: "Desenvolvimento", desc: "Codificamos seu site com tecnologias modernas, garantindo velocidade, segurança e compatibilidade com todos os dispositivos.", icon: "⚙️" },
                { num: "04", titulo: "Revisão", desc: "Apresentamos o projeto para sua aprovação. Realizamos quantos ajustes forem necessários até sua total satisfação.", icon: "✅" },
                { num: "05", titulo: "Entrega & Suporte", desc: "Publicamos seu site no ar e oferecemos suporte pós-entrega para que tudo funcione perfeitamente.", icon: "🚀" },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  className="metod-step"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, delay: i * 0.12 }}
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

        {/* Planos Section */}
        <section className="planos-section" id="planos">
          <div className="planos-container">
            <motion.div className="section-header" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 className="section-title">Escolha o plano ideal</h2>
              <p className="section-subtitle">Transparência total: sem letras miúdas, sem surpresas.</p>
            </motion.div>
            <div className="planos-grid">
              {[
                {
                  nome: "Landing Page",
                  tagline: "Ideal para campanhas e lançamentos",
                  tag: "🎯 Conversão",
                  desc: "Página focada em conversão para campanhas, lançamentos e captação de leads.",
                  features: [
                    "1 página completa",
                    "Design exclusivo",
                    "100% responsivo",
                    "Formulário integrado",
                    "SEO básico incluso",
                    "Entrega em 7 dias",
                  ],
                  destaque: false,
                },
                {
                  nome: "Institucional",
                  tagline: "Para empresas que querem crescer online",
                  tag: "⭐ Mais Popular",
                  desc: "Site completo para empresas que querem transmitir credibilidade e atrair clientes online.",
                  features: [
                    "Até 8 páginas",
                    "Design premium exclusivo",
                    "Blog integrado",
                    "Integração WhatsApp & e-mail",
                    "Otimização SEO completa",
                    "Suporte por 3 meses",
                  ],
                  destaque: true,
                },
                {
                  nome: "Corporativo",
                  tagline: "Projetos complexos sob medida",
                  tag: "🏢 Enterprise",
                  desc: "Solução completa para grandes empresas: e-commerce, sistemas, portais e intranets.",
                  features: [
                    "Páginas ilimitadas",
                    "E-commerce ou sistema",
                    "Painel administrativo",
                    "Integrações personalizadas",
                    "Performance & segurança avançada",
                    "Suporte dedicado",
                  ],
                  destaque: false,
                },
              ].map((plano, i) => (
                <motion.div
                  key={plano.nome}
                  className={`plano-card ${plano.destaque ? "plano-destaque" : ""}`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <div className="plano-tag">{plano.tag}</div>
                  <h3 className="plano-nome">{plano.nome}</h3>
                  <p className="plano-tagline">{plano.tagline}</p>
                  <p className="plano-desc">{plano.desc}</p>
                  <ul className="plano-features">
                    {plano.features.map(f => <li key={f}><span className="plano-check">✓</span> {f}</li>)}
                  </ul>
                  <button className={`plano-btn ${plano.destaque ? "plano-btn-destaque" : ""}`}>
                    Solicitar Orçamento
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Depoimentos Section */}
        <section className="depoimentos-section" id="depoimentos">
          <div className="depoimentos-container">
            <motion.div className="section-header" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 className="section-title">O que nossos clientes dizem</h2>
              <p className="section-subtitle">Empresas reais, resultados reais.</p>
            </motion.div>
            <div className="depoimentos-grid">
              {[
                { nome: "Rafael Souza", cargo: "Dono — Restaurante Bella", texto: "A DottSystem criou nosso site em menos de 2 semanas. As reservas online aumentaram 40% já no primeiro mês. Profissionalismo total!", avatar: "RS" },
                { nome: "Camila Torres", cargo: "Diretora — FitLife Academia", texto: "Site lindo, rápido e que aparece no Google. Hoje recebo clientes direto pelo site. Valeu muito o investimento!", avatar: "CT" },
                { nome: "Dr. Marcos Melo", cargo: "Advogado — Advocacia Melo", texto: "Precisava de credibilidade online e a DottSystem entregou exatamente isso. Site clean, profissional e com ótimo suporte após a entrega.", avatar: "MM" },
              ].map((dep, i) => (
                <motion.div
                  key={dep.nome}
                  className="depoimento-card"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <div className="depoimento-stars">★★★★★</div>
                  <p className="depoimento-texto">"{dep.texto}"</p>
                  <div className="depoimento-autor">
                    <div className="depoimento-avatar">{dep.avatar}</div>
                    <div>
                      <div className="depoimento-nome">{dep.nome}</div>
                      <div className="depoimento-cargo">{dep.cargo}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>



        {/* FAQ Section */}
        <section className="faq-section" id="faq">
          <div className="faq-container">
            <motion.div className="section-header" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 className="section-title">Perguntas Frequentes</h2>
              <p className="section-subtitle">Tire suas dúvidas sobre o DottSystem.</p>
            </motion.div>
            <div className="faq-list">
              {[
                { p: "Quanto tempo leva para entregar um site?", r: "Sites institucionais são entregues em média em 10 a 15 dias úteis. Para projetos maiores como e-commerce e sistemas, o prazo é definido no início do projeto conforme o escopo." },
                { p: "O site ficará no meu nome (domínio e hospedagem)?", r: "Sim! Tudo fica em seu nome. Você tem total propriedade do domínio, hospedagem e do código do site após a entrega." },
                { p: "Vou conseguir atualizar o site sozinho?", r: "Com certeza. Entregamos o site com painel de administração fácil de usar e oferecemos treinamento para que você edite conteúdos sem precisar de nós." },
                { p: "O site vai aparecer no Google?", r: "Todos os sites entregues têm configuração básica de SEO: estrutura de títulos, meta tags e velocidade de carregamento otimizados. No pacote Negócio, o SEO é mais aprofundado." },
                { p: "Vocês fazem manutenção após a entrega?", r: "Sim! Oferecemos planos de manutenção mensal para atualizações, correções e suporte técnico contínuo. Você pode contratar separadamente ou já incluir no seu pacote." },
              ].map((item, i) => (
                <motion.details
                  key={i}
                  className="faq-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <summary className="faq-pergunta">{item.p} <span className="faq-icon">+</span></summary>
                  <p className="faq-resposta">{item.r}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section" id="demo">
          <div className="cta-container">
            <div className="cta-content-wrapper">
              <h2 className="cta-title">Pronto para ter um site que vende por você?</h2>
              <p className="cta-description">
                Fale com a DottSystem hoje mesmo e receba um orçamento gratuito. Transformamos sua ideia em um site profissional que atrai clientes e gera resultados reais.
              </p>
              <div className="cta-action">
                <button className="btn-cta-submit">
                  Solicitar Orçamento Gratuito
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Chatbot */}
      <Chatbot />


       {/* Formulario de Contato */}       
<section className="py-16 bg-gray-50 flex justify-center items-center">
  <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Entre em contato</h2>
    
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input 
          type="text" name="nome" value={dadosFormulario.nome} onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="Seu nome completo" required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input 
          type="email" name="email" value={dadosFormulario.email} onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="voce@exemplo.com" required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
        <textarea 
          name="mensagem" value={dadosFormulario.mensagem} onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="Como podemos ajudar?" required
        ></textarea>
      </div>

      <button 
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300 transform hover:scale-[1.02]"
      >
        Enviar Mensagem
      </button>
    </form>
  </div>
</section>



      <Footer />
    </>
  );
}

export default Home;


