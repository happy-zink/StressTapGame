/* storage.js — local save / load / export / import */
(function (global) {
  const KEY = "stress-tap-save-v1";

  const defaultSave = () => ({
    version: 1,
    settings: {
      sfxOn: true,
      sfxVolume: 0.7,
      musicOn: false,
      musicVolume: 0.35,
      vfxLevel: 2, // 0 low, 1 med, 2 high
      shake: true,
      particles: true,
    },
    photo: null, // { dataUrl, expression, costume }
    progress: {
      unlockedScene: 0,
      highScores: [0, 0, 0],
      bestCombo: [0, 0, 0],
      totalScore: 0,
      totalHits: 0,
      sessions: 0,
    },
    meta: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      const base = defaultSave();
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) },
        progress: { ...base.progress, ...(parsed.progress || {}) },
        meta: { ...base.meta, ...(parsed.meta || {}) },
      };
    } catch (e) {
      console.warn("[storage] load failed, using defaults");
      return defaultSave();
    }
  }

  function save(data) {
    try {
      const payload = {
        ...data,
        meta: { ...(data.meta || {}), updatedAt: Date.now() },
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn("[storage] save failed (quota?)", e && e.message);
      return false;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
    return defaultSave();
  }

  function exportFile(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `stress-tap-save-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function importFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!parsed || typeof parsed !== "object") {
            reject(new Error("无效的存档文件"));
            return;
          }
          const base = defaultSave();
          const merged = {
            ...base,
            ...parsed,
            settings: { ...base.settings, ...(parsed.settings || {}) },
            progress: { ...base.progress, ...(parsed.progress || {}) },
            meta: { ...base.meta, ...(parsed.meta || {}), updatedAt: Date.now() },
          };
          resolve(merged);
        } catch (e) {
          reject(new Error("无法解析存档 JSON"));
        }
      };
      reader.onerror = () => reject(new Error("读取文件失败"));
      reader.readAsText(file);
    });
  }

  global.STStorage = {
    KEY,
    defaultSave,
    load,
    save,
    clear,
    exportFile,
    importFile,
  };
})(window);
