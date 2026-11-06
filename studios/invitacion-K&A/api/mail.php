<?php
/**
 * Correo de confirmación para invitados (Karina & Alexis · Vector Inside).
 * Solo define funciones: no se ejecuta por sí solo.
 */
if (!defined('KA_API')) {
    http_response_code(403);
    exit;
}

const KA_MAIL_FROM = 'contacto@vectorinside.com';
const KA_MAIL_FROM_NAME = 'Karina & Alexis';
const KA_SITE_ORIGIN = 'https://vectorinside.com';
const KA_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Alboreto%20Residencial%20Ali%20Chumacero%201000%20Metepec&query_place_id=ChIJq13C7TKLzYURUTEebuCBcDM';
const KA_WHATSAPP_URL = 'https://wa.me/527226478130';
const KA_WHATSAPP_LABEL = '+52 722 647 81 30';

/** URL pública de la invitación. El dominio es fijo; solo la ruta sale de la carpeta donde vive la API. */
function ka_invitation_url(): string
{
    $dir = dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/studios/invitacion-K&A/api/index.php'));
    $segments = array_map('rawurlencode', array_filter(explode('/', $dir), 'strlen'));
    return KA_SITE_ORIGIN . '/' . implode('/', $segments) . '/';
}

function ka_h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Arma asunto, HTML y texto plano.
 * @return array{0:string,1:string,2:string}
 */
