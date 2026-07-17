import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Interface dos dados do pagamento retornados pela nossa API
interface Payment {
  id: number;
  value: string; // Decimal retorna como string do JSON
  status: string; // PENDING, PAID, CANCELED
  method: string; // PIX, CARD, BOLETO
  pixQrcode?: string | null;
  urlNotaFiscal?: string | null;
  createdAt: string;
}


// Interface dos dados do projeto retornados pela nossa API
interface Project {
  id: number;
  nome: string;
  etapa_atual: string; // BRIEFING, DESIGN, DESENVOLVIMENTO, TESTES, ENTREGA
  mensagem?: string | null;
  figma_link?: string | null;
  dataEntrega?: string | null;
  cliente: {
    nome: string;
    email: string;
  };
  payments: Payment[];
}

function Dashboard() {
  const navigate = useNavigate();

  // Estados locais para controle de dados, loading, erros e interações da UI
  const [projeto, setProjeto] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estado para o modal do Pix Copia e Cola
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [pixSelecionado, setPixSelecionado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Etapas padronizadas do projeto para o Stepper
  const etapas = ["BRIEFING", "DESIGN", "DESENVOLVIMENTO", "TESTES", "ENTREGA"];

  useEffect(() => {
    // Busca o token do localStorage
    const token = localStorage.getItem("token");

    // Redirecionamento defensivo caso o usuário não esteja logado
    if (!token) {
      navigate("/login");
      return;
    }

    // Busca os dados do projeto no nosso backend na porta 3000
    const buscarProjeto = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await fetch(`${apiUrl}/api/projetos`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();

        if (response.ok) {
          // Salva os dados do projeto retornado
          setProjeto(data.projeto);
        } else {
          // Se o token estiver vencido ou inválido, desloga por segurança
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        console.error("Erro ao carregar dados do projeto:", err);
        setErro("Não foi possível conectar ao servidor para carregar o seu projeto.");
      } finally {
        setLoading(false);
      }
    };

    buscarProjeto();
  }, [navigate]);

  /**
   * Abre o modal do Pix copiando o código da fatura
   */
  const abrirModalPix = (codigoPix: string) => {
    setPixSelecionado(codigoPix);
    setModalPixAberto(true);
    setCopiado(false);
  };

  /**
   * Copia o texto do Pix para a área de transferência usando API nativa
   */
  const copiarPixCopiaECola = () => {
    if (pixSelecionado) {
      navigator.clipboard.writeText(pixSelecionado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000); // Reseta o texto de sucesso após 2 segundos
    }
  };

  /**
   * Função para formatar valores monetários do banco de dados (BRL)
   */
  const formatarMoeda = (valor: string) => {
    const num = parseFloat(valor);
    return isNaN(num) ? "R$ 0,00" : num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  /**
   * Função para formatar datas ISO para o formato do Brasil
   */
  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return "Sem prazo definido";
    const date = new Date(dataStr);
    // Trata datas inválidas ou de reset (como 1970-01-01)
    if (isNaN(date.getTime()) || date.getFullYear() <= 1970) return "A definir";
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  };

  /**
   * Retorna o índice numérico da etapa atual para o Stepper
   */
  const obterIndiceEtapa = (etapaAtual?: string) => {
    if (!etapaAtual) return 0;
    return etapas.indexOf(etapaAtual.toUpperCase());
  };

  // Renderizações Condicionais (Loading e Erros)
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />
        <main className="flex-1 flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-indigo-600 border-4 border-transparent border-t-indigo-600 rounded-full" viewBox="0 0 24 24" />
            <p className="text-slate-500 font-medium">Carregando painel do cliente...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (erro || !projeto) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Ops! Ocorreu um erro</h2>
            <p className="text-slate-600 mb-6">{erro || "Nenhum projeto ativo foi encontrado para esta conta."}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Voltar ao Login
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const indiceEtapaAtual = obterIndiceEtapa(projeto.etapa_atual);

  // Geração de mensagem personalizada para o WhatsApp facilitando o suporte
  const textoWhatsApp = encodeURIComponent(
    `Olá Dott System! Sou o ${projeto.cliente?.nome} e gostaria de tirar uma dúvida sobre o andamento do meu projeto "${projeto.nome}" (ID: ${projeto.id}), que se encontra na etapa de "${projeto.etapa_atual}".`
  );
  const linkWhatsApp = `https://wa.me/5547999990000?text=${textoWhatsApp}`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 space-y-8">
        
        {/* Seção 1: Boas-Vindas */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">
              Olá, {projeto.cliente?.nome}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Acompanhe aqui os detalhes e o andamento da sua solução digital.
            </p>
          </div>
          
          {/* Botão de Suporte via WhatsApp */}
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl shadow-sm transition active:scale-[0.98] hover:shadow-md"
          >
            {/* Ícone de Suporte */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.948-4.471 9.951-9.958.002-2.66-1.019-5.161-2.877-7.022-1.857-1.859-4.355-2.883-7.01-2.884-5.485 0-9.94 4.47-9.944 9.959-.001 1.845.507 3.636 1.47 5.188L1.15 20.91l4.981-1.306c.159.087.32.17.48.25zm11.302-7.58c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.785-1.07-.958-1.79-2.14-2-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.36.54-.54.18-.18.24-.3.36-.54.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.3-.72-.6-1.12-.81-1.12-.21 0-.45-.03-.69-.03-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.16 5.44.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.7-.1 2.13-.87 2.43-1.72.3-.84.3-1.56.21-1.72-.09-.16-.33-.26-.69-.44z"/>
            </svg>
            Falar com Suporte
          </a>
        </section>

        {/* Seção 2: O Stepper Visual de Progresso */}
        <section className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Progresso do Projeto</h2>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {projeto.etapa_atual}
            </span>
          </div>

          {/* Stepper Grid Horizontal */}
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 mt-10">
            {/* Barra de progresso de fundo */}
            <div className="absolute top-[22px] left-0 w-full h-[4px] bg-slate-100 hidden md:block z-0" />
            <div 
              className="absolute top-[22px] left-0 h-[4px] bg-indigo-500 hidden md:block z-0 transition-all duration-500" 
              style={{ width: `${(indiceEtapaAtual / (etapas.length - 1)) * 100}%` }}
            />

            {etapas.map((etapa, idx) => {
              const concluida = idx < indiceEtapaAtual;
              const ativa = idx === indiceEtapaAtual;

              return (
                <div key={etapa} className="flex flex-row md:flex-col items-center gap-4 z-10 w-full md:w-auto relative">
                  {/* Círculo do Estado */}
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300 ${
                      concluida 
                        ? "bg-green-500 border-green-200 text-white" 
                        : ativa 
                          ? "bg-indigo-600 border-indigo-200 text-white shadow-lg shadow-indigo-150 scale-110" 
                          : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {concluida ? (
                      // Ícone Check para concluídas
                      <svg className="w-5 h-5 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Detalhe do Texto descritivo */}
                  <div className="text-left md:text-center">
                    <p className={`font-bold text-sm tracking-wide ${ativa ? "text-indigo-600" : "text-slate-600"}`}>
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

        {/* Seção 3: Informações do Projeto & Financeiro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card: Detalhes Técnicos e Links */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                Especificações Técnicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Nome da Solução</span>
                  <p className="font-bold text-slate-700 text-lg mt-1">{projeto.nome || "Não definido"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Prazo de Entrega Estimado</span>
                  <p className="font-bold text-slate-700 text-lg mt-1">{formatarData(projeto.dataEntrega)}</p>
                </div>
              </div>

              {/* Botão Figma Link */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  {/* Figma Icon */}
                  <svg className="w-8 h-8" viewBox="0 0 38 57" fill="none">
                    <path d="M19 0C8.5 0 0 8.5 0 19C0 24.3 2.2 29.1 5.7 32.5C2.2 35.9 0 40.7 0 46C0 56.5 8.5 65 19 65C24.3 65 29.1 62.8 32.5 59.3C35.9 62.8 40.7 65 46 65C56.5 65 65 56.5 65 46C65 40.7 62.8 35.9 59.3 32.5C62.8 29.1 65 24.3 65 19C65 8.5 56.5 0 46 0C40.7 0 35.9 2.2 32.5 5.7C29.1 2.2 24.3 0 19 0Z" fill="none"/>
                    <path d="M9.5 47.5c0-5.2 4.3-9.5 9.5-9.5s9.5 4.3 9.5 9.5c0 5.2-4.3 9.5-9.5 9.5s-9.5-4.3-9.5-9.5z" fill="#0ACF83"/>
                    <path d="M9.5 28.5c0-5.2 4.3-9.5 9.5-9.5s9.5 4.3 9.5 9.5v19H9.5v-19z" fill="#1ABC9C"/>
                    <path d="M28.5 28.5c0-5.2 4.3-9.5 9.5-9.5S47.5 23.3 47.5 28.5c0 5.2-4.3 9.5-9.5 9.5s-9.5-4.3-9.5-9.5z" fill="#A259FF"/>
                    <path d="M28.5 9.5C28.5 4.3 32.8 0 38 0s9.5 4.3 9.5 9.5c0 5.2-4.3 9.5-9.5 9.5s-9.5-4.3-9.5-9.5z" fill="#F24E1E"/>
                    <path d="M9.5 9.5C9.5 4.3 13.8 0 19 0s9.5 4.3 9.5 9.5v19H9.5V9.5z" fill="#FF7262"/>
                  </svg>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Visualizar Protótipo de Design</h4>
                    <p className="text-xs text-slate-400">Clique para ver os layouts no Figma criados pela equipe</p>
                  </div>
                </div>
                {projeto.figma_link ? (
                  <a
                    href={projeto.figma_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition"
                  >
                    Acessar Protótipo
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-200 px-3 py-2 rounded-lg font-medium select-none">
                    Aguardando Design
                  </span>
                )}
              </div>

              {/* Mensagem / Descrição do Briefing */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Escopo de Desenvolvimento</span>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-150">
                  {projeto.mensagem || "Nenhuma especificação especial anexada ao contrato inicial."}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Faturamento e Cobranças */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                Faturamento do Projeto
              </h3>

              {projeto.payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm font-medium">Nenhum pagamento registrado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projeto.payments.map((p) => {
                    const pendente = p.status === "PENDING";
                    const pago = p.status === "PAID";

                    return (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-150 space-y-3 flex flex-col">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{p.method}</span>
                          <span 
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pago 
                                ? "bg-emerald-50 text-emerald-700" 
                                : pendente 
                                  ? "bg-amber-50 text-amber-700" 
                                  : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <span className="text-lg font-extrabold text-slate-800">{formatarMoeda(p.value)}</span>
                          <span className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>

                        {/* Ação Dinâmica do Pix */}
                        {pendente && p.method.toUpperCase() === "PIX" && (
                          <button
                            onClick={() => abrirModalPix(p.pixQrcode || "00020126580014BR.GOV.BCB.PIX0114contato@dott.com52040000530398654062490.005802BR5911Dott System6006Itajai62070503***6304CA42")}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg text-xs transition active:scale-[0.98] mt-2"
                          >
                            Visualizar QR Code Pix
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
              Dúvidas sobre faturamento? Entre em contato com o financeiro.
            </div>
          </div>

        </div>

      </main>

      {/* Modal Pix Copia e Cola */}
      {modalPixAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center space-y-6 animate-[scaleUp_0.2s_ease-out]">
            <div className="w-full flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-lg">Pagamento via PIX</h3>
              <button 
                onClick={() => setModalPixAberto(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Imagem do QR Code Simulado */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <svg className="w-36 h-36 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2 2h2v-2h2v2h-2v2h-2v-2zm-2-4h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-8 0h2v2H9v-2zm0-2h2v2H9V9zm2 2h2v2h-2v-2z" />
              </svg>
            </div>

            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Escaneie o QR Code acima pelo app do seu banco ou utilize a chave copia e cola abaixo para efetuar o pagamento.
            </p>

            {/* Campo da Chave Pix Copia e Cola */}
            <div className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-3">
              <input
                type="text"
                readOnly
                value={pixSelecionado || ""}
                className="bg-transparent text-xs text-slate-600 select-all outline-none truncate flex-1"
              />
              <button
                onClick={copiarPixCopiaECola}
                className={`text-xs font-bold px-3 py-1.5 rounded transition ${
                  copiado 
                    ? "bg-emerald-600 text-white" 
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Dashboard;
