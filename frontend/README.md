# Ainovar Frontend

Este é o frontend do site da Ainovar, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## Tecnologias Utilizadas

- [Next.js](https://nextjs.org/) - Framework React para produção
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript com tipagem estática
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário
- [ESLint](https://eslint.org/) - Linter para JavaScript/TypeScript
- [Prettier](https://prettier.io/) - Formatador de código
- [@tailwindcss/forms](https://github.com/tailwindlabs/tailwindcss-forms) - Plugin para estilização de formulários

## Pré-requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/ainovar.git
cd ainovar/frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Copie o arquivo de variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Configure as variáveis de ambiente no arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O servidor estará disponível em [http://localhost:3000](http://localhost:3000).

## Funcionalidades do Chatbot

O chatbot da AInovar possui várias funcionalidades avançadas:

### Experiência do Usuário
- **Processamento de caracteres Unicode**: Corrige automaticamente caracteres especiais do português (\u00e7, etc.)
- **Sistema de rolagem inteligente**: Detecta quando o usuário está lendo mensagens anteriores e pausa a rolagem automática
- **Botão de rolar para o final**: Permite ao usuário voltar rapidamente para a mensagem mais recente
- **Rolagem localizada**: Garante que apenas o container do chat role, não a página inteira

### Inteligência do Chatbot
- **Detecção de intenções**: Identifica cumprimentos, despedidas, feedback, reclamações, e agradecimentos
- **Análise de sentimento**: Reconhece mensagens positivas, negativas e neutras, inclusive com negações em português
- **Respostas especializadas**: Fornece informações detalhadas sobre os chatbots da AInovar quando solicitado

### Arquitetura
- **Módulo de utilidades de texto**: Funções centralizadas para tratamento de texto e caracteres especiais
- **Processamento de eventos do servidor (SSE)**: Permite respostas em streaming para melhor experiência do usuário
- **WebSocket**: Fornece comunicação em tempo real com o backend

Para mais informações sobre como utilizar ou estender o chatbot, consulte a [documentação interna](./docs/chatbot.md).

## Build

Para criar uma build de produção:

```bash
npm run build
```

Para iniciar o servidor de produção:

```bash
npm start
```

## Linting e Formatação

Para executar o linter:

```bash
npm run lint
```

Para formatar o código:

```bash
npm run format
```

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                 # Páginas e rotas da aplicação
│   ├── components/          # Componentes reutilizáveis
│   ├── services/           # Serviços e APIs
│   └── styles/             # Estilos globais
├── public/                 # Arquivos estáticos
└── ...configurações        # Arquivos de configuração
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes. 