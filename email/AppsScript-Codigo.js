/**
 * ============================================================================
 * VECTOR INSIDE — MICRO-BACKEND & MOTOR DE ENVÍO DE CORREOS (Google Apps Script)
 * ============================================================================
 *
 * INSTRUCCIONES DE INSTALACIÓN / ACTUALIZACIÓN:
 * 1. Abre tu proyecto en Google Apps Script (asociado a tu Google Sheet o en script.google.com).
 * 2. Reemplaza todo el contenido de Code.gs con este código completo.
 * 3. Haz clic en el botón "Implementar" (arriba a la derecha) > "Gestionar implementaciones".
 * 4. Haz clic en el ícono de lápiz (Editar) en tu implementación activa de Aplicación Web.
 * 5. En el selector de "Versión", selecciona "Nueva versión".
 * 6. Haz clic en "Implementar".
 *
 * NOTA: Para probar el envío de inmediato sin salir de Apps Script,
 * selecciona la función 'testEnvio' en el selector superior y haz clic en 'Ejecutar'.
 */

// ==================== CONFIGURACIÓN ====================
const CONFIG = {
  NOMBRE_REMITENTE: 'Vector Inside',
  CORREO_NOTIFICACIONES: 'contacto@vectorinside.com',
  NOMBRE_HOJA: 'Solicitudes', // Nombre de la pestaña en Google Sheets
  ASUNTO_CLIENTE: 'Recibimos tu solicitud — Vector Inside',
  URL_PLANTILLA_EXTERNA: 'https://vectorinside.com/email/solicitud-recibida.html',
  // Remitente del acuse: requiere que contacto@vectorinside.com esté agregado en Gmail como
  // "Enviar correo como" (Configuración > Cuentas e importación). Si no existe, sale desde la cuenta de Gmail.
  CORREO_REMITENTE: 'contacto@vectorinside.com'
};

