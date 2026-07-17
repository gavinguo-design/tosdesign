# headerIcon 图标库

来源：Figma 节点 `25:1026`（headerIcon 图标库画板），文件 key `01lBr811lgrEAdKkYeGEYr`

## 状态
2026-07-17：Figma API 因持续 429 限流未能拉取本批图标（已按 90s 间隔重试 6+ 次仍失败）。
本目录及 chat.js / index.html 的图标接入代码已就绪，待 Figma 限流解除后补充实际 SVG 文件即可直接生效，无需再改代码。

## 使用规范
- 文件名使用 kebab-case，如 `weather.svg`、`music-note.svg`
- 卡片 JSON 中通过 `"headerIcon": "icons/文件名.svg"` 引用（区别于 emoji 字符串写法）
- 仅在 triple/big/dual 布局、且有明确场景（天气/音乐/路况/健身等）时使用图标文件
