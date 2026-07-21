import { useState, useRef, useEffect, type FormEvent } from 'react';
import mestreLogo from '../assets/imagens/mestre_das_aliancas_logo.jpg';
import { API_URL } from '../config/api';

export default function ChatbotMestre() {
  const [aberto, setAberto] = useState(false);
  const [sessionId] = useState(() => 'sess_mestre_' + Math.random().toString(36).substring(2, 11));
  const [mensagens, setMensagens] = useState([
    { 
      autor: 'ia', 
      texto: 'Olá! Seja bem-vindo à **Mestre das Alianças**.\n\nSou seu assistente especialista em **Alianças de Ouro 18k e Prata 950**. Como posso ajudar a escolher a aliança perfeita hoje?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fimDoChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textoUsuario = input;
    setMensagens((prev) => [...prev, { autor: 'usuario', texto: textoUsuario }]);
    setInput('');
    setCarregando(true);

    try {
      const response = await fetch(`${API_URL}/api/chat-mestre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagemUsuario: textoUsuario, sessionId }),
      });

      if (!response.ok) throw new Error('Falha no servidor');

      const data = await response.json();
      setMensagens((prev) => [...prev, { autor: 'ia', texto: data.resposta }]);

    } catch (error) {
      console.error("Erro no chat Mestre das Alianças:", error);
      setMensagens((prev) => [...prev, { 
        autor: 'ia', 
        texto: 'Ops! Ocorreu uma instabilidade na conexão. Se desejar, fale diretamente pelo nosso atendimento no WhatsApp.' 
      }]);
    } finally {
      setCarregando(false);
    }
  };





  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Janela do Chat Mestre das Alianças */}
      {aberto && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden transition-all duration-300 mb-4 animate-fade-in-up">
          
          {/* Cabeçalho Dourado Premium */}
          <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white p-4 flex justify-between items-center shadow-md">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open('https://mestredasaliancas.com.br', '_blank', 'noopener,noreferrer')}
              title="Acessar mestredasaliancas.com.br"
            >
              <img 
                src={mestreLogo} 
                alt="Mestre das Alianças" 
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow-sm" 
              />
              <div>
                <h3 className="font-bold text-base leading-none">
                  Mestre das Alianças
                </h3>
                <span className="text-amber-200 text-xs flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Especialista em Joias
                </span>
              </div>
            </div>
            <button 
              onClick={() => setAberto(false)}
              className="text-amber-100 hover:text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="h-96 overflow-y-auto p-4 bg-amber-50/40 flex flex-col gap-3">
            {mensagens.map((msg, idx) => {
              const renderizarTexto = (texto: string) => {
                // Substitui **texto** por negrito <strong>
                let html = texto.replace(/\*\*([^*]+)\*\*/g, 
                  '<strong class="font-bold text-amber-950">$1</strong>'
                );
                // Substitui [Texto](URL ou rota) por link HTML clicável
                html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
                  '<a href="$2" class="text-amber-700 underline font-semibold hover:text-amber-900">$1</a>'
                );
                // Substitui URLs avulsas por links
                html = html.replace(/(?<!href=")(?<!">)(https?:\/\/[^\s()<]+)/g, 
                  '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-amber-700 underline font-semibold hover:text-amber-900">$1</a>'
                );
                return <div dangerouslySetInnerHTML={{ __html: html }} />;
              };

              return (
                <div 
                  key={idx} 
                  className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
                    msg.autor === 'ia' 
                      ? 'bg-white border border-amber-100 text-gray-800 self-start rounded-tl-none shadow-xs' 
                      : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white self-end rounded-tr-none shadow-sm'
                  }`}
                >
                  {msg.autor === 'ia' ? renderizarTexto(msg.texto) : msg.texto}
                </div>
              );
            })}
            
            {carregando && (
              <div className="bg-white border border-amber-200 text-amber-600 self-start rounded-xl rounded-tl-none p-3 text-sm flex gap-1 items-center shadow-xs">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            )}
            <div ref={fimDoChatRef} />
          </div>

          {/* Form de Input */}
          <form onSubmit={enviarMensagem} className="p-3 bg-white border-t border-amber-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre modelos, ouro, prata..."
              className="flex-1 bg-amber-50/50 border border-amber-200 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-gray-800"
              disabled={carregando}
            />
            <button 
              type="submit" 
              disabled={carregando || !input.trim()}
              className="bg-amber-600 text-white p-2.5 rounded-full hover:bg-amber-700 disabled:bg-gray-300 transition-colors flex items-center justify-center shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Botão Flutuante Esquerdo (Mestre das Alianças) */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-full p-3.5 shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 border-2 border-amber-300"
          title="Chat Mestre das Alianças"
        >
          <img src={mestreLogo} alt="Logo" className="w-7 h-7 rounded-full object-cover border border-amber-200" />
          <span className="text-xs font-bold pr-1 hidden sm:inline">Mestre Alianças</span>
        </button>
      )}
    </div>
  );
}
