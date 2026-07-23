const CRS_KEY = "cr_3a07c6ba66da659eaae348c5782ac9934507be57af7c040220bbc1af67bc1b49";
const NICK_KEY = "sk-151c42f6f5dcea5cb53e1434f9390cbc4b88dd71babf58456de6b99514494079";
const TOKEN_SECRET = 'tosdesign-secret-2024';

const SYSTEM_PROMPT = `You are a product-to-card decomposition assistant for a desktop widget design platform.

Task: read a PRD or a loose batch-design brief and decompose it into a list of widget card jobs.

Output rules:
1. Reply in Chinese only when needed, but the final payload MUST be a single \`\`\`json code block.
2. The JSON inside the code block MUST be an array.
3. Each array element MUST be an object with exactly these keys:
   - "name": short Chinese card name
   - "scene": one scene tag string from this set: info, weather, music, travel, celebration, mood, nature, action, control, health, media, transport
   - "brief": one concise Chinese sentence describing the card design need, specific enough to generate one final card directly
4. No markdown outside the json code block.
5. If the PRD clearly lists cards, keep the same count and semantics.
6. If the PRD is vague and only asks for a batch of cards, infer 5-8 practical cards with varied scenes.
7. Prefer concrete end-user cards over abstract module names.
8. Deduplicate near-identical cards.

Quality bar for brief:
- Mention the card's main content and usage context.
- Mention key data or action if obvious.
- Keep it to one sentence.
- Do not mention implementation details or JSON.

CRITICAL JSON SAFETY RULE:
- Inside any string value (name/scene/brief), NEVER use straight double quotes (") to quote UI text, button labels, or field names.
- Use Chinese corner brackets「」instead, e.g. write 主操作为「立即续费」 not 主操作为"立即续费".
- This rule is mandatory because straight double quotes inside a JSON string value break JSON parsing.

Example output:
\`\`\`json
[
  {
    "name": "今日天气卡",
    "scene": "weather",
    "brief": "设计一张今日天气卡，突出当前天气与温度，适合常驻桌面快速查看。"
  },
  {
    "name": "快递提醒卡",
    "scene": "info",
    "brief": "设计一张快递提醒卡，展示包裹状态、预计送达时间与关键提醒信息。"
  }
]
\`\`\``;

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
      // Ignore malformed stream fragments and keep reading the remaining chunks.
    }
  }
  return text.trim();
}

const API_CANDIDATES = [
  {
    url: "https://crs.chenge.ink/api/v1/messages",
    headers: { Authorization: `Bearer ${CRS_KEY}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    supportsDocument: true,
    buildBody: (input, document) => JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 1400, system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: document ? [
        { type: 'document', source: { type: 'base64', media_type: document.mediaType, data: document.base64 } },
        { type: 'text', text: input },
      ] : input }],
    }),
    parseText: (d) => d.content?.[0]?.text || '',
    label: 'crs-claude',
  },
  {
    url: "https://crs.chenge.ink/api/v1/chat/completions",
    headers: { Authorization: `Bearer ${CRS_KEY}`, 'Content-Type': 'application/json' },
    supportsDocument: true,
    responseType: 'text',
    buildBody: (input, document) => JSON.stringify({
      model: 'gpt-5.6-sol',
      max_tokens: 1400,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: document ? [
            {
              type: 'input_file',
              filename: 'prd.pdf',
              file_data: `data:${document.mediaType};base64,${document.base64}`,
            },
            { type: 'input_text', text: input },
          ] : input,
        },
      ],
    }),
    parseText: parseSseTextResponse,
    label: 'crs-gpt-56',
  },
  {
    url: "https://admin.nickcloud.xyz/v1/messages",
    headers: { Authorization: `Bearer ${NICK_KEY}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    supportsDocument: true,
    buildBody: (input, document) => JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 1400, system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: document ? [
        { type: 'document', source: { type: 'base64', media_type: document.mediaType, data: document.base64 } },
        { type: 'text', text: input },
      ] : input }],
    }),
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
    const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return expected === sigHex;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!(await verifyToken(token))) {
    return new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers });
  }

  const input = (body?.input || '').trim();
  const document = body?.documentBase64 && body?.documentMediaType
    ? { base64: String(body.documentBase64), mediaType: String(body.documentMediaType) }
    : null;
  if (!input) {
    return new Response(JSON.stringify({ ok: false, error: 'input required' }), { status: 400, headers });
  }

  let lastError = 'all candidates failed';
  // 带文档的 PDF 请求耐心给长一点（AI 解析文档本身需要更久），纯文本请求控制在短超时内，避免卡住干等
  const REQUEST_TIMEOUT_MS = document ? 45000 : 20000;
  for (const cand of API_CANDIDATES) {
    if (document && !cand.supportsDocument) continue;
    // 主力渠道先重试 1 次再认输，避免一抵抖就跳到备用（备用可能长期不可用）
    const attempts = cand.label === 'crs-claude' ? 2 : 1;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(cand.url, {
          method: 'POST',
          headers: cand.headers,
          body: cand.buildBody(input, document),
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
      } catch (error) {
        // 超时被 AbortController 中断时 error.name 为 AbortError，给出清晰提示便于排查
        lastError = error.name === 'AbortError'
          ? `${cand.label}: request timeout after ${REQUEST_TIMEOUT_MS}ms`
          : `${cand.label}: ${error.message}`;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return new Response(JSON.stringify({ ok: false, error: '暂时无法生成，请稍后重试（' + lastError + '）' }), { status: 500, headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
