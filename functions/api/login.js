const SITE_EMAIL = 'gavin@tosdesign';
const SITE_PASSWORD = '12345ga';

async function makeToken(email) {
  const payload = btoa(JSON.stringify({ email, ts: Date.now() }));
  const secret = 'tosdesign-secret-2024';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${payload}.${sigHex}`;
}

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers }); }

  const { email, password } = body;
  if (!email || !password) return new Response(JSON.stringify({ ok: false, error: '请填写邮箱和密码' }), { status: 400, headers });

  // 全站统一登录：只有这一组账号密码可以登录
  if (email.trim().toLowerCase() !== SITE_EMAIL || password !== SITE_PASSWORD) {
    return new Response(JSON.stringify({ ok: false, error: '账号或密码错误' }), { status: 401, headers });
  }

  const token = await makeToken(SITE_EMAIL);
  return new Response(JSON.stringify({ ok: true, user: { name: 'gavin', email: SITE_EMAIL }, token }), { headers });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
