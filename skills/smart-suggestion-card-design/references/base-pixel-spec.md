# 基础像素规格（硬规格）

Source: Figma `17.0智慧建议卡片规范`, page/node `290:4074`, file key `dExByEvVpg4t3Ylirc0CI1`.

This file is the fixed base layer. When designing from a PRD, do not reinterpret these values. The PRD only changes content, layout choice, and visual tone. Typography, spacing, alignment, icon placement, button geometry, and layer order must follow this file pixel by pixel.

## Source Boards

- Layout: `580:4843`
- Typography: `582:1171`
- Color: `305:4576`, `534:4911`, `538:2523`, `538:3865`
- Overlay: `305:5783`
- Action/buttons: `540:4507`
- Bleed/crop: `540:4545`
- Tone model: `511:2355`, `511:2632`, `511:2753`

If this file and an older summary conflict, this file wins. For text metrics, the Typography board wins.

## Global Card Frame

- Card size: `138 x 138` or `138 x 139`, matching the source example being used.
- Content origin: `x=14`, `y=14`.
- Content width: `110`.
- Right/bottom padding reference: `14`.
- Source frame radius: `20` in the Typography examples.
- Layout illustration background rectangle radius: `24`; use only when reproducing that exact layout-board background style.
- Default surface: white/light surface. Do not create a new surface style unless the tone model requires it.
- Text is always above decorative visuals.
- Decorative illustration may overlap the text zone only as a background layer under text.
- Header icon may only appear before Header text, following the text-with-icon positions below.

## Text Rules Shared By All Patterns

- `textAlignVertical`: `CENTER`.
- `lineHeight`: `AUTO`, except 双文本 subtitle, which uses `135%`.
- Use fixed text boxes from the source node geometry; do not let text boxes freely grow unless the source node uses `WIDTH_AND_HEIGHT` for that exact tiny label.
- Primary text fill: black at `90%` opacity.
- Secondary/supporting text fill: black at `60%` opacity.
- Avoid extra timestamps, badges, warning marks, captions, or helper copy unless the selected pattern already has that text level.
- PRD copy must be semantically compressed before font shrinking. Keep the core fact, dynamic value, and action; remove explanatory clauses.

## Overflow And Minimum Font Rules

Use these only after compressing the PRD copy. Ellipsis (`...`) is allowed only as the final fallback.

Overflow sequence:

1. Compress PRD copy semantically while preserving the core fact/dynamic value/action.
2. Place the copy in the source text box for the chosen pattern.
3. If it exceeds the allowed area, shrink the overflowing text in the same box.
4. Stop shrinking at the minimum font size for that pattern.
5. Only if it still does not fit at the minimum size, use ellipsis/truncation (`...`).

Minimum font sizes from the source Typography board:

- 单文本: text exceeds max area -> shrink first; minimum font size `14`. If still not enough, then `...`.
- 双文本: title/subtitle exceeds max area -> shrink first. Title minimum font size is `14`; subtitle minimum font size is `10`. If still not enough, then `...`.
- 三文本: Header/subtext should stay within one line -> shrink first; minimum font size `10`. If still not enough, then `...`.
- 大字体文本: Header/subtext should stay within fixed boxes -> shrink first; minimum font size `10`. Keep data as the visual hero; do not turn long explanatory copy into data.
- Do not use `...` just because text is long. If a smaller allowed font size solves it, use the smaller size instead.

## PRD Content And Action Extraction

- Read the PRD's "卡片内容" guidance as the primary source for what the card says.
- Extract four fields before designing: core fact, dynamic value, reason/context, user action.
- If the PRD asks the user to enable, disable, authorize, connect, open, view details, navigate, top up, or turn on a mode, consider it a user action.
- High-efficiency actions should become a button when the card pattern allows an action. Do not hide the action inside a long subtitle.
- Button copy must be short and command-like, such as `Turn on`, `Enable`, `Connect`, `Details`, or the equivalent concise localized wording.

## Pattern 1: 单文本

Source examples: `580:4937`, `580:4951`, `587:3570`.

- Max text area:
  - text: `x=14`, `y=14`, `w=110`, `h=76`
  - font: `TransSans VF / SemiBold / 16`
  - opacity: `90%`
  - max lines: `4`
  - resize: `TRUNCATE`
- Single-line top:
  - text: `x=14`, `y=14`, `w=110`, `h=19`
  - font: `TransSans VF / SemiBold / 16`
- Single-line bottom:
  - text: `x=14`, `y=105`, `w=110`, `h=19`
  - font: `TransSans VF / SemiBold / 16`
- Opposite visual motif:
  - common placeholder: `x=88`, `y=88`, `w=36`, `h=36`, radius `10`
  - bottom-text variant motif can move to `x=88`, `y=14`, `w=36`, `h=36`

## Pattern 2: 双文本

Source examples: `586:2395`, `586:2411`, Typography board double-text group.

- Top-aligned title:
  - title: `x=14`, `y=14`, `w=110`, `h=23` for one rendered line
  - title two-line height: `38`
  - title minimum-font state: when shrinking to `14dp`, use `x=14`, `y=14`, `w=110`, `h=33`
  - font: `TransSans VF / SemiBold / 16`
  - opacity: `90%`
  - resize: `TRUNCATE`
  - If the title does not fit in the one-line title box, use the two-line title box (`h=38`) before shrinking font size or using `...`.
  - Do not insert manual line breaks just to avoid overflow. Let the title wrap naturally to the end of each allowed line; `...` may appear only at the end of the final allowed line after the minimum-font rule is exhausted.
