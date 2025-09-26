// api/gorq.js (CommonJS) - retorna { content: "..." }
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  // CORS simples (apenas para testes; restrinja em produção)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const API_KEY = process.env.GROQ_API_KEY;
    const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

    if (!API_KEY) {
      console.error("GROQ_API_KEY ausente");
      return res.status(500).json({ error: "GROQ_API_KEY não configurada." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : (req.body ? JSON.parse(req.body) : {});
    const prompt = body.prompt || body.promptText || "Escreva uma frase motivacional curta.";

    console.log("Prompt recebido:", prompt);
    console.log("Usando model:", MODEL);

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();
    console.log("Resposta do Groq (parcial):", (data && data.choices) ? data.choices[0] : data);

    // tenta extrair o texto de várias formas possíveis
    let content = null;
    if (Array.isArray(data?.choices) && data.choices[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else if (Array.isArray(data?.choices) && data.choices[0]?.text) {
      content = data.choices[0].text;
    } else if (data?.message?.content) {
      content = data.message.content;
    }

    // fallback: stringify entire data se não tiver campo de texto
    if (!content) {
      content = null;
    }

    return res.status(200).json({ content, raw: data });
  } catch (err) {
    console.error("Erro interno na API Gorq:", err);
    return res.status(500).json({ error: "Erro interno na API Gorq", details: err.message || err });
  }
};
