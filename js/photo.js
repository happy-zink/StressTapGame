/* photo-editor.js — upload, pan/zoom/rotate crop, live sticker preview */
(function (global) {
  const state = {
    image: null,
    zoom: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    expression: "happy",
    costume: "none",
    dragging: false,
    lastX: 0,
    lastY: 0,
    dirty: false,
    onClose: null,
    onSave: null,
    canvas: null,
    previewCanvas: null,
    ctx: null,
    previewCtx: null,
  };

  function init() {
    state.canvas = document.getElementById("photo-canvas");
    state.previewCanvas = document.getElementById("preview-canvas");
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext("2d");
    state.previewCtx = state.previewCanvas.getContext("2d");

    bindControls();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // pointer drag
    state.canvas.addEventListener("pointerdown", onDown);
    state.canvas.addEventListener("pointermove", onMove);
    state.canvas.addEventListener("pointerup", onUp);
    state.canvas.addEventListener("pointercancel", onUp);
    state.canvas.addEventListener("pointerleave", onUp);
  }

  function resizeCanvas() {
    const wrap = state.canvas && state.canvas.parentElement;
    if (!wrap || !state.canvas) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(200, Math.min(rect.width, rect.height || rect.width));
    state.canvas.width = Math.floor(size * dpr);
    state.canvas.height = Math.floor(size * dpr);
    render();
  }

  function bindControls() {
    const zoom = document.getElementById("photo-zoom");
    const rot = document.getElementById("photo-rot");
    const file = document.getElementById("photo-file");

    zoom.addEventListener("input", () => {
      state.zoom = Number(zoom.value) / 100;
      state.dirty = true;
      render();
    });
    rot.addEventListener("input", () => {
      state.rotation = (Number(rot.value) * Math.PI) / 180;
      state.dirty = true;
      render();
    });
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) {
        toast("请选择图片文件");
        return;
      }
      if (f.size > 12 * 1024 * 1024) {
        toast("图片过大，请选择 12MB 以内");
        return;
      }
      try {
        await loadImageFile(f);
        toast("已加载照片，拖动调整位置");
      } catch (e) {
        toast("图片读取失败");
      }
      file.value = "";
    });

    document.getElementById("photo-save").addEventListener("click", save);
    document.getElementById("photo-cancel").addEventListener("click", close);
    document.getElementById("photo-delete").addEventListener("click", () => {
      if (!state.onSave) return;
      state.onSave(null);
      toast("已删除自定义照片");
      close();
    });

    document.querySelectorAll("[data-expr]").forEach((el) => {
      el.addEventListener("click", () => {
        state.expression = el.getAttribute("data-expr");
        document.querySelectorAll("[data-expr]").forEach((n) => n.classList.remove("active"));
        el.classList.add("active");
        render();
      });
    });

    document.querySelectorAll("[data-costume]").forEach((el) => {
      el.addEventListener("click", () => {
        state.costume = el.getAttribute("data-costume");
        document.querySelectorAll("[data-costume]").forEach((n) => n.classList.remove("active"));
        el.classList.add("active");
        render();
      });
    });
  }

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          state.image = img;
          state.zoom = 1;
          state.rotation = 0;
          state.offsetX = 0;
          state.offsetY = 0;
          document.getElementById("photo-zoom").value = "100";
          document.getElementById("photo-rot").value = "0";
          state.dirty = true;
          render();
          resolve();
        };
        img.onerror = reject;
        img.src = String(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function onDown(e) {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.canvas.setPointerCapture(e.pointerId);
    state.canvas.style.cursor = "grabbing";
  }

  function onMove(e) {
    if (!state.dragging || !state.image) return;
    const rect = state.canvas.getBoundingClientRect();
    const scale = state.canvas.width / rect.width;
    state.offsetX += (e.clientX - state.lastX) * scale;
    state.offsetY += (e.clientY - state.lastY) * scale;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.dirty = true;
    render();
  }

  function onUp(e) {
    state.dragging = false;
    state.canvas.style.cursor = "grab";
    try {
      state.canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
  }

  function render() {
    const ctx = state.ctx;
    const canvas = state.canvas;
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1d1a16";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const faceR = Math.min(w, h) * 0.32;

    if (state.image) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(cx + state.offsetX, cy + state.offsetY);
      ctx.rotate(state.rotation);
      const img = state.image;
      const base = Math.max((faceR * 2) / img.naturalWidth, (faceR * 2) / img.naturalHeight) * state.zoom * 1.15;
      const dw = img.naturalWidth * base;
      const dh = img.naturalHeight * base;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#777";
      ctx.font = `${Math.floor(faceR * 0.28)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("上传照片", cx, cy);
    }

    // crop guide ring
    ctx.beginPath();
    ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,193,69,0.95)";
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.stroke();

    // preview
    const pctx = state.previewCtx;
    const pcanvas = state.previewCanvas;
    if (pctx && pcanvas) {
      const ps = pcanvas.width;
      pctx.clearRect(0, 0, ps, ps);
      pctx.fillStyle = "#fff6e8";
      pctx.beginPath();
      pctx.arc(ps / 2, ps / 2, ps / 2, 0, Math.PI * 2);
      pctx.fill();
      let photoProxy = null;
      if (state.image) {
        // draw cropped avatar onto temp then use as image source via same crop math
        photoProxy = createCroppedProxy();
      }
      global.STCharacter.drawStickerFace(pctx, ps / 2, ps / 2, ps * 0.34, {
        photoImage: photoProxy,
        expression: state.expression,
        costume: state.costume,
      });
    }
  }

  function createCroppedProxy() {
    if (!state.image) return null;
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const cx = size / 2;
    const cy = size / 2;
    const faceR = size * 0.48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(cx + state.offsetX * (size / state.canvas.width), cy + state.offsetY * (size / state.canvas.height));
    ctx.rotate(state.rotation);
    const img = state.image;
    const base = Math.max((faceR * 2) / img.naturalWidth, (faceR * 2) / img.naturalHeight) * state.zoom * 1.15;
    const dw = img.naturalWidth * base;
    const dh = img.naturalHeight * base;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    return c;
  }

  function exportAvatar() {
    const size = 320;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    // transparent outside circle, sticker drawn in character renderer at runtime
    const proxy = createCroppedProxy();
    if (proxy) {
      ctx.drawImage(proxy, 0, 0, size, size);
    }
    return c.toDataURL("image/png");
  }

  function save() {
    if (!state.onSave) return;
    const dataUrl = exportAvatar();
    state.onSave({
      dataUrl,
      expression: state.expression,
      costume: state.costume,
    });
    toast("照片角色已保存");
    close();
  }

  function open(options) {
    const screen = document.getElementById("screen-photo");
    if (!screen) return;
    state.onSave = options && options.onSave;
    state.onClose = options && options.onClose;
    state.expression = (options && options.expression) || state.expression;
    state.costume = (options && options.costume) || state.costume;

    document.querySelectorAll("[data-expr]").forEach((n) => {
      n.classList.toggle("active", n.getAttribute("data-expr") === state.expression);
    });
    document.querySelectorAll("[data-costume]").forEach((n) => {
      n.classList.toggle("active", n.getAttribute("data-costume") === state.costume);
    });

    // preload existing
    if (options && options.photoDataUrl) {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        state.zoom = 1;
        state.rotation = 0;
        state.offsetX = 0;
        state.offsetY = 0;
        render();
      };
      img.src = options.photoDataUrl;
    } else if (!state.image) {
      render();
    } else {
      render();
    }

    screen.classList.add("active");
    resizeCanvas();
  }

  function close() {
    const screen = document.getElementById("screen-photo");
    if (screen) screen.classList.remove("active");
    if (state.onClose) state.onClose();
    state.onClose = null;
    state.onSave = null;
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  global.STPhoto = {
    init,
    open,
    close,
    exportAvatar,
  };
})(window);
