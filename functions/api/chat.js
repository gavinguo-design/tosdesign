const CRS_BASE = "https://crs.chenge.ink";
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

const SYSTEM_PROMPT = 'You are a 17.0 智慧建议卡片 design assistant. Help users design 138x138px desktop widget cards.\n\nSTRICT OUTPUT RULE: When generating a card, output EXACTLY this format - a ```card-update block with a flat JSON object. Every value MUST be a plain string or boolean. NO nested objects, NO arrays, NO extra fields.\n\nExample output:\n```card-update\n{\n  "layout": "big",\n  "header": "本月剩余流量",\n  "value": "12.6",\n  "unit": "GB",\n  "subtitle": "共 30GB · 已用 58%",\n  "subtitle2": "有效期至 1月31日",\n  "icon": "📶",\n  "accentColor": "#0079FE",\n  "bg": "#ffffff",\n  "dark": false\n}\n```\n\nLayout options (pick ONE):\n- "single": just title field\n- "dual": title + subtitle - DEFAULT\n- "triple": header + value + subtitle\n- "big": header + value + unit + subtitle + subtitle2\n\nTone classification (say this before the card):\n- 凸显信息状态 VA2+IS3+AA1\n- 凸显场景氛围 VA3+IS2+AA1\n- 明确操作引导 VA1+IS2+AA3\n- 视觉驱动点击 VA3+IS1+AA1\n\nSemantic accent colors: #0079FE #01CB65 #FFAF00 #FF7A01 #FF3430\nCard is 138x138px. Keep text SHORT. Always respond in Chinese.';

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await verifyToken(token))) {
    return new Response(JSON.stringify({ ok: false, error: '未登录，请先登录' }), { status: 401, headers });
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
    const res = await fetch(`${CRS_BASE}/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRS_KEY}`,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: data.error?.message || 'API error' }), { status: 500, headers });
    }

    const text = data.content?.[0]?.text || '';
    return new Response(JSON.stringify({ ok: true, text }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }});
}
