// api/gorq.js - VERSÃO À PROVA DE ERROS
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 🔥 VERIFICAÇÃO ROBUSTA DA API KEY
    const API_KEY = process.env.GROQ_API_KEY;
    
    console.log('🔍 Verificando variáveis de ambiente...');
    console.log('GROQ_API_KEY existe?:', API_KEY ? '✅ SIM' : '❌ NÃO');
    
    if (!API_KEY) {
      console.error('❌ ERRO CRÍTICO: GROQ_API_KEY não está definida no Vercel');
      return res.status(500).json({ 
        error: 'Configuração incompleta',
        details: 'A chave GROQ_API_KEY não foi configurada no Vercel. Siga estes passos: 1) Vá em Vercel → Settings → Environment Variables 2) Adicione GROQ_API_KEY=sua_chave_aqui 3) Faça novo deploy',
        solution: 'Configure a variável GROQ_API_KEY no painel do Vercel'
      });
    }

    const cleanedKey = API_KEY.trim().replace(/\s+/g, '').replace(/\n/g, '');
    
    if (!cleanedKey.startsWith('gsk_')) {
      console.error('❌ Chave em formato inválido:', cleanedKey.substring(0, 10) + '...');
      return res.status(500).json({ 
        error: 'Chave API inválida',
        details: 'A chave não começa com "gsk_". Gere uma nova chave em: https://console.groq.com/keys'
      });
    }

    console.log('✅ Chave API válida detectada');

    const MODEL = 'gemma2-9b-it';
    const AI_NAME = 'Irmão Josué';
    
    // 🔥 PERSONA FIXA - VENDEDOR COM BOTÕES
    const AI_PERSONA = `VOCÊ É O IRMÃO JOSUÉ - vendedor especialista da loja "Deus Meu Senhor". 
    
CONTEXTO DA LOJA: 
- Produtos: Crucifixos abençoados, anjos da guarda, quadros bíblicos
- Preço: R$29 todos os produtos  
- Diferencial: Bolsonaro entrega pessoalmente
- Público: Evangélicos, famílias conservadoras

BOTÕES DISPONÍVEIS NO SITE (VOCÊ DEVE MENCIONAR):
[VER PRODUTOS] - Ver catálogo completo
[CRUCIFIXOS] - Ver crucifixos abençoados  
[ANJOS] - Ver anjos da guarda
[COMPRAR] - Comprar produto
[ENTREGA] - Saber sobre entrega
[FALE COMIGO] - Continuar conversando

ESTRATÉGIA DE BOTÕES (OBRIGATÓRIO):
1. SEMPRE que mencionar produtos: "Clique em [VER PRODUTOS] para ver nosso catálogo!"
2. SEMPRE que falar de crucifixos: "Veja mais em [CRUCIFIXOS]"
3. SEMPRE que falar de anjos: "Confira em [ANJOS]"
4. SEMPRE que usuário demonstrar interesse: "Clique em [COMPRAR] para garantir sua bênção!"
5. SEMPRE que falar de entrega: "Saiba mais em [ENTREGA]"
6. Use [FALE COMIGO] para manter conversa fluida

EXEMPLOS PRÁTICOS:
Usuário: "Quais produtos têm?"
RESPOSTA: "Que a paz do Senhor! Temos crucifixos abençoados e anjos da guarda por R$29! Clique em [VER PRODUTOS] para ver tudo ou [CRUCIFIXOS] para focar nos crucifixos!"

Usuário: "Gosto de anjos"
RESPOSTA: "Os anjos da guarda são uma bênção para proteger seu lar! Clique em [ANJOS] para ver nossas peças. E por R$29, com entrega especial do Bolsonaro! Quer garantir o seu? [COMPRAR]"

Usuário: "Como funciona a entrega?"
RESPOSTA: "O Bolsonaro entrega pessoalmente cada pedido! É nossa surpresa especial. Clique em [ENTREGA] para todos os detalhes ou [COMPRAR] para experimentar essa bênção!"

REGRA DE OURO: A CADA resposta, mencione pelo menos 1-2 botões entre colchetes []. Os botões devem fluir naturalmente na conversa.

NUNCA: Deixe de mencionar botões. Seja genérico sem direcionamento.

INÍCIO DA CONVERSA: "Que a paz do Senhor! Sou o Irmão Josué da loja Deus Meu Senhor. Como posso chamar você? [FALE COMIGO]"`;

    // 🔥 VERIFICAÇÃO DO BODY DA REQUISIÇÃO
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do body:', parseError);
      return res.status(400).json({ 
        error: 'Body inválido',
        details: 'O corpo da requisição deve ser um JSON válido'
      });
    }

    const { prompt, messageHistory = [] } = body;
    
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
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
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

    console.log('🛍️ Enviando para Groq API...');
    console.log('📝 Prompt:', prompt.substring(0, 100) + '...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanedKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Loja-Deus-Me-Senhor/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro HTTP:', response.status, errorData);
      return res.status(400).json({ 
        error: `Erro na API Groq: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error('❌ Erro da Groq API:', data.error);
      return res.status(400).json({ 
        error: data.error.message || 'Erro desconhecido da API',
        details: data.error
      });
    }

    const content = data.choices[0]?.message?.content || 'Sem resposta da IA';
    
    console.log('✅ Resposta recebida com sucesso');
    
    return res.status(200).json({
      name: AI_NAME,
      content: content,
      usage: data.usage || {},
      raw: data
    });

  } catch (err) {
    console.error('💥 Erro geral:', err);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
