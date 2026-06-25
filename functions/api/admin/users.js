const ADMIN_TOKEN = 'gavin*220499';

export async function onRequestGet({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${ADMIN_TOKEN}`) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers });

  const { results } = await env.DB.prepare('SELECT id, name, email, status, created_at FROM users ORDER BY created_at DESC').all();
  return new Response(JSON.stringify({ ok: true, users: results }), { headers });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
