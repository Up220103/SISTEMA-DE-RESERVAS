// Datos mock del shell del panel (sesión + navegación).
// Al conectar el backend, `sessionUser` vendrá de authSlice y `navItems`
// puede filtrarse según el rol real del usuario.

export const sessionUser = {
  initials: 'LS',
  name: 'Lic. Sofía Ramos',
  email: 'biblioteca@upa.edu.mx',
  role: 'ADMIN BIBLIOTECA',
}

export const navItems = [
  { key: 'calendario',     label: 'Calendario',        to: '/admin/calendario',     icon: 'calendar' },
  { key: 'cubiculos',      label: 'Gestión Cubículos', to: '/admin/cubiculos',      icon: 'book' },
  { key: 'aprobaciones',   label: 'Aprobaciones',      to: '/admin/aprobaciones',   icon: 'check' },
  { key: 'reportes',       label: 'Reportes',          to: '/admin/reportes',       icon: 'chart' },
  { key: 'historial',      label: 'Historial',         to: '/admin/historial',      icon: 'clock' },
  { key: 'notificaciones', label: 'Notificaciones',    to: '/admin/notificaciones', icon: 'bell', badge: 2 },
  { key: 'ayuda',          label: 'Ayuda',             to: '/admin/ayuda',          icon: 'help' },
]
