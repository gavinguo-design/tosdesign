const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const ADMIN_TOKEN = 'tosdesign-admin-2024';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers: CORS });

    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Bearer ${ADMIN_TOKEN}`) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: CORS });

    let body;
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: CORS }); }

    const { userId, action } = body;
    if (!userId || !['approve', 'reject'].includes(action)) return new Response(JSON.stringify({ ok: false, error: '参数错误' }), { status: 400, headers: CORS });

    const status = action === 'approve' ? 'approved' : 'rejected';
    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, userId).run();

    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }
};
