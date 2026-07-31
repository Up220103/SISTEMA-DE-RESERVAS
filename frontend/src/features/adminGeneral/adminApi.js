// Cliente del panel de Administrador General. Usa el axios compartido
// (services/api.js), que ya adjunta el token JWT en cada peticion.
import api from '../../services/api.js'

// Usuarios
export const getUsuarios = () => api.get('/admin-general/usuarios').then((r) => r.data.usuarios)
export const getReservasUsuario = (id) =>
  api.get(`/admin-general/usuarios/${id}/reservas`).then((r) => r.data.reservas)
// Devuelven { usuario, reservasCanceladas }: al desactivar una cuenta o quitarle
// permiso sobre un tipo de espacio, el backend cancela sus reservas futuras para
// liberar esos horarios. El panel avisa de cuantas cayeron.
export const setEstadoUsuario = (id, estado) =>
  api.patch(`/admin-general/usuarios/${id}/estado`, { estado }).then((r) => r.data)
export const setRolUsuario = (id, rol_id) =>
  api.patch(`/admin-general/usuarios/${id}/rol`, { rol_id }).then((r) => r.data)
export const getRoles = () => api.get('/admin-general/roles').then((r) => r.data.roles)
// Edita los datos de contacto de cualquier cuenta. El correo no se toca (de el
// dependen el rol y la matricula) y el nombre de las cuentas institucionales
// (Biblioteca / Admin General) lo conserva el backend aunque se envie otro.
export const editarUsuario = (id, datos) =>
  api.patch(`/admin-general/usuarios/${id}`, datos).then((r) => r.data.usuario)
// Restablece la contrasena de un usuario que no puede entrar.
export const restablecerPasswordUsuario = (id, nueva) =>
  api.post(`/admin-general/usuarios/${id}/password`, { nueva }).then((r) => r.data)
// Bandeja de solicitudes de "olvide mi contrasena" pendientes.
export const getSolicitudesPassword = () =>
  api.get('/admin-general/solicitudes-password').then((r) => r.data.solicitudes)

// Espacios / edificios
export const getEdificios = () => api.get('/admin-general/edificios').then((r) => r.data.edificios)
export const getTipos = () => api.get('/admin-general/tipos-espacio').then((r) => r.data.tipos)
export const getEspacios = () => api.get('/admin-general/espacios').then((r) => r.data.espacios)
export const crearEspacio = (data) => api.post('/admin-general/espacios', data).then((r) => r.data.espacio)
export const editarEspacio = (id, data) =>
  api.patch(`/admin-general/espacios/${id}`, data).then((r) => r.data.espacio)
export const crearEdificio = (data) =>
  api.post('/admin-general/edificios', data).then((r) => r.data.edificio)

// Reportes / calendario / reservas
export const getReportes = (desde, hasta) =>
  api.get('/admin-general/reportes', { params: desde && hasta ? { desde, hasta } : {} }).then((r) => r.data)
export const getReservas = () => api.get('/admin-general/reservas').then((r) => r.data.reservas)
export const setReservaEstado = (id, estado, motivo) =>
  api.patch(`/admin-general/reservas/${id}/estado`, { estado, motivo }).then((r) => r.data.reserva)

// Cierre por ciclo escolar (desactiva reservas en el rango).
export const getCierre = () => api.get('/admin-general/cierre').then((r) => r.data.cierre)
export const setCierre = (inicio, fin) =>
  api.put('/admin-general/cierre', { inicio, fin }).then((r) => r.data.cierre)
export const quitarCierre = () => api.delete('/admin-general/cierre').then((r) => r.data.cierre)

// Extrae el mensaje de error del backend ({ message }) para mostrarlo en UI.
export const msgError = (err, fallback = 'Ocurrió un error') =>
  err?.response?.data?.message || fallback
