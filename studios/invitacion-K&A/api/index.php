<?php
/**
 * API en PHP para la invitación Karina & Alexis (Vector Inside).
 * Maneja confirmaciones (RSVP), recuerdos (fotos) y el panel privado de organizadores.
 * Funciona en hosting compartido con PHP 8+ (PDO SQLite y GD).
 */

define('KA_API', true);
require_once __DIR__ . '/mail.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: no-store, no-cache, must-revalidate');

// Hash bcrypt de la contraseña del panel. La contraseña NO se guarda en el código.
// Para cambiarla, genera otro hash:  php -r "echo password_hash('NUEVA-CONTRASEÑA', PASSWORD_BCRYPT, ['cost'=>12]);"
$ADMIN_PASSWORD_HASH = '$2y$12$EWVvRZIkb5VVh9xxrxVbNur0PcV4/R93/Jp3vxFYJoB9nSDaEz.EW';

// Límites
const KA_RSVP_PER_HOUR = 30;      // confirmaciones por IP y hora
const KA_PHOTOS_PER_HOUR = 20;    // fotos por IP y hora
const KA_LOGIN_FAILS = 10;        // intentos fallidos de login por IP en 15 minutos
const KA_MAX_EMAILS_PER_RSVP = 5; // correos de confirmación por invitado

// Carpeta de datos (protegida por api/data/.htaccess)
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$photosDir = $dataDir . '/photos';
if (!is_dir($photosDir)) {
    @mkdir($photosDir, 0755, true);
}

function send_json($status, $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function ensure_column(PDO $db, string $table, string $column, string $definition): void
{
    foreach ($db->query("PRAGMA table_info($table)")->fetchAll() as $col) {
        if ($col['name'] === $column) {
            return;
        }
    }
    $db->exec("ALTER TABLE $table ADD COLUMN $column $definition");
}

try {
    $db = new PDO('sqlite:' . $dataDir . '/wedding.sqlite3', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
    ]);

    $db->exec("
        CREATE TABLE IF NOT EXISTS rsvps (
            id TEXT PRIMARY KEY,
            edit_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            attendance TEXT NOT NULL,
            companions INTEGER NOT NULL,
            updated INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS photos (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            caption TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            csrf TEXT NOT NULL,
            expires INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ip_limits (
            ip TEXT,
            created INTEGER
        );
    ");

    // Migraciones: conservan los datos que ya existan.
    ensure_column($db, 'rsvps', 'email', "TEXT NOT NULL DEFAULT ''");
    ensure_column($db, 'rsvps', 'phone', "TEXT NOT NULL DEFAULT ''");
    ensure_column($db, 'rsvps', 'notes', "TEXT NOT NULL DEFAULT ''");
    ensure_column($db, 'rsvps', 'created', 'INTEGER NOT NULL DEFAULT 0');
    ensure_column($db, 'rsvps', 'email_sent', 'INTEGER NOT NULL DEFAULT 0');
    ensure_column($db, 'ip_limits', 'kind', "TEXT NOT NULL DEFAULT 'photo'");
} catch (Exception $e) {
    send_json(500, ['error' => 'No se pudo inicializar la base de datos.']);
}

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------

function get_json_input()
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function count_hits(PDO $db, string $kind, int $seconds): int
{
    $stmt = $db->prepare('SELECT COUNT(*) AS total FROM ip_limits WHERE ip = ? AND kind = ? AND created > ?');
    $stmt->execute([client_ip(), $kind, time() - $seconds]);
    return (int)$stmt->fetch()['total'];
}

function add_hit(PDO $db, string $kind): void
{
    $stmt = $db->prepare('INSERT INTO ip_limits (ip, created, kind) VALUES (?, ?, ?)');
    $stmt->execute([client_ip(), time(), $kind]);
}

function get_current_session($db)
{
    $cookieToken = $_COOKIE['ka_admin'] ?? '';
    if (empty($cookieToken) || !is_string($cookieToken) || strlen($cookieToken) < 16) {
        return null;
    }
    $stmt = $db->prepare('SELECT token, csrf, expires FROM sessions WHERE token = ? AND expires > ?');
    $stmt->execute([$cookieToken, time()]);
    return $stmt->fetch() ?: null;
}

/** Exige sesión de administrador y token CSRF válido. Devuelve la sesión. */
function require_admin_write(PDO $db): array
{
    $session = get_current_session($db);
    if (!$session) {
        send_json(401, ['error' => 'Vuelve a iniciar sesión.']);
    }
    $clientCsrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($session['csrf'], $clientCsrf)) {
        send_json(403, ['error' => 'Actualiza el panel e intenta de nuevo.']);
    }
    return $session;
}

function is_secure_https()
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
        || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
}

function clean_text(string $value, int $limit): string
{
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr(trim($value), 0, $limit);
}

// ---------------------------------------------------------------
// Ruta solicitada
// ---------------------------------------------------------------
$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
if (empty($route)) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#/api/(.*)$#', $uriPath, $matches)) {
        $route = $matches[1];
    }
}
$route = trim(trim($route), '/');
$route = preg_replace('#^api/#', '', $route);

