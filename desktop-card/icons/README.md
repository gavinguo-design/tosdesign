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

## 现有图标清单（19）
信息 / 偏好 / 充电 / 分享 / 天气：多云 / 天气：晴天 / 天气：雨天 / 存储 / 安全 / 定位 / 快递 / 手表 / 推荐 / 文件 / 步数 / 用户 / 短信 / 通话 / 邮箱
