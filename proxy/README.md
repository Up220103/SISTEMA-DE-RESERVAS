# Despliegue TLS con reverse proxy (nginx + CA privada)

Este montaje pone **HTTPS por fuera** con los certificados de la CA privada,
sin tocar el código: nginx termina el TLS y reenvía a los contenedores internos.

```
                 Internet/LAN (HTTPS)
                        │
              ┌─────────▼──────────┐
              │   proxy (nginx)    │  :80 → 301 :443
              │  termina el TLS    │  :443 con los certificados de la CA
              └───┬────────────┬───┘
   front.reservas.com      back.reservas.com
        │  (HTTP)                │  (HTTP)
   ┌────▼─────┐            ┌─────▼──────┐        ┌──────────┐
   │ frontend │            │  backend   │───────▶│    db     │
   │ nginx:80 │            │ node:4000  │        │ mysql:3306│
   └──────────┘            └────────────┘        └──────────┘
        (sin puertos al host: solo el proxy expone 80/443)
```

## Qué necesitas poner tú (solo los certificados)

Pide a tu amigo (la CA) un certificado por cada subdominio y colócalos así:

```
certs/
├── ca-root.crt                         ← certificado raíz de la CA
├── front.reservas.com/
│   ├── fullchain.crt                   ← certificado firmado (+ cadena)
│   └── privkey.key                     ← tu llave privada
├── back.reservas.com/
│   ├── fullchain.crt
│   └── privkey.key
└── bd.reservas.com/                    (opcional, solo si activas TLS de MySQL)
    ├── fullchain.crt
    └── privkey.key
```

- `privkey.key` = la llave que generaste tú con el CSR (nunca se comparte).
- `fullchain.crt` = el certificado que te devolvió la CA. Si la CA te da además
  un intermedio, concaténalos: primero el del servidor y luego el intermedio.
- Cómo generar los CSR y pedir la firma: ver [../certs/README.md](../certs/README.md).

## Paso 1 · DNS (ya lo tienes)

Tu DNS interno debe resolver a la IP de la máquina que corre el proxy:

```
front.reservas.com → 192.168.x.x
back.reservas.com  → 192.168.x.x
bd.reservas.com    → 192.168.x.x   (opcional)
```

## Paso 2 · Confiar en la CA raíz (cada cliente)

Instala `certs/ca-root.crt` en "Entidades de certificación raíz de confianza"
de cada equipo que vaya a entrar (detalle en [../certs/README.md](../certs/README.md)).

## Paso 3 · Levantar los servicios (individualmente)

Desde la raíz del repo. El orden respeta las dependencias:

```bash
docker compose -f docker-compose.proxy.yml up -d --build db
docker compose -f docker-compose.proxy.yml up -d --build backend
docker compose -f docker-compose.proxy.yml up -d --build frontend
docker compose -f docker-compose.proxy.yml up -d proxy
```

O todo de una:

```bash
docker compose -f docker-compose.proxy.yml up -d --build
```

## Paso 4 · Probar

```bash
# Con la CA raíz ya confiada, sin -k:
curl https://back.reservas.com/health
# Navegador:
#   https://front.reservas.com        → la app, con candado verde
#   https://back.reservas.com/health  → {"status":"ok",...}
```

## Comandos útiles

```bash
docker compose -f docker-compose.proxy.yml ps            # estado
docker compose -f docker-compose.proxy.yml logs -f proxy # logs del proxy
docker compose -f docker-compose.proxy.yml restart proxy # recargar tras cambiar certs
docker compose -f docker-compose.proxy.yml down          # detener todo
```

> Al **renovar/cambiar certificados**: reemplaza los archivos en `certs/…` y
> reinicia solo el proxy (`restart proxy`). No hay que reconstruir imágenes.

## Notas

- **CORS y URL del API ya están configurados** en `docker-compose.proxy.yml`:
  el backend permite el origen `https://front.reservas.com` y el frontend se
  compila con `VITE_API_URL=https://back.reservas.com/api`. Si cambias los
  nombres de dominio, ajústalos ahí (y reconstruye el frontend, porque la URL
  se hornea en el build).
- **El backend NO usa las variables `TLS_*`** en este montaje: el TLS lo pone
  el proxy. (Las `TLS_*` del backend son la alternativa para cuando NO hay
  proxy; no mezcles ambos.)
- **MySQL (bd.reservas.com)** es TCP, no HTTP. Está preparado como bloque
  `stream` comentado en `proxy/nginx.conf`; actívalo solo si necesitas exponer
  la BD por TLS y ya tienes su certificado.
