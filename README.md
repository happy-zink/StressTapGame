# StressTapGame

**照片火柴人 · 解压一下** — 纯解压武器沙盒桌面小游戏。

上传照片贴到火柴人脸上，拿起 **48 种武器** 往死里招呼：拳打脚踢、刀插满身、枪炮炸裂、天雷陨石。无关卡压力，双击就能玩。

![type](https://img.shields.io/badge/platform-Windows%2010%2F11-2ea44f) ![offline](https://img.shields.io/badge/offline-yes-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

---

## 直接玩（推荐）

1. 打开 [Releases](../../releases) 或下载本仓库 [`release/照片火柴人解压.exe`](./release/照片火柴人解压.exe)
2. 双击运行，无需安装 Python / 无需联网
3. 详细说明见 [`release/使用说明.txt`](./release/使用说明.txt)

> 单文件约 **14 MB**。若被 SmartScreen 拦截：更多信息 → 仍要运行。

---

## 玩法

| 操作 | 说明 |
|------|------|
| 选武器 | 底部分类栏点选，数字键 `1-9` 快捷切换 |
| 攻击 | 点画面；按住拖动可连打 |
| 大招 | 宣泄条满后按 **空格** |
| 照片角色 | 菜单 → 角色照片，裁剪贴纸脸 |
| 存档 | 本地存储，可导出 / 导入 JSON |

### 武器库 · 48 种

徒手 / 刀械 / 枪械 / 爆炸 / 火焰 / 钝器 / 穿刺 / 奇葩 / 大招  
飞刀会**钉在身上**，手雷火箭有**多阶段爆炸**，霰弹有**枪口焰 + 弹道**。

---

## 从源码运行

```powershell
cd StressTapGame
python serve.py
# 浏览器打开 http://127.0.0.1:8762/
```

或直接打开 `index.html`。

### 打包 EXE

```powershell
python build_exe.py
# 输出 dist/照片火柴人解压.exe
```

需要：Python 3.11+，打包时会自动创建本地 venv 并安装 PyInstaller / pywebview。

---

## 项目结构

```
index.html          游戏入口
css/ js/            前端
js/weapons.js       48 种武器
js/fx.js            武器特效渲染
js/game.js          沙盒战斗引擎
desktop_app.py      桌面启动器
build_exe.py        打包脚本
release/            可直接分发的 EXE + 说明
docs/               玩测记录 / 素材许可 / 限制
```

## 素材

全部为程序绘制 / Web Audio 合成，无第三方版权素材。详见 [docs/ASSETS.md](./docs/ASSETS.md)。

## License

MIT
