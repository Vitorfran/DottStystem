import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";

// Definindo o tipo para as abas de categorias
type Categoria = "all" | "3d-puff" | "patches" | "logos";

// Dados estruturados das matrizes grátis
interface Matriz {
  id: number;
  nome: string;
  categoria: Categoria;
  badge: string;
  imagem: string;
  linkZip: string;
  formatos: string;
  tamanho: string;
  descricao: string;
}

const MATRIZES_FREE: Matriz[] = [
  {
    id: 1,
    nome: "Haaland 3D Puff",
    categoria: "3d-puff",
    badge: "3D Puff",
    imagem: "https://www.vitordigitizing.net/uploads/1/3/8/5/138519782/haaland.png",
    linkZip: "https://www.vitordigitizing.net/uploads/1/3/8/5/138519782/holland3d.zip",
    formatos: "DST, PES, EXP, JEF",
    tamanho: '3.8" x 3.9" (96mm)',
    descricao: "Matriz em alto relevo 3D Puff de alta densidade, testada e otimizada para bonés e jaquetas pesadas."
  },
  {
    id: 2,
    nome: "EST 1776 Vintage Patch",
    categoria: "patches",
    badge: "Vintage Patch",
    imagem: "https://www.vitordigitizing.net/uploads/1/3/8/5/138519782/est1776.png",
    linkZip: "https://www.vitordigitizing.net/uploads/1/3/8/5/138519782/est1776.zip",
    formatos: "DST, PES, EXP, JEF",
    tamanho: '4.0" x 2.2" (100mm)',
    descricao: "Design clássico americano em ponto cheio com alta estabilidade, ideal para jaquetas e patches costurados."
  },
  {
    id: 3,
    nome: "Custom Eagle Logo",
    categoria: "logos",
    badge: "Sports Logo",
    imagem: "https://www.vitordigitizing.net/uploads/1/3/8/5/138519782/customlogo.png",
    linkZip: "#",
    formatos: "DST, PES, EMB, JEF",
    tamanho: '3.5" x 3.5" (90mm)',
    descricao: "Exemplo de logotipo corporativo esportivo vetorizado e digitalizado com caminhos e compensação otimizados."
  }
];

