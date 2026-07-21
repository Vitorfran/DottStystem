import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_URL } from "../config/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: number;
  value: string;
  status: string;
  method: string;
  pixQrcode?: string | null;
  urlNotaFiscal?: string | null;
  createdAt: string;
}

interface Project {
  id: number;
  nome: string;
  etapa_atual: string;
  mensagem?: string | null;
  figma_link?: string | null;
  trello_link?: string | null;
  fotos?: string | null;
  designAprovado: boolean;
  contrato_link?: string | null;
  contrato_assinado: boolean;
  dataEntrega?: string | null;
  cliente: { nome: string; email: string };
  payments: Payment[];
  criadoEm: string;
}

interface UsuarioInfo {
  nome: string;
  email: string;
  role: string;
}

const ETAPAS = ["BRIEFING", "DESIGN", "DESENVOLVIMENTO", "TESTES", "ENTREGA"];

const ETAPA_META: Record<string, { cor: string; bg: string; border: string; glow: string; emoji: string; desc: string }> = {
  BRIEFING: { cor: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200", glow: "shadow-slate-500/5", emoji: "📋", desc: "Alinhamento e Escopo" },
  DESIGN: { cor: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", glow: "shadow-violet-500/10", emoji: "🎨", desc: "Protótipo Visual Figma" },
  DESENVOLVIMENTO: { cor: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", glow: "shadow-blue-500/10", emoji: "💻", desc: "Programação do Sistema" },
  TESTES: { cor: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", glow: "shadow-amber-500/10", emoji: "🧪", desc: "Homologação e Ajustes" },
  ENTREGA: { cor: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", glow: "shadow-emerald-500/10", emoji: "🚀", desc: "Publicação e Entrega Final" },
};

function Dashboard() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null);
  const [projeto, setProjeto] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [pixSelecionado, setPixSelecionado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  const apiUrl = API_URL;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalPixAberto(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const buscarDados = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const queryParams = new URLSearchParams(window.location.search);
    const urlProjectId = queryParams.get("projectId");
    const projetosUrl = urlProjectId
      ? `${apiUrl}/api/projetos?projectId=${urlProjectId}`
      : `${apiUrl}/api/projetos`;

    try {
      const [resMe, resProjeto] = await Promise.all([
        fetch(`${apiUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(projetosUrl, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resMe.ok) {
        const dataMe = await resMe.json();
        setUsuario(dataMe.usuario);
      } else if (resMe.status === 401 || resMe.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (resProjeto.ok) {
        const dataProjeto = await resProjeto.json();
        setProjeto(dataProjeto.projeto);
      } else if (resProjeto.status === 404) {
        setProjeto(null);
      } else if (resProjeto.status === 401 || resProjeto.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      } else {
        setErro("Não foi possível carregar os dados do projeto.");
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { buscarDados(); }, []);

  const acao = async (url: string) => {
    const token = localStorage.getItem("token");
    setCarregandoAcao(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (res.ok) {
        buscarDados();
      }
      else { const d = await res.json(); alert(d.message || "Erro ao processar."); }
    } catch { alert("Erro de conexão ao servidor."); }
    finally { setCarregandoAcao(false); }
  };

  const handleAssinarContrato = () => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/assinar-contrato`);
  const handlePagarFatura = (payId: number) => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/pagar-fatura/${payId}`);
  const handleAprovarDesign = () => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/aprovar-design`);

  const formatarMoeda = (v: string) => { const n = parseFloat(v); return isNaN(n) ? "R$ 0,00" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  const formatarData = (d?: string | null) => { if (!d) return "A definir"; const dt = new Date(d); return isNaN(dt.getTime()) ? "A definir" : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }); };
  const primeiroNome = usuario?.nome?.split(" ")[0] || "Cliente";

  // Regra de Negócio: Projeto 100% quitado para liberação das chaves/arquivos finais
  const totalmentePago = projeto ? projeto.payments.length > 0 && projeto.payments.every(p => p.status === "PAID") : false;
  const pagamentoPendente = projeto ? projeto.payments.find(p => p.status === "PENDING") : null;



  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col" style={{ background: "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.06) 0%, rgba(248, 250, 252, 1) 55%, rgba(241, 245, 249, 1) 100%)" }}>
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-10 space-y-10 relative z-10" role="main">

        {/* BANNER DE BOAS-VINDAS */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Olá, {primeiroNome}! 👋</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">Acompanhe o desenvolvimento do seu projeto em tempo real.</p>
          </motion.div>

          <motion.a
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            href={projeto ? `https://api.whatsapp.com/send?phone=5581988404020&text=${encodeURIComponent(`Olá! Sou ${usuario?.nome} do projeto "${projeto.nome}".`)}` : "#"}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-7 py-4 rounded-2xl transition shadow-xl shadow-emerald-600/20 active:scale-95 text-sm"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.001-6.647 5.339-11.985 11.951-11.985 3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.948-4.471 9.951-9.958.002-2.66-1.019-5.161-2.877-7.022-1.857-1.859-4.355-2.883-7.01-2.884-5.485 0-9.94 4.47-9.944 9.959-.001 1.845.507 3.636 1.47 5.188L1.15 20.91l4.981-1.306.459.25zm11.302-7.58c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.785-1.07-.958-1.79-2.14-2-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.36.54-.54.18-.18.24-.3.36-.54.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.3-.72-.6-1.12-.81-1.12-.21 0-.45-.03-.69-.03-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.16 5.44.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.7-.1 2.13-.87 2.43-1.72.3-.84.3-1.56.21-1.72-.09-.16-.33-.26-.69-.44z" /></svg>
            Atendimento VIP no WhatsApp
          </motion.a>
        </section>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 animate-pulse">
              <div className="h-64 bg-white/60 rounded-[3rem]" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="h-96 bg-white/60 rounded-[3rem] col-span-2" />
                <div className="h-96 bg-white/60 rounded-[3rem]" />
              </div>
            </motion.div>
          ) : !erro && projeto ? (
            <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">

              {/* STATUS VISUAL DAS ETAPAS */}
              <section className="bg-white/90 border border-slate-200/90 p-8 md:p-12 rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative overflow-hidden backdrop-blur-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="space-y-2">
                    <span className="text-[11px] font-black tracking-widest uppercase text-slate-400">STATUS DA ETAPA ATUAL</span>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{ETAPA_META[projeto.etapa_atual].emoji} {ETAPA_META[projeto.etapa_atual].desc}</h2>
                  </div>
                  <div className={`px-6 py-3 rounded-2xl text-xs font-black border ${ETAPA_META[projeto.etapa_atual].bg} ${ETAPA_META[projeto.etapa_atual].cor} ${ETAPA_META[projeto.etapa_atual].border} shadow-sm`}>
                    ETAPA: {projeto.etapa_atual}
                  </div>
                </div>

                <div className="mt-12 relative flex flex-col md:flex-row justify-between items-center gap-8 px-4">
                  <div className="absolute top-[24px] left-0 w-full h-[3px] bg-slate-100 hidden md:block" />
                  <div className="absolute top-[24px] left-0 h-[3px] bg-gradient-to-r from-indigo-600 to-violet-600 hidden md:block transition-all duration-1000"
                    style={{ width: `${(ETAPAS.indexOf(projeto.etapa_atual) / (ETAPAS.length - 1)) * 100}%` }} />

                  {ETAPAS.map((etapa, idx) => {
                    const concluida = idx < ETAPAS.indexOf(projeto.etapa_atual);
                    const ativa = idx === ETAPAS.indexOf(projeto.etapa_atual);
                    return (
                      <div key={etapa} className="relative z-10 flex flex-row md:flex-col items-center gap-4 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 border ${concluida ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20" :
                            ativa ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30 scale-110" :
                              "bg-white border-slate-200 text-slate-400"
                          }`}>
                          {concluida ? <svg className="w-6 h-6 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : idx + 1}
                        </div>
                        <div className="md:text-center">
                          <p className={`font-black text-[11px] tracking-wider uppercase ${ativa ? "text-indigo-600 font-extrabold" : concluida ? "text-slate-800" : "text-slate-400"}`}>{etapa}</p>
                          <p className="text-[10px] text-slate-400 font-extrabold mt-1">{ativa ? "EM ANDAMENTO" : concluida ? "CONCLUÍDO" : "PENDENTE"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* BANNERS DE AÇÕES E ALERTAS DE PENDÊNCIA */}
              <div className="space-y-6">

                {/* 1. Contrato Pendente */}
                {!projeto.contrato_assinado && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50/90 border border-amber-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-14 bg-white border border-amber-200 rounded-2xl flex items-center justify-center text-3xl shadow-xs">✍️</div>
                      <div className="space-y-1 text-center md:text-left">
                        <h3 className="font-black text-amber-900 text-xl">Assinatura do Contrato Pendente</h3>
                        <p className="text-sm text-amber-800/80 font-medium">Assine o contrato digital para validar os termos de desenvolvimento do projeto.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 flex-wrap justify-center shrink-0">
                      <a href={projeto.contrato_link || "#"} target="_blank" rel="noopener noreferrer" className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-8 py-4 rounded-2xl text-xs transition shadow-lg shadow-amber-600/20 active:scale-95">Ler e Assinar no ZapSign</a>
                      <button onClick={handleAssinarContrato} disabled={carregandoAcao} className="bg-white border border-amber-300 text-amber-800 font-extrabold px-6 py-4 rounded-2xl text-xs transition hover:bg-amber-100/50 active:scale-95 disabled:opacity-50">Simular Assinatura</button>
                    </div>
                  </motion.div>
                )}

                {/* 2. Pagamento de Entrada Pendente */}
                {projeto.contrato_assinado && pagamentoPendente && pagamentoPendente.id === projeto.payments[0]?.id && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50/90 border border-indigo-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-14 bg-white border border-indigo-200 rounded-2xl flex items-center justify-center text-3xl text-indigo-600 shadow-xs">💳</div>
                      <div className="space-y-1 text-center md:text-left">
                        <h3 className="font-black text-indigo-950 text-xl">Pagamento da Entrada Pendente (50%)</h3>
                        <p className="text-sm text-indigo-800/80 font-medium">Realize o pagamento de entrada para dar início à produção do seu projeto.</p>
                      </div>
                    </div>
                    <button onClick={() => {
                      setPixSelecionado(pagamentoPendente.pixQrcode || "");
                      setModalPixAberto(true);
                    }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-8 py-4 rounded-2xl text-xs transition shadow-lg shadow-indigo-600/25 active:scale-95 shrink-0">Pagar Entrada via Pix ({formatarMoeda(pagamentoPendente.value)})</button>
                  </motion.div>
                )}

                {/* 3. ALERTA DE QUITAÇÃO DA PARCELA FINAL (REGRA DE NEGÓCIO DA ENTREGA) */}
                {projeto.contrato_assinado && pagamentoPendente && pagamentoPendente.id !== projeto.payments[0]?.id && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border-2 border-amber-500/30 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-md backdrop-blur-md">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-md">🔒</div>
                      <div className="space-y-1 text-center md:text-left">
                        <h3 className="font-black text-slate-900 text-xl">Aguardando Quitação da Parcela Final</h3>
                        <p className="text-sm text-slate-600 font-medium">O projeto em si (arquivos de código, acessos finais e publicação) será liberado após a quitação da parcela final.</p>
                      </div>
                    </div>
                    <button onClick={() => {
                      setPixSelecionado(pagamentoPendente.pixQrcode || "");
                      setModalPixAberto(true);
                    }} className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-8 py-4 rounded-2xl text-xs transition shadow-lg shadow-amber-600/25 active:scale-95 shrink-0">Pagar Parcela Final ({formatarMoeda(pagamentoPendente.value)})</button>
                  </motion.div>
                )}




                {/* 4. Aprovação de Design */}
                {projeto.etapa_atual.toUpperCase() === "DESIGN" && !projeto.designAprovado && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-violet-50/90 border border-violet-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-14 bg-white border border-violet-200 rounded-2xl flex items-center justify-center text-3xl text-violet-600 shadow-xs">🎨</div>
                      <div className="space-y-1 text-center md:text-left">
                        <h3 className="font-black text-violet-950 text-xl">Protótipo Visual Figma Disponível</h3>
                        <p className="text-sm text-violet-800/80 font-medium">Acesse o protótipo visual, revise as telas e aprove o design para iniciar o desenvolvimento.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 flex-wrap justify-center shrink-0">
                      {projeto.figma_link && <a href={projeto.figma_link} target="_blank" rel="noopener noreferrer" className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold px-8 py-4 rounded-2xl text-xs transition shadow-lg shadow-violet-600/20 active:scale-95">Ver Protótipo no Figma</a>}
                      <button onClick={handleAprovarDesign} disabled={carregandoAcao} className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-8 py-4 rounded-2xl text-xs transition shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50">Aprovar Design</button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* GRID PRINCIPAL: KANBAN / TIMELINE E FINANCEIRO / RECURSOS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">

                  {/* ESCOPO & ENTREGÁVEIS DO PROJETO (SUBSTITUINDO O QUADRO SINTÉTICO, MANTENDO LINK DO TRELLO) */}
                  <div className="bg-white/90 border border-slate-200/90 rounded-[3rem] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-2xl space-y-8">
                    <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Escopo & Especificação do Projeto</h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Recursos contratados, visão geral e acompanhamento da engenharia Dott.</p>
                      </div>
                      {projeto.trello_link ? (
                        <a 
                          href={projeto.trello_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2.5 text-xs font-black text-indigo-700 uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 px-5 py-3 rounded-2xl border border-indigo-200 shadow-xs transition active:scale-95"
                        >
                          <svg className="w-4 h-4 fill-current text-indigo-600" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8V7h4v10zm6-5h-4V7h4v5z"/>
                          </svg>
                          <span>Abrir Quadro no Trello</span>
                        </a>
                      ) : (
                        <span className="text-xs font-extrabold text-slate-400 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
                          📌 Trello em Configuração
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Entregáveis Principais */}
                      <div className="bg-slate-50/90 border border-slate-200/80 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                            🎯
                          </div>
                          <h4 className="font-black text-slate-900 text-base">Entregáveis Garantidos</h4>
                        </div>
                        
                        <ul className="space-y-3 text-xs font-semibold text-slate-700">
                          <li className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Interface visual responsiva para Celulares, Tablets e PCs</span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Protótipo exclusivo de alta fidelidade desenvolvido no Figma</span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Integração de pagamentos Pix com conciliação automática</span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Arquitetura de alto desempenho, SEO e segurança SSL</span>
                          </li>
                        </ul>
                      </div>

                      {/* Resumo do Escopo / Briefing */}
                      <div className="bg-slate-50/90 border border-slate-200/80 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm">
                            📄
                          </div>
                          <h4 className="font-black text-slate-900 text-base">Briefing Solicitado</h4>
                        </div>
                        
                        <div className="text-xs text-slate-700 font-mono font-medium leading-relaxed bg-white border border-slate-200 rounded-xl p-4 max-h-36 overflow-y-auto scrollbar-thin shadow-xs">
                          {projeto.mensagem || "Descrição das funcionalidades alinhadas para desenvolvimento."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIMELINE */}
                  <div className="bg-white/90 border border-slate-200/90 rounded-[3rem] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-2xl space-y-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Linha do Tempo</h3>
                    <div className="relative pl-10 space-y-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                      <TimelineNode title="Briefing & Análise" desc="Especificação e alinhamento inicial do escopo do projeto." date={formatarData(projeto.criadoEm)} status="DONE" />
                      <TimelineNode title="Assinatura Digital" desc="Documentação jurídica assinada digitalmente." date={projeto.contrato_assinado ? "Assinado" : "Pendente"} status={projeto.contrato_assinado ? "DONE" : "TODO"} />
                      <TimelineNode title="UI/UX Design" desc="Criação e aprovação do layout no Figma." date={projeto.designAprovado ? "Aprovado" : "Em execução"} status={projeto.designAprovado ? "DONE" : (projeto.etapa_atual === "DESIGN" ? "DOING" : "TODO")} />
                      <TimelineNode title="Desenvolvimento & Código" desc="Programação responsiva e integração de banco de dados." date="Pendente" status={["DESENVOLVIMENTO", "TESTES", "ENTREGA"].includes(projeto.etapa_atual) ? (projeto.etapa_atual === "DESENVOLVIMENTO" ? "DOING" : "DONE") : "TODO"} />
                      <TimelineNode title="Entrega Final do Projeto" desc="Quitação final e liberação de acessos e arquivos de código." date={totalmentePago ? "Liberado" : "Bloqueado"} status={totalmentePago && projeto.etapa_atual === "ENTREGA" ? "DONE" : (projeto.etapa_atual === "ENTREGA" ? "DOING" : "TODO")} />
                    </div>
                  </div>
                </div>

                <div className="space-y-10">

                  {/* CARTÃO FINANCEIRO */}
                  <div className="bg-white/90 border border-slate-200/90 rounded-[3rem] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-2xl space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">Financeiro</h3>
                    <div className="space-y-4">
                      {projeto.payments.map((pay, idx) => (
                        <div key={pay.id} className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 relative overflow-hidden shadow-xs">
                          {!projeto.contrato_assinado && <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-10 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Aguardando Contrato</div>}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{idx === 0 ? "1. Entrada (50%)" : "2. Parcela Final (50%)"}</span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${pay.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{pay.status === "PAID" ? "✅ PAGO" : "⏳ PENDENTE"}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-slate-900">{formatarMoeda(pay.value)}</span>
                            <span className="text-[11px] text-slate-500 font-bold">{new Date(pay.createdAt).toLocaleDateString()}</span>
                          </div>
                          {pay.status === "PENDING" && pay.method === "PIX" && (
                            <button onClick={() => { setPixSelecionado(pay.pixQrcode || ""); setModalPixAberto(true); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-xl text-xs transition active:scale-95 shadow-md shadow-indigo-600/20">Pagar com Pix</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RECURSOS E ENTREGA FINAL (REGRA DE LIBERAÇÃO APÓS PAGAMENTO FINAL) */}
                  <div className="bg-white/90 border border-slate-200/90 rounded-[3rem] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-2xl space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">Arquivos & Acessos</h3>

                    {totalmentePago ? (
                      /* LIBERADO APÓS QUITAÇÃO FINAL */
                      <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                          <span className="text-lg">🎉</span>
                          Projeto 100% Quitado! Todos os arquivos e acessos foram liberados.
                        </div>
                        {projeto.figma_link && (
                          <a href={projeto.figma_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-2xl transition group">
                            <span className="text-sm font-black text-indigo-900">Protótipo Figma</span>
                            <svg className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth={2.5} /></svg>
                          </a>
                        )}
                        {projeto.trello_link && (
                          <a href={projeto.trello_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition group">
                            <span className="text-sm font-black text-blue-900">Quadro Trello</span>
                            <svg className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth={2.5} /></svg>
                          </a>
                        )}
                      </div>
                    ) : (
                      /* BLOQUEADO ATÉ PAGAR A QUANTIDADE FINAL */
                      <div className="p-6 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-4 text-center">
                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
                          🔒
                        </div>
                        <div>
                          <h4 className="font-black text-amber-950 text-base">Projeto Bloqueado para Entrega</h4>
                          <p className="text-xs text-amber-800/80 font-medium leading-relaxed mt-1">
                            Conforme o alinhamento comercial, a entrega final dos arquivos, códigos-fonte e credenciais do projeto é liberada após a quitação da parcela final.
                          </p>
                        </div>
                        {pagamentoPendente && (
                          <button onClick={() => { setPixSelecionado(pagamentoPendente.pixQrcode || ""); setModalPixAberto(true); }} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-amber-600/20 active:scale-95">
                            Pagar Parcela Final ({formatarMoeda(pagamentoPendente.value)})
                          </button>
                        )}
                      </div>
                    )}

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-inner">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previsão de Entrega</span>
                      <p className="text-xl font-black text-indigo-600">{formatarData(projeto.dataEntrega)}</p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-32 bg-white/70 border border-slate-200 rounded-[3.5rem] backdrop-blur-xl">
              <h2 className="text-3xl font-black text-slate-900">Nenhum projeto encontrado.</h2>
              <p className="text-lg text-slate-500 mt-3 font-medium">Cadastre um briefing para iniciar o acompanhamento.</p>
              <div className="mt-10">
                <a href="/criar-projeto" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition active:scale-95">Criar Proposta</a>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* MODAL PIX PAGO COM BOTAO SIMULAR CONFIRMAÇÃO */}
      {modalPixAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="pix-modal-title">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 w-full max-w-md p-8 md:p-10 rounded-[3rem] shadow-2xl flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 id="pix-modal-title" className="font-black text-slate-900 text-2xl">Pagamento via Pix</h3>
              <button onClick={() => setModalPixAberto(false)} className="text-slate-400 hover:text-slate-900 text-3xl font-light leading-none transition" aria-label="Fechar modal">&times;</button>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 shadow-inner flex justify-center">
              <svg className="w-40 h-40 text-slate-900" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2 2h2v-2h2v2h-2v2h-2v-2zm-2-4h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-8 0h2v2H9v-2zm0-2h2v2H9V9zm2 2h2v2h-2v-2z" /></svg>
            </div>

            <div className="w-full space-y-4">
              <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <input type="text" readOnly value={pixSelecionado || ""} className="bg-transparent text-xs font-bold text-slate-600 outline-none truncate flex-1" aria-label="Código PIX" />
                <button
                  onClick={() => { if (pixSelecionado) { navigator.clipboard.writeText(pixSelecionado); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } }}
                  className={`text-[10px] font-black uppercase px-5 py-3 rounded-xl transition ${copiado ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"}`}
                >
                  {copiado ? "Copiado!" : "Copiar Pix"}
                </button>
              </div>

              <button onClick={() => {
                const p = projeto?.payments.find(p => p.status === "PENDING");
                if (p) {
                  handlePagarFatura(p.id);
                  setModalPixAberto(false);
                }
              }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-2xl text-sm transition active:scale-95 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2">
                <span>⚡ Simular Confirmação de Pagamento</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function TimelineNode({ title, desc, date, status }: { title: string; desc: string; date: string; status: "DONE" | "DOING" | "TODO" }) {
  return (
    <div className="relative flex flex-col space-y-2">
      <div className={`absolute left-[-33px] top-1 w-5 h-5 rounded-full border-[5px] ${status === "DONE" ? "bg-emerald-600 border-emerald-100 shadow-md shadow-emerald-600/20" :
          status === "DOING" ? "bg-indigo-600 border-indigo-100 shadow-xl shadow-indigo-600/30 animate-pulse" :
            "bg-white border-slate-200 shadow-xs"
        }`} aria-hidden="true" />
      <div className="flex items-center justify-between">
        <h4 className={`text-base font-black tracking-tight ${status === "DONE" ? "text-slate-900" : status === "DOING" ? "text-indigo-600" : "text-slate-400"}`}>{title}</h4>
        <span className={`text-[10px] font-black uppercase tracking-widest ${status === "DONE" ? "text-emerald-700" : status === "DOING" ? "text-indigo-600" : "text-slate-300"}`}>{date}</span>
      </div>
      <p className={`text-xs leading-relaxed font-medium ${status === "DONE" ? "text-slate-600" : "text-slate-400"}`}>{desc}</p>
    </div>
  );
}

export default Dashboard;
