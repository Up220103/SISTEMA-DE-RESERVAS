#!/bin/bash
# =============================================================================
#  Arranque del contenedor "todo en uno": MySQL + backend Node + nginx.
#  Orden: inicializa/arranca MySQL -> siembra el esquema -> backend -> nginx.
#  nginx queda en primer plano (PID principal): si se cae, el contenedor muere
#  y App Service lo reinicia.
# =============================================================================
set -e

DATADIR=/var/lib/mysql
MYSQLD=/usr/sbin/mysqld

mkdir -p /var/run/mysqld
chown -R mysql:mysql /var/run/mysqld "$DATADIR"

# ¿Primera vez? La carpeta de datos se vacía en el Dockerfile, así que si no
# existe la subcarpeta `mysql` toca inicializar y sembrar.
FRESH=0
if [ ! -d "$DATADIR/mysql" ]; then
  echo "[init] Inicializando MySQL por primera vez..."
  "$MYSQLD" --initialize-insecure --user=mysql --datadir="$DATADIR"
  FRESH=1
fi

echo "[init] Arrancando MySQL..."
"$MYSQLD" --user=mysql --datadir="$DATADIR" \
  --bind-address=127.0.0.1 \
  --skip-character-set-client-handshake \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci &

echo "[init] Esperando a que MySQL responda..."
for i in $(seq 1 60); do
  if mysqladmin ping --silent 2>/dev/null; then break; fi
  sleep 1
done

if [ "$FRESH" = "1" ]; then
  echo "[init] Creando usuario de la app y cargando el esquema..."
  # root@localhost entra por socket sin contraseña (recién inicializado).
  # El backend se conecta por TCP (127.0.0.1), así que creamos ese usuario.
  mysql --protocol=socket -uroot <<'SQL'
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL
  mysql --protocol=socket -uroot -proot < /seed/sistema_reservas_upa.sql
  echo "[init] Esquema cargado (BD reservas_upa lista)."
else
  echo "[init] MySQL ya tenía datos: no se vuelve a sembrar."
fi

echo "[init] Arrancando backend Node..."
cd /app/backend
node src/server.js &

echo "[init] Arrancando nginx en primer plano..."
exec nginx -g 'daemon off;'
