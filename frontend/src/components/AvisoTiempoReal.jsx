import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { conectarSocket, desconectarSocket } from '../services/socket.js'
import { selectIsAuthenticated } from '../features/auth/authSlice.js'

// Escucha en tiempo real (Socket.IO) los cambios que el administrador hace
// sobre la cuenta del usuario y muestra un aviso emergente. El boton de
// "Recargar" vuelve a cargar la pagina para traer los datos actualizados.
export default function AvisoTiempoReal() {
  const isAuth = useSelector(selectIsAuthenticated)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    if (!isAuth) {
      desconectarSocket()
      return
    }
    const socket = conectarSocket()
    if (!socket) return

    const onActualizado = (datos) => {
      setAviso({
        titulo: datos?.titulo || 'Actualización de tu cuenta',
        mensaje: datos?.mensaje || 'Un administrador realizó cambios en tu cuenta.',
      })
    }
    socket.on('usuario:actualizado', onActualizado)

    return () => {
      socket.off('usuario:actualizado', onActualizado)
    }
  }, [isAuth])

  if (!aviso) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="overflow-hidden rounded-2xl border border-upa-blue/30 bg-white shadow-2xl">
        <div className="flex items-start gap-3 bg-upa-blue px-5 py-4 text-white">
          <span className="mt-0.5">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold">{aviso.titulo}</p>
            <p className="mt-0.5 text-xs text-white/85">{aviso.mensaje}</p>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4">
          <button
            onClick={() => setAviso(null)}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-upa-blue py-2 text-sm font-semibold text-white transition hover:bg-upa-hover"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6 M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Recargar
          </button>
        </div>
      </div>
    </div>
  )
}
