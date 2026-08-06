// 卡片库：保存/列出 —— 优先 Cloudflare KV；线上未绑定 CARD_LIBRARY 时自动回退 D1（env.DB），按登录用户隔离，跨设备同步
const TOKEN_SECRET = 'tosdesign-secret-2024';

// D1 回退：确保表存在
async function ensureLibraryTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS library_cards (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    title TEXT,
    thumbnail TEXT,
    card_json TEXT NOT NULL,
    saved_at INTEGER NOT NULL
  )`).run();
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 校验 token 签名，返回 email（作为用户标识）；无效则返回 null
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
  // 兜底：cookie 里的 tos_token
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)tos_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// POST /api/library —— 保存卡片
export async function onRequestPost({ request, env }) {
  const email = await verifyAndDecode(getToken(request));
  if (!email) return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers: CORS });

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }
  const { cardData, title, thumbnail } = body;
  if (!cardData || typeof cardData !== 'object') {
    return new Response(JSON.stringify({ ok: false, error: 'cardData required' }), { status: 400, headers: CORS });
  }

  const ts = Date.now();
  const id = String(ts);
  const key = `library:${email}:${id}`;
  const record = {
    id,
    title: title || cardData.header || cardData.title || '未命名卡片',
    thumbnail: thumbnail || cardData.bgImage || '',
    cardData,
    savedAt: ts,
  };
  try {
    if (env.CARD_LIBRARY) {
      await env.CARD_LIBRARY.put(key, JSON.stringify(record));
    } else if (env.DB) {
      await ensureLibraryTable(env.DB);
      await env.DB.prepare('INSERT INTO library_cards (id, email, title, thumbnail, card_json, saved_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, email, record.title, record.thumbnail, JSON.stringify(cardData), ts).run();
    } else {
      throw new Error('未配置存储（CARD_LIBRARY KV 与 DB 均不可用）');
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: '存储写入失败: ' + e.message }), { status: 500, headers: CORS });
  }
  return new Response(JSON.stringify({ ok: true, id, savedAt: ts }), { headers: CORS });
}

// GET /api/library —— 获取当前用户所有已保存卡片
export async function onRequestGet({ request, env }) {
  const email = await verifyAndDecode(getToken(request));
  if (!email) return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers: CORS });

  const prefix = `library:${email}:`;
  const items = [];
  try {
    if (env.CARD_LIBRARY) {
      let cursor;
      do {
        const listRes = await env.CARD_LIBRARY.list({ prefix, cursor });
        for (const k of listRes.keys) {
          const raw = await env.CARD_LIBRARY.get(k.name);
          if (raw) {
            try { items.push(JSON.parse(raw)); } catch {}
          }
        }
        cursor = listRes.list_complete ? undefined : listRes.cursor;
      } while (cursor);
    } else if (env.DB) {
      await ensureLibraryTable(env.DB);
      const { results } = await env.DB.prepare('SELECT id, title, thumbnail, card_json, saved_at FROM library_cards WHERE email = ? ORDER BY saved_at DESC')
        .bind(email).all();
      for (const r of results || []) {
        let cardData = null;
        try { cardData = JSON.parse(r.card_json); } catch {}
        items.push({ id: r.id, title: r.title, thumbnail: r.thumbnail, cardData, savedAt: r.saved_at });
      }
    } else {
      throw new Error('未配置存储（CARD_LIBRARY KV 与 DB 均不可用）');
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: '存储读取失败: ' + e.message }), { status: 500, headers: CORS });
  }

  items.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  return new Response(JSON.stringify({ ok: true, items }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
