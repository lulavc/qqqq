# AInovar Tech

AInovar é uma plataforma web moderna especializada em consultoria de IA e soluções tecnológicas. Este repositório contém o código frontend e backend do site AInovar.

## Estrutura do Projeto

O projeto está organizado da seguinte forma:

- **frontend/** - Aplicação web Next.js
- **backend/** - Servidor API Node.js
- **api/** - Serviço de API para modelo de IA

## Funcionalidades

- 🌐 Interface web moderna e responsiva
- 💬 Chatbot de IA interativo
- 📝 Sistema de blog com gerenciamento de conteúdo
- 📋 Apresentação de serviços com informações detalhadas
- 📞 Formulário de contato com seleção de serviços
- 🔒 Painel administrativo para gerenciamento de conteúdo

## Tecnologias Utilizadas

### Frontend
- Next.js 13+ com App Router
- React 18
- TypeScript
- Tailwind CSS
- Heroicons

### Backend
- Node.js
- Express
- MongoDB
- Autenticação JWT

### Serviços de IA
- Integração com modelo de IA personalizado

## Como Começar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- MongoDB (local ou Atlas)

### Instalação

1. Clone o repositório
```bash
git clone https://github.com/lulavc/ainovar-tech.git
cd ainovar-tech
```

2. Instale as dependências do frontend
```bash
cd frontend
npm install
```

3. Instale as dependências do backend
```bash
cd ../backend
npm install
```

4. Configure as variáveis de ambiente
   - Copie `.env.example` para `.env` nos diretórios frontend e backend
   - Atualize as variáveis com sua configuração

5. Inicie os servidores de desenvolvimento

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
npm run dev
```

## Implantação

A aplicação pode ser implantada usando Docker:

```bash
docker-compose up -d
```

## Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

## Contato

Para consultas, entre em contato: luizvalois@ainovar.tech
