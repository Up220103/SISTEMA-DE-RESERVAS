import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

// Métricas de uso de cubículos para el dashboard del Admin Biblioteca.
export const fetchReporte = createAsyncThunk(
  'reportes/fetch',
  async ({ desde, hasta } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/reportes/cubiculos', { params: { desde, hasta } })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar el reporte')
    }
  },
)

// Descarga el PDF respetando el token (por eso va por axios y no por <a href>).
export const descargarReportePdf = createAsyncThunk(
  'reportes/pdf',
  async ({ desde, hasta } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/reportes/cubiculos/pdf', {
        params: { desde, hasta },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-cubiculos_${desde}_a_${hasta}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return true
    } catch (err) {
      return rejectWithValue('No se pudo generar el PDF')
    }
  },
)

const reportesSlice = createSlice({
  name: 'reportes',
  initialState: { data: null, status: 'idle', error: null, descargando: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReporte.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchReporte.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.data = action.payload
      })
      .addCase(fetchReporte.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(descargarReportePdf.pending, (state) => { state.descargando = true })
      .addCase(descargarReportePdf.fulfilled, (state) => { state.descargando = false })
      .addCase(descargarReportePdf.rejected, (state, action) => {
        state.descargando = false
        state.error = action.payload
      })
  },
})

export const selectReporte = (state) => state.reportes.data
export const selectReporteStatus = (state) => state.reportes.status
export const selectReporteError = (state) => state.reportes.error
export const selectDescargando = (state) => state.reportes.descargando
export default reportesSlice.reducer
