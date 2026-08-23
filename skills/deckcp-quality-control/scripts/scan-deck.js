#!/usr/bin/env node
/**
 * scan-deck.js — deterministic pre-pass for the quality-control gate.
 * Zero model tokens. Node 18+.
 *
 * Input:  a saved `get_deck` result (JSON with .slides[] of
 *         { id, slide_order, frontmatter, mdx_content }) and, optionally,
 *         the brand-kit.json the deck was built from.
 * Output: <out>/qc-scan.json + a grouped console summary, keyed by the six
 *         QC dimensions: brand, alignment, spacing, polish, repetition, generic.
 *
 * This pass finds what a script CAN find (literal colours, class tokens,
 * layout fingerprints, word counts, buzzwords). It does NOT look at pixels —
 * the skill renders and scores on top of this. A clean scan is necessary,
 * not sufficient.
 *
 * Usage:
 *   node scan-deck.js ./deck-brief/deck.json [--kit ./deck-brief/brand-kit.json] [--out ./deck-brief]
 * Exit: 0 ok (see `status` per dimension), 1 bad args
 */
"use strict";
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
let deckFile = null, kitFile = null, out = "./deck-brief";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--kit") kitFile = argv[++i];
  else if (argv[i] === "--out") out = argv[++i];
  else deckFile = argv[i];
}
if (!deckFile) { console.error("usage: node scan-deck.js ./deck-brief/deck.json [--kit ./deck-brief/brand-kit.json] [--out ./deck-brief]"); process.exit(1); }

const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const slides = (deck.slides || []).slice().sort((a, b) => (a.slide_order ?? 0) - (b.slide_order ?? 0));
let kit = null;
if (kitFile && fs.existsSync(kitFile)) kit = JSON.parse(fs.readFileSync(kitFile, "utf8"));

// ---------- palette ----------
const NEUTRALS = new Set(["#000000", "#ffffff"]);
const palette = new Set(NEUTRALS);
const paletteSource = [];
if (kit && kit.colors) {
  for (const [role, c] of Object.entries(kit.colors)) {
    const hex = typeof c === "string" ? c : c && c.hex;
    if (hex) { palette.add(hex.toLowerCase()); paletteSource.push(`${role}=${hex}`); }
  }
  for (const [name, c] of Object.entries(kit.extra_colors || {})) {
    const hex = typeof c === "string" ? c : c && c.hex;
    if (hex) { palette.add(hex.toLowerCase()); paletteSource.push(`${name}=${hex}`); }
  }
}
const dontText = kit && Array.isArray(kit.dont) ? kit.dont.join(" ").toLowerCase() : "";

// ---------- helpers ----------
const normHex = (h) => { let s = h.slice(1).toLowerCase(); if (s.length === 3) s = s.split("").map((c) => c + c).join(""); return "#" + s.slice(0, 6); };
const BUZZ = /\b(revolutioni[sz]|seamless(ly)?|unlock(ing)?|empower(ing|s)?|next[- ]gen(eration)?|cutting[- ]edge|leverag(e|ing)|game[- ]chang(er|ing)|elevat(e|ing)|streamlin(e|ing)|harness(ing)?|transform(ing)? (your|the way)|in today'?s|robust|delve|synerg|holistic|best[- ]in[- ]class|world[- ]class|state[- ]of[- ]the[- ]art|supercharge|frictionless|effortless(ly)?|paradigm)\b/gi;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const LABEL_TITLES = /^(the )?(problem|solution|team|market|traction|ask|the ask|competition|competitors|product|overview|agenda|thank you|thanks|q&a|questions|summary|timeline|roadmap|vision|mission|business model|go[- ]to[- ]market|gtm|financials|pricing|why now|why us|about us|introduction|intro|contact|appendix)\??$/i;
const TINY = /\b(text-(xs|sm|base|lg|xl))\b/g;          // raw Tailwind sizes: 12–20px, all below the 22px floor
const DECK_SIZE = /\bdeck-text-(\d*xl|xs|sm|base|lg)\b/g;
const GAP = /\b(deck-gap-[a-z0-9]+|gap-(x-|y-)?\d+(\.\d+)?)\b/g;
const PAD = /\b(p|px|py|pt|pb|pl|pr)-\d+(\.\d+)?\b/g;
const COLOR_CLASS = /\b(bg|text|border|from|to|via|ring|fill|stroke)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;
const GRADIENT = /\b(bg-gradient-to-[a-z]+|from-[a-z]+-\d+|to-[a-z]+-\d+)\b/g;
const COMPONENT = /<([A-Z][A-Za-z0-9]*)\b/g;
const RATIO = /\bdeck-ratio-[a-z0-9-]+\b|\bgrid-cols-\d\b/g;

function textOf(mdx, fm) {
  const parts = [];
  const mdRe = /md=(?:"([\s\S]*?)"|'([\s\S]*?)'|\{`([\s\S]*?)`\})/g;
  let m;
  while ((m = mdRe.exec(mdx))) parts.push(m[1] ?? m[2] ?? m[3] ?? "");
  // bare text between tags (should be none per contract, but count it)
  parts.push(mdx.replace(/<[^>]+>/g, " ").replace(/\{[^}]*\}/g, " "));
  if (fm) for (const k of ["title", "subtitle", "sectionLabel"]) if (fm[k]) parts.push(String(fm[k]));
  return parts.join("\n");
}
const words = (t) => (t.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;
const uniq = (a) => [...new Set(a)];
const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});

