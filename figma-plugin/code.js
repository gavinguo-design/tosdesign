// TOS Card Bridge — 轮询 tosdesign.club 队列，把 AI 生成的卡片画成 Figma 图层
// 布局参数严格对齐 Gavin 的 Figma 设计规范（138x138 / r20 / p14 / 黑90-60%）

const QUEUE_URL = 'https://tosdesign.club/api/figma/queue?token=tos-figma-bridge-2026';
const POLL_MS = 3000;

const BLACK90 = { r: 0, g: 0, b: 0 };
const BLACK60 = { r: 0, g: 0, b: 0 };

function solid(color, opacity) {
  return [{ type: 'SOLID', color, opacity: opacity === undefined ? 1 : opacity }];
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// 渐变字符串粗解析：linear-gradient(165deg,#3D7EE8 0%,#7BB8E8 60%,#BEE3F8 100%)
function parseGradient(bg) {
  const stops = [];
  const re = /#([0-9a-f]{6})\s+(\d+)%/gi;
  let m;
  while ((m = re.exec(bg)) !== null) {
    const c = hexToRgb('#' + m[1]);
    stops.push({ color: { r: c.r, g: c.g, b: c.b, a: 1 }, position: parseInt(m[2]) / 100 });
  }
  if (stops.length < 2) return null;
  return [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[0, 1, 0], [-1, 0, 1]],
    gradientStops: stops,
  }];
}

async function text(parent, chars, opts) {
  const t = figma.createText();
  parent.appendChild(t);
  t.x = opts.x; t.y = opts.y;
  t.resize(opts.w, opts.h || opts.size * 1.2);
  t.characters = String(chars);
  t.fontSize = opts.size;
  t.fontName = { family: 'Inter', style: opts.weight >= 600 ? 'Semi Bold' : opts.weight >= 500 ? 'Medium' : 'Regular' };
  t.lineHeight = { value: opts.lh || opts.size * 1.2, unit: 'PIXELS' };
  t.fills = solid(opts.color || BLACK90, opts.opacity === undefined ? 0.9 : opts.opacity);
  t.textAutoResize = 'NONE';
  return t;
}

async function drawCard(card, offsetX) {
  const dark = !!card.dark;
  const frame = figma.createFrame();
  frame.name = (card.header || card.title || 'TOS Card') + ' · ' + (card.layout || 'card');
  frame.resize(138, 138);
  frame.x = figma.viewport.center.x + offsetX;
  frame.y = figma.viewport.center.y;
  frame.cornerRadius = 20;

  // 背景
  const grad = typeof card.bg === 'string' && card.bg.includes('gradient') ? parseGradient(card.bg) : null;
  if (grad) frame.fills = grad;
  else {
    const c = hexToRgb(card.bg) || (dark ? { r: 0.11, g: 0.11, b: 0.12 } : { r: 1, g: 1, b: 1 });
    frame.fills = solid(c);
  }

  const tc = dark || grad ? { r: 1, g: 1, b: 1 } : BLACK90;
  const tcOp = dark || grad ? 0.95 : 0.9;
  const scOp = dark || grad ? 0.7 : 0.6;
  const accent = hexToRgb(card.accentColor);
  const layout = card.layout || 'dual';

  if (layout === 'single') {
    await text(frame, card.title || '', { x: 14, y: 14, w: 110, h: 76, size: 16, weight: 600, lh: 19, color: tc, opacity: tcOp });
  } else if (layout === 'dual') {
    await text(frame, card.title || '', { x: 14, y: 14, w: 110, h: 38, size: 16, weight: 600, lh: 19, color: tc, opacity: tcOp });
    if (card.subtitle) await text(frame, card.subtitle, { x: 14, y: 57, w: 110, h: 32, size: 12, weight: 500, lh: 16, color: tc, opacity: scOp });
  } else if (layout === 'triple') {
    await text(frame, card.header || card.title || '', { x: 14, y: 14, w: 110, h: 14, size: 12, weight: 500, lh: 14, color: tc, opacity: tcOp });
    await text(frame, card.value || '', { x: 14, y: 30, w: 110, h: 24, size: 20, weight: 600, lh: 24, color: accent || tc, opacity: accent ? 1 : tcOp });
    if (card.subtitle) await text(frame, card.subtitle, { x: 14, y: 56, w: 110, h: 12, size: 10, weight: 500, lh: 12, color: tc, opacity: scOp });
  } else if (layout === 'big') {
    await text(frame, card.header || card.title || '', { x: 14, y: 14, w: 110, h: 14, size: 12, weight: 500, lh: 14, color: tc, opacity: tcOp });
    const valStr = String(card.value || '');
    const vw = card.unit ? 110 - (String(card.unit).length * 12 + 6) : 110;
    await text(frame, valStr, { x: 14, y: 28, w: vw, h: 48, size: 40, weight: 500, lh: 48, color: accent || tc, opacity: accent ? 1 : tcOp });
    if (card.unit) await text(frame, card.unit, { x: 14 + vw + 4, y: 55, w: 30, h: 14, size: 12, weight: 600, lh: 14, color: tc, opacity: tcOp });
    if (!card.action) {
      if (card.subtitle) await text(frame, card.subtitle, { x: 14, y: 98, w: 110, h: 12, size: 10, weight: 500, lh: 12, color: tc, opacity: scOp });
      if (card.subtitle2) await text(frame, card.subtitle2, { x: 14, y: 112, w: 110, h: 12, size: 10, weight: 500, lh: 12, color: tc, opacity: scOp });
    }
  }

  // 按钮（Figma 规范：y94 h30 r999 黑8% / 长110 短74）
  if (card.action) {
    const wide = String(card.action).length > 4;
    const btn = figma.createFrame();
    frame.appendChild(btn);
    btn.name = '按钮/' + card.action;
    btn.resize(wide ? 110 : 74, 30);
    btn.x = 14; btn.y = 94;
    btn.cornerRadius = 999;
    btn.fills = grad
      ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.28 }]
      : dark
        ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.15 }]
        : [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.08 }];
    const bt = await text(btn, card.action, {
      x: 0, y: 8, w: wide ? 110 : 74, h: 14, size: 12, weight: 600, lh: 14,
      color: grad || dark ? { r: 1, g: 1, b: 1 } : BLACK90,
      opacity: grad || dark ? 0.9 : 0.8,
    });
    bt.textAlignHorizontal = 'CENTER';
  }

  // 图标占位（40x40 @ 88,88）— emoji 以文本呈现
  if (card.icon) {
    const hero = !!card.heroIcon;
    const it = await text(frame, card.icon, {
      x: hero ? 86 : 88, y: hero ? 82 : 92, w: 40, h: 44,
      size: hero ? 40 : 28, weight: 500, lh: 44,
      color: tc, opacity: hero ? 0.95 : 0.14,
    });
    it.textAlignHorizontal = 'CENTER';
  }

  return frame;
}

async function poll() {
  try {
    const res = await fetch(QUEUE_URL);
    const data = await res.json();
    if (data.ok && data.cards && data.cards.length) {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
      await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
      const frames = [];
      for (let i = 0; i < data.cards.length; i++) {
        frames.push(await drawCard(data.cards[i], i * 160));
      }
      figma.currentPage.selection = frames;
      figma.viewport.scrollAndZoomIntoView(frames);
      figma.notify('TOS Card Bridge：已生成 ' + frames.length + ' 张卡片 ✨');
    }
  } catch (e) {
    console.error('poll error', e);
  }
  setTimeout(poll, POLL_MS);
}

figma.notify('TOS Card Bridge 已启动，等待平台推送卡片…');
poll();
