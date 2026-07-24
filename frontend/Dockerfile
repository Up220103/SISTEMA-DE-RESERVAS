# =============================================================================
#  Frontend · React + Vite -> nginx
#  Vite resuelve VITE_API_URL en TIEMPO DE BUILD, no de runtime: por eso entra
#  como ARG. Si cambia la URL del API hay que reconstruir la imagen; reiniciar
#  el contenedor no basta.
# =============================================================================

# ---- Etapa 1: build ---------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Etapa 2: servidor estatico --------------------------------------------
FROM nginx:1.27-alpine

# Config SPA (try_files -> index.html) para que react-router no de 404.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
