import { memo, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  isStreaming?: boolean
  status?: 'sending' | 'sent' | 'error'
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming = false,
  status = 'sent'
}: ChatMessageProps) {
  // Estado para controlar os pontos do indicador de digitação
  const [typingDots, setTypingDots] = useState('.');
  
  // Efeito para animar os pontos de digitação
  useEffect(() => {
    if (isStreaming && content === '...') {
      const interval = setInterval(() => {
        setTypingDots(prev => {
          if (prev.length >= 3) return '.';
          return prev + '.';
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isStreaming, content]);
  
  // Conteúdo a ser exibido
  const displayContent = content === '...' ? typingDots : content;
  
  // Formata o timestamp se fornecido
  const formattedTime = timestamp 
    ? formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: ptBR
      })
    : ''

  return (
    <div
      className={clsx(
        'message-container group relative flex',
        role === 'user' ? 'justify-end' : 'justify-start',
        role === 'system' && 'justify-center'
      )}
    >
      <div
        className={clsx(
          'message-bubble max-w-[80%] rounded-lg px-4 py-2',
          role === 'user' && 'bg-primary text-white',
          role === 'assistant' && 'bg-gray-100 text-gray-800',
          role === 'system' && 'bg-yellow-50 text-gray-700 text-sm',
          isStreaming && content === '...' && 'animate-pulse'
        )}
      >
        <ReactMarkdown
          className={clsx(
            'prose max-w-none',
            role === 'user' && 'prose-invert',
            role === 'assistant' && 'prose-gray'
          )}
        >
          {displayContent}
        </ReactMarkdown>
        
        {/* Indicador de status e timestamp */}
        <div className="mt-1 flex items-center justify-end space-x-2">
          {status === 'sending' && (
            <span className="text-xs opacity-70">Enviando...</span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-500">Erro ao enviar</span>
          )}
          {timestamp && (
            <span className="text-xs opacity-70">{formattedTime}</span>
          )}
        </div>
      </div>
    </div>
  )
})