export function VitorDigitizing() {
  const [activeCategory, setActiveCategory] = useState<Categoria>("all");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [posicao, setPosicao] = useState("Hats");
  const [observacoes, setObservacoes] = useState("");
  const [sucessoForm, setSucessoForm] = useState(false);

  // Filtrar os cards baseado no estado activeCategory
  const filteredMatrizes = MATRIZES_FREE.filter(
    m => activeCategory === "all" || m.categoria === activeCategory
  );

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSucessoForm(true);
    setTimeout(() => {
      setSucessoForm(false);
      setNome("");
      setEmail("");
      setObservacoes("");
    }, 4000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-grow">
        {/* ==========================================
            HERO SECTION
            ========================================== */}
        <section className="relative overflow-hidden bg-slate-950 text-white py-24 px-6 border-b border-slate-900">
          {/* Efeitos de Iluminação Premium no fundo */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          {/* Grid de Textura Canvas/Linhas de Bordado */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ 
              backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`, 
              backgroundSize: '24px 24px' 
            }} 
          />

          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
            <motion.span 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block text-blue-400 font-extrabold uppercase tracking-widest text-[11px] bg-blue-950/60 border border-blue-900 px-4 py-1.5 rounded-full"
            >
              FAST 24-HOUR TURNAROUND · PREMIUM QUALITY
            </motion.span>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08] max-w-4xl mx-auto"
            >
              Where Your Designs <br/>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                Come to Stitch.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Production-ready custom embroidery digitizing for shops, custom hat creators, and clothing brands. Perfect stitch density, zero thread breaks.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center gap-4 flex-wrap pt-4"
            >
              <a 
                href="#quote" 
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-blue-950/40 transition active:scale-95 text-base"
              >
                Get a Free Quote
              </a>
              <a 
                href="#free-showcase" 
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-extrabold px-8 py-4 rounded-2xl transition active:scale-95 text-base"
              >
                Free Matrizes
              </a>
            </motion.div>
          </div>
        </section>

        {/* ==========================================
            FEATURES/SPECS SECTION
            ========================================== */}
        <section className="py-20 px-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">3D Puff Mastery</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We specialize in raised 3D puff designs for hats and snapbacks. Otimizados para linhas grossas e contornos firmes de agulha.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Zero Thread Breaks</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Stitch pathways designed to minimize needle heat and prevent thread cuts, ensuring clean and continuous machine runs.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Stitch Density Balance</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Balanced stitches that avoid fabric puckering on thin materials, while maintaining vibrant coverage.
            </p>
          </div>
        </section>

        {/* ==========================================
            FREE SHOWCASE SECTION
            ========================================== */}
        <section className="py-20 bg-white border-y border-slate-200" id="free-showcase">
          <div className="max-w-5xl mx-auto px-6 space-y-10">
            
            <div className="text-center space-y-3">
              <span className="text-blue-600 font-extrabold uppercase tracking-widest text-[11px] bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full">
                Free Embroidery Files
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Embroidery Files & 3D Puff Showcase
              </h2>
              <p className="text-slate-500 text-base max-w-lg mx-auto">
                Baixe gratuitamente nossos arquivos digitais de alta fidelidade e teste em sua própria máquina de bordado.
              </p>
            </div>

            {/* Filtros Minimalistas */}
            <div className="flex justify-center gap-2.5 flex-wrap">
              {(["all", "3d-puff", "patches", "logos"] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition ${
                    activeCategory === cat
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/50"
                  }`}
                >
                  {cat === "all" && "Todos os Bordados"}
                  {cat === "3d-puff" && "3D Puff"}
                  {cat === "patches" && "Patches"}
                  {cat === "logos" && "Logos"}
                </button>
              ))}
            </div>

            {/* Grid de Cards Otimizados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <AnimatePresence mode="popLayout">
                {filteredMatrizes.map(matriz => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={matriz.id}
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-350 transition flex flex-col"
                  >
                    {/* Imagem com enquadramento perfeito (sem esticar) */}
                    <div className="relative w-[100%] h-48 bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100">
                      <span className="absolute top-4 left-4 bg-slate-900/90 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1 rounded-md">
                        {matriz.badge}
                      </span>
                      <img 
                        src={matriz.imagem} 
                        alt={matriz.nome} 
                        className="max-w-full max-h-full object-contain filter drop-shadow-md transition hover:scale-105" 
                      />
                    </div>

                    <div className="p-6 flex flex-col flex-grow space-y-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{matriz.nome}</h3>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{matriz.descricao}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-[11px] font-semibold text-slate-600">
                        <div>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Formatos</span>
                          <span className="text-slate-800 font-bold block mt-0.5">{matriz.formatos}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Dimensões</span>
                          <span className="text-slate-800 font-bold block mt-0.5">{matriz.tamanho}</span>
                        </div>
                      </div>

                      <a
                        href={matriz.linkZip}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-slate-950 hover:bg-blue-600 text-white font-extrabold text-center py-3 rounded-xl transition shadow-sm text-xs mt-auto block"
                      >
                        Download .ZIP
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* ==========================================
            QUOTE FORM SECTION
            ========================================== */}
        <section className="py-20 px-6 bg-slate-50" id="quote">
          <div className="max-w-xl mx-auto bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 relative">
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Request a Custom Quote</h2>
              <p className="text-slate-500 text-sm">
                Envie o vetor ou imagem do seu logo e receba a cotação da matriz de bordado em menos de 12 horas.
              </p>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Your Name</label>
                <input 
                  type="text" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm font-semibold text-slate-800 transition"
                  placeholder="Ex: John Doe" 
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm font-semibold text-slate-800 transition"
                  placeholder="Ex: john@brand.com" 
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Embroidery Placement</label>
                <select 
                  value={posicao}
                  onChange={(e) => setPosicao(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition"
                >
                  <option value="Hats">Hats / Caps (3D Puff or Flat)</option>
                  <option value="Left Chest">Left Chest / Polo</option>
                  <option value="Jacket Back">Jacket Back (Large)</option>
                  <option value="Patches">Custom Patches</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Logo / Image Details</label>
                <textarea 
                  rows={4}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm font-semibold text-slate-800 transition"
                  placeholder="Digite as dimensões que você precisa (ex: 8cm de largura) ou formatos específicos..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-xl shadow-lg transition active:scale-95 text-sm"
              >
                Send Quote Request ➔
              </button>
            </form>

            <AnimatePresence>
              {sucessoForm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-white/95 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl shadow-xs">
                    ✓
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Request Sent Successfully!</h3>
                  <p className="text-slate-500 text-xs max-w-xs">
                    Nossa equipe técnica analisará sua arte e responderá no e-mail com as opções de pontos e preço da matriz.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default VitorDigitizing;
