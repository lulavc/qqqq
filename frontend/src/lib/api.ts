const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface ChatOptions {
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface ChatWebSocket {
  connect(): void;
  isConnected(): boolean;
  sendMessage(data: any): boolean;
  onMessage(handler: (message: any) => void): void;
  onError(handler: (error: any) => void): void;
  onStatusChange(handler: (status: ConnectionStatus) => void): void;
  close(): void;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// Importações após as declarações de interface para evitar conflitos
import { selectPromptTemplate, formatPrompt, extractContextInfo } from './promptEngineering';
import { prepareEnhancedMetadata, isFollowUpQuestion } from './chatEnhancements';
// Importamos a função unescapeUnicodeCharacters do módulo textUtils
import { unescapeUnicodeCharacters } from './textUtils';

/**
 * Classe para gerenciar conexões WebSocket
 */
export class ChatWebSocketImpl implements ChatWebSocket {
  private ws: WebSocket | null = null
  private messageQueue: any[] = []
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private isConnecting = false
  private closeRequested = false
  private pingInterval: NodeJS.Timeout | null = null
  private connectionTimeout: NodeJS.Timeout | null = null
  private onMessageCallback: ((message: any) => void) | null = null
  private onStatusChangeCallback: ((status: ConnectionStatus) => void) | null = null
  
  constructor(private url: string) {}
  
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }
    
    if (this.isConnecting) {
      return
    }
    
    this.isConnecting = true
    this.closeRequested = false
    
    // Define um timeout para a conexão
    this.connectionTimeout = setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket connection timeout. Retrying...')
        this.reconnect()
      }
    }, 10000) // 10 segundos para timeout de conexão
    
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        
        // Limpa o timeout de conexão
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout)
          this.connectionTimeout = null
        }
        
        // Configura o ping para manter a conexão ativa
        this.startPing()
        
        // Processa a fila de mensagens pendentes
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift()
          this.doSendMessage(message)
        }
        
        this.onStatusChangeCallback?.('connected')
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Aplicar correção de caracteres Unicode nas mensagens recebidas
          if (data.message && data.message.content) {
            data.message.content = unescapeUnicodeCharacters(data.message.content);
          }
          
          this.onMessageCallback?.(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      this.ws.onclose = (event) => {
        this.isConnecting = false
        
        // Limpa o timeout de conexão e intervalos de ping
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout)
          this.connectionTimeout = null
        }
        
        if (this.pingInterval) {
          clearInterval(this.pingInterval)
          this.pingInterval = null
        }
        
        if (!this.closeRequested) {
          this.reconnect()
        } else {
          this.onStatusChangeCallback?.('disconnected')
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnecting = false
        
        // Não tenta reconectar aqui, pois onclose será chamado automaticamente
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      this.isConnecting = false
      this.reconnect()
    }
  }
  
  /**
   * Envia uma mensagem através do WebSocket
   * @param data Dados a serem enviados
   * @returns true se a mensagem foi enviada com sucesso
   */
  public sendMessage(data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(data)
      return false
    }

    try {
      this.doSendMessage(data);
      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem WebSocket:', error)
      return false
    }
  }

  /**
   * Envia mensagem internamente
   */
  private doSendMessage(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Configura callback para processar mensagens
   * @param handler Função para processar mensagens
   */
  public onMessage(handler: (message: any) => void): void {
    this.onMessageCallback = handler
  }

  /**
   * Configura callback para processar erros
   * @param handler Função para processar erros
   */
  public onError(handler: (error: any) => void): void {
    // Implementação simplificada - erros são tratados pelo onclose
    console.warn('WebSocket.onError está depreciado. Use onStatusChange para monitorar o estado da conexão.');
  }

  /**
   * Configura callback para monitorar mudanças de status
   */
  public onStatusChange(handler: (status: ConnectionStatus) => void): void {
    this.onStatusChangeCallback = handler;
  }

  /**
   * Tenta reconectar ao servidor WebSocket
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Número máximo de tentativas de reconexão excedido');
      this.onStatusChangeCallback?.('disconnected');
      return;
    }

    this.reconnectAttempts++;

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.closeRequested) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Inicia o ping periódico para manter a conexão ativa
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 segundos
  }

  /**
   * Verifica se o WebSocket está conectado
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Fecha a conexão WebSocket
   */
  public close(): void {
    if (this.ws) {
      this.closeRequested = true
      this.ws.close()
      this.ws = null
      this.isConnecting = false
    }
  }
}

