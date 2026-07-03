// Figma 生成队列：平台按钮 POST 入队，Figma 插件轮询 GET 消费
const TOKEN_SECRET = 'tosdesign-secret-2024';
const PLUGIN_TOKEN = 'tos-figma-bridge-2026';

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

async function ensureTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS figma_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_json TEXT NOT NULL,
    consumed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 平台按钮：入队
export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await verifyToken(token))) {
    return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers: CORS });
  }
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }
  if (!body.card || typeof body.card !== 'object') {
    return new Response(JSON.stringify({ ok: false, error: 'card required' }), { status: 400, headers: CORS });
  }
  await ensureTable(env);
  await env.DB.prepare('INSERT INTO figma_queue (card_json) VALUES (?)')
    .bind(JSON.stringify(body.card)).run();
  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

// Figma 插件：轮询消费（token 简单校验）
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== PLUGIN_TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: CORS });
  }
  await ensureTable(env);
  const { results } = await env.DB.prepare('SELECT id, card_json FROM figma_queue WHERE consumed = 0 ORDER BY id ASC LIMIT 10').all();
  if (results.length) {
    const ids = results.map(r => r.id).join(',');
    await env.DB.prepare(`UPDATE figma_queue SET consumed = 1 WHERE id IN (${ids})`).run();
  }
  const cards = results.map(r => { try { return JSON.parse(r.card_json); } catch { return null; } }).filter(Boolean);
  return new Response(JSON.stringify({ ok: true, cards }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
