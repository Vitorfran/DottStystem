import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Briefing {
  id: number;
  nome: string;
  email: string;
  mensagem: string;
  criadoEm: string;
}

interface ClienteInfo {
  id: number;
  nome: string;
  email: string;
}

interface Projeto {
  id: number;
  nome: string;
  etapa_atual: string;
  mensagem: string;
  figma_link?: string | null;
  trello_link?: string | null;
  contrato_link?: string | null;
  dataEntrega?: string | null;
  contrato_assinado: boolean;
  designAprovado: boolean;
  criadoEm: string;
  cliente: ClienteInfo;
  responsavel?: ClienteInfo | null;
  payments: { id: number; value: string; status: string; method: string }[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ETAPAS = ["BRIEFING", "DESIGN", "DESENVOLVIMENTO", "TESTES", "ENTREGA"];

const ETAPA_META: Record<string, { cor: string; bg: string; border: string; glow: string; text: string; icon: string }> = {
  BRIEFING:        { cor: "from-slate-600 to-slate-700",   bg: "bg-slate-950/60",   border: "border-slate-800",   glow: "shadow-slate-500/5",   text: "text-slate-400",   icon: "📋" },
  DESIGN:          { cor: "from-violet-600 to-indigo-600",  bg: "bg-violet-950/40",  border: "border-violet-800/40", glow: "shadow-violet-500/10",  text: "text-violet-400",  icon: "🎨" },
  DESENVOLVIMENTO: { cor: "from-blue-600 to-cyan-600",    bg: "bg-blue-950/40",    border: "border-blue-800/40",   glow: "shadow-blue-500/10",    text: "text-blue-400",    icon: "💻" },
  TESTES:          { cor: "from-amber-600 to-orange-600",   bg: "bg-amber-950/40",   border: "border-amber-800/40",  glow: "shadow-amber-500/10",   text: "text-amber-400",   icon: "🧪" },
  ENTREGA:         { cor: "from-emerald-600 to-teal-600", bg: "bg-emerald-950/40", border: "border-emerald-800/40",glow: "shadow-emerald-500/10", text: "text-emerald-400", icon: "🚀" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function corAvatar(nome: string) {
  const cores = [
    "from-violet-600 to-indigo-600",
    "from-blue-600 to-cyan-600",
    "from-emerald-600 to-teal-600",
    "from-rose-600 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-fuchsia-600 to-violet-600",
  ];
  const i = nome.charCodeAt(0) % cores.length;
  return cores[i];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<"briefings" | "todos" | "meus">("briefings");
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [meuId, setMeuId] = useState<number | null>(null);
  const [meuNome, setMeuNome] = useState("");

  const [editando, setEditando] = useState<Record<number, { figma_link: string; trello_link: string; contrato_link: string; etapa_atual: string; dataEntrega: string }>>({});
  const [salvando, setSalvando] = useState<Record<number, boolean>>({});
  const [assumindo, setAssumindo] = useState<Record<number, boolean>>({});
  const [aprovando, setAprovando] = useState<Record<number, boolean>>({});
  const [expandido, setExpandido] = useState<Record<number, boolean>>({});
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  // Estados do Modal de Aprovação / Proposta
  const [modalAprovacaoAberto, setModalAprovacaoAberto] = useState(false);
  const [briefingSelecionado, setBriefingSelecionado] = useState<Briefing | null>(null);
  const [formNomeProjeto, setFormNomeProjeto] = useState("");
  const [formValorTotal, setFormValorTotal] = useState(5000);
  const [formValorEntrada, setFormValorEntrada] = useState(2500);
  const [formValorFinal, setFormValorFinal] = useState(2500);
  const [formContratoLink, setFormContratoLink] = useState("https://zapsign.com.br/sign/dott-system-contrato-modelo");
  const [formTrelloLink, setFormTrelloLink] = useState("");

  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const mostrarSucesso = (msg: string) => {
    setMsgSucesso(msg);
    setTimeout(() => setMsgSucesso(null), 3500);
  };

  const carregarTudo = useCallback(async () => {
    if (!token) { navigate("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMeuId(payload.id);
    } catch { /* ignore */ }

    try {
      const [resBriefings, resProjetos, resMe] = await Promise.all([
        fetch(`${apiUrl}/api/admin/briefings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/projetos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resBriefings.status === 403 || resProjetos.status === 403) {
        alert("Acesso restrito."); navigate("/login"); return;
      }

      const [dataBriefings, dataProjetos, dataMe] = await Promise.all([
        resBriefings.json(), resProjetos.json(), resMe.ok ? resMe.json() : null,
      ]);

      setBriefings(dataBriefings.briefings || []);
      setProjetos(dataProjetos.projetos || []);
      if (dataMe?.usuario) setMeuNome(dataMe.usuario.nome.split(" ")[0]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl, navigate]);

  useEffect(() => { carregarTudo(); }, [carregarTudo]);

  const handleAbrirAprovacao = (b: Briefing) => {
    setBriefingSelecionado(b);
    setFormNomeProjeto(`Projeto ${b.nome}`);
    setFormValorTotal(5000);
    setFormValorEntrada(2500);
    setFormValorFinal(2500);
    setFormContratoLink("https://zapsign.com.br/sign/dott-system-contrato-modelo");
    setFormTrelloLink("");
    setModalAprovacaoAberto(true);
  };

  const handleValorTotalChange = (val: number) => {
    setFormValorTotal(val);
    setFormValorEntrada(Math.round(val / 2));
    setFormValorFinal(Math.round(val / 2));
  };

  const handleConfirmarAprovacao = async () => {
    if (!briefingSelecionado) return;
    const id = briefingSelecionado.id;
    setAprovando(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${apiUrl}/api/admin/aprovar-contato/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formNomeProjeto,
          valorTotal: formValorTotal,
          valorEntrada: formValorEntrada,
          valorFinal: formValorFinal,
          trelloLink: formTrelloLink,
          contratoLink: formContratoLink
        })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarSucesso("✅ Projeto criado e e-mail enviado ao cliente!");
        setModalAprovacaoAberto(false);
        setBriefingSelecionado(null);
        await carregarTudo();
      }
      else alert(data.message || "Erro ao aprovar briefing.");
    } finally { setAprovando(prev => ({ ...prev, [id]: false })); }
  };

  const handleAssumirProjeto = async (id: number) => {
    setAssumindo(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${apiUrl}/api/admin/projetos/${id}/assumir`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) { mostrarSucesso("🙋 Projeto assumido com sucesso!"); await carregarTudo(); }
      else alert(data.message || "Erro ao assumir projeto.");
    } finally { setAssumindo(prev => ({ ...prev, [id]: false })); }
  };

  const handleSalvarProjeto = async (id: number) => {
    const dados = editando[id]; if (!dados) return;
    setSalvando(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${apiUrl}/api/admin/projetos/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          figma_link: dados.figma_link || null,
          trello_link: dados.trello_link || null,
          contrato_link: dados.contrato_link || null,
          etapa_atual: dados.etapa_atual,
          dataEntrega: dados.dataEntrega || null
        }),
      });
      const data = await res.json();
      if (res.ok) {
        mostrarSucesso("💾 Projeto atualizado!");
        setEditando(prev => { const n = { ...prev }; delete n[id]; return n; });
        await carregarTudo();
      } else alert(data.message || "Erro ao salvar.");
    } finally { setSalvando(prev => ({ ...prev, [id]: false })); }
  };

  const formatarData = (d?: string | null) => {
    if (!d) return "A definir";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "A definir" : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatarMoeda = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? "R$ 0" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const meusProjetos = projetos.filter(p => p.responsavel?.id === meuId);
  const projetosSemResponsavel = projetos.filter(p => !p.responsavel);
  const meusProjetosAtivos = meusProjetos.filter(p => p.etapa_atual !== "ENTREGA").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-slate-400 font-semibold text-sm tracking-wide">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
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
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">Painel Interno</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10 px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Briefings: <strong className="text-white">{briefings.length}</strong>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Projetos: <strong className="text-white">{projetos.length}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
              meusProjetosAtivos >= 2
                ? "bg-red-950/60 border-red-800/50 text-red-300"
                : "bg-emerald-950/60 border-emerald-800/50 text-emerald-300"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${meusProjetosAtivos >= 2 ? "bg-red-400 animate-pulse" : "bg-emerald-400"}`} />
              {meusProjetosAtivos}/2 ativos
            </div>
            {meuNome && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${corAvatar(meuNome)} flex items-center justify-center text-[10px] font-black text-white`}>
                  {meuNome[0]}
                </div>
                <span className="text-sm font-semibold text-slate-200">{meuNome}</span>
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

      {/* ── TOAST ───────────────────────────────────────────────────────────── */}
      {msgSucesso && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl shadow-2xl text-sm flex items-center gap-2 animate-bounce">
          {msgSucesso}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ── ABAS DE NAVEGAÇÃO ────────────────────────────────────────────── */}
        <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
          {(["briefings", "todos", "meus"] as const).map(aba => {
            const meta = {
              briefings: { icon: "📥", label: "Briefings Recebidos", count: briefings.length },
              todos:     { icon: "📂", label: "Todos os Projetos",  count: projetos.length },
              meus:      { icon: "🙋", label: "Sob minha Gestão",   count: meusProjetos.length },
            }[aba];
            return (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  abaAtiva === aba
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base leading-none">{meta.icon}</span>
                <span>{meta.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black min-w-[20px] text-center ${
                  abaAtiva === aba ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"
                }`}>
                  {meta.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ABA 1 — BRIEFINGS
        ══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === "briefings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Solicitações de Briefing</h2>
              <p className="text-slate-400 text-sm mt-1">Refine, defina a proposta comercial e aprove para iniciar o onboarding do cliente.</p>
            </div>

            {briefings.length === 0 ? (
              <EmptyState emoji="📭" titulo="Nenhuma solicitação nova" descricao="Quando clientes enviarem propostas pelo site, elas aparecerão aqui para revisão." />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {briefings.map(b => (
                  <BriefingCard
                    key={b.id}
                    briefing={b}
                    aprovando={aprovando[b.id]}
                    expandido={expandido[b.id]}
                    onToggleExpand={() => setExpandido(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                    onAprovar={() => handleAbrirAprovacao(b)}
                    formatarData={formatarData}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ABA 2 — TODOS OS PROJETOS
        ══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === "todos" && (
          <div className="space-y-6">
            <div className="flex justify-between items-end flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Projetos Ativos</h2>
                <p className="text-slate-400 text-sm mt-1">{projetos.length} projetos registrados no sistema</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <Pill cor="amber" texto={`${projetosSemResponsavel.length} sem responsável`} />
                <Pill cor="emerald" texto={`${projetos.length - projetosSemResponsavel.length} com responsável`} />
              </div>
            </div>

            {projetos.length === 0 ? (
              <EmptyState emoji="📂" titulo="Nenhum projeto ativo" descricao="Aprove um briefing comercial para cadastrar o primeiro projeto." />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {projetos.map(p => (
                  <ProjetoCard
                    key={p.id}
                    projeto={p}
                    meuId={meuId}
                    modoAdmin
                    editando={editando[p.id]}
                    salvando={salvando[p.id]}
                    assumindo={assumindo[p.id]}
                    onIniciarEdicao={() => setEditando(prev => ({ ...prev, [p.id]: { figma_link: p.figma_link || "", trello_link: p.trello_link || "", contrato_link: p.contrato_link || "", etapa_atual: p.etapa_atual, dataEntrega: p.dataEntrega ? p.dataEntrega.split("T")[0] : "" } }))}
                    onCancelarEdicao={() => setEditando(prev => { const n = { ...prev }; delete n[p.id]; return n; })}
                    onChangeEdicao={(campo, valor) => setEditando(prev => ({ ...prev, [p.id]: { ...prev[p.id], [campo]: valor } }))}
                    onSalvar={() => handleSalvarProjeto(p.id)}
                    onAssumir={() => handleAssumirProjeto(p.id)}
                    formatarData={formatarData}
                    formatarMoeda={formatarMoeda}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ABA 3 — MEUS PROJETOS
        ══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === "meus" && (
          <div className="space-y-6">
            <div className="flex justify-between items-end flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Meus Projetos Assumidos</h2>
                <p className="text-slate-400 text-sm mt-1">Projetos sob sua responsabilidade direta</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
                meusProjetosAtivos >= 2
                  ? "bg-red-950/50 border-red-800/50 text-red-300"
                  : "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
              }`}>
                {meusProjetosAtivos >= 2 ? "⛔ Limite atingido" : "✅ Carga disponível"} — {meusProjetosAtivos}/2 ativos
              </div>
            </div>

            {meusProjetosAtivos >= 2 && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-2xl p-4 text-sm text-red-300 font-medium flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                Você atingiu o limite de 2 projetos ativos. Finalize ou transfira um projeto para assumir novos.
              </div>
            )}

            {meusProjetos.length === 0 ? (
              <EmptyState emoji="🙋" titulo="Nenhum projeto assumido" descricao='Vá na aba "Todos os Projetos" e clique em "Assumir" para vincular um projeto à sua conta.' />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {meusProjetos.map(p => (
                  <ProjetoCard
                    key={p.id}
                    projeto={p}
                    meuId={meuId}
                    modoAdmin={false}
                    editando={editando[p.id]}
                    salvando={salvando[p.id]}
                    assumindo={assumindo[p.id]}
                    onIniciarEdicao={() => setEditando(prev => ({ ...prev, [p.id]: { figma_link: p.figma_link || "", trello_link: p.trello_link || "", contrato_link: p.contrato_link || "", etapa_atual: p.etapa_atual, dataEntrega: p.dataEntrega ? p.dataEntrega.split("T")[0] : "" } }))}
                    onCancelarEdicao={() => setEditando(prev => { const n = { ...prev }; delete n[p.id]; return n; })}
                    onChangeEdicao={(campo, valor) => setEditando(prev => ({ ...prev, [p.id]: { ...prev[p.id], [campo]: valor } }))}
                    onSalvar={() => handleSalvarProjeto(p.id)}
                    onAssumir={() => handleAssumirProjeto(p.id)}
                    formatarData={formatarData}
                    formatarMoeda={formatarMoeda}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── MODAL DE APROVAÇÃO / PROPOSTA ────────────────────────────────── */}
      {modalAprovacaoAberto && briefingSelecionado && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-5xl p-8 rounded-3xl shadow-2xl flex flex-col space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-xl tracking-tight">Analisar Briefing e Configurar Proposta</h3>
                <p className="text-slate-400 text-xs mt-1">Defina os termos para o cliente: <strong>{briefingSelecionado.nome}</strong></p>
              </div>
              <button 
                onClick={() => setModalAprovacaoAberto(false)} 
                className="text-slate-400 hover:text-white text-2xl font-bold leading-none p-2 rounded-lg hover:bg-white/5 transition"
              >
                &times;
              </button>
            </div>

            {/* Layout 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Coluna Esquerda: Informações do Briefing */}
              <div className="space-y-4 bg-black/20 border border-white/5 p-6 rounded-2xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2">1. Detalhes da Solicitação</h4>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block">Nome do Cliente:</span>
                    <span className="text-slate-200 font-bold">{briefingSelecionado.nome}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">E-mail de Contato:</span>
                    <a href={`mailto:${briefingSelecionado.email}`} className="text-indigo-400 font-semibold hover:text-indigo-300 transition">{briefingSelecionado.email}</a>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Data de Envio:</span>
                    <span className="text-slate-300 font-bold">{formatarData(briefingSelecionado.criadoEm)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Ideia / Escopo:</span>
                    <pre className="mt-2 bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto scrollbar-thin font-sans">
                      {briefingSelecionado.mensagem}
                    </pre>
                  </div>

                  {/* Fotos enviadas pelo cliente */}
                  {(() => {
                    const fotosStr = (briefingSelecionado as any).fotos;
                    if (fotosStr) {
                      try {
                        const fotosList = JSON.parse(fotosStr);
                        if (Array.isArray(fotosList) && fotosList.length > 0) {
                          return (
                            <div className="space-y-2 pt-2">
                              <span className="text-slate-500 font-semibold block">Fotos Anexadas ({fotosList.length}):</span>
                              <div className="flex gap-2 flex-wrap">
                                {fotosList.map((foto: string, idx: number) => (
                                  <a key={idx} href={foto} target="_blank" rel="noopener noreferrer" className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/40 transition bg-black/40">
                                    <img src={foto} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Coluna Direita: Formulário de Configuração */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2">2. Configurações Comerciais</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Nome do Projeto</label>
                    <input
                      type="text"
                      value={formNomeProjeto}
                      onChange={e => setFormNomeProjeto(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="Ex: E-commerce da Dott"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Valor Total (R$)</label>
                      <input
                        type="number"
                        value={formValorTotal}
                        onChange={e => handleValorTotalChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Valor Entrada (R$)</label>
                      <input
                        type="number"
                        value={formValorEntrada}
                        onChange={e => setFormValorEntrada(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Valor Final (R$)</label>
                      <input
                        type="number"
                        value={formValorFinal}
                        onChange={e => setFormValorFinal(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Link do Trello do Projeto</label>
                    <input
                      type="url"
                      value={formTrelloLink}
                      onChange={e => setFormTrelloLink(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="https://trello.com/b/..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Link do Contrato Digital</label>
                    <input
                      type="url"
                      value={formContratoLink}
                      onChange={e => setFormContratoLink(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="https://zapsign.com.br/..."
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
              <button
                onClick={() => setModalAprovacaoAberto(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition border border-white/10 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAprovacao}
                disabled={aprovando[briefingSelecionado.id]}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl text-sm transition disabled:opacity-60 shadow-lg shadow-indigo-950/30 active:scale-[0.98] flex items-center gap-2"
              >
                {aprovando[briefingSelecionado.id] ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Criando projeto...
                  </>
                ) : "Confirmar e Enviar Proposta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Componentes ──────────────────────────────────────────────────────────

function Pill({ cor, texto }: { cor: string; texto: string }) {
  const cores: Record<string, string> = {
    amber: "bg-amber-950/40 border-amber-800/40 text-amber-400",
    emerald: "bg-emerald-950/40 border-emerald-800/40 text-emerald-400",
  };
  return <span className={`px-3 py-1 rounded-full border text-xs font-bold ${cores[cor]}`}>{texto}</span>;
}

function EmptyState({ emoji, titulo, descricao }: { emoji: string; titulo: string; descricao: string }) {
  return (
    <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center space-y-3">
      <div className="text-5xl">{emoji}</div>
      <h3 className="font-bold text-slate-300 text-lg">{titulo}</h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto">{descricao}</p>
    </div>
  );
}

// ─── BriefingCard ─────────────────────────────────────────────────────────────

function BriefingCard({
  briefing: b,
  aprovando,
  expandido,
  onToggleExpand,
  onAprovar,
  formatarData,
}: {
  briefing: Briefing;
  aprovando?: boolean;
  expandido?: boolean;
  onToggleExpand: () => void;
  onAprovar: () => void;
  formatarData: (d?: string | null) => string;
}) {
  const linhas = b.mensagem.split("\n");
  const linhaProjeto = linhas.find(l => l.startsWith("PROJETO:"));
  const nomeProjeto = linhaProjeto ? linhaProjeto.replace("PROJETO:", "").trim() : null;

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/40 hover:bg-white/[0.03] transition-all duration-300 flex flex-col h-full shadow-lg">
      <div className="p-6 flex items-start gap-4 flex-1">
        <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${corAvatar(b.nome)} flex items-center justify-center text-white font-black text-base shadow-lg`}>
          {iniciais(b.nome)}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-white text-lg tracking-tight leading-snug">{b.nome}</h3>
              <a href={`mailto:${b.email}`} className="text-indigo-400 text-sm hover:text-indigo-300 transition mt-0.5 block font-medium">
                {b.email}
              </a>
            </div>
            <span className="text-[10px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
              {formatarData(b.criadoEm)}
            </span>
          </div>

          {nomeProjeto && (
            <div className="inline-flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-900/30 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-indigo-400 font-extrabold uppercase tracking-wider text-[9px]">SOLICITAÇÃO:</span>
              <span className="text-slate-300 font-bold">{nomeProjeto}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-2">
        <div
          className={`relative bg-black/40 rounded-2xl border border-white/5 text-sm text-slate-300 leading-relaxed overflow-hidden transition-all duration-500 ${
            expandido ? "max-h-[500px]" : "max-h-24"
          }`}
        >
          <pre className="p-4 whitespace-pre-wrap break-words font-sans text-xs text-slate-400">{b.mensagem}</pre>
          {!expandido && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0b0f19] to-transparent pointer-events-none" />
          )}
        </div>
        {expandido && (() => {
          const fotosStr = (b as any).fotos;
          if (fotosStr) {
            try {
              const fotosList = JSON.parse(fotosStr);
              if (Array.isArray(fotosList) && fotosList.length > 0) {
                return (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {fotosList.map((foto: string, idx: number) => (
                      <a key={idx} href={foto} target="_blank" rel="noopener noreferrer" className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/40 transition bg-black/40">
                        <img src={foto} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                );
              }
            } catch { /* ignore */ }
          }
          return null;
        })()}
        <button
          onClick={onToggleExpand}
          className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1 font-bold"
        >
          {expandido ? "▲ Recolher briefing" : "▼ Ver briefing completo"}
        </button>
      </div>

      <div className="p-6 pt-4">
        <button
          onClick={onAprovar}
          disabled={aprovando}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-950/20"
        >
          {aprovando ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Configurando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Analisar e Configurar Proposta
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── ProjetoCard ──────────────────────────────────────────────────────────────

interface ProjetoCardProps {
  projeto: Projeto;
  meuId: number | null;
  modoAdmin: boolean;
  editando?: { figma_link: string; trello_link: string; contrato_link: string; etapa_atual: string; dataEntrega: string };
  salvando?: boolean;
  assumindo?: boolean;
  onIniciarEdicao: () => void;
  onCancelarEdicao: () => void;
  onChangeEdicao: (campo: string, valor: string) => void;
  onSalvar: () => void;
  onAssumir: () => void;
  formatarData: (d?: string | null) => string;
  formatarMoeda: (v: string) => string;
}

function ProjetoCard({ projeto: p, meuId, modoAdmin, editando, salvando, assumindo, onIniciarEdicao, onCancelarEdicao, onChangeEdicao, onSalvar, onAssumir, formatarData, formatarMoeda }: ProjetoCardProps) {
  const ehMeu = p.responsavel?.id === meuId;
  const semResponsavel = !p.responsavel;
  const estaEditando = !!editando;
  const meta = ETAPA_META[p.etapa_atual] || ETAPA_META.BRIEFING;
  const indice = ETAPAS.indexOf(p.etapa_atual);
  const progresso = Math.round((indice / (ETAPAS.length - 1)) * 100);

  const totalPago = p.payments.filter(pay => pay.status === "PAID").reduce((acc, pay) => acc + parseFloat(pay.value), 0);
  const totalPendente = p.payments.filter(pay => pay.status === "PENDING").reduce((acc, pay) => acc + parseFloat(pay.value), 0);

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all duration-300 shadow-xl ${
      ehMeu
        ? "border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-slate-900/40"
        : "border-white/5 bg-white/[0.01] hover:border-white/10"
    }`}>
      {/* Barra de progresso */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <div className="p-6 space-y-6">
        {/* Linha Principal do Projeto */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${corAvatar(p.cliente.nome)} flex items-center justify-center text-white font-black text-base shadow-lg`}>
              {iniciais(p.cliente.nome)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-white text-lg tracking-tight leading-none">{p.nome}</h3>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border bg-gradient-to-r ${meta.cor} text-white border-white/10 shadow-sm`}>
                  {meta.icon} {p.etapa_atual}
                </span>
                {ehMeu && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-900/30">
                    👤 Meu
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                Cliente: <strong className="text-slate-300 font-bold">{p.cliente.nome}</strong> · <a href={`mailto:${p.cliente.email}`} className="text-slate-500 hover:text-slate-300 font-semibold">{p.cliente.email}</a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
            {estaEditando ? (
              <div className="flex gap-2">
                <button
                  onClick={onCancelarEdicao}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSalvar}
                  disabled={salvando}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-indigo-950/30"
                >
                  {salvando ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  💾 Salvar
                </button>
              </div>
            ) : (
              <>
                {(modoAdmin || semResponsavel) && semResponsavel && (
                  <button
                    onClick={onAssumir}
                    disabled={assumindo}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-indigo-950/20"
                  >
                    {assumindo ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "🙋"}
                    Assumir Projeto
                  </button>
                )}
                <button
                  onClick={onIniciarEdicao}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 border border-white/10 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-slate-400" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Editar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Informações detalhadas em Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card Prazo */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Prazo de Entrega</span>
            <div className="text-slate-200 text-sm font-bold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatarData(p.dataEntrega)}
            </div>
          </div>

          {/* Card Contrato */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Contrato Digital</span>
            <div className={`text-sm font-bold flex items-center gap-1.5 ${p.contrato_assinado ? "text-emerald-400" : "text-amber-400"}`}>
              {p.contrato_assinado ? (
                <>
                  <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Assinado
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 stroke-current animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pendente
                </>
              )}
            </div>
          </div>

          {/* Card Financeiro */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Financeiro</span>
            <div className="text-xs font-bold text-slate-300 space-y-0.5">
              {totalPago > 0 && <p className="text-emerald-400">💰 {formatarMoeda(String(totalPago))} recebido</p>}
              {totalPendente > 0 && <p className="text-amber-400">⏳ {formatarMoeda(String(totalPendente))} pendente</p>}
              {totalPago === 0 && totalPendente === 0 && <p className="text-slate-500">Sem faturas</p>}
            </div>
          </div>

          {/* Card Links */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Acessos Rápidos</span>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-bold pt-0.5">
              {p.figma_link ? (
                <a href={p.figma_link} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition flex items-center gap-1">
                  <span>Figma</span>
                </a>
              ) : <span className="text-slate-600">Figma (Pendente)</span>}
              {p.trello_link ? (
                <a href={p.trello_link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
                  <span>Trello</span>
                </a>
              ) : <span className="text-slate-600">Trello (Pendente)</span>}
              <a href={`/dashboard?projectId=${p.id}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 border-l border-white/10 pl-3">
                <svg className="w-3 h-3 text-emerald-400 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Ver como Cliente</span>
              </a>
            </div>
          </div>

        </div>

        {/* Painel de edição inline */}
        {estaEditando && editando && (
          <div className="border-t border-white/5 pt-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Dados do Projeto</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Link do Figma</label>
                <input
                  type="url"
                  value={editando.figma_link}
                  onChange={e => onChangeEdicao("figma_link", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
                  placeholder="https://figma.com/file/..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Link do Trello</label>
                <input
                  type="url"
                  value={editando.trello_link}
                  onChange={e => onChangeEdicao("trello_link", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
                  placeholder="https://trello.com/b/..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Link do Contrato</label>
                <input
                  type="url"
                  value={editando.contrato_link}
                  onChange={e => onChangeEdicao("contrato_link", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
                  placeholder="https://zapsign.com.br/..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Fase do Projeto</label>
                <select
                  value={editando.etapa_atual}
                  onChange={e => onChangeEdicao("etapa_atual", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                >
                  {ETAPAS.map(e => (
                    <option key={e} value={e} className="bg-slate-900">{ETAPA_META[e]?.icon} {e.charAt(0) + e.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Prazo de Entrega</label>
                <input
                  type="date"
                  value={editando.dataEntrega}
                  onChange={e => onChangeEdicao("dataEntrega", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>

            {/* Briefing */}
            <div className="bg-black/20 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed max-h-24 overflow-y-auto border border-white/5">
              <span className="text-slate-300 font-semibold block mb-1">📄 Briefing de Ideia:</span>
              {p.mensagem}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