- Top-aligned subtitle:
  - subtitle `x=14`
  - subtitle `y = title.y + renderedTitleHeight + 2`
  - subtitle default line height: `135%`
  - subtitle one-line height: `16`
  - subtitle two-line height: `32`
  - if title is in the `14dp / h=33` minimum-font state, subtitle starts at `y=49`
  - font: `TransSans VF / Medium / 12`
  - opacity: `60%`
  - resize: `TRUNCATE`
- Bottom-aligned variant:
  - title one-line: `x=14`, `y=71`, `h=23`
  - subtitle two-line source: `x=14`, `y=93`, `w=113`, `h=31`, `lineHeight=135%`
- Use actual rendered line count. A one-line subtitle uses the 135% one-line area, not the two-line max area.
- Keep title-to-subtitle gap exactly `2`.

## Pattern 3: 三文本

Source examples: `580:6542`, `580:6565`, `580:6671`.

- Top-aligned:
  - Header: `x=14`, `y=14`, `h=14`, font `TransSans VF / Medium / 12`, opacity `90%`
  - Label: `x=14`, `y=30`, `h=24`, font `TransSans / SemiBold / 20`, opacity `90%`
  - Subtext: `x=14`, `y=56`, `h=12`, font `TransSans VF / Medium / 10`, opacity `60%`
- Bottom-aligned:
  - Header: `x=14`, `y=70`, `h=14`
  - Label: `x=14`, `y=86`, `h=24`
  - Subtext: `x=14`, `y=112`, `h=12`
- Header and Label stay within one line.

## Pattern 4: 大字体文本

Source examples: `580:6585`, `580:6619`, `580:6635`, `580:6705`.

- Top-aligned:
  - Header: `x=14`, `y=14`, `h=14`, font `TransSans VF / Medium / 12`, opacity `90%`
  - Data: `x=14`, `y=28`, `w=110`, `h=48`, font `TransSans / Medium / 40`, opacity `90%`
  - Subtext line 1: `x=14`, `y=98`, `h=12`, font `TransSans VF / Medium / 10`, opacity `60%`
  - Subtext line 2: `x=14`, `y=112`, `h=12`, font `TransSans VF / Medium / 10`, opacity `60%`
- Bottom-aligned:
  - Data: `x=14`, `y=62`, `h=48`
  - Header: `x=14`, `y=110`, `h=14`
- Number + unit sample:
  - number example: `x=14`, `y=28`, `h=48`, font size `40`
  - unit example: `x = number visual right + 2`, `y=55`, `h=14`, font `TransSans VF / SemiBold / 12`, opacity `90%`
  - The board annotation describes the unit as `10dp Semibold`; reproduce the source visual by using the separate unit node and lower optical alignment. Do not combine unit and number into one large text node.

## Text With Icon

Allowed only for 双文本, 三文本, 大字体文本.

- 16-size Header with icon:
  - icon area begins at `x=14`, `y=14`
  - Header text begins at `x=34`, `y=14`, `h=19`
  - visual gap between icon and Header text: `4`
- 12-size Header with icon:
  - icon area begins at `x=14`, `y=14`
  - Header text begins at `x=30`, `y=14`, `h=14`
  - visual gap between icon and Header text: `4`
- Prefer filled icons.
- Header icons sit before Header text. They do not float in corners and do not cover other text.

## Action/Button Specs

Source board: `540:4507`.

- Short button:
  - frame: `w=74`, `h=30`, radius `999`
  - common position in card: `x=14`, `y=94` or `y=95`
  - light-card fill: black at `8%`
  - dark-card fill: white at `15%`
  - text: `y=8`, `h=14`, font `TransSans VF / SemiBold / 12`
- Long button:
  - frame/vector: `w=110`, `h=30`, radius `1011`
  - common position in card: `x=14`, `y=94`
  - fill: black at `8%` on light cards
  - text group: `y=8`, `h=14`
- Button icon:
  - icon size: `14 x 14` for button icons
  - icon and text share the same visual center line.
  - Examples: icon `x=8`, text `x=26`; icon `x=12`, text `x=29`.

## Color Rules

- When AI Suggestions strongly associate with an app, prioritize the app theme color.
- Source theme examples:
  - dynamic/system blue: `#0079FE`
  - dynamic/system green: `#01CB65`
  - yellow: `#FFAF00`
  - orange: `#FF7A01`
  - red: `#FF3430`
- Warning red should be used cautiously to avoid excessive anxiety.
- Neutral text tokens:
  - black primary: `90%`
  - black secondary: `60%`
  - black tertiary/disabled: use only when source pattern requires it
  - white equivalents are used on dark surfaces with the same role logic.
- For 凸显信息状态, do not fill the whole card with semantic color by default. Use semantic color in key number, small icon, progress, chart, or local accent.

## Layer Order

Within a card, use this order:

1. Surface/background
2. Background illustration or decorative motif
3. Data visualization, progress, or chart that does not cover text
4. Text and header icon
5. Border/edge treatment if used

Foreground illustration/icon must never cover text. If an illustration touches the text zone, lower it behind text and reduce contrast.