// Limpieza periódica (1 de cada 20 peticiones)
if (mt_rand(1, 20) === 1) {
    @$db->exec('DELETE FROM sessions WHERE expires <= ' . time());
    @$db->exec('DELETE FROM ip_limits WHERE created < ' . (time() - 3600));
}

// ---------------------------------------------------------------
// Endpoints públicos
// ---------------------------------------------------------------

// GET photos: fotos aprobadas para la galería
if ($method === 'GET' && $route === 'photos') {
    $stmt = $db->query("SELECT id, name, caption FROM photos WHERE status = 'approved' ORDER BY created DESC LIMIT 150");
    send_json(200, ['photos' => $stmt->fetchAll()]);
}

// POST rsvp: confirmación de asistencia (correo, teléfono y comentarios son opcionales)
if ($method === 'POST' && $route === 'rsvp') {
    $input = get_json_input();

    // Campo trampa para bots: las personas no lo ven ni lo llenan.
    if (!empty($input['website'])) {
        send_json(200, ['reference' => 'KA-' . strtoupper(bin2hex(random_bytes(3))), 'companions' => 0, 'emailStatus' => 'none']);
    }

    if (count_hits($db, 'rsvp', 3600) >= KA_RSVP_PER_HOUR) {
        send_json(429, ['error' => 'Recibimos muchas respuestas desde esta conexión. Intenta de nuevo en un rato.']);
    }

    $name = clean_text((string)($input['name'] ?? ''), 80);
    $attendance = (string)($input['attendance'] ?? '');
    $companions = (int)($input['companions'] ?? 0);
    $token = (string)($input['editToken'] ?? '');

    if ($name === '' || !in_array($attendance, ['yes', 'no'], true) || $companions < 0 || $companions > 20) {
        send_json(400, ['error' => 'Datos de confirmación no válidos.']);
    }
    if ($attendance === 'no') {
        $companions = 0;
    }
    if (strlen($token) < 16 || strlen($token) > 128) {
        send_json(400, ['error' => 'Token de edición no válido.']);
    }

    // Campos opcionales: si vienen mal escritos se ignoran, no bloquean la confirmación.
    $emailStatus = 'none';
    $email = mb_strtolower(trim((string)($input['email'] ?? '')));
    if ($email !== '') {
        if (strlen($email) > 120 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $email = '';
            $emailStatus = 'invalid';
        }
    }
    $phone = trim((string)($input['phone'] ?? ''));
    $phone = trim(preg_replace('/[^0-9+()\-\s.]/', '', $phone) ?? '');
    $phone = mb_substr($phone, 0, 25);
    $digits = strlen(preg_replace('/\D/', '', $phone) ?? '');
    if ($digits < 7 || $digits > 15) {
        $phone = '';
    }
    $notes = clean_text((string)($input['notes'] ?? ''), 300);

    $digest = hash('sha256', $token);
    $now = time();

    $stmt = $db->prepare('SELECT id, email, attendance, companions, email_sent FROM rsvps WHERE edit_hash = ?');
    $stmt->execute([$digest]);
    $existing = $stmt->fetch();

    $ref = $existing ? $existing['id'] : ('KA-' . strtoupper(bin2hex(random_bytes(3))));

    // Un campo opcional vacío no borra lo que el invitado ya había enviado.
    $upsert = $db->prepare("
        INSERT INTO rsvps (id, edit_hash, name, attendance, companions, updated, email, phone, notes, created)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            attendance = excluded.attendance,
            companions = excluded.companions,
            updated = excluded.updated,
            email = CASE WHEN excluded.email <> '' THEN excluded.email ELSE rsvps.email END,
            phone = CASE WHEN excluded.phone <> '' THEN excluded.phone ELSE rsvps.phone END,
            notes = CASE WHEN excluded.notes <> '' THEN excluded.notes ELSE rsvps.notes END
    ");
    $upsert->execute([$ref, $digest, $name, $attendance, $companions, $now, $email, $phone, $notes, $now]);
    add_hit($db, 'rsvp');

    // Correo de confirmación: solo si dejó correo válido y algo relevante cambió.
    $targetEmail = $email !== '' ? $email : (string)($existing['email'] ?? '');
    if ($targetEmail !== '') {
        $changed = !$existing
            || $existing['email'] !== $targetEmail
            || $existing['attendance'] !== $attendance
            || (int)$existing['companions'] !== $companions;
        $sentSoFar = (int)($existing['email_sent'] ?? 0);
        if ($changed && $sentSoFar < KA_MAX_EMAILS_PER_RSVP) {
            $ok = ka_send_confirmation_email($targetEmail, $name, $attendance, $companions, $ref);
            $emailStatus = $ok ? 'sent' : 'failed';
            if ($ok) {
                $db->prepare('UPDATE rsvps SET email_sent = email_sent + 1 WHERE id = ?')->execute([$ref]);
            }
        } elseif ($emailStatus === 'none') {
            $emailStatus = 'already';
        }
    }

    send_json(200, [
        'reference' => $ref,
        'companions' => $companions,
        'emailStatus' => $emailStatus,
    ]);
}

// POST photos: subida de foto de recuerdo (queda pendiente de revisión)
if ($method === 'POST' && $route === 'photos') {
    $input = get_json_input();
    $name = clean_text((string)($input['name'] ?? ''), 80);
    $caption = clean_text((string)($input['caption'] ?? ''), 240);
    $consent = !empty($input['consent']);
    $encoded = (string)($input['image'] ?? '');

    if (!$consent || $name === '' || $caption === '') {
        send_json(400, ['error' => 'Completa todos los campos y autoriza compartir la foto.']);
    }
    if (count_hits($db, 'photo', 3600) >= KA_PHOTOS_PER_HOUR) {
        send_json(429, ['error' => 'Ya recibimos varias fotos desde esta conexión. Intenta más tarde.']);
    }
    if ($encoded === '' || strlen($encoded) > 11000000) {
        send_json(400, ['error' => 'El archivo supera el tamaño permitido.']);
    }

    $raw = base64_decode($encoded, true);
    if (!$raw || strlen($raw) > 8000000) {
        send_json(400, ['error' => 'Imagen no válida o dañada.']);
    }

    $photoId = bin2hex(random_bytes(16));
    $photoFile = $photosDir . '/' . $photoId . '.jpg';

    if (function_exists('imagecreatefromstring')) {
        $source = @imagecreatefromstring($raw);
        if (!$source) {
            send_json(400, ['error' => 'Formato no compatible (usa JPG, PNG o WebP).']);
        }
        $w = imagesx($source);
        $h = imagesy($source);
        $maxDim = 1800;
        if ($w > $maxDim || $h > $maxDim) {
            $scale = min($maxDim / $w, $maxDim / $h);
            $dest = imagecreatetruecolor((int)($w * $scale), (int)($h * $scale));
            imagecopyresampled($dest, $source, 0, 0, 0, 0, (int)($w * $scale), (int)($h * $scale), $w, $h);
            imagejpeg($dest, $photoFile, 85);
            imagedestroy($dest);
        } else {
            imagejpeg($source, $photoFile, 85);
        }
        imagedestroy($source);
    } else {
        // Sin GD no se puede validar la imagen: se rechaza en lugar de guardar un archivo desconocido.
        send_json(500, ['error' => 'El servidor no puede procesar imágenes en este momento.']);
    }

    $insert = $db->prepare("INSERT INTO photos (id, name, caption, status, created) VALUES (?, ?, ?, 'pending', ?)");
    $insert->execute([$photoId, $name, $caption, time()]);
    add_hit($db, 'photo');

    send_json(201, ['ok' => true]);
}

// ---------------------------------------------------------------
// Endpoints del panel de organizadores
// ---------------------------------------------------------------

if ($method === 'GET' && $route === 'admin/session') {
    $session = get_current_session($db);
    send_json(200, [
        'authenticated' => ($session !== null),
        'csrf' => $session ? $session['csrf'] : null,
    ]);
}

if ($method === 'POST' && $route === 'admin/login') {
    if (count_hits($db, 'login', 900) >= KA_LOGIN_FAILS) {
        send_json(429, ['error' => 'Demasiados intentos. Espera 15 minutos.']);
    }
    $input = get_json_input();
    $password = (string)($input['password'] ?? '');

    if (!password_verify($password, $ADMIN_PASSWORD_HASH)) {
        add_hit($db, 'login');
        usleep(300000);
        send_json(401, ['error' => 'Contraseña incorrecta.']);
    }

    $token = bin2hex(random_bytes(24));
    $csrf = bin2hex(random_bytes(24));
    $expires = time() + 28800; // 8 horas
    $db->prepare('INSERT INTO sessions (token, csrf, expires) VALUES (?, ?, ?)')->execute([$token, $csrf, $expires]);

    setcookie('ka_admin', $token, [
        'expires' => $expires,
        'path' => '/',
        'domain' => '',
        'secure' => is_secure_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    send_json(200, ['csrf' => $csrf]);
}

if ($method === 'GET' && $route === 'admin/dashboard') {
    if (!get_current_session($db)) {
        send_json(401, ['error' => 'Inicia sesión para ver el panel.']);
    }

    $guests = $db->query(
        'SELECT id, name, email, phone, notes, attendance, companions, created, updated FROM rsvps ORDER BY updated DESC'
    )->fetchAll();
    $photos = $db->query('SELECT id, name, caption, status, created FROM photos ORDER BY created DESC')->fetchAll();

    $confirmed = 0;
    $companions = 0;
    $declined = 0;
    foreach ($guests as $g) {
        if ($g['attendance'] === 'yes') {
            $confirmed++;
            $companions += (int)$g['companions'];
        } else {
            $declined++;
        }
    }
    $pending = 0;
    foreach ($photos as $p) {
        if ($p['status'] === 'pending') {
            $pending++;
        }
    }

    send_json(200, [
        'totals' => [
            'confirmed' => $confirmed,
            'companions' => $companions,
            'people' => $confirmed + $companions,
            'pending' => $pending,
            'declined' => $declined,
        ],
        'guests' => $guests,
        'photos' => $photos,
    ]);
}

if ($method === 'POST' && $route === 'admin/logout') {
    $session = get_current_session($db);
    if ($session) {
        $db->prepare('DELETE FROM sessions WHERE token = ?')->execute([$session['token']]);
    }
    setcookie('ka_admin', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    send_json(200, ['ok' => true]);
}

if ($method === 'POST' && $route === 'admin/moderate') {
    require_admin_write($db);
    $input = get_json_input();
    $photoId = (string)($input['id'] ?? '');
    $status = (string)($input['status'] ?? '');
    if (!in_array($status, ['approved', 'hidden'], true) || !preg_match('/^[a-f0-9]{32}$/', $photoId)) {
        send_json(400, ['error' => 'Parámetros no válidos.']);
    }
    $stmt = $db->prepare('UPDATE photos SET status = ? WHERE id = ?');
    $stmt->execute([$status, $photoId]);
    send_json(200, ['ok' => ($stmt->rowCount() > 0)]);
}

if ($method === 'POST' && $route === 'admin/delete-photo') {
    require_admin_write($db);
    $input = get_json_input();
    $photoId = (string)($input['id'] ?? '');
    if (!preg_match('/^[a-f0-9]{32}$/', $photoId)) {
        send_json(400, ['error' => 'Parámetros no válidos.']);
    }
    $stmt = $db->prepare('DELETE FROM photos WHERE id = ?');
    $stmt->execute([$photoId]);
    $file = $photosDir . '/' . $photoId . '.jpg';
    if (is_file($file)) {
        @unlink($file);
    }
    send_json(200, ['ok' => ($stmt->rowCount() > 0)]);
}

if ($method === 'POST' && $route === 'admin/delete-guest') {
    require_admin_write($db);
    $input = get_json_input();
    $guestId = (string)($input['id'] ?? '');
    if (!preg_match('/^KA-[A-F0-9]{6}$/', $guestId)) {
        send_json(400, ['error' => 'Parámetros no válidos.']);
    }
    $stmt = $db->prepare('DELETE FROM rsvps WHERE id = ?');
    $stmt->execute([$guestId]);
    send_json(200, ['ok' => ($stmt->rowCount() > 0)]);
}

send_json(404, ['error' => 'Ruta de API no encontrada.']);
