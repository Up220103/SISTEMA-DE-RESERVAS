# Sistema de Reservas UPA

Monorepositorio con frontend React y backend Node/Express, contenedorizado y desplegado a Azure App Service for Containers vía GitHub Actions.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Redux Toolkit + Tailwind CSS |
| Backend | Node.js 20 + Express + mysql2 |
| Base de datos | MySQL 8 (corre dentro del mismo contenedor en Azure) |
| Contenedores | Docker · imagen "todo en uno" para Azure · Compose para dev local |
| Pruebas | `node --test` + supertest (back) · Vitest + Testing Library (front) |
| CI/CD | GitHub Actions → Azure Container Registry → App Service |

## Estructura

```
├── frontend/              React + Vite
│   ├── src/
│   │   ├── app/           store de Redux
│   │   ├── components/    componentes reutilizables y layout
│   │   ├── features/      slices + vistas por dominio
│   │   ├── pages/         vistas de ruta
│   │   ├── services/      cliente axios
│   │   └── test/          setup de Vitest
│   ├── Dockerfile         build multi-stage → nginx
│   └── nginx.conf
├── backend/               Node + Express
│   ├── src/
│   │   ├── config/        pool de MySQL
│   │   ├── controllers/   lógica de cada endpoint
│   │   ├── middlewares/   auth JWT, manejo de errores
│   │   ├── models/        queries SQL
│   │   ├── routes/        definición de rutas
│   │   ├── app.js         la app de Express (sin listen: testeable)
│   │   └── server.js      punto de entrada del proceso
│   ├── tests/             pruebas del API
│   └── Dockerfile
├── database/
│   ├── sistema_reservas_upa.sql   esquema + datos + triggers
│   └── docker-compose.yml         solo la BD
├── infra/
│   └── azure-setup.ps1    crea la infraestructura en Azure (una sola vez)
├── docker-compose.yml     entorno local completo
└── .github/workflows/
    └── deploy.yml         CI/CD
```

## Arranque local

```bash
cp .env.example .env
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend → http://localhost:4000
- Health check → http://localhost:4000/health

La primera vez, el contenedor de MySQL ejecuta `database/sistema_reservas_upa.sql` y crea la BD `reservas_upa` con tablas, triggers y datos de ejemplo. Para volver a ejecutarlo hay que borrar el volumen:

```bash
docker compose down -v
```

Sin Docker (solo la BD en contenedor):

```bash
cd database && docker compose up -d
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Pruebas

```bash
cd backend  && npm test
cd frontend && npm test
```

**Backend** (36 pruebas, `node --test` + supertest): `/health`, manejo de 404, validaciones de login y registro, protección JWT de todas las rutas privadas (sin token, firma inválida, token expirado, esquema incorrecto) y las reglas de negocio de reservas (ventana 8:00–20:00, formato de fecha, fecha pasada, hora fin anterior a inicio). No requieren MySQL: todos los casos cortan antes de tocar la BD, por eso corren en CI sin levantar un servidor.

**Frontend** (24 pruebas, Vitest + Testing Library): reducers y thunks de `authSlice` y `reservaSlice`, y render del `Login` verificando que llama al backend y muestra los errores que este devuelve.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | `development` o `production` |
| `DB_HOST` | Host de MySQL (`db` en compose, FQDN en Azure) |
| `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Conexión a MySQL |
| `DB_SSL` | `true` en Azure (exige TLS), `false` en local |
| `DB_ROOT_PASSWORD` | Solo local, para el contenedor de MySQL |
| `BACKEND_PORT` | Puerto del API (default `4000`) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Firma y vigencia de los tokens |
| `CORS_ORIGIN` | Origen permitido para el frontend |
| `VITE_API_URL` | URL base del API que consume el frontend |

> `VITE_API_URL` se resuelve en **tiempo de build**, no de runtime. Si cambia, hay que reconstruir la imagen del frontend — reiniciar el contenedor no basta.

## API

Todas las rutas cuelgan de `/api`. Las marcadas con 🔒 requieren header `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio (fuera de `/api`) |
| `POST` | `/api/auth/register` | Auto-registro de alumnos (`up<matrícula>@alumnos.upa.edu.mx`) |
| `POST` | `/api/auth/login` | Devuelve `{ token, user }` |
| `GET` | `/api/auth/me` 🔒 | Usuario autenticado |
| `GET` | `/api/auth/perfil` 🔒 | Perfil completo |
| `PUT` | `/api/auth/perfil` 🔒 | Editar nombre, apellido y teléfono |
| `POST` | `/api/auth/cambiar-password` 🔒 | Cambiar contraseña |
| `GET` | `/api/catalogo/tipos` 🔒 | Tipos de espacio según el rol |
| `GET` | `/api/catalogo/espacios` 🔒 | Espacios de un tipo (`?tipo_id=`) |
| `GET` | `/api/reservas/mias` 🔒 | Reservas del usuario |
| `GET` | `/api/reservas/horas-ocupadas` 🔒 | Disponibilidad (`?fecha=` + `espacio_id` o `tipo_id`) |
| `POST` | `/api/reservas` 🔒 | Crear reserva (auto-asigna espacio si mandas `tipo_id`) |
| `GET` | `/api/notificaciones` 🔒 | Notificaciones del usuario |
| `POST` | `/api/notificaciones/leer` 🔒 | Marcar todas como leídas |

