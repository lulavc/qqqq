console.log("API server script started...");

try {
  const express = require('express');
  const cors = require('cors');
  const { Ollama } = require('ollama');
  const rateLimit = require('express-rate-limit');

  // Inicialização do app Express
  const app = express();
  const port = process.env.PORT || 4000;

  // Configuração do Ollama
  const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
  });

  // Log de diagnóstico na inicialização
  console.log('Configuração do servidor:');
  console.log(`- Porta: ${port}`);
  console.log(`- Host Ollama: ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
  console.log(`- Ambiente: ${process.env.NODE_ENV || 'development'}`);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    message: {
      error: 'Muitas requisições deste IP, por favor tente novamente em 15 minutos'
    }
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(limiter);

  // Middleware de logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });

  // Middleware de erro
  app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Sistema de prompt para melhor contextualização
  const getSystemPrompt = () => `Você é um assistente virtual da AInovar, uma empresa especializada em soluções de IA.
Você deve:
- Ser sempre cordial e profissional
- Comunicar-se em português do Brasil
- Fornecer respostas precisas sobre os serviços da AInovar
- Ajudar com suporte técnico quando necessário
- Evitar informações que não tem certeza
- Manter um tom amigável mas profissional

Serviços da AInovar incluem:
- Consultoria em IA
- Desenvolvimento Personalizado
- Chatbots Inteligentes
- Análise de Dados
- Treinamento e Capacitação
- IA na Nuvem

Para suporte: suporte@ainovar.tech
Para contato comercial: comercial@ainovar.tech
Website: ainovar.tech`;

  // Rota de status para health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Rota para listar modelos disponíveis
  app.get('/models', async (req, res) => {
    try {
      const models = await ollama.list();
      res.json(models);
    } catch (error) {
      console.error('Erro ao listar modelos:', error);
      res.status(500).json({ error: 'Falha ao listar modelos disponíveis' });
    }
  });

  // Rota para chat com o modelo
  app.post('/chat', async (req, res) => {
    try {
      const { messages, model = 'gemma3:4b' } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: 'Formato inválido',
          message: '"messages" deve ser um array'
        });
      }

      // Configurar streaming de resposta
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Adicionar prompt do sistema
      const systemMessage = {
        role: 'system',
        content: getSystemPrompt()
      };

      // Converter mensagens para o formato do Ollama
      const ollamaMessages = [systemMessage, ...messages].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Usar o streaming da API do Ollama
      const stream = await ollama.chat({
        model: 'gemma3:4b',
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature: 0.7,
          top_k: 40,
          top_p: 0.9,
          num_ctx: 4096,
          repeat_penalty: 1.1
        }
      });

      // Enviar chunks da resposta para o cliente
      for await (const chunk of stream) {
        if (chunk.message?.content) {
          res.write(`data: ${JSON.stringify({
            role: 'assistant',
            content: chunk.message.content
          })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Erro ao processar chat:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Falha ao processar chat',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      } else {
        res.write(`data: ${JSON.stringify({
          role: 'system',
          content: 'Desculpe, ocorreu um erro durante o processamento da mensagem.'
        })}\n\n`);
        res.end();
      }
    }
  });

  // Iniciar servidor
  try {
    const server = app.listen(port, '0.0.0.0', (err) => {
      if (err) {
        console.error('Erro ao iniciar o servidor:', err);
        process.exit(1);
      }
      console.log(`Servidor rodando na porta ${port}`);
      console.log(`Acesse: http://localhost:${port}/health para verificar o status`);
    });

    server.on('error', (error) => {
      console.error('Erro no servidor:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Porta ${port} já está em uso`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Erro crítico ao iniciar o servidor:', error);
    process.exit(1);
  }
} catch (error) {
  console.error("--- UNHANDLED TOP-LEVEL EXCEPTION IN api/server.js ---");
  console.error(error);
  console.error("--- END OF UNHANDLED TOP-LEVEL EXCEPTION ---");
  process.exit(1); // Exit with an error code
}
