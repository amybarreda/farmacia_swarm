# Etapa 1: instalar imagen liviana
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
# En npm moderno
RUN npm ci --omit=dev

# Etapa 2: runtime mínima
FROM node:18-alpine
WORKDIR /app

# Copiamos solo lo necesario
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Buenas prácticas de seguridad: usuario no-root
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp
USER nodeusr

# Config de puerto (ajusta si tu servicio usa otro)
ENV PORT=3003 \
    NODE_ENV=production

# Variables típicas de DB (las puedes sobreescribir en docker-compose)
ENV DB_HOST=db \
    DB_USER=root \
    DB_NAME=inventario \
    DB_PORT=3306

# Opcional: healthcheck (útil en Swarm/K8s)
# Si tienes endpoint /health:
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
#   CMD wget -qO- http://localhost:${PORT}/health || exit 1

EXPOSE 3003
CMD ["npm", "start"]
