# Certificados TLS (CA privada)

Esta carpeta guarda los certificados para servir el sistema por HTTPS en la red
local, usando la **CA privada** (Windows Server / AD CS) de un tercero.

> ⚠️ Las llaves privadas (`*.key`) y los certificados emitidos (`*.crt`, `*.cer`,
> `*.pem`, `*.pfx`) **están ignorados por git**. Nunca los subas al repositorio.
> En git solo viven las plantillas (`.cnf`, `.inf`) y este instructivo.

## Nombres de servicio (DNS interno)

| Servicio | Nombre | Certificado |
|----------|--------|-------------|
| Frontend | `front.reservas.com` | `front.reservas.com.crt` + `.key` |
| Backend  | `back.reservas.com`  | `back.reservas.com.crt` + `.key` |
| Base de datos | `bd.reservas.com` | (opcional, ver más abajo) |
| CA raíz  | — | `ca-root.crt` (la comparte tu amigo) |

## ¿Se puede usar la CA de otra persona?

Sí. Una CA **privada** puede firmar certificados para **cualquier** nombre de
dominio (no valida propiedad como Let's Encrypt). Que tu DNS sea distinto al de
tu amigo no importa: la CA solo firma nombres; quién los resuelve es tu DNS.

El único requisito real: **cada equipo/navegador que acceda** debe **confiar en
el certificado raíz** de esa CA (ver paso 4).

---

## Paso 1 · Generar el CSR (petición de firma)

El CSR se genera **de tu lado** para que la **llave privada nunca salga** de tu
máquina. Dos caminos, elige uno:

### Opción A — OpenSSL (multiplataforma, funciona en Git Bash)

```bash
cd certs
# Backend
openssl req -new -newkey rsa:2048 -nodes \
  -keyout back.reservas.com.key \
  -out back.reservas.com.csr \
  -config back.reservas.com.cnf
# Frontend
openssl req -new -newkey rsa:2048 -nodes \
  -keyout front.reservas.com.key \
  -out front.reservas.com.csr \
  -config front.reservas.com.cnf
```

Quedan: `*.key` (guárdala, no la compartas) y `*.csr` (esto se lo envías a tu amigo).

### Opción B — certreq (Windows nativo)

```powershell
cd certs
certreq -new back.reservas.com.inf back.reservas.com.csr
```

La llave queda en el almacén del equipo; envías solo el `.csr`.

---

## Paso 2 · Tu amigo firma el CSR con su CA

Le pasas el archivo `.csr`. Del lado de la CA (Windows Server con AD CS):

```powershell
# Emite el certificado a partir del CSR (ajusta la plantilla si aplica)
certreq -submit -attrib "CertificateTemplate:WebServer" back.reservas.com.csr back.reservas.com.cer
```

O por la **inscripción web** de AD CS: `https://<servidor-ca>/certsrv` →
"Solicitar un certificado" → "solicitud avanzada" → pega el contenido del `.csr`
→ plantilla *Servidor web* → descarga el `.cer`.

Te devuelve **dos cosas**:
1. `back.reservas.com.cer` (y `front.reservas.com.cer`) — los certificados firmados.
2. `ca-root.crt` — el **certificado raíz** de su CA (Menú de la CA →
   "Descargar un certificado de CA"; o `certutil -ca.cert ca-root.crt`).

---

## Paso 3 · Colocar los archivos en esta carpeta

Convierte a PEM si hace falta (OpenSSL espera PEM; los `.cer` de Windows suelen
venir en DER):

```bash
openssl x509 -inform der -in back.reservas.com.cer -out back.reservas.com.crt
openssl x509 -inform der -in ca-root.cer          -out ca-root.crt
```

Estructura final esperada en `certs/` (la que espera el reverse proxy):

```
certs/
├── ca-root.crt                         (cadena de confianza de la CA)
├── back.reservas.com/
│   ├── privkey.key                     (privada, la que generaste tú)
│   └── fullchain.crt                   (firmado por la CA, + intermedio si aplica)
└── front.reservas.com/
    ├── privkey.key
    └── fullchain.crt
```

> Renombra los archivos a `privkey.key` y `fullchain.crt` dentro de la carpeta
> de cada subdominio. El reverse proxy (ver `proxy/README.md`) los lee de ahí.

---

## Paso 4 · Confiar en la CA raíz (en cada cliente)

Para que el navegador no muestre "no seguro", cada equipo que acceda debe tener
`ca-root.crt` en **Entidades de certificación raíz de confianza**:

- **Windows:** doble clic en `ca-root.crt` → Instalar → "Equipo local" →
  "Colocar todos los certificados en el siguiente almacén" → *Entidades de
  certificación raíz de confianza*.
- **Máquinas del dominio de tu amigo:** normalmente ya confían automáticamente.

---

## Paso 5 · Activar HTTPS en el backend

El backend arranca en HTTPS automáticamente si defines estas variables (en
`backend/.env`):

```env
# Rutas relativas a la carpeta backend/ (o usa rutas absolutas).
TLS_KEY=../certs/back.reservas.com.key
TLS_CERT=../certs/back.reservas.com.crt
TLS_CA=../certs/ca-root.crt
CORS_ORIGIN=https://front.reservas.com
```

Arranca con `npm start`. Verás: `API escuchando en https://localhost:4000`.
Sin esas variables, sigue en HTTP (comportamiento normal en desarrollo).

> **En Docker**: monta la carpeta como volumen y apunta las rutas dentro del
> contenedor, por ejemplo:
> ```bash
> docker run -d --name reservas-upa-backend \
>   -v "$(pwd)/certs:/app/certs:ro" \
>   -e TLS_KEY=/app/certs/back.reservas.com.key \
>   -e TLS_CERT=/app/certs/back.reservas.com.crt \
>   -e TLS_CA=/app/certs/ca-root.crt \
>   -e CORS_ORIGIN=https://front.reservas.com \
>   -p 4000:4000 sistema-reservas-backend:local
> ```

---

## Paso 6 · Frontend (front.reservas.com)

- **Desarrollo (Vite):** ver `frontend/vite.config.js` (bloque `server.https`
  comentado). Descoméntalo apuntando a los `.key`/`.crt` del frontend.
- **Producción (nginx del `frontend/Dockerfile`):** configura el `server { listen
  443 ssl; ssl_certificate ...; ssl_certificate_key ...; }` en `nginx.conf` y
  monta los certs en el contenedor.
- Recuerda: el frontend consume el backend por `VITE_API_URL=https://back.reservas.com/api`
  (se hornea en tiempo de build).

---

## bd.reservas.com (TLS para MySQL) — opcional

MySQL puede exigir TLS a los clientes. Es un paso avanzado; en resumen:

1. Genera un cert para `bd.reservas.com` (mismo procedimiento).
2. Configura el servidor MySQL con `ssl-ca`, `ssl-cert`, `ssl-key`.
3. En el backend, `backend/src/config/db.js` acepta `ssl` en el pool; añade
   `ssl: { ca: fs.readFileSync(process.env.DB_SSL_CA) }` cuando exista esa variable.

Para el alcance de la práctica, con **HTTPS en front y back** ya cumples el
requisito de "certificados SSL".
