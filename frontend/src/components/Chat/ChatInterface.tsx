'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput, ChatInputProps } from './ChatInput'
import { 
  ChatMessage as ChatMessageType, 
  ChatOptions,
  createChatWebSocket,
  generateConversationId,
  getStoredConversationId,
  isWebSocketSupported,
  ChatWebSocketImpl,
  saveConversationId,
  sendChatMessage
} from '@/lib/api'
import { isAskingAboutChatbots, CHATBOT_INFO_RESPONSE } from '@/lib/chatbotResponses'
import { extractContextInfo } from '@/lib/promptEngineering';
import { prepareEnhancedMetadata, analyzeSentiment, detectIntent } from '@/lib/chatEnhancements';
import { unescapeUnicodeCharacters } from '@/lib/textUtils';
import { format, isToday, isYesterday } from 'date-fns';
import { pt } from 'date-fns/locale';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    { 
      role: 'assistant', 
      content: 'Olá! Eu sou o assistente virtual da AInovar. Como posso ajudar você hoje?', 
      timestamp: new Date().toISOString() 
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 2
  const [autoScroll, setAutoScroll] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const webSocketRef = useRef<any>(null)
  
  useEffect(() => {
    let savedConversationId = getStoredConversationId()
    
    if (savedConversationId) {
      setConversationId(savedConversationId)
    } else {
      const newId = generateConversationId()
      setConversationId(newId)
      saveConversationId(newId)
    }
    
    // Inicia a conexão WebSocket
    if (isWebSocketSupported()) {
      let chatWs = null;
      
      if (savedConversationId) {
        chatWs = createChatWebSocket(savedConversationId);
        chatWs.connect();
        
        chatWs.onMessage((data: any) => {
          // Detecta se é uma mensagem de chat
          if (data.type === 'chat' && data.message) {
            setMessages(prev => {
              // Verifica se a mensagem já existe para evitar duplicação
              const messageExists = prev.some(
                (msg) => 
                  msg.role === data.message.role && 
                  msg.content === data.message.content && 
                  msg.timestamp === data.message.timestamp
              );
              
              if (messageExists) {
                return prev;
              }
              
              return [...prev, data.message];
            });
            
            setIsTyping(false);
          }
          
          // Detecta mensagens de status de digitação
          if (data.type === 'typing') {
            setIsTyping(data.isTyping);
          }
        });
        
        chatWs.onError((error: any) => {
          console.error('Erro no WebSocket:', error);
        });
        
        webSocketRef.current = chatWs;
      }
      
      return () => {
        if (chatWs) {
          chatWs.close();
        }
      };
    }
  }, []);
  
  // Garante que a página carregue sempre no topo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Scroll imediato quando o componente montar
      window.scrollTo(0, 0);
      
      // Também scroll para o topo depois que o conteúdo for carregado
      window.addEventListener('load', () => {
        window.scrollTo(0, 0);
      });
      
      // E após o primeiro render completo
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }, []);

  // Gerencia a rolagem automática apenas quando necessário
  useEffect(() => {
    if (autoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, autoScroll])
  
  // Detecta quando o usuário rola manualmente para desativar o autoScroll
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      // Se o usuário rolou para cima mais de 100px do final, desative o autoScroll
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setAutoScroll(isNearBottom)
      setShowScrollButton(!isNearBottom)
    }
    
    chatContainer.addEventListener('scroll', handleScroll)
    return () => chatContainer.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Atualiza o autoScroll quando uma nova resposta está sendo gerada
  // com limitação de frequência para evitar rolagens excessivas
  useEffect(() => {
    // Limpa qualquer timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = null
    }
    
    if (currentResponse && autoScroll && chatContainerRef.current) {
      // Usa setTimeout para limitar a frequência de rolagem (a cada 750ms)
      scrollTimeoutRef.current = setTimeout(() => {
        // Rola apenas o container do chat, não a página inteira
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 750)
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [currentResponse, autoScroll])

  // Função para processar stream de mensagens do chatbot
  async function processMessageStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decodifica o chunk atual
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Processa o buffer para obter eventos completos
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;

          if (line.startsWith('data: ')) {
            try {
              const data = line.substring(6);
              
              // Se for [DONE], termina o streaming
              if (data === '[DONE]') {
                setIsTyping(false);
                break;
              }
              
              try {
                const parsedData = JSON.parse(data);
                
                // Processa diferentes tipos de mensagens
                if (parsedData.type === 'message') {
                  // Desescapa caracteres Unicode na mensagem
                  if (parsedData.content) {
                    parsedData.content = unescapeUnicodeCharacters(parsedData.content);
                  }
                  
                  currentMessage += parsedData.content || '';
                  
                  // Atualiza a mensagem atual no estado
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    
                    // Se a última mensagem for do assistente, atualiza seu conteúdo
                    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                      const updatedMessages = [...prev];
                      updatedMessages[prev.length - 1] = {
                        ...lastMsg,
                        content: currentMessage
                      };
                      return updatedMessages;
                    }
                    
                    // Caso contrário, adiciona uma nova mensagem
                    return [...prev, {
                      role: 'assistant',
                      content: currentMessage,
                      timestamp: new Date().toISOString(),
                      isStreaming: true
                    }];
                  });
                } else if (parsedData.type === 'status') {
                  // Mensagens de status (typing, etc)
                  if (parsedData.status === 'typing') {
                    setIsTyping(true);
                  } else if (parsedData.status === 'complete') {
                    setIsTyping(false);
                    // Marca a mensagem como não mais em streaming
                    setMessages(prev => {
                      const updatedMessages = [...prev];
                      if (updatedMessages[prev.length - 1]?.isStreaming) {
                        updatedMessages[prev.length - 1] = {
                          ...updatedMessages[prev.length - 1],
                          isStreaming: false
                        };
                      }
                      return updatedMessages;
                    });
                  }
                }
              } catch (e) {
                // Se não conseguir fazer o parse como JSON, trata como texto simples
                currentMessage += data;
              }
            } catch (e) {
              console.error('Error processing SSE message:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      setError('Erro ao processar resposta. Por favor, tente novamente.');
    } finally {
      // Garante que o indicador de digitação seja desligado
      setIsTyping(false);
      setIsLoading(false);
      
      // Finaliza a última mensagem se ainda estiver em streaming
      setMessages(prev => {
        const updatedMessages = [...prev];
        if (updatedMessages[prev.length - 1]?.isStreaming) {
          updatedMessages[prev.length - 1] = {
            ...updatedMessages[prev.length - 1],
            isStreaming: false
          };
        }
        return updatedMessages;
      });
    }
  }

  async function handleSendMessage(content: string) {
    if (!content.trim() || isLoading) return

    // Limpa qualquer erro anterior
    setError(null)
    
    // Reativa o autoScroll quando o usuário envia uma nova mensagem
    setAutoScroll(true)
    setShowScrollButton(false)
    
    // Adiciona a mensagem do usuário
    const userMessage: ChatMessageType = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    
    // Verifica se está perguntando sobre chatbots da AInovar
    // Se sim, envia uma resposta especializada imediatamente
    if (isAskingAboutChatbots(content)) {
      // Pequeno delay para simular processamento
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Adiciona a resposta especializada sobre chatbots
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: CHATBOT_INFO_RESPONSE,
        timestamp: new Date().toISOString()
      }]);
      
      setIsLoading(false);
      return;
    }
    
    // Análise de mensagem para logs e telemetria
    const messageIntent = detectIntent(content);
    const sentimentAnalysis = analyzeSentiment(content);
    
    // Coleta dados de contexto para melhorar a qualidade das respostas
    const pageContextData = {
      pageContext: {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer || undefined,
        visitTime: new Date().toISOString()
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      // Informações de interação
      interactionMetrics: {
        messageCount: messages.length,
        sessionDuration: conversationId ? Date.now() - new Date(messages[0]?.timestamp || Date.now()).getTime() : 0,
        messageIntent: messageIntent,
        sentiment: sentimentAnalysis.sentiment,
        sentimentConfidence: sentimentAnalysis.confidence
      }
    };
    
    // Tenta enviar via WebSocket primeiro
    let usedWebSocket = false;
    if (webSocketRef.current && (webSocketRef.current as any).isConnected()) {
      usedWebSocket = (webSocketRef.current as any).sendMessage({
        type: 'chat',
        message: userMessage,
        conversationId: conversationId || undefined,
        metadata: pageContextData
      });
      
      if (usedWebSocket) {
        setIsTyping(true);
      }
    }
    
    // Se WebSocket não estiver disponível ou falhar, usa HTTP
    if (!usedWebSocket) {
      // Cria um novo controlador de aborto para esta requisição
      abortControllerRef.current = new AbortController()
      
      try {
        // Envia a mensagem para o backend com contexto enriquecido
        const stream = await sendChatMessage(
          messages.concat(userMessage),
          { 
            conversationId: conversationId || undefined,
            metadata: pageContextData
          }
        )
        
        if (!stream) {
          throw new Error('Não foi possível obter resposta do servidor')
        }
        
        // Processa a resposta em streaming
        await processMessageStream(stream);
        
        // Reseta o contador de tentativas após sucesso
        setRetryCount(0)
      } catch (error) {
        console.error('Erro na comunicação do chat:', error)
        setError(error instanceof Error ? error.message : 'Erro desconhecido ocorreu')
        
        // Mensagem de erro amigável para o usuário
        setMessages(prev => [
          ...prev,
          {
            role: 'system',
            content: `Desculpe, estamos com dificuldades para conectar ao serviço de chat. Por favor, tente novamente em alguns instantes ou entre em contato pelo e-mail luizvalois@ainovar.tech.`,
            timestamp: new Date().toISOString()
          }
        ])
        
        // Incrementa o contador de tentativas
        setRetryCount(prev => prev + 1)
      } finally {
        setIsLoading(false)
        setIsTyping(false)
        abortControllerRef.current = null
      }
    }
  }
  
  // Função para tentar novamente a conexão
  function handleRetry() {
    if (retryCount >= maxRetries) {
      // Recarrega a página se excedeu o número máximo de tentativas
      window.location.reload()
      return
    }
    
    // Remove a mensagem de erro
    setMessages(prev => prev.filter(msg => msg.role !== 'system'))
    
    // Tenta enviar a última mensagem do usuário novamente
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content)
    }
  }
  
  // Botão para reativar o autoScroll
  function handleScrollToBottom() {
    setAutoScroll(true)
    setShowScrollButton(false)
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="h-[600px] flex flex-col">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              isStreaming={message.isStreaming}
            />
          ))}
          
          {isTyping && !currentResponse && (
            <ChatMessage
              role="assistant"
              content="..."
              isStreaming
            />
          )}
          
          {error && (
            <div className="flex justify-center mt-4">
              <button 
                onClick={handleRetry} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Tentar novamente
              </button>
            </div>
          )}
          
          {/* Botão de rolagem para baixo (aparece quando autoScroll está desativado) */}
          {showScrollButton && (
            <div className="fixed bottom-28 right-8 z-10">
              <button
                onClick={handleScrollToBottom}
                className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200"
                aria-label="Rolar para o final da conversa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading || isTyping} 
            disabled={retryCount >= maxRetries}
            placeholder={retryCount >= maxRetries ? "Recarregue a página para continuar..." : "Digite sua mensagem..."}
          />
        </div>
      </div>
    </div>
  )
}