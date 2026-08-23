#!/usr/bin/env node
/**
 * check-kit.js — validate a brand-kit.json and emit what to write where.
 * Zero model tokens. Node 18+.
 *
 * Checks:
 *   - the five role colours exist (Secondary may be null) and are 7-char hex
 *   - Text on Background ≥ 4.5:1 (WCAG AA body); Accent and Primary on
 *     Background ≥ 3:1 (AA large text / UI)
 *   - every extracted colour names a `source`
 *   - display/body fonts are in DeckCP's curated 35-face catalog (exact name)
 *
 * On pass, prints:
 *   (a) the `deck_theme` object for `update_deck`
 *   (b) a paste block for the brand record (deckcp.com/<org>/brands)
 *   and writes <kit dir>/brand-kit.md (a one-paragraph summary).
 *
 * Usage:  node check-kit.js ./deck-brief/brand-kit.json
 * Exit:   0 pass, 1 bad args, 3 validation failed (every failure listed)
 */
"use strict";
const fs = require("fs");
const path = require("path");

// DeckCP's curated Google Fonts catalog (src/app/decks/lib/font-library.ts).
// name → css stack written to deck_theme.fontDisplay / fontBody.
const CATALOG = {
  // Sans
  "Inter": "Inter, system-ui, -apple-system, sans-serif",
  "Geist": "Geist, system-ui, sans-serif",
  "Roboto": "Roboto, system-ui, sans-serif",
  "Open Sans": "'Open Sans', system-ui, sans-serif",
  "Montserrat": "Montserrat, system-ui, sans-serif",
  "Poppins": "Poppins, system-ui, sans-serif",
  "DM Sans": "'DM Sans', system-ui, sans-serif",
  "Manrope": "Manrope, system-ui, sans-serif",
  "Space Grotesk": "'Space Grotesk', system-ui, sans-serif",
  "Sora": "Sora, system-ui, sans-serif",
  "Outfit": "Outfit, system-ui, sans-serif",
  "Plus Jakarta Sans": "'Plus Jakarta Sans', system-ui, sans-serif",
  "Work Sans": "'Work Sans', system-ui, sans-serif",
  "IBM Plex Sans": "'IBM Plex Sans', system-ui, sans-serif",
  // Serif
  "Playfair Display": "'Playfair Display', Georgia, serif",
  "Lora": "Lora, Georgia, serif",
  "Merriweather": "Merriweather, Georgia, serif",
  "Source Serif 4": "'Source Serif 4', Georgia, serif",
  "EB Garamond": "'EB Garamond', Georgia, serif",
  "Libre Baskerville": "'Libre Baskerville', Georgia, serif",
  "Fraunces": "Fraunces, Georgia, serif",
  "Crimson Pro": "'Crimson Pro', Georgia, serif",
  // Display
  "Bebas Neue": "'Bebas Neue', Impact, sans-serif",
  "Oswald": "Oswald, Impact, sans-serif",
  "Anton": "Anton, Impact, sans-serif",
  "Archivo Black": "'Archivo Black', Impact, sans-serif",
  "Abril Fatface": "'Abril Fatface', Georgia, serif",
  // Mono
  "Geist Mono": "'Geist Mono', ui-monospace, monospace",
  "JetBrains Mono": "'JetBrains Mono', ui-monospace, monospace",
  "IBM Plex Mono": "'IBM Plex Mono', ui-monospace, monospace",
  "Space Mono": "'Space Mono', ui-monospace, monospace",
  // Handwriting
  "Caveat": "Caveat, cursive",
  "Pacifico": "Pacifico, cursive",
  "Dancing Script": "'Dancing Script', cursive",
  "Shadows Into Light": "'Shadows Into Light', cursive",
};

const ROLES = ["Background", "Text", "Primary", "Accent", "Secondary"];
const HEX = /^#[0-9a-f]{6}$/i;

const file = process.argv[2];
if (!file) { console.error("usage: node check-kit.js ./deck-brief/brand-kit.json"); process.exit(1); }
let kit;
try { kit = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error("cannot read kit:", e.message); process.exit(1); }

const fails = [];
const warns = [];

// ---- colours ----
const hexOf = (role) => {
  const c = kit.colors && kit.colors[role];
  if (!c) return null;
  return typeof c === "string" ? c : c.hex;
};
for (const role of ROLES) {
  const c = kit.colors && kit.colors[role];
  const hex = hexOf(role);
  if (hex == null) {
    if (role === "Secondary") warns.push("Secondary is null — the deck will fall back to DeckCP's default secondary (purple). Fine if the brand truly has one hue; say so in the report.");
    else fails.push(`colors.${role} is missing`);
    continue;
  }
  if (!HEX.test(hex)) fails.push(`colors.${role} "${hex}" is not a 7-char hex (#rrggbb). Never round or abbreviate.`);
  if (kit.mode === "extract" && c && typeof c === "object" && !c.source) fails.push(`colors.${role} has no source — extracted colours must cite where they came from`);
  if (c && typeof c === "object" && c.confidence === "sampled") warns.push(`colors.${role} is SAMPLED from a raster — confirm the real hex with the user before calling it the brand colour`);
}
for (const [name, c] of Object.entries(kit.extra_colors || {})) {
  const hex = typeof c === "string" ? c : c && c.hex;
  if (!HEX.test(hex || "")) fails.push(`extra_colors.${name} "${hex}" is not a 7-char hex`);
}

