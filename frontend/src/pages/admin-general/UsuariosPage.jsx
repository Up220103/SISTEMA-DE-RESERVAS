import { useEffect, useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'
import {
  getUsuarios,
  getRoles,
  getReservasUsuario,
  setEstadoUsuario,
  setRolUsuario,
  msgError,
} from '../../features/adminGeneral/adminApi.js'

const esAlumno = (email) => /@alumnos\.upa\.edu(\.mx)?$/i.test(email || '')
// ID del usuario para mostrar: para alumnos es su matrícula tal cual aparece en
// el correo institucional (upXXXXXX); como se deriva del correo (que no se puede
// editar), el ID es inmutable. Para el resto se usa su identificador/num. empleado.
const idUsuario = (u) => {
  const m = /^(up\d+)@alumnos\.upa\.edu(\.mx)?$/i.exec(u.email || '')
  if (m) return m[1].toLowerCase()
  return u.identificador || u.matricula || `UP-${String(u.id).padStart(4, '0')}`
}
// Solo primer nombre + primer apellido.
const nombreCorto = (u) =>
  `${(u.nombre || '').trim().split(/\s+/)[0]} ${(u.apellido || '').trim().split(/\s+/)[0]}`.trim()
const iniciales = (u) =>
  `${(u.nombre || '')[0] || ''}${(u.apellido || '')[0] || ''}`.toUpperCase()

function Badge({ activo }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-widest ${
        activo ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${activo ? 'bg-green-500' : 'bg-orange-500'}`} />
      {activo ? 'ACTIVO' : 'INACTIVO'}
    </span>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {etiqueta}
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{valor || '—'}</p>
    </div>
  )
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [detalle, setDetalle] = useState(null) // { usuario, reservas }

  const cargar = async () => {
    try {
      setCargando(true)
      const [us, rs] = await Promise.all([getUsuarios(), getRoles()])
      setUsuarios(us)
      setRoles(rs)
      setError(null)
    } catch (err) {
      setError(msgError(err, 'No se pudieron cargar los usuarios'))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const notificar = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(null), 3000)
  }

  const toggleEstado = async (u) => {
    const nuevo = u.estado === 'Activo' ? 'Inactivo' : 'Activo'
    try {
      const actualizado = await setEstadoUsuario(u.id, nuevo)
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, estado: actualizado.estado } : x)))
      notificar(`${u.nombre}: reservas ${nuevo === 'Activo' ? 'habilitadas' : 'deshabilitadas'}.`)
    } catch (err) {
      setError(msgError(err, 'No se pudo cambiar el estado'))
    }
  }

  const cambiarRol = async (u, rol_id) => {
    try {
      const actualizado = await setRolUsuario(u.id, Number(rol_id))
      setUsuarios((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, rol: actualizado.rol, rol_id: actualizado.rol_id } : x)),
      )
      notificar(`Rol de ${u.nombre} actualizado a ${actualizado.rol}.`)
    } catch (err) {
      setError(msgError(err, 'No se pudo cambiar el rol'))
    }
  }

  const verMasDetalles = async (u) => {
    setDetalle({ usuario: u, reservas: null })
    try {
      const reservas = await getReservasUsuario(u.id)
      setDetalle({ usuario: u, reservas })
    } catch {
      setDetalle({ usuario: u, reservas: [] })
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="ADMIN GENERAL"
        title="Usuarios"
        subtitle="Consulta y administra las cuentas registradas: habilita o deshabilita reservas y asigna roles. Usa 'Más detalles' para ver la información completa."
      />

      {aviso && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {aviso}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-slate-400">Cargando usuarios…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3" />
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => verMasDetalles(u)}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-upa-blue transition hover:bg-upa-light"
                    >
                      Más detalles
                    </button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{nombreCorto(u)}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol_id}
                      disabled={esAlumno(u.email)}
                      onChange={(e) => cambiarRol(u, e.target.value)}
                      title={esAlumno(u.email) ? 'Los alumnos (@alumnos.upa.edu.mx) no cambian de rol' : ''}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-upa-blue disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {/* No se puede ASIGNAR Estudiante (rol 1): ese rol solo es automatico
                          al registrarse con @alumnos.upa.edu.mx. Se conserva si ya es el actual. */}
                      {roles
                        .filter((r) => r.rol_id !== 1 || r.rol_id === u.rol_id)
                        .map((r) => (
                          <option key={r.rol_id} value={r.rol_id}>
                            {r.nombre_rol}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge activo={u.estado === 'Activo'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => toggleEstado(u)}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold text-white transition ${
                          u.estado === 'Activo'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {u.estado === 'Activo' ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal "Más detalles" (solo lectura). */}
      {detalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetalle(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="flex items-start justify-between bg-upa-blue px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/15 text-sm font-bold">
                  {iniciales(detalle.usuario)}
                </span>
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/60">
                    Datos del usuario
                  </p>
                  <h2 className="text-xl font-bold">
                    {detalle.usuario.nombre} {detalle.usuario.apellido}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                      {detalle.usuario.rol}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${
                        detalle.usuario.estado === 'Activo' ? 'bg-green-400/20 text-green-100' : 'bg-orange-400/20 text-orange-100'
                      }`}
                    >
                      {detalle.usuario.estado}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDetalle(null)} className="text-white/80 hover:text-white">
                <Icon name="x" className="h-6 w-6" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Dato etiqueta="UP / Matrícula / ID" valor={idUsuario(detalle.usuario)} />
                <Dato etiqueta="Correo institucional" valor={detalle.usuario.email} />
                <Dato etiqueta="Tipo de usuario" valor={detalle.usuario.rol} />
                <Dato etiqueta="Estatus" valor={detalle.usuario.estado} />
                <Dato etiqueta="Nombre completo" valor={`${detalle.usuario.nombre} ${detalle.usuario.apellido}`} />
                <Dato etiqueta="Carrera / Depto." valor={detalle.usuario.carrera || detalle.usuario.departamento} />
                <Dato etiqueta="Teléfono" valor={detalle.usuario.telefono} />
              </div>

              {/* Contraseña: por seguridad no se puede ver ni cambiar. */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Contraseña
                </p>
                <p className="mt-1 font-mono text-sm text-slate-500">
                  •••••••• <span className="text-xs">(por seguridad no se puede mostrar la contraseña)</span>
                </p>
              </div>

              {/* Historial de reservas */}
              <div className="mt-5">
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Historial de reservas
                </p>
                {detalle.reservas === null ? (
                  <p className="text-sm text-slate-400">Cargando…</p>
                ) : detalle.reservas.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin reservas registradas.</p>
                ) : (
                  <ul className="space-y-2">
                    {detalle.reservas.map((r) => (
                      <li
                        key={r.reserva_id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{r.titulo || 'Reserva'}</p>
                          <p className="text-xs text-slate-500">{r.edificio} · {r.espacio}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs text-slate-600">{String(r.fecha_reserva).slice(0, 10)}</p>
                          <p className="text-[11px] text-slate-400">
                            {String(r.hora_inicio).slice(0, 5)}–{String(r.hora_fin).slice(0, 5)} · {r.estado}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Pie: solo Cerrar (sin editar perfil ni cambiar contraseña). */}
            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setDetalle(null)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
