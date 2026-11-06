<?php
/**
 * Exportación de recuerdos aprobados: ZIP con fotos, Excel, CSV y álbum offline.
 * Solo define funciones: no se ejecuta por sí solo.
 *
 * El ZIP se escribe sin compresión (las fotos JPG ya vienen comprimidas) y en streaming,
 * por eso no depende de la extensión zip de PHP ni carga todas las fotos en memoria.
 */
if (!defined('KA_API')) {
    http_response_code(403);
    exit;
}

const KA_EXPORT_FOLDER = 'Recuerdos-Karina-Alexis';
const KA_EXPORT_HEADERS = ['N°', 'Código', 'Nombre de quien la subió', 'Mensaje', 'Fecha', 'Archivo'];
const KA_NO_CODE = 'SIN CÓDIGO';

/** Escritor ZIP sin compresión ("stored"), nombres en UTF-8. */
class KaZipWriter
{
    /** @var callable */
    private $out;
    private int $offset = 0;
    private array $entries = [];

    public function __construct(callable $out)
    {
        $this->out = $out;
    }

    private function emit(string $bytes): void
    {
        ($this->out)($bytes);
        $this->offset += strlen($bytes);
    }

    private static function dosTime(int $ts): array
    {
        $d = getdate($ts);
        if ($d['year'] < 1980) {
            $d = getdate(315532800);
        }
        $time = ($d['hours'] << 11) | ($d['minutes'] << 5) | intdiv($d['seconds'], 2);
        $date = (($d['year'] - 1980) << 9) | ($d['mon'] << 5) | $d['mday'];
        return [$time, $date];
    }

    private function begin(string $name, int $crc, int $size, int $ts): void
    {
        if (count($this->entries) >= 65000 || $size > 0xFFFFFFF0) {
            throw new RuntimeException('Demasiados archivos o archivo demasiado grande para el ZIP.');
        }
        [$time, $date] = self::dosTime($ts);
        $this->entries[] = ['name' => $name, 'crc' => $crc, 'size' => $size, 'time' => $time, 'date' => $date, 'offset' => $this->offset];
        $this->emit(pack('VvvvvvVVVvv', 0x04034b50, 20, 0x0800, 0, $time, $date, $crc, $size, $size, strlen($name), 0) . $name);
    }

    public function addString(string $name, string $data, ?int $ts = null): void
    {
        $crc = hexdec(hash('crc32b', $data));
        $this->begin($name, (int)$crc, strlen($data), $ts ?? time());
        $this->emit($data);
    }

    public function addFile(string $name, string $path): void
    {
        $size = (int)filesize($path);
        $crc = hexdec((string)hash_file('crc32b', $path));
        $handle = fopen($path, 'rb');
        if (!$handle) {
            throw new RuntimeException('No se pudo leer ' . $name);
        }
        $this->begin($name, (int)$crc, $size, (int)filemtime($path));
        $sent = 0;
        while (!feof($handle)) {
            $chunk = fread($handle, 1048576);
            if ($chunk === false || $chunk === '') {
                break;
            }
            $sent += strlen($chunk);
            $this->emit($chunk);
        }
        fclose($handle);
        if ($sent !== $size) {
            throw new RuntimeException('El archivo cambió mientras se descargaba: ' . $name);
        }
    }

    public function finish(): void
    {
        $cdStart = $this->offset;
        foreach ($this->entries as $e) {
            $this->emit(pack('VvvvvvvVVVvvvvvVV', 0x02014b50, 20, 20, 0x0800, 0, $e['time'], $e['date'], $e['crc'], $e['size'], $e['size'], strlen($e['name']), 0, 0, 0, 0, 0, $e['offset']) . $e['name']);
        }
        $cdSize = $this->offset - $cdStart;
        $count = count($this->entries);
        $this->emit(pack('VvvvvVVv', 0x06054b50, 0, 0, $count, $count, $cdSize, $cdStart, 0));
    }
}

function ka_xml(string $value): string
{
    $value = preg_replace('/[^\x{9}\x{A}\x{D}\x{20}-\x{D7FF}\x{E000}-\x{FFFD}\x{10000}-\x{10FFFF}]/u', '', $value) ?? '';
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

/** Nombre de archivo seguro y legible a partir del nombre de quien subió la foto. */
function ka_slug(string $name): string
{
    $s = $name;
    if (function_exists('transliterator_transliterate')) {
        $t = @transliterator_transliterate('Any-Latin; Latin-ASCII', $s);
        if (is_string($t)) {
            $s = $t;
        }
    }
    $s = strtr($s, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ü' => 'U', 'Ñ' => 'N',
    ]);
    $s = trim(preg_replace('/[^A-Za-z0-9]+/', '-', $s) ?? '', '-');
    $s = trim(substr($s, 0, 40), '-');
    return $s !== '' ? $s : 'invitado';
}

