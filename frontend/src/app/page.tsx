"use client"

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import {
  ChatBubbleBottomCenterTextIcon,
  CpuChipIcon,
  DocumentTextIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  ServerIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { StatsSection } from '@/components/ui/StatsSection'
import { Testimonial } from '@/components/ui/Testimonial'
import { BlogPreview } from '@/components/Blog/BlogPreview'
import { ChatInterface } from '@/components/Chat/ChatInterface'
import { useEffect } from 'react'

// Mock data for the blog preview
const recentPosts = [
  {
    slug: 'futuro-da-ia',
    title: 'O Futuro da IA no Brasil',
    excerpt: 'Como a inteligência artificial está transformando o mercado brasileiro e criando novas oportunidades.',
    coverImage: '/images/blog/ia-brasil.jpg',
    date: '2025-03-20',
    author: {
      name: 'Luiz Henrique Valois Cireno',
      avatar: '/images/team/luiz.jpg'
    },
    tags: ['IA', 'Mercado', 'Inovação']
  },
  {
    slug: 'chatbots-empresas',
    title: 'Chatbots na Transformação Digital',
    excerpt: 'Descubra como os chatbots estão revolucionando o atendimento ao cliente e otimizando processos.',
    coverImage: '/images/blog/chatbots.jpg',
    date: '2025-03-15',
    author: {
      name: 'Luiz Henrique Valois Cireno',
      avatar: '/images/team/luiz.jpg'
    },
    tags: ['Chatbots', 'Atendimento', 'Automação']
  },
  {
    slug: 'machine-learning-pratica',
    title: 'Machine Learning na Prática',
    excerpt: 'Um guia prático sobre como implementar soluções de machine learning em sua empresa.',
    coverImage: '/images/blog/machine-learning.jpg',
    date: '2025-03-10',
    author: {
      name: 'Luiz Henrique Valois Cireno',
      avatar: '/images/team/luiz.jpg'
    },
    tags: ['Machine Learning', 'Tutorial', 'Tecnologia']
  }
]

// Stats data
const statsData = {
  title: "Impacto Real em Números",
  subtitle: "Resultados que transformam negócios e impulsionam o sucesso dos nossos clientes.",
  stats: [
    {
      value: "+500",
      label: "Projetos Entregues",
      description: "Soluções personalizadas implementadas com sucesso"
    },
    {
      value: "98%",
      label: "Satisfação",
      description: "Clientes satisfeitos com nossas soluções"
    },
    {
      value: "45%",
      label: "Economia",
      description: "Média de redução em custos operacionais"
    }
  ]
}

export default function HomePage() {
  useEffect(() => {
    // Garante que a página sempre carregue no topo
    window.scrollTo(0, 0);
    
    // Adiciona um evento para impedir o comportamento de scroll automático
    const handleScroll = () => {
      // Se a página tentar rolar automaticamente nos primeiros 2 segundos
      // força o retorno para o topo
      if (document.documentElement.scrollTop > 0) {
        window.scrollTo(0, 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Remove o listener após 2 segundos
    const timeoutId = setTimeout(() => {
      window.removeEventListener('scroll', handleScroll);
    }, 2000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center pt-16 bg-gradient-to-br from-blue-900 to-indigo-800">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgNCAxLjc5MSA0IDQgNCA0LTEuNzkxIDQtNHptMTggMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNCAxLjc5MSA0IDQgNCA0LTEuNzkxIDQtNHptMTggMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNCAxLjc5MSA0IDQgNCA0LTEuNzkxIDQtNHptMC0xOGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNCAxLjc5MSA0IDQgNCA0LTEuNzkxIDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')]">
          </div>
        </div>
        <div className="container-custom relative z-10 flex justify-center">
          <div className="max-w-3xl text-center text-white animate-fade-in">
            <h1 className="text-5xl font-bold mb-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-gradient-to-r from-blue-900/70 to-indigo-900/70 p-6 rounded-lg backdrop-blur-sm">
              Transformando o Futuro com Inteligência Artificial
            </h1>
            <p className="text-xl mb-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-gradient-to-r from-blue-900/70 to-indigo-900/70 p-6 rounded-lg backdrop-blur-sm">
              Soluções inovadoras em IA para impulsionar sua empresa rumo ao futuro.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                Comece Agora
                <ArrowRightIcon className="ml-2 w-5 h-5 inline-block" />
              </Link>
              <Link href="/services" className="btn-secondary">
                Nossos Serviços
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gemma Chatbot Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Conheça a Gemma: Nossa Assistente Virtual
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Experimente nossa assistente virtual especializada em soluções de IA. Ela está pronta para responder suas dúvidas sobre nossos serviços, projetos e como a Inteligência Artificial pode transformar seu negócio.
              </p>
              <div className="flex items-center mb-8">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Respostas Inteligentes</h3>
                  <p className="text-gray-600">Treinada com dados específicos sobre nossos serviços</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <CpuChipIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tecnologia Avançada</h3>
                  <p className="text-gray-600">Baseada em modelos de linguagem de última geração</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center border-b pb-4 mb-4">
                <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 bg-primary/20">
                  <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-lg">G</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gemma</h3>
                  <p className="text-sm text-gray-500">Assistente Virtual AInovar</p>
                </div>
              </div>
              <ChatInterface />
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">
            Nossos Serviços
          </h2>
          <p className="section-description text-center">
            Oferecemos soluções completas em IA para atender às necessidades da sua empresa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Consultoria em IA',
                description: 'Assessoria especializada para implementação de soluções de IA.',
                icon: '🤖',
                link: '/services/ai-consulting'
              },
              {
                title: 'Desenvolvimento',
                description: 'Desenvolvimento de soluções personalizadas com IA.',
                icon: '💻',
                link: '/services/custom-development'
              },
              {
                title: 'Treinamento',
                description: 'Capacitação da sua equipe em IA e tecnologia.',
                icon: '📚',
                link: '/services/training'
              }
            ].map((service, index) => (
              <div key={index} className="card group">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {service.description}
                </p>
                <Link
                  href={service.link}
                  className="text-primary font-medium inline-flex items-center group-hover:translate-x-1 transition-transform"
                >
                  Saiba mais
                  <ArrowRightIcon className="ml-1 w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Projects */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="section-title text-center">
            Projetos Recentes
          </h2>
          <p className="section-description text-center">
            Conheça alguns dos nossos projetos mais recentes em IA e tecnologia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AInovar Platform',
                description: 'Plataforma completa de IA para empresas.',
                icon: '🚀',
                color: 'bg-blue-500',
                tags: ['IA', 'Plataforma', 'Inovação']
              },
              {
                title: 'Chatbot IA',
                description: 'Chatbot inteligente com processamento de linguagem natural.',
                icon: '💬',
                color: 'bg-purple-500',
                tags: ['Chatbot', 'NLP', 'IA']
              },
              {
                title: 'Análise de Dados',
                description: 'Sistema de análise de dados com machine learning.',
                icon: '📊',
                color: 'bg-green-500',
                tags: ['Machine Learning', 'Análise', 'IA']
              }
            ].map((project, index) => (
              <div key={index} className="card group">
                <div className={`relative h-48 mb-6 rounded-lg overflow-hidden flex items-center justify-center ${project.color}`}>
                  <div className="text-6xl">{project.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para Transformar sua Empresa?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Entre em contato conosco para discutir como podemos ajudar sua empresa com soluções em IA.
          </p>
          <Link href="/contact" className="btn-secondary">
            Fale Conosco
            <ArrowRightIcon className="ml-2 w-5 h-5 inline-block" />
          </Link>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    title: 'Chatbot Inteligente',
    description: 'Chatbots personalizados treinados com dados específicos da sua empresa para atendimento automatizado e eficiente.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    title: 'Análise de Dados',
    description: 'Transforme grandes volumes de dados em insights valiosos para tomadas de decisão mais inteligentes.',
    icon: PresentationChartLineIcon,
  },
  {
    title: 'Automação de Processos',
    description: 'Otimize fluxos de trabalho e reduza custos operacionais através da automação inteligente de processos.',
    icon: CpuChipIcon,
  },
  {
    title: 'Consultoria em IA',
    description: 'Assessoria especializada para implementação estratégica de soluções de Inteligência Artificial.',
    icon: LightBulbIcon,
  },
  {
    title: 'Integração de Sistemas',
    description: 'Integre soluções de IA com seus sistemas existentes para maximizar o valor dos seus dados.',
    icon: ServerIcon,
  },
  {
    title: 'Desenvolvimento Personalizado',
    description: 'Desenvolvimento de soluções sob medida para os desafios específicos do seu negócio.',
    icon: WrenchScrewdriverIcon,
  },
  {
    title: 'Documentação Inteligente',
    description: 'Sistemas de processamento e análise de documentos com reconhecimento de padrões e extração de dados.',
    icon: DocumentTextIcon,
  },
]