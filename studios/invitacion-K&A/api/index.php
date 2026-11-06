<?php
/**
 * API Backend en PHP para la Invitación Karina & Alexis (Vector Inside)
 * Maneja RSVP, recuerdos y panel administrativo privado.
 */

// Encabezados de seguridad y respuesta JSON
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: no-store, no-cache, must-revalidate');

// HASH BCRYPT de la contraseña requerida ("Karina&Alexis-26")
// No almacena la contraseña en texto claro ni la expone en el cliente.
$ADMIN_PASSWORD_HASH = '$2y$12$o29gzgB85spdoSChtLKZHeFlHh0FTn7sZ3YiIpnexJhBnoE09g8kC';

// Inicializar SQLite
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$photosDir = $dataDir . '/photos';
if (!is_dir($photosDir)) {
    @mkdir($photosDir, 0755, true);
}

try {
    $db = new PDO('sqlite:' . $dataDir . '/wedding.sqlite3', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10
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
} catch (Exception $e) {
    send_json(500, ['error' => 'No se pudo inicializar la base de datos local.']);
}

// Funciones de utilidad
function send_json($status, $data) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_json_input() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function get_current_session($db) {
    $cookieToken = $_COOKIE['ka_admin'] ?? '';
    if (empty($cookieToken) || !is_string($cookieToken) || strlen($cookieToken) < 16) {
        return null;
    }
    $now = time();
    $stmt = $db->prepare("SELECT token, csrf, expires FROM sessions WHERE token = ? AND expires > ?");
    $stmt->execute([$cookieToken, $now]);
    return $stmt->fetch() ?: null;
}

function is_secure_https() {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
        || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
}

// Determinar la ruta solicitada
$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
if (empty($route)) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#/api/(.*)$#', $uriPath, $matches)) {
        $route = $matches[1];
    }
}
$route = trim(trim($route), '/');

// Limpiar sesiones expiradas periódicamente (1 de cada 20 peticiones)
if (mt_rand(1, 20) === 1) {
    @$db->exec("DELETE FROM sessions WHERE expires <= " . time());
    @$db->exec("DELETE FROM ip_limits WHERE created < " . (time() - 3600));
}

// -------------------------------------------------------------
// ENPOINTS DE LA API
// -------------------------------------------------------------

// 1. GET /api/photos: Obtener fotos aprobadas para la galería
if ($method === 'GET' && ($route === 'photos' || $route === 'api/photos')) {
    $stmt = $db->query("SELECT id, name, caption FROM photos WHERE status = 'approved' ORDER BY created DESC LIMIT 150");
    send_json(200, ['photos' => $stmt->fetchAll()]);
}

// 2. GET /api/admin/session: Comprobar si hay sesión activa
if ($method === 'GET' && ($route === 'admin/session' || $route === 'api/admin/session')) {
    $session = get_current_session($db);
    send_json(200, [
        'authenticated' => ($session !== null),
        'csrf' => $session ? $session['csrf'] : null
    ]);
}

// 3. POST /api/admin/login: Iniciar sesión en el panel
if ($method === 'POST' && ($route === 'admin/login' || $route === 'api/admin/login')) {
    $input = get_json_input();
    $password = (string)($input['password'] ?? '');

    if (!password_verify($password, $ADMIN_PASSWORD_HASH)) {
        // Pausa ligera para prevenir ataques de fuerza bruta
        usleep(300000);
        send_json(401, ['error' => 'Contraseña incorrecta.']);
    }

    $token = bin2hex(random_bytes(24));
    $csrf = bin2hex(random_bytes(24));
    $expires = time() + 28800; // 8 horas

    $stmt = $db->prepare("INSERT INTO sessions (token, csrf, expires) VALUES (?, ?, ?)");
    $stmt->execute([$token, $csrf, $expires]);

    $cookieOptions = [
        'expires' => $expires,
        'path' => '/',
        'domain' => '',
        'secure' => is_secure_https(),
        'httponly' => true,
        'samesite' => 'Strict'
    ];
    setcookie('ka_admin', $token, $cookieOptions);

    send_json(200, ['csrf' => $csrf]);
}

// 4. GET /api/admin/dashboard: Datos del panel
if ($method === 'GET' && ($route === 'admin/dashboard' || $route === 'api/admin/dashboard')) {
    $session = get_current_session($db);
    if (!$session) {
        send_json(401, ['error' => 'Inicia sesión para ver el panel.']);
    }

    $guestsStmt = $db->query("SELECT id, name, attendance, companions FROM rsvps ORDER BY updated DESC");
    $guests = $guestsStmt->fetchAll();

    $photosStmt = $db->query("SELECT id, name, caption, status FROM photos ORDER BY created DESC");
    $photos = $photosStmt->fetchAll();

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
            'declined' => $declined
        ],
        'guests' => $guests,
        'photos' => $photos
    ]);
}

