// Acceso a datos para el panel de Administrador General (BD reservas_upa).
// SOLO lee/escribe sobre tablas y columnas existentes; no altera el esquema.
import { query } from '../config/db.js'

// ---------------------------------------------------------------- USUARIOS ---

// Lista todos los usuarios con su rol y carrera (alumno) o departamento (docente).
export async function listUsuarios() {
  const [rows] = await query(
    `SELECT u.usuario_id, u.nombre, u.apellido, u.email, u.password_hash,
            u.estado, u.rol_id, u.telefono, r.nombre_rol,
            e.matricula, ca.nombre AS carrera,
            d.departamento, d.num_empleado
       FROM usuario u
       JOIN rol r        ON r.rol_id = u.rol_id
       LEFT JOIN estudiante e ON e.usuario_id = u.usuario_id
       LEFT JOIN carrera ca   ON ca.carrera_id = e.carrera_id
       LEFT JOIN docente d    ON d.usuario_id = u.usuario_id
      ORDER BY u.usuario_id`,
  )
  return rows
}

export async function findUsuario(usuarioId) {
  const [rows] = await query(
    `SELECT u.usuario_id, u.nombre, u.apellido, u.email, u.estado, u.rol_id,
            u.telefono, r.nombre_rol
       FROM usuario u JOIN rol r ON r.rol_id = u.rol_id
      WHERE u.usuario_id = ? LIMIT 1`,
    [usuarioId],
  )
  return rows[0] || null
}

// Ultimas reservas de un usuario (historial).
export async function listReservasUsuario(usuarioId, limit = 5) {
  const n = Math.max(1, Math.min(50, Number(limit) || 5))
  const [rows] = await query(
    `SELECT rv.reserva_id, rv.titulo, rv.fecha_reserva, rv.hora_inicio, rv.hora_fin,
            es.nombre AS espacio, ed.nombre AS edificio, est.nombre_estado AS estado
       FROM reserva rv
       JOIN espacio es       ON es.espacio_id = rv.espacio_id
       JOIN edificio ed      ON ed.edificio_id = es.edificio_id
       JOIN estado_reserva est ON est.estado_id = rv.estado_id
      WHERE rv.usuario_id = ?
      ORDER BY rv.fecha_reserva DESC, rv.hora_inicio DESC
      LIMIT ${n}`,
    [usuarioId],
  )
  return rows
}

export async function setUsuarioEstado(usuarioId, estado) {
  await query('UPDATE usuario SET estado = ? WHERE usuario_id = ?', [estado, usuarioId])
  return findUsuario(usuarioId)
}

// Actualiza los datos de contacto de un usuario (los edita el Admin General).
// El correo NO se toca: de el dependen el rol y la matricula que se muestra.
export async function updateUsuario(usuarioId, { nombre, apellido, telefono }) {
  await query(
    'UPDATE usuario SET nombre = ?, apellido = ?, telefono = ? WHERE usuario_id = ?',
    [nombre, apellido, telefono || null, usuarioId],
  )
  return findUsuario(usuarioId)
}

export async function setUsuarioRol(usuarioId, rolId) {
  await query('UPDATE usuario SET rol_id = ? WHERE usuario_id = ?', [rolId, usuarioId])
  return findUsuario(usuarioId)
}

export async function listRoles() {
  const [rows] = await query('SELECT rol_id, nombre_rol FROM rol ORDER BY rol_id')
  return rows
}

// ----------------------------------------------------- EDIFICIOS / ESPACIOS ---

export async function listEdificios() {
  const [rows] = await query(
    'SELECT edificio_id, nombre, codigo, ubicacion, descripcion FROM edificio ORDER BY edificio_id',
  )
  return rows
}

export async function listTiposEspacio() {
  const [rows] = await query(
    'SELECT tipo_id, nombre_tipo, capacidad_default FROM tipo_espacio ORDER BY tipo_id',
  )
  return rows
}

// Espacios con su tipo y edificio. Marca los de Biblioteca/Cubículo como bloqueados
// para el Admin General (esos los administra el Admin de Biblioteca).
export async function listEspacios() {
  const [rows] = await query(
    `SELECT es.espacio_id, es.nombre, es.capacidad, es.estado,
            es.tipo_id, t.nombre_tipo,
            es.edificio_id, ed.nombre AS edificio, ed.codigo AS edificio_codigo,
            (ed.nombre = 'Biblioteca' OR t.nombre_tipo = 'Cubículo') AS es_biblioteca
       FROM espacio es
       JOIN tipo_espacio t ON t.tipo_id = es.tipo_id
       JOIN edificio ed    ON ed.edificio_id = es.edificio_id
      ORDER BY ed.nombre, es.nombre`,
  )
  return rows
}

