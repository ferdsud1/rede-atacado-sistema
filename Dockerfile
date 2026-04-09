# Use Node.js LTS
FROM node:18-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Copie package.json e package-lock.json
COPY package*.json ./

# Instale dependências
RUN npm ci --only=production

# Copie o código fonte
COPY . .

# Compile TypeScript
RUN npm install -D typescript
RUN npm run build

# Exponha a porta
EXPOSE 3000

# Comando de início
CMD ["node", "dist/server.js"]
