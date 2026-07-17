// DELETE /api/library/:id —— 删除当前用户的某张已保存卡片
const TOKEN_SECRET = 'tosdesign-secret-2024';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function verifyAndDecode(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sigHex] = parts;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (expected !== sigHex) return null;
    const data = JSON.parse(atob(payload));
    return data.email || null;
  } catch { return null; }
}

function getToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)tos_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function onRequestDelete({ request, env, params }) {
  const email = await verifyAndDecode(getToken(request));
  if (!email) return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers: CORS });

  const id = params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'id required' }), { status: 400, headers: CORS });

  const key = `library:${email}:${id}`;
  try {
    const existing = await env.CARD_LIBRARY.get(key);
    if (!existing) return new Response(JSON.stringify({ ok: false, error: '未找到该卡片' }), { status: 404, headers: CORS });
    await env.CARD_LIBRARY.delete(key);
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'KV 删除失败: ' + e.message }), { status: 500, headers: CORS });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
