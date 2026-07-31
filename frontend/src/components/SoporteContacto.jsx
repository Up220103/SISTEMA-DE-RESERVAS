// Bloque de contacto de soporte para los paneles de Estudiante y Docente.
// Mismos datos que la pestaña Ayuda del panel de biblioteca, para que el
// usuario vea siempre la misma via de contacto.
import { useState } from 'react'

export const SOPORTE = {
  email: 'soporte@upa.edu.mx',
  telefono: '449 910 5000',
  extension: '1234',
  horario: 'Lunes a viernes · 8:00 – 18:00 h',
  ubicacion: 'Edificio 5 · Biblioteca, planta baja',
}

const IconMail = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>)
const IconPhone = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z" /></svg>)
const IconClock = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
const IconPin = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>)
const IconHelp = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" /><path d="M12 17h.01" /></svg>)
const IconClose = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12 M18 6L6 18" /></svg>)

function Dato({ icono, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-[#475569]">
      <span className="mt-0.5 shrink-0 text-slate-400">{icono}</span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  )
}

// Tarjeta compacta para la barra lateral del panel.
export default function SoporteContacto({ onAbrirAyuda }) {
  return (
    <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-white p-4">
      <p className="mb-3 flex items-center gap-2 font-mono-upa text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
        <IconHelp /> Contacto de soporte
      </p>
      <p className="mb-3 text-sm text-[#475569]">
        ¿Problemas con una reserva o con tu cuenta? Escríbenos.
      </p>
      <ul className="space-y-2">
        <Dato icono={<IconMail />}>
          <a href={`mailto:${SOPORTE.email}`} className="font-semibold text-upa-blue hover:underline">
            {SOPORTE.email}
          </a>
        </Dato>
        <Dato icono={<IconPhone />}>
          {SOPORTE.telefono} <span className="text-slate-400">ext. {SOPORTE.extension}</span>
        </Dato>
        <Dato icono={<IconClock />}>{SOPORTE.horario}</Dato>
        <Dato icono={<IconPin />}>{SOPORTE.ubicacion}</Dato>
      </ul>
      <button
        onClick={onAbrirAyuda}
        className="mt-4 w-full rounded-lg border border-[#CBD5E1] py-2 font-display text-sm font-semibold text-slate-600 transition hover:border-upa-blue hover:text-upa-blue"
      >
        Preguntas frecuentes
      </button>
    </div>
  )
}

const FAQS = [
  {
    q: '¿Cuánto tarda en confirmarse mi reserva?',
    a: 'Queda como Pendiente hasta que la administración la revisa. Recibirás una notificación en la campana cuando se apruebe o se rechace.',
  },
  {
    q: '¿Puedo cancelar una reserva?',
    a: 'Sí, desde "Mis reservas", con al menos 2 horas de anticipación. Al cancelarla, el horario vuelve a quedar libre para otros usuarios.',
  },
  {
    q: '¿Por qué hay horas en negro que no puedo elegir?',
    a: 'Esa hora ya está ocupada: no queda ningún espacio libre de ese tipo, el espacio está inhabilitado, o tú ya tienes otra reserva a esa misma hora.',
  },
  {
    q: '¿Por qué desapareció una reserva que ya tenía?',
    a: 'Puede haberse cancelado porque el espacio se inhabilitó, porque cambió tu rol o por un cierre de la universidad. Siempre te llega una notificación con el motivo.',
  },
  {
    q: '¿Qué horarios puedo reservar?',
    a: 'De lunes a viernes, de 8:00 a 20:00 h. No se pueden reservar fechas u horas que ya pasaron.',
  },
]

// Modal con preguntas frecuentes + los datos de contacto.
export function SoporteModal({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-upa-blue px-6 py-5 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 text-white/80 hover:text-white" aria-label="Cerrar">
            <IconClose />
          </button>
          <p className="mb-1 font-mono-upa text-[10px] uppercase tracking-[0.2em] text-white/70">Soporte</p>
          <h3 className="font-display text-xl font-extrabold">¿Necesitas ayuda?</h3>
        </div>

        <div className="max-h-[calc(90vh-190px)] overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <details key={i} className="group rounded-xl border border-[#E2E8F0] p-4 open:bg-[#F8FAFC]">
                <summary className="flex cursor-pointer items-center justify-between font-display text-sm font-bold text-[#0F172A] marker:content-none">
                  {f.q}
                  <span className="ml-4 text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-[#475569]">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-upa-light bg-upa-light/40 p-4">
            <p className="mb-2 font-display text-sm font-bold text-upa-blue">Contacto directo</p>
            <ul className="space-y-2">
              <Dato icono={<IconMail />}>
                <a href={`mailto:${SOPORTE.email}`} className="font-semibold text-upa-blue hover:underline">
                  {SOPORTE.email}
                </a>
              </Dato>
              <Dato icono={<IconPhone />}>
                {SOPORTE.telefono} <span className="text-slate-400">ext. {SOPORTE.extension}</span>
              </Dato>
              <Dato icono={<IconClock />}>{SOPORTE.horario}</Dato>
              <Dato icono={<IconPin />}>{SOPORTE.ubicacion}</Dato>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#E2E8F0] px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#CBD5E1] py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <a
            href={`mailto:${SOPORTE.email}?subject=${encodeURIComponent('Ayuda con el Sistema de Reservas UPA')}`}
            className="flex-1 rounded-lg bg-upa-blue py-2.5 text-center font-display text-sm font-semibold text-white transition hover:bg-upa-hover"
          >
            Escribir a soporte
          </a>
        </div>
      </div>
    </div>
  )
}
