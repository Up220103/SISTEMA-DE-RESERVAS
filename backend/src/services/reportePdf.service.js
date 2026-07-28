// Generación del PDF del reporte de cubículos (Admin Biblioteca).
// Las gráficas se dibujan como vectores con PDFKit: sin dependencias nativas.
import PDFDocument from 'pdfkit'

// Paleta institucional UPA.
const AZUL = '#0033A0'
const TINTA = '#0F172A'
const GRIS = '#64748B'
const GRIS_CLARO = '#E2E8F0'
const VERDE = '#16A34A'
const AMBAR = '#D97706'
const ROJO = '#DC2626'

const MARGEN = 48
const ANCHO_UTIL = 595.28 - MARGEN * 2 // A4 vertical

const fmtFecha = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Construye el PDF y lo escribe en el stream de respuesta.
 * @param {object} m  métricas de construirMetricas()
 * @param {object} opciones  { generadoPor }
 * @param {Writable} destino  stream (res)
 */
export function generarReportePdf(m, opciones, destino) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGEN, bufferPages: true })
  doc.pipe(destino)

  encabezado(doc, m, opciones)
  seccionResumen(doc, m)
  seccionKpis(doc, m)
  graficaPorDia(doc, m)
  graficaPorHora(doc, m)
  usoPorCubiculo(doc, m)
  tablaSolicitantes(doc, m)
  pieDePagina(doc)

  doc.end()
}

// ---------------------------------------------------------------- encabezado
function encabezado(doc, m, { generadoPor }) {
  // Banda superior azul con el nombre del sistema.
  doc.rect(0, 0, 595.28, 92).fill(AZUL)

  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20)
     .text('UPA · Sistema de Reservas', MARGEN, 26)
  doc.font('Helvetica').fontSize(10).fillColor('#D6E0FF')
     .text('Universidad Politécnica · Panel Admin Biblioteca', MARGEN, 52)

  doc.y = 118
  doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(18)
     .text('Reporte de uso de cubículos', MARGEN, doc.y)

  doc.moveDown(0.3)
  doc.font('Helvetica').fontSize(10).fillColor(GRIS)
     .text(
       `Periodo: ${fmtFecha(m.periodo.desde)} — ${fmtFecha(m.periodo.hasta)}  ·  ` +
       `${m.periodo.diasHabiles} días hábiles  ·  Generado: ${new Date().toLocaleString('es-MX')}`,
       MARGEN,
     )
  if (generadoPor) {
    doc.text(`Generado por: ${generadoPor}`, MARGEN)
  }

  linea(doc, doc.y + 10)
  doc.y += 22
}

// ------------------------------------------------------------------ resumen
function seccionResumen(doc, m) {
  const k = m.kpis
  titulo(doc, 'Resumen ejecutivo')

  const texto =
    `Durante el periodo analizado se registraron ${k.totalReservas} solicitudes de reserva de cubículos, ` +
    `de las cuales ${k.aprobadas} fueron aprobadas y ${k.rechazadas} rechazadas, ` +
    `lo que representa una tasa de aprobación del ${k.tasaAprobacion}%. ` +
    `Actualmente quedan ${k.pendientes} solicitudes pendientes de revisión. ` +
    `El total de horas reservadas asciende a ${k.horasReservadas} h ` +
    `(promedio de ${k.promedioHoras} h por reserva), con una ocupación estimada del ${k.ocupacion}% ` +
    `sobre la capacidad disponible. ` +
    `El espacio más solicitado fue ${k.cubiculoTop} y la hora de mayor demanda las ${k.horaPico}. ` +
    `La biblioteca cuenta con ${m.inventario.total} cubículos, de los cuales ` +
    `${m.inventario.disponibles} están habilitados y ${m.inventario.inhabilitados} fuera de servicio.`

  doc.font('Helvetica').fontSize(10).fillColor(TINTA)
     .text(texto, MARGEN, doc.y, { width: ANCHO_UTIL, align: 'justify', lineGap: 2 })
  doc.y += 14
}

