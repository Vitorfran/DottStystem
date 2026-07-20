import { useState, useEffect } from "react";
import "../styles/header.css";

function Header() {
  const [usuario, setUsuario] = useState<{ nome: string; role: string } | null>(null);

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



  // Destino do painel conforme o papel do usuário ( role ) 
  const painelLink = usuario?.role === "admin" || usuario?.role === "funcionario" ? "/admin" : "/dashboard";
  const nomePrimeiro = usuario?.nome?.split(" ")[0] || "";

  return (
    <header className="Header">
      <div className="header-container">
        <a href="/" className="logo-brand">
          Dott<span className="dot">.</span>System
        </a>

        <nav className="nav-menu">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">Sobre</a></li>
            <li><a href="/criar-projeto">Criar Projeto</a></li>

            {/* Mostra Login apenas se NÃO estiver logado */}
            {!usuario && (
              <li><a href="/login">Login</a></li>
            )}

            {/* Mostra o link do painel se estiver logado */}
            {usuario && (
              <li><a href={painelLink}>Meu Painel</a></li>
            )}
          </ul>
        </nav>

        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {usuario ? (
            /* Usuário logado: mostra saudação + botão sair */
            <>
              <a
                href={painelLink}
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#4f46e5",
                  textDecoration: "none",
                  whiteSpace: "nowrap"
                }}
              >
                👋 {nomePrimeiro}
              </a>
              <button
                onClick={handleSair}
                style={{
                  background: "transparent",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.borderColor = "#cbd5e1";
                  (e.target as HTMLButtonElement).style.color = "#334155";
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.borderColor = "#e2e8f0";
                  (e.target as HTMLButtonElement).style.color = "#64748b";
                }}
              >
                Sair
              </button>
            </>
          ) : (
            /* Não logado: botão de CTA */
            <a href="/criar-projeto" className="btn-header-cta">🚀 Criar Projeto</a>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;