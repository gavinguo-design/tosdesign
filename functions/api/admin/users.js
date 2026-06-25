const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const ADMIN_TOKEN = 'tosdesign-admin-2024';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Bearer ${ADMIN_TOKEN}`) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: CORS });

    const { results } = await env.DB.prepare('SELECT id, name, email, status, created_at FROM users ORDER BY created_at DESC').all();
    return new Response(JSON.stringify({ ok: true, users: results }), { headers: CORS });
  }
};
