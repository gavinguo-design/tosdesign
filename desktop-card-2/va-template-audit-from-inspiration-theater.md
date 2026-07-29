# Inspiration Theater: formal VA background narrative-template audit

**Scope and decision.** This is an owner-review audit only; it creates no backgrounds. The sole source of truth is the 28-item `GALLERY_ITEMS` registry in `desktop-card/index.html:6163-6193`, rendered from `desktop-card/gallery/` by `desktop-card/index.html:6503-6518`. The gallery calls itself "灵感剧场 / 最佳案例" in `desktop-card/index.html:3456-3463`. Evidence images are the four contact sheets in `desktop-card/.validation/theater-va-audit/` listed at the end of this document.

**Important constraint.** The theater is a reference gallery, not a formal template system: selecting an item only prefills "参考「…」的风格设计一张桌面卡片" (`desktop-card/index.html:6520-6526`). Therefore, “formal reusable” below means *visually repeatable and appropriate to nominate as a proposed VA narrative family*, not that an existing implementation exports a formal template.

## Evidence inventory and card-level audit

Legend: **F** = Focus (single prominent subject/value), **S** = Status (current condition/summary), **P** = Step (one next action). `Yes` means it is evidence for a reusable formal family; `No` means it is an isolated/mismatched treatment. All safe-zone directions are as visibly represented in the supplied source image.

