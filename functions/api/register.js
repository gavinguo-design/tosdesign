async function hashPassword(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers }); }

  const { name, email, password } = body;
  if (!name || !email || !password) return new Response(JSON.stringify({ ok: false, error: '请填写所有字段' }), { status: 400, headers });
  if (password.length < 6) return new Response(JSON.stringify({ ok: false, error: '密码至少 6 位' }), { status: 400, headers });

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (existing) return new Response(JSON.stringify({ ok: false, error: '该邮箱已注册' }), { status: 409, headers });

  const hash = await hashPassword(password);
  await env.DB.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').bind(name, email.toLowerCase(), hash).run();

  return new Response(JSON.stringify({ ok: true, message: '注册成功，等待管理员审批后即可使用' }), { headers });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
