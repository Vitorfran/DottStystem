import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config/api";

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

    const apiUrl = API_URL;
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

  const alternarGravacao = () => {
    if (!reconhecimento) {
      alert("Seu navegador não possui suporte nativo para gravação de voz.");
      return;
    }

    if (gravando) {
      reconhecimento.stop();
      setGravando(false);
    } else {
      setIdeiaBruta(""); 
      reconhecimento.start();
      setGravando(true);
    }
  };

  const handleRefinarComIA = async () => {
    if (!ideiaBruta.trim()) {
      alert("Por favor, fale ou digite sua ideia de projeto primeiro!");
      return;
    }

    setRefinando(true);
    setEscopoRefinado(null);

    try {
      const apiUrl = API_URL;
      const response = await fetch(`${apiUrl}/api/contato/refinar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: ideiaBruta })
      });

      const data = await response.json();

      if (response.ok) {
        setEscopoRefinado(data.escopo);
      } else {
        alert(data.message || "Não foi possível refinar seu escopo.");
      }
    } catch (error) {
      console.error("Erro ao refinar ideia:", error);
      alert("Ocorreu um erro ao conectar-se ao assistente de IA.");
    } finally {
      setRefinando(false);
    }
  };

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

  const handleEnviarProposta = async () => {
    if (!nome || !email || !nomeProjeto || !ideiaBruta.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios!");
      return;
    }

    const briefingFinal = escopoRefinado 
      ? `PROJETO: ${nomeProjeto}\n\nESCOPO REFINADO POR IA:\n${escopoRefinado}`
      : `PROJETO: ${nomeProjeto}\n\nIDEIA DO CLIENTE:\n${ideiaBruta}`;

    try {
      const apiUrl = API_URL;
      const response = await fetch(`${apiUrl}/api/contato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          mensagem: briefingFinal,
          fotos: fotos.length > 0 ? JSON.stringify(fotos) : null
        })
      });

      if (response.ok) {
        setEnviado(true);
        setMensagemStatus("Sua proposta foi registrada com sucesso! Nossa equipe comercial revisará seu briefing e enviará suas credenciais de acesso por e-mail em breve.");
      } else {
        alert("Erro ao registrar briefing.");
      }
    } catch (error) {
      console.error("Erro ao enviar proposta:", error);
      alert("Erro ao conectar-se ao servidor.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-900 font-sans" style={{ background: "var(--page-bg)" }}>
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {enviado ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/90 border border-white p-10 rounded-[2.5rem] text-center space-y-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <svg className="w-10 h-10 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Proposta Enviada!</h2>
              <p className="text-slate-600 max-w-lg mx-auto leading-relaxed text-lg">
                {mensagemStatus}
              </p>
              <div className="pt-6">
                <a
                  href="/"
                  className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black px-10 py-5 rounded-2xl transition shadow-xl shadow-indigo-900/30 active:scale-95"
                >
                  Voltar para a Home
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-block text-indigo-600 font-black uppercase tracking-[0.25em] text-[10px] bg-indigo-50 border border-indigo-100 px-5 py-2.5 rounded-full"
                >
                  Assistente de Projetos
                </motion.span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-6xl">
                  Vamos dar vida à sua ideia.
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                  Descreva seu projeto com suas próprias palavras ou use o microfone. Nossa IA ajudará a estruturar tudo para você.
                </p>
              </div>

              <div className="bg-white/70 border border-white p-8 md:p-14 rounded-[3rem] shadow-2xl backdrop-blur-3xl space-y-12">
                {/* Identificação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Seu Nome</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      readOnly={usuarioLogado}
                      className={`w-full px-7 py-5 bg-white/50 border rounded-[1.25rem] outline-none transition text-sm font-semibold ${
                        usuarioLogado ? "border-emerald-100 text-emerald-700 bg-emerald-50/50" : "border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 shadow-sm"
                      }`}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={usuarioLogado}
                      className={`w-full px-7 py-5 bg-white/50 border rounded-[1.25rem] outline-none transition text-sm font-semibold ${
                        usuarioLogado ? "border-emerald-100 text-emerald-700 bg-emerald-50/50" : "border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 shadow-sm"
                      }`}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Nome do Projeto */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome do Projeto</label>
                  <input
                    type="text"
                    value={nomeProjeto}
                    onChange={(e) => setNomeProjeto(e.target.value)}
                    className="w-full px-7 py-5 bg-white/50 border border-slate-200 text-slate-900 rounded-[1.25rem] font-semibold focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 shadow-sm outline-none transition text-sm"
                    placeholder="Como vamos chamar seu projeto?"
                    required
                  />
                </div>

                {/* Ideia Principal */}
                <div className="space-y-5">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">A Ideia</label>
                    {SpeechRecognition && (
                      <button
                        type="button"
                        onClick={alternarGravacao}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition relative ${
                          gravando ? "bg-red-500 text-white shadow-xl shadow-red-200" : "bg-white border border-slate-200 text-indigo-600 hover:bg-slate-50 shadow-sm"
                        }`}
                      >
                        {gravando && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.4 }}
                            className="absolute inset-0 rounded-2xl bg-red-500"
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          {gravando ? "Ouvindo..." : "Usar Voz"}
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                          </svg>
                        </span>
                      </button>
                    )}
                  </div>
                  <textarea
                    value={ideiaBruta}
                    onChange={(e) => setIdeiaBruta(e.target.value)}
                    rows={7}
                    className="w-full p-8 bg-white/50 border border-slate-200 rounded-[2rem] font-medium focus:border-indigo-500 focus:ring-[6px] focus:ring-indigo-500/5 shadow-sm outline-none transition text-lg leading-relaxed text-slate-800 placeholder:text-slate-300"
                    placeholder="Conte-nos sobre sua visão, funcionalidades desejadas..."
                    required
                  />
                </div>

                {/* Upload e Referências */}
                <div className="space-y-5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Referências Visuais (Opcional)</label>
                  <div className="flex gap-6 flex-wrap">
                    <label className="flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition group bg-white/40 shadow-sm">
                      <svg className="w-9 h-9 text-slate-300 group-hover:text-indigo-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-tighter">Anexar</span>
                      <input type="file" multiple accept="image/*" onChange={handleUploadFotos} className="hidden" />
                    </label>

                    {fotos.map((foto, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-36 h-36 rounded-[2rem] overflow-hidden border border-slate-200 group shadow-lg"
                      >
                        <img src={foto} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoverFoto(index)}
                          className="absolute top-3 right-3 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black opacity-0 group-hover:opacity-100 transition shadow-xl"
                        >
                          &times;
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <button
                    type="button"
                    onClick={handleRefinarComIA}
                    disabled={refinando || !ideiaBruta.trim()}
                    className="flex-1 flex items-center justify-center gap-4 bg-white hover:bg-slate-50 text-indigo-600 font-black px-8 py-6 rounded-2xl border border-slate-200 transition disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    {refinando ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Estruturando...
                      </div>
                    ) : (
                      <>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Refinar com IA
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleEnviarProposta}
                    disabled={!nome || !email || !nomeProjeto || !ideiaBruta.trim()}
                    className="flex-[1.5] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black px-10 py-6 rounded-2xl shadow-2xl shadow-indigo-900/30 transition active:scale-95 disabled:opacity-50"
                  >
                    🚀 Enviar Proposta
                  </button>
                </div>

                {/* Resultado IA Editável */}
                <AnimatePresence>
                  {escopoRefinado !== null && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50/90 p-8 md:p-10 rounded-[2.5rem] border border-slate-200 space-y-5 shadow-sm"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200 pb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                          <div>
                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Escopo Estruturado pela Dott IA</h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">✏️ Você pode editar e personalizar qualquer ponto do escopo abaixo antes de enviar sua proposta.</p>
                          </div>
                        </div>
                      </div>

                      <textarea
                        value={escopoRefinado}
                        onChange={(e) => setEscopoRefinado(e.target.value)}
                        rows={14}
                        className="w-full p-6 bg-white border border-slate-200 rounded-[1.5rem] font-mono text-sm font-medium leading-relaxed text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs outline-none transition"
                        placeholder="Edite ou personalize a sugestão da IA aqui..."
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default CriarProjeto;
