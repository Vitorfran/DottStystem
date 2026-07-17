import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
  designAprovado: boolean;
  contrato_link?: string | null;
  contrato_assinado: boolean;
  dataEntrega?: string | null;
  cliente: { nome: string; email: string };
  payments: Payment[];
}

interface UsuarioInfo {
  nome: string;
  email: string;
  role: string;
}

const ETAPAS = ["BRIEFING", "DESIGN", "DESENVOLVIMENTO", "TESTES", "ENTREGA"];

// ─── Dashboard ────────────────────────────────────────────────────────────────

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

    try {
      // Busca dados do usuário e do projeto em paralelo
      const [resMe, resProjeto] = await Promise.all([
        fetch(`${apiUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/projetos`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      // Dados do usuário
      if (resMe.ok) {
        const dataMe = await resMe.json();
        setUsuario(dataMe.usuario);
      } else if (resMe.status === 401 || resMe.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      // Dados do projeto (404 = sem projeto ainda, não é erro)
      if (resProjeto.ok) {
        const dataProjeto = await resProjeto.json();
        setProjeto(dataProjeto.projeto);
      } else if (resProjeto.status === 404) {
        setProjeto(null); // sem projeto ainda — estado válido
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
  const acao = async (url: string, msg: string) => {
    const token = localStorage.getItem("token");
    setCarregandoAcao(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (res.ok) { alert(msg); await buscarDados(); }
      else { const d = await res.json(); alert(d.message || "Erro."); }
    } catch { alert("Erro de conexão."); }
    finally { setCarregandoAcao(false); }
  };

  const handleAssinarContrato = () => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/assinar-contrato`, "Contrato assinado com sucesso!");
  const handlePagarFatura = (payId: number) => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/pagar-fatura/${payId}`, "Pagamento compensado! Etapa atualizada.");
  const handleAprovarDesign = () => projeto && acao(`${apiUrl}/api/projetos/${projeto.id}/aprovar-design`, "Design aprovado! Programação liberada.");

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatarMoeda = (v: string) => { const n = parseFloat(v); return isNaN(n) ? "R$ 0,00" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  const formatarData = (d?: string | null) => { if (!d) return "A definir"; const dt = new Date(d); return isNaN(dt.getTime()) ? "A definir" : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }); };
  const primeiroNome = usuario?.nome?.split(" ")[0] || "Cliente";

  // ── Render Shell ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-10 space-y-8">

        {/* ── BOAS-VINDAS (sempre visível) ───────────────────────────────── */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {loading ? (
              <div className="h-9 w-56 bg-slate-200 animate-pulse rounded-xl" />
            ) : (
              <h1 className="text-3xl font-extrabold text-slate-800">
                Olá, {primeiroNome}! 👋
              </h1>
            )}
            <p className="text-slate-500 mt-1 text-sm">
              {projeto
                ? "Acompanhe aqui o andamento da sua solução digital."
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
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl transition active:scale-[0.98] shadow-sm text-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.001-6.647 5.339-11.985 11.951-11.985 3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.948-4.471 9.951-9.958.002-2.66-1.019-5.161-2.877-7.022-1.857-1.859-4.355-2.883-7.01-2.884-5.485 0-9.94 4.47-9.944 9.959-.001 1.845.507 3.636 1.47 5.188L1.15 20.91l4.981-1.306.459.25zm11.302-7.58c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.785-1.07-.958-1.79-2.14-2-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.36.54-.54.18-.18.24-.3.36-.54.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.3-.72-.6-1.12-.81-1.12-.21 0-.45-.03-.69-.03-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.16 5.44.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.7-.1 2.13-.87 2.43-1.72.3-.84.3-1.56.21-1.72-.09-.16-.33-.26-.69-.44z" />
            </svg>
            Falar com Suporte
          </a>
        </section>

        {/* ── ERRO de conexão ────────────────────────────────────────────── */}
        {!loading && erro && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 font-medium flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            {erro}
          </div>
        )}

        {/* ── LOADING SKELETON ───────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-48 bg-slate-200 rounded-2xl" />
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ESTADO: SEM PROJETO (mas logado e sem erro)
        ════════════════════════════════════════════════════════════════ */}
        {!loading && !erro && !projeto && (
          <>
            {/* Card de Status */}
            <section className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-indigo-100 flex items-center justify-center mx-auto shadow-sm">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">Seu projeto está sendo preparado!</h2>
                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                  Nossa equipe recebeu sua solicitação e está revisando os detalhes. Em breve você terá acesso completo aqui.
                </p>
              </div>

              {/* Stepper vazio (futuro) */}
              <div className="flex justify-between items-center max-w-lg mx-auto pt-2">
                {ETAPAS.map((etapa, idx) => (
                  <div key={etapa} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      idx === 0 ? "border-indigo-300 bg-indigo-50 text-indigo-400" : "border-slate-200 bg-white text-slate-300"
                    }`}>
                      {idx + 1}
                    </div>
                    <p className={`text-[10px] font-semibold ${idx === 0 ? "text-indigo-400" : "text-slate-300"}`}>
                      {etapa.charAt(0) + etapa.slice(1).toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* O que acontece agora */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "📋", titulo: "Revisão do Briefing", desc: "Nossa equipe analisa sua proposta e monta o escopo completo do projeto." },
                { icon: "✍️", titulo: "Contrato Digital", desc: "Você receberá o contrato para assinatura digital diretamente neste painel." },
                { icon: "🚀", titulo: "Início do Projeto", desc: "Após o pagamento de entrada, o projeto entra na fila de desenvolvimento." },
              ].map(item => (
                <div key={item.titulo} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:shadow-md transition">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="font-bold text-slate-800 text-sm">{item.titulo}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </section>

            {/* CTA para enviar projeto */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
              <div>
                <h3 className="font-bold text-slate-800">Ainda não enviou sua ideia?</h3>
                <p className="text-slate-400 text-sm mt-0.5">Descreva seu projeto e nossa IA vai estruturar tudo para você.</p>
              </div>
              <a
                href="/criar-projeto"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition active:scale-[0.98] shadow-sm whitespace-nowrap"
              >
                🚀 Enviar minha ideia
              </a>
            </section>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ESTADO: COM PROJETO
        ════════════════════════════════════════════════════════════════ */}
        {!loading && !erro && projeto && (() => {
          const indiceEtapa = ETAPAS.indexOf(projeto.etapa_atual.toUpperCase());
          const precisaContrato = !projeto.contrato_assinado;
          const primeiroFatPendente = projeto.payments.length > 0 && projeto.payments[0].status === "PENDING";

          return (
            <>
              {/* ── Stepper de Progresso ─────────────────────────────────── */}
              <section className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800">Progresso do Projeto</h2>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {projeto.etapa_atual}
                  </span>
                </div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="absolute top-[22px] left-0 w-full h-1 bg-slate-100 hidden md:block z-0" />
                  <div className="absolute top-[22px] left-0 h-1 bg-indigo-500 hidden md:block z-0 transition-all duration-700"
                    style={{ width: `${(indiceEtapa / (ETAPAS.length - 1)) * 100}%` }} />

                  {ETAPAS.map((etapa, idx) => {
                    const concluida = idx < indiceEtapa;
                    const ativa = idx === indiceEtapa;
                    return (
                      <div key={etapa} className="flex flex-row md:flex-col items-center gap-4 z-10 w-full md:w-auto relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300 ${
                          concluida ? "bg-emerald-500 border-emerald-100 text-white"
                            : ativa ? "bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-200 scale-110"
                            : "bg-white border-slate-200 text-slate-400"
                        }`}>
                          {concluida
                            ? <svg className="w-5 h-5 stroke-current stroke-2" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            : idx + 1}
                        </div>
                        <div className="text-left md:text-center">
                          <p className={`font-bold text-sm ${ativa ? "text-indigo-600" : "text-slate-600"}`}>
                            {etapa.charAt(0) + etapa.slice(1).toLowerCase()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {ativa ? "Em Andamento" : concluida ? "Concluído" : "A iniciar"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Alertas de Ação ──────────────────────────────────────── */}

              {/* Contrato pendente */}
              {precisaContrato && (
                <section className="bg-amber-50 border-l-8 border-amber-500 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                  <div>
                    <h3 className="font-extrabold text-amber-900 text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      Assinatura de Contrato Pendente
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">Leia e assine o contrato para liberar o projeto.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <a href={projeto.contrato_link || "#"} target="_blank" rel="noopener noreferrer"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95">
                      Ler e Assinar
                    </a>
                    <button onClick={handleAssinarContrato} disabled={carregandoAcao}
                      className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95 disabled:opacity-50">
                      Simular Assinatura
                    </button>
                  </div>
                </section>
              )}

              {/* Pagamento pendente */}
              {!precisaContrato && primeiroFatPendente && (
                <section className="bg-blue-50 border-l-8 border-blue-500 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                  <div>
                    <h3 className="font-extrabold text-blue-900 text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                      Pagamento de Entrada Pendente (50%)
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">Realize o Pix para liberar a equipe de Design.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => { const f = projeto.payments[0]; if (f) { setPixSelecionado(f.pixQrcode || ""); setModalPixAberto(true); setCopiado(false); } }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95">
                      Ver QR Code Pix
                    </button>
                    <button onClick={() => { const f = projeto.payments[0]; if (f) handlePagarFatura(f.id); }} disabled={carregandoAcao}
                      className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95 disabled:opacity-50">
                      Simular Pix
                    </button>
                  </div>
                </section>
              )}

              {/* Aprovar Design */}
              {projeto.etapa_atual.toUpperCase() === "DESIGN" && !projeto.designAprovado && (
                <section className="bg-violet-50 border-l-8 border-violet-500 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                  <div>
                    <h3 className="font-extrabold text-violet-900 text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping" />
                      Design Pronto para Aprovação!
                    </h3>
                    <p className="text-sm text-violet-700 mt-1">Veja o protótipo no Figma e aprove para iniciar a programação.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <a href={projeto.figma_link || "#"} target="_blank" rel="noopener noreferrer"
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95">
                      Abrir Figma
                    </a>
                    <button onClick={handleAprovarDesign} disabled={carregandoAcao}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95 disabled:opacity-50">
                      Aprovar Design
                    </button>
                  </div>
                </section>
              )}

              {/* ── Detalhes + Financeiro ─────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detalhes do Projeto */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Detalhes do Projeto</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Nome da Solução</span>
                      <p className="font-bold text-slate-800 text-lg mt-1">{projeto.nome}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Prazo Estimado</span>
                      <p className="font-bold text-slate-800 text-lg mt-1">{formatarData(projeto.dataEntrega)}</p>
                    </div>
                  </div>

                  {/* Figma */}
                  <div className="relative bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center gap-4 overflow-hidden">
                    {(precisaContrato || primeiroFatPendente) && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Assine o contrato e pague a entrada primeiro
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-black text-sm">F</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Protótipo Visual no Figma</h4>
                        <p className="text-xs text-slate-400">Layouts criados pela equipe de design</p>
                      </div>
                    </div>
                    {projeto.figma_link
                      ? <a href={projeto.figma_link} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">Abrir</a>
                      : <span className="text-xs text-slate-400 bg-slate-200 px-3 py-2 rounded-lg">Em desenvolvimento</span>
                    }
                  </div>

                  {/* Escopo */}
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Escopo do Projeto</span>
                    <div className="mt-2 bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-100 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {projeto.mensagem || "Aguardando definição do escopo."}
                    </div>
                  </div>
                </div>

                {/* Financeiro */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">Financeiro</h3>
                  {projeto.payments.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-slate-400 text-sm text-center">Nenhuma cobrança registrada ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1">
                      {projeto.payments.map(p => {
                        const pendente = p.status === "PENDING";
                        const pago = p.status === "PAID";
                        return (
                          <div key={p.id} className="relative p-4 rounded-xl border border-slate-100 space-y-2 overflow-hidden">
                            {precisaContrato && (
                              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <span className="bg-slate-800/80 text-white text-[9px] font-bold px-2 py-1 rounded">Bloqueado</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400 font-semibold uppercase">{p.method}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pago ? "bg-emerald-50 text-emerald-700" : pendente ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                {p.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-lg font-extrabold text-slate-800">{formatarMoeda(p.value)}</span>
                              <span className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                            {pendente && p.method.toUpperCase() === "PIX" && (
                              <button onClick={() => { setPixSelecionado(p.pixQrcode || ""); setModalPixAberto(true); setCopiado(false); }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg text-xs transition active:scale-[0.98]">
                                Ver QR Code Pix
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">Dúvidas? Fale com o financeiro.</p>
                </div>
              </div>
            </>
          );
        })()}

      </main>

      {/* ── Modal Pix ──────────────────────────────────────────────────────── */}
      {modalPixAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl flex flex-col items-center space-y-5">
            <div className="w-full flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-lg">Pagamento via PIX</h3>
              <button onClick={() => setModalPixAberto(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <svg className="w-36 h-36 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2 2h2v-2h2v2h-2v2h-2v-2zm-2-4h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-8 0h2v2H9v-2zm0-2h2v2H9V9zm2 2h2v2h-2v-2z" />
              </svg>
            </div>
            <p className="text-xs text-slate-500 text-center">Escaneie o QR Code ou copie a chave Pix abaixo.</p>
            <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3">
              <input type="text" readOnly value={pixSelecionado || ""} className="bg-transparent text-xs text-slate-600 outline-none truncate flex-1 select-all" />
              <button onClick={() => { if (pixSelecionado) { navigator.clipboard.writeText(pixSelecionado); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${copiado ? "bg-emerald-600 text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}>
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
            {projeto && (
              <button onClick={() => { const f = projeto.payments[0]; if (f) { handlePagarFatura(f.id); setModalPixAberto(false); } }} disabled={carregandoAcao}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-50">
                Simular Confirmação do Pix
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Dashboard;
