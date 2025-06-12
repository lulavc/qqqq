import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const trainingTypes = [
  {
    title: 'Workshops de IA',
    description: 'Workshops práticos sobre conceitos fundamentais e aplicações de IA.',
    duration: '4-8 horas',
    level: 'Iniciante a Intermediário'
  },
  {
    title: 'Treinamento em Machine Learning',
    description: 'Curso completo sobre machine learning, desde conceitos básicos até implementações avançadas.',
    duration: '20-40 horas',
    level: 'Intermediário a Avançado'
  },
  {
    title: 'Treinamento em Deep Learning',
    description: 'Curso especializado em deep learning e redes neurais.',
    duration: '30-50 horas',
    level: 'Avançado'
  },
  {
    title: 'Treinamento em NLP',
    description: 'Curso focado em processamento de linguagem natural e chatbots.',
    duration: '20-30 horas',
    level: 'Intermediário a Avançado'
  }
]

const benefits = [
  'Conteúdo personalizado para sua equipe',
  'Exercícios práticos e hands-on',
  'Material didático completo',
  'Suporte durante e após o treinamento',
  'Certificado de conclusão',
  'Flexibilidade de horários e local'
]

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="section-title">
            Treinamento e Workshops
          </h1>
          <p className="section-description">
            Ofereço treinamentos especializados em IA e tecnologia para capacitar 
            sua equipe e impulsionar a inovação em sua empresa.
          </p>

          <div className="card mb-8">
            <h2 className="card-title">
              Tipos de Treinamento
            </h2>
            <div className="space-y-6">
              {trainingTypes.map((type, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {type.title}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {type.description}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Duração: {type.duration}</span>
                    <span>Nível: {type.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="card-title">
              Benefícios dos Treinamentos
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
              Metodologia
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">1. Avaliação Inicial</h3>
                <p className="text-gray-600">
                  Análise do nível de conhecimento e necessidades específicas da equipe.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2. Planejamento</h3>
                <p className="text-gray-600">
                  Desenvolvimento de um plano de treinamento personalizado.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">3. Execução</h3>
                <p className="text-gray-600">
                  Treinamento interativo com foco em prática e aplicação real.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">4. Avaliação</h3>
                <p className="text-gray-600">
                  Avaliação do aprendizado e feedback para melhorias contínuas.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/contact"
              className="btn-primary"
            >
              Agende um Treinamento
              <ArrowRightIcon className="ml-2 w-5 h-5 inline-block" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 