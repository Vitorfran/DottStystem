import "../styles/header.css";

export function Header() {
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
            <li><a href="/login">Login</a></li>
          </ul>
        </nav>
        <div className="header-actions">
          <a href="#demo" className="btn-header-cta">Começar Agora</a>
        </div>
      </div>
    </header>
  );
}

export default Header;