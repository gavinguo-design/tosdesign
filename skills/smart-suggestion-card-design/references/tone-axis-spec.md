# 三轴分布与卡片调性规格

This file is the source of truth for tone classification. Load it before judging any PRD card tone.

Tone only decides the large visual direction: color strength, information emphasis, illustration atmosphere, and action strength. Tone must not change the hard pixel rules in `base-pixel-spec.md`.

## Three Axes

### VA: Visual Attraction / 视觉吸引力

How much the card relies on visual expression to attract attention:

- color strength
- illustration or image presence
- gradient or atmosphere
- content cover or rich visual asset

### IS: Information Salience / 信息显著性

How strongly the card must foreground information:

- status
- number
- time
- threshold
- risk
- location
- reason
- dynamic value

### AA: Action Authority / 行动权威性

How strongly the card asks the user to act:

- enable
- connect
- authorize
- open
- view details
- navigate
- top up
- turn on a mode
- confirm or execute a task

## Four Tone Families

### 1. 凸显信息状态

- Score: `VA2 / IS3 / AA1`
- Perception: 视觉 × 信息
- User feeling: `只看不用点`
- Use when: status, number, threshold, progress, traffic, power, weather, connectivity, usage, quota, privacy/security state, or other glanceable information is the main value.
- Main visual source: information/status itself.
- Recommended visual: data graphic, progress ring, mini chart, status graph, semantic color in key number or local accent.
- Illustration rule: generally **do not use illustration as main visual**. Illustration may only be a weak background support when it does not compete with the status.
- Icon rule: header/service icon is allowed only when it helps identify the information source; it must follow text-with-icon placement.
- Do not:
  - use an icon without information as the main visual
  - fill the whole card with semantic color just because the state is important
  - let illustration cover the data/status
  - add decorative visual elements that weaken first-glance reading

### 2. 凸显场景氛围

- Score: `VA3 / IS2 / AA1`
- Perception: 视觉 × 信息
- User feeling: visual atmosphere also carries information
- Use when: the card needs contextual atmosphere or emotional value, such as important days, weather, travel, anniversaries, scenes, or meaningful reminders.
- Main visual source: scene atmosphere plus concise information.
- Recommended visual: one clear illustration motif, soft atmosphere, low-saturation gradient, single subject, gentle depth.
- Illustration rule: allowed and often useful, but it must support the scene meaning. Text clarity wins over atmosphere.
- Icon rule: small source/service icon is allowed, but do not let it become a second illustration.
- Do not:
  - stack multiple unrelated illustration motifs
  - use high-saturation or large hue-span gradients that look cheap
  - let illustration overlap foreground text
  - make the card look like a generic decorative poster instead of a suggestion card

### 3. 明确操作引导

- Score: `VA1 / IS2 / AA3`
- Perception: 弱视觉 × 强按钮
- User feeling: `你需要这个功能`
- Use when: the card has a concrete, high-efficiency action the user should take now, such as enable power saver, connect Wi-Fi, authorize, view pickup details, call back, set reminder, top up, or open details.
- Main visual source: action structure and button.
- Recommended visual: clear button, concise reason, weak service/header icon.
- Illustration rule: no strong illustration as main visual. Weak icon or small service identifier is OK.
- Button rule: use short or long button according to action importance and available pattern. Clear operation guidance can use long buttons.
- Do not:
  - let illustration compete with the action button
  - hide the action in a long subtitle
  - add decorative visuals that make the card feel like a visual recommendation instead of an action prompt
  - use a short pill button for every action by default when a long button better supports the task

### 4. 视觉驱动点击

- Score: `VA3 / IS1 / AA1-2`
- Perception: 强视觉 × 弱按钮 / 无按钮
- User feeling: `看了感兴趣可以点`
- Use when: the card is a service, feature, content, app, media, style, or recommendation card where visual interest is the main click driver.
- Main visual source: content asset itself, cover image, service visual, or recommendation object.
- Recommended visual: content image or strong visual asset, with minimal text and low-pressure action.
- Illustration rule: the content itself is already the main visual. Do not add unrelated extra illustration. Weak icon is OK for source recognition.
- Button rule: weak/no button unless the PRD requires clear action.
- Do not:
  - add a second metaphor illustration on top of the content asset
  - make weak source icons become the main visual
  - over-explain with information-heavy text
  - create click pressure through strong buttons unless the PRD has high AA

## Tone Judgment Output Format

Before designing, output this block:

```text
这是哪类：
三轴分数：
为什么：
可以学什么：
不能学什么：
```

## Design Option Rule

If the user asks for multiple options, first determine one tone family, then produce multiple divergent visual solutions within that tone.

Example: important-day reminder can be `凸显场景氛围 / VA3 IS2 AA1`. Generate three scene-atmosphere options, not one information-state, one action-guidance, and one visual-click option.

## Illustration And Icon Decision

Use this quick rule:

- 凸显信息状态: information graphics first; illustration not recommended as main visual.
- 凸显场景氛围: illustration can support atmosphere and meaning.
- 明确操作引导: no strong illustration; weak icon is OK.
- 视觉驱动点击: content asset is main visual; weak icon is OK.

Text must always remain above visuals. If a visual touches the text zone, it must become a low-contrast background layer or use a mask/overlay from the spec.
