# =============================================================================
#  Backend · Node 20 + Express
#  Imagen multi-stage: las dependencias se instalan aparte para que la capa
#  final no cargue con la cache de npm ni con las devDependencies.
# =============================================================================

# ---- Etapa 1: dependencias de produccion ------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Etapa 2: imagen final --------------------------------------------------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
# App Service inyecta PORT; este es el valor por defecto en local.
ENV PORT=4000

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src

EXPOSE 4000

# El usuario `node` ya existe en la imagen oficial: no corremos como root.
USER node

# Azure App Service y docker compose usan /health para saber si el contenedor vive.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "src/server.js"]
