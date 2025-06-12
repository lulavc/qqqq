/**
 * Melhorias avançadas para a qualidade de resposta do chatbot
 */

import { ChatMessage } from './api';

/**
 * Prepara dados de contexto adicional para enriquecer as respostas do chatbot
 */
export interface ChatContext {
  // Contexto da página atual
  currentPage?: {
    path: string;
    title?: string;
    section?: string;
  };
  
  // Informações do usuário (se disponíveis)
  userInfo?: {
    language: string;
    region?: string;
    preferredTechnologies?: string[];
    previousInteractions?: number;
  };
  
  // Dados da sessão atual
  sessionData?: {
    startTime: string;
    interactionCount: number;
    averageResponseTime?: number;
    previousTopics?: string[];
  };
}

/**
 * Extrai a intenção principal da mensagem do usuário
 * @param message Mensagem do usuário
 * @returns Intenção detectada
 */
export function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Análise de feedback negativo - frases curtas com críticas
  const negativeFeedbackPatterns = [
    'não gostei', 'nao gostei', 'ruim', 'péssimo', 'horrível', 'terrível',
    'poderia melhorar', 'não está bom', 'nao esta bom', 'precisa melhorar',
    'não funciona', 'nao funciona', 'não é bom', 'nao e bom'
  ];
  
  for (const pattern of negativeFeedbackPatterns) {
    if (lowerMessage.includes(pattern)) {
      return 'complaint';
    }
  }
  
  // Verifica mensagens curtas (menos de 5 palavras) para intenções específicas
  const wordCount = lowerMessage.split(/\s+/).length;
  if (wordCount < 5) {
    // Para mensagens curtas, usamos uma correspondência mais precisa
    
    // Verifica agradecimentos
    if (/obrigad[oa]|valeu|thanks/i.test(lowerMessage)) {
      return 'gratitude';
    }
    
    // Verificar pedidos de melhoria
    if (/melhor[ae]|aperfeiçoa|aprimo[ra]/i.test(lowerMessage)) {
      return 'feedback';
    }
    
    // Verificar confirmações simples
    if (/^sim$|^ok$|^claro$|^certo$|^concordo$|^beleza$/i.test(lowerMessage)) {
      return 'confirmation';
    }
    
    // Verificar negações simples
    if (/^não$|^nao$|^no$|^nunca$|^jamais$|^negativo$/i.test(lowerMessage)) {
      return 'denial';
    }
  }
  
  // Verificação padrão de intenções por palavras-chave
  const intents = [
    { type: 'greeting', patterns: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem'] },
    { type: 'farewell', patterns: ['tchau', 'até logo', 'até mais', 'adeus', 'finalizar'] },
    { type: 'help', patterns: ['ajuda', 'ajudar', 'socorro', 'suporte', 'auxílio', 'preciso de ajuda'] },
    { type: 'product_info', patterns: ['produto', 'serviço', 'oferecem', 'solução'] },
    { type: 'pricing', patterns: ['preço', 'valor', 'custo', 'plano', 'pagamento', 'assinatura'] },
    { type: 'technical', patterns: ['como fazer', 'implementar', 'código', 'programar', 'desenvolver', 'tecnologia'] },
    { type: 'complaint', patterns: ['problema', 'reclamação', 'não funciona', 'erro', 'insatisfeito', 'ruim'] },
    { type: 'comparison', patterns: ['comparar', 'diferença', 'versus', 'melhor que', 'pior que', 'comparação'] },
    { type: 'contact', patterns: ['contato', 'falar com', 'email', 'telefone', 'atendimento', 'suporte'] },
    { type: 'feedback', patterns: ['feedback', 'opinião', 'sugestão', 'melhorar', 'avaliação'] }
  ];
  
  // Verifica cada tipo de intenção
  for (const intent of intents) {
    if (intent.patterns.some(pattern => lowerMessage.includes(pattern))) {
      return intent.type;
    }
  }
  
  // Intenção padrão: consulta genérica
  return 'general_query';
}

/**
 * Realiza análise de sentimento básica na mensagem do usuário
 * @param message Mensagem do usuário
 * @returns Objeto com sentimento e confiança
 */
