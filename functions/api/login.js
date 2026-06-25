async function hashPassword(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (!user) return new Response(JSON.stringify({ ok: false, error: '账号不存在，请先注册' }), { status: 401, headers });

  const hash = await hashPassword(password);
  if (hash !== user.password_hash) return new Response(JSON.stringify({ ok: false, error: '密码错误' }), { status: 401, headers });

  if (user.status === 'pending') return new Response(JSON.stringify({ ok: false, error: '账号待审批，请等待管理员通过' }), { status: 403, headers });
  if (user.status === 'rejected') return new Response(JSON.stringify({ ok: false, error: '账号已被拒绝' }), { status: 403, headers });

  const token = await makeToken(user.email);
  return new Response(JSON.stringify({ ok: true, user: { name: user.name, email: user.email }, token }), { headers });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
