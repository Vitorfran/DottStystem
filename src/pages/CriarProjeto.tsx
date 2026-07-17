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
  const [fotos, setFotos] = useState<string[]>([]);
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
   * Faz o upload e conversão das imagens para base64
   */
  const handleUploadFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoverFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Envia a proposta final do projeto (briefing bruto ou estruturado) como um contato no banco
   */
  const handleEnviarProposta = async () => {
    if (!nome || !email || !nomeProjeto || !ideiaBruta.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios e descreva sua ideia!");
      return;
    }

    // A mensagem enviada será o escopo gerado pela IA ou a transcrição bruta se não refinado
    const briefingFinal = escopoRefinado 
      ? `PROJETO: ${nomeProjeto}\n\nESCOPO REFINADO POR IA:\n${escopoRefinado}`
      : `PROJETO: ${nomeProjeto}\n\nIDEIA DO CLIENTE:\n${ideiaBruta}`;

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
          mensagem: briefingFinal,
          fotos: fotos.length > 0 ? JSON.stringify(fotos) : null
        })
      });

      if (response.ok) {
        setEnviado(true);
        setMensagemStatus("Sua proposta foi registrada com sucesso! Nossa equipe comercial revisará seu briefing e enviará suas credenciais de acesso por e-mail em breve.");
      } else {
        alert("Erro ao registrar briefing. Verifique se os dados estão corretos.");
      }
    } catch (error) {
      console.error("Erro ao enviar proposta:", error);
      alert("Erro ao conectar-se ao servidor.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080c14] text-slate-100 font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {enviado ? (
          /* CARD DE SUCESSO APÓS SUBMISSÃO */
          <div className="bg-white/[0.02] border border-white/10 p-8 rounded-3xl text-center space-y-6 animate-[scaleUp_0.3s_ease] shadow-2xl">
            <div className="w-16 h-16 bg-emerald-950/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-800/40">
              <svg className="w-8 h-8 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Briefing Enviado!</h2>
            <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm">
              {mensagemStatus}
            </p>
            <div className="pt-4">
              <a
                href="/"
                className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-indigo-950/20"
              >
                Voltar para a Home
              </a>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE CRIAÇÃO INTERATIVA */
          <div className="bg-white/[0.02] border border-white/10 p-8 md:p-10 rounded-3xl space-y-8 shadow-2xl">
            <div className="text-center space-y-3">
              <span className="text-indigo-400 font-extrabold uppercase tracking-widest text-[10px] bg-indigo-950/60 border border-indigo-900/30 px-3.5 py-1.5 rounded-full">
                Assistente de Briefing
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Monte seu Projeto Inteligente
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
                Descreva sua ideia no formulário abaixo. Se preferir, você pode falar no microfone ou anexar imagens de referência. O uso de IA para refinar os requisitos é opcional.
              </p>
            </div>

            {/* Badge quando logado */}
            {usuarioLogado && (
              <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl px-4 py-3 text-sm font-semibold text-emerald-400">
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Dados preenchidos automaticamente com sua conta logada
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Seu Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  readOnly={usuarioLogado}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl outline-none transition text-sm ${
                    usuarioLogado
                      ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400 font-semibold cursor-default"
                      : "border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  }`}
                  placeholder="Ex: Vitor Tavares"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">E-mail para Contato</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={usuarioLogado}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl outline-none transition text-sm ${
                    usuarioLogado
                      ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400 font-semibold cursor-default"
                      : "border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  }`}
                  placeholder="exemplo@empresa.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Nome Sugerido para o Projeto</label>
              <input
                type="text"
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                placeholder="Ex: Aplicativo de Delivery da Minha Loja"
                required
              />
            </div>

            {/* SEÇÃO DO GRAVADOR DE VOZ */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Descreva sua Ideia de Projeto
                </label>
                {SpeechRecognition && (
                  <button
                    type="button"
                    onClick={alternarGravacao}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider transition active:scale-95 ${
                      gravando 
                        ? "bg-red-950/60 text-red-400 border border-red-800/40 animate-pulse" 
                        : "bg-indigo-950/60 text-indigo-400 border border-indigo-900/30 hover:bg-indigo-900/40"
                    }`}
                  >
                    {gravando ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    ) : (
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                      </svg>
                    )}
                    {gravando ? "Gravando Áudio..." : "Falar por Áudio"}
                  </button>
                )}
              </div>

              <textarea
                value={ideiaBruta}
                onChange={(e) => setIdeiaBruta(e.target.value)}
                rows={5}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm leading-relaxed text-slate-200 placeholder:text-slate-600"
                placeholder='Escreva sua ideia aqui. Ex: "Quero criar um e-commerce integrado com pagamento via Pix, área do cliente, cálculo de frete e painel administrativo para relatórios de vendas..."'
                required
              />
            </div>

            {/* SEÇÃO DE ARQUIVOS/FOTOS */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Anexar Fotos / Capturas de Tela de Referência, Logos  (Opcional)
              </label>
              
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.04] hover:border-indigo-500/40 transition">
                  <div className="flex flex-col items-center justify-center text-center px-2">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[9px] text-slate-500 font-extrabold mt-1.5 uppercase tracking-wider">Foto</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadFotos}
                    className="hidden"
                  />
                </label>

                {/* Previews */}
                {fotos.map((foto, index) => (
                  <div key={index} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/10 group shadow-md bg-black/40">
                    <img src={foto} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoverFoto(index)}
                      className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow-md opacity-90 transition active:scale-90"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTÕES DE AÇÃO PRINCIPAIS */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 pt-6">
              <button
                type="button"
                onClick={handleRefinarComIA}
                disabled={refinando || !ideiaBruta.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-indigo-400 font-bold px-6 py-3.5 rounded-xl border border-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm"
              >
                {refinando ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-indigo-400 border-2 border-transparent border-t-indigo-400 rounded-full" viewBox="0 0 24 24" />
                    Estruturando com IA...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current text-indigo-400" viewBox="0 0 24 24">
                      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2z" />
                    </svg>
                    Refinar com IA
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleEnviarProposta}
                disabled={!nome || !email || !nomeProjeto || !ideiaBruta.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-950/20 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm"
              >
                🚀 Enviar Proposta de Projeto
              </button>
            </div>

            {/* RENDERIZAÇÃO DO BRIEFING REFINADO PELA IA */}
            {escopoRefinado && (
              <div className="bg-black/30 p-6 rounded-2xl border border-white/5 space-y-4 animate-[slideDown_0.3s_ease]">
                <h4 className="font-extrabold text-white text-sm border-b border-white/5 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400" />
                  Escopo Estruturado pela Dott IA
                </h4>
                <div className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto scrollbar-thin">
                  {escopoRefinado}
                </div>
                <p className="text-[10px] text-slate-500">
                  * A proposta acima será enviada junto com os arquivos anexados ao clicar em "Enviar Proposta de Projeto".
                </p>
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
