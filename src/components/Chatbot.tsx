import { useState, useRef, useEffect, type FormEvent } from 'react';

export default function Chatbot() {
  const [aberto, setAberto] = useState(false);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 11));
  const [mensagens, setMensagens] = useState([
    { autor: 'ia', texto: 'Olá! Sou o assistente da Dott System. Como posso ajudar com seu projeto web hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Referência para fazer o auto-scroll sempre que uma nova mensagem chegar
  const fimDoChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textoUsuario = input;
    // Adiciona a mensagem do usuário na tela imediatamente
    setMensagens((prev) => [...prev, { autor: 'usuario', texto: textoUsuario }]);
    setInput('');
    setCarregando(true);

    try {
      // Bate na rota da API Express
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagemUsuario: textoUsuario, sessionId }),
      });

      if (!response.ok) throw new Error('Falha no servidor');

      const data = await response.json();

      // Adiciona a resposta da IA no histórico
      setMensagens((prev) => [...prev, { autor: 'ia', texto: data.resposta }]);

    } catch (error) {
      console.error("Erro:", error);
      setMensagens((prev) => [...prev, { autor: 'ia', texto: 'Ops! Ocorreu uma instabilidade na conexão. Se precisar, acesse diretamente nossa página de [Criar Proposta](/criar-projeto).' }]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Janela do Chat */}
      {aberto && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 mb-4 animate-fade-in-up">
          {/* Cabeçalho */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-bold text-lg leading-none">Assistente Dott</h3>
              <span className="text-blue-200 text-xs">Online agora</span>
            </div>
            <button
              onClick={() => setAberto(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="h-96 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            {mensagens.map((msg, idx) => {
              const renderizarTexto = (texto: string) => {
                // Substitui **texto** por negrito <strong>
                let html = texto.replace(/\*\*([^*]+)\*\*/g, 
                  '<strong class="font-bold text-gray-900">$1</strong>'
                );
                // Substitui [Texto](URL ou rota) por link HTML clicável
                html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
                  '<a href="$2" class="text-blue-600 underline font-semibold hover:text-blue-800">$1</a>'
                );
                // Substitui URLs avulsas por links
                html = html.replace(/(?<!href=")(?<!">)(https?:\/\/[^\s()<]+)/g, 
                  '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800">$1</a>'
                );
                return <div dangerouslySetInnerHTML={{ __html: html }} />;
              };

              return (
                <div
                  key={idx}
                  className={`max-w-[80%] p-3 rounded-xl text-sm whitespace-pre-wrap ${msg.autor === 'ia'
                      ? 'bg-white border border-gray-200 text-gray-800 self-start rounded-tl-none'
                      : 'bg-blue-600 text-white self-end rounded-tr-none shadow-sm'
                    }`}
                >
                  {msg.autor === 'ia' ? renderizarTexto(msg.texto) : msg.texto}
                </div>
              );
            })}

            {carregando && (
              <div className="bg-white border border-gray-200 text-gray-500 self-start rounded-xl rounded-tl-none p-3 text-sm flex gap-1 items-center">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            )}
            <div ref={fimDoChatRef} />
          </div>

          {/* Input e Botão de Enviar */}
          <form onSubmit={enviarMensagem} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida..."
              className="flex-1 bg-gray-100 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={carregando}
            />
            <button
              type="submit"
              disabled={carregando || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}

      {/* Botão Flutuante (Abre/Fecha o Chat) */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}
    </div>
  );
}