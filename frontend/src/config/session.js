// Navegación del panel de Admin Biblioteca.
// Los datos de la sesión ya NO viven aquí: se leen del usuario autenticado
// (authSlice) en el Sidebar, para que el panel muestre a quien de verdad
// inició sesión.

export const navItems = [
  { key: 'calendario',     label: 'Calendario',        to: '/admin/calendario',     icon: 'calendar' },
  { key: 'cubiculos',      label: 'Gestión Cubículos', to: '/admin/cubiculos',      icon: 'book' },
  { key: 'aprobaciones',   label: 'Aprobaciones',      to: '/admin/aprobaciones',   icon: 'check' },
  { key: 'reportes',       label: 'Reportes',          to: '/admin/reportes',       icon: 'chart' },
  { key: 'historial',      label: 'Historial',         to: '/admin/historial',      icon: 'clock' },
  { key: 'notificaciones', label: 'Notificaciones',    to: '/admin/notificaciones', icon: 'bell', badge: 2 },
  { key: 'ayuda',          label: 'Ayuda',             to: '/admin/ayuda',          icon: 'help' },
]
