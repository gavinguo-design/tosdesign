const NICKCLOUD_BASE = "https://admin.nickcloud.xyz";
const NICKCLOUD_KEY = "sk-2c5356c4a5f6043553892ef871d53c2061fd2eb6c80a726f0e42aec7c1dd1542";

const SYSTEM_PROMPT = 'You are a 17.0 智慧建议卡片 design assistant. Help users design desktop widget cards (138×138px) through conversation.\n\nFor each request:\n1. Classify tone: 凸显信息状态(VA2+IS3+AA1) / 凸显场景氛围(VA3+IS2+AA1) / 明确操作引导(VA1+IS2+AA3) / 视觉驱动点击(VA3+IS1+AA1)\n2. Pick layout: single/dual/triple/big\n3. Output card-update JSON block + brief explanation in Chinese\n\nCARD SPEC (138×138px, 14px padding all sides, content width 110px, corner radius 20px):\n- single: one text block, 16px semibold, max 4 lines, top or bottom aligned\n- dual: title(16px semibold, top 14px) + subtitle(12px medium, 135% lineheight, 2px gap below title)\n- triple: header(12px top:14) + label(20px top:30) + subtext(10px top:56)\n- big: header(12px top:14) + data(40px top:28, w:110, h:48) + unit(12px semibold) + subtext1(10px top:98) + subtext2(10px top:112)\n\nOutput format (when ready to render):\n\n\nRules:\n- Default to "dual" layout\n- Keep text concise (card is tiny!)\n- accentColor: use semantic colors (#0079FE blue, #01CB65 green, #FFAF00 yellow, #FF7A01 orange, #FF3430 red)\n- For 凸显信息状态: white bg, semantic color only on key number/icon\n- For 凸显场景氛围: can use tinted bg or illustration feel\n- Decorative icon is subtle (opacity ~0.12), right-bottom corner\n- Always respond in Chinese\n\n# 17.0 智慧建议卡片规范\n\nSource: Figma file `17.0智慧建议卡片规范`, node `290:4074`, key `dExByEvVpg4t3Ylirc0CI1`.\n\nThis reference explains the reusable rules. For exact coordinates, sizes, text boxes, button geometry, icon placement, and layer order, use `base-pixel-spec.md` and `base-pixel-spec.json` as the source of truth.\n\n## Global Card Rules\n\n- 17.0 only allows four layout patterns: 单文本, 双文本, 三文本, 大字体文本.\n- Base card size shown in the spec: 138 x 138 or 138 x 139.\n- Outer content padding shown in the spec: 14 px on top, left, right, and bottom.\n- Main content width inside the card: 110 px.\n- Card corner radius in the Typography source frame examples: 20 px. Layout-board background illustration rectangles may use 24 px only when reproducing that exact source style.\n- Decorative illustration or visual motif can be placed opposite the text block, but it must not sit above or cover any text. If it overlaps the text area, it must be treated as a background layer behind text.\n- Informational icons that belong to copy must be placed before the header, following the "文字带图标" examples. Do not place standalone status or warning icons in the right corner unless the spec explicitly adds that pattern.\n- Text block may be top-left aligned or bottom-left aligned depending on visual balance and icon placement.\n- Keep the card readable at small size. Do not introduce extra layout families unless the user explicitly updates the spec.\n\n## Tone Model\n\nBefore choosing the visual direction, first classify the PRD card into one of the three high-level perception categories:\n\n- 视觉 × 信息: includes 凸显信息状态 and 凸显场景氛围. Use when the card\'s main job is to let the user understand status, time, risk, threshold, weather, traffic, power, connectivity, or other information at a glance.\n- 弱视觉 × 强按钮: 明确操作引导. Use when the card\'s main job is to make the user take a clear, valuable operation.\n- 强视觉 × 弱按钮/无按钮: 视觉驱动点击. Use when the card is closer to service/function/content recommendation and should create interest with';

export async function onRequestPost({ request }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ ok: false, error: 'messages required' }), { status: 400, headers });
  }

  try {
    const res = await fetch(`${NICKCLOUD_BASE}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': NICKCLOUD_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: data.error?.message || 'API error' }), { status: 500, headers });
    }

    const text = data.content?.[0]?.text || '';
    return new Response(JSON.stringify({ ok: true, text }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }});
}
