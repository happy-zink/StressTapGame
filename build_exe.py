#!/usr/bin/env python3
"""Build 照片火柴人.exe into dist/ using a project-local venv + PyInstaller."""
from __future__ import annotations

import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
VENV = os.path.join(ROOT, ".venv-build")
OUT = os.path.join(ROOT, "dist")
WORK = os.path.join(ROOT, "build")


def run(cmd: list[str], **kw) -> None:
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, cwd=ROOT, **kw)


def venv_python() -> str:
    if os.name == "nt":
        return os.path.join(VENV, "Scripts", "python.exe")
    return os.path.join(VENV, "bin", "python")


def make_icon() -> str:
    """Draw a simple app icon with Pillow (no SVG dependency)."""
    ico = os.path.join(ROOT, "app.ico")
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("Pillow missing; skip icon")
        return ""

    sizes = [256, 128, 64, 48, 32]
    base = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    # rounded coral square
    d.rounded_rectangle([8, 8, 248, 248], radius=48, fill=(255, 107, 74, 255))
    # face
    d.ellipse([64, 70, 192, 198], fill=(255, 232, 200, 255))
    d.ellipse([64, 70, 192, 198], outline=(255, 255, 255, 255), width=6)
    # eyes
    d.ellipse([96, 118, 116, 138], fill=(42, 42, 42, 255))
    d.ellipse([140, 118, 160, 138], fill=(42, 42, 42, 255))
    # smile
    d.arc([104, 140, 152, 176], start=20, end=160, fill=(42, 42, 42, 255), width=6)
    # party hat
    d.polygon([(128, 40), (90, 100), (166, 100)], fill=(255, 193, 69, 255))
    d.ellipse([118, 28, 138, 48], fill=(255, 255, 255, 255))

    base.save(ico, format="ICO", sizes=[(s, s) for s in sizes])
    print("icon ->", ico)
    return ico


def main() -> None:
    os.chdir(ROOT)
    py = sys.executable

    if not os.path.isfile(venv_python()):
        print("Creating build venv…")
        run([py, "-m", "venv", VENV])

    vp = venv_python()
    run([vp, "-m", "pip", "install", "--upgrade", "pip", "wheel", "setuptools"])
    run([vp, "-m", "pip", "install", "pyinstaller>=6.0", "pywebview>=5.0", "Pillow"])

    ico = make_icon()

    # stage web assets into build/web so the EXE has a clean layout
    stage = os.path.join(WORK, "web")
    if os.path.isdir(stage):
        shutil.rmtree(stage)
    os.makedirs(stage, exist_ok=True)
    for name in (
        "index.html",
        "css",
        "js",
        "favicon.svg",
        "README.md",
        "docs",
    ):
        src = os.path.join(ROOT, name)
        dst = os.path.join(stage, name)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        elif os.path.isfile(src):
            shutil.copy2(src, dst)

    # PyInstaller onefile windowed
    cmd = [
        vp,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        "--name",
        "照片火柴人解压",
        "--distpath",
        OUT,
        "--workpath",
        os.path.join(WORK, "pyi"),
        "--specpath",
        os.path.join(WORK, "spec"),
        "--add-data",
        (os.path.join(WORK, "web") + os.pathsep + "web"),
    ]
    if ico:
        cmd += ["--icon", ico]
    # hidden imports sometimes needed for pywebview on Windows
    cmd += [
        "--hidden-import",
        "webview",
        "--hidden-import",
        "webview.platforms.winforms",
        "--hidden-import",
        "webview.platforms.edgechromium",
    ]
    cmd.append(os.path.join(ROOT, "desktop_app.py"))
    run(cmd)

    exe = os.path.join(OUT, "照片火柴人解压.exe")
    if not os.path.isfile(exe):
        # name might be sanitized
        for fn in os.listdir(OUT):
            if fn.lower().endswith(".exe"):
                exe = os.path.join(OUT, fn)
                break
    print("BUILD OK ->", exe)
    if os.path.isfile(exe):
        print("size_mb=%.1f" % (os.path.getsize(exe) / 1024 / 1024))


if __name__ == "__main__":
    main()
