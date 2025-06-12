"use client";

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import {
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'

const contactInfo = {
  email: 'luizvalois@ainovar.tech',
  address: 'Recife, PE - Brasil'
}

export default function ContactPage() {
  const [selectedService, setSelectedService] = useState("");
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      const service = searchParams.get('service');
      if (service) {
        setSelectedService(service);
      }
    }
  }, [searchParams]);
  
  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Entre em Contato
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estamos prontos para ajudar sua empresa a alcançar todo seu potencial com nossas soluções em IA.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Envie sua Mensagem
            </h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input w-full rounded-lg"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input w-full rounded-lg"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="form-input w-full rounded-lg"
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                  Serviço de Interesse
                </label>
                <select
                  id="service"
                  name="service"
                  className="form-select w-full rounded-lg"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="" disabled>Selecione um serviço</option>
                  <option value="ai-consulting">Consultoria em IA</option>
                  <option value="custom-development">Desenvolvimento Personalizado</option>
                  <option value="chatbots">Chatbots Inteligentes</option>
                  <option value="data-analytics">Análise de Dados</option>
                  <option value="training">Treinamento e Capacitação</option>
                  <option value="cloud-ai">IA na Nuvem</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="form-textarea w-full rounded-lg"
                  placeholder="Como podemos ajudar?"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Enviar Mensagem
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="lg:pl-12">
            <div className="bg-primary text-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-6">
                Informações de Contato
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <EnvelopeIcon className="w-6 h-6 mr-3 mt-1" />
                  <div>
                    <p className="font-medium mb-1">E-mail</p>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="hover:underline"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="w-6 h-6 mr-3 mt-1" />
                  <div>
                    <p className="font-medium mb-1">Localização</p>
                    <p>{contactInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-[300px]">
                <Image
                  src="/images/office.jpg"
                  alt="AInovar Office"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 