import { useEffect, useMemo, useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import {
  getReservas,
  getCierre,
  setCierre as guardarCierreApi,
  quitarCierre,
  msgError,
} from '../../features/adminGeneral/adminApi.js'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const lunesPrimero = (jsDay) => (jsDay + 6) % 7

export default function CalendarioPage() {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [reservas, setReservas] = useState([])
  const [error, setError] = useState(null)
  const [diaSel, setDiaSel] = useState(null)

  // --- Cierre por ciclo escolar ---
  const [cierre, setCierre] = useState(null) // { inicio, fin } | null
  const [inicioInput, setInicioInput] = useState('')
  const [finInput, setFinInput] = useState('')
  const [avisoCierre, setAvisoCierre] = useState(null)
  const [errorCierre, setErrorCierre] = useState(null)

  useEffect(() => {
    getReservas()
      .then(setReservas)
      .catch((err) => setError(msgError(err, 'No se pudieron cargar las reservas')))
    getCierre()
      .then((c) => {
        setCierre(c)
        if (c) {
          setInicioInput(c.inicio)
          setFinInput(c.fin)
        }
      })
      .catch(() => {})
  }, [])

  const guardarCierre = async () => {
    setErrorCierre(null)
    if (!inicioInput || !finInput) {
      setErrorCierre('Indica la fecha de inicio y de fin del cierre.')
      return
    }
    if (finInput < inicioInput) {
      setErrorCierre('La fecha de fin no puede ser anterior a la de inicio.')
      return
    }
    try {
      const c = await guardarCierreApi(inicioInput, finInput)
      setCierre(c)
      setAvisoCierre('Cierre guardado. Las reservas quedan desactivadas en ese periodo.')
      setTimeout(() => setAvisoCierre(null), 4000)
    } catch (e) {
      setErrorCierre(msgError(e, 'No se pudo guardar el cierre'))
    }
  }

  const eliminarCierre = async () => {
    try {
      await quitarCierre()
      setCierre(null)
      setInicioInput('')
      setFinInput('')
      setAvisoCierre('Cierre eliminado. Las reservas vuelven a estar habilitadas.')
      setTimeout(() => setAvisoCierre(null), 4000)
    } catch (e) {
      setErrorCierre(msgError(e, 'No se pudo quitar el cierre'))
    }
  }

  const porFecha = useMemo(() => {
    const map = {}
    for (const r of reservas) {
      const f = String(r.fecha_reserva).slice(0, 10)
      ;(map[f] ||= []).push(r)
    }
    return map
  }, [reservas])

  const primerDia = lunesPrimero(new Date(anio, mes, 1).getDay())
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const celdas = [...Array(primerDia).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]

  const cambiarMes = (delta) => {
    let m = mes + delta
    let a = anio
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m)
    setAnio(a)
    setDiaSel(null)
  }

  const claveFecha = (dia) =>
    `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  const esHoy = (dia) =>
    dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()

  const reservasDia = diaSel ? porFecha[claveFecha(diaSel)] || [] : []

  const inputCls =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-upa-blue focus:ring-2 focus:ring-upa-blue/15'

  return (
    <div>
      <PageHeading
        eyebrow="ADMIN GENERAL"
        title="Calendario"
        subtitle="Consulta las reservas por mes y administra los cierres por ciclo escolar."
      />

      {/* Panel de cierre por ciclo escolar */}
      <div className="mb-6 rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Cierre por ciclo escolar / vacaciones
            </p>
            <h2 className="text-lg font-bold text-slate-900">Desactivar reservas por periodo</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Define el inicio y el fin del cierre (fin de ciclo escolar o universidad cerrada).
              Durante ese periodo <strong>no se podrán realizar reservas</strong> en ningún espacio.
              Puedes editarlo o quitarlo cuando quieras.
            </p>
          </div>
          {cierre && (
            <span className="rounded-md bg-red-50 px-3 py-1 font-mono text-[11px] font-bold tracking-widest text-red-600">
              CIERRE ACTIVO
            </span>
          )}
        </div>

        {errorCierre && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorCierre}
          </div>
        )}
        {avisoCierre && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {avisoCierre}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Inicio del cierre
            </span>
            <input type="date" value={inicioInput} onChange={(e) => setInicioInput(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Fin del cierre
            </span>
            <input type="date" value={finInput} onChange={(e) => setFinInput(e.target.value)} className={inputCls} />
          </label>
          <button
            onClick={guardarCierre}
            className="rounded-lg bg-upa-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-upa-hover"
          >
            {cierre ? 'Actualizar cierre' : 'Guardar cierre'}
          </button>
          {cierre && (
            <button
              onClick={eliminarCierre}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Quitar cierre
            </button>
          )}
        </div>

        {cierre && (
          <p className="mt-3 text-sm text-slate-600">
            Cierre actual: <strong>{cierre.inicio}</strong> → <strong>{cierre.fin}</strong>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {MESES[mes]} <span className="text-slate-400">{anio}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={() => cambiarMes(-1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              ← Anterior
            </button>
            <button
              onClick={() => { setMes(hoy.getMonth()); setAnio(hoy.getFullYear()); setDiaSel(null) }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hoy
            </button>
            <button onClick={() => cambiarMes(1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Siguiente →
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-upa-light" /> Con reservas</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-100" /> Cerrado</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-100" /> Fin de semana (no disponible)</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DIAS.map((d, i) => (
            <div
              key={d}
              className={`pb-2 text-center font-mono text-[10px] font-semibold tracking-widest ${
                i >= 5 ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              {d}
            </div>
          ))}
          {celdas.map((dia, i) => {
            if (!dia) return <div key={`v-${i}`} />
            const dow = new Date(anio, mes, dia).getDay()
            const esFinde = dow === 0 || dow === 6
            const iso = claveFecha(dia)
            const enCierre = cierre && iso >= cierre.inicio && iso <= cierre.fin
            const items = porFecha[iso] || []
            const seleccionado = diaSel === dia

            let clases = 'border-slate-200 hover:bg-slate-50'
            if (esFinde) clases = 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
            else if (enCierre) clases = 'border-red-200 bg-red-50'
            else if (seleccionado) clases = 'border-upa-blue bg-upa-light'

            return (
              <button
                key={dia}
                disabled={esFinde}
                onClick={() => !esFinde && setDiaSel(dia)}
                title={esFinde ? 'Fin de semana: no disponible' : enCierre ? 'Cerrado por ciclo escolar' : ''}
                className={`flex min-h-[76px] flex-col rounded-lg border p-2 text-left transition ${clases}`}
              >
                <span
                  className={`text-sm font-semibold ${
                    esHoy(dia) && !esFinde
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-upa-blue text-white'
                      : esFinde ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {dia}
                </span>
                {enCierre && !esFinde && (
                  <span className="mt-auto inline-block rounded bg-red-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-red-600">
                    Cerrado
                  </span>
                )}
                {!enCierre && !esFinde && items.length > 0 && (
                  <span className="mt-auto inline-flex items-center gap-1 rounded bg-upa-light px-1.5 py-0.5 font-mono text-[10px] font-bold text-upa-blue">
                    {items.length} reserva{items.length > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {diaSel && (
        <div className="mt-6 rounded-2xl border border-slate-200 p-6">
          <p className="mb-4 font-mono text-[10px] font-semibold tracking-widest text-slate-400">
            RESERVAS · {diaSel} {MESES[mes]} {anio}
          </p>
          {reservasDia.length === 0 ? (
            <p className="text-sm text-slate-400">Sin reservas este día.</p>
          ) : (
            <ul className="space-y-2">
              {reservasDia.map((r) => (
                <li
                  key={r.reserva_id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.titulo || 'Reserva'}</p>
                    <p className="text-xs text-slate-500">
                      {r.edificio} · {r.espacio} · {r.usuario_nombre} {r.usuario_apellido}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-slate-600">
                      {String(r.hora_inicio).slice(0, 5)}–{String(r.hora_fin).slice(0, 5)}
                    </p>
                    <p className="text-[11px] text-slate-400">{r.estado}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
