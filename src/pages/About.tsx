import Header from "../components/Header";
import Footer from "../components/Footer";

/**
 * Página "Sobre Nós" (About) da Dott System.  Mlstrar fatos sobre a empresa e etc
 * 
 * Atualizada para incluir um grid de tecnologia balanceado de 9 cards (formato 3x3)
 * contendo Bancos de Dados (MySQL / PostgreSQL) com representação vetorial em cilindros.
 */
export function About() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Cabeçalho Principal */}
      <Header />

      {/* Seção Hero: Impacto Inicial */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-24 px-6">
        {/* Iluminação de fundo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="text-blue-400 font-semibold tracking-wider uppercase text-sm block mb-3">
            Quem Somos
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Transformamos Ideias em Realidades Digitais
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Fundada em 2021, a <strong>Dott System</strong> nasceu com o propósito de impulsionar pequenas e médias empresas através do desenvolvimento de sites, e-commerces e aplicativos sob medida com alta tecnologia.
          </p>
        </div>
      </section>

      {/* Seção Métricas: Prova de Capacidade */}
      <section className="-mt-10 px-6 relative z-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center md:border-r border-slate-100 last:border-0 p-4">
            <h3 className="text-4xl md:text-5xl font-black text-indigo-600 mb-2">4+ Anos</h3>
            <p className="text-slate-500 font-medium">De experiência no mercado digital</p>
          </div>
          <div className="text-center md:border-r border-slate-100 last:border-0 p-4">
            <h3 className="text-4xl md:text-5xl font-black text-indigo-600 mb-2">50+</h3>
            <p className="text-slate-500 font-medium">Projetos entregues com sucesso</p>
          </div>
          <div className="text-center p-4">
            <h3 className="text-4xl md:text-5xl font-black text-indigo-600 mb-2">99%</h3>
            <p className="text-slate-500 font-medium">De satisfação e suporte ativo</p>
          </div>
        </div>
      </section>

      {/* Seção Missão, Visão e Valores */}
      <section className="py-20 px-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-6 relative">
            Nossa Missão
            <span className="absolute bottom-[-8px] left-0 w-12 h-1 bg-indigo-500 rounded" />
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Acreditamos que a tecnologia deve ser acessível e descomplicada. Nossa missão é criar ecossistemas digitais de alta performance que gerem valor real para os negócios dos nossos parceiros, focando sempre na excelência do design e na robustez do código.
          </p>
          
          <h2 className="text-3xl font-extrabold text-slate-800 mb-6 relative mt-10">
            Diferenciais de Negócio
            <span className="absolute bottom-[-8px] left-0 w-12 h-1 bg-indigo-500 rounded" />
          </h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <strong>Atendimento Consultivo:</strong> Entendemos seu negócio antes de codificar.
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <strong>Desenvolvimento Ágil:</strong> Prazos transparentes e entregas contínuas.
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <strong>Suporte Dedicado:</strong> Manutenção e segurança pós-publicação.
            </li>
          </ul>
        </div>

        {/* Card Ilustrativo de Valores */}
        <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-8 rounded-2xl border border-indigo-100 shadow-sm space-y-6">
          <h3 className="text-2xl font-bold text-indigo-950">Nossos Valores</h3>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-indigo-50">
              <h4 className="font-bold text-indigo-900 mb-1">Transparência</h4>
              <p className="text-sm text-slate-500">Sem termos técnicos complexos desnecessários. Clareza total em cada etapa do projeto.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-indigo-50">
              <h4 className="font-bold text-indigo-900 mb-1">Qualidade de Código</h4>
              <p className="text-sm text-slate-500">Padrões rígidos de arquitetura (React, TypeScript, Prisma) garantindo segurança e escalabilidade.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-indigo-50">
              <h4 className="font-bold text-indigo-900 mb-1">Foco no Cliente</h4>
              <p className="text-sm text-slate-500">Sua solução deve resolver o seu problem. Desenvolvemos interfaces intuitivas pensadas no usuário final.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Tech Stack: As Tecnologias que Dominamos */}
      <section className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Nossa Stack Tecnológica</h2>
          <p className="text-slate-500 mb-12 max-w-xl mx-auto">
            Utilizamos ferramentas modernas e consolidadas no mercado internacional para construir soluções robustas, rápidas e escaláveis para web e dispositivos móveis.
          </p>

          {/* Grid de 3x3 balanceado com 9 cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* Card 1: React */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 text-sky-400 mb-3 animate-[spin_20s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="2" />
                <ellipse rx="10" ry="4.5" transform="translate(12,12) rotate(30)" />
                <ellipse rx="10" ry="4.5" transform="translate(12,12) rotate(90)" />
                <ellipse rx="10" ry="4.5" transform="translate(12,12) rotate(150)" />
              </svg>
              <span className="font-bold text-lg text-slate-850">React</span>
              <span className="text-xs text-sky-500 font-semibold mt-1">Web Apps</span>
            </div>

            {/* Card 2: TypeScript */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 text-blue-600 mb-3" viewBox="0 0 24 24" fill="currentColor">
                <rect width="24" height="24" rx="4" fill="#3178C6" />
                <text x="13" y="17.5" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">TS</text>
              </svg>
              <span className="font-bold text-lg text-slate-850">TypeScript</span>
              <span className="text-xs text-blue-600 font-semibold mt-1">Segurança de Tipos</span>
            </div>

            {/* Card 3: Node.js */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 text-green-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="font-bold text-lg text-slate-850">Node.js</span>
              <span className="text-xs text-green-600 font-semibold mt-1">APIs Escaláveis</span>
            </div>

            {/* Card 4: Prisma */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 text-indigo-600 mb-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2zm0 4l6.5 13H5.5L12 6z" />
              </svg>
              <span className="font-bold text-lg text-slate-850">Prisma ORM</span>
              <span className="text-xs text-indigo-600 font-semibold mt-1">Modelagem SQL</span>
            </div>

            {/* Card 5: Bancos de Dados */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 text-amber-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
              </svg>
              <span className="font-bold text-lg text-slate-850">Databases</span>
              <span className="text-xs text-amber-600 font-semibold mt-1">MySQL / PostgreSQL</span>
            </div>

            {/* Card 6: TailwindCSS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 text-teal-450 mb-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.002 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.335 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.666 17.818 9.027 19 12.002 19c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 13.382 14.976 12 12.002 12z"/>
              </svg>
              <span className="font-bold text-lg text-slate-850">TailwindCSS</span>
              <span className="text-xs text-teal-600 font-semibold mt-1">Design Responsivo</span>
            </div>

            {/* Card 7: Kotlin */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="kotlin-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E44857" />
                    <stop offset="50%" stopColor="#C05C9C" />
                    <stop offset="100%" stopColor="#7F52FF" />
                  </linearGradient>
                </defs>
                <path d="M24 24H0V0h24L12 12z" fill="url(#kotlin-grad-3)" />
              </svg>
              <span className="font-bold text-lg text-slate-850">Kotlin</span>
              <span className="text-xs text-pink-600 font-semibold mt-1">Android Nativo</span>
            </div>

            {/* Card 8: PHP */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none">
                <ellipse cx="12" cy="12" rx="11" ry="6.5" fill="#777BB4" />
                <text x="5.5" y="15" fill="white" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">PHP</text>
              </svg>
              <span className="font-bold text-lg text-slate-850">PHP</span>
              <span className="text-xs text-indigo-500 font-semibold mt-1">WordPress / E-com</span>
            </div>

            {/* Card 9: React Native */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center hover:shadow-md transition duration-300">
              <svg className="w-12 h-12 text-cyan-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse rx="11" ry="4.5" transform="translate(12,12) rotate(0)" />
                <ellipse rx="11" ry="4.5" transform="translate(12,12) rotate(60)" />
                <ellipse rx="11" ry="4.5" transform="translate(12,12) rotate(120)" />
              </svg>
              <span className="font-bold text-lg text-slate-850">React Native</span>
              <span className="text-xs text-cyan-600 font-semibold mt-1">App Multiplataforma</span>
            </div>

          </div>
        </div>
      </section>

      {/* Rodapé do Site */}
      <Footer />
    </div>
  );
}

export default About;