# Static dev server for the preview.
# Same as `python -m http.server` but sets Cache-Control: no-store so the
# browser always picks up the latest JSX after a save (avoids heuristic
# caching by Last-Modified alone).
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
# 두번째 인수 --lan 이면 0.0.0.0 으로 바인딩 (같은 와이파이의 다른 컴퓨터에서 접근 가능).
# 기본은 127.0.0.1 (자기 PC 만).
HOST = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer((HOST, PORT), NoCacheHandler) as httpd:
        shown = HOST if HOST != "0.0.0.0" else "0.0.0.0 (LAN)"
        print(f"serving {ROOT} on http://{shown}:{PORT}")
        httpd.serve_forever()
