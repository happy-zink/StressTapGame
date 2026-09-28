#!/usr/bin/env python3
"""Stress Tap Game local server. Prefer port 8762."""
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
PREFERRED_PORT = 8762
MAX_PORT_TRY = 20


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        # Keep logs short; never log request bodies (photos stay in-browser).
        sys.stderr.write("[http] %s\n" % (fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def pick_port() -> int:
    for port in range(PREFERRED_PORT, PREFERRED_PORT + MAX_PORT_TRY):
        if port_free(port):
            return port
    raise SystemExit(
        "No free port in range %s-%s"
        % (PREFERRED_PORT, PREFERRED_PORT + MAX_PORT_TRY - 1)
    )


def main() -> None:
    port = pick_port()
    httpd = ThreadingServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}/"
    print(f"Stress Tap Game running at {url}", flush=True)
    print(f"Root: {ROOT}", flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    if os.environ.get("ST_NO_BROWSER") != "1":
        threading.Timer(0.3, lambda: _open_browser(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.", flush=True)
    finally:
        httpd.server_close()


def _open_browser(url: str) -> None:
    try:
        webbrowser.open(url)
    except Exception:
        pass


if __name__ == "__main__":
    main()
