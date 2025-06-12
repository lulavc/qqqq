# Estágio de compilação
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar arquivos de configuração
COPY package.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Estágio de produção - imagem final reduzida
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copiar dependências e arquivos
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js

# Configurar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser
RUN chown -R apiuser:nodejs /app
USER apiuser

# Porta que a API usará
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["npm", "run", "dev"] 