| ID / theater asset | Narrative subject / relationship | Composition and text / button safe zone | Lighting, material, depth | Semantic role | Formal reusable? |
|---|---|---|---|---|---|
| T01 `年度报告.png` | A person receives an annual-summary readiness notice. | Portrait at upper-left; three-line copy left-middle; date lower-left; broad quiet right half. | Warm off-white with mint/peach wash; flat, soft, paper-like. | S | Yes — `S-L1-SoftSummary` |
| T02 `早安.png` | Morning briefing and current day/weather. | Large title upper-left; briefing line middle-left; day/weather footer; no CTA; central/right subject-free enough for copy only in dark values. | Black smoky gloss with diagonal light shafts and spectral flare; strong translucent/glass depth. | S | Yes — `S-L4-AtmosphericBrief` |
| T03 `智能路况.png` | Rain conditions affect fares/balance. | Icon + heading upper-left; advisory in upper/mid-left; weather and temperature lower-left; storm occupies right/bottom. | Blue-gray storm photo, fog, rain streaks, wet-cloud depth. | S | Yes — `S-L4-AtmosphericBrief` |
| T04 `未接来电.png` | Emma has a missed call, with return-call/message choices. | Centered portrait/name/status; two symmetric circular action affordances at bottom corners. | Near-white surface, pale blue halos; flat UI with subtle inset/raised circles. | P | Yes — `P-L1-PersonAction` |
| T05 `未接来电-1.png` | Alex declined a call, with the same recovery choices. | Same centered portrait/status and paired bottom actions as T04. | Same clean, pale-blue, soft-raised utility surface. | P | Yes — duplicate instance of `P-L1-PersonAction` |
| T06 `热点管理.png` | Hotspot is on; show consumption and connection count. | Heading/value stack at upper-left; small connection count lower-left; large signal glyph lower-right, preserving the data stack. | White-to-powder-blue gradient with a translucent, glowing/raised circular control. | S | Yes — `S-L2-DataControl` |
| T07 `物流提醒.png` | A delivery has a pickup code and should be opened. | Icon/title/code stacked left; pickup label below; wide CTA across lower third. | Very pale blue-white, flat card; one soft gray pill creates control depth. | P | Yes — `P-L1-CodeCTA` |
| T08 `节日倒数日.png` | Lunar New Year greeting and year marker. | Chinese greeting upper-left; sculptural zodiac and “26” occupy center/bottom; small year lower-left. No CTA safe zone. | Saturated red patterned backdrop; glossy orange 3D mascot/numerals with highlights. | F | Conditional — `F-L5-FestivalSculpture`; not a general utility background. |
| T09 `闹钟延迟.png` | It is late; user can delay the 8:00 alarm. | Message upper-left; single large pill CTA lower-left; open star-field center/right. | Dark navy-to-violet night gradient with scattered star points; low-depth soft glow. | P | Yes — `P-L3-SingleDecision` |
| T10 `音乐推荐.png` | “Red” by Taylor Swift is recommended/played. | Track/artist upper-left; album disc/cover lower-left/center; circular play action lower-right. | Berry monochrome field; opaque disc and album art create layered collage depth. | F | Yes — `F-L3-MediaObject` |
| T11 `20.png` | Tom’s birthday is in three days; generate a plan. | Greeting upper-left; oversized numeral left-center; CTA bottom-left; cake is background/right-side supporting subject. | Peach/orange gradient, soft bokeh/confetti, translucent blurred cake. | P | Yes — `P-L3-CountdownPlan` |
| T12 `21.png` | Wedding anniversary is in three days; generate a video. | Same left-led count/CTA construction as T11; “love” script fills lower-right as secondary subject. | Coral-red gradient; soft glow/bokeh and semi-transparent typographic layer. | P | Yes — `P-L3-CountdownPlan` |
| T13 `Group 2117132607.png` | Thailand / Grand Palace destination prompt. | Building fills image; dark bottom gradient reserves two lines at lower-left. | Bright travel photography, warm architectural contrast; flat photo with gradient readability veil. | F | Yes — `F-L3-TravelPlace` |
| T14 `Group 2134130822.png` | Sports Time / Aug 2026 Report. | Athlete is cropped upper/right; title/date lower-left across a quiet mint field. | Cutout athlete over matte mint; modest shadow/graphic layering. | F | Conditional — `F-L3-EditorialCutout`, evidence is one-off but repeatable. |
| T15 `玩机技巧｜纯净通话.png` | Ride-hailing suggestion. | Icon/title and prompt upper-left; car occupies lower-right/center; white header remains readable. | Hard graphic split: white top, black/blue lower panel; car photo cutout, modest spatial layering. | P | Yes — `P-L2-UtilityIllustrated` |
| T16 `玩机技巧｜纯净通话-1.png` | Food-delivery suggestion. | Same upper-left heading/prompt and lower-right product illustration as T15. | White/black hard split; burger and bag cutouts on a graphic stage. | P | Yes — same `P-L2-UtilityIllustrated` family |
| T17 `早安-1.png` | Exact duplicate of T02 (same SHA-256 prefix in source inspection). | Same as T02. | Same as T02. | S | Not new evidence — duplicate `S-L4-AtmosphericBrief` |
| T18 `智能路况-1.png` | Exact duplicate of T03. | Same as T03. | Same as T03. | S | Not new evidence — duplicate `S-L4-AtmosphericBrief` |
| T19 `Frame 2117132827.png` | Learn how to auto-answer phone calls. | Three-line instructional headline upper-left; bulb lower-right; large central negative space. | Flat, saturated yellow with a softly modeled glowing bulb. | P | Yes — `P-L2-UtilityIllustrated` |
| T20 `Frame 2117132878.png` | Welcome to Shenzhen. | City photo lower portion; title/location upper-left against blue sky. | Daylight photo; horizon depth and gentle sky gradient. | F | Yes — `F-L3-TravelPlace` |
| T21 `Frame 2117132885.png` | Welcome to Chongqing. | White title/location upper-left against dark blue sky; illuminated city fills lower half. | Night city photo, warm building/road lights and long-exposure light trail; high depth. | F | Yes — `F-L4-NightPlace` |
| T22 `Frame 2117132889.png` | Welcome to Beijing. | White title/location upper-left, with temple centered/lower. | Daylight travel photograph with open cyan sky and architectural depth. | F | Yes — `F-L3-TravelPlace` |
| T23 `Frame 2117132896.png` | Welcome to Shanghai. | White title/location upper-left, skyline/horizon lower/middle. | Daylight skyline photo with sky gradient/reflections. | F | Yes — `F-L3-TravelPlace` |
| T24 `Group 2134130823.png` | English exam in three days; lucky-clover encouragement. | Large clovers top/right; heading mid-left; supporting line lower-left; background pattern kept quiet. | Mint-to-blue gradient, patterned translucency, layered/flat vector clovers. | F | Yes — `F-L2-EncouragementSymbol` |
| T25 `年度总结.png` | Same annual-summary-ready narrative as T01. | Same left copy/date and upper-left portrait; more compact 414px export. | Same soft off-white/pastel treatment. | S | Not new evidence — duplicate family `S-L1-SoftSummary` |
| T26 `当地应用.png` | Local apps are recommended. | App-icon collage occupies top; title/subtitle lower-left. | Green field, cropped app tiles with rounded black/green blocks; flat collage depth. | F | Yes — `F-L2-AppCollage` |
| T27 `1 音乐播放.png` | Play music for me. | Title occupies lower-left; dot-field and abstract note/device form occupy upper/right. | Pale lilac/white field with airy blur, halftone gradient and translucent abstract form. | F | Yes — `F-L2-MediaAtmosphere` |
| T28 `航班提醒.png` | Flight RY9108 is present/active. | Flight code upper-left; small plane centered; otherwise intentionally empty black field. | Near-black void with thin white border; sparse, flat, high-contrast. | S | Conditional — `S-L5-MinimalTransport`; insufficient evidence for broad VA reuse. |

## Proposed five-tier VA taxonomy, grounded in the theater

The tier is a **visual-narrative intensity tier**, not priority, quality, or an instruction to generate unobserved scenes. Each family has an actual theater asset/template ID and a role boundary.

