import { clsx } from 'clsx'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={clsx('flex items-center space-x-2 p-2', className)}>
      <div className="typing-indicator">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="text-sm text-gray-500">Assistente digitando...</span>
    </div>
  )
} 