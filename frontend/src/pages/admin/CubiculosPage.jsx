import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'
import { selectCubiculos, selectEdificio, selectResumen, setEstado, agregarCubiculo, eliminarCubiculo } from '../../features/cubiculos/cubiculosSlice.js'

// Estilos por estado del cubículo.
const estilos = {
  disponible:   { card: 'border-slate-200 bg-white',        dot: 'bg-green-500',  texto: 'text-green-600',  id: 'text-slate-900' },
  reservado:    { card: 'border-slate-200 bg-slate-100',    dot: 'bg-slate-400',  texto: 'text-slate-500',  id: 'text-slate-400' },
  inhabilitado: { card: 'border-orange-200 bg-orange-50',   dot: 'bg-orange-500', texto: 'text-orange-600', id: 'text-orange-500' },
}

const etiqueta = { disponible: 'Disponible', reservado: 'Reservado', inhabilitado: 'Inhabilitado' }

function StatCard({ label, value, chip, valueColor = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-3 flex items-center gap-2">
        {chip && <span className={`h-3 w-3 rounded-sm ${chip}`} />}
        <p className="font-mono text-[10px] font-semibold tracking-widest text-slate-400">{label}</p>
      </div>
      <p className={`text-4xl font-black ${valueColor}`}>{value}</p>
    </div>
  )
}

function LegendChip({ color, label }) {
  return (
    <span className="flex items-center gap-2 text-xs text-slate-500">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

export default function CubiculosPage() {
  const dispatch = useDispatch()
  const cubiculos = useSelector(selectCubiculos)
  const edificio = useSelector(selectEdificio)
  const resumen = useSelector(selectResumen)
  const [detalleId, setDetalleId] = useState(null)
  const [mostrarAgregar, setMostrarAgregar] = useState(false)
  const [nuevaCap, setNuevaCap] = useState(4)

  // Se lee del store para que el modal refleje los cambios de estado al instante.
  const detalle = cubiculos.find((c) => c.id === detalleId) || null

  const habilitar = (id) => dispatch(setEstado({ id, estado: 'disponible' }))
  const deshabilitar = (id) => dispatch(setEstado({ id, estado: 'inhabilitado' }))

  const confirmarAgregar = () => {
    dispatch(agregarCubiculo({ lugares: nuevaCap }))
    setMostrarAgregar(false)
    setNuevaCap(4)
  }
  const confirmarEliminar = (id) => {
    dispatch(eliminarCubiculo(id))
    setDetalleId(null)
  }

  return (
    <div>
      <PageHeading
        title="Gestión de Cubículos"
        subtitle="Vista de planta de la zona de cubículos. Los cubículos reservados aparecen en gris y los disponibles en blanco."
      />

      {/* Resumen */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="TOTAL CUBÍCULOS" value={resumen.total} />
        <StatCard label="RESERVADOS" value={resumen.reservados} chip="bg-slate-400" valueColor="text-slate-700" />
        <StatCard label="DISPONIBLES" value={resumen.disponibles} chip="bg-green-500" valueColor="text-green-600" />
        <StatCard label="INHABILITADOS" value={resumen.inhabilitados} chip="bg-orange-500" valueColor="text-orange-600" />
      </div>

      {/* Planta */}
      <section className="rounded-2xl border border-slate-200 p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-slate-400">PLANTA · ZONA DE CUBÍCULOS</p>
            <h2 className="text-lg font-bold text-slate-900">{edificio}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <LegendChip color="bg-slate-300" label="Reservado" />
            <LegendChip color="bg-white ring-1 ring-slate-300" label="Disponible" />
            <LegendChip color="bg-orange-400" label="Inhabilitado" />
            <button
              onClick={() => setMostrarAgregar(true)}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Agregar cubículo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cubiculos.map((c) => {
            const s = estilos[c.estado]
            return (
              <button
                key={c.id}
                onClick={() => setDetalleId(c.id)}
                className={`rounded-xl border p-4 text-left transition hover:ring-2 hover:ring-brand/30 ${s.card}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className={`text-base font-bold ${s.id}`}>{c.nombre}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                </div>
                <p className={`text-sm font-medium ${s.texto}`}>{etiqueta[c.estado]}</p>
                <p className="mt-2 font-mono text-[10px] tracking-widest text-slate-400">
                  {c.lugares} LUGARES
                </p>
              </button>
            )
          })}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <Icon name="info" className="h-4 w-4" />
          Haz clic en un cubículo para ver quién lo reservó, hasta qué hora y habilitarlo o deshabilitarlo.
        </p>
      </section>

      {/* Modal de detalle */}
      {detalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setDetalleId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">{detalle.nombre}</h3>
              <span className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-widest ${estilos[detalle.estado].texto}`}>
                {etiqueta[detalle.estado].toUpperCase()}
              </span>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Capacidad</dt>
                <dd className="font-medium text-slate-700">{detalle.lugares} lugares</dd>
              </div>
              {detalle.reserva?.por && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Reservado por</dt>
                  <dd className="font-medium text-slate-700">{detalle.reserva.por}</dd>
                </div>
              )}
              {detalle.reserva?.hasta && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Hasta</dt>
                  <dd className="font-medium text-slate-700">{detalle.reserva.hasta}</dd>
                </div>
              )}
              {detalle.reserva?.motivo && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Motivo</dt>
                  <dd className="font-medium text-slate-700">{detalle.reserva.motivo}</dd>
                </div>
              )}
            </dl>

            {/* Acciones de admin: habilitar / deshabilitar */}
            <div className="mt-6 flex gap-3">
              {detalle.estado === 'inhabilitado' ? (
                <button
                  onClick={() => habilitar(detalle.id)}
                  className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Habilitar
                </button>
              ) : (
                <button
                  onClick={() => deshabilitar(detalle.id)}
                  className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Deshabilitar
                </button>
              )}
              <button
                onClick={() => setDetalleId(null)}
                className="flex-1 rounded-lg bg-ink py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            {/* Eliminar cubículo (por si se cierra ese cubículo) */}
            <button
              onClick={() => confirmarEliminar(detalle.id)}
              className="mt-3 w-full rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Eliminar cubículo
            </button>
          </div>
        </div>
      )}

      {/* Modal agregar cubículo */}
      {mostrarAgregar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setMostrarAgregar(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-xl font-black text-slate-900">Agregar cubículo</h3>
            <p className="mb-5 text-sm text-slate-500">
              Se creará como <span className="font-semibold">disponible</span>. El número se asigna automáticamente.
            </p>

            <label className="mb-1.5 block font-mono text-[10px] font-semibold tracking-widest text-slate-400">
              CAPACIDAD (LUGARES)
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={nuevaCap}
              onChange={(e) => setNuevaCap(e.target.value)}
              className="mb-6 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={confirmarAgregar}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Agregar
              </button>
              <button
                onClick={() => setMostrarAgregar(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