| Tier | Formal narrative template family | Actual theater evidence | Approved semantic roles | Background construction rule evidenced by the cards |
|---|---|---|---|---|
| L1 — Utility surface | `P-L1-PersonAction`, `P-L1-CodeCTA`, `S-L1-SoftSummary` | T04/T05, T07, T01/T25 | **P**, **S** | Pale/near-white ground; copy is centered or left-aligned; actions are an explicit lower pill or paired bottom buttons; portrait is a small, non-competing focal object. |
| L2 — Graphic assist | `S-L2-DataControl`, `P-L2-UtilityIllustrated`, `F-L2-EncouragementSymbol`, `F-L2-AppCollage`, `F-L2-MediaAtmosphere` | T06, T15/T16/T19, T24, T26, T27 | **F**, **S**, **P** | One dominant graphic device (control, cutout, bulb, symbol, app grid, or abstract form) placed opposite the text stack; flat/gradient material, not photoreal scene dependence. |
| L3 — Contextual story | `P-L3-SingleDecision`, `P-L3-CountdownPlan`, `F-L3-MediaObject`, `F-L3-TravelPlace`, `F-L3-EditorialCutout` | T09, T11/T12, T10, T13/T20/T22/T23, T14 | **F**, **P** | A specific activity/event/place anchors the card; copy remains consistently upper-left or lower-left; one clear decision button only where the narrative asks for an action. |
| L4 — Atmospheric scene | `S-L4-AtmosphericBrief`, `F-L4-NightPlace` | T02/T17, T03/T18, T21 | **F**, **S** | Environmental image is the message: storm, morning light, or night city. Use a dark/smoked readability veil and retain a left-side text column; depth comes from light/weather/photo, not added interface ornaments. |
| L5 — Signature / exceptional | `F-L5-FestivalSculpture`, `S-L5-MinimalTransport` | T08, T28 | **F**, **S** | Highly branded special event sculpture or near-empty high-contrast transport state. Use only when the content itself warrants the exceptional treatment; these are not default card backgrounds. |

### Role-to-template registry

- **Focus:** `F-L2-EncouragementSymbol` (T24); `F-L2-AppCollage` (T26); `F-L2-MediaAtmosphere` (T27); `F-L3-MediaObject` (T10); `F-L3-TravelPlace` (T13/T20/T22/T23); `F-L3-EditorialCutout` (T14, conditional); `F-L4-NightPlace` (T21); `F-L5-FestivalSculpture` (T08, conditional).
- **Status:** `S-L1-SoftSummary` (T01/T25); `S-L2-DataControl` (T06); `S-L4-AtmosphericBrief` (T02/T03 plus duplicates T17/T18); `S-L5-MinimalTransport` (T28, conditional).
- **Step:** `P-L1-PersonAction` (T04/T05); `P-L1-CodeCTA` (T07); `P-L2-UtilityIllustrated` (T15/T16/T19); `P-L3-SingleDecision` (T09); `P-L3-CountdownPlan` (T11/T12).

## Explicit exclusions / rejected abstractions

The following are deliberately **not** adopted because no theater card provides the necessary visual evidence:

1. **Generic “premium glassmorphism” as a taxonomy tier.** T02 has smoky gloss/light shafts and T06 has one raised translucent control, but the theater does not evidence a generalized glass-background family across roles.
2. **Generic “3D object / isometric product” template.** T08 is a festival-specific zodiac sculpture; it does not support arbitrary floating objects, product pedestals, or isometric scenes.
3. **Generic “people/lifestyle photography” template.** T04/T05 use small identity portraits for a call state and T14 uses one athlete cutout; neither establishes a reusable lifestyle-photo narrative system.
4. **Generic “cinematic landscape” template.** The only full scenes are concrete weather/place narratives (T03, T13, T20-T23). A non-specific mountain, beach, office, or fantasy scene is not theater-evidenced.
5. **Generic “dark luxury,” “neon cyber,” or “abstract AI aura” template.** T28 is a sparse flight state and T27 a music-specific halftone abstraction; neither supports a broad aesthetic category without semantic anchoring.
6. **Background-first templates with no copy-safe region.** Every qualifying case preserves a legible left/upper copy stack, bottom CTA band, or centered identity/action configuration. Background detail cannot consume that space.

## Source-path and evidence validation

- Registry source: `desktop-card/index.html:6163-6193` contains **28** theater entries; `desktop-card/index.html:6506-6511` maps each entry to `gallery/<encoded file name>` and renders its label/image.
- View semantics: `desktop-card/index.html:3456-3463` identifies the view; `desktop-card/index.html:3157-3194` establishes its square, image-cover magnetic-card presentation; `desktop-card/index.html:6520-6526` confirms “use this style” is only a prompt prefill, not a template application.
- Rendering inventory: T01–T28 all exist at `desktop-card/gallery/<asset name in table>` at audit time. Duplicate byte evidence: T02 = T17 and T03 = T18 (same inspected SHA-256 prefixes); they do not expand the narrative set.
- Supporting visual contacts (generated solely from those source assets):
  - `desktop-card/.validation/theater-va-audit/theater-contact-sheet-01.png` — T01–T07
  - `desktop-card/.validation/theater-va-audit/theater-contact-sheet-02.png` — T08–T14
  - `desktop-card/.validation/theater-va-audit/theater-contact-sheet-03.png` — T15–T21
  - `desktop-card/.validation/theater-va-audit/theater-contact-sheet-04.png` — T22–T28

**Owner-review recommendation.** Promote only the named L1–L4 families initially, and gate L5 behind content-specific approval. This keeps future formal VA backgrounds traceable to actual theater card behavior rather than generic style labels.
