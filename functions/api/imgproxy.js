// 图片代理：给前端 canvas 亮度采样用（火山 TOS 无 CORS 头，需代理加头）
const ALLOWED_HOSTS = ['tos-cn-beijing.volces.com'];

export async function onRequestGet({ request }) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) return new Response('url required', { status: 400 });
  let target;
  try { target = new URL(url); } catch { return new Response('bad url', { status: 400 }); }
  if (!ALLOWED_HOSTS.some(h => target.hostname.endsWith(h))) {
    return new Response('host not allowed', { status: 403 });
  }
  const res = await fetch(target.toString());
  if (!res.ok) return new Response('fetch failed', { status: 502 });
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
