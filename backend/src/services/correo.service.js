// Envio de correo del sistema.
//
// MODO DEMO (el actual): no hay servidor SMTP configurado, asi que el correo no
// sale de verdad: se registra en la consola del servidor con todo su contenido,
// incluido el enlace de restablecimiento. Sirve para probar el flujo completo
// sin credenciales.
//
// PARA ACTIVAR EL ENVIO REAL: instalar nodemailer (`npm i nodemailer`), definir
// las variables SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS en el .env y
// completar `enviarPorSMTP`. El resto del sistema no cambia: sigue llamando a
// `enviarCorreo` igual que ahora.
const SOPORTE_EMAIL = process.env.SOPORTE_EMAIL || 'soporte@upa.edu.mx'

// Hay SMTP configurado?
export function smtpConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

async function enviarPorSMTP() {
  // Punto de extension: aqui iria el transporte de nodemailer.
  throw new Error('SMTP configurado pero el transporte real aun no esta implementado.')
}

// Envia (o simula) un correo. Devuelve { enviado, modo } para que el
// controlador sepa que responderle al usuario.
export async function enviarCorreo({ para, asunto, texto }) {
  if (smtpConfigurado()) {
    await enviarPorSMTP({ para, asunto, texto })
    return { enviado: true, modo: 'smtp' }
  }

  // Modo demo: queda registrado en el log del backend.
  console.log(
    [
      '',
      '─────────────── CORREO (MODO DEMO, no se envió de verdad) ───────────────',
      `Para:   ${para}`,
      `Asunto: ${asunto}`,
      '',
      texto,
      '─────────────────────────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  )
  return { enviado: false, modo: 'demo' }
}

// Cuerpo del correo de restablecimiento de contrasena.
export function correoRestablecer({ nombre, enlace, minutos }) {
  return {
    asunto: 'Restablece tu contraseña · Sistema de Reservas UPA',
    texto: [
      `Hola ${nombre}:`,
      '',
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta en el',
      'Sistema de Reservas de la Universidad Politécnica de Aguascalientes.',
      '',
      'Abre este enlace para elegir una nueva contraseña:',
      enlace,
      '',
      `El enlace caduca en ${minutos} minutos y solo se puede usar una vez.`,
      '',
      'Si tú no pediste este cambio, ignora este mensaje: tu contraseña sigue igual.',
      `¿Dudas? Escríbenos a ${SOPORTE_EMAIL}.`,
    ].join('\n'),
  }
}
