// Arma el paquete de métricas del panel de Admin Biblioteca.
// Lo consumen tanto el endpoint JSON como el generador de PDF.
import {
  resumenGeneral,
  inventarioCubiculos,
  porEstado,
  porDiaSemana,
  porCubiculo,
  porRol,
  porHora,
  topSolicitantes,
} from '../models/reporte.model.js'

const DIAS = ['', 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HORA_MIN = 8
const HORA_MAX = 20

const num = (v) => Number(v || 0)
const pct = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0)

// Rango por defecto: mes actual completo.
export function rangoPorDefecto() {
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = hoy.getMonth()
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { desde: iso(new Date(y, m, 1)), hasta: iso(new Date(y, m + 1, 0)) }
}

export async function construirMetricas(desde, hasta) {
  const [resumen, inventario, estados, dias, cubiculos, roles, horas, top] = await Promise.all([
    resumenGeneral(desde, hasta),
    inventarioCubiculos(),
    porEstado(desde, hasta),
    porDiaSemana(desde, hasta),
    porCubiculo(desde, hasta),
    porRol(desde, hasta),
    porHora(desde, hasta),
    topSolicitantes(desde, hasta),
  ])

  const total = num(resumen.total)
  const aprobadas = num(resumen.aprobadas)
  const rechazadas = num(resumen.rechazadas)
  const horasReservadas = Math.round((num(resumen.minutos) / 60) * 10) / 10
  // Tasa de aprobación sobre las ya resueltas (aprobadas + rechazadas).
  const resueltas = aprobadas + rechazadas

  // Capacidad teórica del periodo: cubículos x 12 h hábiles x días hábiles del rango.
  const diasHabiles = contarDiasHabiles(desde, hasta)
  const capacidadHoras = num(inventario.total) * (HORA_MAX - HORA_MIN) * diasHabiles

  const cubiculosMap = cubiculos.map((c) => ({
    etiqueta: c.etiqueta,
    total: num(c.total),
    horas: Math.round((num(c.minutos) / 60) * 10) / 10,
    pct: pct(num(c.total), total),
  }))

  // Serie lun-vie (aunque no haya reservas ese día, para que la gráfica sea estable).
  const mapaDias = new Map(dias.map((d) => [num(d.dow), num(d.total)]))
  const porDia = [2, 3, 4, 5, 6].map((dow) => ({
    etiqueta: DIAS[dow].slice(0, 3).toUpperCase(),
    total: mapaDias.get(dow) || 0,
  }))

  // Serie de horas 8..19 completa.
  const mapaHoras = new Map(horas.map((h) => [num(h.hora), num(h.total)]))
  const porHoras = []
  for (let h = HORA_MIN; h < HORA_MAX; h++) {
    porHoras.push({ etiqueta: `${h}:00`, hora: h, total: mapaHoras.get(h) || 0 })
  }
  const horaPico = porHoras.reduce((max, x) => (x.total > max.total ? x : max), porHoras[0])

  return {
    periodo: { desde, hasta, diasHabiles },
    kpis: {
      totalReservas: total,
      pendientes: num(resumen.pendientes),
      aprobadas,
      rechazadas,
      canceladas: num(resumen.canceladas),
      tasaAprobacion: pct(aprobadas, resueltas),
      horasReservadas,
      promedioHoras: total > 0 ? Math.round((horasReservadas / total) * 10) / 10 : 0,
      // Con volúmenes bajos, 1 decimal evita que se muestre 0%.
      ocupacion: capacidadHoras > 0
        ? Math.round((horasReservadas / capacidadHoras) * 1000) / 10
        : 0,
      cubiculoTop: cubiculosMap[0]?.etiqueta || '—',
      horaPico: horaPico?.total > 0 ? horaPico.etiqueta : '—',
    },
    inventario: {
      total: num(inventario.total),
      disponibles: num(inventario.disponibles),
      inhabilitados: num(inventario.inhabilitados),
    },
    porEstado: estados.map((e) => ({
      etiqueta: e.etiqueta,
      total: num(e.total),
      pct: pct(num(e.total), total),
    })),
    porDiaSemana: porDia,
    porCubiculo: cubiculosMap,
    porRol: roles.map((r) => ({
      etiqueta: r.etiqueta,
      total: num(r.total),
      pct: pct(num(r.total), total),
    })),
    porHora: porHoras,
    topSolicitantes: top.map((t) => ({
      etiqueta: t.etiqueta,
      rol: t.rol,
      total: num(t.total),
    })),
  }
}

// Días de lunes a viernes dentro del rango (la biblioteca no abre en fin de semana).
function contarDiasHabiles(desde, hasta) {
  const ini = new Date(`${desde}T00:00:00`)
  const fin = new Date(`${hasta}T00:00:00`)
  let n = 0
  for (const d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) n++
  }
  return n
}
