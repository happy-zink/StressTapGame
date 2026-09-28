/* audio.js — procedural Web Audio SFX (no external samples) */
(function (global) {
  let ctx = null;
  let master = null;
  let sfxGain = null;
  let musicGain = null;
  let musicNodes = null;
  let enabled = true;
  let sfxVolume = 0.7;
  let musicVolume = 0.35;

  function ensure() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxVolume;
    sfxGain.connect(master);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    return ctx;
  }

  function resume() {
    ensure();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  function tone({ freq = 440, type = "sine", dur = 0.12, vol = 0.2, slide = 0, delay = 0, dest }) {
    if (!enabled) return;
    if (!ensure()) return;
    resume();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(dest || sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noise({ dur = 0.12, vol = 0.15, filterFreq = 1200, delay = 0 }) {
    if (!enabled) return;
    if (!ensure()) return;
    resume();
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    src.start(t0);
  }

  const SFX = {
    tap(combo = 1) {
      const base = 220 + Math.min(combo, 24) * 18;
      tone({ freq: base, type: "triangle", dur: 0.08, vol: 0.18, slide: 60 });
    },
    fling() {
      tone({ freq: 180, type: "sawtooth", dur: 0.18, vol: 0.12, slide: 320 });
      noise({ dur: 0.16, vol: 0.08, filterFreq: 900 });
    },
    bounce() {
      tone({ freq: 140, type: "sine", dur: 0.12, vol: 0.16, slide: -40 });
      noise({ dur: 0.08, vol: 0.06, filterFreq: 500 });
    },
    propThrow() {
      tone({ freq: 320, type: "triangle", dur: 0.1, vol: 0.12, slide: -120 });
    },
    hit(power = 1) {
      const f = 70 + power * 40;
      tone({ freq: f, type: "square", dur: 0.1, vol: 0.16 + power * 0.06, slide: -30 - power * 20 });
      noise({ dur: 0.08 + power * 0.05, vol: 0.1 + power * 0.06, filterFreq: 500 + power * 300 });
      if (power > 1.5) {
        tone({ freq: 55, type: "sawtooth", dur: 0.18, vol: 0.12, slide: -20, delay: 0.02 });
      }
    },
    shoot(id) {
      const map = {
        pistol: [180, 0.08, 0.14],
        smg: [220, 0.05, 0.1],
        shotgun: [120, 0.12, 0.2],
        sniper: [90, 0.16, 0.22],
        laser: [680, 0.08, 0.12],
        railgun: [420, 0.2, 0.22],
      };
      const [f, d, v] = map[id] || [200, 0.08, 0.14];
      tone({ freq: f, type: id === "laser" || id === "railgun" ? "sawtooth" : "square", dur: d, vol: v, slide: id === "laser" ? -300 : -80 });
      noise({ dur: d, vol: v * 0.7, filterFreq: id === "shotgun" ? 400 : 1200 });
      if (id === "sniper" || id === "railgun") {
        tone({ freq: f * 0.5, type: "triangle", dur: 0.2, vol: 0.1, slide: -40, delay: 0.02 });
      }
    },
    explode() {
      tone({ freq: 60, type: "sawtooth", dur: 0.35, vol: 0.22, slide: -30 });
      noise({ dur: 0.32, vol: 0.2, filterFreq: 280 });
      tone({ freq: 40, type: "square", dur: 0.5, vol: 0.12, slide: -10, delay: 0.05 });
    },
    flame() {
      noise({ dur: 0.12, vol: 0.08, filterFreq: 300 });
      tone({ freq: 90, type: "sawtooth", dur: 0.1, vol: 0.06, slide: 30 });
    },
    pop() {
      tone({ freq: 520, type: "sine", dur: 0.06, vol: 0.12, slide: 180 });
    },
    coin() {
      tone({ freq: 660, type: "square", dur: 0.07, vol: 0.1 });
      tone({ freq: 880, type: "square", dur: 0.1, vol: 0.1, delay: 0.06 });
    },
    unlock() {
      [0, 0.08, 0.16, 0.24].forEach((d, i) => {
        tone({ freq: 440 * Math.pow(1.26, i), type: "triangle", dur: 0.14, vol: 0.12, delay: d });
      });
    },
    fail() {
      tone({ freq: 300, type: "sawtooth", dur: 0.25, vol: 0.12, slide: -180 });
      tone({ freq: 200, type: "triangle", dur: 0.3, vol: 0.1, slide: -80, delay: 0.12 });
    },
    click() {
      tone({ freq: 480, type: "triangle", dur: 0.04, vol: 0.1 });
    },
    pause() {
      tone({ freq: 360, type: "sine", dur: 0.08, vol: 0.1, slide: -60 });
    },
  };

  function startMusic(sceneIndex = 0) {
    if (!enabled || !musicVolume) return;
    if (!ensure()) return;
    resume();
    stopMusic();
    const root = [110, 98, 123][sceneIndex % 3];
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    oscA.type = "sine";
    oscB.type = "triangle";
    oscA.frequency.value = root;
    oscB.frequency.value = root * 1.5;
    filter.type = "lowpass";
    filter.frequency.value = 600;
    g.gain.value = 0.08;
    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(g);
    g.connect(musicGain);
    oscA.start();
    oscB.start();
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, musicVolume),
      ctx.currentTime + 0.8
    );
    musicNodes = { oscA, oscB, g };
  }

  function stopMusic() {
    if (!musicNodes || !ctx) return;
    try {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      const nodes = musicNodes;
      musicNodes = null;
      setTimeout(() => {
        try {
          nodes.oscA.stop();
          nodes.oscB.stop();
        } catch (e) {}
      }, 500);
    } catch (e) {}
  }

  function applySettings(settings) {
    enabled = !!settings.sfxOn || !!settings.musicOn;
    sfxVolume = Number(settings.sfxVolume) || 0;
    musicVolume = Number(settings.musicVolume) || 0;
    if (sfxGain) sfxGain.gain.value = settings.sfxOn ? sfxVolume : 0;
    if (musicGain && musicNodes) {
      musicGain.gain.value = settings.musicOn ? musicVolume : 0;
    } else if (musicGain && !settings.musicOn) {
      stopMusic();
    }
    if (!settings.musicOn) stopMusic();
  }

  global.STAudio = {
    resume,
    SFX,
    startMusic,
    stopMusic,
    applySettings,
  };
})(window);
