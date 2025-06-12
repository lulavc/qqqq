import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

const benefits = [
  'Análise completa da infraestrutura atual',
  'Identificação de oportunidades de automação',
  'Desenvolvimento de roadmap de implementação',
  'Avaliação de ROI e benefícios esperados',
  'Recomendações de tecnologias e ferramentas',
  'Plano de governança e ética em IA'
]

export default function AIConsultingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="section-title">
            Consultoria em Inteligência Artificial
          </h1>
          <p className="section-description">
            Ajudo empresas a implementar soluções de IA de forma estratégica e eficiente, 
            garantindo resultados tangíveis e sustentáveis.
          </p>

          <div className="card mb-8">
            <h2 className="card-title">
              Como posso ajudar sua empresa
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
              Processo de Consultoria
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">1. Diagnóstico Inicial</h3>
                <p className="text-gray-600">
                  Análise detalhada da situação atual da empresa, objetivos e desafios.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2. Planejamento Estratégico</h3>
                <p className="text-gray-600">
                  Desenvolvimento de um plano de ação personalizado com metas claras e prazos.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">3. Implementação</h3>
                <p className="text-gray-600">
                  Acompanhamento e suporte durante todo o processo de implementação.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">4. Avaliação e Ajustes</h3>
                <p className="text-gray-600">
                  Monitoramento contínuo dos resultados e ajustes conforme necessário.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/contact"
              className="btn-primary"
            >
              Agende uma Consulta
              <ArrowRightIcon className="ml-2 w-5 h-5 inline-block" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 