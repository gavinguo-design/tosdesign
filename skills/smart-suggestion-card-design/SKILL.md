---
name: smart-suggestion-card-design
description: Use this skill when designing, reviewing, refining, or handing off 17.0 智慧建议卡片 / AI suggestion cards from a PRD, feature idea, product requirement, Figma spec, or existing example. It combines the card hard-spec, PRD reading and tone classification, Figma editable draft generation, iteration, and developer handoff into one reusable workflow.
---

# 智慧建议卡片设计统一 Skill

Use this skill whenever the user asks for 智慧建议卡片 / AI Suggestions card design, PRD-to-card first drafts, Figma card drawing, card spec review, visual-tone judgment, iteration, annotation, or developer handoff.

This is one unified skill with three capability modules:

1. **规范 Skill**: strict 17.0 card hard-spec, typography, spacing, colors, buttons, icon placement, and layer order.
2. **PRD 读取 Skill**: extracts product intent, card content, user action, states, and classifies tone by the three-axis model.
3. **Figma 绘制 Skill**: creates editable first drafts in Figma, preserves historical versions, and prepares final annotated handoff.

## Must-Load References

Before any design, review, or Figma drawing, load these two files first:

- `references/base-pixel-spec.md`: fixed, pixel-level hard specification. This wins over memory, summaries, and visual guesses.
- `references/tone-axis-spec.md`: three-axis tone model, four tone families, and illustration/icon usage rules.

When writing Figma code or checking exact numbers, also load:

- `references/base-pixel-spec.json`
- `references/card-spec.model.json`

## Core Workflow

### 1. Read PRD

Extract these fields before designing:

- user scenario
- trigger timing
- recommendation intent
- required card content
- dynamic values
- primary action and fallback action
- edge cases and unavailable states

Read the PRD's **卡片内容** guidance as the primary source of meaning. Do not copy long PRD text directly into the card. Compress it into:

- core fact
- dynamic value
- reason/context
- user action

If the PRD asks the user to enable, disable, authorize, connect, open, view details, navigate, top up, or turn on a mode, treat it as an action. When the selected pattern supports an action, use a concise button instead of burying the behavior in long subtitle text.

### 2. Classify Tone First

Before layout or visual exploration, output:

- `这是哪类`: 凸显信息状态 / 凸显场景氛围 / 明确操作引导 / 视觉驱动点击
- `三轴分数`: VA? / IS? / AA?
- `为什么`: short reason tied to the PRD
- `可以学什么`: reusable visual or structural cues
- `不能学什么`: forbidden or misleading treatments

Tone decides the large visual direction only. It never changes the hard pixel spec.

If exploring multiple options, determine **one** tone first, then produce 3 divergent options inside that tone. Do not generate 3 unrelated tones for one PRD.

### 3. Choose One 17.0 Layout Pattern

Use only the four supported patterns:

- 单文本
- 双文本
- 三文本
- 大字体文本

Choose the simplest pattern that carries the product intent. Do not add extra text levels, timestamps, badges, helper captions, warning marks, or floating icons unless the base spec explicitly allows that structure.

### 4. Design First Draft

For early design output, provide:

- selected tone and score
- selected pattern and reason
- compressed card copy
- information hierarchy
- visual direction
- default state
- important variants
- assumptions and questions

For Figma output, create editable nodes. Do not rasterize text. If the user asks to draw in an existing Figma file/page, create a new version board instead of overwriting historical boards.

### 5. Iterate

When the user gives feedback, identify whether the feedback changes:

- product intent
- information hierarchy
- tone classification
- hard pixel implementation
- visual asset direction
- Figma versioning

Apply hard-spec corrections exactly. Layout, typography, line height, opacity, button geometry, unit placement, and 14 px padding are not creative variables.

### 6. Final Handoff

After approval, produce:

- final layout spec
- visual annotations
- interaction behavior
- data rules
- empty/loading/error/unavailable states
- developer handoff document

Use `references/handoff-template.md` and run `references/checklist.md` before final delivery.

## Figma Rules

When drawing or updating Figma:

- Load the Figma use guidance before calling Figma write tools.
- Always target the user-specified file/page.
- Preserve history: create a new version board for each iteration unless the user explicitly asks to edit a selected board.
- Name boards clearly, e.g. `V21 重要日提醒 17.0 / PRD初稿`.
- Place new boards to the right of existing boards or in a clean empty area.
- Keep all text editable.
- Use fixed text boxes, middle vertical alignment, source line heights, and source opacity values from `base-pixel-spec.md`.
- Use one of the four templates. Do not invent a freeform card layout.
- After creating or editing, verify structure and screenshot when possible.

## Reference Map

- `references/base-pixel-spec.md`: hard pixel spec; always load first.
- `references/tone-axis-spec.md`: three-axis tone model; always load before tone judgment.
- `references/card-examples-figma.md`: **21 real shipped card examples** from Figma node `18:962` (file `01lBr811lgrEAdKkYeGEYr`). Load when classifying tone, choosing patterns, or verifying visual direction against real cases. Contains per-card tone scores, layout patterns, visual rules, and copy patterns.
- `references/prd-to-figma-workflow.md`: full PRD reading, design, Figma, iteration, and handoff workflow.
- `references/card-spec.md`: readable 17.0 card rules summary.
- `references/card-spec.model.json`: structured model for repeatable classification and drawing.
- `references/base-pixel-spec.json`: machine-readable hard pixel values.
- `references/figma-execution.md`: Figma versioning and drawing rules.
- `references/checklist.md`: pre-delivery QA.
- `references/handoff-template.md`: developer handoff template.

## Source Of Truth

Initial source: Figma `17.0智慧建议卡片规范`, node `290:4074`, file key `dExByEvVpg4t3Ylirc0CI1`.
Card example library: Figma node `18:962`, file key `01lBr811lgrEAdKkYeGEYr` (added 2026-07-08).

If the Figma spec or user-edited AI-reading pages change, update the reference files instead of adding ad-hoc rules to chat memory.
