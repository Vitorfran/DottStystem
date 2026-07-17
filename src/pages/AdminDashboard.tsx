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

const ETAPA_META: Record<string, { cor: string; bg: string; dot: string; emoji: string }> = {
  BRIEFING:      { cor: "text-slate-300",   bg: "bg-slate-800",   dot: "bg-slate-400",   emoji: "📋" },
  DESIGN:        { cor: "text-violet-300",  bg: "bg-violet-950",  dot: "bg-violet-400",  emoji: "🎨" },
  DESENVOLVIMENTO: { cor: "text-blue-300", bg: "bg-blue-950",    dot: "bg-blue-400",    emoji: "💻" },
  TESTES:        { cor: "text-amber-300",   bg: "bg-amber-950",   dot: "bg-amber-400",   emoji: "🧪" },
  ENTREGA:       { cor: "text-emerald-300", bg: "bg-emerald-950", dot: "bg-emerald-400", emoji: "🚀" },
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

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<"briefings" | "todos" | "meus">("briefings");
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [meuId, setMeuId] = useState<number | null>(null);
  const [meuNome, setMeuNome] = useState("");

  const [editando, setEditando] = useState<Record<number, { figma_link: string; etapa_atual: string; dataEntrega: string }>>({});
  const [salvando, setSalvando] = useState<Record<number, boolean>>({});
  const [assumindo, setAssumindo] = useState<Record<number, boolean>>({});
  const [aprovando, setAprovando] = useState<Record<number, boolean>>({});
  const [expandido, setExpandido] = useState<Record<number, boolean>>({});
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

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

  const handleAprovarBriefing = async (id: number) => {
    setAprovando(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${apiUrl}/api/admin/aprovar-contato/${id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) { mostrarSucesso("✅ Projeto criado e e-mail enviado ao cliente!"); await carregarTudo(); }
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
        body: JSON.stringify({ figma_link: dados.figma_link || null, etapa_atual: dados.etapa_atual, dataEntrega: dados.dataEntrega || null }),
      });
      const data = await res.json();
      if (res.ok) {
        mostrarSucesso("💾 Projeto atualizado! O cliente verá as mudanças.");
        setEditando(prev => { const n = { ...prev }; delete n[id]; return n; });
        await carregarTudo();
      } else alert(data.message || "Erro ao salvar.");
    } finally { setSalvando(prev => ({ ...prev, [id]: false })); }
  };

  const formatarData = (d?: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
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
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080c14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
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

          {/* Centro: métricas rápidas */}
          <div className="hidden md:flex items-center gap-3">
            <MetricaPill label="Briefings" valor={briefings.length} cor="indigo" />
            <MetricaPill label="Projetos" valor={projetos.length} cor="blue" />
            <MetricaPill label="Sem responsável" valor={projetosSemResponsavel.length} cor={projetosSemResponsavel.length > 0 ? "amber" : "slate"} />
          </div>

          {/* Direita: carga + usuário */}
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
              Sair →
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

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ── ABAS ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
          {(["briefings", "todos", "meus"] as const).map(aba => {
            const meta = {
              briefings: { icon: "📩", label: "Briefings", count: briefings.length },
              todos:     { icon: "📋", label: "Projetos",  count: projetos.length },
              meus:      { icon: "🙋", label: "Meus",      count: meusProjetos.length },
            }[aba];
            return (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  abaAtiva === aba
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/60"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black min-w-[20px] text-center ${
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
              <h2 className="text-2xl font-extrabold text-white">Novas Solicitações</h2>
              <p className="text-slate-500 text-sm mt-1">Revise cada proposta e aprove para criar o projeto no sistema.</p>
            </div>

            {briefings.length === 0 ? (
              <EmptyState emoji="📭" titulo="Nenhuma solicitação nova" descricao="Quando clientes enviarem propostas, elas aparecerão aqui para revisão." />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {briefings.map(b => (
                  <BriefingCard
                    key={b.id}
                    briefing={b}
                    aprovando={aprovando[b.id]}
                    expandido={expandido[b.id]}
                    onToggleExpand={() => setExpandido(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                    onAprovar={() => handleAprovarBriefing(b.id)}
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
          <div className="space-y-5">
            <div className="flex justify-between items-end flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-white">Todos os Projetos</h2>
                <p className="text-slate-500 text-sm mt-1">{projetos.length} projetos no sistema</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <Pill cor="amber" texto={`${projetosSemResponsavel.length} sem responsável`} />
                <Pill cor="emerald" texto={`${projetos.length - projetosSemResponsavel.length} com responsável`} />
              </div>
            </div>

            {projetos.length === 0 ? (
              <EmptyState emoji="📂" titulo="Nenhum projeto ativo" descricao="Aprove um briefing para criar o primeiro projeto." />
            ) : (
              <div className="space-y-4">
                {projetos.map(p => (
                  <ProjetoCard
                    key={p.id}
                    projeto={p}
                    meuId={meuId}
                    modoAdmin
                    editando={editando[p.id]}
                    salvando={salvando[p.id]}
                    assumindo={assumindo[p.id]}
                    onIniciarEdicao={() => setEditando(prev => ({ ...prev, [p.id]: { figma_link: p.figma_link || "", etapa_atual: p.etapa_atual, dataEntrega: p.dataEntrega ? p.dataEntrega.split("T")[0] : "" } }))}
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
          <div className="space-y-5">
            <div className="flex justify-between items-end flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-white">Meus Projetos</h2>
                <p className="text-slate-500 text-sm mt-1">Projetos sob sua responsabilidade</p>
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
                Você atingiu o limite de 2 projetos ativos. Finalize um projeto para assumir novos.
              </div>
            )}

            {meusProjetos.length === 0 ? (
              <EmptyState emoji="🙋" titulo="Nenhum projeto assumido" descricao='Vá em "Projetos" e clique em "Assumir" para começar.' />
            ) : (
              <div className="space-y-4">
                {meusProjetos.map(p => (
                  <ProjetoCard
                    key={p.id}
                    projeto={p}
                    meuId={meuId}
                    modoAdmin={false}
                    editando={editando[p.id]}
                    salvando={salvando[p.id]}
                    assumindo={assumindo[p.id]}
                    onIniciarEdicao={() => setEditando(prev => ({ ...prev, [p.id]: { figma_link: p.figma_link || "", etapa_atual: p.etapa_atual, dataEntrega: p.dataEntrega ? p.dataEntrega.split("T")[0] : "" } }))}
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
    </div>
  );
}

// ─── Sub-Componentes ──────────────────────────────────────────────────────────

function MetricaPill({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  const map: Record<string, string> = {
    indigo: "text-indigo-300 bg-indigo-950/60 border-indigo-800/40",
    blue:   "text-blue-300 bg-blue-950/60 border-blue-800/40",
    amber:  "text-amber-300 bg-amber-950/60 border-amber-800/40",
    slate:  "text-slate-400 bg-slate-800/60 border-slate-700/40",
    emerald:"text-emerald-300 bg-emerald-950/60 border-emerald-800/40",
  };
  return (
    <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${map[cor] || map.slate}`}>
      <span className="text-base font-black">{valor}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

function Pill({ cor, texto }: { cor: string; texto: string }) {
  const cores: Record<string, string> = {
    amber: "bg-amber-950/50 border-amber-700/40 text-amber-400",
    emerald: "bg-emerald-950/50 border-emerald-700/40 text-emerald-400",
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
  // Extrai nome do projeto do briefing se estiver no formato "PROJETO: xxx"
  const linhas = b.mensagem.split("\n");
  const linhaProjeto = linhas.find(l => l.startsWith("PROJETO:"));
  const nomeProjeto = linhaProjeto ? linhaProjeto.replace("PROJETO:", "").trim() : null;

  return (
    <div className="group bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all duration-300">
      {/* Cabeçalho do Card */}
      <div className="p-6 flex items-start gap-4">
        {/* Avatar */}
        <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${corAvatar(b.nome)} flex items-center justify-center text-white font-black text-base shadow-lg`}>
          {iniciais(b.nome)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-extrabold text-white text-lg leading-none">{b.nome}</h3>
              <a href={`mailto:${b.email}`} className="text-indigo-400 text-sm hover:text-indigo-300 transition mt-1 block">
                {b.email}
              </a>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                {formatarData(b.criadoEm)}
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            </div>
          </div>

          {/* Nome do projeto (se detectado) */}
          {nomeProjeto && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-800/40 rounded-lg px-3 py-1">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Projeto:</span>
              <span className="text-indigo-200 text-sm font-semibold">{nomeProjeto}</span>
            </div>
          )}
        </div>
      </div>

      {/* Corpo: mensagem */}
      <div className="px-6 pb-2">
        <div
          className={`relative bg-black/30 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed font-mono overflow-hidden transition-all duration-500 ${
            expandido ? "max-h-[500px]" : "max-h-28"
          }`}
        >
          <pre className="p-4 whitespace-pre-wrap break-words font-sans text-sm">{b.mensagem}</pre>
          {/* Gradiente fade-out quando recolhido */}
          {!expandido && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0c111d] to-transparent pointer-events-none" />
          )}
        </div>
        <button
          onClick={onToggleExpand}
          className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
        >
          {expandido ? "▲ Recolher" : "▼ Ver briefing completo"}
        </button>
      </div>

      {/* Rodapé: ação */}
      <div className="p-5 pt-3 mt-1">
        <button
          onClick={onAprovar}
          disabled={aprovando}
          className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-900/40 group-hover:shadow-indigo-900/60"
        >
          {aprovando ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Criando projeto e enviando e-mail...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Aprovar e Criar Projeto
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
  editando?: { figma_link: string; etapa_atual: string; dataEntrega: string };
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
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
      ehMeu
        ? "border-indigo-500/40 bg-indigo-950/20"
        : "border-white/10 bg-white/[0.02] hover:border-white/20"
    }`}>
      {/* Barra de progresso no topo */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-700"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Info Principal */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar do cliente */}
            <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${corAvatar(p.cliente.nome)} flex items-center justify-center text-white font-black text-sm`}>
              {iniciais(p.cliente.nome)}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              {/* Nome do projeto + etapa */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-white text-base leading-none">{p.nome}</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.cor} border border-white/10`}>
                  {meta.emoji} {p.etapa_atual}
                </span>
                {ehMeu && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/40">👤 Meu</span>}
              </div>

              {/* Cliente */}
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-slate-300">{p.cliente.nome}</span>
                <span className="mx-1.5 text-slate-600">·</span>
                <a href={`mailto:${p.cliente.email}`} className="hover:text-slate-200 transition">{p.cliente.email}</a>
              </p>

              {/* Meta-info em linha */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                <span>📅 {formatarData(p.dataEntrega)}</span>
                <span className={p.contrato_assinado ? "text-emerald-400" : "text-amber-400"}>
                  {p.contrato_assinado ? "✅ Contrato assinado" : "⏳ Contrato pendente"}
                </span>
                {totalPago > 0 && <span className="text-emerald-400 font-semibold">💰 {formatarMoeda(String(totalPago))} recebido</span>}
                {totalPendente > 0 && <span className="text-amber-400">⏳ {formatarMoeda(String(totalPendente))} pendente</span>}
                {p.responsavel && (
                  <span className="text-slate-400">👤 {p.responsavel.nome}</span>
                )}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2 shrink-0">
            {(modoAdmin || semResponsavel) && semResponsavel && !estaEditando && (
              <button
                onClick={onAssumir}
                disabled={assumindo}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-indigo-900/40"
              >
                {assumindo ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "🙋"}
                {assumindo ? "Assumindo..." : "Assumir"}
              </button>
            )}
            {(ehMeu || modoAdmin) && !estaEditando && (
              <button
                onClick={onIniciarEdicao}
                className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 border border-white/10"
              >
                ✏️ Editar
              </button>
            )}
          </div>
        </div>

        {/* Painel de edição inline */}
        {estaEditando && editando && (
          <div className="mt-5 border-t border-white/10 pt-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Atualizar Projeto</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Fase do Projeto</label>
                <select
                  value={editando.etapa_atual}
                  onChange={e => onChangeEdicao("etapa_atual", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                >
                  {ETAPAS.map(e => (
                    <option key={e} value={e} className="bg-slate-900">{ETAPA_META[e]?.emoji} {e.charAt(0) + e.slice(1).toLowerCase()}</option>
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
            <div className="bg-black/20 rounded-xl p-4 text-xs text-slate-400 leading-relaxed max-h-24 overflow-y-auto border border-white/5">
              <span className="text-slate-300 font-semibold block mb-1">📄 Briefing:</span>
              {p.mensagem}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancelarEdicao}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition border border-white/10 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={onSalvar}
                disabled={salvando}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition disabled:opacity-60 shadow-lg shadow-indigo-900/40 active:scale-[0.98]"
              >
                {salvando ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : "💾 Salvar Alterações"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
