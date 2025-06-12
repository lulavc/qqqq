'use client';

import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../../lib/api';
import { simulateChatbotResponse } from '../../lib/chatbotTest';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function TesteChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Adiciona a mensagem do usuário
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simula a resposta do chatbot com as melhorias implementadas
      const { analysis, response } = await simulateChatbotResponse([...messages, userMessage]);
      
      // Exibe a análise feita pelo sistema
      setAiAnalysis(analysis);
      
      // Adiciona a resposta do chatbot
      const botMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro ao simular resposta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formata a timestamp para exibição
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return format(new Date(), "HH:mm", { locale: pt });
    return format(new Date(timestamp), "HH:mm", { locale: pt });
  };

  // Função para desescapar caracteres Unicode
  const unescapeUnicodeCharacters = (text: string) => {
    return text
      .replace(/\\u([a-fA-F0-9]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&([a-z]+|#[0-9]+);/gi, (match, entity) => {
        const entities: Record<string, string> = {
          'amp': '&',
          'lt': '<',
          'gt': '>',
          'quot': '"',
          'apos': "'"
        };
        
        if (entities[entity]) {
          return entities[entity];
        } else if (entity.startsWith('#')) {
          return String.fromCharCode(parseInt(entity.substring(1), 10));
        }
        
        return match;
      });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Melhorias do Chatbot AInovar</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel de mensagens */}
        <div className="md:col-span-2 border rounded-lg p-4 bg-white shadow">
          <div className="h-96 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 my-8">
                Envie uma mensagem para testar as melhorias do chatbot
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 ml-12' 
                      : 'bg-gray-100 mr-12'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">
                      {msg.role === 'user' ? 'Você' : 'AInovar Bot'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(msg.timestamp || '')}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {/* Apresenta conteúdo com caracteres desescapados e formatação markdown */}
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: unescapeUnicodeCharacters(msg.content) 
                      }} 
                    />
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="p-3 rounded-lg bg-gray-100 mr-12">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold">AInovar Bot</span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(new Date().toISOString())}
                  </span>
                </div>
                <div className="flex items-center space-x-1 h-6">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
        
        {/* Painel de análise */}
        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="text-lg font-semibold mb-3">Análise do Sistema</h2>
          
          {aiAnalysis ? (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-700">Intenção Detectada:</h3>
                <div className="bg-yellow-50 p-2 rounded mt-1">
                  {aiAnalysis.intent}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Sentimento:</h3>
                <div className="bg-yellow-50 p-2 rounded mt-1 flex items-center">
                  {aiAnalysis.sentiment === 'positive' && (
                    <span className="text-green-500">😊 Positivo</span>
                  )}
                  {aiAnalysis.sentiment === 'neutral' && (
                    <span className="text-gray-500">😐 Neutro</span>
                  )}
                  {aiAnalysis.sentiment === 'negative' && (
                    <span className="text-red-500">😟 Negativo</span>
                  )}
                  <span className="ml-2 text-xs">
                    (confiança: {Math.round(aiAnalysis.confidenceScore * 100)}%)
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Palavras-chave:</h3>
                <div className="bg-yellow-50 p-2 rounded mt-1">
                  {aiAnalysis.keywords.length > 0 
                    ? aiAnalysis.keywords.map((keyword: string, i: number) => (
                        <span key={i} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1">
                          {keyword}
                        </span>
                      ))
                    : <span className="text-gray-500">Nenhuma palavra-chave identificada</span>
                  }
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Contexto da Conversa:</h3>
                <div className="bg-yellow-50 p-2 rounded mt-1 text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(aiAnalysis.enhancedMetadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 my-8">
              Envie uma mensagem para ver a análise
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Sugestões para testar</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Pergunte sobre os chatbots da AInovar</li>
          <li>Faça uma pergunta técnica (ex: "Como implementar um chatbot?")</li>
          <li>Pergunte sobre preços (ex: "Quanto custa o serviço?")</li>
          <li>Faça uma pergunta de follow-up (ex: "E como funciona?")</li>
          <li>Use uma mensagem com sentimento positivo ou negativo</li>
        </ul>
      </div>
    </div>
  );
}
