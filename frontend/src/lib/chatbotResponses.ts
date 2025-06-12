/**
 * Respostas especializadas para perguntas comuns sobre a AInovar
 * Este arquivo contém respostas pré-definidas para perguntas frequentes
 */

// Resposta detalhada sobre os chatbots da AInovar
export const CHATBOT_INFO_RESPONSE = `
# Chatbots da AInovar

A AInovar cria assistentes virtuais que ajudam a melhorar a comunicação entre sua empresa e seus clientes, usando tecnologias de Processamento de Linguagem Natural (NLP) e Inteligência Artificial.

## O que nossos chatbots oferecem:

- **Entendimento natural da linguagem**: Compreendem perguntas cotidianas e respondem de forma clara.
- **Adaptados à sua identidade**: Seguem o estilo de comunicação da sua empresa.
- **Suporte em vários idiomas**: Funcionam em português, inglês e espanhol.
- **Trabalham com seus sistemas**: Conectam-se a CRMs e outras ferramentas que você já usa.
- **Compreensão de contexto**: Conseguem entender o tom da conversa para responder adequadamente.
- **Evolução contínua**: Melhoram com o tempo, aprendendo com as interações.

## Onde podem ser usados:

- Sites e aplicações web
- WhatsApp
- Telegram
- Facebook Messenger
- Microsoft Teams
- Slack
- Aplicativos móveis (iOS e Android)

## Como podem ajudar sua empresa:

- Atendimento disponível a qualquer hora
- Respostas mais rápidas para seus clientes
- Capacidade de lidar com muitas conversas ao mesmo tempo
- Informações sempre consistentes
- Insights sobre as dúvidas mais comuns dos seus clientes
- Sua equipe fica livre para trabalhar em tarefas mais estratégicas

Podemos conversar mais sobre como um chatbot pode funcionar especificamente para o seu negócio. Entre em contato pelo e-mail contato@ainovar.tech
`;

/**
 * Identifica se a mensagem do usuário está perguntando sobre chatbots
 * @param message Mensagem do usuário
 * @returns true se a mensagem estiver relacionada a chatbots
 */
export function isAskingAboutChatbots(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Palavras-chave relacionadas a chatbots
  const chatbotKeywords = [
    'chatbot', 'chat bot', 'assistente virtual', 'bot', 'assistente', 
    'ia', 'inteligência artificial', 'conversar', 'atendimento automatizado',
    'assistente digital', 'atendente virtual'
  ];
  
  // Palavras de pergunta
  const questionWords = [
    'como', 'o que', 'qual', 'quais', 'quando', 'onde', 'por que', 'para que',
    'me fale', 'explique', 'conte', 'descreva', 'detalhe', 'informação', 'sobre'
  ];
  
  // Verifica se a mensagem contém palavras-chave de chatbot
  const hasChatbotKeyword = chatbotKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Verifica se a mensagem parece ser uma pergunta sobre chatbots
  const seemsToBeQuestion = questionWords.some(word => 
    lowerMessage.includes(word)
  );
  
  // Determina se está perguntando especificamente sobre o chatbot da AInovar
  const isAboutAInovarChatbot = 
    lowerMessage.includes('ainovar') || 
    lowerMessage.includes('vocês') || 
    lowerMessage.includes('você') ||
    lowerMessage.includes('seu') || 
    lowerMessage.includes('seus');
  
  // Mensagem curta e direta sobre chatbots (por exemplo, "sobre chatbot", "chatbot?")
  const isShortChatbotQuery = lowerMessage.length < 30 && hasChatbotKeyword;
  
  // Considera uma pergunta sobre chatbots se:
  // 1. Mensagem curta diretamente sobre chatbots
  // 2. OU: Menciona palavras-chave de chatbot E (parece ser uma pergunta OU é sobre AInovar)
  return isShortChatbotQuery || (hasChatbotKeyword && (seemsToBeQuestion || isAboutAInovarChatbot));
}
