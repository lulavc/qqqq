/**
 * Teste de simulação para o chatbot com as melhorias implementadas
 * Este arquivo permite testar as funcionalidades do front-end sem depender do backend
 */

import { ChatMessage } from './api';
import { isAskingAboutChatbots } from './chatbotResponses';
import { prepareEnhancedMetadata, detectIntent, analyzeSentiment, extractKeywords } from './chatEnhancements';

/**
 * Simula uma resposta do chatbot para testes locais
 * @param messages Histórico de mensagens
 * @returns Objeto com análise e resposta simulada
 */
export async function simulateChatbotResponse(messages: ChatMessage[]): Promise<{
  analysis: any;
  response: string;
}> {
  // Pega a última mensagem do usuário
  const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
  
  if (!lastUserMessage) {
    return {
      analysis: { error: 'Nenhuma mensagem de usuário encontrada' },
      response: 'Desculpe, não consegui processar sua mensagem. Poderia tentar novamente?'
    };
  }
  
  // Prepara metadados enriquecidos
  const enhancedMetadata = prepareEnhancedMetadata(messages, {
    currentPage: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : ''
    }
  });
  
  // Analisa a intenção e sentimento da mensagem
  const intent = detectIntent(lastUserMessage.content);
  const sentiment = analyzeSentiment(lastUserMessage.content);
  const keywords = extractKeywords(lastUserMessage.content);
  
  // Resposta simulada baseada na intenção detectada
  let simulatedResponse = '';
  
  switch (intent) {
    case 'greeting':
      simulatedResponse = 'Olá! Como posso ajudar você hoje? Estou aqui para colaborar no que precisar.';
      break;
    case 'farewell':
      simulatedResponse = 'Foi um prazer conversar com você! Estou à disposição sempre que precisar de ajuda.';
      break;
    case 'help':
      simulatedResponse = 'Estou aqui para ajudar! Posso fornecer informações sobre os serviços da AInovar, tirar dúvidas técnicas ou ajudar a encontrar soluções para seu negócio. Em que posso colaborar hoje?';
      break;
    case 'feedback':
      simulatedResponse = 'Obrigado por compartilhar sua sugestão. Valorizamos muito seu feedback e vamos trabalhar para melhorar. Poderia nos contar mais sobre o que você gostaria de ver aprimorado? Isso vai nos ajudar a entender melhor como podemos atender suas expectativas.';
      break;
    case 'complaint':
      simulatedResponse = 'Peço desculpas pela experiência insatisfatória. Seu feedback é muito importante para nós e queremos resolver isso. Poderia compartilhar mais detalhes sobre o que não atendeu suas expectativas? Estamos comprometidos em melhorar nosso serviço com base na sua experiência.';
      break;
    case 'gratitude':
      simulatedResponse = 'Fico feliz em poder ajudar! Se precisar de qualquer outra coisa, é só me dizer. Estamos sempre trabalhando para melhorar nossos serviços com base no feedback dos nossos clientes.';
      break;
    case 'confirmation':
      simulatedResponse = 'Perfeito! Se tiver mais alguma dúvida ou precisar de outras informações, estou à disposição para ajudar.';
      break;
    case 'denial':
      simulatedResponse = 'Entendi. Posso tentar abordar de outra forma ou oferecer alternativas. Em que mais posso ajudar você hoje?';
      break;
    case 'product_info':
      simulatedResponse = `A AInovar oferece diversas soluções tecnológicas que podem ajudar seu negócio:

1. **Desenvolvimento de IA personalizada** - Soluções adaptadas às suas necessidades específicas
2. **Chatbots inteligentes** - Assistentes virtuais que ajudam no atendimento e suporte
3. **Automação de processos** - Facilitamos seus fluxos de trabalho com tecnologia
4. **Consultoria em tecnologia** - Trabalhamos juntos para implementar soluções que façam sentido para você

Podemos conversar mais sobre alguma dessas áreas?`;
      break;
    case 'pricing':
      simulatedResponse = 'Nossos preços são personalizados conforme as necessidades de cada parceiro. Trabalhamos com pacotes flexíveis para diferentes portes de empresa e objetivos. Para conversarmos sobre uma solução que se encaixe no seu orçamento, você pode entrar em contato pelo email contato@ainovar.tech.';
      break;
    case 'technical':
      simulatedResponse = `Sobre sua questão técnica, aqui vai uma explicação que pode ajudar:

\`\`\`
Nossas soluções de IA utilizam modelos modernos que são adaptados 
às necessidades específicas de cada cliente, priorizando um equilíbrio 
entre eficiência e facilidade de uso.
\`\`\`

Nossa equipe pode ajudar na integração com seus sistemas atuais. Gostaria de conversar sobre como isso funcionaria no seu caso específico?`;
      break;
    case 'comparison':
      simulatedResponse = 'As soluções da AInovar são desenvolvidas pensando na integração com seus sistemas existentes. Trabalhamos em parceria para entender suas necessidades específicas e oferecer tecnologias que se adaptam ao seu negócio, com suporte local em português e conhecimento do mercado brasileiro.';
      break;
    case 'contact':
      simulatedResponse = 'Ficaremos felizes em conversar com você! Aqui estão nossos canais de contato:\n\n- **Email**: contato@ainovar.tech\n- **Telefone**: (11) 3456-7890\n- **WhatsApp**: (11) 91234-5678\n- **LinkedIn**: linkedin.com/company/ainovar\n\nEstamos à disposição para ajudar no que precisar.';
      break;
    default:
      simulatedResponse = `Obrigado pela sua mensagem sobre "${keywords.join(', ')}". 

A AInovar desenvolve soluções em inteligência artificial e tecnologia que podem ajudar seu negócio a crescer. Nossa equipe trabalha em parceria com você para implementar tecnologias que otimizam processos, reduzem custos e melhoram a experiência dos seus clientes.

Como podemos colaborar com você hoje?`;
  }
  
  // Simulação da análise realizada pelo sistema
  const analysis = {
    intent,
    sentiment: sentiment.sentiment,
    confidenceScore: sentiment.confidence,
    keywords,
    enhancedMetadata: enhancedMetadata,
    processedWithAI: true
  };
  
  // Simula um pequeno delay para parecer um processamento real
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    analysis,
    response: simulatedResponse
  };
}
