# 17.0 智慧建议卡片规范

Source: Figma file `17.0智慧建议卡片规范`, node `290:4074`, key `dExByEvVpg4t3Ylirc0CI1`.

This reference explains the reusable rules. For exact coordinates, sizes, text boxes, button geometry, icon placement, and layer order, use `base-pixel-spec.md` and `base-pixel-spec.json` as the source of truth.

## Global Card Rules

- 17.0 only allows four layout patterns: 单文本, 双文本, 三文本, 大字体文本.
- Base card size shown in the spec: 138 x 138 or 138 x 139.
- Outer content padding shown in the spec: 14 px on top, left, right, and bottom.
- Main content width inside the card: 110 px.
- Card corner radius in the Typography source frame examples: 20 px. Layout-board background illustration rectangles may use 24 px only when reproducing that exact source style.
- Decorative illustration or visual motif can be placed opposite the text block, but it must not sit above or cover any text. If it overlaps the text area, it must be treated as a background layer behind text.
- Informational icons that belong to copy must be placed before the header, following the "文字带图标" examples. Do not place standalone status or warning icons in the right corner unless the spec explicitly adds that pattern.
- Text block may be top-left aligned or bottom-left aligned depending on visual balance and icon placement.
- Keep the card readable at small size. Do not introduce extra layout families unless the user explicitly updates the spec.

## Tone Model

Before choosing the visual direction, first classify the PRD card into one of the three high-level perception categories:

- 视觉 × 信息: includes 凸显信息状态 and 凸显场景氛围. Use when the card's main job is to let the user understand status, time, risk, threshold, weather, traffic, power, connectivity, or other information at a glance.
- 弱视觉 × 强按钮: 明确操作引导. Use when the card's main job is to make the user take a clear, valuable operation.
- 强视觉 × 弱按钮/无按钮: 视觉驱动点击. Use when the card is closer to service/function/content recommendation and should create interest without pressure.

Then score it on three axes:

- Visual attraction (VA): how much the card relies on color, illustration, gradient, image, or brand expression.
- Information salience (IS): how strongly the card must foreground a state, number, time, threshold, reason, or risk.
- Action authority (AA): how strongly the card asks the user to take action.

Use the structured rules in `card-spec.model.json` for repeatable classification.

Common tone families:

- 视觉驱动点击: VA3 + IS1 + AA1. Used for low-pressure function/service/content recommendations. The card says "看了感兴趣可以点".
- 凸显信息状态: VA2 + IS3 + AA1. Used for status-first information such as weather, traffic, power recovery, and metrics. The card says "只看不用点".
- 明确操作引导: VA1 + IS2 + AA3. Used for high-value actions such as power saver, pickup details, reminders, or confirmation. The card says "你需要这个功能".
- 凸显场景氛围: VA3 + IS2 + AA1. Used when visual atmosphere itself carries information, such as weather, important dates, travel, or contextual services.

For 凸显信息状态, do not use large-area full-card color fills just because the information is important. Keep the surface white/light, then use semantic color in key text, icon chips, mini charts, progress indicators, small data marks, or partial visual accents.

## Pattern 1: 单文本

Use when the card only needs one primary message.

Rules:
- Text may align left-top or left-bottom.
- Icon or visual motif can be placed on the opposite diagonal.
- Text limit: no more than 4 lines.
- Example content: "How to auto answer phone calls".

Best fit:
- tips
- simple recommendation
- one-sentence action prompt
- compact educational card

Avoid:
- mixing primary and secondary messages
- adding metrics or data labels
- using this pattern when the action needs explanation

## Pattern 2: 双文本

Use when the card needs a title plus supporting copy.

Rules:
- Composition: title + subtext.
- Text group may align left-top or left-bottom.
- Icon or visual motif can be placed opposite the text group.
- Title limit: no more than 2 lines.
- Subtext limit: no more than 2 lines.
- Title and subtext boxes use the actual rendered line count, not always the maximum area. Current source references: one-line title height 23, two-line title height 38; subtext line-height 135%; one-line subtext height 16, two-line subtext height 32. Keep the title-to-subtext gap at 2dp.
- For overflow, double-text title shrinks no smaller than 14dp; subtitle shrinks no smaller than 10dp. Use `...` only after the relevant minimum size still cannot fit.

Best fit:
- greeting plus explanation
- recommendation plus reason
- feature name plus short benefit
- contextual prompt with short supporting detail

## Pattern 3: 三文本

Use when the card needs a header, a prominent label/value, and a small supporting line.

Rules:
- Composition: header + main label/value + secondary subtext.
- Header and large text each stay within 1 line.
- Text group may align left-top or left-bottom.
- Icon or visual motif can be placed opposite the text group.

Best fit:
- account/data/package information
- storage or memory recommendation
- quantified service status
- a card with a clear small header and main value

## Pattern 4: 大字体文本

Use when the card needs a prominent number, data point, or high-salience value.

Rules:
- Composition: title/header + key data.
- Text group may align left-top or left-bottom.
- Icon or visual motif can be placed opposite the text group.
- Header and key data should remain compact and scannable.
- Unit labels may be visually attached to the number when needed, but units are not the same size as the number. Follow the typography board: data uses the large number style, while the unit uses the small unit style (10dp Semibold/90% in the current source examples).
- Unit placement follows the large-number sample: split number and unit into separate text nodes, keep about 2dp horizontal gap from the number's visual right edge, and align the unit to the number's lower optical edge instead of centering it vertically.

Best fit:
- weather temperature
- balance or quota
- countdown or date
- usage/storage/memory number
- flight time or other key schedule data

## Text With Icon

Allowed for:
- 双文本
- 三文本
- 大字体文本

Rules:
- Header may include a leading icon.
- Prefer filled icons.
- Icon size examples in the spec include 12 px and 16 px depending on text scale.
- Keep the icon aligned with the header baseline or optical center.
- Header icons must sit before the header text. They should not float in the card corner or overlap another text level.

## Visual Direction Notes

- 17.0 examples are cleaner and more structured than the 16.1 examples.
- Use stronger hierarchy and fewer decorative fragments.
- Visual assets should support the recommendation meaning, not compete with the text.
- Illustration/icon layers must never cover text. If a visual overlaps the text zone, lower it behind the text as a background and keep opacity/contrast subtle enough that the text remains dominant.
- When using photo or rich imagery backgrounds, ensure readable contrast and keep the information block inside the 14 px padding system.

## Exact Pixel Reference

Use `base-pixel-spec.md` for the locked base spec. Do not replace its values with inferred values from this summary.
