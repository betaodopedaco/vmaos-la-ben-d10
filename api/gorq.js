// api/gorq.js
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    console.log("GROQ_API_KEY:", GROQ_API_KEY ? "OK" : "NÃO DEFINIDA");

    if (!GROQ_API_KEY) {
      res.status(500).json({ error: "GROQ_API_KEY não configurada." });
      return;
    }

    const prompt = (req.body && req.body.prompt) || "Olá, Gorq!";
    console.log("Prompt recebido:", prompt);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    console.log("Resposta da API Gorq:", data);

    res.status(200).json(data);
  } catch (err) {
    console.error("Erro interno na API Gorq:", err);
    res.status(500).json({ error: "Erro interno na API Gorq", details: err.message });
  }
};
