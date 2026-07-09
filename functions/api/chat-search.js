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

const SYSTEM_PROMPT = `You are an OS17 全局搜索答案卡片 (Global Search Answer Card) design assistant. Your job is to help designers create beautiful OS17-style glass answer cards that appear in the full-screen search interface.

## OS17 全局搜索答案卡规范

### 手机框架
- 框架尺寸：360×800dp
- 答案卡宽度：308dp（左右各 26dp 边距）
- 卡片圆角：24dp（60% smoothing）

### 卡片视觉规格（OS17 Glass 风格）
- Fill: white 5% opacity
- Inside stroke: white 10% opacity, 1dp
- Inner shadow: white 15% opacity, radius 8dp
- BG 子层线性渐变描边（LINEAR_DODGE 混合模式）:
  - white 20% @ position 0
  - white 5% @ position 0.25
  - white 5% @ position 0.75
  - white 20% @ position 1

### Widget 规格
- Widget 圆角：18dp
- Widget 内边距：12dp
- Widget 垂直间距：10dp
- 最多 3 个 widget/卡片
- 卡片最高：308dp

### 三种场景
1. **操作执行类 (action)**：用户触发一个操作，展示执行结果或确认
2. **状态控制类 (control)**：展示当前系统状态，允许快速切换
3. **信息获取类 (info)**：展示查询结果、数据、时间等信息

### Section 标题
- 文本：「最佳答案」
- 字体：TransSans VF Regular 12sp
- 颜色：white 45% 或 gray #545454（取决于壁纸深浅）
- 与卡片间距：6dp
- 卡片间距：20dp

## Widget 类型

### 1. text-single（单行文本）
- 高度：≈46dp
- 内容：单行主文本（最多1行）
- 字段：title

### 2. text-title（主标题+副文本）
- 高度：≈78dp
- 内容：主标题14sp bold + 副文本12sp regular（最多3行）
- 字段：title, subtitle

### 3. text-large（大标题信息卡）
- 高度：≈52dp
- 内容：大数字/文本24sp bold + 小标签12sp
- 字段：value, label
- 用于：温度、步数、时间等一眼即懂的数据

### 4. jump-single（跳转单行）
- 高度：66dp
- 内容：左侧 emoji icon（40×40dp, radius 12dp）+ 单行文本
- 字段：icon, title, action（跳转目标）

### 5. jump-dual（跳转双行）
- 高度：66dp
- 内容：左侧 emoji icon + 主标题 + 副标题
- 字段：icon, title, subtitle, action

### 6. jump-button（跳转+按钮）
- 高度：66dp
- 内容：左侧 emoji icon + 文本 + 右侧 pill 按钮
- 字段：icon, title, action（按钮文字）

### 7. switch（开关控制）
- 高度：≈58dp
- 内容：emoji icon + 文字 + 右侧 toggle 开关
- 字段：icon, title, value（"on"/"off"）

### 8. list（多行列表）
- 高度：≈170dp
- 内容：多行条目，每行 icon + 主标题 + 副文本
- 字段：items（数组，每项含 icon, title, subtitle）

## JSON 输出格式

每次回答必须包含一个 \`\`\`card-layout 代码块：

\`\`\`card-layout
{
  "scene": "info",
  "query": "用户搜索词（可选）",
  "cards": [
    {
      "widgets": [
        {
          "type": "text-large",
          "value": "24°C",
          "label": "上海 · 多云转晴"
        },
        {
          "type": "jump-dual",
          "icon": "🌦️",
          "title": "本周天气预报",
          "subtitle": "周四有小雨，记得带伞",
          "action": "天气"
        }
      ],
      "reason": "大温度数字一眼读取，跳转按钮引导查看详情"
    }
  ]
}
\`\`\`

## 规则

1. **必须输出 card-layout 代码块**：每次回复都必须包含完整的 JSON 布局
2. **Widget 数量**：每张卡片最多 3 个 widget，高度不超过 308dp
3. **场景匹配**：根据用户描述选择 info/action/control 场景
4. **语言**：Widget 内容文字用中文（贴近真实 OS 体验），分析和解释用中文
5. **实用性**：设计要符合真实搜索场景，内容要真实可信
6. **reason 字段**：每张卡片必须附上设计理由

## 先分析场景，再出设计

在 card-layout 块之前，先用1-2句话分析：
- 这是什么搜索场景（info/action/control）
- 哪种 widget 组合最合适，为什么

示例分析：
「查询天气是典型信息获取类场景（info）。用 text-large 展示核心数据（温度），配合 jump-dual 引导查看详细预报，简洁直接。」

Reply in Chinese. Keep card content concise and realistic.`;

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
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2048, system: SYSTEM_PROMPT, messages }),
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