export async function findEspacio(espacioId) {
  const [rows] = await query(
    `SELECT es.espacio_id, es.nombre, es.capacidad, es.estado, es.tipo_id, es.edificio_id,
            t.nombre_tipo, ed.nombre AS edificio
       FROM espacio es
       JOIN tipo_espacio t ON t.tipo_id = es.tipo_id
       JOIN edificio ed    ON ed.edificio_id = es.edificio_id
      WHERE es.espacio_id = ? LIMIT 1`,
    [espacioId],
  )
  return rows[0] || null
}

export async function createEdificio({ nombre, codigo, ubicacion, descripcion }) {
  // `codigo` es NOT NULL + UNIQUE en la BD. El Admin General solo captura el nombre,
  // asi que si no viene codigo se genera uno automatico (irrelevante para el caso).
  const codigoFinal = codigo && String(codigo).trim() ? String(codigo).trim() : `ED-${Date.now().toString().slice(-8)}`
  const [r] = await query(
    'INSERT INTO edificio (nombre, codigo, ubicacion, descripcion) VALUES (?, ?, ?, ?)',
    [nombre, codigoFinal, ubicacion || null, descripcion || null],
  )
  return r.insertId
}

export async function createEspacio({ tipo_id, edificio_id, nombre, capacidad, estado }) {
  const [r] = await query(
    'INSERT INTO espacio (tipo_id, edificio_id, nombre, capacidad, estado) VALUES (?, ?, ?, ?, ?)',
    [tipo_id, edificio_id, nombre, capacidad, estado || 'Disponible'],
  )
  return findEspacio(r.insertId)
}

export async function updateEspacio(espacioId, { nombre, capacidad, estado, tipo_id, edificio_id }) {
  await query(
    'UPDATE espacio SET nombre = ?, capacidad = ?, estado = ?, tipo_id = ?, edificio_id = ? WHERE espacio_id = ?',
    [nombre, capacidad, estado, tipo_id, edificio_id, espacioId],
  )
  return findEspacio(espacioId)
}

// --------------------------------------------------------------- REPORTES ---

// Reporte de reservas. Si se pasan `desde`/`hasta` (YYYY-MM-DD) filtra por semana;
// el filtro va en el ON del LEFT JOIN para que edificios/espacios sin reservas sigan apareciendo.
export async function reporteReservas(desde = null, hasta = null) {
  const rango = desde && hasta
  const cond = rango ? 'AND rv.fecha_reserva BETWEEN ? AND ?' : ''
  const p = rango ? [desde, hasta] : []

  const [porEdificio] = await query(
    `SELECT ed.edificio_id, ed.nombre AS edificio, COUNT(rv.reserva_id) AS total
       FROM edificio ed
       LEFT JOIN espacio es ON es.edificio_id = ed.edificio_id
       LEFT JOIN reserva rv ON rv.espacio_id = es.espacio_id ${cond}
      GROUP BY ed.edificio_id, ed.nombre
      ORDER BY total DESC, edificio`,
    p,
  )
  const [porEspacio] = await query(
    `SELECT es.espacio_id, es.nombre AS espacio, ed.nombre AS edificio,
            COUNT(rv.reserva_id) AS total
       FROM espacio es
       JOIN edificio ed ON ed.edificio_id = es.edificio_id
       LEFT JOIN reserva rv ON rv.espacio_id = es.espacio_id ${cond}
      GROUP BY es.espacio_id, es.nombre, ed.nombre
      ORDER BY total DESC, espacio`,
    p,
  )
  const [porEstado] = await query(
    `SELECT est.nombre_estado AS estado, COUNT(rv.reserva_id) AS total
       FROM estado_reserva est
       LEFT JOIN reserva rv ON rv.estado_id = est.estado_id ${cond}
      GROUP BY est.estado_id, est.nombre_estado
      ORDER BY est.estado_id`,
    p,
  )
  // Reservas por día (para la gráfica de tendencia). Solo salen los días con
  // reservas; el frontend rellena los días vacíos del rango con 0.
  const [porDia] = await query(
    `SELECT rv.fecha_reserva AS fecha, COUNT(*) AS total
       FROM reserva rv
      WHERE 1=1 ${cond}
      GROUP BY rv.fecha_reserva
      ORDER BY rv.fecha_reserva`,
    p,
  )
  // Reservas por tipo de espacio (Cubículo, Auditorio, Laboratorio, Sala...).
  const [porTipo] = await query(
    `SELECT te.tipo_id, te.nombre_tipo AS tipo, COUNT(rv.reserva_id) AS total
       FROM tipo_espacio te
       LEFT JOIN espacio es ON es.tipo_id = te.tipo_id
       LEFT JOIN reserva rv ON rv.espacio_id = es.espacio_id ${cond}
      GROUP BY te.tipo_id, te.nombre_tipo
      ORDER BY total DESC, tipo`,
    p,
  )
  return { porEdificio, porEspacio, porEstado, porDia, porTipo }
}