function ka_build_confirmation_email(string $name, string $attendance, int $companions, string $ref, string $inviteUrl): array
{
    $first = trim(explode(' ', trim($name))[0] ?? $name);
    $nameH = ka_h($name);
    $firstH = ka_h($first !== '' ? $first : $name);
    $refH = ka_h($ref);
    $urlH = ka_h($inviteUrl . '#asistencia');
    $mapsH = ka_h(KA_MAPS_URL);
    $waH = ka_h(KA_WHATSAPP_URL);
    $waLabel = ka_h(KA_WHATSAPP_LABEL);
    $total = $companions + 1;

    $navy = '#102642';
    $gold = '#b18b4d';
    $ivory = '#f8f5ee';
    $serif = "Georgia,'Times New Roman',serif";
    $sans = "'Helvetica Neue',Helvetica,Arial,sans-serif";

    if ($attendance === 'yes') {
        $subject = 'Tu asistencia está confirmada · Karina & Alexis · 21 de noviembre';
        $preheader = 'Te esperamos el 21 de noviembre de 2026 en Metepec. Tu referencia: ' . $ref;
        $title = '¡Gracias por confirmar, ' . $firstH . '!';
        $lead = 'Nos hace muchísima ilusión que nos acompañes. Aquí tienes el resumen de tu confirmación y los datos de la celebración.';
        $companionsLabel = $companions === 1 ? '1 acompañante' : $companions . ' acompañantes';
        $summary = '
          <tr><td style="padding:26px 30px 8px 30px;font-family:' . $sans . ';">
            <p style="margin:0;font-size:10px;letter-spacing:2px;color:' . $gold . ';">TU CONFIRMACIÓN</p>
            <p style="margin:10px 0 0 0;font-family:' . $serif . ';font-size:30px;line-height:1.2;color:' . $navy . ';letter-spacing:1px;">' . $refH . '</p>
            <p style="margin:6px 0 0 0;font-size:12px;color:#5d6b80;">Guarda esta referencia: es la que ven los organizadores en su lista.</p>
          </td></tr>
          <tr><td style="padding:14px 30px 6px 30px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3d9c2;font-family:' . $sans . ';font-size:14px;color:' . $navy . ';">
              <tr><td style="padding:12px 0;border-bottom:1px solid #e3d9c2;color:#5d6b80;">Invitado</td><td align="right" style="padding:12px 0;border-bottom:1px solid #e3d9c2;font-weight:600;">' . $nameH . '</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #e3d9c2;color:#5d6b80;">Respuesta</td><td align="right" style="padding:12px 0;border-bottom:1px solid #e3d9c2;font-weight:600;">Sí, ahí estaré</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #e3d9c2;color:#5d6b80;">Acompañantes</td><td align="right" style="padding:12px 0;border-bottom:1px solid #e3d9c2;font-weight:600;">' . ka_h($companionsLabel) . '</td></tr>
              <tr><td style="padding:12px 0;color:#5d6b80;">Lugares en total</td><td align="right" style="padding:12px 0;font-weight:600;">' . $total . '</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:22px 30px 6px 30px;font-family:' . $sans . ';">
            <p style="margin:0 0 12px 0;font-size:10px;letter-spacing:2px;color:' . $gold . ';">LA CELEBRACIÓN</p>
            <p style="margin:0 0 10px 0;font-size:14px;line-height:1.7;color:' . $navy . ';"><strong>Sábado 21 de noviembre de 2026</strong><br>Recepción · 1:00 p. m.<br>Ceremonia · 2:00 p. m.</p>
            <p style="margin:0 0 10px 0;font-size:14px;line-height:1.7;color:' . $navy . ';">Salón de eventos de Residencial Alboreto<br>Calle Ali Chumacero 1000, San Lorenzo Coacalco,<br>CP 52140, Metepec, Estado de México</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:' . $navy . ';">Vestimenta formal. Hombres, por favor eviten el azul marino.</p>
          </td></tr>
          <tr><td align="center" style="padding:26px 30px 8px 30px;">
            <a href="' . $mapsH . '" style="display:inline-block;background:' . $navy . ';color:#f5deb0;border:1px solid ' . $gold . ';padding:16px 26px;font-family:' . $sans . ';font-size:11px;font-weight:600;letter-spacing:1.6px;text-decoration:none;">VER UBICACIÓN EN GOOGLE MAPS</a>
          </td></tr>
          <tr><td align="center" style="padding:6px 30px 26px 30px;font-family:' . $sans . ';font-size:12px;">
            <a href="' . $urlH . '" style="color:#715522;text-decoration:underline;">Abrir la invitación o cambiar mi respuesta</a>
          </td></tr>';

        $text = "¡Gracias por confirmar, $first!\n\n"
            . "Nos hace muchísima ilusión que nos acompañes.\n\n"
            . "TU CONFIRMACIÓN\nReferencia: $ref\nInvitado: $name\nRespuesta: Sí, ahí estaré\nAcompañantes: $companions\nLugares en total: $total\n\n"
            . "LA CELEBRACIÓN\nSábado 21 de noviembre de 2026\nRecepción: 1:00 p. m.\nCeremonia: 2:00 p. m.\n"
            . "Salón de eventos de Residencial Alboreto\nCalle Ali Chumacero 1000, San Lorenzo Coacalco, CP 52140, Metepec, Estado de México\n"
            . "Vestimenta formal. Hombres, por favor eviten el azul marino.\n\n"
            . "Ubicación: " . KA_MAPS_URL . "\nInvitación: {$inviteUrl}#asistencia\n";
    } else {
        $subject = 'Gracias por avisarnos · Karina & Alexis';
        $preheader = 'Recibimos tu respuesta. Si cambian tus planes, puedes actualizarla.';
        $title = 'Gracias por avisarnos, ' . $firstH;
        $lead = 'Lamentamos que esta vez no puedas acompañarnos, pero agradecemos mucho que nos lo hayas hecho saber. Te llevamos en el corazón ese día.';
        $summary = '
          <tr><td style="padding:22px 30px 6px 30px;font-family:' . $sans . ';">
            <p style="margin:0 0 6px 0;font-size:10px;letter-spacing:2px;color:' . $gold . ';">TU RESPUESTA</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:' . $navy . ';">Referencia <strong>' . $refH . '</strong> · No podrás asistir.</p>
            <p style="margin:14px 0 0 0;font-size:13px;line-height:1.7;color:#5d6b80;">Si tus planes cambian, puedes actualizar tu respuesta desde la invitación.</p>
          </td></tr>
          <tr><td align="center" style="padding:22px 30px 26px 30px;">
            <a href="' . $urlH . '" style="display:inline-block;background:' . $navy . ';color:#f5deb0;border:1px solid ' . $gold . ';padding:16px 26px;font-family:' . $sans . ';font-size:11px;font-weight:600;letter-spacing:1.6px;text-decoration:none;">ABRIR LA INVITACIÓN</a>
          </td></tr>';

        $text = "Gracias por avisarnos, $first.\n\n"
            . "Lamentamos que esta vez no puedas acompañarnos. Te llevamos en el corazón ese día.\n\n"
            . "Referencia: $ref\nRespuesta: No podrás asistir\n\n"
            . "Si tus planes cambian, puedes actualizar tu respuesta aquí: {$inviteUrl}#asistencia\n";
    }

    $text .= "\n¿Dudas? Escríbeles por WhatsApp: " . KA_WHATSAPP_LABEL . " (" . KA_WHATSAPP_URL . ")\n\n"
        . "Un detalle de Vector Inside · vectorinside.com\n"
        . "Recibes este correo porque indicaste tu correo al responder la invitación. Si no fuiste tú, puedes ignorarlo.\n";

    $html = '<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>' . ka_h($subject) . '</title></head>
<body style="margin:0;padding:0;background:' . $ivory . ';">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:' . $ivory . ';">' . ka_h($preheader) . '</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' . $ivory . ';">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e3d9c2;">
    <tr><td align="center" style="background:' . $navy . ';padding:38px 30px 34px 30px;">
      <p style="margin:0;font-family:' . $sans . ';font-size:10px;letter-spacing:3px;color:#d9c79f;">NOS CASAMOS</p>
      <p style="margin:14px 0 0 0;font-family:' . $serif . ';font-size:44px;line-height:1.1;color:#fff8e9;font-style:italic;">Karina &amp; Alexis</p>
      <p style="margin:16px 0 0 0;font-family:' . $sans . ';font-size:10px;letter-spacing:3px;color:#d9c79f;">21 · NOVIEMBRE · 2026 · METEPEC</p>
    </td></tr>
    <tr><td style="padding:34px 30px 8px 30px;font-family:' . $sans . ';">
      <h1 style="margin:0;font-family:' . $serif . ';font-weight:normal;font-size:29px;line-height:1.25;color:' . $navy . ';">' . $title . '</h1>
      <p style="margin:14px 0 0 0;font-size:14px;line-height:1.8;color:#42536c;">' . $lead . '</p>
    </td></tr>
    ' . $summary . '
    <tr><td align="center" style="padding:30px 30px 8px 30px;font-family:' . $sans . ';font-size:12px;line-height:1.7;color:#5d6b80;border-top:1px solid #efe7d4;">
      <span style="display:block;margin-top:24px;">¿Dudas? Escríbeles por WhatsApp al <a href="' . $waH . '" style="color:#715522;">' . $waLabel . '</a></span>
    </td></tr>
    <tr><td align="center" style="padding:22px 30px 30px 30px;font-family:' . $sans . ';font-size:10px;line-height:1.7;color:#8b95a5;">
      Un detalle de <a href="https://vectorinside.com" style="color:#8b95a5;">Vector Inside</a><br>
      Recibes este correo porque indicaste tu correo al responder la invitación. Si no fuiste tú, puedes ignorarlo.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>';

    return [$subject, $html, $text];
}

/** Envía el correo (multipart texto + HTML). Devuelve true si el servidor aceptó el mensaje. */
function ka_send_confirmation_email(string $to, string $name, string $attendance, int $companions, string $ref): bool
{
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    [$subject, $html, $text] = ka_build_confirmation_email($name, $attendance, $companions, $ref, ka_invitation_url());

    $boundary = 'ka_' . bin2hex(random_bytes(12));
    $fromName = '=?UTF-8?B?' . base64_encode(KA_MAIL_FROM_NAME) . '?=';
    $headers = [
        'From: ' . $fromName . ' <' . KA_MAIL_FROM . '>',
        'Reply-To: ' . KA_MAIL_FROM,
        'MIME-Version: 1.0',
        'Message-ID: <' . bin2hex(random_bytes(10)) . '@vectorinside.com>',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];

    $body = '--' . $boundary . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n"
        . quoted_printable_encode($text) . "\r\n"
        . '--' . $boundary . "\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n"
        . quoted_printable_encode($html) . "\r\n"
        . '--' . $boundary . "--\r\n";

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return (bool)@mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}
