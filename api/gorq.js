// api/gorq.js - VERSÃO COM DEBUG
const fetch = require('node-fetch');

function cleanApiKey(key) {
  if (!key) return key;
  const cleaned = key.toString().trim().replace(/\s+/g, '').replace(/\n/g, '');
  console.log('🔐 API Key (primeiros 10 chars):', cleaned.substring(0, 10) + '...');
  return cleaned;
}

// ... resto do código mantido ...

module.exports = async (req, res) => {
  // ... código anterior ...

  try {
    const API_KEY = cleanApiKey(process.env.GROQ_API_KEY);
    
    // 🔥 DEBUG DETALHADO
    console.log('🔍 DEBUG AMBIENTE:');
    console.log('GROQ_API_KEY existe?:', process.env.GROQ_API_KEY ? '✅ SIM' : '❌ NÃO');
    console.log('Comprimento da chave:', API_KEY ? API_KEY.length : 'N/A');
    
    if (!API_KEY) {
      console.error('❌ ERRO: GROQ_API_KEY não configurada');
      return res.status(500).json({ error: 'GROQ_API_KEY não configurada.' });
    }

    if (API_KEY.length < 20) {
      console.error('❌ ERRO: Chave muito curta - provavelmente inválida');
      return res.status(500).json({ error: 'Chave API muito curta - verifique no Vercel' });
    }

    // ... resto do código ...
