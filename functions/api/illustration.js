// 插图生成 API — 即梦 Seedream 4.5（火山方舟）
const ARK_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const ARK_KEY = 'c14b8773-990a-4513-8107-1f6a5d131738';
const TOKEN_SECRET = 'tosdesign-secret-2024';

async function verifyToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sigHex] = parts;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return expected === sigHex;
  } catch { return false; }
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestPost({ request }) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await verifyToken(token))) {
    return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers: CORS });
  }
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }
  const { prompt, scene } = body;
  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ ok: false, error: 'prompt required' }), { status: 400, headers: CORS });
  }

  // 天气/氛围类：全幅天空背景，无主体构图约束，软光晕散景
  const AMBIENT_SCENES = ['weather', 'nature', 'mood', 'travel', 'celebration', 'music'];
  const isAmbient = AMBIENT_SCENES.includes(scene);

  const NO_ICON_CLAUSE = '。严禁任何 emoji 风格、图标化、卡通贴纸式的小图标元素（如卡通太阳/云朵/图标轮廓），不能出现任何有黑色描边或平涂卡通风格的图形；必须是真实摄影/油画质感的写实或半写实画面';

  const suffix = isAmbient
    ? '，全幅桌面小组件背景。要求：全画面均匀铺满大气渐变色调，无明确主体，柔和散景光晕，轻微景深虚化，画面上半部分略浅方便叠加白色文字' + NO_ICON_CLAUSE + '。简洁现代风格，无任何文字，色调统一'
    : '，桌面小组件背景插图。构图硬性要求：画面左上方约2/3区域必须干净简洁（纯色或柔和渐变，无图形元素，用于叠加文字），主体图形元素只放在右下角区域，占画面不超过1/3' + NO_ICON_CLAUSE + '。简洁现代扁平风格，无任何文字，色调统一';

  const fullPrompt = prompt + suffix;

  try {
    const res = await fetch(ARK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4-5-251128',
        prompt: fullPrompt,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: false,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: data.error?.message || 'Seedream error' }), { status: 500, headers: CORS });
    }
    const url = data.data?.[0]?.url;
    if (!url) return new Response(JSON.stringify({ ok: false, error: 'no image returned' }), { status: 500, headers: CORS });
    return new Response(JSON.stringify({ ok: true, url }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
