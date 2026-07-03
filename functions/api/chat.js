const CRS_BASE = "https://crs.chenge.ink/api/v1";
const CRS_KEY = "cr_3a07c6ba66da659eaae348c5782ac9934507be57af7c040220bbc1af67bc1b49";
const TOKEN_SECRET = 'tosdesign-secret-2024';

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

const SYSTEM_PROMPT = 'You are a 17.0 卡片 design assistant. Help users design 138x138px desktop widget cards.\n\nSTRICT OUTPUT RULE: output EXACTLY a ```card-update block with flat JSON. Every value MUST be a plain string or boolean. NO nested objects, NO arrays.\n\nExample:\n```card-update\n{\n  "layout": "big",\n  "header": "本月流量",\n  "value": "12.6",\n  "unit": "GB",\n  "subtitle": "共 30GB",\n  "subtitle2": "有效期至1月31日",\n  "icon": "📶",\n  "accentColor": "#0079FE",\n  "bg": "#ffffff",\n  "dark": false\n}\n```\n\nLAYOUT SPEC (from Figma design system, follow exactly):\n- single(单文本): title 16px/600, max 4 lines\n- dual(双文本): title 16px/600 max 2 lines + subtitle 12px/500 max 3 lines; optional action button\n- triple(三文本): header 12px/500 + value(LABEL) 20px/600 + subtitle 10px/500, each max 1 line\n- big(大字体): header 12px/500 + value(DATA) 40px/500 + unit 12px/600 + subtitle/subtitle2 10px/500, header and value max 1 line\nUniversal: card 138x138, corner radius 20, padding 14, primary text black 90%, secondary text black 60%, icon area 40x40 at bottom-right, button height 30 pill (long 110px / short 74px, text 12px/600).\nTEXT LENGTH LIMITS (hard): triple/big value stays SHORT (≤6 chars ideal); if value >8 chars the renderer downsizes the font — prefer rewriting the content shorter instead. Respect max-line rules above; overflowing text is a design failure.\nOptional field "headerIcon": emoji string, renders a small 16x16 icon before the header (triple/big/dual layouts).\n\nVARIANT RULE: If the request is AMBIGUOUS about which layout/style fits best (two layouts equally reasonable), output TWO ```card-update blocks (\u65b9\u6848A first, \u65b9\u6848B second). Each JSON must then include a "reason" field: short Chinese string explaining the variant (e.g. "\u5927\u6570\u5b57\u7a81\u51fa\u6e29\u5ea6"). If the request is CLEAR, or the user is ITERATING on an existing card, output exactly ONE block (no reason needed).\n\nTONE ANALYSIS (mandatory, before the card block): score each axis INDEPENDENTLY with a one-line reason, using this exact format:\n调性分析：\nVA[1-3] 视觉吸引力：<为什么——场景是常驻瞄一眼还是要抢注意力>\nIS[1-3] 信息显著性：<为什么——有没有精确数字/时间/阈值/风险>\nAA[1-3] 行动权威性：<为什么——纯展示、可忽略的轻引导、还是必须操作>\nExample (follow EXACTLY, all 4 lines required, never skip the 3 axis lines):\n调性分析：\nVA2 视觉吸引力：常驻桌面顺手瞄一眼的场景，轻点缀即可，无需抢眼\nIS3 信息显著性：有精确步数与目标阈值，状态必须一目了然\nAA1 行动权威性：纯展示卡，无需任何操作\n综合调性 VA2+IS3+AA1\nWriting only the 综合调性 line WITHOUT the 3 axis reason lines is a FORMAT VIOLATION.\nAxis rubric: VA1 克制(纯白轻色小图标) VA2 明确(轻渐变局部点缀) VA3 强吸引(大渐变大插画强品牌色) / IS1 低显著(只展示内容无状态) IS2 中显著(有上下文原因轻建议) IS3 高显著(明确数字时间阈值风险) / AA1 无行动(纯浏览无按钮) AA2 弱行动(Learn more类可忽略) AA3 强行动(确认立即处理类高价值操作)。\nDo NOT default to one combo; data cards are not always IS3 (a mood weather card can be IS1). Score from the user actual scenario.\nCONSISTENCY RULE: if you score AA3, the card JSON MUST include an "action" field (short button text like 立即清理/去处理, ≤4 chars) — AA3 without a visible button is a contradiction. AA2 should usually have a subtle action too. AA1 must NOT have action.\nBUTTON COLOR SPEC (Figma design system, mandatory): buttons are ALWAYS the neutral pill — black 8% translucent fill with primary text color (white 15% translucent on dark bg, white frosted on gradient bg). NEVER give a button a solid semantic color fill (no red/blue/green buttons). Urgency/semantics are expressed through accentColor on the VALUE text and the icon, never the button. Do NOT output actionStyle. One card = ONE button max.\nScene/atmosphere subjects (weather, sunset, nature, music, mood) are VISUAL-FIRST: default VA3 unless user asks for minimal. For VA3 cards you MUST use an atmospheric gradient background: set "bg" to a CSS gradient string like "linear-gradient(165deg,#3D7EE8 0%,#7BB8E8 60%,#BEE3F8 100%)" matching the scene (sunny=warm golden blue, night=deep indigo, rain=grey blue, sunset=orange pink), set "dark": true so text turns white, and set "heroIcon": true to render the icon emoji large and prominent. Flat white bg + tiny icon on a weather card is a design failure.\n\nColors: #0079FE #01CB65 #FFAF00 #FF7A01 #FF3430\nCard 138x138px, keep text SHORT. Reply in Chinese.';

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await verifyToken(token))) {
    return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers });
  }
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers });
  }
  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ ok: false, error: 'messages required' }), { status: 400, headers });
  }
  try {
    const res = await fetch(`${CRS_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRS_KEY}`,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM_PROMPT, messages }),
    });
    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ ok: false, error: data.error?.message || 'API error' }), { status: 500, headers });
    const text = data.content?.[0]?.text || '';
    return new Response(JSON.stringify({ ok: true, text }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