// --------------------------------------------------------------------- KPIs
function seccionKpis(doc, m) {
  const k = m.kpis
  titulo(doc, 'Indicadores clave')

  const tarjetas = [
    { label: 'RESERVAS', valor: String(k.totalReservas), color: TINTA },
    { label: 'APROBACIÓN', valor: `${k.tasaAprobacion}%`, color: VERDE },
    { label: 'PENDIENTES', valor: String(k.pendientes), color: AMBAR },
    { label: 'RECHAZADAS', valor: String(k.rechazadas), color: ROJO },
    { label: 'HORAS', valor: `${k.horasReservadas}`, color: AZUL },
    { label: 'OCUPACIÓN', valor: `${k.ocupacion}%`, color: AZUL },
  ]

  const cols = 3
  const gap = 12
  const ancho = (ANCHO_UTIL - gap * (cols - 1)) / cols
  const alto = 52
  let x = MARGEN
  let y = doc.y

  tarjetas.forEach((t, i) => {
    if (i > 0 && i % cols === 0) {
      x = MARGEN
      y += alto + gap
    }
    doc.roundedRect(x, y, ancho, alto, 6).lineWidth(1).strokeColor(GRIS_CLARO).stroke()
    doc.font('Helvetica').fontSize(7).fillColor(GRIS)
       .text(t.label, x + 10, y + 10, { width: ancho - 20 })
    doc.font('Helvetica-Bold').fontSize(18).fillColor(t.color)
       .text(t.valor, x + 10, y + 22, { width: ancho - 20 })
    x += ancho + gap
  })

  doc.y = y + alto + 20
}

// -------------------------------------------------- gráfica: reservas por día
function graficaPorDia(doc, m) {
  titulo(doc, 'Reservas por día de la semana')
  barrasVerticales(doc, m.porDiaSemana, { alto: 110, color: AZUL })
  doc.y += 16
}

// ------------------------------------------------- gráfica: distribución hora
function graficaPorHora(doc, m) {
  saltoSiNoCabe(doc, 190)
  titulo(doc, 'Distribución por hora de inicio')
  barrasVerticales(doc, m.porHora, { alto: 100, color: TINTA, fuenteEtiqueta: 6 })
  doc.font('Helvetica').fontSize(8).fillColor(GRIS)
     .text(`Hora de mayor demanda: ${m.kpis.horaPico}`, MARGEN, doc.y + 4)
  doc.y += 18
}

// ------------------------------------------------ barras horizontales: uso
function usoPorCubiculo(doc, m) {
  saltoSiNoCabe(doc, 160)
  titulo(doc, 'Uso por cubículo')

  if (!m.porCubiculo.length) {
    vacio(doc, 'Sin reservas registradas en el periodo.')
    return
  }

  const maxTotal = Math.max(...m.porCubiculo.map((c) => c.total), 1)
  const anchoBarra = ANCHO_UTIL - 190

  m.porCubiculo.forEach((c) => {
    saltoSiNoCabe(doc, 26)
    const y = doc.y
    doc.font('Helvetica').fontSize(9).fillColor(TINTA)
       .text(c.etiqueta, MARGEN, y + 3, { width: 90 })

    doc.rect(MARGEN + 95, y + 4, anchoBarra, 10).fill(GRIS_CLARO)
    doc.rect(MARGEN + 95, y + 4, Math.max((c.total / maxTotal) * anchoBarra, 1), 10).fill(AZUL)

    doc.font('Helvetica').fontSize(8).fillColor(GRIS)
       .text(`${c.total} res · ${c.horas} h · ${c.pct}%`, MARGEN + 105 + anchoBarra, y + 4, {
         width: 85, align: 'right',
       })
    doc.y = y + 20
  })
  doc.y += 8
}

