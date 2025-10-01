// api/gorq.js - VERSÃO SUPER ROBUSTA
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 🔥 VERIFICAÇÃO EXTRA ROBUSTA
    console.log('🚀 Iniciando API...');
    
    const API_KEY = process.env.GROQ_API_KEY;
    
    // Debug detalhado
    console.log('🔍 DEBUG Ambiente:');
    console.log('- GROQ_API_KEY:', API_KEY ? 'EXISTE' : 'NÃO EXISTE');
    console.log('- Tipo:', typeof API_KEY);
    console.log('- Valor:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'undefined');
    
    // 🔥 VERIFICAÇÃO EM MÚLTIPLOS NÍVEIS
    if (!API_KEY) {
      throw new Error('GROQ_API_KEY não encontrada. Configure em: Vercel → Settings → Environment Variables');
    }
    
    if (typeof API_KEY !== 'string') {
      throw new Error('GROQ_API_KEY não é uma string. Valor: ' + typeof API_KEY);
    }
    
    if (API_KEY.trim() === '') {
      throw new Error('GROQ_API_KEY está vazia. Adicione uma chave válida.');
    }

    const cleanedKey = API_KEY.trim().replace(/\s+/g, '').replace(/\n/g, '');
    console.log('✅ Chave limpa:', cleanedKey.substring(0, 10) + '...');
    
    if (!cleanedKey.startsWith('gsk_')) {
      throw new Error('Chave não começa com gsk_. Formato inválido.');
    }

    console.log('🎯 Todas as verificações passaram!');

    // CONFIGURAÇÕES FIXAS (não dependem de variáveis de ambiente)
    const MODEL = 'gemma2-9b-it';
    const AI_NAME = 'Irmão Josué';
    
    // PERSONA FIXA - VENDEDOR EVANGÉLICO
    const AI_PERSONA = `VOCÊ É O IRMÃO JOSUÉ - vendedor da loja "Deus Meu Senhor". 
    
PRODUTOS: Crucifixos abençoados, anjos da guarda, quadros bíblicos.
PREÇO: R$29 todos os produtos.
DIFERENCIAL: Bolsonaro entrega pessoalmente.

BOTÕES PARA MENCIONAR:
[VER PRODUTOS] - Ver catálogo
[CRUCIFIXOS] - Ver crucifixos  
[ANJOS] - Ver anjos
[COMPRAR] - Comprar agora
[ENTREGA] - Sobre entrega
[FALE COMIGO] - Continuar conversa

REGRA: Sempre mencione 1-2 botões por resposta.

EXEMPLOS:
"Que a paz do Senhor! Temos crucifixos por R$29! [VER PRODUTOS] [COMPRAR]"
"Anjos da guarda abençoam seu lar! [ANJOS] para ver. [FALE COMIGO]"

INÍCIO: "Que a paz do Senhor! Sou o Irmão Josué. Como posso chamar você? [FALE COMIGO]"`;

    // 🔥 TRATAMENTO ROBUSTO DO BODY
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (e) {
      body = {};
    }

    const prompt = body.prompt || '';
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt é obrigatório',
        example: { prompt: "Oi" }
      });
    }

    const messageHistory = body.messageHistory || [];

    // CONSTRUIR MENSAGENS
    const messages = [
      { role: 'system', content: AI_PERSONA },
      ...messageHistory,
      { role: 'user', content: prompt }
    ];

    const payload = {
      model: MODEL,
      messages: messages,
      temperature: 0.3,
      max_tokens: 500,
      top_p: 0.9
    };

    console.log('📤 Enviando para Groq...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanedKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP:', response.status, errorText);
      throw new Error(`API Groq retornou erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Groq API: ${data.error.message}`);
    }

    const content = data.choices[0]?.message?.content || 'Sem resposta';
    
    console.log('✅ Sucesso! Resposta:', content.substring(0, 100) + '...');
    
    return res.status(200).json({
      name: AI_NAME,
      content: content,
      usage: data.usage || {},
      raw: data
    });

  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error.message);
    
    // 🔥 RESPOSTA DE ERRO DETALHADA
    return res.status(500).json({
      error: 'Erro no servidor',
      details: error.message,
      solution: 'Verifique se a variável GROQ_API_KEY está configurada no Vercel',
      steps: [
        '1. Acesse Vercel Dashboard',
        '2. Clique no seu projeto', 
        '3. Vá em Settings → Environment Variables',
        '4. Adicione: GROQ_API_KEY=sua_chave_groq_aqui',
        '5. Faça novo deploy'
      ],
      help: 'Gere uma chave em: https://console.groq.com/keys'
    });
  }
};
