# 交付前检查清单

## Pattern Fit

- The design uses only one of the four allowed layouts.
- The chosen pattern matches the product intent.
- No extra text level was added without a clear reason.
- The PRD's "卡片内容" guidance was reduced into core fact, dynamic value, context, and action before designing.
- Any high-efficiency user behavior in the PRD is represented as a button when appropriate, rather than hidden in long subtitle copy.

## Layout

- `base-pixel-spec.md` was loaded before design/review.
- Card size follows the 138 x 138 / 138 x 139 reference unless the user updates the spec.
- Content respects 14 px outer padding.
- Text stays within the 110 px content width.
- Text and foreground visual elements do not overlap.
- Illustration or decorative motif is placed opposite the text block when used; if it touches the text zone, it is layered behind text as a background.

## Text

- 单文本: no more than 4 lines.
- 双文本: title no more than 2 lines, subtext no more than 2 lines.
- 三文本: header and large text each no more than 1 line.
- 大字体文本: key value is the primary visual focus.
- 大字体文本: units are separated from the number and use the small unit style, not the large number style.
- Dynamic text has truncation or fallback rules.
- Text size, weight, opacity, and number of text levels match the selected layout.
- Card text boxes use vertical alignment Middle with fixed text box heights from the typography spec.
- Line height is AUTO except 双文本副文本, which uses 135%.
- 双文本标题 uses the two-line title box (`h=38`) before any font shrinking or `...`.
- If 双文本标题 shrinks to the minimum 14dp state, it uses the source minimum text box height `h=33`, and subtitle starts at `y=49`.
- 双文本标题 wraps naturally to the line end; no manual early line break is inserted to avoid overflow.
- 双文本标题最小字号 is 14; 双文本副文本最小字号 is 10.
- 双文本副文本 uses the updated 135% line-height text area: 16 for one line, 32 for two lines.
- No extra helper text, timestamp, badge, caption, or invented microcopy is added outside the selected layout's allowed structure.
- Header icons are used only where the spec allows text-with-icon; do not invent punctuation-like warning icons.
- Long PRD copy is semantically shortened first; minimum font-size fallback is used only after compression.
- `...` appears only after the text has been shrunk to the pattern's minimum font size and still does not fit.

## Visual

- Visual style supports the recommendation.
- Filled icons are preferred when a header icon is used.
- Header icons sit before the header text and follow the "文字带图标" pattern; no floating icon may cover text.
- Background contrast is sufficient for text readability.
- Decorative details do not weaken small-size readability.

## Interaction And Data

- Trigger condition is clear.
- Primary user action, if any, is clear and button-like.
- Tap behavior is clear.
- Data source is named or marked as TBD.
- Missing, loading, error, and unavailable states are defined or explicitly marked as not applicable.

## Handoff

- Developer-facing document includes layout, content, data, interaction, and states.
- Any unresolved assumptions are called out clearly.
- Final output links back to the Figma source/spec when relevant.
