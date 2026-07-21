import { useState, useRef, type FormEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import logoImg from "../assets/imagens/logo.png";
import { API_URL } from "../config/api";

type Passo = "formulario" | "verificacao" | "sucesso";

function Cadastro() {
  const navigate = useNavigate();

  // ── Dados do formulário ─────────────────────────────────────────────────────
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // ── Estado do fluxo ─────────────────────────────────────────────────────────
  const [passo, setPasso] = useState<Passo>("formulario");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [reenviando, setReenviando] = useState(false);
  const [msgReenvio, setMsgReenvio] = useState<string | null>(null);

  // ── Código de verificação (6 caixas individuais) ────────────────────────────
  const [digitos, setDigitos] = useState(["", "", "", "", "", ""]);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const apiUrl = API_URL;

  // ────────────────────────────────────────────────────────────────────────────
  // PASSO 1 — Submeter o formulário de cadastro
  // ────────────────────────────────────────────────────────────────────────────
  const handleCadastrar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasso("verificacao");
        // Foca na primeira caixa após transição
        setTimeout(() => refs[0].current?.focus(), 100);
      } else {
        setErro(data.message || "Erro ao criar conta. Tente novamente.");
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // PASSO 2 — Gerenciar as caixas de dígitos individuais
  // ────────────────────────────────────────────────────────────────────────────
  const handleDigito = (index: number, valor: string) => {
    // Aceita apenas números
    const num = valor.replace(/\D/g, "").slice(-1);
    const novos = [...digitos];
    novos[index] = num;
    setDigitos(novos);

    // Avança para o próximo campo automaticamente
    if (num && index < 5) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Volta ao campo anterior ao apagar
    if (e.key === "Backspace" && !digitos[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  // Suporte a colar o código completo (ex: ctrl+v com "123456")
  const handleColar = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const colado = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (colado.length === 6) {
      const novos = colado.split("");
      setDigitos(novos);
      refs[5].current?.focus();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // PASSO 2 — Verificar o código digitado
  // ────────────────────────────────────────────────────────────────────────────
  const handleVerificar = async () => {
    const codigo = digitos.join("");
    if (codigo.length < 6) {
      setErro("Digite todos os 6 dígitos do código.");
      return;
    }

    setErro(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/verificar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasso("sucesso");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setErro(data.message || "Código inválido. Tente novamente.");
        // Limpa os campos e foca no primeiro
        setDigitos(["", "", "", "", "", ""]);
        setTimeout(() => refs[0].current?.focus(), 50);
      }
    } catch {
      setErro("Não foi possível verificar o código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Reenviar código
  // ────────────────────────────────────────────────────────────────────────────
  const handleReenviar = async () => {
    setReenviando(true);
    setMsgReenvio(null);
    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsgReenvio("✅ Novo código enviado! Verifique sua caixa de entrada.");
        setDigitos(["", "", "", "", "", ""]);
        setTimeout(() => refs[0].current?.focus(), 50);
      } else {
        setMsgReenvio(data.message || "Erro ao reenviar.");
      }
    } catch {
      setMsgReenvio("Erro de conexão ao reenviar.");
    } finally {
      setReenviando(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <section className="py-16 bg-gray-50 flex justify-center items-center min-h-[85vh]">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logoImg} alt="Dott System Logo" className="h-12 w-auto object-contain" />
          </div>

          {/* ─── PASSO SUCESSO ───────────────────────────────────────────── */}
          {passo === "sucesso" && (
            <div className="text-center space-y-5 py-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-200 animate-[scaleUp_0.4s_ease]">
                <svg className="w-10 h-10 text-emerald-500 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800">Conta verificada! 🎉</h2>
              <p className="text-gray-500 text-sm">
                Seu e-mail foi confirmado com sucesso.<br />
                Redirecionando para o login...
              </p>
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {/* ─── PASSO VERIFICAÇÃO DO CÓDIGO ─────────────────────────────── */}
          {passo === "verificacao" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border-4 border-indigo-100 mb-4">
                  <svg className="w-7 h-7 text-indigo-600 fill-current" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-800">Confirme seu e-mail</h2>
                <p className="text-gray-500 text-sm mt-2">
                  Enviamos um código de 6 dígitos para<br />
                  <span className="font-bold text-gray-700">{email}</span>
                </p>
              </div>

              {/* Erro */}
              {erro && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              )}

              {/* Mensagem de reenvio */}
              {msgReenvio && (
                <div className={`p-3 rounded-lg text-sm text-center font-medium ${
                  msgReenvio.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {msgReenvio}
                </div>
              )}

              {/* Caixas de dígitos */}
              <div className="flex justify-center gap-3">
                {digitos.map((d, i) => (
                  <input
                    key={i}
                    ref={refs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigito(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handleColar : undefined}
                    className={`w-12 h-14 text-center text-2xl font-extrabold border-2 rounded-xl outline-none transition-all duration-200 ${
                      d
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                        : "border-gray-200 bg-gray-50 text-gray-800 focus:border-indigo-400 focus:bg-white"
                    }`}
                  />
                ))}
              </div>

              {/* Indicador de progresso visual */}
              <div className="flex justify-center gap-1.5">
                {digitos.map((d, i) => (
                  <div
                    key={i}
                    className={`h-1 w-8 rounded-full transition-all duration-300 ${d ? "bg-indigo-500" : "bg-gray-200"}`}
                  />
                ))}
              </div>

              {/* Botão de confirmar */}
              <button
                onClick={handleVerificar}
                disabled={loading || digitos.join("").length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition active:scale-[0.98] flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : "Confirmar e-mail"}
              </button>

              {/* Reenviar código */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Não recebeu?{" "}
                  <button
                    onClick={handleReenviar}
                    disabled={reenviando}
                    className="text-indigo-600 font-bold hover:text-indigo-800 transition disabled:opacity-50"
                  >
                    {reenviando ? "Reenviando..." : "Reenviar código"}
                  </button>
                </p>
              </div>

              {/* Voltar */}
              <button
                onClick={() => { setPasso("formulario"); setErro(null); setDigitos(["","","","","",""]); }}
                className="w-full text-gray-400 hover:text-gray-600 text-sm text-center transition"
              >
                ← Voltar e alterar e-mail
              </button>
            </div>
          )}

          {/* ─── PASSO FORMULÁRIO ──────────────────────────────────────────── */}
          {passo === "formulario" && (
            <>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-1 text-center">
                Crie sua conta
              </h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Acesse o painel e acompanhe seu projeto em tempo real
              </p>

              {erro && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded-r-lg">
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              )}

              <form onSubmit={handleCadastrar} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Seu nome completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                    placeholder="Ex: João da Silva"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                    placeholder="seuemail@exemplo.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Crie uma senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirme a senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm ${
                      confirmarSenha && senha !== confirmarSenha
                        ? "border-red-300 bg-red-50"
                        : confirmarSenha && senha === confirmarSenha
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200"
                    }`}
                    placeholder="Repita a senha"
                    required
                    disabled={loading}
                  />
                  {confirmarSenha && senha !== confirmarSenha && (
                    <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
                  )}
                  {confirmarSenha && senha === confirmarSenha && (
                    <p className="text-emerald-600 text-xs mt-1 font-medium">✓ Senhas coincidem</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition active:scale-[0.98] flex justify-center items-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando código...
                    </>
                  ) : "Criar conta e verificar e-mail →"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Já tem conta?{" "}
                <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition">
                  Fazer login
                </Link>
              </p>
            </>
          )}

        </div>
      </section>
    </>
  );
}

export default Cadastro;
