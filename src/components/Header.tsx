import { useState, useEffect } from "react";
import "../styles/header.css";

function Header() {
  const [usuario, setUsuario] = useState<{ nome: string; role: string } | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Decodifica o payload do JWT sem biblioteca (não valida a assinatura, só lê os dados)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirado = payload.exp && payload.exp * 1000 < Date.now();
      if (expirado) {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        return;
      }
    } catch {
      return;
    }

    // Busca o nome do usuário logado na API
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.usuario) {
          setUsuario({ nome: data.usuario.nome, role: data.usuario.role });
        }
      })
      .catch(() => {});
  }, []);

  const handleSair = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  };

  // Destino do painel conforme o papel do usuário (role)
  const painelLink = usuario?.role === "admin" || usuario?.role === "funcionario" ? "/admin" : "/dashboard";
  const nomePrimeiro = usuario?.nome?.split(" ")[0] || "";

  return (
    <header className="Header">
      <div className="header-container">
        <a href="/" className="logo-brand">
          Dott<span className="dot">.</span>System
        </a>

        {/* Botão Hamburger (visível no mobile) */}
        <button
          className={`mobile-menu-btn ${menuAberto ? "open" : ""}`}
          onClick={() => setMenuAberto(!menuAberto)}
          aria-label="Alternar Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menu de Navegação (Desktop e Drawer no Mobile) */}
        <nav className={`nav-menu ${menuAberto ? "mobile-open" : ""}`}>
          <ul>
            <li>
              <a href="/" onClick={() => setMenuAberto(false)}>Home</a>
            </li>
            <li>
              <a href="/about" onClick={() => setMenuAberto(false)}>Sobre</a>
            </li>
            <li>
              <a href="/criar-projeto" onClick={() => setMenuAberto(false)}>Criar Projeto</a>
            </li>

            {!usuario && (
              <li>
                <a href="/login" onClick={() => setMenuAberto(false)}>Login</a>
              </li>
            )}

            {usuario && (
              <li>
                <a href={painelLink} onClick={() => setMenuAberto(false)}>Meu Painel</a>
              </li>
            )}
          </ul>

          {/* Ações no menu mobile */}
          <div className="mobile-actions">
            {usuario ? (
              <div className="mobile-user-box">
                <a href={painelLink} className="mobile-user-name">
                  👋 Olá, {nomePrimeiro}
                </a>
                <button onClick={handleSair} className="mobile-btn-sair">
                  Sair
                </button>
              </div>
            ) : (
              <a
                href="/criar-projeto"
                className="btn-header-cta mobile-cta-btn"
                onClick={() => setMenuAberto(false)}
              >
                🚀 Criar Projeto
              </a>
            )}
          </div>
        </nav>

        {/* Ações Desktop */}
        <div className="header-actions">
          {usuario ? (
            <>
              <a href={painelLink} className="header-user-link">
                👋 {nomePrimeiro}
              </a>
              <button onClick={handleSair} className="header-btn-sair">
                Sair
              </button>
            </>
          ) : (
            <a href="/criar-projeto" className="btn-header-cta">
              🚀 Criar Projeto
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;