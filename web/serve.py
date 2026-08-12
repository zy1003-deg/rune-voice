"""
Rune Voice local development static server.

Serves the SPA's generated JSON data (read-only) and a local audio tree.
Used for local development only — production deploys the SPA on Vercel
and hosts audio on object storage configured via VITE_API_BASE.

Usage:
  python web/serve.py
  LOL_VOICE_SERVE_PORT=9000 python web/serve.py
"""
import http.server
import os
import socketserver
import urllib.parse

DEFAULT_AUDIO_ROOT = "./data/audio"
DEFAULT_DATA_ROOT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "public"
)
DEFAULT_PORT = 8080


def _env_path(name: str, default: str) -> str:
    value = os.environ.get(name)
    return value if value not in (None, "") else default


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


AUDIO_ROOT = os.path.abspath(
    _env_path("LOL_VOICE_SERVE_AUDIO_ROOT", DEFAULT_AUDIO_ROOT)
)
DATA_ROOT = os.path.abspath(
    _env_path("LOL_VOICE_SERVE_DATA_ROOT", DEFAULT_DATA_ROOT)
)
PORT = _env_int("LOL_VOICE_SERVE_PORT", DEFAULT_PORT)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=AUDIO_ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        # JSON data files: no cache; audio files: 1 hour.
        if self.path and self.path.endswith(".json"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def translate_path(self, path):
        # Data files: /data/* -> web/public/data/*
        if path.startswith("/data/"):
            path = urllib.parse.unquote(path)
            full = os.path.join(DATA_ROOT, path.lstrip("/"))
            return full
        # Audio files: everything else -> AUDIO_ROOT/*
        return super().translate_path(path)

    def guess_type(self, path):
        if path.endswith(".mp3"):
            return "audio/mpeg"
        if path.endswith(".json"):
            return "application/json; charset=utf-8"
        return super().guess_type(path)


if __name__ == "__main__":
    os.makedirs(AUDIO_ROOT, exist_ok=True)
    with ThreadedHTTPServer(("0.0.0.0", PORT), CORSHandler) as httpd:
        print(f"Server:  http://localhost:{PORT}")
        print(f"Audio:   {AUDIO_ROOT}")
        print(f"Data:    {DATA_ROOT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped")
