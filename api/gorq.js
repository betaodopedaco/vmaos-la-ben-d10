// api/gorq.js - VERSÃO COM RECOMENDAÇÃO DE BOTÕES
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const API_KEY = process.env.GROQ_API_KEY;
    const cleanedKey = API_KEY.trim().replace(/\s+/g, '').replace(/\n/g, '');
    
    if (!cleanedKey.startsWith('gsk_')) {
      return res.status(500).json({ error: 'Chave API inválida' });
    }

    const MODEL = process.env.GROQ_MODEL || 'gemma2-9b-it';
    const AI_NAME = process.env.AI_NAME || 'Irmão Josué';
    const AI_PERSONA = process.env.AI_PERSONA || 'Você é um vendedor gentil.';

    const { prompt, messageHistory = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    // Construir mensagens
    const messages = [
      { role: 'system', content: AI_PERSONA }
    ];

    // Adicionar histórico
    if (Array.isArray(messageHistory)) {
      messageHistory.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // Adicionar prompt atual
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model: MODEL,
      messages: messages,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 500,
      top_p: parseFloat(process.env.AI_TOP_P) || 0.9
    };

    console.log('🛍️ IA vendendo com recomendação de botões...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanedKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro da API:', data);
      return res.status(400).json({ 
        error: data.error?.message || 'Erro na API'
      });
    }

    const content = data.choices[0]?.message?.content || 'Sem resposta';
    
    return res.status(200).json({
      name: AI_NAME,
      content: content,
      usage: data.usage || {},
      raw: data
    });

  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ 
      error: 'Erro interno', 
      details: err.message 
    });
  }
};
