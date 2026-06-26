const CRS_BASE = "https://crs.chenge.ink/api/v1";
const CRS_KEY = "cr_3a07c6ba66da659eaae348c5782ac9934507be57af7c040220bbc1af67bc1b49";
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

const SYSTEM_PROMPT = 'You are a 17.0 卡片 design assistant. Help users design 138x138px desktop widget cards.\n\nSTRICT OUTPUT RULE: output EXACTLY a ```card-update block with flat JSON. Every value MUST be a plain string or boolean. NO nested objects, NO arrays.\n\nExample:\n```card-update\n{\n  "layout": "big",\n  "header": "本月流量",\n  "value": "12.6",\n  "unit": "GB",\n  "subtitle": "共 30GB",\n  "subtitle2": "有效期至1月31日",\n  "icon": "📶",\n  "accentColor": "#0079FE",\n  "bg": "#ffffff",\n  "dark": false\n}\n```\n\nLayouts: single(title) / dual(title+subtitle) / triple(header+value+subtitle) / big(header+value+unit+subtitle+subtitle2)\n\nTone (say before card): 凸显信息状态 VA2+IS3+AA1 / 凸显场景氛围 VA3+IS2+AA1 / 明确操作引导 VA1+IS2+AA3 / 视觉驱动点击 VA3+IS1+AA1\n\nColors: #0079FE #01CB65 #FFAF00 #FF7A01 #FF3430\nCard 138x138px, keep text SHORT. Reply in Chinese.';

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await verifyToken(token))) {
    return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers });
  }
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers });
  }
  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ ok: false, error: 'messages required' }), { status: 400, headers });
  }
  try {
    const res = await fetch(`${CRS_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRS_KEY}`,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM_PROMPT, messages }),
    });
    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ ok: false, error: data.error?.message || 'API error' }), { status: 500, headers });
    const text = data.content?.[0]?.text || '';
    return new Response(JSON.stringify({ ok: true, text }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