// ------------------------------------------------------ tabla solicitantes
function tablaSolicitantes(doc, m) {
  saltoSiNoCabe(doc, 150)
  titulo(doc, 'Solicitantes más frecuentes')

  if (!m.topSolicitantes.length) {
    vacio(doc, 'Sin solicitantes en el periodo.')
    return
  }

  const cols = [
    { t: 'SOLICITANTE', x: MARGEN, w: 240 },
    { t: 'TIPO', x: MARGEN + 250, w: 140 },
    { t: 'RESERVAS', x: MARGEN + 395, w: 100, align: 'right' },
  ]

  // Encabezado de tabla
  const yh = doc.y
  doc.rect(MARGEN, yh, ANCHO_UTIL, 20).fill('#F1F5F9')
  doc.font('Helvetica-Bold').fontSize(8).fillColor(GRIS)
  cols.forEach((c) => doc.text(c.t, c.x + 8, yh + 7, { width: c.w, align: c.align || 'left' }))
  doc.y = yh + 20

  m.topSolicitantes.forEach((s, i) => {
    saltoSiNoCabe(doc, 24)
    const y = doc.y
    if (i % 2 === 1) doc.rect(MARGEN, y, ANCHO_UTIL, 20).fill('#FAFBFC')
    doc.font('Helvetica').fontSize(9).fillColor(TINTA)
       .text(s.etiqueta, cols[0].x + 8, y + 6, { width: cols[0].w })
    doc.fillColor(GRIS).text(s.rol, cols[1].x + 8, y + 6, { width: cols[1].w })
    doc.font('Helvetica-Bold').fillColor(TINTA)
       .text(String(s.total), cols[2].x, y + 6, { width: cols[2].w, align: 'right' })
    doc.y = y + 20
  })

  // Desglose por tipo de usuario
  if (m.porRol.length) {
    doc.y += 12
    saltoSiNoCabe(doc, 40)
    doc.font('Helvetica').fontSize(9).fillColor(GRIS)
       .text(
         'Por tipo de solicitante: ' +
           m.porRol.map((r) => `${r.etiqueta} ${r.total} (${r.pct}%)`).join('  ·  '),
         MARGEN, doc.y, { width: ANCHO_UTIL },
       )
  }
}

// ------------------------------------------------------------------ helpers
function titulo(doc, texto) {
  saltoSiNoCabe(doc, 60)
  doc.font('Helvetica-Bold').fontSize(12).fillColor(TINTA)
     .text(texto, MARGEN, doc.y, { width: ANCHO_UTIL })
  doc.y += 6
  linea(doc, doc.y)
  doc.y += 10
}

function linea(doc, y) {
  doc.moveTo(MARGEN, y).lineTo(MARGEN + ANCHO_UTIL, y).lineWidth(1).strokeColor(GRIS_CLARO).stroke()
}

function vacio(doc, texto) {
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRIS)
     .text(texto, MARGEN, doc.y, { width: ANCHO_UTIL })
  doc.y += 20
}

// Gráfica de barras verticales con eje base y valores encima.
function barrasVerticales(doc, datos, { alto = 110, color = AZUL, fuenteEtiqueta = 8 }) {
  saltoSiNoCabe(doc, alto + 50)
  const base = doc.y + alto
  const max = Math.max(...datos.map((d) => d.total), 1)
  const gap = 6
  const ancho = (ANCHO_UTIL - gap * (datos.length - 1)) / datos.length

  datos.forEach((d, i) => {
    const x = MARGEN + i * (ancho + gap)
    const h = d.total > 0 ? Math.max((d.total / max) * (alto - 16), 3) : 0

    if (h > 0) doc.rect(x, base - h, ancho, h).fill(color)
    else doc.rect(x, base - 2, ancho, 2).fill(GRIS_CLARO)

    // valor arriba de la barra
    if (d.total > 0) {
      doc.font('Helvetica-Bold').fontSize(7).fillColor(TINTA)
         .text(String(d.total), x, base - h - 10, { width: ancho, align: 'center' })
    }
    // etiqueta bajo el eje
    doc.font('Helvetica').fontSize(fuenteEtiqueta).fillColor(GRIS)
       .text(d.etiqueta, x, base + 5, { width: ancho, align: 'center' })
  })

  // eje
  doc.moveTo(MARGEN, base).lineTo(MARGEN + ANCHO_UTIL, base)
     .lineWidth(1).strokeColor(GRIS_CLARO).stroke()

  doc.y = base + 20
}

// Salta de página si no queda espacio suficiente.
function saltoSiNoCabe(doc, necesario) {
  const limite = doc.page.height - doc.page.margins.bottom - 30
  if (doc.y + necesario > limite) doc.addPage()
}

// Numeración de páginas al final (requiere bufferPages).
function pieDePagina(doc) {
  const rango = doc.bufferedPageRange()
  for (let i = 0; i < rango.count; i++) {
    doc.switchToPage(rango.start + i)
    const y = doc.page.height - 40
    doc.font('Helvetica').fontSize(8).fillColor(GRIS)
       .text(
         `Sistema de Reservas UPA · Reporte de cubículos · Página ${i + 1} de ${rango.count}`,
         MARGEN, y, { width: ANCHO_UTIL, align: 'center' },
       )
  }
}
