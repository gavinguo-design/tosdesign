---
name: ai-mate-device-card
description: AI Mate 设备卡片设计规范（Device Card Rules）。Use this skill when designing, implementing, or replicating device cards in the AI Mate device management interface — earbuds, glasses, AC, door lock, sensor, camera, smart speaker, bulb, TV, etc. Covers card size tiers, corner radius, header structure (device image / name / status / battery), content areas (data bar / slider / player / video), and abnormal-state styling. 触发词：设备卡片、Device Card、多设备延展、智能家居卡片、设备列表卡片、电视卡片。
---

# AI Mate 设备卡片设计规范（Device Card Rules）

## Overview

定义 AI Mate 设备管理界面的设备卡片设计规范。卡片按功能复杂度分为**小卡片**（328×94）、**大卡片**（328×172）与**扩展大卡片**（更高尺寸），统一遵循「Header 头部信息 + Content 可选内容区 + Actions 操作区」的三段式语义化结构。本 Skill 用于还原 Figma 设计稿「AI Mate 设备卡片规则」与「TEST / 多设备延展」，或从零实现同类设备卡片。

## 卡片分级

| 类型 | 尺寸 | 圆角 | 用途 |
|---|---|---|---|
| 小卡片 | 328 × 94 | 20px | 简单设备（耳机、红外相机、灯泡），仅头部信息 |
| 大卡片 | 328 × 172 | 24px | 常规设备（空调、门锁、传感器），含 1 个内容区 |
| 扩展大卡片 | 328 × 196 / 252 / 268 | 24px | 复杂设备（耳机功能块、摄像头视频、音箱播放器、电视播放中） |
| 控制卡 | 328 × 236 | 20px | 完整控制面板（灯泡：色温 + 亮度滑块） |

- 背景统一 `#FFFFFF`，无默认描边。
- 异常状态卡片使用 `1px #FF0000` 外描边（strokeAlign: OUTSIDE）。
- **同一设备多状态可跨分级**：如电视「播放中」用扩展大卡 328×268，而「待机 / 异常」降级为大卡 328×172（异常仍走红色描边体系）。

## Header 头部结构（所有卡片必含）

按 60px 网格对齐，结构自左至右：

1. **设备图**：60×60 圆形裁剪（Mask group），位于卡片内 x16、y16~20。
2. **名称区**（x ≈ 90 起）：
   - 设备名称：`PingFang SC Medium 14px`，主色 `#000000`。
   - 状态文本：`PingFang SC Regular 14px`，次级色 `#545559`，前缀绿色在线圆点 `#10B981`（6×6）或红色异常圆点 `#EF4444`。
3. **电量**（可选，耳机/眼镜类）：左/右耳 `L`/`R` 标签（TOS 9px，白字黑底圆点）+ 电量图标 + 百分比文本 `Body2/Regular 14px`，色 `#545559`。
4. **箭头**：`arrow_right_bold` 14×14，位于卡片右缘 x≈300，色 `rgba(0,0,0,0.8)`。

## Content 内容区（可选）

内容区位于头部下方（y ≈ 76~96 起），按设备类型呈现：

- **功能块网格**（耳机）：3 等分块（109×120），每块含图标 + 标签（Caption1/Regular 12px），支持选中态（如 Off 用强调紫 `#6459FF`）。
- **数据栏**（传感器/门锁）：灰底 `#F5F6F7` 圆角 12px，内部 3 列等宽（74px），每列 = 数值（`PingFang SC Medium 12px`）+ 标签（`PingFang SC Regular 10px`），列间以 1px 白色分隔线间隔。
- **滑块组**（灯泡控制卡）：色温（暖/冷标签）+ 亮度（1%~100% 标签），滑块用灰度轨道。
- **播放器**（音箱）：歌曲名（Medium 12px）+ 歌手（Regular 10px）+ 进度条（时间戳 `20:12 / 42:53`，轨道 `#D1D1D1`，进度 `#4F4F4F`）+ 控制按钮。
- **视频画面**（摄像头）：图像 + 红色 `LIVE` 角标。
- **电视画面**（电视）：模拟画面 + 红色 `LIVE` 角标 + 底部频道条（频道名红底白字角标 `CCTV-1` + 节目名白字）；下方配播放进度条（含时间戳）与音量指示。

## Actions 操作区

- **开关**：44×44 圆形，底 `#F0F1F2`，图标 `Shut_down` 24px 色 `#48494D`（关闭）/ `Unlock2`、`Lock` 等（状态图标）。
- **按钮**：异常操作用红色填充 `#EF4444`，圆角 16px，白字（如「立即上锁」11px Medium）。
- **温度控制**：数值文本（如 `23 ℃`，粗体数字）+ `Add_fill` 图标。
- 操作区背景若为浅灰 `#F5F6F7` 圆角 12px，则内部元素用主色。

## 状态规范

| 状态 | 表现 |
|---|---|
| 在线 | 绿色圆点 `#10B981` + 次级文本「在线 · xx」 |
| 正常待机 | 无圆点，仅次级状态文本 |
| 异常 | 红色圆点 `#EF4444` + 红色文本「异常 · 原因」；卡片外描边 `#FF0000` 1px；相关数据值变红 `#EF4444`；可配红色操作按钮 |
| 电量低/强调 | 电量图标强调色，文本保持次级色 |

## 字体与色板

- **字体**：PingFang SC（中文）/ TransSans VF（UI 数值）/ TOS_250226（耳机电量标签）/ tos-symbol（图标字体）。
- **色板**：主文本 `#000000`；次级文本 `#545559`、`#48494D`、`#939599`；卡片底 `#FFFFFF`；功能底 `#F5F6F7`；在线 `#10B981`；异常 `#EF4444`；异常描边 `#FF0000`；强调紫 `#6459FF`。
- 详细规格见 `references/card-specs.md`。

## 实现流程（Workflow）

1. 确定卡片类型（小/大/扩展/控制）→ 套用容器规格（宽 328、圆角、白底）。
2. 搭建 Header：设备图 60×60 + 名称 + 状态/电量 + 右箭头。
3. 按设备能力选择 Content 区（数据栏 / 功能块 / 滑块 / 播放器 / 视频）。
4. 添加 Actions（开关 44×44 / 操作按钮 / 温度加减）。
5. 校验状态样式（在线绿点 / 异常红点 + 红描边 + 数据变红）。

## 参考文档

- `references/card-specs.md`：各设备卡片的完整参数明细（节点坐标、间距、文本样式、组件引用，源自 Figma「TEST / 多设备延展」）。