/**
 * Verifica se o navegador suporta WebSockets
 */
export function isWebSocketSupported(): boolean {
  return typeof WebSocket !== 'undefined';
}

/**
 * Gera um ID de conversa único
 */
export function generateConversationId(): string {
  return 'conv_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Salva o ID de conversa no localStorage
 */
export function saveConversationId(id: string): void {
  localStorage.setItem('ainovar_conversation_id', id);
}

/**
 * Recupera o ID de conversa do localStorage
 */
export function getStoredConversationId(): string | null {
  return localStorage.getItem('ainovar_conversation_id');
}

/**
 * Cria e retorna uma instância do WebSocket para chat
 */
export function createChatWebSocket(conversationId: string): ChatWebSocket {
  // Determina o protocolo (ws ou wss) com base no protocolo HTTP atual
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Extrai o host da API a partir da URL da API
  const apiHost = API_BASE_URL.replace(/^https?:\/\//, '');
  // Cria a URL do WebSocket
  const wsUrl = `${protocol}//${apiHost}/ws?conversationId=${conversationId}`;
  
  return new ChatWebSocketImpl(wsUrl);
}

/**
 * Envia uma mensagem para o chatbot
 * @param messages Lista de mensagens da conversa
 * @param options Opções adicionais (ID da conversa, metadados)
 * @returns Stream de eventos com a resposta
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  try {
    // Prepara metadados enriquecidos para melhorar a qualidade das respostas
    const enhancedMetadata = prepareEnhancedMetadata(messages, options.metadata || {});
    
    // Utiliza o sistema de prompts para obter respostas de alta qualidade
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    
    if (lastUserMessage) {
      // Extrai informações contextuais da conversa
      const contextInfo = extractContextInfo(messages);
      
      // Verifica se é uma pergunta de follow-up
      const isFollowUp = isFollowUpQuestion(lastUserMessage.content, messages.slice(0, -1));
      
      // Adiciona indicação de follow-up ao contexto se necessário
      const enhancedContext = isFollowUp 
        ? `${contextInfo} Esta é uma pergunta de acompanhamento que se refere à conversa anterior.` 
        : contextInfo;
      
      // Seleciona e formata o prompt adequado
      const promptTemplate = selectPromptTemplate(lastUserMessage.content, enhancedMetadata);
      
      // Formata o sistema prompt com o template selecionado
      const systemPrompt = formatPrompt(
        promptTemplate,
        lastUserMessage.content,
        enhancedContext
      );
      
      // Adiciona ou atualiza o prompt de sistema no início da conversa
      const processedMessages = messages.filter(msg => msg.role !== 'system');
      processedMessages.unshift({
        role: 'system',
        content: systemPrompt,
        timestamp: new Date().toISOString()
      });
      
      // Usa o histórico de mensagens processado
      messages = processedMessages;
    }
    
    const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        conversationId: options.conversationId,
        metadata: enhancedMetadata
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    return response.body;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Recupera o histórico de uma conversa
 * @param conversationId ID da conversa
 * @returns Resposta com o histórico da conversa
 */
export async function getConversationHistory(
  conversationId: string
): Promise<ConversationHistoryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chatbot/history/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Erro ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao recuperar histórico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Função para processar a resposta SSE do chatbot
 * @param reader Leitor do stream de resposta
 */
export async function* parseSSEResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<ChatMessage, void, unknown> {
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          
          if (data === '[DONE]') {
            return
          }
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.role && parsed.content) {
              // Aplicamos o desescapamento dos caracteres Unicode usando a função importada
              if (parsed.content) {
                parsed.content = unescapeUnicodeCharacters(parsed.content)
              }
              yield parsed
            }
          } catch (e) {
            console.error('Erro ao parsear dados SSE:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao ler stream SSE:', error)
    throw error
  } finally {
    reader.releaseLock()
  }
}

/**
 * Obtém informações sobre os modelos disponíveis
 */
export async function getModels(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return await response.json()
  } catch (error) {
    console.error('Erro ao obter modelos:', error)
    return { success: false, error: 'Falha ao carregar informações dos modelos' }
  }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConversationHistoryResponse {
  success: boolean;
  data?: {
    messages: ChatMessage[];
    metadata?: any;
  };
  error?: string;
}