// ---- contrast (WCAG 2.x relative luminance) ----
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const ratios = {};
const bg = hexOf("Background");
if (bg && HEX.test(bg)) {
  for (const role of ["Text", "Primary", "Accent", "Secondary"]) {
    const h = hexOf(role);
    if (!h || !HEX.test(h)) continue;
    const r = contrast(h, bg);
    ratios[`${role} on Background`] = +r.toFixed(2);
    if (role === "Text" && r < 4.5) fails.push(`Text on Background is ${r.toFixed(2)}:1 — body copy needs ≥ 4.5:1`);
    if ((role === "Accent" || role === "Primary") && r < 3) {
      // A synthesized colour is our choice — pick one that works. An extracted
      // colour is a fact about the brand: keep it, but constrain its job.
      if (kit.mode === "synthesize") fails.push(`${role} on Background is ${r.toFixed(2)}:1 — needs ≥ 3:1 to carry titles/numbers; choose a different ${role}`);
      else warns.push(`${role} on Background is ${r.toFixed(2)}:1 — use it as a FILL or RULE (buttons, bars, section pages), never as text on Background. Put that in \`dont\`; the QC gate checks it.`);
    }
    if (role === "Secondary" && r < 3) warns.push(`Secondary on Background is ${r.toFixed(2)}:1 — keep it for fills/rules, not text`);
  }
  const p = hexOf("Primary"), a = hexOf("Accent");
  if (p && a && HEX.test(p) && HEX.test(a) && p.toLowerCase() === a.toLowerCase()) warns.push("Accent == Primary — single-hue brand; fine, but the kit's `dont` list should forbid inventing a second colour");
}

// ---- fonts ----
// Non-Latin faces: not in the Latin picker, but the renderer loads any family
// named as a deck_theme slot's primary, so these are valid multilingual fonts.
const NOTO_OK = /^Noto\s+(Sans|Serif|Naskh)\b/i;
function resolveFont(slot) {
  const f = kit.fonts && kit.fonts[slot];
  if (!f) { fails.push(`fonts.${slot} is missing`); return null; }
  const name = typeof f === "string" ? f : f.mapped || f.brand;
  if (!name) { fails.push(`fonts.${slot} has neither mapped nor brand`); return null; }
  const key = Object.keys(CATALOG).find((k) => k.toLowerCase() === String(name).toLowerCase());
  if (!key) {
    if (NOTO_OK.test(String(name))) return String(name);   // loadable multilingual face (Noto)
    fails.push(`fonts.${slot} "${name}" is not in DeckCP's curated catalog — map it to the closest of: ${Object.keys(CATALOG).join(", ")} (or a Noto face for a non-Latin script)`);
    return null;
  }
  if (typeof f === "object" && f.brand && f.brand.toLowerCase() !== key.toLowerCase() && !f.why) warns.push(`fonts.${slot}: "${f.brand}" → "${key}" substitution has no \`why\``);
  return key;
}
// Validate declared non-Latin scripts (optional) carry a Noto face.
if (Array.isArray(kit.fonts && kit.fonts.scripts)) {
  for (const s of kit.fonts.scripts) {
    const fonts = [s.sans, s.serif].filter(Boolean);
    if (!fonts.length || !fonts.every((n) => NOTO_OK.test(String(n)))) fails.push(`fonts.scripts "${s.script || "?"}" must name a Noto face (e.g. Noto Sans KR / Noto Serif KR) so it renders — see references/multilingual-fonts.md`);
  }
}
const display = resolveFont("display");
const body = resolveFont("body");

// ---- structure ----
if (!kit.mode || !["extract", "synthesize"].includes(kit.mode)) fails.push('mode must be "extract" or "synthesize"');
if (kit.mode === "synthesize" && !kit.direction) fails.push("synthesized kits must name a `direction`");
if (!kit.guidelines || kit.guidelines.trim().split(/\s+/).length < 15) fails.push("guidelines must be 2–4 concrete sentences a pipeline can obey");
if (!kit.signature_device) fails.push("signature_device is missing — the one repeated device is what keeps the deck from looking generated");
if (!kit.chrome) warns.push("chrome is not set — without a described eyebrow/headline/footer frame, the build step can't make every slide feel like one family (the #1 'designed not generated' signal). Fill it, then build it as a master.");
if (!kit.imagery) warns.push("imagery is not set — say whether the deck uses real photos (and how they're treated) or is mark-driven; a deck with no imagery reads as a wireframe.");
if (!kit.structural_language) fails.push("structural_language is missing (cards | hairlines | flat-panels | editorial-grid)");
const surface = kit.surface || {};
if (surface.default_variant && !["light", "dark"].includes(surface.default_variant)) fails.push("surface.default_variant must be light or dark");

