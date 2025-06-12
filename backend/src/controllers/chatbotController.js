/**
 * Controlador para gerenciar as requisições do chatbot
 */

const { processMessage } = require('../services/chatbotService');
const { Readable } = require('stream');

/**
 * Processa uma mensagem do chat e retorna a resposta em streaming
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
async function handleChatMessage(req, res) {
  try {
    const { messages, conversationId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de mensagem inválido. É necessário fornecer um array de mensagens.' 
      });
    }
    
    // Configura headers para streaming de eventos (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Processa a mensagem e obtém o stream de resposta
    const stream = await processMessage(messages, { conversationId });
    
    // Pipe o stream diretamente para a resposta
    stream.on('data', (chunk) => {
      res.write(chunk);
    });
    
    stream.on('end', () => {
      res.end();
    });
    
    stream.on('error', (error) => {
      console.error('Erro no stream:', error);
      res.end();
    });
  } catch (error) {
    console.error('Erro no controlador do chatbot:', error);
    
    // Se a resposta ainda não foi enviada, envia erro como JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao processar mensagem do chatbot' 
      });
    }
    
    // Se headers já foram enviados (streaming iniciado), envia erro como evento
    res.write(`data: ${JSON.stringify({ 
      role: 'system', 
      content: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.' 
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

/**
 * Obtém informações sobre o modelo de IA utilizado
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
function getModelInfo(req, res) {
  try {
    // Informações sobre o modelo de IA utilizado
    const modelInfo = {
      name: 'AInovar Assistant',
      version: '1.0.0',
      baseModel: 'Gemma 7B Instruct',
      capabilities: [
        'Informações sobre serviços da AInovar',
        'Esclarecimento de dúvidas sobre IA',
        'Sugestões de soluções baseadas em casos de uso',
        'Atendimento inicial para potenciais clientes'
      ],
      lastUpdated: '2025-04-02'
    };
    
    return res.json({ success: true, data: modelInfo });
  } catch (error) {
    console.error('Erro ao obter informações do modelo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter informações do modelo' 
    });
  }
}

module.exports = {
  handleChatMessage,
  getModelInfo
};
