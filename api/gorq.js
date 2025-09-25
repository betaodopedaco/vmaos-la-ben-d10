// api/gorq.js (CommonJS) — usa GROQ_MODEL configurável
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  // CORS simples para testes
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const API_KEY = process.env.GROQ_API_KEY;
    const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b"; // fallback

    console.log("GROQ_API_KEY presente:", !!API_KEY);
    console.log("Usando MODEL:", MODEL);

    if (!API_KEY) {
      res.status(500).json({ error: "GROQ_API_KEY não configurada." });
      return;
    }

    // pega prompt (suporta quando Vercel já parseou JSON)
    let prompt = "Olá, Gorq!";
    if (req.body && typeof req.body === "object") prompt = req.body.prompt || prompt;
    else if (req.body && typeof req.body === "string") {
      try { const jb = JSON.parse(req.body); prompt = jb.prompt || prompt; } catch(e){}
    }

    console.log("Prompt:", prompt);

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
    console.log("Resposta do Gorq (preview):", Array.isArray(data?.choices) ? data.choices[0] : data);

    // repassa a resposta inteira para o cliente
    res.status(200).json(data);
  } catch (err) {
    console.error("Erro interno na API Gorq:", err);
    res.status(500).json({ error: "Erro interno na API Gorq", details: err.message || err });
  }
};
