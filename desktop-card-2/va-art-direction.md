# Ternary VA background art direction

## Intent

The ternary prototype uses fifteen original visual-only backgrounds: one for every `Focus`, `Status`, and `Step` role across five VA bands. The work borrows only high-level visual DNA observed in Inspiration Theater: a protected left copy field, one opposing compositional event, restrained utility surfaces at low intensity, and more atmospheric light at high intensity.

It does not recreate any theater card. The browser constructs every background with CSS color fields, gradients, blurred light, circles, rounded slabs, and straight light bars.

## Layout

```
+------------------ 138 px ------------------+
| copy-safe field        original visual mass |
| copy / hierarchy       pigment / light      |
|                                              |
| ternary action remains UI, not background    |
+----------------------------------------------+
```

- Low VA: tactile paper, quiet fields, and low-contrast color masses.
- Mid VA: editorial circles, blocks, and more distinct material separation.
- High VA: dark atmospheric light or celebratory radiance while preserving copy contrast.
- `Focus` favors a single expressive mass; `Status` favors environmental condition; `Step` favors directional momentum.

## Boundary Rules

- Background layers contain no text, numbers, UI icons, controls, buttons, images, SVG, canvas image data, or external/local image URLs.
- No `gallery/` asset is referenced by the ternary VA runtime. Gallery artifacts remain a separate reference-only product feature.
- No gallery asset is cropped, embedded, traced, sampled, or reused.
- No old dotted arc or path fallback is used. The compositions are CSS primitives only.
- Ternary card copy and action elements are created by `cardHTML()` above the background layer.
- Background replacement uses only `opacity 220ms ease-in-out`; it does not animate blur.

## Source Map

The machine-readable registry is `desktop-card/va-template-source-map.json`. It maps every role x VA band to an original CSS recipe and explicitly records the non-direct-gallery assertions.
