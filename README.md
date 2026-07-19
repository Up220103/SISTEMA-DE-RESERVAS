# Sistema de Reservas

Monorepositorio con frontend React y backend Node/Express, contenedorizado y desplegado a Azure App Service for Containers vía Azure DevOps.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Redux Toolkit + Tailwind CSS |
| Backend | Node.js 20 + Express + mysql2 |
| Base de datos | MySQL 8 (local: contenedor · Azure: Database for MySQL Flexible Server) |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions → Azure Container Registry → App Service |

## Estructura

```
├── frontend/              React + Vite
│   ├── src/
│   │   ├── app/           store de Redux
│   │   ├── components/    componentes reutilizables
│   │   ├── features/      slices + vistas por dominio (auth, bookings)
│   │   ├── pages/         vistas de ruta
│   │   └── services/      cliente axios
│   ├── Dockerfile         build multi-stage → nginx
│   └── nginx.conf
├── backend/               Node + Express
│   └── src/
│       ├── config/        pool de MySQL
│       ├── controllers/   lógica de cada endpoint
│       ├── middlewares/   auth JWT, manejo de errores
│       ├── models/        queries SQL
│       ├── routes/        definición de rutas
│       └── app.js         punto de entrada
├── database/              scripts SQL (pendiente)
├── docker-compose.yml     entorno local
└── .github/workflows/
    └── deploy.yml         CI/CD
```

## Arranque local

```bash
cp .env.example .env      # rellena los valores
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend → http://localhost:4000
- Health check → http://localhost:4000/health

Sin Docker:

```bash
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | `development` o `production` |
| `DB_HOST` | Host de MySQL (`db` en compose, FQDN en Azure) |
| `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Conexión a MySQL |
| `DB_ROOT_PASSWORD` | Solo local, para el contenedor de MySQL |
| `BACKEND_PORT` | Puerto del API (default `4000`) |
| `JWT_SECRET` | Secreto para firmar los tokens |
| `CORS_ORIGIN` | Origen permitido para el frontend |
| `VITE_API_URL` | URL base del API que consume el frontend |

> `VITE_API_URL` se resuelve en **tiempo de build**, no de runtime. Si cambia, hay que reconstruir la imagen del frontend — reiniciar el contenedor no basta.

## API

Todas las rutas cuelgan de `/api`. Las marcadas con 🔒 requieren header `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio (fuera de `/api`) |
| `POST` | `/api/auth/register` | Crear usuario |
| `POST` | `/api/auth/login` | Obtener token JWT |
| `GET` | `/api/auth/me` 🔒 | Usuario autenticado |
| `GET` | `/api/bookings` 🔒 | Listar reservas del usuario |
| `POST` | `/api/bookings` 🔒 | Crear reserva |
| `DELETE` | `/api/bookings/:id` 🔒 | Eliminar reserva |

## Base de datos

El código espera dos tablas: `users` (`id`, `name`, `email`, `password`) y `bookings` (`id`, `user_id`, `title`, `start_date`, `end_date`, `status`). Los scripts de creación van en `database/`.

## Despliegue a Azure

El pipeline vive en `.github/workflows/deploy.yml` y tiene tres jobs:

| Job | Runner | Cuándo corre |
|-----|--------|--------------|
| `qa` | `[self-hosted, Windows, QA]` | PR hacia `develop` o `main`, **y** push a `main` |
| `build-and-push` | `ubuntu-latest` | Solo push a `main`, si `qa` pasó |
| `deploy` | `ubuntu-latest` | Solo push a `main`, si `build-and-push` pasó |

`qa` instala dependencias de ambos proyectos, valida sintaxis, corre el build del frontend y compila las imágenes con `docker compose build`. `build-and-push` publica en ACR con tag `${{ github.run_id }}` y `latest`. `deploy` aplica los app settings, despliega ambos contenedores por tag inmutable y valida `/health`.

> `qa` dispara también en push a `main` a propósito: en GitHub Actions un job con `needs:` se **salta** si su dependencia no corrió, así que si `qa` solo disparara en PR, el push a `main` dejaría `build-and-push` y `deploy` sin ejecutarse.

### Configuración previa

**Runner self-hosted** con las etiquetas `self-hosted`, `Windows` y `QA`, con Node.js 20 y Docker Desktop instalados y corriendo.

**GitHub Secrets** (Settings → Secrets and variables → Actions):

| Secret | Contenido |
|--------|-----------|
| `AZURE_CREDENTIALS` | JSON del service principal (ver abajo) |
| `DB_HOST` | FQDN del MySQL Flexible Server |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Conexión a la BD |
| `JWT_SECRET` | Secreto para firmar tokens |
| `CORS_ORIGIN` | URL pública del frontend |
| `VITE_API_URL` | URL pública del API (se hornea en el build) |

Para generar `AZURE_CREDENTIALS`:

```bash
az ad sp create-for-rbac \
  --name "sp-sistema-reservas" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-sistema-reservas \
  --sdk-auth
```

El JSON completo que imprime va tal cual en el secret.

**Environment `production`** en GitHub (Settings → Environments). Ahí puedes exigir aprobación manual antes del deploy.

**Recursos en Azure:** ACR, dos Web Apps for Containers (API y web) y un Azure Database for MySQL Flexible Server.

Los valores del bloque `env:` del workflow (`ACR_NAME`, `ACR_LOGIN_SERVER`, `RESOURCE_GROUP`, `BACKEND_WEBAPP`, `FRONTEND_WEBAPP`) son placeholders — ajústalos a los reales antes de la primera corrida.

### Flujo de trabajo

```bash
git checkout -b feature/mi-cambio
# ...cambios...
git commit -m "feat: mi cambio"
git push origin feature/mi-cambio
# PR contra develop o main → corre solo el job qa (runner local)
# merge a main            → corre qa + build-and-push + deploy
```

Para rollback, redeploy de la Web App apuntando al tag anterior (el `github.run_id` de la corrida buena):

```bash
az webapp config container set \
  --name sistema-reservas-api \
  --resource-group rg-sistema-reservas \
  --container-image-name acrsistemareservas.azurecr.io/sistema-reservas/backend:<RUN_ID>
```
