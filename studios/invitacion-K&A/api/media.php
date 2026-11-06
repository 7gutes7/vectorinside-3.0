<?php
// Entrega de fotos de recuerdos.
// Las fotos aprobadas son públicas. Las pendientes u ocultas solo las ve quien tiene sesión en el panel.
$file = basename($_GET['file'] ?? '');
if (!preg_match('/^([a-f0-9]{32})\.jpg$/i', $file, $m)) {
    http_response_code(404);
    exit('No encontrado.');
}
$photoId = strtolower($m[1]);

$path = __DIR__ . '/data/photos/' . $photoId . '.jpg';
$dbFile = __DIR__ . '/data/wedding.sqlite3';
if (!is_file($path) || !is_file($dbFile)) {
    http_response_code(404);
    exit('Foto no encontrada.');
}

$allowed = false;
$private = true;
try {
    $db = new PDO('sqlite:' . $dbFile, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $stmt = $db->prepare('SELECT status FROM photos WHERE id = ?');
    $stmt->execute([$photoId]);
    $status = $stmt->fetchColumn();

    if ($status === 'approved') {
        $allowed = true;
        $private = false;
    } elseif ($status !== false) {
        $cookie = $_COOKIE['ka_admin'] ?? '';
        if (is_string($cookie) && strlen($cookie) >= 16) {
            $s = $db->prepare('SELECT 1 FROM sessions WHERE token = ? AND expires > ?');
            $s->execute([$cookie, time()]);
            $allowed = (bool)$s->fetchColumn();
        }
    }
} catch (Exception $e) {
    $allowed = false;
}

if (!$allowed) {
    http_response_code(404);
    exit('Foto no encontrada.');
}

header('Content-Type: image/jpeg');
header($private ? 'Cache-Control: private, no-store' : 'Cache-Control: public, max-age=86400');
header('Content-Length: ' . filesize($path));
header('X-Content-Type-Options: nosniff');
readfile($path);
exit;
