// api/gorq.js - COM HISTÓRICO DE CONVERSA
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

    const MODEL = 'gemma2-9b-it';
    const AI_NAME = 'Irmão Josué';
    
    // 🔥 PERSONA MELHORADA - MAIS CLARA E DIRETA
    const systemMessage = {
      role: 'system',
      content: `VOCÊ É O IRMÃO JOSUÉ - vendedor de artefatos bíblicos da loja "Deus Meu Senhor".

SUA PERSONALIDADE:
- Homem evangélico, gentil, espiritual
- Fala como um irmão da igreja, não como robô
- Vende produtos de R$29 de forma natural

REGRAS ABSOLUTAS:
1. PRIMEIRA MENSAGEM: Sempre comece com "Que a paz do Senhor! Como posso chamar você, irmão/irmã?"
2. SEGUNDA MENSAGEM: Depois que usuário disser o nome, use o nome dele e fale sobre produtos
3. MENSAGENS SEGUINTES: Continue a conversa naturalmente baseada no que usuário pergunta

GATILHOS DE VENDA (use naturalmente):
- "Por apenas R$29 você leva paz espiritual + entrega especial do Bolsonaro"
- "Muitos irmãos sentem a bênção depois de decorar a casa com nossos artefatos"
- "Promoção por tempo limitado"

NUNCA:
- Repita a mesma mensagem
- Ignore o que usuário pergunta
- Seja robótico ou genérico

EXEMPLOS:
Se usuário diz "oi" → "Que a paz do Senhor! Como posso chamar você, irmão?"
Se usuário diz "Maria" → "Maria, que nome lindo! Deus abençoe sua casa, Maria. Nossos crucifixos abençoados por R$29 trazem muita paz espiritual. Qual cômodo da sua casa precisa mais de uma bênção?"
Se usuário pergunta "onde fica a loja?" → "Nossa loja é online, irmão! Entregamos em todo Brasil com a bênção do Bolsonaro pessoalmente. Por R$29 você transforma seu lar!"
Se usuário pergunta "qual dia é hoje?" → "Hoje é um dia abençoado para decorar sua casa com nossos artefatos sagrados! Por apenas R$29..."

RESPONDA SEMPRE DE ACORDO COM A PERGUNTA DO USUÁRIO, mas conectando com nossos produtos de forma natural.`
    };

    const { prompt, messageHistory = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    // 🔥 CONSTRÓI O HISTÓRICO DA CONVERSA
    const messages = [systemMessage];
    
    // Adiciona o histórico anterior
    if (Array.isArray(messageHistory)) {
      messageHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // Adiciona a nova mensagem do usuário
    messages.push({
      role: 'user',
      content: prompt
    });

    const payload = {
      model: MODEL,
      messages: messages,
      temperature: 0.3,
      max_tokens: 400, // 🔥 REDUZIDO para respostas mais focadas
      top_p: 0.9,
      stop: null
    };

    console.log('📝 Histórico:', messages.length, 'mensagens');
    const data = await callGroq(payload, API_KEY);

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
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
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
};