// ---- report ----
console.log(`brand-kit: ${kit.brand_name || "(unnamed)"}  mode=${kit.mode}${kit.direction ? "  direction=" + kit.direction : ""}`);
for (const role of ROLES) {
  const c = kit.colors && kit.colors[role];
  const hex = hexOf(role);
  const src = c && typeof c === "object" ? ` — ${c.source || ""}${c.confidence ? " [" + c.confidence + "]" : ""}` : "";
  console.log(`  ${role.padEnd(10)} ${hex || "null"}${src}`);
}
for (const [k, v] of Object.entries(ratios)) console.log(`  contrast ${k}: ${v}:1`);
console.log(`  fonts: display=${display || "?"} body=${body || "?"}`);
for (const w of warns) console.log("  WARN  " + w);
for (const f of fails) console.log("  FAIL  " + f);
if (fails.length) { console.log(`\n${fails.length} failure(s). Fix the kit and re-run.`); process.exit(3); }

const theme = {
  accent: hexOf("Primary"),
  secondary: hexOf("Secondary"),
  fontDisplay: CATALOG[display],
  fontBody: CATALOG[body],
  defaultMood: surface.mood || "editorial",
  pageMargin: surface.page_margin || 96,
};
console.log("\n(a) update_deck payload — deck scope, safe for any deck:");
console.log("update_deck { deck_slug, deck_theme: " + JSON.stringify(theme, null, 2).replace(/\n/g, "\n  ") + " }");

console.log("\n(b) paste into deckcp.com/<org>/brands (owned brand only — no MCP tool writes this):");
console.log("  Colours:");
for (const role of ROLES) { const h = hexOf(role); if (h) console.log(`    ${role}: ${h}`); }
for (const [name, c] of Object.entries(kit.extra_colors || {})) console.log(`    ${name}: ${typeof c === "string" ? c : c.hex}`);
console.log(`  Fonts: display ${display}, body ${body}`);
const logos = kit.logos || {};
const uploaded = logos.uploaded || {};
console.log("  Logos: " + (Object.keys(uploaded).length ? Object.entries(uploaded).map(([k, v]) => `${k}=${v}`).join(", ") : (logos.color || logos.white || logos.icon ? "upload_asset the files listed in logos.*, then record URLs under logos.uploaded" : "none — hero uses the wordmark rule")));
console.log("  Guidelines:\n    " + kit.guidelines.trim().replace(/\n/g, "\n    "));
if (Array.isArray(kit.dont) && kit.dont.length) console.log("  Don't: " + kit.dont.join("; "));

const md = `# Brand kit — ${kit.brand_name || "(unnamed)"}

**Mode:** ${kit.mode}${kit.direction ? ` · **Direction:** ${kit.direction}` : ""}

| Role | Hex | Source |
| --- | --- | --- |
${ROLES.map((r) => { const c = kit.colors[r]; const h = hexOf(r); return `| ${r} | ${h || "—"} | ${c && typeof c === "object" ? (c.source || "") + (c.confidence ? ` (${c.confidence})` : "") : ""} |`; }).join("\n")}

**Type:** ${display} (display) / ${body} (body)${kit.fonts.display && kit.fonts.display.brand && kit.fonts.display.brand !== display ? ` — brand face "${kit.fonts.display.brand}" mapped to ${display}: ${kit.fonts.display.why || ""}` : ""}
**Surface:** ${surface.default_variant || "light"} · mood ${theme.defaultMood} · margin ${theme.pageMargin}px
**Signature device:** ${kit.signature_device}
**Structure:** ${kit.structural_language}
${kit.chrome ? `**Chrome (build as a master):** ${kit.chrome}\n` : ""}${kit.imagery ? `**Imagery:** ${kit.imagery}\n` : ""}${Array.isArray(kit.graphic_elements) && kit.graphic_elements.length ? `**Graphic elements:** ${kit.graphic_elements.join(", ")}\n` : ""}

${kit.guidelines.trim()}

${Array.isArray(kit.dont) && kit.dont.length ? "Don't: " + kit.dont.join("; ") : ""}
`;
const mdPath = path.join(path.dirname(file), "brand-kit.md");
fs.writeFileSync(mdPath, md);
console.log(`\nPASS — wrote ${mdPath}`);
