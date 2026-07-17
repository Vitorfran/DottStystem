import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  BRIEFING:        { cor: "text-slate-300",   bg: "bg-slate-900/60",   border: "border-slate-800",   glow: "shadow-slate-500/10",   emoji: "📋", desc: "Alinhamento e Escopo" },
  DESIGN:          { cor: "text-violet-300",  bg: "bg-violet-950/40",  border: "border-violet-800/50", glow: "shadow-violet-500/20",  emoji: "🎨", desc: "Protótipo Visual Figma" },
  DESENVOLVIMENTO: { cor: "text-blue-300",    bg: "bg-blue-950/40",    border: "border-blue-800/50",   glow: "shadow-blue-500/20",    emoji: "💻", desc: "Programação do Sistema" },
  TESTES:          { cor: "text-amber-300",   bg: "bg-amber-950/40",   border: "border-amber-800/50",  glow: "shadow-amber-500/20",   emoji: "🧪", desc: "Homologação e Ajustes" },
  ENTREGA:         { cor: "text-emerald-300", bg: "bg-emerald-950/40", border: "border-emerald-800/50",glow: "shadow-emerald-500/20", emoji: "🚀", desc: "Publicação e Entrega" },
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

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // ── Carregamento ──────────────────────────────────────────────────────────
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

  // ── Ações ─────────────────────────────────────────────────────────────────
  const acao = async (url: string) => {
    const token = localStorage.getItem("token");
    setCarregandoAcao(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (res.ok) { 
        buscarDados(); 
      }
      else { const d = await res.json(); alert(d.message || "Erro."); }
    } catch { alert("Erro de conexão."); }
    finally { setCarregandoAcao(false); }
  };

  const handleAssinarContrato = () => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/assinar-contrato`);
  const handlePagarFatura = (payId: number) => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/pagar-fatura/${payId}`);
  const handleAprovarDesign = () => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/aprovar-design`);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatarMoeda = (v: string) => { const n = parseFloat(v); return isNaN(n) ? "R$ 0,00" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  const formatarData = (d?: string | null) => { if (!d) return "A definir"; const dt = new Date(d); return isNaN(dt.getTime()) ? "A definir" : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }); };
  const primeiroNome = usuario?.nome?.split(" ")[0] || "Cliente";

  // ── Geração do Kanban Interno do Trello ───────────────────────────────────
  const obterCardsKanban = (etapa: string) => {
    const etapaUpper = etapa.toUpperCase();
    
    const todosCards = [
      { id: 1, title: "Estruturação da Ideia (IA)", desc: "Refinamento do escopo inicial da proposta através da nossa inteligência artificial.", tag: "Briefing", col: "DONE" },
      { id: 2, title: "Alinhamento de Requisitos", desc: "Definição de todas as funcionalidades e fluxos do usuário.", tag: "Briefing", col: etapaUpper === "BRIEFING" ? "REVIEW" : "DONE" },
      { id: 3, title: "Assinatura do Contrato", desc: "Assinatura digital do contrato de prestação de serviços no painel.", tag: "Contrato", col: projeto?.contrato_assinado ? "DONE" : (etapaUpper === "BRIEFING" ? "DOING" : "TODO") },
      { id: 4, title: "Pagamento da Entrada", desc: "Liberação financeira através da compensação do Pix de entrada.", tag: "Financeiro", col: (projeto && projeto.payments.length > 0 && projeto.payments[0].status === "PAID") ? "DONE" : (etapaUpper === "BRIEFING" && projeto?.contrato_assinado ? "DOING" : "TODO") },
      
      { id: 5, title: "Wireframes do Sistema", desc: "Desenho da estrutura de navegação e blocos de conteúdo das telas.", tag: "Design", col: etapaUpper === "BRIEFING" ? "TODO" : (etapaUpper === "DESIGN" && !projeto?.designAprovado ? "DOING" : "DONE") },
      { id: 6, title: "Protótipo Figma Alta Fidelidade", desc: "Criação visual completa do layout com a identidade da marca.", tag: "Design", col: etapaUpper === "BRIEFING" ? "TODO" : (etapaUpper === "DESIGN" && !projeto?.designAprovado ? "DOING" : "DONE") },
      { id: 7, title: "Aprovação do Layout", desc: "Validação final do design visual pelo cliente para início do código.", tag: "Design", col: etapaUpper === "BRIEFING" ? "TODO" : (etapaUpper === "DESIGN" && !projeto?.designAprovado ? "REVIEW" : "DONE") },
      
      { id: 8, title: "Modelagem do Banco de Dados", desc: "Estruturação das tabelas de banco de dados e relacionamentos.", tag: "Back-end", col: ["BRIEFING", "DESIGN"].includes(etapaUpper) ? "TODO" : (etapaUpper === "DESENVOLVIMENTO" ? "DOING" : "DONE") },
      { id: 9, title: "Programação das Telas (React)", desc: "Construção de toda a interface visual responsiva e interativa.", tag: "Front-end", col: ["BRIEFING", "DESIGN"].includes(etapaUpper) ? "TODO" : (etapaUpper === "DESENVOLVIMENTO" ? "DOING" : "DONE") },
      { id: 10, title: "Integração das APIs", desc: "Conexão entre o front-end visual e o back-end com regras de negócio.", tag: "Integração", col: ["BRIEFING", "DESIGN"].includes(etapaUpper) ? "TODO" : (etapaUpper === "DESENVOLVIMENTO" ? "DOING" : "DONE") },
      
      { id: 11, title: "Testes de Usabilidade & Performance", desc: "Garantia de carregamento ágil e fluidez em todos os dispositivos.", tag: "Testes", col: ["BRIEFING", "DESIGN", "DESENVOLVIMENTO"].includes(etapaUpper) ? "TODO" : (etapaUpper === "TESTES" ? "DOING" : "DONE") },
      { id: 12, title: "Ajustes de Homologação", desc: "Implementação de feedbacks de testes enviados pelo cliente.", tag: "Testes", col: ["BRIEFING", "DESIGN", "DESENVOLVIMENTO"].includes(etapaUpper) ? "TODO" : (etapaUpper === "TESTES" ? "REVIEW" : "DONE") },
      
      { id: 13, title: "Configuração do Servidor Oficial", desc: "Preparação da hospedagem e apontamento do domínio oficial.", tag: "Lançamento", col: etapaUpper !== "ENTREGA" ? "TODO" : "DOING" },
      { id: 14, title: "Entrega das Chaves & Acesso", desc: "Fornecimento de códigos, credenciais de administração e vídeo explicativo.", tag: "Lançamento", col: etapaUpper !== "ENTREGA" ? "TODO" : "REVIEW" }
    ];

    return {
      TODO: todosCards.filter(c => c.col === "TODO"),
      DOING: todosCards.filter(c => c.col === "DOING"),
      REVIEW: todosCards.filter(c => c.col === "REVIEW"),
      DONE: todosCards.filter(c => c.col === "DONE")
    };
  };

  // ── Render Shell ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans flex flex-col">
      
      {/* ── HEADER CUSTOMIZADO ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080c14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-900/50">
              D
            </div>
            <div className="leading-none">
              <span className="font-extrabold text-white">Dott</span>
              <span className="font-extrabold text-indigo-400">.</span>
              <span className="font-extrabold text-white">System</span>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">Espaço do Cliente</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="/" className="text-xs text-slate-400 hover:text-white transition hidden sm:inline-block">Home</a>
            <a href="/about" className="text-xs text-slate-400 hover:text-white transition hidden sm:inline-block">Sobre</a>
            {usuario && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                  {usuario.nome[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-200">{usuario.nome.split(" ")[0]}</span>
              </div>
            )}
            <button
              onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-10 space-y-8">

        {/* ── BOAS-VINDAS & SUPORTE ────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {loading ? (
              <div className="h-9 w-56 bg-white/5 animate-pulse rounded-xl" />
            ) : (
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Olá, {primeiroNome}! 👋
              </h1>
            )}
            <p className="text-slate-400 mt-1.5 text-sm">
              {projeto
                ? `Acompanhe em tempo real o desenvolvimento do seu projeto: ${projeto.nome}`
                : "Seu espaço pessoal na Dott System."}
            </p>
          </div>

          <a
            href={projeto
              ? `https://wa.me/5547999990000?text=${encodeURIComponent(`Olá Dott System! Sou o ${usuario?.nome} e gostaria de falar sobre o projeto "${projeto.nome}".`)}`
              : "https://wa.me/5547999990000?text=Ol%C3%A1%20Dott%20System%21%20Acabei%20de%20me%20cadastrar%20e%20quero%20saber%20mais."
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-3 rounded-xl transition active:scale-[0.98] shadow-lg shadow-emerald-950/20 text-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.001-6.647 5.339-11.985 11.951-11.985 3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.948-4.471 9.951-9.958.002-2.66-1.019-5.161-2.877-7.022-1.857-1.859-4.355-2.883-7.01-2.884-5.485 0-9.94 4.47-9.944 9.959-.001 1.845.507 3.636 1.47 5.188L1.15 20.91l4.981-1.306.459.25zm11.302-7.58c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.785-1.07-.958-1.79-2.14-2-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.36.54-.54.18-.18.24-.3.36-.54.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.3-.72-.6-1.12-.81-1.12-.21 0-.45-.03-.69-.03-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.16 5.44.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.7-.1 2.13-.87 2.43-1.72.3-.84.3-1.56.21-1.72-.09-.16-.33-.26-.69-.44z" />
            </svg>
            Falar no WhatsApp
          </a>
        </section>

        {/* ── ALERTA DE ERRO ──────────────────────────────────────────────── */}
        {!loading && erro && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-2xl p-5 text-sm text-red-300 font-medium flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            {erro}
          </div>
        )}

        {/* ── LOADING SKELETON ────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 bg-white/5 rounded-3xl" />
            <div className="h-60 bg-white/5 rounded-3xl" />
            <div className="h-44 bg-white/5 rounded-3xl" />
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ESTADO: CLIENTE SEM PROJETO ATIVO
        ════════════════════════════════════════════════════════════════ */}
        {!loading && !erro && !projeto && (
          <div className="space-y-6">
            <section className="bg-gradient-to-br from-indigo-950/20 to-violet-950/20 border border-white/5 rounded-3xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner relative z-10">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
              </div>
              <div className="relative z-10 max-w-md mx-auto space-y-2">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Estamos montando sua proposta!</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Recebemos os seus dados de contato e briefing. Nossa equipe está estruturando a proposta de escopo e precificação do projeto. Você receberá um aviso por e-mail em breve.
                </p>
              </div>

              <div className="flex justify-between items-center max-w-lg mx-auto pt-6 border-t border-white/5 relative z-10">
                {ETAPAS.map((etapa, idx) => (
                  <div key={etapa} className="flex flex-col items-center gap-2 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border ${
                      idx === 0 ? "border-indigo-500/40 bg-indigo-950 text-indigo-400" : "border-white/5 bg-white/[0.02] text-slate-600"
                    }`}>
                      {idx + 1}
                    </div>
                    <p className={`text-[10px] font-bold tracking-wider uppercase ${idx === 0 ? "text-indigo-400" : "text-slate-600"}`}>
                      {etapa.charAt(0) + etapa.slice(1).toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "📋", titulo: "Revisão do Briefing", desc: "Análise técnica do seu áudio/texto para projetar a melhor arquitetura de software." },
                { icon: "✍️", titulo: "Contrato Digital", desc: "Link direto da ZapSign para assinar online e com validade jurídica." },
                { icon: "🚀", titulo: "Início Garantido", desc: "A liberação do desenvolvimento ocorre imediatamente após a confirmação da entrada." },
              ].map(item => (
                <div key={item.titulo} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-3 hover:border-white/10 transition-all duration-300">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="font-bold text-white text-sm">{item.titulo}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ESTADO: CLIENTE COM PROJETO ATIVO
        ════════════════════════════════════════════════════════════════ */}
        {!loading && !erro && projeto && (() => {
          const indiceEtapa = ETAPAS.indexOf(projeto.etapa_atual.toUpperCase());
          const precisaContrato = !projeto.contrato_assinado;
          const primeiroFatPendente = projeto.payments.length > 0 && projeto.payments[0].status === "PENDING";
          const metaEtapa = ETAPA_META[projeto.etapa_atual] || ETAPA_META.BRIEFING;
          const kanbanColumns = obterCardsKanban(projeto.etapa_atual);

          return (
            <div className="space-y-8">
              
              {/* ── BARRA DE PROGRESSO & STEPPER ────────────────────────────────── */}
              <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl shadow-xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
                <div className="flex justify-between items-center flex-wrap gap-4 relative z-10">
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">FASE ATUAL</span>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">{metaEtapa.emoji} {metaEtapa.desc}</h2>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${metaEtapa.bg} ${metaEtapa.cor} ${metaEtapa.border} shadow-lg ${metaEtapa.glow}`}>
                    {projeto.etapa_atual}
                  </span>
                </div>

                {/* Stepper Visual */}
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 pt-4">
                  {/* Linha de progresso de fundo */}
                  <div className="absolute top-[22px] left-0 w-full h-[3px] bg-white/5 hidden md:block z-0" />
                  <div className="absolute top-[22px] left-0 h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500 hidden md:block z-0 transition-all duration-700"
                    style={{ width: `${(indiceEtapa / (ETAPAS.length - 1)) * 100}%` }} />

                  {ETAPAS.map((etapa, idx) => {
                    const concluida = idx < indiceEtapa;
                    const ativa = idx === indiceEtapa;

                    return (
                      <div key={etapa} className="flex flex-row md:flex-col items-center gap-4 z-10 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border transition-all duration-300 ${
                          concluida 
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-950/30"
                            : ativa 
                              ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/60 scale-110"
                              : "bg-slate-900 border-white/5 text-slate-500"
                        }`}>
                          {concluida ? (
                            <svg className="w-5 h-5 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : idx + 1}
                        </div>
                        <div className="text-left md:text-center">
                          <p className={`font-bold text-sm leading-tight ${ativa ? "text-white" : concluida ? "text-slate-300" : "text-slate-500"}`}>
                            {etapa.charAt(0) + etapa.slice(1).toLowerCase()}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {ativa ? "Em Andamento" : concluida ? "Concluído" : "Pendente"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── SEÇÃO DE ALERTAS DE AÇÃO ────────────────────────────────────── */}
              {precisaContrato && (
                <section className="bg-gradient-to-r from-amber-950/30 to-orange-950/20 border-l-4 border-amber-500 border-t border-r border-b border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-500/5 blur-3xl pointer-events-none" />
                  <div className="space-y-1 relative z-10">
                    <h3 className="font-extrabold text-amber-300 text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500" />
                      Assinatura de Contrato Requerida
                    </h3>
                    <p className="text-sm text-slate-400">Revisar e assinar a documentação jurídica digital para registrar o projeto.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap shrink-0 relative z-10">
                    <a href={projeto.contrato_link || "#"} target="_blank" rel="noopener noreferrer"
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition active:scale-95 shadow-lg shadow-amber-950/30">
                      Ler e Assinar
                    </a>
                    <button onClick={handleAssinarContrato} disabled={carregandoAcao}
                      className="bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-800/40 font-bold px-6 py-3 rounded-xl text-sm transition active:scale-95 disabled:opacity-50">
                      Simular Assinatura
                    </button>
                  </div>
                </section>
              )}

              {!precisaContrato && primeiroFatPendente && (
                <section className="bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border-l-4 border-blue-500 border-t border-r border-b border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none" />
                  <div className="space-y-1 relative z-10">
                    <h3 className="font-extrabold text-blue-300 text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-lg shadow-blue-400" />
                      Pagamento da Entrada Pendente (PIX)
                    </h3>
                    <p className="text-sm text-slate-400">Realize a compensação do Pix de sinal (50%) para liberar o time de UI/UX.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap shrink-0 relative z-10">
                    <button onClick={() => { const f = projeto.payments[0]; if (f) { setPixSelecionado(f.pixQrcode || ""); setModalPixAberto(true); setCopiado(false); } }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition active:scale-95 shadow-lg shadow-indigo-950/30">
                      Ver QR Code Pix
                    </button>
                    <button onClick={() => { const f = projeto.payments[0]; if (f) handlePagarFatura(f.id); }} disabled={carregandoAcao}
                      className="bg-white/5 hover:bg-white/10 text-blue-300 border border-blue-800/40 font-bold px-6 py-3 rounded-xl text-sm transition active:scale-95 disabled:opacity-50">
                      Simular Pix
                    </button>
                  </div>
                </section>
              )}

              {projeto.etapa_atual.toUpperCase() === "DESIGN" && !projeto.designAprovado && (
                <section className="bg-gradient-to-r from-violet-950/30 to-fuchsia-950/20 border-l-4 border-violet-500 border-t border-r border-b border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-violet-500/5 blur-3xl pointer-events-none" />
                  <div className="space-y-1 relative z-10">
                    <h3 className="font-extrabold text-violet-300 text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse shadow-lg shadow-violet-400" />
                      Design de Telas Pronto para Aprovação
                    </h3>
                    <p className="text-sm text-slate-400">O design e protótipo interativo no Figma está finalizado. Revise e aprove para iniciar a programação.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap shrink-0 relative z-10">
                    {projeto.figma_link && (
                      <a href={projeto.figma_link} target="_blank" rel="noopener noreferrer"
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition active:scale-95 shadow-lg shadow-violet-950/30">
                        Visualizar no Figma
                      </a>
                    )}
                    <button onClick={handleAprovarDesign} disabled={carregandoAcao}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-950/30">
                      Aprovar Design
                    </button>
                  </div>
                </section>
              )}

              {/* ── GRID PRINCIPAL: ESQUERDA (TRELLO + LINHA DO TEMPO) / DIREITA (INFO + FINANCEIRO) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUNA ESQUERDA (2/3 de largura) */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* TRELLO BOARD / KANBAN SIMULADO */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">Tarefas Internas (Trello)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Quadro Kanban de tarefas do projeto.</p>
                      </div>
                      
                      {projeto.trello_link ? (
                        <a 
                          href={projeto.trello_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-950/30 flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M19.43 3H4.57C3.7 3 3 3.7 3 4.57v14.86C3 20.3 3.7 21 4.57 21h14.86c.87 0 1.57-.7 1.57-1.57V4.57C21 3.7 20.3 3 19.43 3zM9.9 16.5c0 .6-.5 1.1-1.1 1.1H5.9c-.6 0-1.1-.5-1.1-1.1v-8c0-.6.5-1.1 1.1-1.1h2.9c.6 0 1.1.5 1.1 1.1v8zm8.6-4c0 .6-.5 1.1-1.1 1.1h-2.9c-.6 0-1.1-.5-1.1-1.1v-4c0-.6.5-1.1 1.1-1.1h2.9c.6 0 1.1.5 1.1 1.1v4z"/>
                          </svg>
                          Ver Quadro Oficial no Trello
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                          Quadro Oficial em preparação
                        </span>
                      )}
                    </div>

                    {/* Kanban Board Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                      {(["TODO", "DOING", "REVIEW", "DONE"] as const).map(colKey => {
                        const colMeta = {
                          TODO:   { title: "A Fazer", count: kanbanColumns.TODO.length, border: "border-slate-800", text: "text-slate-400" },
                          DOING:  { title: "Em Andamento", count: kanbanColumns.DOING.length, border: "border-indigo-900/50", text: "text-indigo-400" },
                          REVIEW: { title: "Revisão", count: kanbanColumns.REVIEW.length, border: "border-violet-900/50", text: "text-violet-400" },
                          DONE:   { title: "Concluído", count: kanbanColumns.DONE.length, border: "border-emerald-900/50", text: "text-emerald-400" },
                        }[colKey];

                        const cards = kanbanColumns[colKey];

                        return (
                          <div key={colKey} className="bg-black/30 rounded-2xl p-3 border border-white/5 flex flex-col space-y-3 min-h-[300px]">
                            <div className="flex justify-between items-center px-1">
                              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${colMeta.text}`}>{colMeta.title}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{colMeta.count}</span>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] scrollbar-thin">
                              {cards.length === 0 ? (
                                <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-xl p-6 text-center text-[10px] text-slate-600">
                                  Sem tarefas
                                </div>
                              ) : (
                                cards.map(card => (
                                  <div key={card.id} className="bg-[#0f1422] border border-white/5 hover:border-white/10 rounded-xl p-3 space-y-2 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-md">
                                    <span className="text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-900/50 px-2 py-0.5 rounded-md">
                                      {card.tag}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-200 leading-tight">{card.title}</h4>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">{card.desc}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TIMELINE DE MARCOS / HISTÓRICO DE ATIVIDADES */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Histórico e Marcos do Projeto</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Acompanhe a cronologia das principais entregas e validações.</p>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                      
                      {/* Milestone 1 */}
                      <TimelineNode 
                        title="Briefing Coletado" 
                        desc="A proposta inicial do projeto foi enviada e estruturada através de IA." 
                        date={formatarData(projeto.criadoEm)} 
                        status="DONE" 
                      />

                      {/* Milestone 2 */}
                      <TimelineNode 
                        title="Proposta Comercial Aprovada" 
                        desc="Onboarding gerado e plano financeiro disponibilizado para assinatura." 
                        date={formatarData(projeto.criadoEm)} 
                        status="DONE" 
                      />

                      {/* Milestone 3 */}
                      <TimelineNode 
                        title="Assinatura de Contrato" 
                        desc="Contrato digital assinado por ambas as partes." 
                        date={projeto.contrato_assinado ? "Concluído" : "Pendente"} 
                        status={projeto.contrato_assinado ? "DONE" : (etapaEtapaAtiva(projeto.etapa_atual, "BRIEFING") ? "DOING" : "TODO")} 
                      />

                      {/* Milestone 4 */}
                      <TimelineNode 
                        title="Pagamento de Entrada" 
                        desc="Compensação do Pix de sinal para início dos trabalhos." 
                        date={(projeto.payments.length > 0 && projeto.payments[0].status === "PAID") ? "Confirmado" : "Pendente"} 
                        status={(projeto.payments.length > 0 && projeto.payments[0].status === "PAID") ? "DONE" : (!projeto.contrato_assinado ? "TODO" : "DOING")} 
                      />

                      {/* Milestone 5 */}
                      <TimelineNode 
                        title="Design UI/UX & Protótipo" 
                        desc="Construção visual e fluxo de telas interativas no Figma." 
                        date={projeto.designAprovado ? "Aprovado" : (projeto.figma_link ? "Disponível no Figma" : "Pendente")} 
                        status={projeto.designAprovado ? "DONE" : (projeto.etapa_atual === "DESIGN" ? "DOING" : "TODO")} 
                      />

                      {/* Milestone 6 */}
                      <TimelineNode 
                        title="Desenvolvimento & Código" 
                        desc="Programação da aplicação em ambiente de desenvolvimento." 
                        date={["DESENVOLVIMENTO", "TESTES", "ENTREGA"].includes(projeto.etapa_atual) ? (projeto.etapa_atual === "DESENVOLVIMENTO" ? "Em andamento" : "Concluído") : "Pendente"} 
                        status={["TESTES", "ENTREGA"].includes(projeto.etapa_atual) ? "DONE" : (projeto.etapa_atual === "DESENVOLVIMENTO" ? "DOING" : "TODO")} 
                      />

                      {/* Milestone 7 */}
                      <TimelineNode 
                        title="Homologação & Testes" 
                        desc="Fase de validação do cliente em ambiente de testes da Dott System." 
                        date={projeto.etapa_atual === "TESTES" ? "Disponível para testes" : (projeto.etapa_atual === "ENTREGA" ? "Testado e aprovado" : "Pendente")} 
                        status={projeto.etapa_atual === "ENTREGA" ? "DONE" : (projeto.etapa_atual === "TESTES" ? "DOING" : "TODO")} 
                      />

                      {/* Milestone 8 */}
                      <TimelineNode 
                        title="Entrega & Publicação" 
                        desc="Instalação no domínio oficial e transferência definitiva dos acessos." 
                        date={projeto.etapa_atual === "ENTREGA" ? "Entregue" : "Pendente"} 
                        status={projeto.etapa_atual === "ENTREGA" ? "DONE" : "TODO"} 
                      />
                    </div>
                  </div>

                </div>

                {/* COLUNA DIREITA (1/3 de largura) */}
                <div className="space-y-8">
                  
                  {/* CARD DE DETALHES DO PROJETO */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                    <h3 className="text-base font-bold text-white border-b border-white/5 pb-3">Detalhes Básicos</h3>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nome do Projeto</span>
                        <p className="font-extrabold text-white text-lg mt-0.5">{projeto.nome}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prazo de Entrega Estimado</span>
                        <p className="font-extrabold text-indigo-400 text-base mt-0.5">{formatarData(projeto.dataEntrega)}</p>
                      </div>
                    </div>

                    {/* Figma block */}
                    <div className="relative bg-[#0f1422] p-4 rounded-2xl border border-white/5 overflow-hidden">
                      {(precisaContrato || primeiroFatPendente) && (
                        <div className="absolute inset-0 bg-[#080c14]/90 backdrop-blur-[2px] flex items-center justify-center z-10 px-4 text-center">
                          <span className="bg-[#0f1422] border border-white/10 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5">
                            🔒 Assinatura e entrada requeridas
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-black text-sm">F</div>
                          <div>
                            <h4 className="font-bold text-slate-200 text-xs">Layout Figma</h4>
                            <p className="text-[10px] text-slate-500">Telas interativas</p>
                          </div>
                        </div>
                        {projeto.figma_link ? (
                          <a 
                            href={projeto.figma_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition active:scale-95 shadow-lg shadow-indigo-950/20"
                          >
                            Abrir
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Descrição Briefing */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Proposta de Escopo</span>
                      <div className="bg-black/30 p-4 rounded-2xl text-xs text-slate-400 leading-relaxed border border-white/5 whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin">
                        {projeto.mensagem || "Aguardando definição do escopo."}
                      </div>
                    </div>

                    {/* Fotos de Referência */}
                    {projeto.fotos && (() => {
                      try {
                        const fotosList = JSON.parse(projeto.fotos);
                        if (Array.isArray(fotosList) && fotosList.length > 0) {
                          return (
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fotos de Referência ({fotosList.length})</span>
                              <div className="flex gap-2 flex-wrap">
                                {fotosList.map((foto, idx) => (
                                  <a key={idx} href={foto} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/40 transition bg-black/40">
                                    <img src={foto} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}
                  </div>

                  {/* CARD FINANCEIRO */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
                    <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 mb-4">Painel Financeiro</h3>
                    
                    {projeto.payments.length === 0 ? (
                      <div className="flex-1 py-10 flex items-center justify-center">
                        <p className="text-slate-500 text-xs text-center">Nenhuma cobrança registrada.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1">
                        {projeto.payments.map(pay => {
                          const pendente = pay.status === "PENDING";
                          const pago = pay.status === "PAID";
                          return (
                            <div key={pay.id} className="relative p-4 bg-[#0f1422] rounded-2xl border border-white/5 space-y-3 overflow-hidden">
                              {precisaContrato && (
                                <div className="absolute inset-0 bg-[#080c14]/85 backdrop-blur-[1px] flex items-center justify-center z-10">
                                  <span className="bg-[#0f1422] border border-white/10 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-xl">Contrato Pendente</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{pay.method}</span>
                                <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${
                                  pago 
                                    ? "bg-emerald-950/50 border border-emerald-800 text-emerald-400" 
                                    : pendente 
                                      ? "bg-amber-950/50 border border-amber-800 text-amber-400" 
                                      : "bg-rose-950/50 border border-rose-800 text-rose-400"
                                }`}>
                                  {pay.status === "PENDING" ? "Pendente" : pay.status === "PAID" ? "Compensado" : pay.status}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-baseline">
                                <span className="text-lg font-extrabold text-white">{formatarMoeda(pay.value)}</span>
                                <span className="text-[10px] text-slate-500 font-semibold">{new Date(pay.createdAt).toLocaleDateString("pt-BR")}</span>
                              </div>

                              {pendente && pay.method.toUpperCase() === "PIX" && (
                                <button 
                                  onClick={() => { setPixSelecionado(pay.pixQrcode || ""); setModalPixAberto(true); setCopiado(false); }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition active:scale-[0.98] shadow-lg shadow-indigo-950/30"
                                >
                                  Pagar Pix
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 text-center font-medium">
                      Precisa de nota fiscal ou alteração? Fale com o suporte.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

      </main>

      {/* ── MODAL PIX ───────────────────────────────────────────────────────── */}
      {modalPixAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-md p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-5">
            <div className="w-full flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-extrabold text-white text-lg">Pagamento via PIX</h3>
              <button 
                onClick={() => setModalPixAberto(false)} 
                className="text-slate-400 hover:text-white text-2xl font-bold leading-none p-1.5 rounded-lg hover:bg-white/5 transition"
              >
                &times;
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-white/10 shadow-lg">
              <svg className="w-36 h-36 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2 2h2v-2h2v2h-2v2h-2v-2zm-2-4h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-8 0h2v2H9v-2zm0-2h2v2H9V9zm2 2h2v2h-2v-2z" />
              </svg>
            </div>
            <p className="text-xs text-slate-400 text-center leading-relaxed">Escaneie o QR Code acima pelo app do seu banco ou copie o código Pix abaixo.</p>
            
            <div className="w-full bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-3">
              <input type="text" readOnly value={pixSelecionado || ""} className="bg-transparent text-xs text-slate-300 outline-none truncate flex-1 select-all" />
              <button 
                onClick={() => { if (pixSelecionado) { navigator.clipboard.writeText(pixSelecionado); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 shrink-0 ${copiado ? "bg-emerald-600 text-white" : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30"}`}
              >
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
            
            {projeto && (
              <button onClick={() => { const f = projeto.payments[0]; if (f) { handlePagarFatura(f.id); setModalPixAberto(false); } }} disabled={carregandoAcao}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-950/30">
                Simular Confirmação do Pix
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER CUSTOMIZADO ──────────────────────────────────────────────── */}
      <footer className="bg-black/40 border-t border-white/5 py-8 mt-12 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p>© 2026 Dott System. Soluções Digitais de Alta Performance.</p>
          <p>Itajaí - Santa Catarina - Brasil</p>
        </div>
      </footer>

    </div>
  );
}

// ─── Sub-Componentes do Dashboard ──────────────────────────────────────────

function TimelineNode({ title, desc, date, status }: { title: string; desc: string; date: string; status: "DONE" | "DOING" | "TODO" }) {
  return (
    <div className="relative flex flex-col space-y-1.5 pb-6">
      {/* Marcador da Timeline */}
      <div className={`absolute left-[-20px] top-1.5 w-[12px] h-[12px] rounded-full border-2 ${
        status === "DONE" 
          ? "bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/20" 
          : status === "DOING"
            ? "bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500 animate-pulse"
            : "bg-slate-900 border-white/10"
      }`} />
      
      <div className="flex items-baseline justify-between gap-4">
        <h4 className={`text-sm font-bold ${status === "DONE" ? "text-slate-200" : status === "DOING" ? "text-indigo-300" : "text-slate-500"}`}>
          {title}
        </h4>
        <span className={`text-[10px] font-bold ${status === "DONE" ? "text-emerald-400" : status === "DOING" ? "text-indigo-400" : "text-slate-600"}`}>
          {date}
        </span>
      </div>
      <p className={`text-xs ${status === "DONE" ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
        {desc}
      </p>
    </div>
  );
}

function etapaEtapaAtiva(etapaAtual: string, etapaNode: string): boolean {
  const ETAPAS = ["BRIEFING", "DESIGN", "DESENVOLVIMENTO", "TESTES", "ENTREGA"];
  return ETAPAS.indexOf(etapaAtual.toUpperCase()) === ETAPAS.indexOf(etapaNode.toUpperCase());
}

export default Dashboard;