function ka_csv_cell(string $value): string
{
    if (preg_match('/^[=+\-@\t\r]/', $value)) {
        $value = "'" . $value;
    }
    return '"' . str_replace('"', '""', $value) . '"';
}

/**
 * @param array<int,array{n:int,code:string,name:string,caption:string,date:string,file:string}> $items
 */
function ka_build_csv(array $items): string
{
    $lines = [implode(',', array_map('ka_csv_cell', KA_EXPORT_HEADERS))];
    foreach ($items as $it) {
        $lines[] = implode(',', array_map('ka_csv_cell', [(string)$it['n'], $it['code'], $it['name'], $it['caption'], $it['date'], $it['file']]));
    }
    return "\xEF\xBB\xBF" . implode("\r\n", $lines) . "\r\n";
}

/** Libro de Excel (.xlsx) mínimo, sin librerías externas. */
function ka_build_xlsx(array $items): string
{
    $buffer = '';
    $zip = new KaZipWriter(function (string $bytes) use (&$buffer): void {
        $buffer .= $bytes;
    });
    $ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    $head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n";
    $lastRow = count($items) + 1;

    $str = function (string $ref, string $text, int $style) {
        return '<c r="' . $ref . '" s="' . $style . '" t="inlineStr"><is><t xml:space="preserve">' . ka_xml($text) . '</t></is></c>';
    };

    $rows = '<row r="1" ht="24" customHeight="1">';
    foreach (KA_EXPORT_HEADERS as $i => $title) {
        $rows .= $str(chr(65 + $i) . '1', $title, 1);
    }
    $rows .= '</row>';
    foreach ($items as $i => $it) {
        $r = $i + 2;
        $rows .= '<row r="' . $r . '">'
            . '<c r="A' . $r . '" s="2"><v>' . (int)$it['n'] . '</v></c>'
            . $str('B' . $r, $it['code'], 0)
            . $str('C' . $r, $it['name'], 0)
            . $str('D' . $r, $it['caption'], 0)
            . $str('E' . $r, $it['date'], 0)
            . $str('F' . $r, $it['file'], 0)
            . '</row>';
    }

    $zip->addString('[Content_Types].xml', $head . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    $zip->addString('_rels/.rels', $head . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    $zip->addString('xl/workbook.xml', $head . '<workbook xmlns="' . $ns . '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Recuerdos" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">Recuerdos!$A$1:$F$' . $lastRow . '</definedName></definedNames></workbook>');
    $zip->addString('xl/_rels/workbook.xml.rels', $head . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    $zip->addString('xl/styles.xml', $head . '<styleSheet xmlns="' . $ns . '"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFF5DEB0"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF102642"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
    $zip->addString('xl/worksheets/sheet1.xml', $head . '<worksheet xmlns="' . $ns . '"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="6" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/><col min="3" max="3" width="30" customWidth="1"/><col min="4" max="4" width="60" customWidth="1"/><col min="5" max="5" width="18" customWidth="1"/><col min="6" max="6" width="26" customWidth="1"/></cols><sheetData>' . $rows . '</sheetData><autoFilter ref="A1:F' . $lastRow . '"/></worksheet>');
    $zip->finish();
    return $buffer;
}

/** Página offline con las fotos, el nombre de quien las subió y su mensaje. */
function ka_build_album(array $items, string $generated): string
{
    $h = fn(string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $count = count($items);
    $cards = '';
    foreach ($items as $it) {
        $src = $h('fotos/' . $it['file']);
        $cards .= '<figure class="card"><a href="' . $src . '" target="_blank" rel="noopener"><img src="' . $src . '" alt="Recuerdo de ' . $h($it['name']) . '" loading="lazy"></a>'
            . '<figcaption><p>' . $h($it['caption']) . '</p><span><strong>' . $h($it['code']) . '</strong> · ' . $h($it['name']) . ' · ' . $h($it['date']) . '</span></figcaption></figure>';
    }
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recuerdos · Karina &amp; Alexis</title><style>'
        . ':root{--ink:#102642;--paper:#f8f5ee;--gold:#b18b4d}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}'
        . 'header{background:var(--ink);color:#fff8e9;text-align:center;padding:56px 20px 48px}header small{display:block;letter-spacing:3px;font-size:11px;color:#d9c79f}'
        . 'h1{font:italic 400 clamp(38px,6vw,64px)/1.1 Georgia,"Times New Roman",serif;margin:16px 0 14px}header p{margin:0;font-size:13px;color:#d9c79f}'
        . 'main{max-width:1180px;margin:0 auto;padding:44px 20px 60px}.grid{columns:3 280px;column-gap:22px}'
        . '.card{break-inside:avoid;margin:0 0 22px;background:#fffdf7;border:1px solid #e3d9c2}.card img{display:block;width:100%;height:auto}'
        . 'figcaption{padding:16px 18px 20px}figcaption p{margin:0 0 12px;font:italic 400 21px/1.3 Georgia,"Times New Roman",serif;overflow-wrap:anywhere}'
        . 'figcaption span{font-size:11px;letter-spacing:.6px;color:#5d6b80}figcaption strong{color:#715522}footer{text-align:center;padding:26px;font-size:11px;color:#8b95a5;border-top:1px solid #e3d9c2}'
        . '@media print{header{padding:24px}.card{border-color:#ccc}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
        . '</style></head><body><header><small>RECUERDOS · 21 DE NOVIEMBRE DE 2026</small><h1>Karina &amp; Alexis</h1><p>' . $count . ($count === 1 ? ' recuerdo compartido' : ' recuerdos compartidos') . ' por sus invitados</p></header>'
        . '<main><div class="grid">' . $cards . '</div></main><footer>Un detalle de Vector Inside · Generado el ' . $h($generated) . '</footer></body></html>';
}

/**
 * Envía el ZIP de recuerdos aprobados y termina la petición.
 * @param array<int,array{id:string,name:string,caption:string,created:int,rsvp_id:string}> $photos Ordenadas de la más antigua a la más reciente.
 */
function ka_stream_photos_zip(array $photos, string $photosDir): void
{
    $tz = new DateTimeZone('America/Mexico_City');
    $fmt = fn(int $ts): string => (new DateTime('@' . $ts))->setTimezone($tz)->format('d/m/Y H:i');
    $items = [];
    $perCode = [];
    $noCode = 0;
    foreach ($photos as $i => $p) {
        // El código KA-XXXXXX une la foto con la lista de asistencia. Si no hay, se marca como SIN CÓDIGO.
        $code = preg_match('/^KA-[A-F0-9]{6}$/', (string)($p['rsvp_id'] ?? '')) ? $p['rsvp_id'] : '';
        if ($code !== '') {
            $perCode[$code] = ($perCode[$code] ?? 0) + 1;
            $file = $perCode[$code] === 1 ? $code . '.jpg' : $code . '-' . $perCode[$code] . '.jpg';
        } else {
            $noCode++;
            $file = sprintf('SIN-CODIGO-%02d-%s.jpg', $noCode, ka_slug($p['name']));
        }
        $items[] = [
            'n' => $i + 1,
            'code' => $code !== '' ? $code : KA_NO_CODE,
            'name' => $p['name'],
            'caption' => $p['caption'],
            'date' => $fmt((int)$p['created']),
            'file' => $file,
            'path' => $photosDir . '/' . $p['id'] . '.jpg',
        ];
    }

    // Todo lo que no son fotos se arma antes de enviar nada, para fallar limpio si algo sale mal.
    $now = (new DateTime('now', $tz));
    $csv = ka_build_csv($items);
    $xlsx = ka_build_xlsx($items);
    $album = ka_build_album($items, $now->format('d/m/Y H:i'));
    $filename = KA_EXPORT_FOLDER . '-' . $now->format('Y-m-d') . '.zip';

    @set_time_limit(0);
    @ini_set('zlib.output_compression', '0');
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('X-Content-Type-Options: nosniff');

    $zip = new KaZipWriter(function (string $bytes): void {
        echo $bytes;
    });
    $root = KA_EXPORT_FOLDER . '/';
    $zip->addString($root . 'album.html', $album);
    $zip->addString($root . 'indice-recuerdos.xlsx', $xlsx);
    $zip->addString($root . 'indice-recuerdos.csv', $csv);
    foreach ($items as $it) {
        $zip->addFile($root . 'fotos/' . $it['file'], $it['path']);
        flush();
    }
    $zip->finish();
    exit;
}
