import os
import sys
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler

class RangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    """HTTP Request Handler that supports HTTP 206 Partial Content / Range requests.
    Essential for smooth HTML5 video scrubbing and random-access seeking in Chrome and Safari.
    """
    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()
        
        range_header = self.headers.get('Range')
        if not range_header:
            f = super().send_head()
            if f:
                self.send_header('Accept-Ranges', 'bytes')
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
                outputfile.write(chunk)
                remaining -= len(chunk)
        else:
            super().copyfile(source, outputfile)

    def log_message(self, format, *args):
        # Silence verbose request logging for video frames
        pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = HTTPServer(('0.0.0.0', port), RangeHTTPRequestHandler)
    print(f"Serving HTTP with Byte-Range support on port {port}...")
    server.serve_forever()
