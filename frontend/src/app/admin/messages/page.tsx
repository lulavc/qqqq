import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import Notification from '@/components/ui/Notification'

interface Message {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await api.getMessages()
      if (response.success && response.data) {
        setMessages(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao carregar mensagens'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await api.updateMessage(id, { read: true })
      if (response.success) {
        setMessages(messages.map(message =>
          message.id === id ? { ...message, read: true } : message
        ))
        setNotification({
          type: 'success',
          message: 'Mensagem marcada como lida'
        })
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao marcar mensagem como lida'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) {
      return
    }

    try {
      const response = await api.deleteMessage(id)
      if (response.success) {
        setMessages(messages.filter(message => message.id !== id))
        setNotification({
          type: 'success',
          message: 'Mensagem excluída com sucesso'
        })
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao excluir mensagem'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Mensagens</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie as mensagens recebidas
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {messages.map((message) => (
            <li key={message.id}>
              <div className={`px-4 py-4 sm:px-6 ${!message.read ? 'bg-gray-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {message.subject}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {message.name} &lt;{message.email}&gt;
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    {!message.read && (
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Marcar como lida
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="text-sm text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message.message}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-400">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 