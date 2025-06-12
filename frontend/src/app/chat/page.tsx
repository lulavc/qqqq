import type { Metadata } from 'next'
import { ChatInterface } from '@/components/Chat/ChatInterface'

export const metadata: Metadata = {
  title: 'Chat IA - AInovar.tech',
  description: 'Chat com IA especializada em produtos, serviços e suporte'
}

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-20">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Chat AInovar</h1>
          <p className="text-gray-600 mb-8">
            Converse com nosso assistente virtual e descubra como a AInovar pode ajudar sua empresa.
            Tire dúvidas sobre nossos produtos, serviços ou obtenha suporte técnico.
          </p>
          
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Assistente Virtual Inteligente</h2>
            <p className="text-gray-600 mb-4">
              Nosso assistente pode ajudar com:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Informações sobre produtos e serviços</li>
              <li>Preços e orçamentos</li>
              <li>Suporte técnico e dúvidas</li>
              <li>Agendamento de demonstrações</li>
            </ul>
          </div>
          
          <ChatInterface />
        </div>
      </div>
    </main>
  )
} 