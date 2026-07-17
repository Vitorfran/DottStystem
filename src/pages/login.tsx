import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import logoImg from "../assets/imagens/logo.png";


/**
 * Componente de Login da Área do Cliente (Dott System)
 * 
 * Este componente gerencia o estado das credenciais (email e senha),
 * realiza a requisição POST para a nossa rota do Express, e salva o JWT
 * retornado pelo backend para persistência de sessão.
 */
function Login() {

    
  // O hook useNavigate permite redirecionar o usuário por código após o sucesso
  const navigate = useNavigate();

  // Estados locais para controlar os campos e a interface
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Manipulador do envio do formulário
   * Evento assíncrono para lidar com chamadas de rede HTTP
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Impede a página de recarregar
    setErro(null);
    setLoading(true);

    try {
      // Fazemos a chamada para o nosso backend na porta 3000
      // VITE_API_URL pode ser configurada no seu .env. Se não existir, aponta para localhost:3000
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.role);

        // Redireciona conforme o papel do usuário
        if (data.role === "admin" || data.role === "funcionario") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setErro(data.message || "E-mail ou senha incorretos.");
      }
    } catch (err) {
      console.error("Erro de conexão ao fazer login:", err);
      setErro("Não foi possível conectar ao servidor. Tente novamente mais tarde.");
    } finally {
      setLoading(false); // Retorna o botão ao estado ativo
    }
  };

  return (
    <> {/* 1. Abre o embrulho invisível */}
    <Header />
    <section className="py-16 bg-gray-50 flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        {/* Logotipo físico da Dott System */}
        <div className="flex justify-center mb-6">
          <img src={logoImg} alt="Dott System Logo" className="h-12 w-auto object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Área do Cliente
        </h2>

        {/* Renderiza mensagem de erro se a validação do backend ou frontend falhar */}
        {erro && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="seuemail@exemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha de acesso
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-semibold py-3 rounded-lg transition duration-300 transform hover:scale-[1.01] flex justify-center items-center ${
              loading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 text-white border-2 border-transparent border-t-white rounded-full" viewBox="0 0 24 24" />
                Validando Acesso...
              </>
            ) : (
              "Acessar Painel"
            )}
          </button>
        </form>

        {/* Link para cadastro */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-blue-600 font-bold hover:text-blue-800 transition">
            Criar conta grátis
          </Link>
        </p>

      </div>
    </section>
    </>
  );
}

export default Login;