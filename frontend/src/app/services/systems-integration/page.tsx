import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const integrationTypes = [
  {
    title: 'Integração com APIs',
    description: 'Conexão segura e eficiente com APIs externas e serviços em nuvem.'
  },
  {
    title: 'Integração com ERPs',
    description: 'Integração com sistemas ERP existentes para automação de processos.'
  },
  {
    title: 'Integração com CRMs',
    description: 'Conexão com sistemas CRM para melhor gestão de relacionamento com clientes.'
  },
  {
    title: 'Integração com Bases de Dados',
    description: 'Integração com diferentes tipos de bancos de dados e sistemas de armazenamento.'
  }
]

const benefits = [
  'Automação de processos manuais',
  'Redução de erros e duplicação de dados',
  'Melhor visibilidade dos dados',
  'Aumento da produtividade',
  'Economia de recursos',
  'Experiência do usuário aprimorada'
]

export default function SystemsIntegrationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="section-title">
            Integração de Sistemas
          </h1>
          <p className="section-description">
            Integro diferentes sistemas e tecnologias para criar soluções unificadas 
            e eficientes para sua empresa.
          </p>

          <div className="card mb-8">
            <h2 className="card-title">
              Tipos de Integração
            </h2>
            <div className="space-y-6">
              {integrationTypes.map((type, index) => (
                <div key={index}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {type.title}
                  </h3>
                  <p className="text-gray-600">
                    {type.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="card-title">
              Benefícios da Integração
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-primary mt-1 mr-3" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="card-title">
              Processo de Integração
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">1. Análise de Sistemas</h3>
                <p className="text-gray-600">
                  Avaliação detalhada dos sistemas a serem integrados e suas interfaces.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2. Planejamento</h3>
                <p className="text-gray-600">
                  Desenvolvimento de um plano de integração com etapas e prazos definidos.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">3. Desenvolvimento</h3>
                <p className="text-gray-600">
                  Implementação da integração com foco em segurança e performance.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">4. Testes</h3>
                <p className="text-gray-600">
                  Testes rigorosos para garantir o funcionamento correto da integração.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">5. Deploy e Monitoramento</h3>
                <p className="text-gray-600">
                  Implementação em produção e monitoramento contínuo do funcionamento.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/contact"
              className="btn-primary"
            >
              Fale sobre sua Integração
              <ArrowRightIcon className="ml-2 w-5 h-5 inline-block" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 