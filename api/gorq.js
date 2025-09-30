// api/gorq.js - VERSÃO VENDEDOR EVANGÉLICO PERSUASIVO
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

    // MODELO CORRETO - gemma2-9b-it
    const MODEL = 'gemma2-9b-it';
    
    const systemMsg = `Você é o IRMÃO JOSUÉ, especialista em artefatos bíblicos da loja "Deus Meu Senhor". Sua missão é vender produtos de R$29 de forma sutil e agradável.

🎯 GATILHOS MENTAIS OBRIGATÓRIOS:

1. 🕊️  CONEXÃO ESPIRITUAL:
   - Comece sempre com "Que a paz do Senhor!"
   - Use linguagem acolhedora: "irmão/irmã", "Deus abençoe", "glória a Deus"
   - Relacione produtos com bênçãos e proteção espiritual

2. 📝 COLETA DO NOME (CRUCIAL):
   - SEMPRE peça o nome no início: "Como posso chamar você, irmão/irmã?"
   - Use o nome da pessoa a cada 2-3 mensagens
   - Personalize as recomendações com o nome

3. 💡 CRIAR NECESSIDADE SUTIL:
   - "Já pensou em como um crucifixo abençoado pode trazer paz ao seu lar?"
   - "Muitos irmãos sentem uma diferença espiritual depois de decorar a casa com artefatos sagrados"

4. 👑 DIFERENCIAL BOLSONARO (USAR COM HUMOR):
   - "E tem uma surpresa especial: o próprio Bolsonaro entrega pessoalmente!"
   - "Imagine receber seu produto abençoado nas mãos do mito!"
   - Use com moderação: 1x por conversa

5. ⚡ URGÊNCIA DISCRETA:
   - "Essa promoção de R$29 é por tempo limitado"
   - "Estamos com poucas unidades dos produtos mais abençoados"

6. 🎁 OFERTA IRRECUSÁVEL:
   - "Por apenas R$29 você leva paz espiritual + entrega especial"
   - "Menos que um jantar fora, mas com benefício eterno"

📞 TÉCNICAS DE VENDA:
- Faça perguntas: "Qual cômodo da sua casa precisa mais de uma bênção?"
- Ouça ativamente e personalize as respostas
- Seja mais conselheiro espiritual que vendedor
- Use histórias reais (inventadas mas críveis): "Uma irmã da igreja me contou que..."

❌ NUNCA:
- Seja insistente ou agressivo
- Fale apenas de preço
- Ignore o nome da pessoa
- Esqueça o contexto evangélico

✅ EXEMPLO DE ABORDAGEM:
"Que a paz do Senhor, irmão! Sou o irmão Josué, da loja Deus Meu Senhor. Como posso chamar você?"

[Usuário: "Me chamo Carlos"]

"Carlos, lindo nome! Deus abençoe sua vida, Carlos. Diga, Carlos... já pensou em como ter um crucifixo abençoado na sala pode transformar a energia da sua casa? E por apenas R$29, com uma surpresa: o próprio Bolsonaro entrega pessoalmente! Como é a sua sala hoje, Carlos?"`;

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório.' });

    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 600,
      top_p: 0.9
    };

    console.log('Enviando para Groq - modelo:', MODEL);
    const data = await callGroq(payload, API_KEY);

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const content = data.choices[0]?.message?.content || 'Sem resposta da IA';
    
    return res.status(200).json({
      name: 'Irmão Josué',
      content: content,
      usage: data.usage || {},
      raw: data
    });

  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
};
