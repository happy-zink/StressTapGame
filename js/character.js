/* character.js — stickman drawing + photo sticker face */
(function (global) {
  const EXPRESSIONS = {
    happy: { eyes: "happy", mouth: "smile", blush: true },
    dizzy: { eyes: "spiral", mouth: "wavy", blush: false },
    angry: { eyes: "angry", mouth: "frown", blush: true },
    shocked: { eyes: "wide", mouth: "o", blush: true },
    sleepy: { eyes: "closed", mouth: "small", blush: true },
  };

  const COSTUMES = {
    none: { label: "无装扮" },
    hat: { label: "派对帽" },
    glasses: { label: "墨镜" },
    cape: { label: "披风" },
    crown: { label: "小皇冠" },
  };

  function drawStickerFace(ctx, x, y, radius, options) {
    const {
      photoImage = null,
      expression = "happy",
      costume = "none",
      tint = "#ffd7a8",
      outline = "#ff6b4a",
    } = options || {};

    const r = radius;

    // comic starburst border
    ctx.save();
    ctx.translate(x, y);

    // outer sticker edge
    ctx.beginPath();
    const spikes = 18;
    for (let i = 0; i < spikes * 2; i++) {
      const ang = (i / (spikes * 2)) * Math.PI * 2;
      const rad = i % 2 === 0 ? r * 1.12 : r * 1.02;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.strokeStyle = outline;
    ctx.stroke();

    // face circle clip
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.save();
    ctx.clip();

    if (photoImage && photoImage.complete && photoImage.naturalWidth) {
      const iw = photoImage.naturalWidth;
      const ih = photoImage.naturalHeight;
      const scale = Math.max((r * 2) / iw, (r * 2) / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(photoImage, -dw / 2, -dh / 2, dw, dh);
    } else {
      // default cartoon face
      ctx.fillStyle = tint;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.beginPath();
      ctx.arc(0, r * 0.15, r * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe8c8";
      ctx.fill();
    }

    // expression overlays (also work on photos for comedy)
    const expr = EXPRESSIONS[expression] || EXPRESSIONS.happy;
    drawExpression(ctx, r, expr);
    ctx.restore();

    // costume on top
    drawCostume(ctx, r, costume);

    ctx.restore();
  }

  function drawExpression(ctx, r, expr) {
    const eyeY = -r * 0.12;
    const eyeX = r * 0.32;

    ctx.strokeStyle = "#2a2a2a";
    ctx.fillStyle = "#2a2a2a";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (expr.eyes === "happy") {
      ctx.lineWidth = Math.max(2, r * 0.08);
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.arc(s * eyeX, eyeY, r * 0.14, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      });
    } else if (expr.eyes === "spiral") {
      [-1, 1].forEach((s) => {
        ctx.save();
        ctx.translate(s * eyeX, eyeY);
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 4; t += 0.2) {
          const rr = t * r * 0.028;
          const px = Math.cos(t) * rr;
          const py = Math.sin(t) * rr;
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.lineWidth = Math.max(1.5, r * 0.05);
        ctx.stroke();
        ctx.restore();
      });
    } else if (expr.eyes === "angry") {
      ctx.lineWidth = Math.max(2.5, r * 0.1);
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(s * (eyeX - r * 0.16), eyeY - r * 0.12);
        ctx.lineTo(s * (eyeX + r * 0.16), eyeY + r * 0.08);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * eyeX, eyeY + r * 0.12, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (expr.eyes === "wide") {
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.arc(s * eyeX, eyeY, r * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * eyeX, eyeY + r * 0.02, r * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = "#2a2a2a";
        ctx.fill();
      });
    } else if (expr.eyes === "closed") {
      ctx.lineWidth = Math.max(2, r * 0.07);
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(s * (eyeX - r * 0.12), eyeY);
        ctx.lineTo(s * (eyeX + r * 0.12), eyeY);
        ctx.stroke();
      });
    }

    if (expr.mouth === "smile") {
      ctx.beginPath();
      ctx.arc(0, r * 0.18, r * 0.22, 0.15, Math.PI - 0.15);
      ctx.lineWidth = Math.max(2, r * 0.07);
      ctx.stroke();
    } else if (expr.mouth === "frown") {
      ctx.beginPath();
      ctx.arc(0, r * 0.42, r * 0.2, Math.PI + 0.2, -0.2);
      ctx.stroke();
    } else if (expr.mouth === "o") {
      ctx.beginPath();
      ctx.ellipse(0, r * 0.28, r * 0.12, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (expr.mouth === "wavy") {
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, r * 0.28);
      for (let i = 0; i < 6; i++) {
        const px = -r * 0.2 + (i + 1) * (r * 0.4 / 6);
        const py = r * 0.28 + Math.sin(i * 1.7) * r * 0.07;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (expr.mouth === "small") {
      ctx.beginPath();
      ctx.ellipse(0, r * 0.28, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (expr.blush) {
      ctx.fillStyle = "rgba(255, 120, 120, 0.35)";
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.ellipse(s * r * 0.42, r * 0.18, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function drawCostume(ctx, r, costume) {
    if (costume === "hat") {
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.7);
      ctx.lineTo(0, -r * 1.35);
      ctx.lineTo(r * 0.55, -r * 0.7);
      ctx.closePath();
      ctx.fillStyle = "#ff6b4a";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -r * 1.35, r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = "#ffc145";
      ctx.fill();
    } else if (costume === "glasses") {
      const y = -r * 0.12;
      ctx.fillStyle = "rgba(20,20,20,0.78)";
      ctx.beginPath();
      ctx.roundRect(-r * 0.55, y - r * 0.12, r * 0.45, r * 0.28, r * 0.08);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(r * 0.1, y - r * 0.12, r * 0.45, r * 0.28, r * 0.08);
      ctx.fill();
      ctx.fillRect(-r * 0.12, y - r * 0.03, r * 0.24, r * 0.07);
    } else if (costume === "cape") {
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, r * 0.1);
      ctx.quadraticCurveTo(0, r * 1.4, r * 0.75, r * 0.1);
      ctx.closePath();
      ctx.fillStyle = "#8b7cf6";
      ctx.fill();
    } else if (costume === "crown") {
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.72);
      ctx.lineTo(-r * 0.4, -r * 1.15);
      ctx.lineTo(-r * 0.15, -r * 0.85);
      ctx.lineTo(0, -r * 1.25);
      ctx.lineTo(r * 0.15, -r * 0.85);
      ctx.lineTo(r * 0.4, -r * 1.15);
      ctx.lineTo(r * 0.55, -r * 0.72);
      ctx.closePath();
      ctx.fillStyle = "#ffc145";
      ctx.fill();
      ctx.strokeStyle = "#e0a82e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawStickman(ctx, body, options) {
    const {
      x, y, angle = 0, scaleX = 1, scaleY = 1,
      state = "idle",
      headRadius = 42,
    } = body;

    const photoImage = options && options.photoImage;
    const expression = options && options.expression || "happy";
    const costume = options && options.costume || "none";

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scaleX, scaleY);

    const bob = state === "idle" ? Math.sin(Date.now() / 280) * 2 : 0;
    const armSwing = state === "idle" ? Math.sin(Date.now() / 280) * 0.12 : 0;

    // limbs
    const hipY = headRadius * 1.85;
    const shoulderY = headRadius * 1.15;

    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = Math.max(5, headRadius * 0.14);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // legs
    const legSpread = state === "stunned" ? 0.35 : 0.22;
    ctx.beginPath();
    ctx.moveTo(0, hipY + bob);
    ctx.lineTo(-headRadius * (0.5 + legSpread), hipY + headRadius * 1.15 + bob);
    ctx.moveTo(0, hipY + bob);
    ctx.lineTo(headRadius * (0.5 + legSpread), hipY + headRadius * 1.15 + bob);
    ctx.stroke();

    // body
    ctx.beginPath();
    ctx.moveTo(0, shoulderY + bob);
    ctx.lineTo(0, hipY + bob);
    ctx.stroke();

    // arms
    const armY = shoulderY + headRadius * 0.15 + bob;
    const armLen = headRadius * 1.05;
    if (state === "hit" || state === "stunned") {
      ctx.beginPath();
      ctx.moveTo(0, armY);
      ctx.lineTo(-armLen * 0.85, armY - headRadius * 0.35);
      ctx.moveTo(0, armY);
      ctx.lineTo(armLen * 0.85, armY - headRadius * 0.2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, armY);
      ctx.lineTo(-armLen * Math.cos(armSwing), armY + armLen * 0.55);
      ctx.moveTo(0, armY);
      ctx.lineTo(armLen * Math.cos(armSwing), armY + armLen * 0.55);
      ctx.stroke();
    }

    // shoes
    ctx.fillStyle = "#2a2a2a";
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(
        s * headRadius * (0.5 + legSpread),
        hipY + headRadius * 1.2 + bob,
        headRadius * 0.22,
        headRadius * 0.12,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // head sticker
    drawStickerFace(ctx, 0, bob * 0.3, headRadius, {
      photoImage,
      expression: state === "stunned" ? "dizzy" : state === "hit" ? "shocked" : expression,
      costume,
    });

    // state extras
    if (state === "stunned") {
      const t = Date.now() / 200;
      for (let i = 0; i < 3; i++) {
        const a = t + (i * Math.PI * 2) / 3;
        const sx = Math.cos(a) * headRadius * 1.25;
        const sy = -headRadius * 1.15 + Math.sin(a) * headRadius * 0.25;
        drawStar(ctx, sx, sy, headRadius * 0.16, "#ffc145");
      }
    } else if (state === "burn") {
      for (let i = 0; i < 5; i++) {
        const fx = (i - 2) * headRadius * 0.35;
        const fy = -headRadius * 1.3 - Math.abs(Math.sin(Date.now() / 120 + i)) * headRadius * 0.35;
        ctx.fillStyle = i % 2 ? "#ff6b2a" : "#ffc145";
        ctx.beginPath();
        ctx.ellipse(fx, fy, headRadius * 0.14, headRadius * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  global.STCharacter = {
    EXPRESSIONS,
    COSTUMES,
    drawStickman,
    drawStickerFace,
    drawStar,
  };
})(window);
