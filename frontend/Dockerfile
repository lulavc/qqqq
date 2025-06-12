# Estágio de compilação
FROM node:18-alpine as builder
WORKDIR /app

# Instalar dependências
COPY package.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV production

# Copiar arquivos necessários
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expor porta
EXPOSE 3000

# Iniciar aplicação
CMD ["npm", "start"] 