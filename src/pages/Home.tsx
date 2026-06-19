import { Header } from "../components/Header";
import Footer from "../components/Footer";
import "../styles/home.css";

function Home() {
  return (
    <>
      <Header />

      <main>
        <section className="hero">
    <div className="hero-content">

        <h1>
         Sistemas inteligentes para empresas que
        <span style={{ color: "blue" }}>
        precisam escalar.
        </span>
        </h1>   

        <p>
            O DottSystem ajuda você a organizar processos,
            acompanhar demandas e aumentar sua produtividade.
        </p>

        <div className="buttons">
            <button className="btn-primary">Começar Agora</button>
            <button className="btn-secondary">Saiba Mais</button>
        </div>
    </div>

    <div className="hero-image">
        <img src="src/assets/imagens/logo.png" alt="Imagem de destaque" />
    </div>
</section>

      </main>

      <Footer />
    </>
  );
}

export default Home;