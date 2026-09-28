#!/usr/bin/env python3
"""照片火柴人 · 解压一下 — desktop launcher (PyInstaller-friendly)."""
from __future__ import annotations

import os
import socket
import sys
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

# ---------------------------------------------------------------------------
# paths
# ---------------------------------------------------------------------------
def is_frozen() -> bool:
    return getattr(sys, "frozen", False)


def resource_dir() -> str:
    if is_frozen():
        return getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def web_root() -> str:
    base = resource_dir()
    # Prefer bundled web/ layout, else project root (dev mode).
    candidate = os.path.join(base, "web")
    if os.path.isfile(os.path.join(candidate, "index.html")):
        return candidate
    if os.path.isfile(os.path.join(base, "index.html")):
        return base
    # PyInstaller onedir / nested
    for name in ("_internal", "resources"):
        p = os.path.join(base, name, "web")
        if os.path.isfile(os.path.join(p, "index.html")):
            return p
    return base


# ---------------------------------------------------------------------------
# local HTTP server (stdlib only)
# ---------------------------------------------------------------------------
class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=web_root(), **kwargs)

    def log_message(self, fmt, *args):
        try:
            sys.stderr.write("[http] " + (fmt % args) + "\n")
        except Exception:
            pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class ThreadingServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def pick_port(preferred: int = 8762) -> int:
    for port in range(preferred, preferred + 30):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return preferred


def start_server() -> tuple[ThreadingServer, str]:
    port = pick_port(8762)
    httpd = ThreadingServer(("127.0.0.1", port), QuietHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    url = f"http://127.0.0.1:{port}/"
    return httpd, url


# ---------------------------------------------------------------------------
# window: pywebview if present, else system browser
# ---------------------------------------------------------------------------
def open_window(url: str) -> None:
    title = "照片火柴人 · 解压一下"
    icon = os.path.join(resource_dir(), "app.ico")

    try:
        import webview  # type: ignore

        win = webview.create_window(
            title,
            url,
            width=1280,
            height=800,
            min_size=(900, 600),
            background_color="#FFF6E8",
            text_select=False,
            easy_drag=False,
        )
        try:
            webview.start(icon=icon if os.path.isfile(icon) else None)
        except TypeError:
            webview.start()
        # If webview returns, window was closed — keep serving only if
        # we intentionally stay (usually we exit with the window).
        return
    except Exception as exc:
        try:
            sys.stderr.write(f"[window] webview unavailable ({exc}); fallback to browser\n")
        except Exception:
            pass

    # Fallback: system browser (Edge/Chrome/Firefox).
    try:
        webbrowser.open(url)
    except Exception:
        pass
    print(f"已在浏览器打开：{url}")
    print("游戏在浏览器中运行。关闭命令行窗口将退出游戏。")
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        pass


def open_window_or_keepalive(url: str) -> None:
    """Open UI; never exit while the player might still be playing."""
    try:
        import webview  # type: ignore

        def _start() -> None:
            icon = os.path.join(resource_dir(), "app.ico")
            webview.create_window(
                "照片火柴人 · 解压一下",
                url,
                width=1280,
                height=800,
                min_size=(900, 600),
                background_color="#FFF6E8",
                text_select=False,
            )
            try:
                webview.start(icon=icon if os.path.isfile(icon) else None)
            except TypeError:
                webview.start()

        _start()
        return
    except Exception as exc:
        try:
            sys.stderr.write(f"[window] webview failed ({exc}); fallback to browser\n")
        except Exception:
            pass

    try:
        webbrowser.open(url)
    except Exception:
        pass
    print(f"已在浏览器打开：{url}")
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        pass


def main() -> None:
    log_path = os.path.join(
        os.path.dirname(sys.executable) if is_frozen() else os.path.dirname(os.path.abspath(__file__)),
        "launch.log",
    )

    def log(msg: str) -> None:
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(msg + "\n")
        except Exception:
            pass
        try:
            print(msg)
        except Exception:
            pass

    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    log("照片火柴人 · 解压一下")
    log(f"python={sys.executable} frozen={is_frozen()}")
    log(f"web_root={web_root()}")
    log("正在启动本地服务…")
    try:
        httpd, url = start_server()
    except Exception as exc:
        log(f"server failed: {exc}")
        raise
    log(f"服务地址：{url}")
    try:
        open_window_or_keepalive(url)
    except Exception as exc:
        log(f"window failed: {exc}")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            threading.Event().wait()
        except Exception:
            pass
    finally:
        try:
            httpd.shutdown()
            httpd.server_close()
        except Exception:
            pass
        log("exit")


if __name__ == "__main__":
    main()
