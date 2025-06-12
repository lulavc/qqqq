import Image from 'next/image'
import Link from 'next/link'
import {
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon,
  CpuChipIcon,
  LightBulbIcon,
  ServerIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

const services = [
  {
    id: 'ai-consulting',
    title: 'Consultoria em IA',
    description: 'Assessoria especializada para implementação de soluções de Inteligência Artificial em sua empresa.',
    icon: LightBulbIcon,
    features: [
      'Análise de viabilidade e ROI',
      'Mapeamento de processos',
      'Identificação de oportunidades',
      'Planejamento estratégico',
      'Gestão de projetos de IA'
    ],
    image: '/images/services/ai-consulting.jpg'
  },
  {
    id: 'custom-development',
    title: 'Desenvolvimento Personalizado',
    description: 'Desenvolvimento de soluções sob medida utilizando tecnologias de ponta em IA.',
    icon: CpuChipIcon,
    features: [
      'Machine Learning',
      'Deep Learning',
      'Processamento de Linguagem Natural',
      'Visão Computacional',
      'Sistemas de Recomendação'
    ],
    image: '/images/services/custom-development.jpg'
  },
  {
    id: 'chatbots',
    title: 'Chatbots Inteligentes',
    description: 'Automatize o atendimento ao cliente com chatbots alimentados por IA.',
    icon: ChatBubbleBottomCenterTextIcon,
    features: [
      'Atendimento 24/7',
      'Integração com WhatsApp e Telegram',
      'Análise de sentimentos',
      'Respostas personalizadas',
      'Dashboard de análise'
    ],
    image: '/images/services/chatbots.jpg'
  },
  {
    id: 'data-analytics',
    title: 'Análise de Dados',
    description: 'Transforme dados em insights acionáveis com nossa plataforma de análise avançada.',
    icon: ChartBarIcon,
    features: [
      'Big Data Analytics',
      'Previsão de demanda',
      'Segmentação de clientes',
      'Detecção de anomalias',
      'Visualização de dados'
    ],
    image: '/images/services/data-analytics.jpg'
  },
  {
    id: 'training',
    title: 'Treinamento e Capacitação',
    description: 'Capacite sua equipe com as mais recentes tecnologias e práticas em IA.',
    icon: UserGroupIcon,
    features: [
      'Workshops práticos',
      'Cursos personalizados',
      'Mentoria especializada',
      'Certificações',
      'Suporte contínuo'
    ],
    image: '/images/services/training.jpg'
  },
  {
    id: 'cloud-ai',
    title: 'IA na Nuvem',
    description: 'Soluções escaláveis de IA hospedadas na nuvem para maior flexibilidade e desempenho.',
    icon: ServerIcon,
    features: [
      'Infraestrutura escalável',
      'Alta disponibilidade',
      'Segurança avançada',
      'Integração contínua',
      'Monitoramento em tempo real'
    ],
    image: '/images/services/cloud-ai.jpg'
  }
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nossos Serviços
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Oferecemos uma gama completa de serviços em Inteligência Artificial para impulsionar a transformação digital da sua empresa.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-64">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <Icon className="w-8 h-8 text-primary mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {service.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-primary mr-2 mt-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/contact?service=${service.id}`}
                    className="btn-primary w-full text-center"
                  >
                    Solicitar Proposta
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Não encontrou o que procura?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Entre em contato conosco para discutir suas necessidades específicas. Desenvolvemos soluções personalizadas para cada cliente.
          </p>
          <Link href="/contact" className="btn-primary">
            Fale Conosco
          </Link>
        </div>
      </div>
    </div>
  )
} 