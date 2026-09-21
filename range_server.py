import os
import sys
import re
import time
import queue
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

WATCH_EXTENSIONS = {'.html', '.js', '.css', '.svg', '.json'}
sse_clients = []
sse_lock = threading.Lock()

def get_dir_mtimes():
    mtimes = {}
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', '__pycache__')]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in WATCH_EXTENSIONS:
                p = os.path.join(root, f)
                try:
                    mtimes[p] = os.path.getmtime(p)
                except OSError:
                    pass
    return mtimes

def watcher_loop():
    last_mtimes = get_dir_mtimes()
    while True:
        time.sleep(0.35)
        current_mtimes = get_dir_mtimes()
        changed_type = None
        
        for p, mtime in current_mtimes.items():
            if p not in last_mtimes or mtime > last_mtimes[p]:
                ext = os.path.splitext(p)[1].lower()
                print(f"[RealTime DevServer] Detected change in: {os.path.basename(p)}")
                if ext == '.css' and changed_type != 'reload':
                    changed_type = 'css'
                else:
                    changed_type = 'reload'
                break
                
        if not changed_type:
            for p in last_mtimes:
                if p not in current_mtimes:
                    changed_type = 'reload'
                    print(f"[RealTime DevServer] File removed: {os.path.basename(p)}")
                    break
        
        last_mtimes = current_mtimes
        if changed_type:
            with sse_lock:
                for q in list(sse_clients):
                    try:
                        q.put_nowait(changed_type)
                    except Exception:
                        pass

class RealTimeRangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    """HTTP Request Handler supporting:
    1. Live-Reload / Real-time sync via Server-Sent Events (SSE)
    2. Hot-reloading of CSS styles without losing scroll state
    3. HTTP 206 Partial Content / Range requests for smooth video scrubbing
    4. Anti-caching headers for instant feedback on code edits
    """

    def do_GET(self):
        # Handle SSE Live-Reload Connection
        if self.path == '/__livereload':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache, no-transform')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            client_queue = queue.Queue()
            with sse_lock:
                sse_clients.append(client_queue)
            
            try:
                self.wfile.write(b": connected\n\n")
                self.wfile.flush()
                while True:
                    try:
                        msg = client_queue.get(timeout=25)
                        self.wfile.write(f"data: {msg}\n\n".encode('utf-8'))
                        self.wfile.flush()
                    except queue.Empty:
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
            except (ConnectionResetError, BrokenPipeError, OSError):
                pass
            finally:
                with sse_lock:
                    if client_queue in sse_clients:
                        sse_clients.remove(client_queue)
            return

        # Serve HTML with injected real-time live-reload client script
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
            
        if os.path.isfile(path) and path.endswith('.html'):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                live_snippet = """
<!-- RealTime LiveReload Hook -->
<script id="__livereload_hook">
(() => {
  let es;
  function connect() {
    es = new EventSource('/__livereload');
    es.onmessage = (e) => {
      if (e.data === 'css') {
        console.log('[RealTime] Actualizando CSS en vivo...');
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
          try {
            const url = new URL(link.href, location.origin);
            url.searchParams.set('_hot_reload', Date.now());
            link.href = url.toString();
          } catch(err) {}
        });
      } else if (e.data === 'reload') {
        console.log('[RealTime] Cambio detectado. Recargando página...');
        location.reload();
      }
    };
    es.onerror = () => {
      es.close();
      setTimeout(connect, 1500);
    };
  }
  connect();
})();
</script>
"""
                if '</body>' in content:
                    content = content.replace('</body>', live_snippet + '\n</body>')
                else:
                    content += live_snippet
                
                encoded = content.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(encoded)))
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                self.wfile.write(encoded)
                return
            except Exception as ex:
                print(f"[RealTime DevServer] Error serving HTML: {ex}")
                pass
                
        return super().do_GET()

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()
        
        # Support HTTP 206 Range requests for videos
        range_header = self.headers.get('Range')
        if not range_header:
            f = super().send_head()
            if f:
                self.send_header('Accept-Ranges', 'bytes')
                ext = os.path.splitext(path)[1].lower()
                if ext in ('.js', '.css', '.html', '.json'):
                    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    self.send_header('Pragma', 'no-cache')
                    self.send_header('Expires', '0')
            return f
        
        m = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not m:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None
        
        total = os.path.getsize(path)
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else total - 1
        if start >= total or end >= total or start > end:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None
        
        length = end - start + 1
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{total}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        
        f = open(path, 'rb')
        f.seek(start)
        self._range_remaining = length
        return f

    def copyfile(self, source, outputfile):
        if hasattr(self, '_range_remaining') and self._range_remaining is not None:
            remaining = self._range_remaining
            self._range_remaining = None
            bufsize = 64 * 1024
            while remaining > 0:
                chunk = source.read(min(remaining, bufsize))
                if not chunk:
                    break
                try:
                    outputfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    break
                remaining -= len(chunk)
        else:
            try:
                super().copyfile(source, outputfile)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def log_message(self, format, *args):
        # Filter out noisy video byte range requests
        if args and any(ext in str(args[0]) for ext in ('.mp4', '.glb', '.png', '.jpg', '.svg', '.webp')):
            return
        pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    
    # Start live-reload background watcher
    watcher_thread = threading.Thread(target=watcher_loop, daemon=True)
    watcher_thread.start()
    
    server = ThreadingHTTPServer(('0.0.0.0', port), RealTimeRangeHTTPRequestHandler)
    print(f"🚀 VectorInside Real-Time DevServer activo en http://localhost:{port} (Live-Reload + HTTP 206)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