export function analyzeSentiment(message: string): { sentiment: 'positive' | 'neutral' | 'negative', confidence: number } {
  const lowerMessage = message.toLowerCase();
  
  // Verificar negações antes de qualquer outra análise
  const negationWords = ['não', 'nao', 'nunca', 'jamais', 'nem'];
  const hasNegation = negationWords.some(word => {
    // Verifica se a palavra de negação existe e se não está dentro de outra palavra
    // Ex: "não" deve ser detectado, mas "ração" não deve
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerMessage);
  });
  
  // Palavras positivas e negativas para análise simples
  const positiveWords = [
    'bom', 'excelente', 'ótimo', 'fantástico', 'maravilhoso', 'gosto', 'adoro',
    'feliz', 'satisfeito', 'útil', 'eficiente', 'rápido', 'ajudou', 'gostei'
  ];
  
  const negativeWords = [
    'ruim', 'péssimo', 'horrível', 'terrível', 'detesto', 'odeio', 'triste',
    'insatisfeito', 'inútil', 'ineficiente', 'lento', 'problema', 'erro'
  ];
  
  // Conta ocorrências de palavras positivas e negativas
  let positiveCount = positiveWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerMessage);
  }).length;
  
  let negativeCount = negativeWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerMessage);
  }).length;
  
  // Se há negação, inverte o sentimento de palavras positivas
  if (hasNegation) {
    // Verifica se há palavras positivas com negação (ex: "não gostei", "não é bom")
    const negatedPositive = positiveWords.some(word => {
      // Procura por padrões como "não gostei", "não é bom", etc.
      return negationWords.some(neg => 
        lowerMessage.includes(`${neg} ${word}`) || 
        lowerMessage.includes(`${neg} é ${word}`) ||
        lowerMessage.includes(`${neg} foi ${word}`) ||
        lowerMessage.includes(`${neg} está ${word}`) ||
        // Para lidar com contrações e variações como "n gostei"
        lowerMessage.match(new RegExp(`\\b${neg.charAt(0)}[\\s']?${word}\\b`, 'i'))
      );
    });
    
    if (negatedPositive) {
      // Se temos uma negação de positivo, aumentamos a contagem negativa
      negativeCount += 2;
      positiveCount = 0; // Anula contagem positiva quando há negação explícita
    }
  }
  
  // Determina o sentimento baseado na contagem
  if (positiveCount > negativeCount) {
    const confidence = Math.min(1, (positiveCount - negativeCount) / 5);
    return { sentiment: 'positive', confidence };
  } else if (negativeCount > positiveCount) {
    const confidence = Math.min(1, (negativeCount - positiveCount) / 5);
    return { sentiment: 'negative', confidence };
  } else {
    return { sentiment: 'neutral', confidence: 0.7 };
  }
}

/**
 * Extrai palavras-chave principais da mensagem do usuário
 * @param message Mensagem do usuário
 * @param maxKeywords Número máximo de palavras-chave
 * @returns Array de palavras-chave
 */
export function extractKeywords(message: string, maxKeywords: number = 5): string[] {
  // Lista de stopwords em português
  const stopwords = [
    'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'as', 'até',
    'com', 'como', 'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles', 'depois',
    'do', 'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entre', 'era',
    'eram', 'éramos', 'essa', 'essas', 'esse', 'esses', 'esta', 'estas', 'este',
    'estou', 'eu', 'foi', 'fomos', 'for', 'foram', 'fui', 'há', 'isso', 'isto',
    'já', 'lhe', 'lhes', 'mais', 'mas', 'me', 'mesmo', 'meu', 'meus', 'minha',
    'minhas', 'muito', 'na', 'não', 'nao', 'nas', 'nem', 'no', 'nos', 'nós', 'nossa',
    'nossas', 'nosso', 'nossos', 'num', 'numa', 'o', 'os', 'ou', 'para', 'pela',
    'pelas', 'pelo', 'pelos', 'por', 'qual', 'quando', 'que', 'quem', 'são',
    'se', 'seja', 'sem', 'seu', 'seus', 'só', 'somos', 'sou', 'sua', 'suas',
    'também', 'te', 'tem', 'tém', 'temos', 'tenho', 'teu', 'teus', 'tu', 'tua',
    'tuas', 'um', 'uma', 'umas', 'uns', 'você', 'vocês', 'vos', 'vosso', 'vossos'
  ];
  
  // Tokenização melhorada (dividir por espaços e remover pontuação)
  const tokens = message.toLowerCase()
    .replace(/[^\w\sáàâãéêíóôõúüçñ]/g, '') // Mantém caracteres especiais PT-BR
    .split(/\s+/)
    .filter(token => token.length > 2 && !stopwords.includes(token)); // Reduzimos o limite para 2 caracteres
  
  // Análise para identificar frases negativas
  const negationWords = ['não', 'nao', 'nunca', 'jamais', 'nem'];
  const hasNegation = negationWords.some(word => 
    message.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'i'))
  );
  
  // Se há negação, adicionamos um token de sentimento negativo
  const processedTokens = hasNegation ? [...tokens, 'negativo'] : tokens;
  
  // Mapeamento de contrações e variações comuns em português
  const wordMappings: Record<string, string> = {
    'nao': 'não',
    'pq': 'porque',
    'q': 'que',
    'vc': 'você',
    'vcs': 'vocês',
    'tb': 'também',
    'obg': 'obrigado',
    'blz': 'beleza',
    'n': 'não'
  };
  
  // Aplica o mapeamento para normalizar as palavras
  const normalizedTokens = processedTokens.map(token => 
    wordMappings[token] || token
  );
  
  // Conta frequência das palavras
  const wordFrequency: Record<string, number> = {};
  normalizedTokens.forEach(token => {
    wordFrequency[token] = (wordFrequency[token] || 0) + 1;
  });
  
  // Aumenta a importância de palavras em contexto negativo
  if (hasNegation) {
    Object.keys(wordFrequency).forEach(word => {
      if (word !== 'negativo' && word !== 'não') {
        wordFrequency[word] += 0.5; // Dá um pequeno boost para todas as palavras em contexto negativo
      }
    });
  }
  
  // Ordena por frequência e retorna as top keywords
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(entry => entry[0]);
}