// ---------- per-slide scan ----------
const per = [];
for (const s of slides) {
  const mdx = s.mdx_content || "";
  const fm = s.frontmatter || {};
  const text = textOf(mdx, fm);
  const comps = (mdx.match(COMPONENT) || []).map((c) => c.slice(1));
  const compCount = count(comps);
  const cards = compCount.Card || 0;
  const icons = compCount.Icon || 0;
  const hexes = uniq((mdx.match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) || []).map(normHex));
  const offPalette = kit ? hexes.filter((h) => !palette.has(h)) : [];
  const colorClasses = uniq(mdx.match(COLOR_CLASS) || []);
  const cardAccents = uniq((mdx.match(/<Card\b[^>]*accent=["']([a-z]+)["']/g) || []).map((x) => x.replace(/.*accent=["']([a-z]+)["']/, "$1")));
  const gradients = uniq(mdx.match(GRADIENT) || []);
  const tiny = uniq(mdx.match(TINY) || []);
  const sizes = uniq(mdx.match(DECK_SIZE) || []);
  const gaps = uniq(mdx.match(GAP) || []);
  const pads = uniq(mdx.match(PAD) || []);
  const ratio = uniq(mdx.match(RATIO) || []).sort().join("+");
  const title = String(fm.title || "");
  const buzz = uniq((text.match(BUZZ) || []).map((b) => b.toLowerCase()));
  const hasImg = /<img\b|<video\b/.test(mdx) || !!fm.backgroundImage;
  const inlineStyle = /\bstyle=\{\{/.test(mdx);
  const arrayProp = /\bitems=\{\[/.test(mdx);
  const wc = words(text);
  // coarse layout fingerprint: variant + structure + component mix (bucketed)
  const topComps = Object.keys(compCount).filter((c) => !["CardTitle", "CardText", "CardList", "Icon", "Tag"].includes(c)).sort();
  const bucket = (n) => (n === 0 ? "0" : n <= 2 ? "1-2" : n <= 4 ? "3-4" : "5+");
  const fingerprint = [fm.variant || "light", ratio || "flow", topComps.join(","), "cards" + bucket(cards), hasImg ? "img" : "noimg"].join("|");

  const chromeVariant = ["hero", "close"].includes(fm.variant || "");
  per.push({
    slide_order: s.slide_order, id: s.id, title, variant: fm.variant || "light", master: fm.master || null,
    section_label: fm.sectionLabel || fm.sectionlabel || null, is_chrome_slide: !chromeVariant,
    words: wc, components: compCount, cards, icons, hexes, off_palette: offPalette, color_classes: colorClasses,
    card_accents: cardAccents, gradients, tiny_text: tiny, sizes, gaps, pads, buzzwords: buzz,
    emoji: EMOJI.test(text), label_title: LABEL_TITLES.test(title.trim()), has_image: hasImg,
    inline_style: inlineStyle, array_prop: arrayProp, fingerprint,
  });
}

// ---------- deck-level findings ----------
const findings = { brand: [], alignment: [], spacing: [], polish: [], repetition: [], generic: [] };
const F = (dim, severity, slide, msg) => findings[dim].push({ severity, slide, msg });
const n = per.length;

// brand
if (!kit) F("brand", "warn", null, "no brand-kit.json given — off-palette hex check skipped. Pass --kit, or run deckcp-brand-kit first.");
for (const p of per) {
  for (const h of p.off_palette) F("brand", "fail", p.slide_order, `hex ${h} is not in the kit palette (${paletteSource.join(", ")})`);
  for (const c of p.color_classes) F("brand", "fail", p.slide_order, `Tailwind colour class ${c} introduces a colour the brand doesn't own — use the accent/secondary vars (deck-*, slate neutrals) instead`);
  if (p.gradients.length && (!kit || /gradient/.test(dontText) || kit.mode === "synthesize")) F("brand", "warn", p.slide_order, `gradient classes (${p.gradients.join(" ")}) — the kit forbids or never asked for gradients`);
}
const allAccents = uniq(per.flatMap((p) => p.card_accents));
if (allAccents.length > 2) F("brand", "fail", null, `Card accent colours used: ${allAccents.join(", ")} — ${allAccents.length} hues is a rainbow, not a brand. Pick one (two at most) and apply deck-wide.`);

// chrome consistency — does every content slide feel like one family? The
// single strongest "designed not generated" signal (kit.chrome / a master).
const contentSlides = per.filter((p) => p.is_chrome_slide);
if (contentSlides.length >= 3) {
  const masters = count(contentSlides.map((p) => p.master || "(none)"));
  const masterKeys = Object.keys(masters);
  const withMaster = contentSlides.filter((p) => p.master).length;
  if (kit && kit.chrome && withMaster === 0) {
    F("brand", "fail", null, `the kit defines chrome ("${String(kit.chrome).slice(0, 60)}…") but NO content slide opts into a master — every slide is reinventing its frame. Build the chrome master and set frontmatter.master on each slide.`);
  } else if (withMaster > 0 && withMaster < contentSlides.length) {
    const naked = contentSlides.filter((p) => !p.master).map((p) => p.slide_order);
    F("brand", "fail", null, `${naked.length}/${contentSlides.length} content slides have no master while others do (slides ${naked.join(", ")}) — the chrome will differ between them. Put every content slide on the same master.`);
  } else if (masterKeys.length > 2 && withMaster === contentSlides.length) {
    F("brand", "warn", null, `content slides split across ${masterKeys.length} masters (${masterKeys.join(", ")}) — more than a content + a divider master usually means inconsistent chrome.`);
  }
  // eyebrow/section-label presence should be all-or-none among content slides
  const withLabel = contentSlides.filter((p) => p.section_label).length;
  if (withLabel > 0 && withLabel < contentSlides.length && !contentSlides.every((p) => p.master)) {
    F("brand", "warn", null, `${withLabel}/${contentSlides.length} content slides carry a sectionLabel eyebrow, the rest don't — the top-of-slide chrome is inconsistent. Either a master supplies it everywhere, or every slide sets frontmatter.sectionLabel.`);
  }
}

// alignment — scripts can only catch structural alignment tells; pixels come from the render
for (const p of per) {
  if (p.inline_style) F("alignment", "fail", p.slide_order, "inline style={{}} present — it is STRIPPED on write, so whatever it positioned is now unaligned");
  if (p.array_prop) F("alignment", "fail", p.slide_order, "items={[…]} array prop — silently dropped; the list renders empty");
}
F("alignment", "info", null, "title baseline, left edges, and grid gutters can only be judged on the render — score this dimension from the images");

// spacing
const gapCensus = count(per.flatMap((p) => p.gaps));
const padCensus = count(per.flatMap((p) => p.pads));
const gapKeys = Object.keys(gapCensus), padKeys = Object.keys(padCensus);
if (gapKeys.length > 5) F("spacing", "fail", null, `${gapKeys.length} distinct gap tokens across the deck (${gapKeys.join(" ")}) — a system uses 2–3 (deck-gap-md default, deck-gap-lg for sections, deck-gap-sm inside cards)`);
if (padKeys.length > 8) F("spacing", "warn", null, `${padKeys.length} distinct padding tokens (${padKeys.join(" ")}) — collapse to a scale`);
// deck-gap-* IS the system scale — using one step once is fine. Raw Tailwind
// gap-7 / p-9 used once is a slide that left the system.
for (const [k, v] of Object.entries({ ...gapCensus, ...padCensus })) if (v === 1 && n >= 4 && !k.startsWith("deck-")) F("spacing", "warn", per.find((p) => p.gaps.includes(k) || p.pads.includes(k))?.slide_order ?? null, `${k} is used exactly once — an outlier against the rest of the deck`);
for (const p of per) if (p.sizes.length > 4) F("spacing", "warn", p.slide_order, `${p.sizes.length} distinct type sizes on one slide (${p.sizes.join(" ")}) — hierarchy needs 2–3`);

// polish
for (const p of per) {
  for (const t of p.tiny_text) F("polish", "fail", p.slide_order, `${t} is below the 22px floor on a 1920×1080 canvas — use deck-text-*`);
  if (p.words > 130 && p.variant !== "close") F("polish", "warn", p.slide_order, `${p.words} words — dense for a slide; a link-deck tolerates ~80, a live deck ~40`);
  if (p.words < 4 && !["hero", "close"].includes(p.variant)) F("polish", "warn", p.slide_order, `only ${p.words} words — is this slide carrying anything?`);
  if (p.emoji) F("polish", "fail", p.slide_order, "emoji in slide text — reads as chat, not a deck");
}
// imagery coverage — a premium deck carries real photos on a good share of
// slides (the reference: food photography on most); a wireframe carries none.
const imgSlides = per.filter((p) => p.has_image).length;
const markDriven = kit && kit.imagery && /mark[- ]driven|no imagery|illustration|no photo/i.test(String(kit.imagery));
if (n >= 5 && imgSlides === 0 && !markDriven) F("polish", "fail", null, `no imagery on any of ${n} slides — reads as a wireframe. Use the user's own photos (deckcp-gather-assets) or approved brand imagery on at least a third of slides. (If the brand is deliberately mark-driven, record that in kit.imagery to silence this.)`);
else if (n >= 8 && imgSlides > 0 && imgSlides / n < 0.2 && !markDriven) F("polish", "warn", null, `only ${imgSlides}/${n} slides carry imagery — a premium deck leans on real photos more than that.`);

// repetition
const fps = per.map((p) => p.fingerprint);
let run = 1;
for (let i = 1; i <= fps.length; i++) {
  if (i < fps.length && fps[i] === fps[i - 1]) { run++; continue; }
  if (run >= 3) F("repetition", "fail", per[i - run].slide_order, `${run} consecutive slides share one layout skeleton (${fps[i - 1]}) — slides ${per.slice(i - run, i).map((p) => p.slide_order).join(", ")}; rebuild the middle ones as a different archetype (full-bleed stat, photo band, table, single statement)`);
  run = 1;
}
const fpCensus = count(fps);
for (const [fp, c] of Object.entries(fpCensus)) if (n >= 5 && c / n > 0.5) F("repetition", "fail", null, `one skeleton covers ${c}/${n} slides (${fp}) — the deck reads as a template`);
const variants = count(per.map((p) => p.variant));
if (n >= 5 && Object.keys(variants).length === 1 && !per.some((p) => p.has_image)) F("repetition", "warn", null, `every slide is variant:${per[0].variant} with no imagery — no tonal change anywhere; add one full-bleed or accent moment`);
if (deck.deck_variety) {
  F("repetition", deck.deck_variety.score < 70 ? "fail" : "info", null, `server deck_variety score ${deck.deck_variety.score}/100${deck.deck_variety.issues && deck.deck_variety.issues.length ? ": " + deck.deck_variety.issues.join(" · ") : ""}`);
}

// generic-AI tells
const iconCardSlides = per.filter((p) => p.cards >= 3 && p.icons >= 3);
if (n >= 4 && iconCardSlides.length / n >= 0.4) F("generic", "fail", null, `${iconCardSlides.length}/${n} slides are icon-card grids (slides ${iconCardSlides.map((p) => p.slide_order).join(", ")}) — the single most recognisable AI-deck pattern. Keep at most one.`);
else for (const p of iconCardSlides) F("generic", "warn", p.slide_order, `icon-card grid (${p.cards} cards, ${p.icons} icons)`);
for (const p of per) {
  if (p.icons > 6) F("generic", "warn", p.slide_order, `${p.icons} icons on one slide — decoration, not information`);
  if (p.buzzwords.length) F("generic", "fail", p.slide_order, `buzzwords: ${p.buzzwords.join(", ")} — replace with the specific claim`);
  if (p.label_title) F("generic", "warn", p.slide_order, `title "${p.title}" is a topic label, not a conclusion — deck-critique territory, but it also reads as template`);
}
const darkGrad = per.filter((p) => p.variant === "dark" && p.gradients.length);
if (n >= 4 && darkGrad.length / n >= 0.5) F("generic", "fail", null, `${darkGrad.length}/${n} slides are dark-with-gradient — the default AI look`);

// ---------- status + output ----------
const status = {};
for (const [dim, list] of Object.entries(findings)) status[dim] = list.some((f) => f.severity === "fail") ? "FAIL" : list.some((f) => f.severity === "warn") ? "WARN" : "PASS";
const report = { deck_slug: deck.slug || deck.deck_slug || null, slide_count: n, kit: kitFile || null, palette: [...palette], status, findings, slides: per };
fs.mkdirSync(out, { recursive: true });
const outFile = path.join(out, "qc-scan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(`qc-scan: ${report.deck_slug || deckFile} — ${n} slides${kit ? " · kit " + (kit.brand_name || kitFile) : " · NO KIT"}`);
const LABEL = { brand: "Brand accuracy", alignment: "Alignment", spacing: "Spacing consistency", polish: "Visual polish", repetition: "Repetitive layouts", generic: "Generic-AI look" };
for (const dim of Object.keys(findings)) {
  console.log(`\n[${status[dim].padEnd(4)}] ${LABEL[dim]}`);
  for (const f of findings[dim]) console.log(`   ${f.severity.padEnd(4)} ${f.slide != null ? "slide " + String(f.slide).padStart(3) + "  " : "deck       "}${f.msg}`);
  if (!findings[dim].length) console.log("   (nothing mechanical to flag — judge from the render)");
}
console.log(`\nfingerprints: ${uniq(fps).length} distinct / ${n} slides`);
console.log(`Wrote ${outFile}`);