Los errores siempre responden `{ message }`, que es lo que lee el frontend en `err.response.data.message`.

## Base de datos

El esquema completo está en [`database/sistema_reservas_upa.sql`](database/sistema_reservas_upa.sql): 16 tablas, 2 pivote M:N, datos de ejemplo y triggers que validan las reglas de reserva (traslapes, bloqueos y permisos por rol). El backend traduce el `SQLSTATE 45000` de esos triggers a respuestas HTTP 409.

Roles (`rol_id`): 1 Estudiante · 2 Docente · 3 Admin Biblioteca · 4 Admin General.

## Imagen "todo en uno" (la que va a Azure)

Para Azure se usa **una sola imagen** que contiene frontend + backend + MySQL, definida en el [`Dockerfile`](Dockerfile) de la raíz. nginx sirve el frontend en el puerto 80 y hace de proxy de `/api` y `/health` hacia el backend Node; MySQL corre dentro del mismo contenedor y se siembra al arrancar con [`database/sistema_reservas_upa.sql`](database/sistema_reservas_upa.sql).

La **misma imagen** sirve para probar en local y para desplegar:

```bash
docker build -t reservas-app .
docker run -p 8080:80 reservas-app
# App completa en http://localhost:8080
```

> Los datos de MySQL viven dentro del contenedor y son **efímeros**: en cada arranque fresco se vuelve a cargar el `.sql` con sus datos de ejemplo. Es lo ideal para una demo; no lo uses para datos que deban persistir entre reinicios. Si más adelante necesitas persistencia, la alternativa es un Azure Database for MySQL Flexible Server (crear en la región **East US**, que sí está permitida en la suscripción de estudiante) y apuntar el backend ahí con `DB_HOST`/`DB_SSL=true`.

## Despliegue a Azure

Recursos que usa (ya creados en `rg-sistemadereserva`, región East US):

- **Azure Container Registry** `acrsistemareservasupa` — guarda la imagen.
- **App Service** `sistema-reservas-api-upa` — corre el contenedor todo-en-uno.

(El otro App Service `sistema-reservas-web-upa` ya no se necesita: todo va en uno.)

### Paso 1 — Service principal (la credencial de GitHub)

```bash
az ad sp create-for-rbac --name sp-sistema-reservas --role contributor --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-sistemadereserva --json-auth
```

El JSON completo que imprime va tal cual en el secret `AZURE_CREDENTIALS`.

### Paso 2 — GitHub Secrets

En Settings → Secrets and variables → Actions, solo hacen falta **dos**:

| Secret | Contenido |
|--------|-----------|
| `AZURE_CREDENTIALS` | El JSON del paso 1 |
| `JWT_SECRET` | Cualquier cadena larga y aleatoria (firma los tokens) |

> Ya no se necesitan `DB_HOST`, `DB_USER`, etc.: la BD vive dentro del contenedor.

También crea el **environment `production`** (Settings → Environments); ahí puedes exigir aprobación manual antes del deploy.

### Paso 3 — Verificar el bloque `env:` del workflow

Los valores de [`deploy.yml`](.github/workflows/deploy.yml) (`ACR_NAME`, `ACR_LOGIN_SERVER`, `RESOURCE_GROUP`, `WEBAPP`) deben coincidir con tus recursos reales. Ya vienen puestos con los nombres actuales.

### El pipeline

| Job | Runner | Cuándo corre |
|-----|--------|--------------|
| `qa` | `ubuntu-latest` | PR hacia `develop`/`main`, **y** push a esas ramas |
| `deploy` | `ubuntu-latest` | Solo push a `main`, si `qa` pasó |

`qa` instala dependencias, valida sintaxis, corre las pruebas de backend y frontend y compila el frontend. `deploy` construye la imagen combinada, la publica en ACR con tag `${{ github.run_id }}` y `latest`, la despliega **por tag inmutable** y hace smoke test contra `/health`; si no responde 200 en 4 minutos, el job falla.

> `qa` dispara también en push a `main` a propósito: un job con `needs:` se **salta** si su dependencia no corrió, así que si `qa` solo disparara en PR, el push a `main` dejaría `deploy` sin ejecutarse.

### Flujo de trabajo

```bash
git checkout -b feature/mi-cambio
git commit -m "feat: mi cambio"
git push origin feature/mi-cambio
# PR contra develop o main → corre solo qa
# merge a main            → corre qa + deploy
```

Para rollback, redeploy apuntando al tag anterior (el `run_id` de la corrida buena):

```bash
az webapp config container set --name sistema-reservas-api-upa --resource-group rg-sistemadereserva --container-image-name acrsistemareservasupa.azurecr.io/sistema-reservas/app:<RUN_ID>
```

## Costo estimado en Azure

Con la imagen todo-en-uno, con Azure for Students ($100 USD de crédito):

| Recurso | SKU | Aprox. USD/mes |
|---------|-----|----------------|
| Container Registry | Basic | ~5 |
| App Service Plan | B1 Linux | ~13 |
| **Total** | | **~18** |

No hay recurso de base de datos aparte (corre dentro del contenedor), así que no hay costo de MySQL. Para pausar el gasto: escalar el plan a F1 (gratis) cuando no lo uses.
