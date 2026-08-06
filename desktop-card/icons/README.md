# headerIcon 图标库

来源：Figma 节点 `25:1026`（headerIcon 图标库画板），文件 key `01lBr811lgrEAdKkYeGEYr`

## 状态
- 2026-07-17：Figma API 因持续 429 限流未能拉取 `47-3994` / `1-3018` 节点数据（已按 90s / 3min / 5min 间隔重试 8+ 次仍失败），本次未新增/更新 SVG 图标文件。
- 已按任务模板给出的规范落地「圆角矩形底板 + 白色 SVG」样式，Figma 限流解除后如尺寸/颜色有出入可微调 `applyHeaderIcon` 内联样式即可，无需改结构。

## 当前 headerIcon 视觉规范
| 属性 | 值 |
|------|---|
| 容器宽高 | 16 × 16 px |
| 圆角半径 | 4 px |
| 底板色（默认） | `#000` |
| 内部 SVG 尺寸 | 10 × 10 px |
| SVG 着色 | `filter: brightness(0) invert(1)` → 强制白色 |
| 布局 | `inline-flex` 居中，`vertical-align: middle` |

## 待补充：底板色变体（Figma 1-3018）
Figma API 限流未能拉取到具体色板。后续若需支持多色底板（如天气蓝、健身红等语义色），可扩展 headerIcon 值为对象格式：
```json
"headerIcon": { "src": "icons/天气：晴天.svg", "bg": "#3B82F6" }
```
并在 `applyHeaderIcon` 里读 `value.bg` 覆盖 wrapper.style.background。

## 使用规范
- 文件名使用 kebab-case 或中文命名（当前 19 个图标为中文），如 `weather.svg`、`天气：晴天.svg`
- 卡片 JSON 中通过 `"headerIcon": "icons/文件名.svg"` 引用（区别于 emoji 字符串写法）
- 仅在 triple/big/dual 布局、且有明确场景（天气/音乐/路况/健身等）时使用图标文件

## 现有图标清单（20）
信息 / 偏好 / 充电 / 分享 / 天气：多云 / 天气：晴天 / 天气：雨天 / 存储 / 安全 / 定位 / 快递 / 手表 / 推荐 / 文件 / 步数 / 用户 / 短信 / 通话 / 邮箱 / 音乐

## 行程卡专用图标（4，2026-08-06 新稿 v2）
来源：Figma 文件 `MMdPCkHpgkZy2cKwSjyrVf` 节点 `1:102`（航班&火车&快递规格画布，2026-08-06 更新稿），`/v1/images` 官方导出，原始 path 未动。
与 headerIcon 不同：这四枚是行程卡（layout:'itinerary'）的内容图标，自带配色，不走 `filter:brightness(0) invert(1)` 反白，
由 `buildItineraryCardInner` 通过 `ITIN_ICONS` 常量表引用，不供 `headerIcon` 字段使用。

| 文件 | Figma 节点 | 规格 | 用途 |
|------|-----------|------|------|
| `行程：航班方向.svg` | 3:275 | 16×16，黑圆底(黑0.9)+白飞机剪影 | 竖排卡两地之间方向徽章（航班；按 Figma 3:108 以 14×14 摆放） |
| `行程：火车方向.svg` | 3:308 | 16×16，黑胶囊底(r999)+白车头 | 竖排卡两地之间方向徽章（火车） |
| `行程：航班行程条.svg` | 3:22 | 15×8，纯黑飞机剪影 | 大字凸显态底部信息条，时间对开中缝 |
| `行程：火车行程条.svg` | 3:242 | 14×6，黑0.9火车剪影 | 大字凸显态底部信息条，站名行中缝 |

⚠️ 旧稿的 `行程：金色飞机徽章.png`（1:108）已随 2026-08-06 新稿废弃删除（新稿所有卡片该图层 visible=false，
右下角 36×36 #E5E5E5 底板也一并移除）。

## 修复记录
- 2026-07-20：补充缺失的 `音乐.svg`（双八分音符图案）。此前 `chat.js` system prompt 里已写死 `icons/音乐.svg` 作为音乐场景推荐图标，但文件从未创建，导致左上角 headerIcon `<img>` 标签 404，浏览器显示破损图片占位符。风格参照现有图标（24×24 viewBox，纯路径 fill=black，供 `filter:brightness(0) invert(1)` 反白）。
