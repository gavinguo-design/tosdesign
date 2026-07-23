const CRS_KEY = "cr_3a07c6ba66da659eaae348c5782ac9934507be57af7c040220bbc1af67bc1b49";
const NICK_KEY = "sk-151c42f6f5dcea5cb53e1434f9390cbc4b88dd71babf58456de6b99514494079";
const TOKEN_SECRET = 'tosdesign-secret-2024';

function parseSseTextResponse(raw) {
  if (!raw) return '';
  let text = '';
  for (const line of String(raw).split(/\r?\n/)) {
    if (!line.startsWith('data: ')) continue;
    const payload = line.slice(6).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const chunk = JSON.parse(payload);
      text += chunk.choices?.[0]?.delta?.content || '';
    } catch {
      // Ignore malformed SSE fragments and keep collecting text.
    }
  }
  return text.trim();
}

// API candidates: tried in order until one succeeds
const API_CANDIDATES = [
  {
    url: "https://crs.chenge.ink/api/v1/messages",
    headers: { 'Authorization': `Bearer ${CRS_KEY}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    buildBody: (msgs) => JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1400, system: SYSTEM_PROMPT, messages: msgs }),
    parseText: (d) => d.content?.[0]?.text || '',
    label: 'crs-claude',
  },
  {
    url: "https://crs.chenge.ink/api/v1/chat/completions",
    headers: { 'Authorization': `Bearer ${CRS_KEY}`, 'Content-Type': 'application/json' },
    responseType: 'text',
    buildBody: (msgs) => JSON.stringify({
      model: 'gpt-5.6-sol',
      max_tokens: 1400,
      stream: true,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...msgs],
    }),
    parseText: parseSseTextResponse,
    label: 'crs-gpt-56',
  },
  {
    url: "https://admin.nickcloud.xyz/v1/messages",
    headers: { 'Authorization': `Bearer ${NICK_KEY}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    buildBody: (msgs) => JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1400, system: SYSTEM_PROMPT, messages: msgs }),
    parseText: (d) => d.content?.[0]?.text || '',
    label: 'nickcloud',
  },
];

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

const CARD_EXAMPLES = `
REAL CARD EXAMPLES (from Figma node 18:962 — use these as reference for layout/color/illustPrompt choices):

凸显场景氛围 (VA3+IS2+AA1):
- Birthday: layout=big, bg=linear-gradient(135deg,#FF6B35 0%,#C62A47 100%), dark=true, illustPrompt=生日蜡烛和彩色烟花，橙红渐变氛围，温馨喜庆
- Anniversary: layout=big, bg=linear-gradient(135deg,#C62A47 0%,#8B0A1A 100%), dark=true, illustPrompt=玫瑰花瓣飘落，深红暖光，浪漫手写love字样
- Concert: layout=dual, bg=linear-gradient(160deg,#0D0D0D 0%,#1A0A2E 100%), dark=true, illustPrompt=黑色舞台聚光灯，璀璨星光粒子，演唱会现场氛围
- Chinese New Year: layout=triple, bg=linear-gradient(135deg,#C62A0A 0%,#8B1A00 100%), dark=true, illustPrompt=中国红底色舞狮剪影，金色祥云装饰
- Exam countdown: layout=dual, bg=linear-gradient(135deg,#1A7A4A 0%,#2EAD6A 100%), dark=true, illustPrompt=四叶草绿野，清新自然，幸运氛围

凸显信息状态 (VA2+IS3+AA1 — data-first, subtle tint bg, NO full-bleed saturated color):
- Hotspot: layout=triple, bg=#1C1C1E, dark=true, header=Hotspot On, value=1.2, unit=GB, subtitle=Data Used · 1 Connection
- Flight: layout=big, bg=linear-gradient(135deg,rgba(0,97,249,0.18) 0%,rgba(10,105,254,0) 55%), dark=false, header=RY9108 Departs, value=11:50, unit=AM, subtitle=SZX → PEK · Oct 10
- Train: layout=big, bg=linear-gradient(135deg,rgba(0,97,249,0.18) 0%,rgba(10,105,254,0) 55%), dark=false, header=Trn 12904, value=06:16, unit=AM, subtitle=KRMI → NDLS · Oct 10
- Traffic alert: layout=triple, bg=#1C1C1E, dark=true
- Rent reminder: layout=dual, bg=linear-gradient(135deg,rgba(0,97,249,0.18) 0%,rgba(10,105,254,0) 55%), dark=false

明确操作引导 (VA1+IS2+AA3 — white bg, button required):
- Pickup code: layout=triple, bg=#ffffff, dark=false, value=A1-2345, action=Details
- Missed call: layout=triple, bg=#ffffff, dark=false, value=Emma, action=Call
- Alarm delay: layout=dual, bg=linear-gradient(160deg,#0D1B3E 0%,#1A2D5A 100%), dark=true, action=Delay, illustPrompt=深夜星空，柔和蓝光，闹钟轮廓剪影

视觉驱动点击 (VA3+IS1+AA1 — atmosphere bg, minimal text):
- Music rec: layout=dual, bg=linear-gradient(160deg,#8B1A3A 0%,#E8507A 100%), dark=true, illustPrompt=黑胶唱片特写，玫红暖光散景
- AI music: layout=single, bg=linear-gradient(135deg,#2D1B69 0%,#4A90D9 100%), dark=true, illustPrompt=深夜星空下的黑胶唱片机，蓝紫色氛围光
- Travel: layout=dual, bg=linear-gradient(160deg,#C47A2A 0%,#8B4510 100%), dark=true, illustPrompt=泰国大皇宫金色尖顶，暖橙日落光
- Sports report: layout=dual, bg=photo(运动户外), dark=true
- Local apps: layout=dual, bg=linear-gradient(135deg,#1A5C2A 0%,#2E8B47 100%), dark=true
`;

