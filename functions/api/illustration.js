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

  const suffix = isAmbient
    // 天气/氛围类：参考 Figma 官方天气卡模板（node 29:1921）— 背景是真实风景摄影/自然景观，不是纯色渐变。关键约束是禁止卡通/emoji图标，不是禁止写实
    ? '，全幅桌面小组件背景。要求：真实风景摄影/自然景观质感（如真实天空、云层、阳光镜头光斑、海面/山峰/城市天际线），摄影级真实质感，非插画非漫画。构图：画面左侧/左上角预留深色或深化阴影区域（用于叠加白色文字），整体色调与主题呼应（晴天=暖金蓝天，夜晚=深蓝星空，雨天=灰蓝阴沉，日落=橙粉斑烂）。严禁出现卡通风格/emoji风格图标、手绘贴纸式小图标（如卡通太阳笑脸、手绘云朵、平涂描边图形），不要求无图形元素，但必须是摄影级/自然写实，不能是卡通插画风格。无任何文字，画面整体通透明亮'
    // 其他卡：可以有真实插图主体（生日蜡烛/玫瑰花等），只需避免 emoji 贴纸感
    : '，桌面小组件背景插图。构图硬性要求：画面左上方约2/3区域必须干净简洁（纯色或柔和渐变，无图形元素，用于叠加文字），主体图形元素只放在右下角区域，占画面不超过1/3。主体可以是真实插图/摄影质感，但严禁 emoji 风格、卡通贴纸式平涂图标（无黑色描边）。简洁现代扁平风格，无任何文字，色调统一';

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
