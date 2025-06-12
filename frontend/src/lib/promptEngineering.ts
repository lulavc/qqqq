/**
 * Prompt Engineering module for improving chatbot response quality
 */

export interface PromptTemplate {
  id: string;
  description: string;
  template: string;
  useCondition: (message: string, context?: any) => boolean;
}

// Coleção de templates de prompt para diferentes cenários
export const promptTemplates: PromptTemplate[] = [
  {
    id: 'default',
    description: 'Template padrão para perguntas gerais',
    template: `Você é o assistente virtual da AInovar, focado em ajudar com IA, desenvolvimento de software e tecnologia.
Responda à seguinte pergunta de maneira clara, amigável e prestativa.
Se não souber a resposta, diga honestamente que não sabe mas sugira onde a informação pode ser encontrada.
Contexto atual: {{contextInfo}}

Pergunta: {{userMessage}}`,
    useCondition: () => true // Condição de fallback
  },
  {
    id: 'technical',
    description: 'Template para perguntas técnicas',
    template: `Você é o assistente virtual da AInovar, pronto para colaborar em questões técnicas.
Responda à seguinte pergunta técnica de forma clara e acessível, com exemplos práticos quando possível.
Use markdown para organizar a resposta de forma que facilite a compreensão.
Se código for útil, compartilhe exemplos que possam ajudar.
Contexto atual: {{contextInfo}}

Pergunta técnica: {{userMessage}}`,
    useCondition: (message) => {
      const technicalKeywords = ['código', 'programação', 'api', 'função', 'implementar', 
        'desenvolver', 'bug', 'erro', 'javascript', 'python', 'react', 'tecnologia', 'software'];
      return technicalKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }
  },
  {
    id: 'business',
    description: 'Template para perguntas sobre negócios e soluções empresariais',
    template: `Você é o consultor da AInovar, pronto para colaborar com soluções para seu negócio.
Responda à seguinte pergunta sobre negócios ou soluções empresariais, destacando como podemos trabalhar juntos.
Foque em como a tecnologia pode apoiar seus objetivos de negócio de forma prática e acessível.
Contexto atual: {{contextInfo}}

Pergunta de negócios: {{userMessage}}`,
    useCondition: (message) => {
      const businessKeywords = ['empresa', 'negócio', 'custo', 'investimento', 'roi', 'retorno', 
        'implementação', 'solução', 'cliente', 'mercado', 'valor', 'estratégia', 'benefício'];
      return businessKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }
  },
  {
    id: 'produtoAInovar',
    description: 'Template para perguntas sobre produtos e serviços da AInovar',
    template: `Você é o assistente da AInovar, pronto para conversar sobre nossas soluções.
Responda à seguinte pergunta sobre nossos produtos ou serviços de maneira informativa e amigável.
Compartilhe como podemos colaborar para atender às necessidades específicas, sem usar linguagem exagerada.
Mencione como outros clientes têm utilizado nossas soluções com sucesso.
Contexto atual: {{contextInfo}}

Pergunta sobre produtos/serviços: {{userMessage}}`,
    useCondition: (message) => {
      const productKeywords = ['produto', 'serviço', 'oferecem', 'preço', 'custo', 'plano', 
        'contratação', 'contratar', 'ainovar', 'solução', 'ferramenta'];
      return productKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }
  }
];

/**
 * Seleciona o template mais adequado para a mensagem do usuário
 * @param message Mensagem do usuário
 * @param context Informações contextuais adicionais
 * @returns Template de prompt selecionado
 */
export function selectPromptTemplate(message: string, context?: any): PromptTemplate {
  // Encontra o primeiro template que atende à condição
  const selectedTemplate = promptTemplates.find(template => 
    template.useCondition(message, context)
  );
  
  // Retorna o template selecionado ou o template padrão
  return selectedTemplate || promptTemplates[0];
}

/**
 * Formata um template de prompt com os valores adequados
 * @param template Template de prompt
 * @param userMessage Mensagem do usuário
 * @param contextInfo Informações de contexto
 * @returns Prompt formatado
 */
export function formatPrompt(
  template: PromptTemplate,
  userMessage: string,
  contextInfo: string = ''
): string {
  return template.template
    .replace('{{userMessage}}', userMessage)
    .replace('{{contextInfo}}', contextInfo);
}

/**
 * Extrai informações contextuais da conversa atual
 * @param messages Histórico de mensagens
 * @returns Informações de contexto extraídas
 */
export function extractContextInfo(messages: any[]): string {
  // Extrai os tópicos das últimas 3-5 mensagens do usuário
  const userMessages = messages
    .filter(msg => msg.role === 'user')
    .slice(-5);
  
  // Se não houver mensagens suficientes, retorna contexto vazio
  if (userMessages.length === 0) return '';
  
  // Extrai tópicos principais usando palavras-chave
  const topics = userMessages
    .map(msg => extractKeyTerms(msg.content))
    .flat()
    .filter((term, index, self) => self.indexOf(term) === index) // Remove duplicatas
    .slice(0, 5); // Limita a 5 tópicos
  
  return topics.length > 0 
    ? `Tópicos recentes da conversa: ${topics.join(', ')}.` 
    : '';
}

/**
 * Extrai termos-chave de um texto
 * @param text Texto a ser analisado
 * @returns Array de termos-chave
 */
function extractKeyTerms(text: string): string[] {
  // Implementação simplificada - em produção pode-se usar NLP
  const words = text.toLowerCase().split(/\W+/);
  
  // Remove palavras comuns (stopwords)
  const stopwords = ['e', 'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 
    'para', 'com', 'em', 'por', 'que', 'se', 'na', 'no', 'você', 'como'];
  
  // Filtra palavras curtas e stopwords, retorna principais termos
  return words
    .filter(word => word.length > 3 && !stopwords.includes(word))
    .slice(0, 5);
}
