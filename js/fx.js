/* fx.js — 武器实体渲染 + 派对级特效（枪口焰/弹道/爆炸/刀光/火焰/闪电/黑洞） */
(function (global) {
  // ---------- 通用绘制工具 ----------
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function glow(ctx, x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha != null ? alpha : 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---------- 武器实体（投掷/飞行中） ----------
  // 每个武器画在原点、朝 +X 方向；调用方 rotate
  const DRAW = {
    dagger(ctx, s) {
      // 柄
      ctx.fillStyle = "#5a3a22";
      roundRect(ctx, -s * 0.75, -s * 0.12, s * 0.45, s * 0.24, s * 0.08);
      ctx.fill();
      // 护手
      ctx.fillStyle = "#c9a227";
      roundRect(ctx, -s * 0.32, -s * 0.18, s * 0.12, s * 0.36, s * 0.05);
      ctx.fill();
      // 刀身
      ctx.fillStyle = "#e8eef5";
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, -s * 0.1);
      ctx.lineTo(s * 0.72, 0);
      ctx.lineTo(-s * 0.22, s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#9ab";
      ctx.lineWidth = s * 0.03;
      ctx.stroke();
    },
    sword(ctx, s) {
      ctx.fillStyle = "#6b4226";
      roundRect(ctx, -s * 0.85, -s * 0.09, s * 0.5, s * 0.18, s * 0.06);
      ctx.fill();
      ctx.fillStyle = "#d4af37";
      roundRect(ctx, -s * 0.38, -s * 0.22, s * 0.14, s * 0.44, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#dfe7f0";
      ctx.beginPath();
      ctx.moveTo(-s * 0.26, -s * 0.1);
      ctx.lineTo(s * 0.95, -s * 0.04);
      ctx.lineTo(s * 1.05, 0);
      ctx.lineTo(s * 0.95, s * 0.04);
      ctx.lineTo(-s * 0.26, s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8aa";
      ctx.lineWidth = s * 0.025;
      ctx.stroke();
    },
    katana(ctx, s) {
      ctx.fillStyle = "#1a1a1a";
      roundRect(ctx, -s * 0.9, -s * 0.07, s * 0.55, s * 0.14, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#c0c0c0";
      roundRect(ctx, -s * 0.36, -s * 0.16, s * 0.08, s * 0.32, s * 0.03);
      ctx.fill();
      ctx.fillStyle = "#f2f6ff";
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.07);
      ctx.quadraticCurveTo(s * 0.4, -s * 0.12, s * 1.1, -s * 0.02);
      ctx.lineTo(s * 1.08, s * 0.03);
      ctx.quadraticCurveTo(s * 0.4, s * 0.06, -s * 0.3, s * 0.08);
      ctx.closePath();
      ctx.fill();
    },
    axe(ctx, s) {
      ctx.fillStyle = "#8b5a2b";
      roundRect(ctx, -s * 0.9, -s * 0.07, s * 1.1, s * 0.14, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#b0b8c0";
      ctx.beginPath();
      ctx.moveTo(s * 0.1, -s * 0.08);
      ctx.quadraticCurveTo(s * 0.75, -s * 0.55, s * 0.55, -s * 0.1);
      ctx.lineTo(s * 0.55, s * 0.1);
      ctx.quadraticCurveTo(s * 0.75, s * 0.55, s * 0.1, s * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#667";
      ctx.lineWidth = s * 0.03;
      ctx.stroke();
    },
    scythe(ctx, s) {
      ctx.strokeStyle = "#5a4030";
      ctx.lineWidth = s * 0.1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, s * 0.15);
      ctx.lineTo(s * 0.5, -s * 0.1);
      ctx.stroke();
      ctx.fillStyle = "#cfd6de";
      ctx.beginPath();
      ctx.moveTo(s * 0.35, -s * 0.12);
      ctx.quadraticCurveTo(s * 0.9, -s * 0.55, s * 1.15, -s * 0.05);
      ctx.quadraticCurveTo(s * 0.7, -s * 0.18, s * 0.35, -s * 0.02);
      ctx.closePath();
      ctx.fill();
    },
    chainsaw(ctx, s) {
      ctx.fillStyle = "#e85d04";
      roundRect(ctx, -s * 0.55, -s * 0.22, s * 0.7, s * 0.44, s * 0.08);
      ctx.fill();
      ctx.fillStyle = "#333";
      roundRect(ctx, -s * 0.75, -s * 0.08, s * 0.28, s * 0.16, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#ccc";
      roundRect(ctx, s * 0.1, -s * 0.1, s * 0.95, s * 0.2, s * 0.06);
      ctx.fill();
      // 齿
      ctx.fillStyle = "#888";
      for (let i = 0; i < 8; i++) {
        const x = s * 0.18 + i * s * 0.11;
        ctx.beginPath();
        ctx.moveTo(x, -s * 0.1);
        ctx.lineTo(x + s * 0.05, -s * 0.18);
        ctx.lineTo(x + s * 0.09, -s * 0.1);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, s * 0.1);
        ctx.lineTo(x + s * 0.05, s * 0.18);
        ctx.lineTo(x + s * 0.09, s * 0.1);
        ctx.fill();
      }
    },
    cleaver(ctx, s) {
      ctx.fillStyle = "#5a3a22";
      roundRect(ctx, -s * 0.7, -s * 0.09, s * 0.4, s * 0.18, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#d8dee6";
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.35);
      ctx.lineTo(s * 0.7, -s * 0.28);
      ctx.lineTo(s * 0.7, s * 0.22);
      ctx.lineTo(-s * 0.35, s * 0.28);
      ctx.closePath();
      ctx.fill();
    },
    hammer(ctx, s) {
      ctx.fillStyle = "#8b5a2b";
      roundRect(ctx, -s * 0.95, -s * 0.07, s * 1.0, s * 0.14, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#666";
      roundRect(ctx, s * 0.0, -s * 0.32, s * 0.55, s * 0.64, s * 0.08);
      ctx.fill();
      ctx.fillStyle = "#888";
      roundRect(ctx, s * 0.05, -s * 0.26, s * 0.45, s * 0.2, s * 0.05);
      ctx.fill();
    },
    bat(ctx, s) {
      ctx.fillStyle = "#c4a574";
      ctx.beginPath();
      ctx.moveTo(-s * 0.95, -s * 0.08);
      ctx.quadraticCurveTo(-s * 0.2, -s * 0.16, s * 0.85, -s * 0.22);
      ctx.lineTo(s * 0.95, 0);
      ctx.lineTo(s * 0.85, s * 0.22);
      ctx.quadraticCurveTo(-s * 0.2, s * 0.16, -s * 0.95, s * 0.08);
      ctx.closePath();
      ctx.fill();
    },
    pan(ctx, s) {
      ctx.fillStyle = "#444";
      roundRect(ctx, -s * 0.95, -s * 0.07, s * 0.7, s * 0.14, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.arc(s * 0.35, 0, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#666";
      ctx.beginPath();
      ctx.arc(s * 0.35, 0, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
    },
    wrench(ctx, s) {
      ctx.fillStyle = "#8a939c";
      roundRect(ctx, -s * 0.7, -s * 0.08, s * 1.0, s * 0.16, s * 0.05);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.45, 0, s * 0.22, -0.9, 0.9);
      ctx.lineWidth = s * 0.12;
      ctx.strokeStyle = "#8a939c";
      ctx.stroke();
    },
    anvil(ctx, s) {
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, s * 0.35);
      ctx.lineTo(s * 0.55, s * 0.35);
      ctx.lineTo(s * 0.4, s * 0.1);
      ctx.lineTo(s * 0.75, s * 0.1);
      ctx.lineTo(s * 0.75, -s * 0.05);
      ctx.lineTo(-s * 0.55, -s * 0.05);
      ctx.lineTo(-s * 0.7, s * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#777";
      roundRect(ctx, -s * 0.35, -s * 0.28, s * 0.7, s * 0.22, s * 0.04);
      ctx.fill();
    },
    fridge(ctx, s) {
      ctx.fillStyle = "#dfeaf2";
      roundRect(ctx, -s * 0.45, -s * 0.7, s * 0.9, s * 1.4, s * 0.1);
      ctx.fill();
      ctx.strokeStyle = "#aab";
      ctx.lineWidth = s * 0.04;
      ctx.stroke();
      ctx.fillStyle = "#889";
      roundRect(ctx, s * 0.22, -s * 0.35, s * 0.1, s * 0.35, s * 0.04);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, -s * 0.1);
      ctx.lineTo(s * 0.45, -s * 0.1);
      ctx.stroke();
    },
    pistol(ctx, s) {
      ctx.fillStyle = "#2a2a2a";
      roundRect(ctx, -s * 0.25, -s * 0.22, s * 0.95, s * 0.22, s * 0.05);
      ctx.fill();
      roundRect(ctx, -s * 0.15, 0, s * 0.28, s * 0.55, s * 0.06);
      ctx.fill();
      ctx.fillStyle = "#555";
      roundRect(ctx, s * 0.55, -s * 0.18, s * 0.35, s * 0.12, s * 0.03);
      ctx.fill();
    },
    smg(ctx, s) {
      ctx.fillStyle = "#222";
      roundRect(ctx, -s * 0.5, -s * 0.18, s * 1.3, s * 0.22, s * 0.05);
      ctx.fill();
      roundRect(ctx, -s * 0.2, s * 0.02, s * 0.22, s * 0.5, s * 0.05);
      ctx.fill();
      roundRect(ctx, s * 0.15, s * 0.02, s * 0.14, s * 0.4, s * 0.04);
      ctx.fill();
      ctx.fillStyle = "#444";
      roundRect(ctx, -s * 0.55, -s * 0.12, s * 0.2, s * 0.12, s * 0.03);
      ctx.fill();
    },
    shotgun(ctx, s) {
      ctx.fillStyle = "#6b3a1f";
      roundRect(ctx, -s * 0.85, -s * 0.1, s * 0.55, s * 0.2, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#333";
      roundRect(ctx, -s * 0.35, -s * 0.14, s * 1.35, s * 0.16, s * 0.04);
      ctx.fill();
      roundRect(ctx, -s * 0.35, s * 0.02, s * 1.1, s * 0.1, s * 0.03);
      ctx.fill();
    },
    sniper(ctx, s) {
      ctx.fillStyle = "#2d4a2d";
      roundRect(ctx, -s * 0.9, -s * 0.12, s * 1.9, s * 0.18, s * 0.04);
      ctx.fill();
      roundRect(ctx, -s * 0.2, -s * 0.32, s * 0.7, s * 0.16, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#222";
      roundRect(ctx, -s * 0.35, 0.05, s * 0.25, s * 0.4, s * 0.04);
      ctx.fill();
    },
    laser(ctx, s) {
      ctx.fillStyle = "#333";
      roundRect(ctx, -s * 0.5, -s * 0.2, s * 1.1, s * 0.4, s * 0.1);
      ctx.fill();
      ctx.fillStyle = "#f33";
      roundRect(ctx, s * 0.45, -s * 0.1, s * 0.4, s * 0.2, s * 0.05);
      ctx.fill();
      glow(ctx, s * 0.85, 0, s * 0.35, "rgba(255,80,80,0.9)", 0.85);
    },
    railgun(ctx, s) {
      ctx.fillStyle = "#1a2a4a";
      roundRect(ctx, -s * 0.7, -s * 0.22, s * 1.5, s * 0.44, s * 0.1);
      ctx.fill();
      ctx.fillStyle = "#6cf";
      roundRect(ctx, -s * 0.4, -s * 0.08, s * 1.0, s * 0.16, s * 0.05);
      ctx.fill();
      glow(ctx, s * 0.85, 0, s * 0.4, "rgba(100,200,255,0.9)", 0.9);
    },
    grenade(ctx, s) {
      ctx.fillStyle = "#2f5a2f";
      ctx.beginPath();
      ctx.arc(0, s * 0.12, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a3a3a";
      roundRect(ctx, -s * 0.14, -s * 0.38, s * 0.28, s * 0.22, s * 0.05);
      ctx.fill();
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.arc(s * 0.18, -s * 0.28, s * 0.14, -0.5, 2.2);
      ctx.stroke();
    },
    dynamite(ctx, s) {
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = "#c0392b";
        roundRect(ctx, -s * 0.45, i * s * 0.28 - s * 0.11, s * 0.9, s * 0.22, s * 0.08);
        ctx.fill();
      }
      ctx.strokeStyle = "#8b6914";
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.45);
      ctx.quadraticCurveTo(s * 0.2, -s * 0.6, s * 0.35, -s * 0.5);
      ctx.stroke();
    },
    rocket(ctx, s) {
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.12);
      ctx.lineTo(s * 0.55, -s * 0.12);
      ctx.quadraticCurveTo(s * 0.95, 0, s * 0.55, s * 0.12);
      ctx.lineTo(-s * 0.55, s * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.12);
      ctx.lineTo(-s * 0.85, -s * 0.32);
      ctx.lineTo(-s * 0.85, s * 0.32);
      ctx.lineTo(-s * 0.55, s * 0.12);
      ctx.closePath();
      ctx.fill();
      // 尾焰
      glow(ctx, -s * 0.95, 0, s * 0.45, "rgba(255,140,40,0.95)", 0.9);
    },
    c4(ctx, s) {
      ctx.fillStyle = "#c9b27a";
      roundRect(ctx, -s * 0.45, -s * 0.32, s * 0.9, s * 0.64, s * 0.08);
      ctx.fill();
      ctx.fillStyle = "#333";
      roundRect(ctx, -s * 0.25, -s * 0.12, s * 0.5, s * 0.24, s * 0.04);
      ctx.fill();
      ctx.fillStyle = "#f33";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    },
    mine(ctx, s) {
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#666";
      ctx.lineWidth = s * 0.06;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35);
        ctx.lineTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55);
        ctx.stroke();
      }
    },
    torch(ctx, s) {
      ctx.fillStyle = "#8b5a2b";
      roundRect(ctx, -s * 0.12, -s * 0.1, s * 0.24, s * 0.85, s * 0.05);
      ctx.fill();
      glow(ctx, 0, -s * 0.35, s * 0.5, "rgba(255,120,20,0.95)", 0.95);
      ctx.fillStyle = "#ff6b2a";
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.35, s * 0.18, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffc145";
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.3, s * 0.1, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    flamethrower(ctx, s) {
      ctx.fillStyle = "#333";
      roundRect(ctx, -s * 0.7, -s * 0.18, s * 1.2, s * 0.36, s * 0.08);
      ctx.fill();
      ctx.fillStyle = "#c0392b";
      roundRect(ctx, -s * 0.55, -s * 0.1, s * 0.35, s * 0.2, s * 0.05);
      ctx.fill();
      ctx.fillStyle = "#555";
      roundRect(ctx, s * 0.45, -s * 0.12, s * 0.35, s * 0.24, s * 0.05);
      ctx.fill();
      glow(ctx, s * 0.85, 0, s * 0.3, "rgba(255,100,20,0.8)", 0.7);
    },
    fireball(ctx, s) {
      glow(ctx, 0, 0, s * 0.85, "rgba(255,100,20,0.95)", 1);
      ctx.fillStyle = "#ff6b2a";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffc145";
      ctx.beginPath();
      ctx.arc(s * 0.05, -s * 0.05, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
    },
    molotov(ctx, s) {
      ctx.fillStyle = "#8b5a2b";
      roundRect(ctx, -s * 0.12, -s * 0.45, s * 0.24, s * 0.55, s * 0.06);
      ctx.fill();
      ctx.fillStyle = "#6a4a22";
      roundRect(ctx, -s * 0.28, s * 0.05, s * 0.56, s * 0.45, s * 0.12);
      ctx.fill();
      ctx.fillStyle = "#e67e22";
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.45);
      ctx.lineTo(s * 0.1, -s * 0.7);
      ctx.lineTo(-s * 0.1, -s * 0.7);
      ctx.closePath();
      ctx.fill();
    },
    throwknife(ctx, s) {
      DRAW.dagger(ctx, s * 0.9);
    },
    shuriken(ctx, s) {
      ctx.fillStyle = "#c0c8d0";
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i / 4) * Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.1);
        ctx.lineTo(s * 0.75, -s * 0.12);
        ctx.lineTo(s * 0.15, s * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    },
    spear(ctx, s) {
      ctx.fillStyle = "#8b5a2b";
      roundRect(ctx, -s * 0.85, -s * 0.05, s * 1.3, s * 0.1, s * 0.03);
      ctx.fill();
      ctx.fillStyle = "#d0d8e0";
      ctx.beginPath();
      ctx.moveTo(s * 0.45, -s * 0.14);
      ctx.lineTo(s * 0.95, 0);
      ctx.lineTo(s * 0.45, s * 0.14);
      ctx.closePath();
      ctx.fill();
    },
    nail(ctx, s) {
      ctx.fillStyle = "#999";
      roundRect(ctx, -s * 0.55, -s * 0.04, s * 0.75, s * 0.08, s * 0.02);
      ctx.fill();
      ctx.fillStyle = "#bbb";
      roundRect(ctx, -s * 0.65, -s * 0.12, s * 0.14, s * 0.24, s * 0.03);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.04);
      ctx.lineTo(s * 0.55, 0);
      ctx.lineTo(s * 0.2, s * 0.04);
      ctx.closePath();
      ctx.fill();
    },
    arrow(ctx, s) {
      ctx.strokeStyle = "#c4a574";
      ctx.lineWidth = s * 0.08;
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, 0);
      ctx.lineTo(s * 0.55, 0);
      ctx.stroke();
      ctx.fillStyle = "#ddd";
      ctx.beginPath();
      ctx.moveTo(s * 0.5, -s * 0.12);
      ctx.lineTo(s * 0.85, 0);
      ctx.lineTo(s * 0.5, s * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, 0);
      ctx.lineTo(-s * 0.45, -s * 0.18);
      ctx.lineTo(-s * 0.35, 0);
      ctx.lineTo(-s * 0.45, s * 0.18);
      ctx.closePath();
      ctx.fill();
    },
    pie(ctx, s) {
      ctx.fillStyle = "#e8c48a";
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.55, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff5e0";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.52, s * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8fab";
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
    },
    duck(ctx, s) {
      ctx.fillStyle = "#ffd93d";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.45, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.35, -s * 0.28, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8c00";
      ctx.beginPath();
      ctx.moveTo(s * 0.5, -s * 0.28);
      ctx.lineTo(s * 0.75, -s * 0.22);
      ctx.lineTo(s * 0.5, -s * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(s * 0.4, -s * 0.32, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    },
    toilet(ctx, s) {
      ctx.fillStyle = "#f5f7fa";
      roundRect(ctx, -s * 0.35, -s * 0.5, s * 0.7, s * 0.85, s * 0.1);
      ctx.fill();
      ctx.fillStyle = "#dde3ea";
      roundRect(ctx, -s * 0.45, s * 0.25, s * 0.9, s * 0.25, s * 0.08);
      ctx.fill();
      ctx.fillStyle = "#a8c0d0";
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.15, s * 0.28, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    lightning(ctx, s) {
      glow(ctx, 0, 0, s * 0.9, "rgba(255,255,80,0.95)", 0.95);
      ctx.strokeStyle = "#fff36a";
      ctx.lineWidth = s * 0.12;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(-s * 0.15, -s * 0.25);
      ctx.lineTo(s * 0.12, -s * 0.1);
      ctx.lineTo(-s * 0.08, s * 0.35);
      ctx.lineTo(s * 0.1, s * 0.55);
      ctx.lineTo(0, s * 0.9);
      ctx.stroke();
    },
    meteor(ctx, s) {
      glow(ctx, -s * 0.2, s * 0.15, s * 0.95, "rgba(255,100,20,0.9)", 1);
      ctx.fillStyle = "#8b4513";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a0522d";
      ctx.beginPath();
      ctx.arc(-s * 0.12, -s * 0.1, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6b2a";
      ctx.beginPath();
      ctx.arc(s * 0.15, s * 0.1, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
    },
    blackhole(ctx, s) {
      for (let i = 4; i >= 0; i--) {
        const r = s * (0.25 + i * 0.18);
        ctx.strokeStyle = `rgba(140,80,255,${0.25 + i * 0.12})`;
        ctx.lineWidth = s * 0.08;
        ctx.beginPath();
        ctx.arc(0, 0, r, i * 0.8, i * 0.8 + Math.PI * 1.4);
        ctx.stroke();
      }
      glow(ctx, 0, 0, s * 0.7, "rgba(120,40,255,0.85)", 0.95);
      ctx.fillStyle = "#0a0014";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
    },
    fist(ctx, s) {
      ctx.fillStyle = "#f2c4a0";
      roundRect(ctx, -s * 0.35, -s * 0.35, s * 0.7, s * 0.7, s * 0.15);
      ctx.fill();
      ctx.fillStyle = "#e0b090";
      for (let i = 0; i < 4; i++) {
        roundRect(ctx, -s * 0.3 + i * s * 0.16, -s * 0.42, s * 0.14, s * 0.2, s * 0.05);
        ctx.fill();
      }
    },
    slap(ctx, s) {
      ctx.fillStyle = "#f2c4a0";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.4, s * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.35;
        ctx.fillStyle = "#f2c4a0";
        roundRect(ctx, Math.cos(a) * s * 0.45 - s * 0.08, Math.sin(a) * s * 0.55 - s * 0.18, s * 0.16, s * 0.38, s * 0.07);
        ctx.fill();
      }
    },
    kick(ctx, s) {
      ctx.fillStyle = "#2a2a2a";
      roundRect(ctx, -s * 0.25, -s * 0.2, s * 0.85, s * 0.35, s * 0.12);
      ctx.fill();
      ctx.fillStyle = "#444";
      roundRect(ctx, s * 0.35, -s * 0.22, s * 0.45, s * 0.4, s * 0.1);
      ctx.fill();
    },
    stomp(ctx, s) {
      ctx.fillStyle = "#333";
      roundRect(ctx, -s * 0.55, -s * 0.35, s * 1.1, s * 0.7, s * 0.18);
      ctx.fill();
      ctx.fillStyle = "#222";
      roundRect(ctx, -s * 0.55, s * 0.2, s * 1.1, s * 0.22, s * 0.08);
      ctx.fill();
    },
    uppercut(ctx, s) {
      DRAW.fist(ctx, s);
    },
  };

  function drawWeaponSprite(ctx, id, x, y, angle, size) {
    const fn = DRAW[id] || DRAW.dagger;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    fn(ctx, size);
    ctx.restore();
  }

  // ---------- 尾迹 ----------
  function pushTrail(trails, x, y, color) {
    trails.push({ x, y, life: 0.28, maxLife: 0.28, color: color || "#fff" });
    if (trails.length > 18) trails.shift();
  }

  function drawTrail(ctx, trails) {
    if (!trails || trails.length < 2) return;
    for (let i = 1; i < trails.length; i++) {
      const a = trails[i - 1];
      const b = trails[i];
      const t = Math.max(0, Math.min(1, b.life / b.maxLife));
      if (t <= 0.02) continue;
      ctx.globalAlpha = t * 0.55;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5 + t * 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- 枪口焰 / 弹道 ----------
  function muzzleFlash(ctx, x, y, angle, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const s = size;
    // 星形闪光
    ctx.fillStyle = color || "#ffd24a";
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? s : s * 0.35;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.55;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    glow(ctx, s * 0.35, 0, s * 1.3, "rgba(255,200,80,0.95)", 0.9);
    ctx.restore();
  }

  function tracer(ctx, x1, y1, x2, y2, color) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, color || "rgba(255,220,120,0.15)");
    g.addColorStop(0.55, color || "rgba(255,220,120,0.95)");
    g.addColorStop(1, "rgba(255,220,120,0.2)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x2, y2, 5, 0, Math.PI * 2);
    ctx.fill();
    glow(ctx, x2, y2, 18, "rgba(255,220,120,0.85)", 0.8);
  }

  function shellCasing(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#d4af37";
    roundRect(ctx, -4, -2, 8, 4, 1);
    ctx.fill();
    ctx.restore();
  }

  // ---------- 爆炸多阶段 ----------
  function explosion(ctx, x, y, t, power, color) {
    // t: 0→1
    const p = Math.max(0.6, power);
    const R = 70 + p * 85;
    // 外环冲击波
    const ringR = R * (0.3 + t * 1.6);
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.strokeStyle = color || "#ffd24a";
    ctx.lineWidth = 8 * (1 - t) + 2;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.stroke();
    // 第二环
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, ringR * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    // 火球
    if (t < 0.7) {
      const fr = R * (0.4 + t * 0.9);
      glow(ctx, x, y, fr * 1.4, "rgba(255,120,20,0.95)", (1 - t) * 0.95);
      ctx.fillStyle = "#ff6b2a";
      ctx.beginPath();
      ctx.arc(x, y, fr * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffc145";
      ctx.beginPath();
      ctx.arc(x, y, fr * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff6d0";
      ctx.beginPath();
      ctx.arc(x, y, fr * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    // 烟
    if (t > 0.25) {
      const st = (t - 0.25) / 0.75;
      ctx.globalAlpha = (1 - st) * 0.45;
      for (let i = 0; i < 6; i++) {
        const a = i * 1.1;
        const rr = R * (0.4 + st * 0.9);
        const sx = x + Math.cos(a) * rr * 0.55;
        const sy = y + Math.sin(a) * rr * 0.55 - st * 30;
        ctx.fillStyle = "#555";
        ctx.beginPath();
        ctx.arc(sx, sy, 12 + st * 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- 火焰喷射 ----------
  function flameJet(ctx, x, y, dx, dy, t, size) {
    const len = size * (1.2 + t);
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    for (let i = 0; i < 8; i++) {
      const p = i / 8;
      const fx = p * len;
      const r = size * (0.55 - p * 0.35) * (0.8 + Math.sin(t * 12 + i) * 0.25);
      const fy = Math.sin(t * 10 + i * 1.7) * size * 0.18;
      glow(ctx, fx, fy, r * 1.6, "rgba(255,90,10,0.75)", 0.75 - p * 0.5);
      ctx.fillStyle = i < 3 ? "#fff0c0" : i < 5 ? "#ffc145" : "#ff6b2a";
      ctx.globalAlpha = 0.85 - p * 0.55;
      ctx.beginPath();
      ctx.arc(fx, fy, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---------- 闪电 ----------
  function lightningBolt(ctx, x, yTop, yBot, t, color) {
    const segs = 8;
    const jag = 28 + (1 - t) * 20;
    ctx.strokeStyle = color || "#fff36a";
    ctx.lineWidth = 6 * (1 - t * 0.4) + 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    let px = x;
    ctx.moveTo(px, yTop);
    for (let i = 1; i <= segs; i++) {
      const p = i / segs;
      const y = yTop + (yBot - yTop) * p;
      px = x + (Math.random() - 0.5) * jag * (1 - p * 0.3);
      ctx.lineTo(px, y);
    }
    ctx.stroke();
    // 内芯
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    px = x;
    ctx.moveTo(px, yTop);
    for (let i = 1; i <= segs; i++) {
      const p = i / segs;
      const y = yTop + (yBot - yTop) * p;
      px = x + (Math.random() - 0.5) * jag * 0.55;
      ctx.lineTo(px, y);
    }
    ctx.stroke();
    glow(ctx, x, (yTop + yBot) / 2, 50, "rgba(255,255,120,0.55)", 0.7);
  }

  // ---------- 近战刀光 ----------
  function slashArc(ctx, x, y, r, a0, a1, color, alpha) {
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.0)");
    g.addColorStop(0.75, color || "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0.0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, a0, a1);
    ctx.arc(x, y, r * 0.35, a1, a0, true);
    ctx.closePath();
    ctx.fill();
    // 刃口亮线
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha * 0.9;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.88, a0 + 0.08, a1 - 0.08);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---------- 穿刺钉入演出 ----------
  function stabImpact(ctx, x, y, angle, size) {
    // 放射线
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = angle + (i - 4) * 0.22;
      const r1 = size * 0.3;
      const r2 = size * (0.7 + Math.random() * 0.5);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
      ctx.stroke();
    }
    glow(ctx, x, y, size * 0.9, "rgba(255,255,255,0.85)", 0.75);
  }

  // ---------- 命中冲击 ----------
  function impactHit(ctx, x, y, power, color) {
    const p = Math.max(0.5, power);
    // 星芒
    ctx.fillStyle = color || "#fff";
    ctx.save();
    ctx.translate(x, y);
    const spikes = 8;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? 16 * p : 5 * p;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    glow(ctx, x, y, 28 * p, "rgba(255,255,255,0.7)", 0.7);
    // 速度线
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 12 * p, y + Math.sin(a) * 12 * p);
      ctx.lineTo(x + Math.cos(a) * 32 * p, y + Math.sin(a) * 32 * p);
      ctx.stroke();
    }
  }

  // ---------- 黑洞吸附 ----------
  function blackholePull(ctx, x, y, t, particles) {
    for (let i = 0; i < 10; i++) {
      const a = t * 4 + i * 0.63;
      const r = 80 + ((i * 17 + t * 90) % 100);
      const px = x + Math.cos(a) * r * (1 - t * 0.3);
      const py = y + Math.sin(a) * r * 0.55 * (1 - t * 0.3);
      ctx.fillStyle = i % 2 ? "#c48cff" : "#fff";
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(px, py, 3 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    glow(ctx, x, y, 60 + t * 30, "rgba(140,60,255,0.55)", 0.7);
  }

  global.STFx = {
    DRAW,
    drawWeaponSprite,
    pushTrail,
    drawTrail,
    muzzleFlash,
    tracer,
    shellCasing,
    explosion,
    flameJet,
    lightningBolt,
    slashArc,
    stabImpact,
    impactHit,
    blackholePull,
    glow,
    roundRect,
  };
})(window);