// ==================== PLANTILLA HTML EMBEBIDA (FALLBACK INMEDIATO) ====================
const PLANTILLA_HTML_EMBEDDED = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Recibimos tu solicitud — Vector Inside</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>td,th,div,p,a,h1,h2,h3,span{font-family:Arial,Helvetica,sans-serif !important;}</style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
    body{margin:0;padding:0;width:100% !important;background:#050505;}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
    img{border:0;outline:none;text-decoration:none;display:block;-ms-interpolation-mode:bicubic;}
    a{text-decoration:none;}
    @media only screen and (max-width:620px){
      .container{width:100% !important;}
      .px{padding-left:22px !important;padding-right:22px !important;}
      .h1{font-size:26px !important;line-height:30px !important;}
      .step{display:block !important;width:100% !important;padding:0 0 14px 0 !important;}
      .btn a{display:block !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#050505;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#050505;">
    Recibimos tu solicitud, {{NOMBRE}}. Te contactaremos en menos de 24 horas hábiles.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="background:#050505;">
    <tr>
      <td align="center" style="padding:28px 12px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#0d0d0f;border:1px solid #1f1f24;">

          <!-- Línea superior morado → lima -->
          <tr>
            <td height="4" style="height:4px;line-height:4px;font-size:0;background:#c3f400;background-image:linear-gradient(90deg,#6f00be,#9d4edd 45%,#c3f400);">&nbsp;</td>
          </tr>

          <!-- Encabezado con fondo (imagen) -->
          <tr>
            <td style="padding:0;">
              <a href="https://vectorinside.com" target="_blank">
                <img src="https://vectorinside.com/email/header-solicitud.jpg" width="600" alt="Vector Inside" style="width:100%;max-width:600px;height:auto;background:#080808;color:#ffffff;font-family:Arial,sans-serif;font-size:20px;">
              </a>
            </td>
          </tr>

          <!-- Título -->
          <tr>
            <td class="px" style="padding:36px 44px 8px 44px;">
              <p style="margin:0 0 14px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:11px;letter-spacing:3px;color:#c3f400;font-weight:700;">SOLICITUD // RECIBIDA</p>
              <h1 class="h1" style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-weight:900;font-size:30px;line-height:34px;text-transform:uppercase;color:#ffffff;">
                Hola, {{NOMBRE}}.<br><span style="color:#9d4edd;">Ya estamos</span> en ello.
              </h1>
            </td>
          </tr>

          <!-- Mensaje -->
          <tr>
            <td class="px" style="padding:18px 44px 8px 44px;font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:24px;color:#d6d8cc;">
              <p style="margin:0 0 14px 0;">Gracias por confiar en <strong style="color:#ffffff;">Vector Inside</strong> para impulsar el crecimiento de <strong style="color:#c3f400;">{{EMPRESA}}</strong>.</p>
              <p style="margin:0;">Recibimos tu solicitud y nuestro equipo ya está revisando tu caso. En menos de <strong style="color:#ffffff;">24 horas hábiles</strong> te contactaremos por correo o WhatsApp con un diagnóstico inicial.</p>
            </td>
          </tr>

          <!-- Resumen de la solicitud -->
          <tr>
            <td class="px" style="padding:26px 44px 6px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#141418;border:1px solid #2a2a31;border-left:3px solid #9d4edd;">
                <tr>
                  <td style="padding:20px 22px 6px 22px;">
                    <p style="margin:0;font-family:'JetBrains Mono',Consolas,monospace;font-size:10px;letter-spacing:2.5px;color:#b57cf0;font-weight:700;">RESUMEN DE TU SOLICITUD</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 22px 20px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:20px;">
                      <tr>
                        <td width="120" valign="top" style="padding:7px 0;color:#8b8f7a;font-size:12px;">Folio</td>
                        <td valign="top" style="padding:7px 0;color:#ffffff;font-family:'JetBrains Mono',Consolas,monospace;font-weight:700;">{{FOLIO}}</td>
                      </tr>
                      <tr>
                        <td valign="top" style="padding:7px 0;color:#8b8f7a;font-size:12px;border-top:1px solid #23232a;">Fecha</td>
                        <td valign="top" style="padding:7px 0;color:#ffffff;border-top:1px solid #23232a;">{{FECHA}}</td>
                      </tr>
                      <tr>
                        <td valign="top" style="padding:7px 0;color:#8b8f7a;font-size:12px;border-top:1px solid #23232a;">Empresa</td>
                        <td valign="top" style="padding:7px 0;color:#ffffff;border-top:1px solid #23232a;">{{EMPRESA}}</td>
                      </tr>
                      <tr>
                        <td valign="top" style="padding:7px 0;color:#8b8f7a;font-size:12px;border-top:1px solid #23232a;">Servicios</td>
                        <td valign="top" style="padding:7px 0;color:#ffffff;border-top:1px solid #23232a;">{{SERVICIOS}}</td>
                      </tr>
                      <tr>
                        <td valign="top" style="padding:7px 0;color:#8b8f7a;font-size:12px;border-top:1px solid #23232a;">Tu desafío</td>
                        <td valign="top" style="padding:7px 0;color:#d6d8cc;font-style:italic;border-top:1px solid #23232a;">“{{DESAFIO}}”</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Qué sigue -->
          <tr>
            <td class="px" style="padding:30px 44px 4px 44px;">
              <p style="margin:0 0 16px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:10px;letter-spacing:2.5px;color:#c3f400;font-weight:700;">QUÉ SIGUE</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="step" width="33%" valign="top" style="padding-right:12px;">
                    <p style="margin:0 0 6px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:12px;color:#9d4edd;font-weight:700;">01 //</p>
                    <p style="margin:0 0 4px 0;font-family:'Montserrat',Arial,sans-serif;font-weight:800;font-size:13px;text-transform:uppercase;color:#ffffff;">Análisis</p>
                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:19px;color:#a9ad97;">Revisamos tu caso y detectamos dónde se pierden tus prospectos.</p>
                  </td>
                  <td class="step" width="33%" valign="top" style="padding:0 6px;">
                    <p style="margin:0 0 6px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:12px;color:#9d4edd;font-weight:700;">02 //</p>
                    <p style="margin:0 0 4px 0;font-family:'Montserrat',Arial,sans-serif;font-weight:800;font-size:13px;text-transform:uppercase;color:#ffffff;">Contacto</p>
                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:19px;color:#a9ad97;">Te escribimos en menos de 24 horas hábiles para conocerte.</p>
                  </td>
                  <td class="step" width="33%" valign="top" style="padding-left:12px;">
                    <p style="margin:0 0 6px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:12px;color:#9d4edd;font-weight:700;">03 //</p>
                    <p style="margin:0 0 4px 0;font-family:'Montserrat',Arial,sans-serif;font-weight:800;font-size:13px;text-transform:uppercase;color:#ffffff;">Propuesta</p>
                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:19px;color:#a9ad97;">Te presentamos una estrategia a la medida de tu negocio.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Botón -->
          <tr>
            <td class="px" align="left" style="padding:28px 44px 36px 44px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn">
                <tr>
                  <td align="center" bgcolor="#c3f400" style="background:#c3f400;border-radius:999px;">
                    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://wa.me/525549184259" style="height:48px;v-text-anchor:middle;width:300px;" arcsize="50%" stroke="f" fillcolor="#c3f400"><w:anchorlock/><center style="color:#080808;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;">ADELANTAR POR WHATSAPP</center></v:roundrect><![endif]-->
                    <!--[if !mso]><!-- -->
                    <a href="https://wa.me/525549184259" target="_blank" style="display:inline-block;padding:15px 30px;font-family:'Montserrat',Arial,sans-serif;font-weight:900;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#080808;border-radius:999px;">Adelantar por WhatsApp &nbsp;↗</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0 0;font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:18px;color:#8b8f7a;">Si tienes algo que agregar, solo responde a este correo.</p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background:#08080a;border-top:1px solid #1f1f24;padding:26px 44px 28px 44px;" class="px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="padding-right:16px;">
                    <img src="https://vectorinside.com/email/isotipo-lima.png" width="34" height="48" alt="V" style="width:34px;height:48px;">
                  </td>
                  <td valign="middle" style="font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:19px;color:#8b8f7a;">
                    <strong style="color:#ffffff;font-family:'Montserrat',Arial,sans-serif;letter-spacing:1px;">VECTOR INSIDE</strong><br>
                    Agencia de marketing digital<br>
                    <a href="mailto:contacto@vectorinside.com" style="color:#c3f400;">contacto@vectorinside.com</a>
                    &nbsp;<span style="color:#9d4edd;">//</span>&nbsp;
                    <a href="tel:+525549184259" style="color:#c3f400;">+52 55 4918 4259</a><br>
                    <a href="https://vectorinside.com" style="color:#ffffff;">vectorinside.com</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;font-family:'Inter',Arial,sans-serif;font-size:10.5px;line-height:16px;color:#5d6052;">Recibiste este correo porque enviaste una solicitud en vectorinside.com. Usaremos tus datos únicamente para dar seguimiento a tu solicitud.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ==================== ENDPOINT POST (WEBHOOK) ====================
function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const resultado = procesarSolicitud(data);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      folio: resultado.folio,
      message: 'Solicitud procesada y correo enviado con éxito'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== ENDPOINT GET (HEALTH CHECK) ====================
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    servicio: 'Vector Inside - Webhook y Motor de Correos',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== LÓGICA PRINCIPAL DE PROCESAMIENTO ====================
function procesarSolicitud(data) {
  const now = new Date();
  const nombreCompleto = (data.name || data.nombre || 'Emprendedor/a').trim();
  const primerNombre = nombreCompleto.split(/\s+/)[0] || 'Hola';
  const empresa = (data.company || data.empresa || '').trim();
  const correo = (data.email || data.correo || '').trim();
  const telefono = (data.phone || data.telefono || '').trim();
  const origen = (data.origen || 'web').trim();
  const desafio = (data.challenge || data.desafio || 'Sin especificar').trim();
  const diagnostico = (data.diagnostico || '').trim();

  // Servicios formateados
  let serviciosStr = '';
  if (Array.isArray(data.services)) {
    serviciosStr = data.services.join(', ');
  } else if (Array.isArray(data.servicios)) {
    serviciosStr = data.servicios.join(', ');
  } else {
    serviciosStr = data.services || data.servicios || 'Estrategia Digital Integral';
  }

  // Generar Folio
  const folio = generarFolio(now);
  const fechaTexto = formatearFechaEspanol(now);
  const horaTexto = Utilities.formatDate(now, 'America/Mexico_City', 'HH:mm:ss');

  // 1. Guardar en Google Sheets
  try {
    guardarEnGoogleSheet({
      folio,
      fecha: fechaTexto,
      hora: horaTexto,
      nombre: nombreCompleto,
      empresa: empresa || 'N/A',
      correo,
      telefono,
      servicios: serviciosStr,
      desafio,
      origen,
      diagnostico
    });
  } catch (sheetErr) {
    Logger.log('Aviso Google Sheets: ' + sheetErr.toString());
  }

  // 2. Construir plantilla HTML con reemplazo de variables
  const htmlParaProspecto = construirHtmlEmail({
    nombre: primerNombre,
    empresa: empresa || 'tu negocio',
    servicios: serviciosStr,
    desafio: desafio,
    folio: folio,
    fecha: fechaTexto
  });

  // 3. Enviar correo de confirmación al prospecto (HTML Formateado)
  if (correo && correo.indexOf('@') !== -1) {
    try {
      const opciones = {
        htmlBody: htmlParaProspecto,
        name: CONFIG.NOMBRE_REMITENTE,
        replyTo: CONFIG.CORREO_NOTIFICACIONES
      };
      const alias = obtenerAliasRemitente();
      if (alias) opciones.from = alias;
      GmailApp.sendEmail(correo, CONFIG.ASUNTO_CLIENTE, construirTextoPlano({
        nombre: primerNombre,
        empresa: empresa || 'tu negocio',
        servicios: serviciosStr,
        desafio: desafio,
        folio: folio,
        fecha: fechaTexto
      }), opciones);
      Logger.log('Correo enviado con éxito a: ' + correo);
    } catch (mailErr) {
      Logger.log('Error enviando con GmailApp, intentando MailApp: ' + mailErr.toString());
      MailApp.sendEmail({
        to: correo,
        subject: CONFIG.ASUNTO_CLIENTE,
        htmlBody: htmlParaProspecto,
        name: CONFIG.NOMBRE_REMITENTE,
        replyTo: CONFIG.CORREO_NOTIFICACIONES
      });
    }
  }

  // 4. Enviar notificación interna a la agencia (contacto@vectorinside.com)
  try {
    const asuntoAdmin = `⚡ Nueva Solicitud: ${nombreCompleto}${empresa ? ' (' + empresa + ')' : ''} [${folio}]`;
    const cuerpoAdmin = `
      <div style="font-family:Arial,sans-serif;padding:20px;background:#0d0d0f;color:#ffffff;">
        <h2 style="color:#c3f400;margin-top:0;">⚡ Nueva Solicitud Recibida en Vector Inside</h2>
        <table style="width:100%;max-width:600px;border-collapse:collapse;color:#d6d8cc;font-size:14px;">
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;width:130px;">Folio:</td><td style="color:#ffffff;font-weight:bold;">${folio}</td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Fecha y Hora:</td><td>${fechaTexto} — ${horaTexto}</td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Nombre:</td><td style="color:#ffffff;font-weight:bold;">${nombreCompleto}</td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Empresa:</td><td>${empresa || 'No especificada'}</td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Correo:</td><td><a href="mailto:${correo}" style="color:#c3f400;">${correo}</a></td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">WhatsApp:</td><td><a href="https://wa.me/${telefono.replace(/\D/g, '')}" style="color:#c3f400;">${telefono}</a></td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Servicios:</td><td>${serviciosStr}</td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Desafío:</td><td style="font-style:italic;">"${desafio}"</td></tr>
          <tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Origen:</td><td>${origen}</td></tr>
          ${diagnostico ? `<tr><td style="padding:6px 0;color:#9d4edd;font-weight:bold;">Diagnóstico:</td><td style="color:#c3f400;">${diagnostico}</td></tr>` : ''}
        </table>
      </div>
    `;

    GmailApp.sendEmail(CONFIG.CORREO_NOTIFICACIONES, asuntoAdmin, '', {
      htmlBody: cuerpoAdmin,
      name: 'Vector Inside — Leads'
    });
  } catch (adminErr) {
    Logger.log('Aviso notificación admin: ' + adminErr.toString());
  }

  return { folio, fecha: fechaTexto };
}

// ==================== CONSTRUCTOR DE HTML ====================
function construirHtmlEmail(params) {
  let template = PLANTILLA_HTML_EMBEDDED;

  // Intentar cargar la plantilla más reciente desde la web si está disponible
  try {
    const response = UrlFetchApp.fetch(CONFIG.URL_PLANTILLA_EXTERNA, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      const text = response.getContentText();
      if (text && text.indexOf('SOLICITUD // RECIBIDA') !== -1) {
        template = text;
      }
    }
  } catch (e) {
    // Si no hay acceso a internet o da timeout, usa PLANTILLA_HTML_EMBEDDED sin problemas
  }

  // Reemplazo seguro de variables
  return template
    .replace(/\{\{NOMBRE\}\}/g, escapeHtml(params.nombre))
    .replace(/\{\{EMPRESA\}\}/g, escapeHtml(params.empresa))
    .replace(/\{\{SERVICIOS\}\}/g, escapeHtml(params.servicios))
    .replace(/\{\{DESAFIO\}\}/g, escapeHtml(params.desafio))
    .replace(/\{\{FOLIO\}\}/g, escapeHtml(params.folio))
    .replace(/\{\{FECHA\}\}/g, escapeHtml(params.fecha));
}

// ==================== VERSIÓN EN TEXTO PLANO (mejora la entrega y evita spam) ====================
function construirTextoPlano(p) {
  return [
    'Hola, ' + p.nombre + '. Ya estamos en ello.',
    '',
    'Gracias por confiar en Vector Inside para impulsar el crecimiento de ' + p.empresa + '.',
    'Recibimos tu solicitud y en menos de 24 horas hábiles te contactaremos por correo o WhatsApp.',
    '',
    'RESUMEN DE TU SOLICITUD',
    'Folio: ' + p.folio,
    'Fecha: ' + p.fecha,
    'Empresa: ' + p.empresa,
    'Servicios: ' + p.servicios,
    'Tu desafío: ' + p.desafio,
    '',
    '¿Quieres adelantar? Escríbenos por WhatsApp: https://wa.me/525549184259',
    '',
    'Vector Inside — Agencia de marketing digital',
    'contacto@vectorinside.com // +52 55 4918 4259',
    'https://vectorinside.com'
  ].join('\n');
}

// Devuelve contacto@vectorinside.com solo si ya está configurado como alias en Gmail
function obtenerAliasRemitente() {
  try {
    const aliases = GmailApp.getAliases();
    for (let i = 0; i < aliases.length; i++) {
      if (aliases[i].toLowerCase() === CONFIG.CORREO_REMITENTE.toLowerCase()) return aliases[i];
    }
  } catch (e) {}
  return null;
}

// ==================== HELPERS ====================
function generarFolio(date) {
  const yy = Utilities.formatDate(date, 'America/Mexico_City', 'yy');
  const mm = Utilities.formatDate(date, 'America/Mexico_City', 'MM');
  const dd = Utilities.formatDate(date, 'America/Mexico_City', 'dd');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `VI-${yy}${mm}${dd}-${randomNum}`;
}

function formatearFechaEspanol(date) {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const dia = Utilities.formatDate(date, 'America/Mexico_City', 'd');
  const mesIdx = parseInt(Utilities.formatDate(date, 'America/Mexico_City', 'M'), 10) - 1;
  const anio = Utilities.formatDate(date, 'America/Mexico_City', 'yyyy');
  return `${dia} de ${meses[mesIdx]} de ${anio}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function guardarEnGoogleSheet(registro) {
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}

  if (!ss) return;

  let sheet = ss.getSheetByName(CONFIG.NOMBRE_HOJA);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.NOMBRE_HOJA);
    sheet.appendRow([
      'Folio', 'Fecha', 'Hora', 'Nombre', 'Empresa', 'Correo',
      'WhatsApp', 'Servicios', 'Desafío', 'Origen', 'Diagnóstico'
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1f1f24').setFontColor('#c3f400');
  }

  sheet.appendRow([
    registro.folio,
    registro.fecha,
    registro.hora,
    registro.nombre,
    registro.empresa,
    registro.correo,
    registro.telefono,
    registro.servicios,
    registro.desafio,
    registro.origen,
    registro.diagnostico
  ]);
}

// ==================== FUNCIÓN DE PRUEBA RÁPIDA ====================
function testEnvio() {
  const resultado = procesarSolicitud({
    name: 'Mariana López',
    company: 'Café Origen',
    email: 'contacto@vectorinside.com', // Cambia este correo por el tuyo para recibir la prueba
    phone: '+52 55 4918 4259',
    services: ['Campañas de marketing', 'Automatización de sistema de ventas'],
    challenge: 'Recibimos muchos mensajes por Instagram, pero pocos terminan en venta.',
    origen: 'prueba-manual'
  });
  Logger.log('Prueba finalizada con folio: ' + resultado.folio);
}
