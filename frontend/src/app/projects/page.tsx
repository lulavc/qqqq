import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

const projects = [
  {
    id: 'ainovar-platform',
    title: 'AInovar Platform',
    description: 'Plataforma completa de IA para empresas, integrando múltiplos serviços de inteligência artificial em uma única solução.',
    image: '/images/projects/ainovar.jpg',
    tags: ['IA', 'Plataforma', 'Inovação'],
    client: 'AInovar',
    year: '2024',
    features: [
      'Integração com múltiplos modelos de IA',
      'Dashboard personalizado',
      'Análise em tempo real',
      'Processamento de linguagem natural',
      'Automação de processos'
    ]
  },
  {
    id: 'chatbot-ia',
    title: 'Chatbot IA para E-commerce',
    description: 'Sistema de chatbot inteligente especializado em apresentar produtos e preços, oferecendo uma experiência personalizada de compra através de conversas naturais.',
    image: '/images/projects/chatbot-ia.jpg',
    tags: ['Chatbot', 'E-commerce', 'IA'],
    client: 'E-commerce Brasil',
    year: '2023',
    features: [
      'Consulta de produtos e preços em tempo real',
      'Recomendações personalizadas de produtos',
      'Comparação de preços e características',
      'Integração com sistema de estoque',
      'Atualização automática de promoções'
    ]
  },
  {
    id: 'analise-dados',
    title: 'Análise de Dados',
    description: 'Sistema de análise de dados com machine learning para previsão de demanda e otimização de estoque.',
    image: '/images/projects/analise-dados.jpg',
    tags: ['Machine Learning', 'Análise', 'IA'],
    client: 'Varejo Tech',
    year: '2023',
    features: [
      'Previsão de demanda',
      'Otimização de estoque',
      'Análise preditiva',
      'Visualização de dados',
      'Relatórios automatizados'
    ]
  },
  {
    id: 'visao-computacional',
    title: 'Sistema de Visão Computacional',
    description: 'Sistema de visão computacional para controle de qualidade em linha de produção industrial.',
    image: '/images/projects/visao-computacional.jpg',
    tags: ['Visão Computacional', 'IA', 'Indústria'],
    client: 'Indústria 4.0',
    year: '2023',
    features: [
      'Detecção de defeitos em tempo real',
      'Análise de qualidade',
      'Processamento de imagem',
      'Alertas automáticos',
      'Integração com sistema ERP'
    ]
  }
]

export default function ProjectsPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nossos Projetos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça alguns dos projetos que desenvolvemos, demonstrando nossa expertise em soluções de Inteligência Artificial.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-12">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } lg:flex`}
            >
              <div className="lg:w-1/2">
                <div className="relative h-80 lg:h-full">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="lg:w-1/2 p-8 lg:p-12">
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {project.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>{project.client}</span>
                  <span>•</span>
                  <span>{project.year}</span>
                </div>
                <p className="text-gray-600 mb-6">
                  {project.description}
                </p>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Principais Funcionalidades:
                </h3>
                <ul className="space-y-2 mb-8">
                  {project.features.map((feature, index) => (
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
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/contact?project=${project.id}`}
                  className="btn-primary inline-flex items-center"
                >
                  Solicitar um Projeto Similar
                  <ArrowRightIcon className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pronto para Começar seu Projeto?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Entre em contato conosco para discutir como podemos ajudar sua empresa com soluções em IA.
          </p>
          <Link href="/contact" className="btn-primary">
            Fale Conosco
            <ArrowRightIcon className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
} 