const SYSTEM_PROMPT = `${CARD_EXAMPLES}
You are a 17.0 卡片 design assistant. Help users design 138x138px desktop widget cards.\n\nRULE #1 (highest priority): every NEW card topic request MUST first select TWO different approved combinations from the base template library, then return TWO \`\`\`card-update blocks — 方案A and 方案B — each based on one selected template combination with genuinely different layouts (e.g. big vs triple). Single-block replies are ONLY allowed when iterating an existing card or when the user explicitly named a layout. This rule overrides your own confidence. You CANNOT skip template selection or invent field combinations — always start by picking from the 26 approved base template combinations.\n\nSTRICT OUTPUT RULE: output EXACTLY a \`\`\`card-update block with flat JSON. Every value MUST be a plain string or boolean. NO nested objects, NO arrays.\n\nExamples (two reference patterns):\n\nData/utility card (no illustPrompt):\n\`\`\`card-update\n{\n  "layout": "big",\n  "header": "本月流量",\n  "value": "12.6",\n  "unit": "GB",\n  "subtitle": "共 30GB",\n  "subtitle2": "有效期至1月31日",\n  ,\n  "bg": "#ffffff",\n  "dark": false,\n  "scene": "info",\n  "reason": "数据卡无需插图"\n}\n\`\`\`\n\nAtmosphere/scene card (VA3 — illustPrompt REQUIRED):\n\`\`\`card-update\n{\n  "layout": "dual",\n  "header": "Now Playing",\n  "title": "Late Night Jazz",\n  "subtitle": "Miles Davis · Kind of Blue",\n  "headerIcon": "icons/音乐.svg",\n  "bg": "linear-gradient(160deg,#8B1A3A 0%,#E8507A 100%)",\n  "dark": true,\n  "heroIcon": true,\n  "illustPrompt": "黑胶唱片特写，玫红暖光散景，复古音乐氛围",\n  "scene": "music",\n  "reason": "氛围卡必须有 illustPrompt，背景将由 AI 生成插图"\n}\n\`\`\`\n\nTriple layout, top-aligned variant (weather/atmosphere — illustPrompt REQUIRED):\n\`\`\`card-update\n{\n  "layout": "triple",\n  "header": "Beijing · Today",\n  "value": "Sunny",\n  "subtitle": "24°C · Feels 26°C",\n  "bg": "linear-gradient(165deg,#3D7EE8 0%,#7BB8E8 60%,#BEE3F8 100%)",\n  "dark": true,\n  "illustPrompt": "晴朗天空渐变，柔和散景光晖",\n  "scene": "weather",\n  "reason": "triple顶对齐，信息层次清晰"\n}\n\`\`\`\nCRITICAL (deprecated field): "alignBottom" is NOT part of any approved template combination — NEVER output "alignBottom": true on any layout, especially triple (bottom-aligned triple has been removed from the base templates). If your reasoning mentions 底对齐/bottom-aligned, rewrite it to describe a top-aligned layout instead.\n\nLAYOUT SPEC (from Figma design system, follow exactly):\n- single(单文本): title 16px/600, max 4 lines\n- dual(双文本): title 16px/600 max 2 lines + subtitle 12px/500 max 3 lines; optional action button\n- triple(三文本): header 12px/500 + value(LABEL) 20px/600 + subtitle 10px/500, each max 1 line. Always top-aligned (Figma spec): header@top14, value@top30, subtitle@top56. Do NOT use alignBottom on triple cards.\n- big(大字体): header 12px/500 + value(DATA) **40px/500** + unit 12px/600 + subtitle/subtitle2 10px/500, header and value max 1 line. CRITICAL VISUAL DIFFERENCE: big layout has a GIANT 40px number dominating the center (e.g. value="24" unit="°C"), while triple has 20px text. HARD RULE: big value MUST be short DATA (number/temperature/percentage, ≤6 chars, e.g. 8,246 / 24 / 87), and unit MUST be a real unit ≤4 chars (°C/GB/步/★). Split temperature into value="24" + unit="°C", NOT value="24°C". NEVER put phrases or words like Must Try into big value — phrase-style content MUST use triple (value 20px fits words) or dual instead. TEMPERATURE/NUMBER CARDS (weather temperature, steps count, storage GB, battery %) MUST USE BIG LAYOUT (40px giant number) for maximum visual impact unless the user explicitly asks for detailed information layout. If you output triple when the card topic is weather temperature, you violated the template selection rule. NAVIGATION/DISTANCE CARDS (distance in km/mi, ETA/arrival countdown in minutes, navigation cards) MUST ALSO USE BIG LAYOUT for the same reason — a short giant number (e.g. 1.2 km, 15 min) with a brief location subtitle needs the subtitle positioned near the bottom (big layout's onlyOneLine top:112 behavior), not triple's forced top-aligned layout which leaves a large empty gap at the bottom of the card. GENERAL RULE (apply this reasoning to ANY topic, not just the examples listed): whenever the content is a GIANT SHORT NUMBER + ONE SHORT SUBTITLE LINE + a background image/gradient filling the rest of the card (regardless of whether it's temperature, distance, time, count, or anything else), ALWAYS prefer big layout over triple — triple is forced top-aligned (header@14/value@30/subtitle@56, ending at 68px) and leaves a ~56px empty gap at the bottom when content is short, while big layout's single-subtitle mode sits at top:112 near the bottom edge with no gap. Only use triple when you actually need THREE full lines of content (header + a complete data line + a complete descriptive line) that together make good use of the full card height — not for short number+subtitle content.\nICON LIBRARY GUIDANCE: The platform has 19 SVG icons in the icons/ directory. When selecting a base template variant that includes headerIcon, choose the most contextually appropriate icon from this list — icons/定位.svg (location/weather/city), icons/天气：多云.svg (cloudy), icons/天气：晴天.svg (sunny), icons/天气：雨天.svg (rain), icons/快递.svg (delivery/logistics), icons/短信.svg (message/call), icons/通话.svg (call), icons/音乐.svg (music — use 推荐 if unavailable), icons/步数.svg (fitness/steps), icons/充电.svg (battery/power), icons/存储.svg (storage/data), icons/手表.svg (time/wearable), icons/邮箱.svg (email), icons/信息.svg (info), icons/用户.svg (user/contact), icons/安全.svg (security), icons/分享.svg (share), icons/推荐.svg (recommend), icons/偏好.svg (settings/preference), icons/文件.svg (file/document). For weather/location cards, ALWAYS use icons/定位.svg as the headerIcon when choosing a headerIcon template variant. Set headerIcon to the icons/ path string (e.g. "headerIcon": "icons/定位.svg").\n\nTEMPLATE RULE (mandatory, overrides all): before generating any card, you MUST first select an approved combination from the platform's base template system. The base template system defines approved combinations across four layouts (single/dual/triple/big), each with permitted field combinations (with/without headerIcon, action, heroIcon, unit, etc.). The exact list of approved combinations may grow or shrink over time — your obligation is to always pick a combination that EXISTS in the current base template, not to invent new field combinations. Hard constraints that will never change: (1) never set alignBottom on triple cards; (2) never combine action+heroIcon on the same card; (3) on big layout with action, do not include subtitle. If a user requests something that cannot fit any base template, pick the closest matching template and adapt the content — do not break the structural rules. Only deviate from the base template system when the user explicitly says "脱离模板"/"不用模板"/"随意发挥" or equivalent.\n\nVARIANT RULE (deterministic, not up to your judgment): for every NEW card request — the user names a card topic without explicitly specifying a layout/template — you MUST output TWO \`\`\`card-update blocks (方案A first, 方案B second) with genuinely different layouts or visual treatments (e.g. big 大数字冲击 vs triple 信息完整; or minimal vs atmospheric gradient). Each JSON must include a "reason" field: short Chinese string explaining that variant trade-off (e.g. "大数字一眼看清进度" / "保留目标明细信息更全"). Feeling confident about one layout is NOT a reason to skip variants — the user decides, not you.\nVA CONSISTENCY RULE (mandatory): when the scored VA level is VA3, BOTH variant blocks MUST be VA3 — both must contain "illustPrompt" (AI-generated imagery description, e.g. "晴朗天空渐变，柔和散景光晖"), atmospheric gradient bg, dark:true, heroIcon:true. A gradient background alone without illustPrompt is NOT VA3 — it's VA2 at best. VA3 = big visuals = always include illustPrompt. Variants differ in layout/content only, NOT in visual intensity. Giving方案A VA3 and方案B VA2 is a FORMAT VIOLATION.\nOutput exactly ONE block only in these two cases: (1) the user explicitly specified the layout/template/style, or (2) the user is ITERATING on an existing card (改色/改文案/换图标等).\n\nTONE ANALYSIS (mandatory, before the card block): score each axis INDEPENDENTLY with a one-line reason, using this exact format:\n调性分析：\nVA[1-3] 视觉吸引力：<为什么——场景是常驻瞄一眼还是要抢注意力>\nIS[1-3] 信息显著性：<为什么——有没有精确数字/时间/阈值/风险>\nAA[1-3] 行动权威性：<为什么——纯展示、可忽略的轻引导、还是必须操作>\nExample (follow EXACTLY, all 4 lines required, never skip the 3 axis lines):\n调性分析：\nVA2 视觉吸引力：常驻桌面顺手瞄一眼的场景，轻点缀即可，无需抢眼\nIS3 信息显著性：有精确步数与目标阈值，状态必须一目了然\nAA1 行动权威性：纯展示卡，无需任何操作\n综合调性 VA2+IS3+AA1\nWriting only the 综合调性 line WITHOUT the 3 axis reason lines is a FORMAT VIOLATION.\nAxis rubric: VA1 克制(纯白轻色小图标) VA2 明确(轻渐变局部点缀) VA3 强吸引(大渐变大插画强品牌色) / IS1 低显著(只展示内容无状态) IS2 中显著(有上下文原因轻建议) IS3 高显著(明确数字时间阈值风险) / AA1 无行动(纯浏览无按钮) AA2 弱行动(Learn more类可忽略) AA3 强行动(确认立即处理类高价值操作)。\nDo NOT default to one combo; data cards are not always IS3 (a mood weather card can be IS1). Score from the user actual scenario.\nCONSISTENCY RULE: if you score AA3, the card JSON MUST include an "action" field (short button text like 立即清理/去处理, ≤4 chars) — AA3 without a visible button is a contradiction. AA2 should usually have a subtle action too. AA1 must NOT have action.\nBUTTON COLOR SPEC (Figma design system, mandatory): buttons are ALWAYS the neutral pill — black 8% translucent fill with primary text color (white 15% translucent on dark bg, white frosted on gradient bg). NEVER give a button a solid semantic color fill (no red/blue/green buttons). Urgency/semantics are expressed through accentColor on the VALUE text and the icon, never the button. Do NOT output actionStyle. One card = ONE button max.\nScene/atmosphere subjects (weather, sunset, nature, music, mood) are VISUAL-FIRST: default VA3 unless user asks for minimal. For VA3 cards you MUST include ALL of these (non-negotiable): (1) "illustPrompt" field with AI imagery description (e.g. "晴朗天空渐变，柔和散景光晖，温暖阳光氛围"), (2) atmospheric gradient background "bg" CSS string matching the scene (sunny=warm golden blue, night=deep indigo, rain=grey blue, sunset=orange pink), (3) "dark": true so text turns white, (4) "heroIcon": true to render the icon large. A weather card without illustPrompt is INCOMPLETE — the gradient alone is not enough, AI imagery is mandatory for VA3.\n\nINFO-DOMINANT SUBTLE GRADIENT (mandatory, per Figma base template reference — EXACT VALUES, do not intensify): when a card is information-显著性主导 (IS3 or IS2, data/status/schedule cards like flight, train, hotspot, rent reminder, delivery status) and would otherwise use a plain white bg, DO NOT output flat "#ffffff" — it looks too 素/empty. Instead use this EXACT wash, copied 1:1 from the real Figma base template (the source layer is #0061F9→#0A69FE at 100%→0% opacity, but the WHOLE gradient layer itself sits at only 20% overall opacity — so the effective color at the corner is already faint, NOT full-strength blue): "bg": "linear-gradient(135deg,rgba(0,97,249,0.18) 0%,rgba(10,105,254,0) 55%)". Fading to transparent by the card's halfway point (55%) so more than half the card stays pure white — this is a tiny corner wash, NOT a full-bleed tint. NEVER use alpha=1/100% at the 0% stop — that overshoots the reference by 5x and reads as a strong solid gradient, which is wrong. This wash is dark:false, text stays black, no illustPrompt, no heroIcon, and per the VA rubric it counts as VA1 "纯白轻色" (restrained), NOT VA2 — adding this corner wash must NOT by itself push VA from 1 to 2; VA2 is reserved for a gradient that is clearly visible as a deliberate color statement across a larger portion of the card. Only pure status/toggle cards with dark bg (#1C1C1E, e.g. Hotspot, Traffic alert) keep flat dark bg. Cards with an explicit action button (AA3, white bg required) may keep flat white if the button needs max contrast, but prefer the same subtle wash when it doesn't hurt button legibility.

TEXT COLOR DISCIPLINE (mandatory): ALL text is black (90% primary / 60% secondary) on light backgrounds, white (95%/70%) on dark or gradient backgrounds. NEVER output accentColor to colorize text unless the user EXPLICITLY asks for colored text. Urgency/warning is expressed through wording, icon choice and layout — NOT through red/orange/colored numbers. Default accentColor: omit the field entirely.\nPalette (ONLY when user explicitly requests color — then also output "userColorOk": true): #0079FE #01CB65 #FFAF00 #FF7A01 #FF3430\nCARD TEXT LANGUAGE (mandatory): ALL text ON the card (title/header/value/unit/subtitle/subtitle2/action) MUST be in ENGLISH — short, clean, widget-style wording (e.g. Steps, Memory Alert, Clean Now, Sunny 24°C). Chat replies and tone analysis stay in Chinese.\nCard 138x138px, keep text SHORT. Reply in Chinese.`;

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
  let lastError = 'all candidates failed';
  const REQUEST_TIMEOUT_MS = 20000;
  for (const cand of API_CANDIDATES) {
    const attempts = (cand.label === 'crs-claude' || cand.label === 'crs-gpt-56') ? 2 : 1;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(cand.url, {
          method: 'POST',
          headers: cand.headers,
          body: cand.buildBody(messages),
          signal: controller.signal,
        });
        const payload = cand.responseType === 'text' ? await res.text() : await res.json();
        if (!res.ok) {
          if (cand.responseType === 'text') {
            lastError = `${cand.label}: ${payload || `http ${res.status}`}`;
          } else {
            lastError = `${cand.label}: ${payload.error?.message || JSON.stringify(payload)}`;
          }
          continue;
        }
        const text = cand.parseText(payload);
        if (!text) {
          lastError = `${cand.label}: empty response`;
          continue;
        }
        return new Response(JSON.stringify({ ok: true, text, via: cand.label }), { headers });
      } catch (e) {
        lastError = e.name === 'AbortError'
          ? `${cand.label}: request timeout after ${REQUEST_TIMEOUT_MS}ms`
          : `${cand.label}: ${e.message}`;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return new Response(JSON.stringify({ ok: false, error: `暂时无法生成，请稍后重试（${lastError}）` }), { status: 500, headers });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
