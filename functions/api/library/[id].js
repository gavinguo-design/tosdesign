// DELETE /api/library/:id —— 删除当前用户的某张已保存卡片
const TOKEN_SECRET = 'tosdesign-secret-2024';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
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
    if (env.CARD_LIBRARY) {
      const existing = await env.CARD_LIBRARY.get(key);
      if (!existing) return new Response(JSON.stringify({ ok: false, error: '未找到该卡片' }), { status: 404, headers: CORS });
      await env.CARD_LIBRARY.delete(key);
    } else if (env.DB) {
      const existing = await env.DB.prepare('SELECT id FROM library_cards WHERE id = ? AND email = ?').bind(id, email).first();
      if (!existing) return new Response(JSON.stringify({ ok: false, error: '未找到该卡片' }), { status: 404, headers: CORS });
      await env.DB.prepare('DELETE FROM library_cards WHERE id = ? AND email = ?').bind(id, email).run();
    } else {
      throw new Error('未配置存储（CARD_LIBRARY KV 与 DB 均不可用）');
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: '存储删除失败: ' + e.message }), { status: 500, headers: CORS });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

// PATCH /api/library/:id —— 重命名当前用户的某张已保存卡片（{ title }）
export async function onRequestPatch({ request, env, params }) {
  const email = await verifyAndDecode(getToken(request));
  if (!email) return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers: CORS });

  const id = params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'id required' }), { status: 400, headers: CORS });

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 60) : '';
  if (!title) return new Response(JSON.stringify({ ok: false, error: 'title required' }), { status: 400, headers: CORS });

  const key = `library:${email}:${id}`;
  try {
    if (env.CARD_LIBRARY) {
      const raw = await env.CARD_LIBRARY.get(key);
      if (!raw) return new Response(JSON.stringify({ ok: false, error: '未找到该卡片' }), { status: 404, headers: CORS });
      const record = JSON.parse(raw);
      record.title = title;
      await env.CARD_LIBRARY.put(key, JSON.stringify(record));
    } else if (env.DB) {
      const existing = await env.DB.prepare('SELECT id FROM library_cards WHERE id = ? AND email = ?').bind(id, email).first();
      if (!existing) return new Response(JSON.stringify({ ok: false, error: '未找到该卡片' }), { status: 404, headers: CORS });
      await env.DB.prepare('UPDATE library_cards SET title = ? WHERE id = ? AND email = ?').bind(title, id, email).run();
    } else {
      throw new Error('未配置存储（CARD_LIBRARY KV 与 DB 均不可用）');
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: '存储更新失败: ' + e.message }), { status: 500, headers: CORS });
  }
  return new Response(JSON.stringify({ ok: true, id, title }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
