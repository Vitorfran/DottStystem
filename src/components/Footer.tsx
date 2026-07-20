export function Footer() {
  return (
    <footer className="Footer">
      <div className="footer-container">
        <div className="footer-brand">
          <a href="/" className="footer-logo">
            Dott<span className="dot">.</span>System
          </a>
          <p className="footer-description">
            Sistemas inteligentes projetados para empresas que desejam otimizar processos e escalar com eficiência.
          </p>
        </div>  

        <div className="footer-links">
          <h4>Navegação</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">Sobre</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contato</h4>
          <p>suporte@dottsystem.com</p>
          <p>+55 (11) 99999-9999</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} DottSystem. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;