// 5. POST /api/admin/logout: Cerrar sesión
if ($method === 'POST' && ($route === 'admin/logout' || $route === 'api/admin/logout')) {
    $session = get_current_session($db);
    if ($session) {
        $stmt = $db->prepare("DELETE FROM sessions WHERE token = ?");
        $stmt->execute([$session['token']]);
    }
    setcookie('ka_admin', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    send_json(200, ['ok' => true]);
}

// 6. POST /api/admin/moderate: Aprobar u ocultar fotos
if ($method === 'POST' && ($route === 'admin/moderate' || $route === 'api/admin/moderate')) {
    $session = get_current_session($db);
    if (!$session) {
        send_json(401, ['error' => 'Vuelve a iniciar sesión.']);
    }

    $clientCsrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($session['csrf'], $clientCsrf)) {
        send_json(403, ['error' => 'Actualiza el panel e intenta de nuevo.']);
    }

    $input = get_json_input();
    $photoId = (string)($input['id'] ?? '');
    $status = (string)($input['status'] ?? '');

    if (!in_array($status, ['approved', 'hidden'], true) || empty($photoId)) {
        send_json(400, ['error' => 'Parámetros no válidos.']);
    }

    $stmt = $db->prepare("UPDATE photos SET status = ? WHERE id = ?");
    $stmt->execute([$status, $photoId]);

    send_json(200, ['ok' => ($stmt->rowCount() > 0)]);
}

// 7. POST /api/rsvp: Registro de asistencia de invitado
if ($method === 'POST' && ($route === 'rsvp' || $route === 'api/rsvp')) {
    $input = get_json_input();
    $name = trim((string)($input['name'] ?? ''));
    $attendance = (string)($input['attendance'] ?? '');
    $companions = (int)($input['companions'] ?? 0);
    $token = (string)($input['editToken'] ?? '');

    if (empty($name) || mb_strlen($name) > 80 || !in_array($attendance, ['yes', 'no'], true) || $companions < 0 || $companions > 20) {
        send_json(400, ['error' => 'Datos de confirmación no válidos.']);
    }
    if ($attendance === 'no') {
        $companions = 0;
    }
    if (empty($token) || strlen($token) < 16 || strlen($token) > 128) {
        send_json(400, ['error' => 'Token de edición no válido.']);
    }

    $digest = hash('sha256', $token);
    $now = time();

    // Comprobar si ya existe una respuesta vinculada a este token
    $stmt = $db->prepare("SELECT id FROM rsvps WHERE edit_hash = ?");
    $stmt->execute([$digest]);
    $existing = $stmt->fetch();

    $ref = $existing ? $existing['id'] : ('KA-' . strtoupper(bin2hex(random_bytes(3))));

    $upsert = $db->prepare("
        INSERT INTO rsvps (id, edit_hash, name, attendance, companions, updated)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            attendance = excluded.attendance,
            companions = excluded.companions,
            updated = excluded.updated
    ");
    $upsert->execute([$ref, $digest, $name, $attendance, $companions, $now]);

    send_json(200, [
        'reference' => $ref,
        'companions' => $companions
    ]);
}

// 8. POST /api/photos: Subida de foto de recuerdo
if ($method === 'POST' && ($route === 'photos' || $route === 'api/photos')) {
    $input = get_json_input();
    $name = trim((string)($input['name'] ?? ''));
    $caption = trim((string)($input['caption'] ?? ''));
    $consent = !empty($input['consent']);
    $encoded = (string)($input['image'] ?? '');

    if (!$consent || empty($name) || mb_strlen($name) > 80 || empty($caption) || mb_strlen($caption) > 240) {
        send_json(400, ['error' => 'Completa todos los campos y autoriza compartir la foto.']);
    }

    // Límite de tasa por IP: máximo 20 fotos por hora
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $oneHourAgo = time() - 3600;
    $rateCheck = $db->prepare("SELECT COUNT(*) as total FROM ip_limits WHERE ip = ? AND created > ?");
    $rateCheck->execute([$ip, $oneHourAgo]);
    if ((int)$rateCheck->fetch()['total'] >= 20) {
        send_json(429, ['error' => 'Ya recibimos varias fotos desde esta conexión. Intenta más tarde.']);
    }

    if (empty($encoded) || strlen($encoded) > 11000000) {
        send_json(400, ['error' => 'El archivo supera el tamaño permitido.']);
    }

    $raw = base64_decode($encoded, true);
    if (!$raw || strlen($raw) > 8000000) {
        send_json(400, ['error' => 'Imagen no válida o dañada.']);
    }

    // Procesar con GD si está disponible
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
            $newW = (int)($w * $scale);
            $newH = (int)($h * $scale);
            $dest = imagecreatetruecolor($newW, $newH);
            imagecopyresampled($dest, $source, 0, 0, 0, 0, $newW, $newH, $w, $h);
            imagejpeg($dest, $photoFile, 85);
            imagedestroy($dest);
        } else {
            imagejpeg($source, $photoFile, 85);
        }
        imagedestroy($source);
    } else {
        // Fallback: guardar binario directamente
        file_put_contents($photoFile, $raw);
    }

    $now = time();
    $insert = $db->prepare("INSERT INTO photos (id, name, caption, status, created) VALUES (?, ?, ?, 'pending', ?)");
    $insert->execute([$photoId, $name, $caption, $now]);

    $limitInsert = $db->prepare("INSERT INTO ip_limits (ip, created) VALUES (?, ?)");
    $limitInsert->execute([$ip, $now]);

    send_json(201, ['ok' => true]);
}

// Ruta no reconocida
send_json(404, ['error' => 'Ruta de API no encontrada.']);
