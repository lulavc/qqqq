import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const technologies = [
  'Machine Learning',
  'Deep Learning',
  'Processamento de Linguagem Natural',
  'Visão Computacional',
  'Chatbots Inteligentes',
  'Análise Preditiva'
]

const process = [
  {
    title: 'Análise de Requisitos',
    description: 'Entendimento profundo das necessidades e objetivos do projeto.'
  },
  {
    title: 'Arquitetura e Design',
    description: 'Desenvolvimento da arquitetura técnica e design da solução.'
  },
  {
    title: 'Desenvolvimento',
    description: 'Implementação da solução com as melhores práticas e tecnologias.'
  },
  {
    title: 'Testes e Validação',
    description: 'Testes rigorosos e validação da solução desenvolvida.'
  },
  {
    title: 'Deploy e Monitoramento',
    description: 'Implementação em produção e monitoramento contínuo.'
  }
]

export default function CustomDevelopmentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="section-title">
            Desenvolvimento Personalizado
          </h1>
          <p className="section-description">
            Desenvolvo soluções personalizadas que atendem às necessidades específicas 
            da sua empresa, utilizando as mais recentes tecnologias de IA.
          </p>

          <div className="card mb-8">
            <h2 className="card-title">
              Tecnologias Utilizadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technologies.map((tech, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-primary mr-2" />
                  <span className="text-gray-700">{tech}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="card-title">
              Processo de Desenvolvimento
            </h2>
            <div className="space-y-6">
              {process.map((step, index) => (
                <div key={index}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">
              Por que escolher desenvolvimento personalizado?
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircleIcon className="w-6 h-6 text-primary mt-1 mr-3" />
                <span className="text-gray-700">
                  Soluções adaptadas às necessidades específicas da sua empresa
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="w-6 h-6 text-primary mt-1 mr-3" />
                <span className="text-gray-700">
                  Integração perfeita com sistemas existentes
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="w-6 h-6 text-primary mt-1 mr-3" />
                <span className="text-gray-700">
                  Escalabilidade e flexibilidade para crescimento futuro
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="w-6 h-6 text-primary mt-1 mr-3" />
                <span className="text-gray-700">
                  Suporte contínuo e manutenção dedicada
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/contact"
              className="btn-primary"
            >
              Inicie seu Projeto
              <ArrowRightIcon className="ml-2 w-5 h-5 inline-block" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 