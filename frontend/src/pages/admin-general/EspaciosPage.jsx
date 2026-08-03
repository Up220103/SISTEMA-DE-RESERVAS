import { useEffect, useMemo, useState } from 'react'

import PageHeading from '../../components/ui/PageHeading.jsx'
import Icon from '../../components/ui/Icon.jsx'
import {
  getEspacios,
  getEdificios,
  getTipos,
  crearEspacio,
  editarEspacio,
  crearEdificio,
  msgError,
} from '../../features/adminGeneral/adminApi.js'

const ESTADOS = ['Disponible', 'Mantenimiento', 'Bloqueado']
const estiloEstado = {
  Disponible: 'bg-green-50 text-green-600',
  Mantenimiento: 'bg-orange-50 text-orange-600',
  Bloqueado: 'bg-slate-100 text-slate-500',
  Ocupado: 'bg-slate-100 text-slate-500',
}

const vacioEspacio = { espacio_id: null, nombre: '', capacidad: 4, estado: 'Disponible', tipo_id: '', edificio_id: '' }
const vacioEdificio = { nombre: '' }

export default function EspaciosPage() {
  const [espacios, setEspacios] = useState([])
  const [edificios, setEdificios] = useState([])
  const [tipos, setTipos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [formEspacio, setFormEspacio] = useState(null) // objeto o null
  const [formEdificio, setFormEdificio] = useState(null)

  const cargar = async () => {
    try {
      setCargando(true)
      const [es, ed, tp] = await Promise.all([getEspacios(), getEdificios(), getTipos()])
      setEspacios(es)
      setEdificios(ed)
      setTipos(tp)
      setError(null)
    } catch (err) {
      setError(msgError(err, 'No se pudieron cargar los espacios'))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const notificar = (t) => {
    setAviso(t)
    setTimeout(() => setAviso(null), 3000)
  }

  // Opciones para los formularios: sin Biblioteca ni Cubículo (los administra biblioteca).
  const edificiosSel = useMemo(() => edificios.filter((e) => e.nombre !== 'Biblioteca'), [edificios])
  const tiposSel = useMemo(() => tipos.filter((t) => t.nombre_tipo !== 'Cubículo'), [tipos])

  // Agrupa espacios por edificio. Se excluyen los cubículos de la Biblioteca:
  // el Admin General no los gestiona (los administra el Admin de Biblioteca).
  const porEdificio = useMemo(() => {
    const map = {}
    for (const e of espacios) {
      if (e.es_biblioteca) continue
      ;(map[e.edificio] ||= []).push(e)
    }
    return map
  }, [espacios])

  const guardarEspacio = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        nombre: formEspacio.nombre,
        capacidad: Number(formEspacio.capacidad),
        estado: formEspacio.estado,
        tipo_id: Number(formEspacio.tipo_id),
        edificio_id: Number(formEspacio.edificio_id),
      }
      if (formEspacio.espacio_id) {
        await editarEspacio(formEspacio.espacio_id, payload)
        notificar('Espacio actualizado.')
      } else {
        await crearEspacio(payload)
        notificar('Espacio creado.')
      }
      setFormEspacio(null)
      cargar()
    } catch (err) {
      setError(msgError(err, 'No se pudo guardar el espacio'))
    }
  }

  const guardarEdificio = async (e) => {
    e.preventDefault()
    try {
      await crearEdificio({ nombre: formEdificio.nombre })
      notificar('Edificio creado.')
      setFormEdificio(null)
      cargar()
    } catch (err) {
      setError(msgError(err, 'No se pudo crear el edificio'))
    }
  }

  const abrirNuevoEspacio = () =>
    setFormEspacio({
      ...vacioEspacio,
      tipo_id: tiposSel[0]?.tipo_id || '',
      edificio_id: edificiosSel[0]?.edificio_id || '',
    })

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-upa-blue focus:ring-2 focus:ring-upa-blue/15'

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeading
          eyebrow="ADMIN GENERAL"
          title="Espacios"
          subtitle="Administra los espacios reservables y sus edificios. (Los cubículos de la Biblioteca los gestiona el Admin de Biblioteca.)"
        />
        <div className="flex shrink-0 flex-wrap gap-2 pt-2">
          <button
            onClick={() => setFormEdificio({ ...vacioEdificio })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            + Edificio
          </button>
          <button
            onClick={abrirNuevoEspacio}
            className="rounded-lg bg-upa-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-upa-hover"
          >
            + Nuevo espacio
          </button>
        </div>
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

      {cargando ? (
        <p className="text-slate-400">Cargando espacios…</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(porEdificio).map(([edificio, lista]) => (
            <section key={edificio}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                {edificio}
                {edificio === 'Biblioteca' && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] tracking-widest text-slate-400">
                    SOLO LECTURA
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lista.map((es) => (
                  <div
                    key={es.espacio_id}
                    className={`rounded-2xl border p-5 ${
                      es.es_biblioteca ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <p className="text-base font-bold text-slate-900">{es.nombre}</p>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest ${
                          estiloEstado[es.estado] || 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {es.estado.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{es.nombre_tipo}</p>
                    <p className="mt-1 text-xs text-slate-400">Capacidad: {es.capacidad}</p>
                    <div className="mt-4">
                      {es.es_biblioteca ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Icon name="info" className="h-4 w-4" /> Gestionado por Biblioteca
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            setFormEspacio({
                              espacio_id: es.espacio_id,
                              nombre: es.nombre,
                              capacidad: es.capacidad,
                              estado: ESTADOS.includes(es.estado) ? es.estado : 'Disponible',
                              tipo_id: es.tipo_id,
                              edificio_id: es.edificio_id,
                            })
                          }
                          className="text-sm font-semibold text-upa-blue hover:text-upa-hover"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal espacio */}
      {formEspacio && (
        <Modal onClose={() => setFormEspacio(null)} titulo={formEspacio.espacio_id ? 'Editar espacio' : 'Nuevo espacio'}>
          <form onSubmit={guardarEspacio} className="space-y-4">
            <Campo label="Nombre">
              <input
                value={formEspacio.nombre}
                onChange={(e) => setFormEspacio({ ...formEspacio, nombre: e.target.value })}
                required
                className={inputCls}
              />
            </Campo>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Tipo">
                <select
                  value={formEspacio.tipo_id}
                  onChange={(e) => setFormEspacio({ ...formEspacio, tipo_id: e.target.value })}
                  required
                  className={inputCls}
                >
                  {tiposSel.map((t) => (
                    <option key={t.tipo_id} value={t.tipo_id}>
                      {t.nombre_tipo}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Edificio">
                <select
                  value={formEspacio.edificio_id}
                  onChange={(e) => setFormEspacio({ ...formEspacio, edificio_id: e.target.value })}
                  required
                  className={inputCls}
                >
                  {edificiosSel.map((ed) => (
                    <option key={ed.edificio_id} value={ed.edificio_id}>
                      {ed.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Capacidad">
                <input
                  type="number"
                  min="1"
                  value={formEspacio.capacidad}
                  onChange={(e) => setFormEspacio({ ...formEspacio, capacidad: e.target.value })}
                  required
                  className={inputCls}
                />
              </Campo>
              <Campo label="Estado">
                <select
                  value={formEspacio.estado}
                  onChange={(e) => setFormEspacio({ ...formEspacio, estado: e.target.value })}
                  className={inputCls}
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <BotonesModal onCancel={() => setFormEspacio(null)} />
          </form>
        </Modal>
      )}

      {/* Modal edificio */}
      {formEdificio && (
        <Modal onClose={() => setFormEdificio(null)} titulo="Nuevo edificio">
          <form onSubmit={guardarEdificio} className="space-y-4">
            <Campo label="Nombre del edificio">
              <input
                value={formEdificio.nombre}
                onChange={(e) => setFormEdificio({ ...formEdificio, nombre: e.target.value })}
                required
                autoFocus
                placeholder="Ej. Edificio C"
                className={inputCls}
              />
            </Campo>
            <BotonesModal onCancel={() => setFormEdificio(null)} />
          </form>
        </Modal>
      )}
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon name="x" className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function BotonesModal({ onCancel }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="rounded-lg bg-upa-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-upa-hover"
      >
        Guardar
      </button>
    </div>
  )
}
