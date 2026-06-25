const ADMIN_TOKEN = 'gavin*220499';

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${ADMIN_TOKEN}`) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers });

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers }); }

  const { userId, action } = body;
  if (!userId || !['approve', 'reject'].includes(action)) return new Response(JSON.stringify({ ok: false, error: '参数错误' }), { status: 400, headers });

  const status = action === 'approve' ? 'approved' : 'rejected';
  await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, userId).run();

  return new Response(JSON.stringify({ ok: true }), { headers });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
