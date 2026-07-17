import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Declaração de tipos para estender a interface global de Window para Web Speech API
/* eslint-disable @typescript-eslint/no-explicit-any */
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function CriarProjeto() {
  // Dados do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [ideiaBruta, setIdeiaBruta] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  
  // Estados de controle da gravação de voz e IA
  const [gravando, setGravando] = useState(false);
  const [reconhecimento, setReconhecimento] = useState<any>(null);
  const [refinando, setRefinando] = useState(false);

  // Auto-preenche nome e email se o usuário já estiver logado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.usuario) {
          setNome(data.usuario.nome);
          setEmail(data.usuario.email);
          setUsuarioLogado(true);
        }
      })
      .catch(() => {});
  }, []);

  const [escopoRefinado, setEscopoRefinado] = useState<string | null>(null);
  
  // Estado de envio da proposta final
  const [enviado, setEnviado] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);

  // Inicializa o reconhecimento de voz nativo do navegador
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;

      // Evento disparado conforme o cliente fala no microfone
      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setIdeiaBruta(transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setGravando(false);
      };

      rec.onend = () => {
        setGravando(false);
      };

      setReconhecimento(rec);
    }
  }, []);

  /**
   * Liga ou desliga a gravação de voz
   */
  const alternarGravacao = () => {
    if (!reconhecimento) {
      alert("Seu navegador não possui suporte nativo para gravação de voz. Por favor, digite sua ideia na caixa de texto.");
      return;
    }

    if (gravando) {
      reconhecimento.stop();
      setGravando(false);
    } else {
      setIdeiaBruta(""); // Limpa o texto anterior
      reconhecimento.start();
      setGravando(true);
    }
  };

  /**
   * Envia o texto de áudio bruto para a nossa API refinar usando IA (Langflow/Gemini)
   */
  const handleRefinarComIA = async () => {
    if (!ideiaBruta.trim()) {
      alert("Por favor, fale ou digite sua ideia de projeto primeiro!");
      return;
    }

    setRefinando(true);
    setEscopoRefinado(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/contato/refinar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mensagem: ideiaBruta })
      });

      const data = await response.json();

      if (response.ok) {
        setEscopoRefinado(data.escopo);
      } else {
        alert(data.message || "Não foi possível refinar seu escopo. Você pode enviar a ideia bruta mesmo assim.");
      }
    } catch (error) {
      console.error("Erro ao refinar ideia:", error);
      alert("Ocorreu um erro ao conectar-se ao assistente de IA. Tente digitar ou fale novamente.");
    } finally {
      setRefinando(false);
    }
  };

  /**
   * Grava a proposta final do projeto (briefing estruturado) como um contato no banco
   */
  const handleEnviarProposta = async () => {
    if (!nome || !email || !nomeProjeto) {
      alert("Por favor, preencha seu nome, e-mail e o nome do projeto!");
      return;
    }

    // A mensagem enviada será o escopo gerado pela IA ou a transcrição bruta se não refinado
    const briefingFinal = escopoRefinado 
      ? `PROJETO: ${nomeProjeto}\n\nESCOPO REFINADO POR IA:\n${escopoRefinado}`
      : `PROJETO: ${nomeProjeto}\n\nTRANSCRICÃO DE VOZ BRUTA:\n${ideiaBruta}`;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/contato`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nome: nome,
          email: email,
          mensagem: briefingFinal
        })
      });

      if (response.ok) {
        setEnviado(true);
        setMensagemStatus("Sua proposta foi registrada com sucesso! Nossa equipe comercial revisará seu briefing estruturado e enviará suas credenciais de acesso por e-mail em breve.");
      } else {
        alert("Erro ao registrar briefing. Verifique se os dados estão corretos.");
      }
    } catch (error) {
      console.error("Erro ao enviar proposta:", error);
      alert("Erro ao conectar-se ao servidor.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-550 font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {enviado ? (
          /* CARD DE SUCESSO APÓS SUBMISSÃO */
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-6 animate-[scaleUp_0.3s_ease]">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100">
              <svg className="w-8 h-8 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800">Briefing Enviado!</h2>
            <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
              {mensagemStatus}
            </p>
            <div className="pt-4">
              <a
                href="/"
                className="inline-block bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-6 py-3 rounded-xl transition shadow-sm"
              >
                Voltar para a Home
              </a>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE CRIAÇÃO INTERATIVA */
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-indigo-600 font-bold uppercase tracking-wider text-xs bg-indigo-50 px-3 py-1 rounded-full">
                Assistente de Briefing
              </span>
              <h2 className="text-3xl font-extrabold text-slate-800">
                Monte seu Projeto Inteligente
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto text-sm">
                Fale sobre a sua ideia no microfone e deixe nossa IA estruturar os requisitos de design e desenvolvimento do seu novo site ou aplicativo.
              </p>
            </div>
            {/* Badge quando logado */}
            {usuarioLogado && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium text-emerald-700">
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Dados preenchidos automaticamente com sua conta
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Seu Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  readOnly={usuarioLogado}
                  className={`w-full px-4 py-3 border rounded-xl outline-none transition ${
                    usuarioLogado
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold cursor-default"
                      : "border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  }`}
                  placeholder="Ex: Vitor Tavares"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">E-mail para Contato</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={usuarioLogado}
                  className={`w-full px-4 py-3 border rounded-xl outline-none transition ${
                    usuarioLogado
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold cursor-default"
                      : "border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  }`}
                  placeholder="exemplo@empresa.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Nome Sugerido para o Projeto</label>
              <input
                type="text"
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Ex: Aplicativo de Delivery da Minha Loja"
                required
              />
            </div>

            {/* SEÇÃO DO GRAVADOR DE VOZ */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Conte sua Ideia (Fale ou Digite)
                </label>
                {SpeechRecognition && (
                  <button
                    type="button"
                    onClick={alternarGravacao}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs shadow-xs transition active:scale-95 ${
                      gravando 
                        ? "bg-red-50 text-red-600 border border-red-200 animate-pulse" 
                        : "bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100"
                    }`}
                  >
                    {/* Círculo vermelho piscante de gravando */}
                    {gravando ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    ) : (
                      // Ícone Microfone
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                      </svg>
                    )}
                    {gravando ? "Ouvindo... Clique para Parar" : "Falar Ideia por Áudio"}
                  </button>
                )}
              </div>

              <textarea
                value={ideiaBruta}
                onChange={(e) => setIdeiaBruta(e.target.value)}
                rows={5}
                className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm leading-relaxed text-slate-700"
                placeholder='Fale ou digite detalhes como: "Quero criar um e-commerce integrado com pagamento via Pix, área do cliente, cálculo de frete e painel administrativo para relatórios de vendas..."'
                required
              />
            </div>

            {/* BOTÃO DE REFINAMENTO POR IA */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleRefinarComIA}
                disabled={refinando || !ideiaBruta.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
              >
                {refinando ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white border-2 border-transparent border-t-white rounded-full" viewBox="0 0 24 24" />
                    Refinando ideias com Inteligência Artificial...
                  </>
                ) : (
                  <>
                    {/* Ícone de Magia/Glow */}
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2zm0 4.1L10.7 8.8l-3.3.5 2.4 2.3-.6 3.3 2.9-1.5 2.9 1.5-.6-3.3 2.4-2.3-3.3-.5L12 6.1zM2 12h2v2H2v-2zm18 0h2v2h-2v-2zM12 20h2v2h-2v-2z" />
                    </svg>
                    Refinar com Inteligência Artificial (Dott IA)
                  </>
                )}
              </button>
            </div>

            {/* RENDERIZAÇÃO DO BRIEFING REFINADO PELA IA */}
            {escopoRefinado && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 animate-[slideDown_0.3s_ease]">
                <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-200 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Escopo Sugerido e Estruturado pela Dott IA
                </h4>
                <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                  {escopoRefinado}
                </div>
                
                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={handleEnviarProposta}
                    className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-6 py-3 rounded-xl transition shadow-xs hover:shadow-md active:scale-95"
                  >
                    Enviar Proposta Finalizada
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default CriarProjeto;
