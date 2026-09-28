/* main.js — 菜单 / 武器栏 / 设置 / 照片 / 沙盒接线 */
(function () {
  const saveState = STStorage.load();
  let photoDataUrl = saveState.photo ? saveState.photo.dataUrl : null;
  let expression = saveState.photo ? saveState.photo.expression || "happy" : "happy";
  let costume = saveState.photo ? saveState.photo.costume || "none" : "none";
  let weaponCat = "hands";

  function syncSettingsExport() {
    window.STSaveSettings = {
      vfxLevel: saveState.settings.vfxLevel,
      shake: saveState.settings.shake,
      particles: saveState.settings.particles,
    };
    STAudio.applySettings(saveState.settings);
  }

  function persist() {
    saveState.photo = photoDataUrl
      ? { dataUrl: photoDataUrl, expression, costume }
      : null;
    if (!saveState.progress) saveState.progress = STStorage.defaultSave().progress;
    if (!saveState.progress.weaponStats) saveState.progress.weaponStats = {};
    const ok = STStorage.save(saveState);
    if (!ok) toast("本地保存失败（可能超出浏览器存储配额）");
    return ok;
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2000);
  }

  function showHint(msg) {
    const el = document.getElementById("mode-hint");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showHint._t);
    showHint._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }

  function showOverlay(id) {
    document.getElementById(id).classList.add("active");
  }

  function hideOverlay(id) {
    document.getElementById(id).classList.remove("active");
  }

  // ---------- weapon UI ----------
  function buildWeaponUI() {
    const catBar = document.getElementById("weapon-cats");
    const grid = document.getElementById("weapon-grid");
    if (!catBar || !grid) return;
    catBar.innerHTML = "";
    STWeapons.CATS.forEach((cat) => {
      const b = document.createElement("button");
      b.className = "cat-btn" + (cat.id === weaponCat ? " active" : "");
      b.textContent = `${cat.icon} ${cat.name}`;
      b.setAttribute("data-cat", cat.id);
      b.addEventListener("click", () => {
        weaponCat = cat.id;
        buildWeaponUI();
        STAudio.SFX.click();
      });
      catBar.appendChild(b);
    });

    grid.innerHTML = "";
    STWeapons.weaponsOfCat(weaponCat).forEach((w) => {
      const b = document.createElement("button");
      b.className = "weapon-btn";
      b.title = w.name;
      b.innerHTML = `<span class="w-emoji">${w.emoji}</span><span class="w-name">${w.name}</span>`;
      b.setAttribute("data-weapon", w.id);
      b.addEventListener("click", () => {
        STGame.setWeapon(w.id);
        markWeaponSelected(w.id);
        STAudio.SFX.click();
        showHint(`${w.emoji} ${w.name} · 点画面攻击`);
      });
      grid.appendChild(b);
    });
    markWeaponSelected(STGame.getState().weaponId);
  }

  function markWeaponSelected(id) {
    document.querySelectorAll(".weapon-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-weapon") === id);
    });
  }

  // ---------- Menu ----------
  function bindMenu() {
    document.getElementById("btn-start").addEventListener("click", () => {
      STAudio.resume();
      STAudio.SFX.click();
      openThemeSelect();
    });
    document.getElementById("btn-photo").addEventListener("click", () => {
      STAudio.resume();
      STAudio.SFX.click();
      openPhoto();
    });
    document.getElementById("btn-settings").addEventListener("click", () => {
      STAudio.SFX.click();
      openSettings();
    });
    document.getElementById("btn-help").addEventListener("click", () => {
      STAudio.SFX.click();
      showOverlay("screen-help");
    });
    document.getElementById("btn-exit").addEventListener("click", () => {
      STAudio.SFX.click();
      persist();
      toast("进度已保存。可直接关闭标签页/浏览器退出。");
    });
    document.getElementById("help-close").addEventListener("click", () => hideOverlay("screen-help"));
    document.getElementById("settings-close").addEventListener("click", () => {
      hideOverlay("screen-settings");
      persist();
    });
    document.getElementById("scene-close").addEventListener("click", () => hideOverlay("screen-scene"));
  }

  function openThemeSelect() {
    const wrap = document.getElementById("scene-list");
    wrap.innerHTML = "";
    STGame.THEMES.forEach((th, idx) => {
      const btn = document.createElement("button");
      btn.className = "btn " + (idx === 0 ? "" : "secondary");
      btn.textContent = th.name;
      btn.style.minHeight = "56px";
      btn.addEventListener("click", () => {
        hideOverlay("screen-scene");
        startGame(idx);
      });
      wrap.appendChild(btn);
    });
    const tip = document.createElement("p");
    tip.style.marginTop = "10px";
    tip.textContent = "纯解压沙盒：无倒计时、无失败。挑个背景开打。";
    wrap.appendChild(tip);
    showOverlay("screen-scene");
  }

  function startGame(themeIndex) {
    showScreen("screen-game");
    STGame.setCharacterOptions(expression, costume);
    STGame.setPhoto(photoDataUrl, expression, costume);
    STGame.resize();
    STGame.start(themeIndex);
    buildWeaponUI();
    STAudio.resume();
    if (saveState.settings.musicOn) STAudio.startMusic(themeIndex);
    showHint("点选武器后，点画面攻击 · 空格放大招");
  }

  // ---------- Settings ----------
  function openSettings() {
    const s = saveState.settings;
    document.getElementById("set-sfx").checked = s.sfxOn;
    document.getElementById("set-music").checked = s.musicOn;
    document.getElementById("set-sfx-vol").value = String(Math.round(s.sfxVolume * 100));
    document.getElementById("set-music-vol").value = String(Math.round(s.musicVolume * 100));
    document.getElementById("set-vfx").value = String(s.vfxLevel);
    document.getElementById("set-shake").checked = s.shake;
    document.getElementById("set-particles").checked = s.particles;
    document.getElementById("set-sfx-vol-label").textContent = Math.round(s.sfxVolume * 100) + "%";
    document.getElementById("set-music-vol-label").textContent = Math.round(s.musicVolume * 100) + "%";
    showOverlay("screen-settings");
  }

  function bindSettings() {
    const s = saveState.settings;
    const bindCheck = (id, key, after) => {
      const el = document.getElementById(id);
      el.addEventListener("change", () => {
        s[key] = el.checked;
        syncSettingsExport();
        persist();
        if (after) after();
      });
    };
    const bindRange = (id, key, labelId) => {
      const el = document.getElementById(id);
      const lab = document.getElementById(labelId);
      el.addEventListener("input", () => {
        s[key] = Number(el.value) / 100;
        if (lab) lab.textContent = Math.round(Number(el.value)) + "%";
        syncSettingsExport();
        persist();
      });
    };

    bindCheck("set-sfx", "sfxOn", () => STAudio.applySettings(s));
    bindCheck("set-music", "musicOn", () => {
      STAudio.applySettings(s);
      if (s.musicOn) STAudio.startMusic(0);
      else STAudio.stopMusic();
    });
    bindCheck("set-shake", "shake");
    bindCheck("set-particles", "particles");
    bindRange("set-sfx-vol", "sfxVolume", "set-sfx-vol-label");
    bindRange("set-music-vol", "musicVolume", "set-music-vol-label");

    document.getElementById("set-vfx").addEventListener("change", (e) => {
      s.vfxLevel = Number(e.target.value);
      syncSettingsExport();
      persist();
    });

    document.getElementById("btn-export").addEventListener("click", () => {
      persist();
      STStorage.exportFile(saveState);
      toast("存档已导出为 JSON 文件");
      STAudio.SFX.click();
    });

    document.getElementById("btn-import").addEventListener("click", () => {
      document.getElementById("import-file").click();
    });

    document.getElementById("import-file").addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const merged = await STStorage.importFile(f);
        Object.keys(saveState).forEach((k) => delete saveState[k]);
        Object.assign(saveState, merged);
        photoDataUrl = saveState.photo ? saveState.photo.dataUrl : null;
        expression = saveState.photo ? saveState.photo.expression || "happy" : "happy";
        costume = saveState.photo ? saveState.photo.costume || "none" : "none";
        persist();
        syncSettingsExport();
        applyPhotoToPreview();
        toast("存档导入成功");
        openSettings();
      } catch (err) {
        toast(err.message || "导入失败");
      }
      e.target.value = "";
    });

    document.getElementById("btn-clear-save").addEventListener("click", () => {
      if (!confirm("确定清空本地进度与照片角色吗？此操作不可撤销。")) return;
      const fresh = STStorage.clear();
      Object.keys(saveState).forEach((k) => delete saveState[k]);
      Object.assign(saveState, fresh);
      photoDataUrl = null;
      expression = "happy";
      costume = "none";
      syncSettingsExport();
      applyPhotoToPreview();
      toast("本地记录已清空");
    });

    document.getElementById("btn-reset-stats").addEventListener("click", () => {
      if (!confirm("重置分数记录？照片角色会保留。")) return;
      saveState.progress = STStorage.defaultSave().progress;
      persist();
      toast("分数记录已重置");
    });
  }

  // ---------- Photo ----------
  function applyPhotoToPreview() {
    const mini = document.getElementById("menu-avatar");
    if (!mini) return;
    const img = photoDataUrl ? Object.assign(new Image(), { src: photoDataUrl }) : null;
    const draw = () => {
      const c = mini;
      const g = c.getContext("2d");
      const s = c.width;
      g.clearRect(0, 0, s, s);
      g.fillStyle = "#fff6e8";
      g.beginPath();
      g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
      g.fill();
      STCharacter.drawStickerFace(g, s / 2, s / 2, s * 0.36, {
        photoImage: img && img.complete ? img : null,
        expression,
        costume,
      });
    };
    if (img) {
      img.onload = draw;
      if (img.complete) draw();
    } else draw();
  }

  function openPhoto() {
    STPhoto.open({
      photoDataUrl,
      expression,
      costume,
      onSave: (payload) => {
        if (!payload) {
          photoDataUrl = null;
          expression = "happy";
          costume = "none";
        } else {
          photoDataUrl = payload.dataUrl;
          expression = payload.expression;
          costume = payload.costume;
        }
        persist();
        applyPhotoToPreview();
      },
    });
  }

  // ---------- Game UI ----------
  function bindGameUI() {
    document.getElementById("btn-pause").addEventListener("click", () => {
      STGame.pause();
      showOverlay("screen-pause");
      STAudio.SFX.pause();
    });
    document.getElementById("btn-mute").addEventListener("click", (e) => {
      const s = saveState.settings;
      const nowOff = !s.sfxOn && !s.musicOn;
      if (nowOff) s.sfxOn = true;
      else {
        s.sfxOn = false;
        s.musicOn = false;
        STAudio.stopMusic();
      }
      syncSettingsExport();
      persist();
      e.currentTarget.classList.toggle("active", !s.sfxOn && !s.musicOn);
      toast(s.sfxOn ? "音效已开启" : "已静音");
    });
    document.getElementById("btn-theme").addEventListener("click", () => {
      const st = STGame.getState();
      const next = (st.theme + 1) % STGame.THEMES.length;
      STGame.start(next);
      STGame.setCharacterOptions(expression, costume);
      STGame.setPhoto(photoDataUrl, expression, costume);
      toast(`场景：${STGame.THEMES[next].name}`);
      STAudio.SFX.click();
    });
    document.getElementById("btn-rage").addEventListener("click", () => {
      const ok = STGame.activateRage();
      if (!ok) toast("宣泄值还不够，继续打！");
      else toast("宣泄大招发动！");
    });

    document.getElementById("pause-resume").addEventListener("click", () => {
      hideOverlay("screen-pause");
      STGame.resume();
      STAudio.SFX.click();
    });
    document.getElementById("pause-restart").addEventListener("click", () => {
      hideOverlay("screen-pause");
      const st = STGame.getState();
      startGame(st.theme);
    });
    document.getElementById("pause-quit").addEventListener("click", () => {
      hideOverlay("screen-pause");
      STGame.stop();
      STAudio.stopMusic();
      showScreen("screen-menu");
      persist();
      applyPhotoToPreview();
    });

    // remove old result buttons if present
    const resultReplay = document.getElementById("result-replay");
    if (resultReplay) {
      resultReplay.addEventListener("click", () => {
        hideOverlay("screen-result");
        startGame(0);
      });
    }
    const resultMenu = document.getElementById("result-menu");
    if (resultMenu) {
      resultMenu.addEventListener("click", () => {
        hideOverlay("screen-result");
        showScreen("screen-menu");
        persist();
      });
    }

    window.addEventListener("resize", () => STGame.resize());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const pauseScreen = document.getElementById("screen-pause");
        if (pauseScreen.classList.contains("active")) {
          hideOverlay("screen-pause");
          STGame.resume();
        } else if (document.getElementById("screen-game").classList.contains("active")) {
          STGame.pause();
          showOverlay("screen-pause");
        }
      }
      if (e.key === " " || e.key === "Spacebar") {
        if (document.getElementById("screen-game").classList.contains("active")) {
          e.preventDefault();
          const ok = STGame.activateRage();
          if (ok) toast("宣泄大招！");
        }
      }
      // number keys 1-9 quick weapons in current cat
      if (e.key >= "1" && e.key <= "9") {
        const btns = document.querySelectorAll(".weapon-btn");
        const idx = Number(e.key) - 1;
        if (btns[idx]) btns[idx].click();
      }
    });
  }

  function onGameStateChange(type) {
    if (type === "weapon") {
      markWeaponSelected(STGame.getState().weaponId);
    }
  }

  function boot() {
    STPhoto.init();
    bindMenu();
    bindSettings();
    bindGameUI();
    STGame.bindInput();
    STGame.onStateChange(onGameStateChange);
    syncSettingsExport();
    applyPhotoToPreview();
    showScreen("screen-menu");

    const unlock = () => {
      STAudio.resume();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    window.STApp = { toast, getSave: () => saveState };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else boot();
})();
