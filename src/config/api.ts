// Configuração Centralizada da URL da API (Dott System)
// Em Produção (Vercel): usa VITE_API_URL se definida, ou "" (URL relativa do mesmo domínio que redireciona via vercel.json)
// Em Desenvolvimento Local: usa VITE_API_URL se definida, ou "http://localhost:3000"
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");
