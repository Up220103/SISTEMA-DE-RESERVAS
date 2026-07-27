import { useCallback, useEffect, useMemo, useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'
import { getReservas, setReservaEstado, msgError } from '../../features/adminGeneral/adminApi.js'

const REFRESCO_MS = 6000 // auto-refresco silencioso

const estiloEstado = {
  Pendiente: 'bg-orange-50 text-orange-600',
  Confirmada: 'bg-green-50 text-green-600',
  Completada: 'bg-slate-100 text-slate-500',
  Cancelada: 'bg-red-50 text-red-600',
}

const hhmm = (t) => String(t).slice(0, 5)
const fmtISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function ReservasPage() {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [modalCancel, setModalCancel] = useState(null) // { reserva }
  const [motivo, setMotivo] = useState('')

  const cargar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true)
      const rs = await getReservas()
      setReservas(rs)
      setError(null)
    } catch (e) {
      setError(msgError(e, 'No se pudieron cargar las reservas'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    const id = setInterval(() => cargar(true), REFRESCO_MS)
    return () => clearInterval(id)
  }, [cargar])

  const notificar = (t) => {
    setAviso(t)
    setTimeout(() => setAviso(null), 3000)
  }

  // Aprobar: accion directa. Rechazar/Cancelar: abre el modal de motivo.
  const aprobar = async (r) => {
    try {
      await setReservaEstado(r.reserva_id, 'Confirmada')
      notificar(`Reserva #${r.reserva_id} aprobada.`)
      cargar(true)
    } catch (e) {
      setError(msgError(e, 'No se pudo aprobar la reserva'))
    }
  }

  const abrirCancelacion = (r) => {
    setMotivo('')
    setModalCancel({ reserva: r })
  }

  const confirmarCancelacion = async () => {
    try {
      await setReservaEstado(modalCancel.reserva.reserva_id, 'Cancelada', motivo.trim() || null)
      notificar(`Reserva #${modalCancel.reserva.reserva_id} cancelada.`)
      setModalCancel(null)
      cargar(true)
    } catch (e) {
      setError(msgError(e, 'No se pudo actualizar la reserva'))
    }
  }

  const pendientes = reservas.filter((r) => r.estado === 'Pendiente').length

  // La tabla muestra las reservas recientes (últimos 2 días) en adelante:
  // el día de hoy, los 2 días anteriores (para consultar confirmadas) y las próximas.
  const visibles = useMemo(() => {
    const limite = new Date()
    limite.setDate(limite.getDate() - 2)
    const limiteISO = fmtISO(limite)
    return reservas.filter((r) => String(r.fecha_reserva).slice(0, 10) >= limiteISO)
  }, [reservas])

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <PageHeading
          eyebrow="ADMIN GENERAL"
          title="Reservas y aprobaciones"
          subtitle="Aprueba o cancela las reservas. Se muestran las de hoy, los 2 días previos y las próximas."
        />
        <button
          onClick={() => cargar()}
          className="mt-2 shrink-0 rounded-lg bg-upa-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-upa-hover"
        >
          Actualizar
        </button>
      </div>

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

      <div className="mb-4">
        <div className="inline-block rounded-xl border border-orange-200 bg-orange-50 px-5 py-3">
          <p className="text-2xl font-black text-orange-600">{pendientes}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-orange-400">Pendientes</p>
        </div>
      </div>

      {cargando ? (
        <p className="text-slate-400">Cargando reservas…</p>
      ) : visibles.length === 0 ? (
        <p className="text-slate-400">No hay reservas recientes para mostrar.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Espacio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((r) => (
                <tr key={r.reserva_id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.reserva_id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {r.usuario_nombre} {r.usuario_apellido}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.espacio} <span className="text-slate-400">· {r.edificio}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {String(r.fecha_reserva).slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {hhmm(r.hora_inicio)}–{hhmm(r.hora_fin)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-widest ${
                        estiloEstado[r.estado] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {r.estado.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {r.estado === 'Pendiente' ? (
                        <>
                          <button
                            onClick={() => aprobar(r)}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => abrirCancelacion(r)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Rechazar
                          </button>
                        </>
                      ) : r.estado === 'Confirmada' ? (
                        <button
                          onClick={() => abrirCancelacion(r)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de cancelación con motivo (evita cancelaciones equivocadas). */}
      {modalCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalCancel(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-xl font-bold text-slate-900">Cancelar reserva</h2>
              <button onClick={() => setModalCancel(null)} className="text-slate-400 hover:text-slate-600">
                <Icon name="x" className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-900">
                {modalCancel.reserva.usuario_nombre} {modalCancel.reserva.usuario_apellido}
              </p>
              <p className="text-slate-500">
                {modalCancel.reserva.espacio} · {modalCancel.reserva.edificio} ·{' '}
                {String(modalCancel.reserva.fecha_reserva).slice(0, 10)} ·{' '}
                {hhmm(modalCancel.reserva.hora_inicio)}–{hhmm(modalCancel.reserva.hora_fin)}
              </p>
            </div>

            <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Motivo de la cancelación
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Escribe el motivo (opcional pero recomendado)…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-upa-blue focus:ring-2 focus:ring-upa-blue/15"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalCancel(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Volver
              </button>
              <button
                onClick={confirmarCancelacion}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