// Cambia el estado de una reserva (aprobar=2 Confirmada, rechazar/cancelar=4).
export async function setReservaEstado(reservaId, estadoId, motivo) {
  await query(
    'UPDATE reserva SET estado_id = ?, observaciones = COALESCE(?, observaciones) WHERE reserva_id = ?',
    [estadoId, motivo || null, reservaId],
  )
  const [rows] = await query('SELECT reserva_id, estado_id FROM reserva WHERE reserva_id = ?', [
    reservaId,
  ])
  return rows[0] || null
}

// Reservas (para el calendario del panel).
export async function listReservas() {
  const [rows] = await query(
    `SELECT rv.reserva_id, rv.titulo, rv.fecha_reserva, rv.hora_inicio, rv.hora_fin,
            es.nombre AS espacio, ed.nombre AS edificio, est.nombre_estado AS estado,
            u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
       FROM reserva rv
       JOIN espacio es       ON es.espacio_id = rv.espacio_id
       JOIN edificio ed      ON ed.edificio_id = es.edificio_id
       JOIN estado_reserva est ON est.estado_id = rv.estado_id
       JOIN usuario u        ON u.usuario_id = rv.usuario_id
      ORDER BY rv.fecha_reserva, rv.hora_inicio`,
  )
  return rows
}

// ------------------------------------------- CIERRE POR CICLO ESCOLAR ---
// Se implementa con la tabla `bloqueo_espacio` (el trigger de reserva ya
// rechaza reservas dentro de un bloqueo). Un cierre = una fila por espacio
// con este motivo, cubriendo el rango de fechas. Editar = reemplazar filas.
const MOTIVO_CIERRE = 'Cierre de ciclo escolar'

export async function getCierre() {
  const [rows] = await query(
    `SELECT DATE_FORMAT(MIN(fecha_inicio), '%Y-%m-%d') AS inicio,
            DATE_FORMAT(MAX(fecha_fin), '%Y-%m-%d')   AS fin,
            COUNT(*) AS n
       FROM bloqueo_espacio WHERE motivo = ?`,
    [MOTIVO_CIERRE],
  )
  const r = rows[0]
  if (!r || !r.n) return null
  return { inicio: r.inicio, fin: r.fin }
}

export async function setCierre(adminId, inicio, fin) {
  // Reemplaza el cierre anterior (solo el de ciclo escolar; no toca otros bloqueos).
  await borrarBloqueosDeCierre()
  const [espacios] = await query("SELECT espacio_id, estado FROM espacio")
  const fi = `${inicio} 00:00:00`
  const ff = `${fin} 23:59:59`
  for (const e of espacios) {
    await query(
      `INSERT INTO bloqueo_espacio (espacio_id, admin_id, fecha_inicio, fecha_fin, motivo)
       VALUES (?, ?, ?, ?, ?)`,
      [e.espacio_id, adminId, fi, ff, MOTIVO_CIERRE],
    )
  }

  // El trigger `trg_bloqueo_after_insert` acaba de dejar TODOS los espacios en
  // 'Bloqueado', pero un cierre solo cubre un rango de fechas: si los dejaramos
  // asi, un cierre programado para diciembre impediria reservar tambien mañana.
  // Se devuelve su estado a los que estaban 'Disponible'; el rango sigue
  // protegido por el propio bloqueo (regla 3 del trigger de reserva y el
  // calculo de horas ocupadas), que si mira las fechas.
  const disponibles = espacios.filter((e) => e.estado === 'Disponible').map((e) => e.espacio_id)
  if (disponibles.length) {
    const marcas = disponibles.map(() => '?').join(',')
    await query(
      `UPDATE espacio SET estado = 'Disponible' WHERE espacio_id IN (${marcas})`,
      disponibles,
    )
  }
  return getCierre()
}

// Quita las filas del cierre y REACTIVA los espacios que dejo bloqueados.
//
// Ojo: el trigger `trg_bloqueo_after_insert` pone el espacio en 'Bloqueado' al
// crear el bloqueo, pero no existe el trigger inverso al borrarlo. Si solo se
// borraran las filas, todos los espacios se quedarian en 'Bloqueado' para
// siempre y el sistema no aceptaria ni una reserva mas. Por eso se restauran
// aqui: solo los que este cierre bloqueo y que no tengan otro bloqueo vigente.
async function borrarBloqueosDeCierre() {
  await query(
    `UPDATE espacio e
        SET e.estado = 'Disponible'
      WHERE e.estado = 'Bloqueado'
        AND EXISTS (
          SELECT 1 FROM bloqueo_espacio b
           WHERE b.espacio_id = e.espacio_id AND b.motivo = ?
        )
        AND NOT EXISTS (
          SELECT 1 FROM bloqueo_espacio b2
           WHERE b2.espacio_id = e.espacio_id AND b2.motivo <> ?
             AND b2.fecha_fin >= NOW()
        )`,
    [MOTIVO_CIERRE, MOTIVO_CIERRE],
  )
  await query('DELETE FROM bloqueo_espacio WHERE motivo = ?', [MOTIVO_CIERRE])
}

export async function deleteCierre() {
  await borrarBloqueosDeCierre()
}
