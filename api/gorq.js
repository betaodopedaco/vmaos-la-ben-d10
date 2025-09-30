// api/gorq.js - VERSÃO FINAL COM VARIÁVEIS DE AMBIENTE
const fetch = require('node-fetch');

function cleanApiKey(key) {
  if (!key) return key;
  return key.toString().trim().replace(/\s+/g, '').replace(/\n/g, '');
}

async function callGroq(payload, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return await response.json();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const API_KEY = cleanApiKey(process.env.GROQ_API_KEY);
    if (!API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY não configurada.' });

    // 🔥 VARIÁVEIS DE AMBIENTE
    const MODEL = process.env.GROQ_MODEL || 'gemma2-9b-it';
    const AI_NAME = process.env.AI_NAME || 'Irmão Josué';
    const AI_PERSONA = process.env.AI_PERSONA || `Você é um vendedor gentil de artefatos bíblicos.`;

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório.' });

    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: AI_PERSONA },
        { role: 'user', content: prompt }
      ],
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 600,
      top_p: parseFloat(process.env.AI_TOP_P) || 0.9
    };

    console.log('Enviando para Groq - modelo:', MODEL);
    const data = await callGroq(payload, API_KEY);

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const content = data.choices[0]?.message?.content || 'Sem resposta da IA';
    
    return res.status(200).json({
      name: AI_NAME,
      content: content,
      usage: data.usage || {},
      raw: data
    });

  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
};
