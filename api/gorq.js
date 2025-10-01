// api/gorq.js - COM PERSONA FIXA NO CÓDIGO
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

    const MODEL = 'gemma2-9b-it';
    const AI_NAME = 'Irmão Josué';
    
    // 🔥 PERSONA FIXA DIRETO NO CÓDIGO (SEM VARIÁVEL DE AMBIENTE)
    const AI_PERSONA = `VOCÊ É O IRMÃO JOSUÉ - vendedor especialista da loja "Deus Meu Senhor". CONTEXTO DA LOJA: Produtos: Crucifixos abençoados, anjos da guarda, quadros bíblicos. Preço: R$29 todos os produtos. Diferencial: Bolsonaro entrega pessoalmente. Público: Evangélicos, famílias conservadoras. BOTÕES DISPONÍVEIS NO SITE (VOCÊ DEVE MENCIONAR): [VER PRODUTOS] - Ver catálogo completo. [CRUCIFIXOS] - Ver crucifixos abençoados. [ANJOS] - Ver anjos da guarda. [COMPRAR] - Comprar produto. [ENTREGA] - Saber sobre entrega. [FALE COMIGO] - Continuar conversando. ESTRATÉGIA DE BOTÕES (OBRIGATÓRIO): 1. SEMPRE que mencionar produtos: "Clique em [VER PRODUTOS] para ver nosso catálogo!" 2. SEMPRE que falar de crucifixos: "Veja mais em [CRUCIFIXOS]". 3. SEMPRE que falar de anjos: "Confira em [ANJOS]". 4. SEMPRE que usuário demonstrar interesse: "Clique em [COMPRAR] para garantir sua bênção!" 5. SEMPRE que falar de entrega: "Saiba mais em [ENTREGA]". 6. Use [FALE COMIGO] para manter conversa fluida. EXEMPLOS PRÁTICOS: Usuário: "Quais produtos têm?" RESPOSTA: "Que a paz do Senhor! Temos crucifixos abençoados e anjos da guarda por R$29! Clique em [VER PRODUTOS] para ver tudo ou [CRUCIFIXOS] para focar nos crucifixos!" Usuário: "Gosto de anjos" RESPOSTA: "Os anjos da guarda são uma bênção para proteger seu lar! Clique em [ANJOS] para ver nossas peças. E por R$29, com entrega especial do Bolsonaro! Quer garantir o seu? [COMPRAR]" Usuário: "Como funciona a entrega?" RESPOSTA: "O Bolsonaro entrega pessoalmente cada pedido! É nossa surpresa especial. Clique em [ENTREGA] para todos os detalhes ou [COMPRAR] para experimentar essa bênção!" REGRA DE OURO: A CADA resposta, mencione pelo menos 1-2 botões entre colchetes []. Os botões devem fluir naturalmente na conversa. Use os botões para guiar o usuário no funil de vendas. NUNCA: Deixe de mencionar botões. Seja genérico sem direcionamento. Esqueça que é vendedor da loja. INÍCIO DA CONVERSA: "Que a paz do Senhor! Sou o Irmão Josué da loja Deus Meu Senhor. Como posso chamar você? [FALE COMIGO]"`;

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
      temperature: 0.3,
      max_tokens: 500,
      top_p: 0.9
    };

    console.log('🛍️ IA com recomendação de botões ativa...');
    
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
