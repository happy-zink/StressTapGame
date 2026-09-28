/* weapons.js — 暴打沙盒武器库（36+），穿刺/枪械/爆炸/近战/奇葩 */
(function (global) {
  /**
   * kind:
   *  punch/slap/kick/stomp — 近战徒手，点哪打哪
   *  slash/stab — 冷兵器，可钉在身上
   *  shoot — 枪械，高速弹
   *  throw — 投掷，可钉
   *  blast — 爆炸 AOE
   *  flame — 火焰持续
   *  bolt — 电击/激光
   *  weird — 特殊演出
   */
  const CATS = [
    { id: "hands", name: "徒手", icon: "✊" },
    { id: "blades", name: "刀械", icon: "🗡️" },
    { id: "guns", name: "枪械", icon: "🔫" },
    { id: "explosive", name: "爆炸", icon: "💥" },
    { id: "fire", name: "火焰", icon: "🔥" },
    { id: "blunt", name: "钝器", icon: "🔨" },
    { id: "pierce", name: "穿刺", icon: "📌" },
    { id: "weird", name: "奇葩", icon: "🌀" },
    { id: "ultimate", name: "大招", icon: "⚡" },
  ];

  const W = (o) => ({
    cooldown: 0.18,
    ammo: Infinity,
    stick: false,
    speed: 900,
    count: 1,
    spread: 0,
    power: 1,
    shake: 0.25,
    flash: 0.15,
    hitstop: 40,
    color: "#ff6b4a",
    ...o,
  });

  const WEAPONS = [
    // ===== 徒手 =====
    W({ id: "fist", name: "重拳", emoji: "👊", cat: "hands", kind: "punch", power: 1.1, cooldown: 0.16, hitstop: 45, shake: 0.35 }),
    W({ id: "slap", name: "耳光", emoji: "🖐️", cat: "hands", kind: "slap", power: 0.9, cooldown: 0.12, hitstop: 35, shake: 0.28 }),
    W({ id: "kick", name: "飞踢", emoji: "🦵", cat: "hands", kind: "kick", power: 1.4, cooldown: 0.22, hitstop: 55, shake: 0.45 }),
    W({ id: "stomp", name: "践踏", emoji: "🦶", cat: "hands", kind: "stomp", power: 1.8, cooldown: 0.35, hitstop: 70, shake: 0.6, flash: 0.25 }),
    W({ id: "uppercut", name: "上勾拳", emoji: "💪", cat: "hands", kind: "punch", power: 1.6, cooldown: 0.28, hitstop: 60, shake: 0.5 }),

    // ===== 刀械 =====
    W({ id: "dagger", name: "匕首", emoji: "🔪", cat: "blades", kind: "stab", power: 1.3, stick: true, cooldown: 0.14, hitstop: 50, shake: 0.3, color: "#ccc" }),
    W({ id: "sword", name: "长剑", emoji: "⚔️", cat: "blades", kind: "slash", power: 1.7, stick: false, cooldown: 0.2, hitstop: 55, shake: 0.4, color: "#dde" }),
    W({ id: "katana", name: "武士刀", emoji: "🗡️", cat: "blades", kind: "slash", power: 1.9, cooldown: 0.18, hitstop: 55, shake: 0.42, color: "#eef" }),
    W({ id: "axe", name: "战斧", emoji: "🪓", cat: "blades", kind: "slash", power: 2.1, stick: true, cooldown: 0.3, hitstop: 70, shake: 0.55, color: "#c96" }),
    W({ id: "scythe", name: "镰刀", emoji: "⚔️", cat: "blades", kind: "slash", power: 2.0, cooldown: 0.28, hitstop: 65, shake: 0.5 }),
    W({ id: "chainsaw", name: "电锯", emoji: "🪚", cat: "blades", kind: "slash", power: 1.2, cooldown: 0.07, hitstop: 25, shake: 0.22, count: 1 }),
    W({ id: "cleaver", name: "菜刀", emoji: "🔪", cat: "blades", kind: "stab", power: 1.5, stick: true, cooldown: 0.18, hitstop: 55, shake: 0.38 }),

    // ===== 枪械 =====
    W({ id: "pistol", name: "手枪", emoji: "🔫", cat: "guns", kind: "shoot", power: 1.2, speed: 900, cooldown: 0.16, hitstop: 35, shake: 0.28, color: "#ffd24a" }),
    W({ id: "smg", name: "冲锋枪", emoji: "🔫", cat: "guns", kind: "shoot", power: 0.7, speed: 1500, cooldown: 0.07, hitstop: 18, shake: 0.16, spread: 0.12 }),
    W({ id: "shotgun", name: "霰弹枪", emoji: "🔫", cat: "guns", kind: "shoot", power: 0.95, speed: 950, cooldown: 0.28, hitstop: 55, shake: 0.55, count: 8, spread: 0.28, flash: 0.3 }),
    W({ id: "sniper", name: "狙击枪", emoji: "🎯", cat: "guns", kind: "shoot", power: 2.8, speed: 1100, cooldown: 0.55, hitstop: 85, shake: 0.7, flash: 0.25, color: "#8f8" }),
    W({ id: "laser", name: "激光枪", emoji: "🔫", cat: "guns", kind: "bolt", power: 1.5, speed: 2800, cooldown: 0.12, hitstop: 30, shake: 0.22, color: "#f44" }),
    W({ id: "railgun", name: "电磁炮", emoji: "⚡", cat: "guns", kind: "bolt", power: 3.2, speed: 3200, cooldown: 0.7, hitstop: 100, shake: 0.85, flash: 0.4, color: "#6cf" }),

    // ===== 爆炸 =====
    W({ id: "grenade", name: "手雷", emoji: "💣", cat: "explosive", kind: "throw", power: 2.4, blast: true, speed: 720, cooldown: 0.45, hitstop: 70, shake: 0.7, flash: 0.35, color: "#f80" }),
    W({ id: "dynamite", name: "炸药", emoji: "🧨", cat: "explosive", kind: "throw", power: 2.8, blast: true, speed: 680, cooldown: 0.55, hitstop: 80, shake: 0.8, flash: 0.4, color: "#e22" }),
    W({ id: "rocket", name: "火箭筒", emoji: "🚀", cat: "explosive", kind: "shoot", power: 3.0, blast: true, speed: 980, cooldown: 0.75, hitstop: 90, shake: 0.9, flash: 0.45, color: "#fa0" }),
    W({ id: "c4", name: "C4", emoji: "🧨", cat: "explosive", kind: "throw", power: 3.5, blast: true, speed: 600, cooldown: 0.9, hitstop: 110, shake: 1, flash: 0.5, color: "#f44" }),
    W({ id: "mine", name: "地雷", emoji: "💥", cat: "explosive", kind: "throw", power: 2.6, blast: true, speed: 500, cooldown: 0.5, hitstop: 75, shake: 0.75, color: "#c60" }),

    // ===== 火焰 =====
    W({ id: "torch", name: "火把", emoji: "🔥", cat: "fire", kind: "flame", power: 0.9, cooldown: 0.1, hitstop: 20, shake: 0.18, color: "#f80" }),
    W({ id: "flamethrower", name: "喷火器", emoji: "🔥", cat: "fire", kind: "flame", power: 0.65, cooldown: 0.05, hitstop: 12, shake: 0.12, color: "#fa0" }),
    W({ id: "fireball", name: "火球", emoji: "🟠", cat: "fire", kind: "throw", power: 1.8, blast: true, speed: 820, cooldown: 0.32, hitstop: 55, shake: 0.45, color: "#f60" }),
    W({ id: "molotov", name: "燃烧瓶", emoji: "🍾", cat: "fire", kind: "throw", power: 1.6, blast: true, speed: 700, cooldown: 0.48, hitstop: 50, shake: 0.4, color: "#f90" }),

    // ===== 钝器 =====
    W({ id: "hammer", name: "大锤", emoji: "🔨", cat: "blunt", kind: "slash", power: 2.3, cooldown: 0.38, hitstop: 80, shake: 0.7, color: "#aaa" }),
    W({ id: "bat", name: "球棒", emoji: "🏏", cat: "blunt", kind: "slash", power: 1.8, cooldown: 0.26, hitstop: 60, shake: 0.5 }),
    W({ id: "pan", name: "平底锅", emoji: "🍳", cat: "blunt", kind: "slash", power: 1.5, cooldown: 0.22, hitstop: 55, shake: 0.42 }),
    W({ id: "anvil", name: "铁砧", emoji: "⬛", cat: "blunt", kind: "throw", power: 2.6, speed: 780, cooldown: 0.55, hitstop: 90, shake: 0.85, color: "#888" }),
    W({ id: "fridge", name: "冰箱", emoji: "🧊", cat: "blunt", kind: "throw", power: 3.2, speed: 520, cooldown: 0.85, hitstop: 110, shake: 0.95, color: "#8cf" }),
    W({ id: "wrench", name: "扳手", emoji: "🔧", cat: "blunt", kind: "slash", power: 1.4, cooldown: 0.2, hitstop: 45, shake: 0.35 }),

    // ===== 穿刺 =====
    W({ id: "throwknife", name: "飞刀", emoji: "🔪", cat: "pierce", kind: "throw", power: 1.2, stick: true, speed: 1100, cooldown: 0.16, hitstop: 45, shake: 0.28, color: "#ddd" }),
    W({ id: "shuriken", name: "手里剑", emoji: "⭐", cat: "pierce", kind: "throw", power: 1.1, stick: true, speed: 1050, cooldown: 0.14, hitstop: 40, shake: 0.25, count: 3, spread: 0.2 }),
    W({ id: "spear", name: "长矛", emoji: "🔱", cat: "pierce", kind: "throw", power: 2.0, stick: true, speed: 1250, cooldown: 0.35, hitstop: 70, shake: 0.5, color: "#c96" }),
    W({ id: "nail", name: "钉子", emoji: "📌", cat: "pierce", kind: "shoot", power: 0.9, stick: true, speed: 1300, cooldown: 0.1, hitstop: 30, shake: 0.18, count: 4, spread: 0.25, color: "#999" }),
    W({ id: "arrow", name: "弓箭", emoji: "🏹", cat: "pierce", kind: "shoot", power: 1.5, stick: true, speed: 1200, cooldown: 0.22, hitstop: 50, shake: 0.32, color: "#ba6" }),

    // ===== 奇葩 =====
    W({ id: "pie", name: "奶油派", emoji: "🥧", cat: "weird", kind: "throw", power: 0.8, speed: 760, cooldown: 0.28, hitstop: 35, shake: 0.22, color: "#fcc" }),
    W({ id: "duck", name: "尖叫鸭", emoji: "🦆", cat: "weird", kind: "throw", power: 0.7, speed: 700, cooldown: 0.25, hitstop: 30, shake: 0.2, color: "#fd0" }),
    W({ id: "toilet", name: "马桶", emoji: "🚽", cat: "weird", kind: "throw", power: 2.2, speed: 560, cooldown: 0.7, hitstop: 85, shake: 0.8, color: "#eef" }),
    W({ id: "lightning", name: "天雷", emoji: "⚡", cat: "weird", kind: "bolt", power: 2.4, speed: 0, cooldown: 0.45, hitstop: 80, shake: 0.75, flash: 0.45, color: "#ff4", fromSky: true, blast: true }),
    W({ id: "meteor", name: "陨石", emoji: "☄️", cat: "weird", kind: "throw", power: 3.6, blast: true, speed: 420, cooldown: 1.0, hitstop: 120, shake: 1, flash: 0.55, color: "#f80" }),
    W({ id: "blackhole", name: "黑洞", emoji: "🌀", cat: "weird", kind: "weird", power: 2.0, cooldown: 1.2, hitstop: 90, shake: 0.7, flash: 0.35, color: "#84f" }),

    // ===== 大招 =====
    W({ id: "rush", name: "暴走连击", emoji: "💫", cat: "ultimate", kind: "weird", power: 2.5, cooldown: 3.0, hitstop: 40, shake: 0.55, rageOnly: true, color: "#f2a" }),
    W({ id: "stampede", name: "万剑归宗", emoji: "🗡️", cat: "ultimate", kind: "weird", power: 3.0, cooldown: 4.5, hitstop: 70, shake: 0.8, rageOnly: true, color: "#6cf" }),
    W({ id: "nuke", name: "清屏炸裂", emoji: "☢️", cat: "ultimate", kind: "weird", power: 4.0, cooldown: 6.0, hitstop: 130, shake: 1, flash: 0.7, rageOnly: true, color: "#fc0" }),
    W({ id: "godfist", name: "天降神掌", emoji: "🖐️", cat: "ultimate", kind: "weird", power: 3.5, cooldown: 5.0, hitstop: 100, shake: 0.9, flash: 0.5, rageOnly: true, color: "#fff" }),
  ];

  const byId = {};
  WEAPONS.forEach((w) => { byId[w.id] = w; });

  function weaponsOfCat(catId) {
    return WEAPONS.filter((w) => w.cat === catId);
  }

  global.STWeapons = {
    CATS,
    WEAPONS,
    byId,
    weaponsOfCat,
  };
})(window);
