import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

export interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  isLoading = false,
  placeholder = 'Digite sua mensagem...',
  maxLength = 4000
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-redimensiona o textarea conforme o conteúdo cresce
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || disabled || isLoading) return
    
    onSendMessage(message)
    setMessage('')
    
    // Reseta a altura do textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Envia ao pressionar Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled || isLoading}
            className={clsx(
              "w-full p-3 pr-10 border rounded-lg resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200",
              "min-h-[50px] max-h-[150px]",
              {
                "bg-gray-100 text-gray-500": disabled || isLoading,
                "bg-white": !disabled && !isLoading
              }
            )}
          />
          
          {message.length > 0 && (
            <span className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length}/{maxLength}
            </span>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled || isLoading}
          className={clsx(
            "p-3 rounded-full",
            "transition-colors duration-200",
            {
              "bg-blue-500 text-white hover:bg-blue-600": message.trim() && !disabled && !isLoading,
              "bg-gray-300 text-gray-500 cursor-not-allowed": !message.trim() || disabled || isLoading
            }
          )}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {disabled && !isLoading && (
        <div className="mt-2 text-center text-sm text-red-500">
          Não foi possível conectar ao servidor. Por favor, tente novamente mais tarde.
        </div>
      )}
    </form>
  )
}