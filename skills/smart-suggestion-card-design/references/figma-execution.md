# Figma 绘制与版本规则

Use this file when the user asks to draw, update, or refine cards in Figma.

## Versioning

- Never overwrite historical boards by default.
- Create one new board per iteration.
- Place new boards to the right of existing boards or in a clean open area.
- Use clear version names.
- If the user says to edit the selected/current board, update only that board.

## Board Contents

For first draft boards, include:

- card design
- tone classification
- axis score
- why the tone was selected
- option labels if multiple options are created
- concise notes only

For final delivery boards, include:

- final card
- redline/spec annotation
- interaction notes
- data/state notes
- developer handoff reference

## Drawing Constraints

- Use only the four 17.0 patterns.
- Use exact coordinates from `base-pixel-spec.md`.
- All text vertical alignment is Middle.
- 双文本 subtitle line height is 135%.
- White text opacity has only the allowed neutral roles; do not invent opacity levels.
- Number and unit must be separate nodes in 大字体文本.
- Unit uses small unit style and lower optical alignment.
- Header icons sit before header text.
- No floating warning/status icon unless the spec has that pattern.
- Do not add timestamps, badges, micro captions, or helper copy outside the selected pattern.

## Visual Asset Rules

- Text is above visuals.
- Foreground illustration/icon never covers text.
- If an illustration touches the text zone, place it behind text with reduced contrast or a spec-compliant mask/overlay.
- 凸显信息状态: data/status graphic is the main visual; illustration is not recommended as main visual.
- 凸显场景氛围: illustration can support scene atmosphere.
- 明确操作引导: weak icon is OK; strong illustration should not compete with action.
- 视觉驱动点击: content asset is main visual; weak icon is OK.

## Verification

Before final answer:

- Check no text overlaps visual elements.
- Check no text is clipped.
- Check no content exceeds card bounds.
- Check line height and gap values.
- Check large-number unit spacing.
- Check button geometry.
- Check that history was preserved.
