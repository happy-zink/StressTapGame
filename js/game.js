/* game.js — 暴打火柴人沙盒：武器/穿刺/爆炸/hitstop/宣泄 */
(function (global) {
  const canvas = () => document.getElementById("game-canvas");
  const ctx = () => {
    const c = canvas();
    return c ? c.getContext("2d") : null;
  };

  const THEMES = [
    { id: 0, name: "暗巷出气", bg: ["#2a2030", "#4a3550"], ground: "#3a2a38", accent: "#ff6b4a", gravity: 1600, bounce: 0.55 },
    { id: 1, name: "水泥工地", bg: ["#5a6570", "#7a8590"], ground: "#4a5558", accent: "#ffc145", gravity: 1750, bounce: 0.5 },
    { id: 2, name: "霓虹夜店", bg: ["#1a1030", "#2a1850"], ground: "#201838", accent: "#8b7cf6", gravity: 1500, bounce: 0.62 },
  ];

  const S = {
    running: false,
    paused: false,
    theme: 0,
    // combat
    weaponId: "fist",
    rage: 0,
    rageMode: 0,
    combo: 0,
    comboTimer: 0,
    hits: 0,
    damage: 0,
    lastAttackAt: 0,
    // effects
    particles: [],
    projectiles: [],
    stuck: [],
    texts: [],
    slashes: [],
    rings: [],
    meteors: [],
    explosions: [], // {x,y,t,power,color}
    tracers: [], // {x1,y1,x2,y2,life,color}
    muzzles: [], // {x,y,angle,life,size,color}
    bolts: [], // lightning {x,yTop,yBot,life,color}
    flames: [], // jet {x,y,dx,dy,life,size}
    shells: [],
    impactStars: [], // visual impact stars
    hits: 0, // hit count
    blackholes: [],
    trails: new Map(), // projectile id -> trail points
    hitstop: 0,
    shake: 0,
    flash: 0,
    slowmo: 0,
    // character
    character: {
      x: 0, y: 0, vx: 0, vy: 0, angle: 0, va: 0,
      scaleX: 1, scaleY: 1,
      headRadius: 52,
      state: "idle",
      stateTimer: 0,
      pain: 0,
      burn: 0,
      shock: 0,
      frozen: 0,
    },
    photoImage: null,
    expression: "happy",
    costume: "none",
    onStateChange: null,
    raf: 0,
    lastTs: 0,
    fallbackTimer: 0,
    cooldowns: {},
  };

  function theme() {
    return THEMES[S.theme] || THEMES[0];
  }

  function ch() {
    return S.character;
  }

  // ---------- lifecycle ----------
  function resize() {
    const c = canvas();
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || window.innerWidth;
    const h = c.clientHeight || window.innerHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    const t = ch();
    t.x = Math.min(Math.max(t.x, 100), w - 100);
    t.y = Math.min(Math.max(t.y, 80), h - 120);
  }

  function start(themeIndex) {
    if (themeIndex != null) S.theme = Math.max(0, Math.min(THEMES.length - 1, themeIndex | 0));
    S.running = true;
    S.paused = false;
    S.rage = 0;
    S.rageMode = 0;
    S.combo = 0;
    S.comboTimer = 0;
    S.hits = 0;
    S.damage = 0;
    S.particles = [];
    S.projectiles = [];
    S.stuck = [];
    S.texts = [];
    S.slashes = [];
    S.rings = [];
    S.meteors = [];
    S.explosions = [];
    S.tracers = [];
    S.muzzles = [];
    S.bolts = [];
    S.flames = [];
    S.shells = [];
    S.impactStars = [];
    S.blackholes = [];
    S.trails = new Map();
    S.hitstop = 0;
    S.shake = 0;
    S.flash = 0;
    S.slowmo = 0;
    S.cooldowns = {};
    S.weaponId = S.weaponId || "fist";

    const c = canvas();
    resize();
    const w = (c && c.clientWidth) || window.innerWidth;
    const h = (c && c.clientHeight) || window.innerHeight;
    const t = ch();
    t.x = w * 0.5;
    t.y = h * 0.45;
    t.vx = 0;
    t.vy = 0;
    t.angle = 0;
    t.va = 0;
    t.scaleX = 1;
    t.scaleY = 1;
    t.headRadius = Math.max(42, Math.min(w, h) * 0.075);
    t.state = "idle";
    t.stateTimer = 0;
    t.pain = 0;
    t.burn = 0;
    t.shock = 0;
    t.frozen = 0;

    S.lastTs = 0;
    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(loop);
    updateHUD();
    if (S.onStateChange) S.onStateChange("running");
  }

  function stop() {
    S.running = false;
    S.paused = false;
    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = 0;
    if (S.onStateChange) S.onStateChange("stopped");
  }

  function pause() {
    if (!S.running) return;
    S.paused = true;
    if (S.onStateChange) S.onStateChange("paused");
  }

  function resume() {
    if (!S.running) return;
    S.paused = false;
    S.lastTs = 0;
    if (S.onStateChange) S.onStateChange("running");
  }

  function setPhoto(url, expression, costume) {
    S.expression = expression || S.expression;
    S.costume = costume || S.costume;
    if (!url) {
      S.photoImage = null;
      return;
    }
    const img = new Image();
    img.onload = () => { S.photoImage = img; };
    img.src = url;
  }

  function setCharacterOptions(expression, costume) {
    if (expression) S.expression = expression;
    if (costume) S.costume = costume;
  }

  function setWeapon(id) {
    if (global.STWeapons && STWeapons.byId[id]) {
      S.weaponId = id;
      if (S.onStateChange) S.onStateChange("weapon", id);
      updateHUD();
    }
  }

  // ---------- loop ----------
  function loop(ts) {
    if (!S.running) return;
    S.raf = requestAnimationFrame(loop);
    if (S.paused) return;
    let dt = Math.min(0.033, S.lastTs ? (ts - S.lastTs) / 1000 : 0.016);
    S.lastTs = ts;
    if (S.hitstop > 0) {
      S.hitstop -= dt * 1000;
      // still draw during hitstop
      draw();
      return;
    }
    if (S.slowmo > 0) {
      S.slowmo -= dt;
      dt *= 0.35;
    }
    step(dt);
    draw();
  }

  // fallback for background tab throttling
  if (!S.fallbackTimer) {
    S.fallbackTimer = setInterval(() => {
      if (!S.running || S.paused) return;
      const now = performance.now();
      if (S.lastTs && now - S.lastTs < 80) return;
      if (S.hitstop > 0) {
        S.hitstop -= 50;
        draw();
        return;
      }
      let dt = Math.min(0.05, S.lastTs ? (now - S.lastTs) / 1000 : 0.03);
      S.lastTs = now;
      step(dt);
      draw();
    }, 50);
  }

  function step(dt) {
    const t = ch();
    const c = canvas();
    const w = (c && c.clientWidth) || window.innerWidth;
    const h = (c && c.clientHeight) || window.innerHeight;
    const th = theme();

    // combo decay
    if (S.combo > 0) {
      S.comboTimer -= dt;
      if (S.comboTimer <= 0) S.combo = 0;
    }
    // rage drain in rage mode
    if (S.rageMode > 0) {
      S.rageMode -= dt;
      S.rage = Math.max(0, S.rage - dt * 28);
      if (S.rageMode <= 0) S.rageMode = 0;
    } else {
      S.rage = Math.max(0, S.rage - dt * 2.5);
    }

    // physics
    if (t.frozen > 0) {
      t.frozen -= dt;
      t.vx *= 0.9;
      t.vy *= 0.9;
    } else {
      t.vy += th.gravity * dt;
    }
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.angle += t.va * dt;
    t.va *= 0.99;
    t.vx *= 0.996;

    // floor
    const floorY = h * 0.78;
    const pad = t.headRadius * 1.5;
    if (t.y + t.headRadius * 2.2 > floorY) {
      t.y = floorY - t.headRadius * 2.2;
      if (t.vy > 120) {
        t.vy = -t.vy * th.bounce;
        if (Math.abs(t.vy) < 90) t.vy = 0;
        if (Math.abs(t.vy) > 400) {
          spawnBurst(t.x, floorY - 8, th.accent, 6);
          if (global.STAudio) global.STAudio.SFX.bounce();
        }
      } else {
        t.vy = 0;
      }
      t.vx *= 0.85;
      t.va *= 0.75;
    }
    // walls
    if (t.x < pad) {
      t.x = pad;
      if (t.vx < 0) t.vx = -t.vx * th.bounce * 0.85;
    }
    if (t.x > w - pad) {
      t.x = w - pad;
      if (t.vx > 0) t.vx = -t.vx * th.bounce * 0.85;
    }
    // ceiling
    const ceil = t.headRadius * 1.1;
    if (t.y < ceil) {
      t.y = ceil;
      if (t.vy < 0) t.vy = -t.vy * 0.4;
    }

    // squash recover
    t.scaleX += (1 - t.scaleX) * 0.16;
    t.scaleY += (1 - t.scaleY) * 0.16;
    t.pain = Math.max(0, t.pain - dt);
    t.burn = Math.max(0, t.burn - dt);
    t.shock = Math.max(0, t.shock - dt);
    if (t.stateTimer > 0) {
      t.stateTimer -= dt;
      if (t.stateTimer <= 0 && t.state !== "idle") t.state = t.burn > 0 ? "burn" : "idle";
    }

    // projectiles
    for (let i = S.projectiles.length - 1; i >= 0; i--) {
      const p = S.projectiles[i];
      p.life -= dt;
      if (p.kind === "throw" || p.kind === "shoot" || p.kind === "stab" || p.kind === "bolt") {
        if (!p.blast || p.life > 0.15) {
          p.vy += (p.gravity != null ? p.gravity : th.gravity * 0.45) * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.spin += (p.spinV || 0) * dt;
        // trail
        if (S.trails.has(p.id)) {
          const tr = S.trails.get(p.id);
          tr.push({ x: p.x, y: p.y, life: 0.18, maxLife: 0.18, color: p.color });
          if (tr.length > 10) tr.shift();
          for (let k = 0; k < tr.length; k++) tr[k].life -= dt;
        }
      } else if (p.kind === "flame") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 40 * dt;
        p.tick -= dt;
        if (p.tick <= 0) {
          p.tick = 0.12;
          tryHitPoint(p.x, p.y, 50, { ...p, damageMul: 0.35, noStick: true, weak: true });
        }
      }

      // collide character
      const aimX = t.x;
      const aimY = t.y - t.headRadius * 0.55;
      const dist = Math.hypot(p.x - aimX, p.y - aimY);
      if (p.homing) {
        const adx = aimX - p.x;
        const ady = aimY - p.y;
        const ad = Math.hypot(adx, ady) || 1;
        if (ad < 650) {
          const steer = Math.min(3200, 1600 * (1 - ad / 650) + 500);
          p.vx += (adx / ad) * steer * dt;
          p.vy += (ady / ad) * steer * dt;
        }
      }

      const hitR = t.headRadius * (p.weak ? 2.2 : 3.0);
      if (dist < hitR && p.life > 0 && !p.dead) {
        onProjectileHit(p);
        if (!p.pierce) {
          S.projectiles.splice(i, 1);
          continue;
        }
      }

      // offscreen / expired
      if (p.life <= 0 || p.y > h + 120 || p.x < -120 || p.x > w + 120) {
        if (p.blast && p.life <= 0) explode(p.x, p.y, p);
        S.projectiles.splice(i, 1);
      }
    }

    // meteors (fromSky bolts spawn late)
    for (let i = S.meteors.length - 1; i >= 0; i--) {
      const m = S.meteors[i];
      m.delay -= dt;
      if (m.delay <= 0) {
        // fire projectile downward
        spawnProjectile({
          kind: "throw", x: m.x, y: -40,
          vx: (t.x - m.x) * 0.6, vy: 900,
          power: m.power, blast: m.blast, stick: false,
          emoji: m.emoji, color: m.color, hitstop: m.hitstop,
          shake: m.shake, flash: m.flash,
        });
        S.meteors.splice(i, 1);
      }
    }

    // stuck weapons wobble
    for (const k of S.stuck) {
      k.wobble = Math.max(0, (k.wobble || 0) - dt * 2.2);
      k.life -= dt;
    }
    // drop old stuck
    S.stuck = S.stuck.filter((k) => k.life > 0);

    // age FX
    for (const ex of S.explosions) {
      ex.t += dt / ex.maxLife;
      ex.life -= dt;
    }
    S.explosions = S.explosions.filter((e) => e.life > 0);
    for (const tr of S.tracers) tr.life -= dt;
    S.tracers = S.tracers.filter((t2) => t2.life > 0);
    for (const m of S.muzzles) m.life -= dt;
    S.muzzles = S.muzzles.filter((m) => m.life > 0);
    for (const b of S.bolts) b.life -= dt;
    S.bolts = S.bolts.filter((b) => b.life > 0);
    for (const f of S.flames) f.life -= dt;
    S.flames = S.flames.filter((f) => f.life > 0);
    for (const sc of S.shells) {
      sc.vy += 700 * dt;
      sc.x += sc.vx * dt;
      sc.y += sc.vy * dt;
      sc.rot += sc.vr * dt;
      sc.life -= dt;
    }
    S.shells = S.shells.filter((s2) => s2.life > 0);
    for (const h of S.impactStars) h.life -= dt;
    S.impactStars = S.impactStars.filter((h) => h.life > 0);
    for (const bh of S.blackholes) {
      bh.life -= dt;
      bh.t += dt;
    }
    S.blackholes = S.blackholes.filter((b) => b.life > 0);

    // particles
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.vy += (p.g || 600) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.kind === "flame") {
        p.y -= 40 * dt;
        p.vx *= 0.98;
      }
      if (p.life <= 0) S.particles.splice(i, 1);
    }

    // texts / rings / slashes
    for (let i = S.texts.length - 1; i >= 0; i--) {
      const t2 = S.texts[i];
      t2.y -= 55 * dt;
      t2.life -= dt;
      if (t2.life <= 0) S.texts.splice(i, 1);
    }
    for (let i = S.rings.length - 1; i >= 0; i--) {
      S.rings[i].life -= dt;
      S.rings[i].r += S.rings[i].vr * dt;
      if (S.rings[i].life <= 0) S.rings.splice(i, 1);
    }
    for (let i = S.slashes.length - 1; i >= 0; i--) {
      S.slashes[i].life -= dt;
      if (S.slashes[i].life <= 0) S.slashes.splice(i, 1);
    }

    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 3.2);
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 4);

    updateHUD();
  }

  // ---------- combat ----------
  function weapon() {
    return (global.STWeapons && STWeapons.byId[S.weaponId]) || STWeapons.byId.fist;
  }

  function ready(id) {
    const now = performance.now();
    return (S.cooldowns[id] || 0) <= now;
  }

  function markCooldown(id) {
    const w = STWeapons.byId[id];
    const now = performance.now();
    const cd = (w && w.cooldown) || 0.2;
    // faster in rage mode
    S.cooldowns[id] = now + cd * (S.rageMode > 0 ? 0.35 : 1);
  }

  function pointerPos(e) {
    const c = canvas();
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e) {
    if (!S.running || S.paused) return;
    global.STAudio && global.STAudio.resume();
    const pos = pointerPos(e);
    useWeaponAt(pos.x, pos.y);
  }

  function useWeaponAt(x, y) {
    const w = weapon();
    if (!ready(w.id)) return;
    if (w.rageOnly && S.rageMode <= 0) {
      addText(x, y - 40, "宣泄值不足", "#fff");
      return;
    }
    markCooldown(w.id);

    const t = ch();
    const dist = Math.hypot(x - t.x, y - (t.y - t.headRadius * 0.5));
    const reach = t.headRadius * 3.2;

    // decide melee vs ranged origin
    const isMelee = ["punch", "slap", "kick", "stomp", "slash", "stab"].includes(w.kind);

    if (isMelee) {
      // generous snap so stress-relief clicking always feels good
      const near = Math.hypot(x - t.x, y - (t.y - t.headRadius * 0.55));
      const meleeRange = t.headRadius * 5.5;
      if (near > meleeRange) {
        spawnSlash(x, y, w);
        if (global.STAudio) global.STAudio.SFX.click();
        return;
      }
      const hx = near > t.headRadius * 2.2 ? t.x + (x - t.x) * 0.25 : x;
      const hy = near > t.headRadius * 2.2 ? t.y - t.headRadius * 0.5 + (y - t.y) * 0.2 : y;
      spawnSlash(hx, hy, w);
      const power = w.power * (S.rageMode > 0 ? 1.45 : 1);
      applyHit(power, w, {
        knockX: (hx - t.x) * 1.1 + (Math.random() - 0.5) * 50,
        knockY: (hy - t.y) * 0.5 - 140 * power,
      });
      if (w.stick && (w.kind === "stab")) {
        tryStick(hx, hy, w);
      }
      return;
    }

    // ranged / thrown
    const originX = w.fromSky ? x : x;
    const originY = w.fromSky ? -40 : Math.min(y, t.y - 40);
    // fire from above/side toward character or click point
    const shots = w.count || 1;
    for (let i = 0; i < shots; i++) {
      const spread = (w.spread || 0) * (i - (shots - 1) / 2);
      if (w.fromSky) {
        // lightning bolt visual + strike
        S.bolts.push({
          x: t.x + (Math.random() - 0.5) * 30,
          yTop: 0,
          yBot: t.y - t.headRadius * 0.3,
          life: 0.35,
          maxLife: 0.35,
          color: w.color || "#fff36a",
        });
        spawnProjectile({
          kind: "throw",
          x: t.x + (Math.random() - 0.5) * 40,
          y: t.y - 30,
          vx: 0,
          vy: 400,
          power: w.power,
          blast: !!w.blast,
          stick: false,
          emoji: w.emoji,
          weaponId: w.id,
          color: w.color,
          hitstop: w.hitstop,
          shake: w.shake,
          flash: w.flash,
          gravity: 0,
          homing: true,
          life: 0.2,
        });
        S.rings.push({ x: t.x, y: t.y - t.headRadius, r: 30, vr: 500, life: 0.3, maxLife: 0.3, color: w.color });
        S.flash = Math.min(1, S.flash + 0.35);
        if (global.STAudio) global.STAudio.SFX.explode();
        continue;
      }
      // aim at click or character
      const tx = x + spread * 120;
      const ty = y + spread * 40;
      const spd = w.speed || 900;
      const isGun = w.kind === "shoot" || w.kind === "bolt";
      // guns spawn offscreen side and always lead toward character (or click)
      const aimX = isGun ? t.x : tx;
      const aimY = isGun ? t.y - t.headRadius * 0.55 : ty;
      const fromX = isGun ? (aimX >= t.x ? -30 : canvas().clientWidth + 30) : originX;
      const fromY = isGun ? Math.max(30, aimY + (Math.random() - 0.5) * 30) : Math.max(20, t.y - t.headRadius * 2.2);
      const dx = aimX - fromX;
      const dy = aimY - fromY;
      const len = Math.hypot(dx, dy) || 1;
      spawnProjectile({
        kind: w.kind,
        x: fromX,
        y: fromY,
        vx: isGun ? (dx / len) * spd : (dx / len) * spd * (0.85 + Math.random() * 0.3),
        vy: isGun ? (dy / len) * spd : (dy / len) * spd * 0.7 - 120,
        power: w.power * (S.rageMode > 0 ? 1.35 : 1),
        blast: !!w.blast,
        stick: !!w.stick,
        emoji: w.emoji,
        weaponId: w.id,
        color: w.color,
        hitstop: w.hitstop,
        shake: w.shake,
        flash: w.flash,
        homing: true,
        gravity: isGun ? 0 : (w.blast ? 500 : 700),
        damageMul: 1,
      });

      // gun FX: muzzle flash + tracer + shell
      if (isGun && global.STFx) {
        const ang = Math.atan2(dy, dx);
        S.muzzles.push({
          x: fromX + Math.cos(ang) * 40,
          y: fromY + Math.sin(ang) * 40,
          angle: ang,
          life: 0.22,
          maxLife: 0.22,
          size: w.id === "shotgun" || w.id === "railgun" ? 55 : 38,
          color: w.id === "laser" || w.id === "railgun" ? w.color : "#ffd24a",
        });
        S.tracers.push({
          x1: fromX, y1: fromY,
          x2: fromX + (dx / len) * 220,
          y2: fromY + (dy / len) * 220,
          life: 0.28, maxLife: 0.28,
          color: w.id === "laser" || w.id === "railgun" ? w.color : "rgba(255,220,120,0.95)",
        });
        if (w.id !== "laser" && w.id !== "railgun") {
          S.shells.push({
            x: fromX + 10, y: fromY + 8,
            vx: (Math.random() - 0.5) * 80,
            vy: -120 - Math.random() * 60,
            life: 0.7,
            rot: Math.random() * 3,
            vr: (Math.random() - 0.5) * 10,
          });
        }
      }
    }
    if (w.kind === "flame") {
      // continuous jet toward click + visible flame cone
      S.flames.push({
        x: t.x + (x - t.x) * 0.15,
        y: t.y - t.headRadius * 0.7,
        dx: x - t.x,
        dy: y - t.y + 40,
        life: 0.22,
        maxLife: 0.22,
        size: w.id === "flamethrower" ? 90 : 55,
      });
      for (let i = 0; i < 5; i++) {
        spawnProjectile({
          kind: "flame",
          x: t.x + (x - t.x) * 0.2,
          y: t.y - t.headRadius * 0.8,
          vx: (x - t.x) * 1.8 + (Math.random() - 0.5) * 120,
          vy: (y - t.y) * 1.8 - 180 + Math.random() * 80,
          power: w.power,
          emoji: "🔥",
          weaponId: w.id,
          color: w.color,
          hitstop: w.hitstop * 0.5,
          shake: w.shake * 0.5,
          flash: 0,
          life: 0.55,
          tick: 0.05,
          weak: true,
          noStick: true,
        });
      }
    }
    if (w.id === "blackhole") {
      S.blackholes.push({
        x: t.x, y: t.y - t.headRadius * 0.5,
        life: 1.6, maxLife: 1.6, t: 0,
      });
      // pull hits
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (!S.running) return;
          applyHit(0.9, { hitstop: 30, shake: 0.25, color: "#c48cff" }, {
            knockX: (Math.random() - 0.5) * 60,
            knockY: -30,
          });
        }, 120 + i * 140);
      }
    }
    if (global.STAudio) {
      if (w.cat === "guns") global.STAudio.SFX.shoot(w.id);
      else if (w.cat === "explosive" || w.blast) global.STAudio.SFX.propThrow();
      else if (w.kind === "flame") global.STAudio.SFX.flame();
      else if (w.cat === "ultimate") global.STAudio.SFX.unlock();
      else global.STAudio.SFX.propThrow();
    }
  }

  function spawnProjectile(p) {
    const id = Math.random().toString(36).slice(2);
    const proj = {
      id,
      kind: p.kind || "throw",
      x: p.x, y: p.y,
      vx: p.vx || 0, vy: p.vy || 0,
      gravity: p.gravity != null ? p.gravity : 500,
      life: p.life != null ? p.life : 2.4,
      spin: 0,
      spinV: (Math.random() - 0.5) * 12,
      power: p.power || 1,
      blast: !!p.blast,
      stick: !!p.stick,
      emoji: p.emoji || "💥",
      weaponId: p.weaponId || null,
      color: p.color || "#fff",
      hitstop: p.hitstop || 30,
      shake: p.shake || 0.2,
      flash: p.flash || 0.1,
      homing: !!p.homing,
      damageMul: p.damageMul != null ? p.damageMul : 1,
      tick: p.tick || 0,
      weak: !!p.weak,
      noStick: !!p.noStick,
      pierce: !!p.pierce,
      dead: false,
    };
    S.projectiles.push(proj);
    S.trails.set(id, []);
    return proj;
  }

  function spawnSlash(x, y, w) {
    S.slashes.push({
      x, y,
      r: 90 + w.power * 40,
      life: 0.28,
      maxLife: 0.28,
      color: w.color || "rgba(255,255,255,0.85)",
      ang: Math.random() * Math.PI * 2,
      weaponId: w.id,
    });
    // secondary slash for big weapons
    if (w.power >= 1.5) {
      S.slashes.push({
        x: x + 10, y: y + 8,
        r: 70 + w.power * 30,
        life: 0.22,
        maxLife: 0.22,
        color: "rgba(255,255,255,0.55)",
        ang: Math.random() * Math.PI * 2,
        weaponId: w.id,
      });
    }
    S.rings.push({ x, y, r: 18, vr: 320, life: 0.28, maxLife: 0.28, color: w.color || "#fff" });
  }

  function tryStick(x, y, w) {
    const t = ch();
    if (S.stuck.length > 18) S.stuck.shift();
    const dx = x - t.x;
    const dy = y - (t.y - t.headRadius * 0.6);
    S.stuck.push({
      emoji: w.emoji,
      weaponId: w.weaponId || w.id || null,
      color: w.color,
      ox: dx,
      oy: dy,
      angle: Math.atan2(dy, dx) + Math.PI / 2,
      life: 8,
      wobble: 1,
    });
    // stab impact rays
    S.impactStars.push({
      x: t.x + dx,
      y: t.y + dy,
      life: 0.22,
      maxLife: 0.22,
      power: 1.1,
      color: "#fff",
    });
  }

  function onProjectileHit(p) {
    const t = ch();
    if (p.blast) {
      explode(p.x, p.y, p);
      return;
    }
    const power = (p.power || 1) * (p.damageMul || 1);
    applyHit(power, p, {
      knockX: p.vx * 0.22 + (Math.random() - 0.5) * 40,
      knockY: p.vy * 0.12 - 160 * power,
    });
    if (p.stick && !p.noStick) {
      tryStick(p.x, p.y, {
        emoji: p.emoji,
        weaponId: p.weaponId,
        color: p.color,
      });
    }
    if (p.kind === "flame") {
      t.burn = Math.max(t.burn, 1.2);
      t.state = "burn";
      t.stateTimer = Math.max(t.stateTimer, 0.4);
    }
  }

  function tryHitPoint(x, y, radius, p) {
    const t = ch();
    const dist = Math.hypot(x - t.x, y - (t.y - t.headRadius * 0.5));
    if (dist < radius + t.headRadius * 1.4) {
      applyHit((p.power || 1) * (p.damageMul || 1) * 0.5, p, {
        knockX: (Math.random() - 0.5) * 120,
        knockY: -40,
      });
    }
  }

  function explode(x, y, p) {
    const t = ch();
    const power = p.power || 2;
    const radius = 140 + power * 36;
    const dist = Math.hypot(x - t.x, y - (t.y - t.headRadius * 0.4));
    if (dist < radius) {
      const falloff = 1 - dist / radius;
      applyHit(power * (0.7 + falloff * 0.8), p, {
        knockX: (t.x - x) * 2.2 * falloff + (Math.random() - 0.5) * 80,
        knockY: -280 * power * falloff - 80,
      });
    }
    // multi-stage explosion FX
    S.explosions.push({
      x, y,
      t: 0,
      power: power * 1.35,
      color: p.color || "#ffd24a",
      life: 0.85,
      maxLife: 0.85,
    });
    spawnBurst(x, y, p.color || "#fa0", 32);
    spawnBurst(x, y, "#ffe08a", 22);
    spawnBurst(x, y, "#fff", 12);
    // debris chunks
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      S.particles.push({
        x, y,
        vx: Math.cos(a) * (200 + Math.random() * 280),
        vy: Math.sin(a) * (200 + Math.random() * 280) - 120,
        g: 900,
        life: 0.55 + Math.random() * 0.45,
        maxLife: 1,
        color: i % 2 ? "#333" : "#666",
        r: 4 + Math.random() * 7,
        square: true,
      });
    }
    S.rings.push({ x, y, r: 30, vr: 900, life: 0.45, maxLife: 0.45, color: "#fff" });
    S.rings.push({ x, y, r: 20, vr: 700, life: 0.35, maxLife: 0.35, color: p.color || "#fc0" });
    S.flash = Math.min(1, S.flash + (p.flash || 0.35) + 0.25);
    S.shake = Math.min(1.2, S.shake + (p.shake || 0.6));
    if (global.STAudio) global.STAudio.SFX.explode();
  }

  function applyHit(power, meta, knock) {
    const t = ch();
    S.hits += 1;
    S.damage += power * 22;
    S.combo += 1;
    S.comboTimer = 1.6;
    S.rage = Math.min(100, S.rage + 4 + power * 3.2);

    const comboMul = 1 + Math.min(S.combo, 40) * 0.055;
    const score = Math.round(power * 48 * comboMul);
    addText(t.x + (Math.random() - 0.5) * 40, t.y - t.headRadius * 2.1, `+${score}`, "#fff");
    if (S.combo > 0 && S.combo % 5 === 0) {
      addText(t.x, t.y - t.headRadius * 2.8, `${S.combo} COMBO!`, "#ffc145");
    }
    if (power >= 2) {
      addText(t.x, t.y - t.headRadius * 1.6, "暴击！", "#ff6b4a");
    }

    t.vx += knock.knockX || 0;
    t.vy += knock.knockY || -120;
    t.va += (Math.random() - 0.5) * (3 + power);
    t.scaleX = 1 + Math.min(0.28, 0.08 + power * 0.05);
    t.scaleY = 1 - Math.min(0.22, 0.05 + power * 0.04);
    t.pain = 0.35 + power * 0.12;
    t.state = power > 2 ? "stunned" : "hit";
    t.stateTimer = power > 2 ? 0.7 : 0.28 + power * 0.08;

    S.hitstop = Math.max(S.hitstop, (meta && meta.hitstop) || 40);
    S.shake = Math.min(1.2, S.shake + ((meta && meta.shake) || 0.3));
    S.flash = Math.min(1, S.flash + ((meta && meta.flash) || 0.12));

    S.impactStars.push({
      x: t.x + (Math.random() - 0.5) * 30,
      y: t.y - t.headRadius * (0.4 + Math.random() * 0.6),
      life: 0.28,
      maxLife: 0.28,
      power: Math.min(2.2, power),
      color: (meta && meta.color) || "#fff",
    });
    spawnBurst(t.x, t.y - t.headRadius, (meta && meta.color) || "#ff6b4a", 12);
    S.rings.push({
      x: t.x, y: t.y - t.headRadius * 0.5,
      r: 16, vr: 360, life: 0.25, maxLife: 0.25,
      color: "#fff",
    });

    if (global.STAudio) global.STAudio.SFX.hit(Math.min(1, power));
    if (S.rage >= 100 && S.rageMode <= 0) {
      addText(t.x, t.y - t.headRadius * 3, "宣泄满了！按空格/大招", "#ff4a8a");
    }
  }

  function spawnBurst(x, y, color, n) {
    const level = (global.STSaveSettings && global.STSaveSettings.vfxLevel) != null
      ? global.STSaveSettings.vfxLevel : 2;
    const mul = level === 0 ? 0.4 : level === 1 ? 0.75 : 1;
    const count = Math.max(4, Math.round(n * mul));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 90 + Math.random() * 320;
      S.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 50,
        g: 520,
        life: 0.3 + Math.random() * 0.55,
        maxLife: 0.85,
        color,
        r: 3 + Math.random() * 6,
      });
    }
  }

  function addText(x, y, text, color) {
    S.texts.push({
      x, y, text,
      color: color || "#fff",
      life: 0.95, maxLife: 0.95,
      size: 20 + Math.min(18, (S.combo || 0) * 0.3),
    });
  }

  function triggerUltimate(id) {
    const w = STWeapons.byId[id];
    if (!w || !w.rageOnly) return false;
    if (S.rageMode > 0 && w.id === "rush") return false;
    if (S.rage < 100 && S.rageMode <= 0) {
      return false;
    }
    S.rage = 0;
    S.rageMode = 0;
    const c = canvas();
    const w0 = c.clientWidth;
    const h0 = c.clientHeight;
    const t = ch();

    if (id === "rush") {
      S.rageMode = 3.2;
      addText(t.x, t.y - 140, "暴走！！", "#ff4a8a");
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          if (!S.running) return;
          applyHit(1.4, { hitstop: 35, shake: 0.35, color: "#ff4a8a" }, {
            knockX: (Math.random() - 0.5) * 280,
            knockY: -180 - Math.random() * 160,
          });
        }, i * 120);
      }
    } else if (id === "stampede") {
      addText(t.x, t.y - 140, "万剑齐发！", "#6cf");
      for (let i = 0; i < 16; i++) {
        setTimeout(() => {
          if (!S.running) return;
          const x = Math.random() * w0;
          spawnProjectile({
            kind: "throw",
            x, y: -30,
            vx: (t.x - x) * 1.2,
            vy: 1100,
            power: 1.5,
            stick: true,
            emoji: "🗡️",
            color: "#6cf",
            hitstop: 35,
            shake: 0.3,
            flash: 0.08,
            homing: true,
            gravity: 200,
          });
        }, i * 80);
      }
    } else if (id === "nuke") {
      addText(t.x, t.y - 140, "清屏！！", "#fc0");
      S.flash = 1;
      S.shake = 1.2;
      S.hitstop = 140;
      explode(t.x, t.y, { power: 4, color: "#fc0", flash: 0.8, shake: 1 });
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (!S.running) return;
          explode(
            t.x + (Math.random() - 0.5) * 200,
            t.y + (Math.random() - 0.5) * 120,
            { power: 2.5, color: "#f80", flash: 0.3, shake: 0.5 }
          );
        }, 120 + i * 150);
      }
    } else if (id === "godfist") {
      addText(t.x, t.y - 160, "天降神掌", "#fff");
      S.slowmo = 0.6;
      S.hitstop = 80;
      setTimeout(() => {
        if (!S.running) return;
        applyHit(3.2, { hitstop: 100, shake: 0.95, flash: 0.55, color: "#fff" }, {
          knockX: (Math.random() - 0.5) * 100,
          knockY: -520,
        });
        spawnBurst(t.x, t.y - t.headRadius, "#fff", 40);
        S.rings.push({ x: t.x, y: t.y - t.headRadius, r: 30, vr: 900, life: 0.45, maxLife: 0.45, color: "#fff" });
      }, 280);
    }
    if (global.STAudio) global.STAudio.SFX.unlock();
    updateHUD();
    return true;
  }

  function activateRage() {
    if (S.rage < 100 && S.rageMode <= 0) return false;
    return triggerUltimate("rush");
  }

  // ---------- input ----------
  function bindInput() {
    const c = canvas();
    if (!c) return;
    c.addEventListener("pointerdown", onPointerDown);
    c.addEventListener("pointermove", (e) => {
      if (e.buttons === 1 && S.running && !S.paused) {
        const w = weapon();
        if (w.cooldown <= 0.2) {
          const p = pointerPos(e);
          useWeaponAt(p.x, p.y);
        }
      }
    });
  }

  // ---------- draw ----------
  function draw() {
    const c = canvas();
    const g = ctx();
    if (!c || !g) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    const dpr = c.width / w;
    const th = theme();

    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (S.shake > 0 && (!global.STSaveSettings || global.STSaveSettings.shake !== false)) {
      const amp = S.shake * 12;
      g.translate((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
    }

    // bg
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, th.bg[0]);
    grad.addColorStop(1, th.bg[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    drawDecor(g, w, h, th);

    // ground
    const floorY = h * 0.78;
    g.fillStyle = th.ground;
    g.fillRect(0, floorY, w, h - floorY);
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.fillRect(0, floorY, w, 6);

    // rings
    for (const r of S.rings) {
      const a = Math.max(0, r.life / r.maxLife);
      g.globalAlpha = a * 0.85;
      g.strokeStyle = r.color;
      g.lineWidth = 3 + (1 - a) * 6;
      g.beginPath();
      g.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;

    // lightning bolts
    if (global.STFx) {
      for (const b of S.bolts) {
        const a = b.life / b.maxLife;
        STFx.lightningBolt(g, b.x, b.yTop, b.yBot, 1 - a, b.color);
      }
    }

    // blackholes
    if (global.STFx) {
      for (const bh of S.blackholes) {
        STFx.blackholePull(g, bh.x, bh.y, bh.t, null);
      }
    }

    // slashes (arc blade trails + weapon silhouette)
    if (global.STFx) {
      for (const s of S.slashes) {
        const a = s.life / s.maxLife;
        STFx.slashArc(g, s.x, s.y, s.r, s.ang - 1.25, s.ang + 1.25, s.color || "rgba(255,255,255,0.7)", a);
        if (s.weaponId && STFx.DRAW[s.weaponId] && a > 0.2) {
          const sweep = s.ang + (1 - a) * 1.8;
          const wx = s.x + Math.cos(sweep) * s.r * 0.72;
          const wy = s.y + Math.sin(sweep) * s.r * 0.72;
          g.globalAlpha = a;
          STFx.drawWeaponSprite(g, s.weaponId, wx, wy, sweep + Math.PI / 2, 34 + a * 18);
          g.globalAlpha = 1;
        }
      }
    } else {
      for (const s of S.slashes) {
        const a = s.life / s.maxLife;
        g.globalAlpha = a;
        g.strokeStyle = s.color;
        g.lineWidth = 8 * a + 2;
        g.beginPath();
        g.arc(s.x, s.y, s.r, s.ang - 1.2, s.ang + 1.2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    // flame jets
    if (global.STFx) {
      for (const f of S.flames) {
        const t01 = 1 - f.life / f.maxLife;
        STFx.flameJet(g, f.x, f.y, f.dx, f.dy, t01, f.size);
      }
    }

    // tracers
    if (global.STFx) {
      for (const tr of S.tracers) {
        const a = tr.life / tr.maxLife;
        g.globalAlpha = a;
        STFx.tracer(g, tr.x1, tr.y1, tr.x2, tr.y2, tr.color);
      }
      g.globalAlpha = 1;
    }

    // muzzle flashes
    if (global.STFx) {
      for (const m of S.muzzles) {
        const a = m.life / m.maxLife;
        g.globalAlpha = Math.min(1, a * 1.4);
        STFx.muzzleFlash(g, m.x, m.y, m.angle, m.size * (0.5 + a * 0.7), m.color);
      }
      g.globalAlpha = 1;
    }

    // shell casings
    if (global.STFx) {
      for (const sc of S.shells) {
        g.globalAlpha = Math.min(1, sc.life * 2);
        STFx.shellCasing(g, sc.x, sc.y, sc.rot);
      }
      g.globalAlpha = 1;
    }

    // projectile trails
    if (global.STFx) {
      for (const [id, tr] of S.trails) {
        if (tr && tr.length > 1) {
          const alive = S.projectiles.some((p) => p.id === id);
          if (alive) STFx.drawTrail(g, tr);
          else if (tr.length && tr[tr.length - 1].life > 0) STFx.drawTrail(g, tr);
        }
      }
      // prune dead trails
      if (S.trails.size > 40) {
        for (const [id, tr] of S.trails) {
          const alive = S.projectiles.some((p) => p.id === id);
          const last = tr && tr[tr.length - 1];
          if (!alive && (!last || last.life <= 0)) S.trails.delete(id);
        }
      }
    }

    // projectiles as real weapon sprites
    for (const p of S.projectiles) {
      const ang = Math.atan2(p.vy, p.vx || 0.01);
      if (p.kind === "flame") {
        g.globalAlpha = Math.min(1, p.life * 2);
        if (global.STFx) STFx.glow(g, p.x, p.y, 18 + Math.random() * 10, "rgba(255,100,20,0.9)", 0.85);
        g.fillStyle = p.color || "#f80";
        g.beginPath();
        g.arc(p.x, p.y, 10 + Math.random() * 8, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#ffe08a";
        g.beginPath();
        g.arc(p.x, p.y, 5 + Math.random() * 4, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
        continue;
      }
      if (global.STFx && p.weaponId && STFx.DRAW[p.weaponId]) {
        const size = p.blast ? 42 : 34;
        // slight motion blur copy
        if (Math.hypot(p.vx, p.vy) > 400) {
          g.globalAlpha = 0.25;
          STFx.drawWeaponSprite(g, p.weaponId, p.x - p.vx * 0.012, p.y - p.vy * 0.012, ang + p.spin, size * 0.9);
          g.globalAlpha = 1;
        }
        STFx.drawWeaponSprite(g, p.weaponId, p.x, p.y, ang + p.spin, size);
      } else {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(ang + (p.spin || 0));
        g.font = `${Math.floor(ch().headRadius * 0.85)}px sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(p.emoji, 0, 0);
        g.restore();
      }
    }

    // character + stuck
    const t = ch();
    global.STCharacter.drawStickman(g, {
      x: t.x,
      y: t.y - t.headRadius * 1.2,
      angle: t.angle,
      scaleX: t.scaleX,
      scaleY: t.scaleY,
      state: t.burn > 0 ? "burn" : t.state,
      headRadius: t.headRadius,
    }, {
      photoImage: S.photoImage,
      expression: t.state === "stunned" ? "dizzy" : t.pain > 0 ? "shocked" : S.expression,
      costume: S.costume,
    });

    // stuck weapons on body — real weapon shapes
    for (const k of S.stuck) {
      const a = Math.min(1, k.life);
      const wob = (k.wobble || 0) * Math.sin(performance.now() / 40) * 0.15;
      g.save();
      g.translate(t.x + k.ox * t.scaleX, t.y + k.oy * t.scaleY - t.headRadius * 0.4);
      g.rotate(k.angle + t.angle + wob);
      g.globalAlpha = Math.min(1, a * 1.5);
      if (global.STFx && k.weaponId && STFx.DRAW[k.weaponId]) {
        STFx.drawWeaponSprite(g, k.weaponId, 0, -t.headRadius * 0.25, -Math.PI / 2, t.headRadius * 0.55);
      } else {
        g.font = `${Math.floor(t.headRadius * 0.55)}px sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(k.emoji, 0, -t.headRadius * 0.35);
      }
      g.restore();
    }
    g.globalAlpha = 1;

    // impact stars
    if (global.STFx) {
      for (const h of S.impactStars) {
        const a = h.life / h.maxLife;
        g.globalAlpha = a;
        STFx.impactHit(g, h.x, h.y, h.power, h.color);
      }
      g.globalAlpha = 1;
    }

    // explosions ON TOP of character (fireball should be visible)
    if (global.STFx) {
      for (const ex of S.explosions) {
        const t01 = Math.min(1, Math.max(0, 1 - ex.life / ex.maxLife));
        try {
          STFx.explosion(g, ex.x, ex.y, t01, ex.power, ex.color);
        } catch (e) {
          console.warn('explosion draw', e);
        }
        // safety ring even if gradient fails
        g.globalAlpha = 0.85;
        g.strokeStyle = ex.color || "#fc0";
        g.lineWidth = 6;
        g.beginPath();
        g.arc(ex.x, ex.y, 60 + (ex.power || 1) * 40 + t01 * 80, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = "rgba(255,120,20,0.55)";
        g.beginPath();
        g.arc(ex.x, ex.y, 50 + (ex.power || 1) * 25, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }
    }

    // particles
    if (!global.STSaveSettings || global.STSaveSettings.particles !== false) {
      for (const p of S.particles) {
        const a = Math.max(0, p.life / p.maxLife);
        g.globalAlpha = a;
        if (p.square) {
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.life * 4);
          g.fillStyle = p.color;
          g.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
          g.restore();
        } else {
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(p.x, p.y, p.r * (0.5 + a), 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
    }

    // texts
    for (const tx of S.texts) {
      const a = Math.max(0, tx.life / tx.maxLife);
      g.globalAlpha = a;
      g.font = `bold ${Math.floor(tx.size || 22)}px sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 4;
      g.strokeStyle = "rgba(0,0,0,0.45)";
      g.strokeText(tx.text, tx.x, tx.y);
      g.fillStyle = tx.color;
      g.fillText(tx.text, tx.x, tx.y);
    }
    g.globalAlpha = 1;

    // flash
    if (S.flash > 0) {
      g.fillStyle = `rgba(255,255,255,${Math.min(0.7, S.flash * 0.5)})`;
      g.fillRect(0, 0, w, h);
    }

    // rage vignette
    if (S.rageMode > 0) {
      const vig = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
      vig.addColorStop(0, "rgba(255,40,100,0)");
      vig.addColorStop(1, "rgba(255,40,100,0.22)");
      g.fillStyle = vig;
      g.fillRect(0, 0, w, h);
    }

    g.restore();
  }

  function drawDecor(g, w, h, th) {
    // graffiti-ish shapes
    g.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.arc((i * 120) % w, h * (0.15 + (i % 4) * 0.12), 30 + (i % 3) * 18, 0, Math.PI * 2);
      g.fill();
    }
    if (th.id === 2) {
      g.fillStyle = "rgba(139,124,246,0.15)";
      g.fillRect(0, h * 0.2, w, 4);
      g.fillRect(0, h * 0.35, w, 2);
    }
  }

  // ---------- HUD ----------
  function updateHUD() {
    const el = (id) => document.getElementById(id);
    const t = ch();
    if (el("hud-combo")) el("hud-combo").textContent = S.combo;
    if (el("hud-hits")) el("hud-hits").textContent = S.hits;
    if (el("hud-damage")) el("hud-damage").textContent = Math.round(S.damage);
    if (el("hud-weapon")) {
      const w = weapon();
      el("hud-weapon").textContent = `${w.emoji} ${w.name}`;
    }
    if (el("hud-theme")) el("hud-theme").textContent = theme().name;
    const rageBar = el("rage-fill");
    if (rageBar) rageBar.style.width = `${Math.min(100, S.rage)}%`;
    const rageBtn = el("btn-rage");
    if (rageBtn) {
      rageBtn.disabled = S.rage < 100 && S.rageMode <= 0;
      rageBtn.classList.toggle("ready", S.rage >= 100 || S.rageMode > 0);
      rageBtn.textContent = S.rageMode > 0 ? "暴走中" : "宣泄大招";
    }
  }

  function getState() {
    return {
      running: S.running,
      paused: S.paused,
      theme: S.theme,
      weaponId: S.weaponId,
      combo: S.combo,
      hits: S.hits,
      damage: Math.round(S.damage),
      rage: Math.round(S.rage),
      rageMode: S.rageMode > 0,
      stuck: S.stuck.length,
      projectiles: S.projectiles.length,
      explosions: S.explosions.length,
      muzzles: S.muzzles.length,
      tracers: S.tracers.length,
      bolts: S.bolts.length,
      flames: S.flames.length,
      slashes: S.slashes.length,
      impactStars: S.impactStars.length,
      character: {
        x: Math.round(S.character.x),
        y: Math.round(S.character.y),
        state: S.character.state,
      },
    };
  }

  function debugFreeze() {
    S.hitstop = 999999;
    S.paused = true;
    draw();
  }

  global.STGame = {
    THEMES,
    start,
    stop,
    pause,
    resume,
    resize,
    bindInput,
    setPhoto,
    setCharacterOptions,
    setWeapon,
    triggerUltimate,
    activateRage,
    getState,
    debugFreeze,
    getWeapon: () => weapon(),
    onStateChange: (fn) => { S.onStateChange = fn; },
    useWeaponAt,
  };
})(window);
