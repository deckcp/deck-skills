# Match a reference deck — measure it, don't eyeball it

When the user hands you a deck that already looks the way they want ("make
ours feel like this"), the job is to reverse-engineer its **design system**
and re-apply the rules — not to copy slides. Eyeballing a render gets the
colors roughly right and the typography wrong. Measure instead.

## 1. Dump the typography from the PDF itself

pdf.js gives every text run with its font, size and position. Run from a
project that has `pdfjs-dist` (DeckCP's own repo does; use the `legacy`
build in Node):

```js
const tc = await page.getTextContent();
for (const i of tc.items) {
  const [a, b, , , x, y] = i.transform;      // size = hypot(a, b); baseline y from bottom
  console.log(i.str, tc.styles[i.fontName].fontFamily, Math.hypot(a, b), x, H - y);
}
```

Group by baseline and you get the whole system in one table per page:
eyebrow size + y, headline size + y, body size + leading, footer position,
left margin (the smallest x that repeats on every page). Three pages are
usually enough to see the constants.

## 2. Read the real fonts from the file

`/BaseFont` entries in the PDF name the embedded faces. Watch for the
metric clones: **Caladea = Cambria**, **Carlito = Calibri**, **Liberation
Serif = Times**, **Liberation Sans = Arial** — a LibreOffice/PptxGenJS
export substitutes these, so the designer's intent was the original. Map to
DeckCP's catalog by *character*, not name (Cambria → Lora; Calibri → Open
Sans; Georgia → Lora/Merriweather; Helvetica → Inter/Work Sans).

## 3. Convert units once

A 16:9 PPTX/PDF page is 960×540 pt (or 13.333×7.5 in). DeckCP's canvas is
1920×1080 px — exactly **2×**. Multiply every measurement by 2 and you have
canvas pixels. Don't re-derive per slide.

## 4. Write the rules before you touch a slide

Produce a one-page system doc (tokens + chrome grid + containers +
composition rules) from the measurements. The fields that matter most, in
order of how much they make a deck read as "the same team":

1. **Chrome** — eyebrow / headline / footer positions and sizes (identical on
   every content slide).
2. **Type pairing and weights** — which face carries meaning vs. explanation;
   whether bold is ever used (often: never).
3. **Content band** — the y range body content lives in, and the air above
   the footer.
4. **Containers** — panel/card fill, radius, border, padding, proportions
   (e.g. "dark panel = left 44% of the band").
5. **Color jobs** — which hex does which job, and nothing else.
6. **Pacing** — the sequence of body archetypes; no two consecutive alike.

## 5. Apply the rules with a generator, not by hand

Twelve hand-authored slides drift. Encode the tokens and a handful of layout
helpers (chrome, panel, step list, stat row, swatch grid, timeline, card) in
a small script that emits `slide_tree`s, then upsert. Fix a rule once, regenerate
everything. See `deckcp-author-slides` → "Absolute slide-space trees" for the
tree shape that pins elements to canvas coordinates.

## 6. Photos

If photography isn't ready, put **clean placeholders** at the reference's
image proportions (a Sand `#ECE8DF` or dark-tint box, radius 12, one small
tracked-caps caption) so composition can be judged now and the image dropped
in later without re-layout.