/**
 * Prepara metadados avançados para a API do chatbot
 * @param messages Histórico de mensagens
 * @param currentContext Contexto atual opcional
 * @returns Objeto com metadados enriquecidos
 */
export function prepareEnhancedMetadata(
  messages: ChatMessage[],
  currentContext?: ChatContext
): Record<string, any> {
  // Pega a última mensagem do usuário
  const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
  
  if (!lastUserMessage) {
    return {
      timestamp: new Date().toISOString(),
      ...currentContext
    };
  }
  
  // Detecta intenção e sentimento
  const intent = detectIntent(lastUserMessage.content);
  const sentiment = analyzeSentiment(lastUserMessage.content);
  const keywords = extractKeywords(lastUserMessage.content);
  
  // Constrói histórico de tópicos da conversa
  const conversationTopics = messages
    .filter(msg => msg.role === 'user')
    .slice(-5)
    .flatMap(msg => extractKeywords(msg.content, 3))
    .filter((value, index, self) => self.indexOf(value) === index)
    .slice(0, 10);
  
  // Monta metadados enriquecidos
  return {
    timestamp: new Date().toISOString(),
    messageAnalysis: {
      intent,
      sentiment: sentiment.sentiment,
      sentimentConfidence: sentiment.confidence,
      keywords,
      messageLength: lastUserMessage.content.length
    },
    conversationContext: {
      topics: conversationTopics,
      messageCount: messages.length,
      userMessageCount: messages.filter(msg => msg.role === 'user').length,
      assistantMessageCount: messages.filter(msg => msg.role === 'assistant').length
    },
    ...currentContext
  };
}

/**
 * Detecta se a mensagem é uma pergunta de follow-up que precisa de contexto anterior
 * @param message Mensagem do usuário
 * @param previousMessages Mensagens anteriores
 * @returns true se for uma pergunta de follow-up
 */
export function isFollowUpQuestion(message: string, previousMessages: ChatMessage[]): boolean {
  // Indicadores de follow-up
  const followUpIndicators = [
    'e sobre', 'e quanto a', 'mas e', 'e também', 'além disso',
    'isso', 'ele', 'ela', 'eles', 'elas', 'desse', 'dessa', 'desses', 'dessas',
    'nisso', 'nele', 'nela', 'disso', 'dele', 'dela'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // Verifica pronomes e indicadores de referência
  const hasFollowUpIndicators = followUpIndicators.some(indicator => 
    lowerMessage.includes(indicator)
  );
  
  // Verifica se a mensagem é muito curta (provável follow-up)
  const isShortMessage = message.split(/\s+/).length < 5;
  
  // Verifica se há mensagens anteriores recentes
  const hasRecentMessages = previousMessages.length > 1;
  
  return hasRecentMessages && (hasFollowUpIndicators || isShortMessage);
}
