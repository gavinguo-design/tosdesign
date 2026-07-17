// 卡片库：保存/列出 —— Cloudflare KV 云端存储，按登录用户隔离，跨设备同步
const TOKEN_SECRET = 'tosdesign-secret-2024';

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
    await env.CARD_LIBRARY.put(key, JSON.stringify(record));
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'KV 写入失败: ' + e.message }), { status: 500, headers: CORS });
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
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'KV 读取失败: ' + e.message }), { status: 500, headers: CORS });
  }

  items.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  return new Response(JSON.stringify({ ok: true, items }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
