/**
 * Serviço para gerenciar as interações do chatbot da AInovar
 */

const { SYSTEM_PROMPT } = require('../config/chatbotPrompt');
const { Readable } = require('stream');

/**
 * Prepara as mensagens para envio ao modelo de IA, incluindo o prompt do sistema
 * @param {Array} messages - Mensagens do usuário e do assistente
 * @returns {Array} - Mensagens formatadas incluindo o prompt do sistema
 */
function prepareMessages(messages) {
  // Adiciona o prompt do sistema como primeira mensagem
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];
}

/**
 * Processa uma mensagem do usuário e gera uma resposta
 * @param {Array} messages - Histórico de mensagens da conversa
 * @param {Object} options - Opções adicionais como ID da conversa
 * @returns {Promise<ReadableStream>} - Stream com a resposta do assistente
 */
async function processMessage(messages, options = {}) {
  try {
    const formattedMessages = prepareMessages(messages);
    
    // Implementação temporária para testes
    // Simula uma resposta em stream
    return simulateStreamResponse(formattedMessages);
  } catch (error) {
    console.error('Erro ao processar mensagem do chatbot:', error);
    throw error;
  }
}

/**
 * Função temporária para simular respostas em streaming
 * Será substituída pela integração real com o modelo de IA
 */
function simulateStreamResponse(messages) {
  try {
    // Encontra a última mensagem do usuário
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    console.log('Mensagem do usuário:', userMessage);
    
    // Respostas pré-definidas baseadas em palavras-chave
    let response = '';
    
    if (userMessage.toLowerCase().includes('consultoria')) {
      response = 'Nossa consultoria em IA oferece análise de viabilidade, mapeamento de processos e identificação de oportunidades para implementação de Inteligência Artificial na sua empresa. Podemos ajudar a identificar os melhores casos de uso e calcular o ROI potencial. Gostaria de mais informações sobre algum aspecto específico da nossa consultoria?';
    } else if (userMessage.toLowerCase().includes('desenvolvimento')) {
      response = 'A AInovar oferece desenvolvimento personalizado de soluções de IA, incluindo chatbots, sistemas de análise preditiva, automação de processos, visão computacional e processamento de linguagem natural. Nosso time de especialistas trabalha para criar soluções sob medida para os desafios específicos do seu negócio. Em que tipo de solução você está interessado?';
    } else if (userMessage.toLowerCase().includes('preço') || userMessage.toLowerCase().includes('custo') || userMessage.toLowerCase().includes('valor')) {
      response = 'Os preços das nossas soluções variam de acordo com a complexidade, escopo e necessidades específicas de cada projeto. Para fornecer um orçamento preciso, precisamos entender melhor seus requisitos. Recomendo entrar em contato pelo e-mail luizvalois@ainovar.tech ou preencher o formulário em nosso site para agendar uma consulta inicial gratuita onde podemos discutir seu projeto em detalhes.';
    } else if (userMessage.toLowerCase().includes('contato') || userMessage.toLowerCase().includes('falar')) {
      response = 'Você pode entrar em contato com a AInovar através do e-mail luizvalois@ainovar.tech ou preenchendo o formulário de contato em nosso site. Nossa equipe responderá o mais breve possível, geralmente dentro de 24 horas úteis. Gostaria que eu fornecesse mais alguma informação?';
    } else if (userMessage.toLowerCase().includes('projeto') || userMessage.toLowerCase().includes('case')) {
      response = 'A AInovar tem diversos projetos de sucesso, como a AInovar Platform (uma plataforma completa de IA para empresas), chatbots inteligentes com NLP para atendimento 24/7, e sistemas de análise de dados para previsão de demanda e segmentação de clientes. Cada projeto é personalizado para atender às necessidades específicas de cada cliente. Gostaria de saber mais sobre algum desses projetos ou tem algum desafio específico que gostaria de discutir?';
    } else if (userMessage.toLowerCase().includes('chatbot') || userMessage.toLowerCase().includes('chat bot') || userMessage.toLowerCase().includes('assistente virtual')) {
      response = 'A AInovar desenvolve chatbots inteligentes e assistentes virtuais personalizados que utilizam processamento de linguagem natural (NLP) e aprendizado de máquina para oferecer interações naturais e eficientes. Nossos chatbots podem ser integrados a sites, aplicativos, WhatsApp, Telegram e outras plataformas. Eles são capazes de automatizar atendimento ao cliente, responder perguntas frequentes, qualificar leads, agendar compromissos e muito mais. Cada solução é personalizada para atender às necessidades específicas do seu negócio, com treinamento baseado no seu conteúdo e integração com seus sistemas existentes. Gostaria de saber mais sobre como um chatbot poderia beneficiar sua empresa?';
    } else {
      response = 'Obrigado pelo seu contato! Sou Gemma, a assistente virtual da AInovar. Estamos especializados em soluções de Inteligência Artificial, incluindo consultoria, desenvolvimento personalizado, integração de sistemas e treinamento. Como posso ajudar você hoje? Se tiver alguma dúvida sobre nossos serviços ou como a IA pode beneficiar sua empresa, estou à disposição.';
    }
    
    console.log('Resposta gerada:', response);
    
    // Cria um stream simulado com a resposta
    const stream = new Readable();
    stream._read = () => {}; // Implementação necessária do método _read
    
    // Simula o envio da resposta em partes para imitar streaming
    const chunks = response.split(' ');
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < chunks.length) {
        const chunk = chunks[i] + ' ';
        stream.push(`data: ${JSON.stringify({ role: 'assistant', content: chunk })}\n\n`);
        i++;
      } else {
        stream.push(`data: [DONE]\n\n`);
        stream.push(null);
        clearInterval(interval);
      }
    }, 50);
    
    return stream;
  } catch (error) {
    console.error('Erro ao simular resposta:', error);
    // Cria um stream de erro
    const errorStream = new Readable();
    errorStream._read = () => {};
    errorStream.push(`data: ${JSON.stringify({ role: 'system', content: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.' })}\n\n`);
    errorStream.push(`data: [DONE]\n\n`);
    errorStream.push(null);
    return errorStream;
  }
}

module.exports = {
  processMessage,
  prepareMessages
};
