# =============================================================================
#  Imagen "TODO EN UNO": frontend (nginx) + backend (Node) + MySQL 8.
#  Una sola imagen que sirve tanto para probar en local como para Azure App
#  Service. La misma que se despliega es la que pruebas:
#
#    docker build -t reservas-app .
#    docker run -p 8080:80 reservas-app
#    -> app completa en http://localhost:8080
#
#  Los datos de MySQL viven dentro del contenedor (efímeros): en cada arranque
#  fresco se vuelve a cargar database/sistema_reservas_upa.sql con sus datos de
#  ejemplo. Ideal para demo; no usar para datos que deban persistir.
# =============================================================================

# ---- Etapa 1: build del frontend (Vite) ------------------------------------
FROM node:20-alpine AS frontend-build
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# El frontend habla con el API en el MISMO origen (nginx hace de proxy),
# por eso la URL es relativa: /api.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Etapa 2: dependencias de produccion del backend -----------------------
FROM node:20-alpine AS backend-deps
WORKDIR /be
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# ---- Etapa 3: imagen final (Ubuntu con MySQL + Node + nginx) ----------------
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg mysql-server nginx tzdata \
 && install -d /etc/apt/keyrings \
 && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
 && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends nodejs \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* \
 # La instalacion de mysql-server inicializa /var/lib/mysql; lo vaciamos para
 # que el entrypoint lo inicialice y siembre en el primer arranque.
 && rm -rf /var/lib/mysql && mkdir -p /var/lib/mysql && chown -R mysql:mysql /var/lib/mysql

# ---- Backend ----
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
COPY --from=backend-deps /be/node_modules ./node_modules
COPY backend/src ./src

# ---- Frontend estatico servido por nginx ----
COPY --from=frontend-build /fe/dist /var/www/html

# ---- Config de nginx, script de arranque y esquema SQL ----
COPY docker/nginx.combined.conf /etc/nginx/sites-available/default
COPY database/sistema_reservas_upa.sql /seed/sistema_reservas_upa.sql
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Valores por defecto. En Azure, JWT_SECRET se sobreescribe con un app setting.
# El backend habla con la BD del mismo contenedor por TCP (127.0.0.1).
ENV NODE_ENV=production \
    PORT=4000 \
    DB_HOST=127.0.0.1 \
    DB_PORT=3306 \
    DB_USER=root \
    DB_PASSWORD=root \
    DB_NAME=reservas_upa \
    DB_SSL=false \
    JWT_SECRET=cambia_este_secreto_en_produccion \
    JWT_EXPIRES_IN=8h \
    CORS_ORIGIN=*

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://localhost/health || exit 1

CMD ["/usr/local/bin/entrypoint.sh"]
