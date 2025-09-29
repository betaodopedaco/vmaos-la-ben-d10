// api/gorq.js
// Backend para Vercel (CommonJS) que aplica persona permanente
// Suporta continuação automática se a resposta for truncada e retorna usage

const fetch = require('node-fetch');

function parseFloatEnv(name, fallback) {
  const v = process.env[name];
  return v !== undefined ? parseFloat(v) : fallback;
}
function parseIntEnv(name, fallback) {
  const v = process.env[name];
  return v !== undefined ? parseInt(v, 10) : fallback;
}
function parseBoolEnv(name, fallback) {
  const v = process.env[name];
  return v !== undefined ? (v === 'true' || v === '1') : fallback;
}

async function callGroq(payload, apiKey) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  return { status: r.status, data };
}

module.exports = async (req, res) => {
  // CORS simples para testes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY não configurada.' });

    // Configs do ambiente (defaults ajustados)
    const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    const AI_NAME = process.env.AI_NAME || 'MAGNATUNS';
    const AI_PERSONA = process.env.AI_PERSONA || `Você é ${AI_NAME}, uma IA que responde de forma clara e útil.`;
    const TEMPERATURE = parseFloatEnv('AI_TEMPERATURE', 0.7);
    const MAX_TOKENS = parseIntEnv('AI_MAX_TOKENS', 800); // default aumentado
    const TOP_P = parseFloatEnv('AI_TOP_P', 1);
    const PRESENCE_PENALTY = parseFloatEnv('AI_PRESENCE_PEN', 0);
    const FREQUENCY_PENALTY = parseFloatEnv('AI_FREQUENCY_PEN', 0);
    const SAFE_MODE = parseBoolEnv('AI_SAFE_MODE', true);
    const MAX_CONTINUATIONS = parseIntEnv('AI_MAX_CONTINUATIONS', 3);

    // parse do body
    const body = (req.body && typeof req.body === 'object') ? req.body : (req.body ? JSON.parse(req.body) : {});
    const prompt = (body && body.prompt) ? String(body.prompt) : null;
    if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório.' });

    // monta system message permanente
    const systemMsg = `${AI_PERSONA}

Regras:
- Fale em pt-BR por padrão, a menos que instruído de outra forma no prompt.
- Mantenha o tom solicitado pela persona enquanto for relevante.
- Se o usuário pedir instruções ilegais ou perigosas, recuse educadamente.
`;

    const messages = [
      { role: 'system', content: systemMsg },
      { role: 'user', content: prompt }
    ];

    const payload = {
      model: MODEL,
      messages,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      top_p: TOP_P,
      presence_penalty: PRESENCE_PENALTY,
      frequency_penalty: FREQUENCY_PENALTY
    };

    console.log('Chamando Groq — model:', MODEL, 'max_tokens:', payload.max_tokens);

    // 1) Chamada inicial
    const first = await callGroq(payload, API_KEY);
    let dataResp = first.data;
    console.log('Status:', first.status);

    // extrai conteúdo inicial
    let content = '';
    if (Array.isArray(dataResp?.choices) && dataResp.choices[0]?.message?.content) {
      content = dataResp.choices[0].message.content;
    } else if (Array.isArray(dataResp?.choices) && dataResp.choices[0]?.text) {
      content = dataResp.choices[0].text;
    } else if (dataResp?.message?.content) {
      content = dataResp.message.content;
    }

    // acumula usage (se disponível)
    let totalUsage = (dataResp?.usage && dataResp.usage.total_tokens) ? dataResp.usage.total_tokens : 0;

    // detecta finish_reason
    let finishReason = dataResp?.choices?.[0]?.finish_reason || null;
    console.log('finish_reason (primeira):', finishReason);

    // tenta continuar se truncado
    const continuations = [];
    let attempts = 0;
    while (finishReason === 'length' && attempts < (isNaN(MAX_CONTINUATIONS) ? 3 : MAX_CONTINUATIONS)) {
      attempts++;
      const contMessages = [
        { role: 'system', content: systemMsg },
        { role: 'user', content: prompt },
        { role: 'assistant', content: content },
        { role: 'user', content: 'Continue a resposta anterior, finalizando o texto onde parou. Mantenha o mesmo tom.' }
      ];

      const payloadCont = {
        model: MODEL,
        messages: contMessages,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        top_p: TOP_P,
        presence_penalty: PRESENCE_PENALTY,
        frequency_penalty: FREQUENCY_PENALTY
      };

      console.log('Chamando continuação #' + attempts + ' — max_tokens:', MAX_TOKENS);
      const contResp = await callGroq(payloadCont, API_KEY);
      const d2 = contResp.data;
      continuations.push(d2);

      const extra = (Array.isArray(d2?.choices) && d2.choices[0]?.message?.content) ? d2.choices[0].message.content
                  : (Array.isArray(d2?.choices) && d2.choices[0]?.text) ? d2.choices[0].text
                  : (d2?.message?.content) ? d2.message.content : '';

      // concatena com separador (uma nova linha)
      content = (content || '') + '\n' + extra;

      if (d2?.usage?.total_tokens) totalUsage += d2.usage.total_tokens;

      finishReason = d2?.choices?.[0]?.finish_reason || null;
      console.log('finish_reason (continuação #' + attempts + '):', finishReason);

      // se continuar vindo 'length', o loop ocorrerá até MAX_CONTINUATIONS
    }

    // safe-mode simples: remove palavras proibidas (exemplo)
    if (SAFE_MODE && typeof content === 'string') {
      const banned = ['instruções ilegais', 'bomba', 'como fabricar'];
      banned.forEach(w => {
        const re = new RegExp(w, 'gi');
        content = content.replace(re, '[conteúdo removido]');
      });
    }

    // Resposta final
    return res.status(200).json({
      name: AI_NAME,
      content,
      usage: { total_tokens: totalUsage },
      finish_reason: finishReason,
      continued: continuations.length > 0,
      raw: dataResp,
      continuations
    });

  } catch (err) {
    console.error('Erro /api/gorq:', err);
    return res.status(500).json({ error: 'Erro interno', details: (err && err.message) || err });
  }
};
