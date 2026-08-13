# 手机首页布局 · iOS Home Screen Prototype

iOS 风格可交互主屏原型（单文件 HTML），包含完整桌面元素移动规则：

- **1×1 严格左→右、上→下排序，前面不允许有空格**
- **相邻 1×1 直接互换位置**（上下左右，曼哈顿距离 1）
- **大→小 / 小→大 / 同尺寸互换**（按面积 / 方向让位）
- **拖向空白实时补位**，基于拖动元素位置实时变更整体布局
- **跨页拖动**（边缘翻页 + 原页 1×1 自动补位）
- **多选拖动**（长按 / 按钮进入；leader 规则；rest 紧密排列；放不下的放回原页）
- **原子落位**（克隆模拟 → 失败零副作用）
- **滞回取格**（边界防抖 + 快速跟手）+ RAF 节流
- **实时规则面板 + 操作日志**

## 快速试用

```bash
open assets/ios-home-screen.html   # 直接在浏览器打开
```

或直接双击 `assets/ios-home-screen.html`。

## 文件

| 文件 | 说明 |
|---|---|
| `assets/ios-home-screen.html` | 单文件可交互原型（含全部规则与视觉） |
| `README.md` | 本说明 |

## Skill 元数据

本仓库内容同步自 WorkBuddy skill `ios-home-screen-prototype`。如需作为 skill 使用，将 `assets/ios-home-screen.html` 复制到目标目录，并通过 `present_files` 预览。