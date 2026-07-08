# PRD 到 Figma 智慧建议卡片工作流

This file merges PRD reading, tone classification, Figma drawing, iteration, and delivery.

## 0. Load Required Specs

Always load:

- `base-pixel-spec.md`
- `tone-axis-spec.md`

When drawing in Figma or checking exact coordinates, also load:

- `base-pixel-spec.json`
- `card-spec.model.json`

## 1. Read Product Intent

Extract:

- user scenario
- trigger condition
- display timing
- recommendation purpose
- card content guidance
- required dynamic fields
- user action
- tap behavior
- edge states

Compress PRD copy before designing. Preserve meaning, not sentence length.

## 2. Extract Card Content

Create this internal structure:

- core fact: the one thing the user must understand
- dynamic value: time, amount, threshold, location, status, countdown, quota
- reason/context: why this is shown now
- action: user behavior required or recommended by the PRD

If action exists, decide whether it needs a button. Do not bury high-efficiency actions inside long subtitle copy.

## 3. Judge Tone

Use `tone-axis-spec.md` and output:

- 这是哪类
- 三轴分数
- 为什么
- 可以学什么
- 不能学什么

Tone decides visual direction only. It never changes base pixel rules.

## 4. Select Layout Pattern

Allowed patterns:

- 单文本
- 双文本
- 三文本
- 大字体文本

Choose the simplest pattern that supports the intent. Use 大字体文本 only when a number/date/amount/countdown is genuinely the hero.

## 5. Draft Copy

Rules:

- Keep card copy short and useful.
- Avoid one-word subtitle unless the spec/source pattern really supports it.
- Title and subtitle should be content-appropriate: not too long, not empty, not decorative.
- For overflow: compress first, then shrink to minimum font size, then use `...` only if it still does not fit.
- Ellipsis must appear only at the end of the allowed final line.

## 6. Draw In Figma

When the user asks to draw:

1. Use the target Figma file/page the user specifies.
2. Create a new version board unless explicitly editing a selected board.
3. Do not cover or delete history.
4. Use editable text and shapes.
5. Use source geometry from `base-pixel-spec.md`.
6. Name nodes clearly enough for later iteration.
7. Keep visuals below text.
8. Verify after drawing.

Recommended board naming:

```text
V{number} {card name} 17.0 / {iteration note}
```

For exploratory design, include the tone analysis on the board or near the board when helpful.

## 7. Iterate

When user feedback is about hard specs, fix exactly:

- 14 px padding
- text box positions and heights
- vertical alignment Middle
- line height
- title/subtitle gap
- font size and minimum font rules
- large-number unit size and optical alignment
- button dimensions
- icon placement
- layer order

When feedback is about tone, revisit `tone-axis-spec.md`.

When feedback is about product meaning, reread PRD card content and update hierarchy/copy first.

## 8. Handoff

After approval, deliver:

- final card design
- specs and annotations
- interaction behavior
- data rules
- states
- developer handoff

Use `handoff-template.md` and `checklist.md`.
