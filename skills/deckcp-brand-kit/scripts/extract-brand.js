#!/usr/bin/env node
/**
 * extract-brand.js — read a brand's design tokens LITERALLY from its sources.
 * Zero model tokens. Node 18+ (global fetch).
 *
 * Sources (any mix, any order):
 *   logo.svg            fill/stroke/stop-color/inline-css hex + rgb(), counted
 *   https://site.com    HTML + same-origin stylesheets: :root vars, theme-color,
 *                       font-family, Google Fonts families, logo <img>/<svg>, og:image
 *   styles.css / x.html same as a website, offline
 *   deck.pptx           ppt/theme/theme1.xml colour slots (dk1/lt1/accent1-6/hlink)
 *                       + major/minor latin typefaces (needs `unzip` or `tar`)
 *   guide.pdf           verbatim lines mentioning hex/Pantone/RGB/CMYK/font/typeface
 *                       (needs `pdftotext`; fonts via `pdffonts` if present)
 *   logo.png / .jpg     reported and SKIPPED — rasters hold no literal colours
 *
 * Usage:
 *   node extract-brand.js [--out ./deck-brief] <source>...
 *
 * Writes <out>/brand-extract.json and prints a human summary. Never guesses:
 * every value in the output is a string that exists in a source.
 *
 * Exit codes: 0 ok, 1 bad args, 2 every source failed.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// ---------- args ----------
const argv = process.argv.slice(2);
let out = "./deck-brief";
const sources = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--out") out = argv[++i];
  else if (argv[i] === "-h" || argv[i] === "--help") { usage(); process.exit(0); }
  else sources.push(argv[i]);
}
if (sources.length === 0) { usage(); process.exit(1); }

function usage() {
  console.log("usage: node extract-brand.js [--out ./deck-brief] <logo.svg|site-url|styles.css|deck.pptx|guide.pdf>...");
}

// ---------- colour helpers ----------
const HEX_RE = /#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi;
const RGB_RE = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;

function normHex(h) {
  let s = h.replace("#", "").toLowerCase();
  if (s.length === 3 || s.length === 4) s = s.slice(0, 3).split("").map((c) => c + c).join("");
  if (s.length === 8) s = s.slice(0, 6);
  return "#" + s;
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((n) => Math.max(0, Math.min(255, +n)).toString(16).padStart(2, "0")).join("");
}
/** Count every colour literal in a text blob, tagged with how it was used. */
function countColours(text, tagger) {
  const counts = {}; // hex -> { count, roles: {role: n} }
  const bump = (hex, role) => {
    const e = (counts[hex] = counts[hex] || { count: 0, roles: {} });
    e.count++;
    e.roles[role] = (e.roles[role] || 0) + 1;
  };
  // Scan attribute/property-shaped occurrences first so we can tag roles.
  const propRe = /([a-zA-Z-]+)\s*[:=]\s*["']?\s*(#(?:[0-9a-f]{3,8})\b|rgba?\([^)]*\))/gi;
  let m;
  const seen = new Set();
  while ((m = propRe.exec(text))) {
    const prop = m[1].toLowerCase();
    const val = m[2];
    const hex = val.startsWith("#") ? normHex(val) : (() => { const r = new RegExp(RGB_RE.source, "i").exec(val); return r ? rgbToHex(r[1], r[2], r[3]) : null; })();
    if (!hex) continue;
    bump(hex, tagger ? tagger(prop) : prop);
    seen.add(m.index + m[0].length - val.length);
  }
  // Then anything we didn't already attribute.
  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(text))) {
    if (seen.has(m.index)) continue;
    // Skip things that look like ids/anchors (#main) — require hex-only body already enforced by regex.
    bump(normHex(m[0]), "other");
  }
  RGB_RE.lastIndex = 0;
  while ((m = RGB_RE.exec(text))) {
    if (seen.has(m.index)) continue;
    bump(rgbToHex(m[1], m[2], m[3]), "other");
  }
  return counts;
}
function topColours(counts, n = 12) {
  return Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, n)
    .map(([hex, e]) => ({ hex, count: e.count, roles: e.roles }));
}

// ---------- font helpers ----------
function fontFamilies(text) {
  const fams = {};
  const re = /font-family\s*[:=]\s*["']?([^;"'}>]+)/gi;
  let m;
  while ((m = re.exec(text))) {
    const first = m[1].split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (!first || /^(inherit|initial|unset|var\()/i.test(first)) continue;
    fams[first] = (fams[first] || 0) + 1;
  }
  return Object.entries(fams).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}
function googleFontFamilies(text) {
  const out = new Set();
  const re = /fonts\.googleapis\.com\/css2?\?([^"'\s)]+)/gi;
  let m;
  while ((m = re.exec(text))) {
    const q = decodeURIComponent(m[1].replace(/&amp;/g, "&"));
    for (const part of q.split("&")) {
      if (part.startsWith("family=")) {
        for (const fam of part.slice(7).split("|")) out.add(fam.split(":")[0].replace(/\+/g, " "));
      }
    }
  }
  return [...out];
}
/** Framework-generated palette vars (Tailwind's --color-red-500, --tw-*) are
 *  noise; the brand's own --primary/--bg/--surface names are the signal. */
const FRAMEWORK_VAR = /^--(tw-|color-[a-z]+-\d{2,3}$|font-(sans|serif|mono)$|spacing|radius|breakpoint|animate|ease|shadow|blur|leading|tracking|default-)/;
function cssVars(text) {
  const vars = {};
  let framework = 0;
  const re = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;}]+)/g;
  let m;
  while ((m = re.exec(text))) {
    const v = m[2].trim();
    let hex = null;
    if (/^#[0-9a-f]{3,8}$/i.test(v)) hex = normHex(v);
    else if (/^rgba?\(/i.test(v)) { const r = new RegExp(RGB_RE.source, "i").exec(v); if (r) hex = rgbToHex(r[1], r[2], r[3]); }
    else if (/^hsla?\(/i.test(v)) hex = v; // kept verbatim — still a literal from the source
    if (!hex) continue;
    if (FRAMEWORK_VAR.test(m[1])) { framework++; continue; }
    vars[m[1]] = hex;
  }
  if (framework) vars["(framework palette vars hidden)"] = String(framework);
  return vars;
}

// ---------- per-source readers ----------
function readSvg(file) {
  const text = fs.readFileSync(file, "utf8");
  const colours = countColours(text, (p) => (/^(fill|stroke|stop-color|color|background|background-color)$/.test(p) ? p : "other"));
  const gradients = (text.match(/<(linear|radial)Gradient\b/gi) || []).length;
  return {
    kind: "svg",
    colours: topColours(colours, 20),
    gradients,
    fonts: fontFamilies(text),
    has_live_text: /<text\b/i.test(text),
    note: "Counts are fills/strokes inside the SVG. The most-filled hex is usually the brand colour; a lone white fill is a knockout, not palette.",
  };
}

function readCssLike(text, label) {
  return {
    kind: "css",
    css_vars: cssVars(text),
    colours: topColours(countColours(text, (p) => {
      if (/background/.test(p)) return "background";
      if (/^(color)$/.test(p)) return "text";
      if (/border|outline/.test(p)) return "border";
      if (/fill|stroke/.test(p)) return p;
      return "other";
    }), 20),
    fonts: fontFamilies(text),
    google_fonts: googleFontFamilies(text),
    label,
  };
}

async function readWebsite(url) {
  const res = await fetch(url, { headers: { "user-agent": "deckcp-brand-kit/1.0 (+https://deckcp.com)" }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const origin = new URL(res.url || url);
  const sheets = [];
  const linkRe = /<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi;
  let m;
  const hrefs = [];
  while ((m = linkRe.exec(html))) {
    const h = /href=["']([^"']+)["']/i.exec(m[0]);
    if (h) hrefs.push(h[1]);
  }
  let cssText = "";
  const inline = html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) || [];
  for (const s of inline) cssText += s.replace(/<\/?style[^>]*>/gi, "") + "\n";
  for (const href of hrefs.slice(0, 12)) {
    let abs;
    try { abs = new URL(href, origin).href; } catch { continue; }
    const sameOrigin = new URL(abs).origin === origin.origin;
    const isGoogle = /fonts\.googleapis\.com/.test(abs);
    if (!sameOrigin && !isGoogle) { sheets.push({ href: abs, skipped: "cross-origin" }); continue; }
    try {
      const r = await fetch(abs, { headers: { "user-agent": "deckcp-brand-kit/1.0" } });
      const t = await r.text();
      sheets.push({ href: abs, bytes: t.length });
      cssText += "\n/* " + abs + " */\n" + t;
    } catch (e) { sheets.push({ href: abs, error: String(e.message || e) }); }
  }
  const themeColor = (/<meta\b[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i.exec(html) || [])[1] || null;
  const ogImage = (/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html) || [])[1] || null;
  const logos = [];
  const imgRe = /<img\b[^>]*>/gi;
  while ((m = imgRe.exec(html))) {
    if (/logo/i.test(m[0])) {
      const src = (/src=["']([^"']+)["']/i.exec(m[0]) || [])[1];
      if (src) { try { logos.push(new URL(src, origin).href); } catch { logos.push(src); } }
    }
  }
  const inlineSvgLogos = (html.match(/<svg\b[^>]*(?:class|id|aria-label)=["'][^"']*logo[^"']*["'][^>]*>/gi) || []).length;
  const combined = readCssLike(cssText + "\n" + html, url);
  return {
    kind: "website",
    url: res.url || url,
    stylesheets: sheets,
    theme_color: themeColor ? normHex(themeColor) : null,
    og_image: ogImage,
    logo_imgs: [...new Set(logos)],
    inline_svg_logos: inlineSvgLogos,
    css_vars: combined.css_vars,
    colours: combined.colours,
    fonts: combined.fonts,
    google_fonts: combined.google_fonts,
    note: "css_vars names are role hints (--primary, --bg). theme_color is the browser-chrome colour the site declares for itself.",
  };
}

function unzipEntry(archive, entry) {
  const tries = [
    ["unzip", ["-p", archive, entry]],
    ["tar", ["-xOf", archive, entry]],
  ];
  for (const [cmd, args] of tries) {
    try { return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 16 * 1024 * 1024 }).toString("utf8"); } catch { /* next */ }
  }
  throw new Error("needs `unzip` or `tar` on PATH to read the .pptx");
}
function readPptx(file) {
  const xml = unzipEntry(file, "ppt/theme/theme1.xml");
  const slots = {};
  const slotRe = /<a:(dk1|lt1|dk2|lt2|accent[1-6]|hlink|folHlink)>\s*<a:(srgbClr|sysClr)\b([^>]*)>/g;
  let m;
  while ((m = slotRe.exec(xml))) {
    const val = m[2] === "srgbClr" ? /val=["']([0-9A-Fa-f]{6})["']/.exec(m[3]) : /lastClr=["']([0-9A-Fa-f]{6})["']/.exec(m[3]);
    if (val) slots[m[1]] = normHex("#" + val[1]);
  }
  const major = (/<a:majorFont>[\s\S]*?<a:latin\b[^>]*typeface=["']([^"']+)["']/.exec(xml) || [])[1] || null;
  const minor = (/<a:minorFont>[\s\S]*?<a:latin\b[^>]*typeface=["']([^"']+)["']/.exec(xml) || [])[1] || null;
  const themeName = (/<a:theme\b[^>]*name=["']([^"']+)["']/.exec(xml) || [])[1] || null;
  return {
    kind: "pptx",
    theme_name: themeName,
    colour_slots: slots,
    fonts: { major_display: major, minor_body: minor },
    note: "Slot meanings: lt1 = page background, dk1 = body text, accent1 = primary, accent2+ = accents/secondary. These are the deck's DECLARED theme, not sampled.",
  };
}

function readPdf(file) {
  const result = { kind: "pdf", text_lines: [], fonts: [], note: "" };
  try {
    const txt = execFileSync("pdftotext", ["-layout", file, "-"], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
    const keep = /(#[0-9a-f]{6}\b|pantone|\bhex\b|\brgb\b|\bcmyk\b|typeface|\bfont\b|\btype\b.*\b(family|face)\b)/i;
    result.text_lines = txt.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && keep.test(l)).slice(0, 200);
    result.colours = topColours(countColours(txt, () => "text"), 20);
  } catch {
    result.note += "pdftotext not available — open the PDF with the Read tool and transcribe colour/type lines by hand. ";
  }
  try {
    const f = execFileSync("pdffonts", [file], { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8");
    result.fonts = f.split(/\r?\n/).slice(2).map((l) => l.trim().split(/\s+/)[0]).filter(Boolean);
  } catch { result.note += "pdffonts not available — font names come from the text lines only."; }
  return result;
}

// ---------- main ----------
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const report = { generated_by: "extract-brand.js", sources: [] };
  let failures = 0;
  for (const src of sources) {
    const entry = { source: src };
    try {
      if (/^https?:\/\//i.test(src)) Object.assign(entry, await readWebsite(src));
      else {
        if (!fs.existsSync(src)) throw new Error("file not found");
        const ext = path.extname(src).toLowerCase();
        if (ext === ".svg") Object.assign(entry, readSvg(src));
        else if (ext === ".css" || ext === ".html" || ext === ".htm") Object.assign(entry, readCssLike(fs.readFileSync(src, "utf8"), src));
        else if (ext === ".pptx" || ext === ".potx") Object.assign(entry, readPptx(src));
        else if (ext === ".pdf") Object.assign(entry, readPdf(src));
        else if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
          Object.assign(entry, { kind: "raster", skipped: true, note: "Rasters hold no literal colours. Look at it (Read tool), pick the flat fills by eye, mark confidence:'sampled', and ask the user for the real hex." });
        } else throw new Error("unsupported source type " + ext);
      }
    } catch (e) {
      entry.error = String(e.message || e);
      failures++;
    }
    report.sources.push(entry);
  }
  const outFile = path.join(out, "brand-extract.json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  // ---- summary ----
  for (const s of report.sources) {
    console.log(`\n== ${s.source}${s.kind ? " (" + s.kind + ")" : ""}`);
    if (s.error) { console.log("   ERROR:", s.error); continue; }
    if (s.skipped) { console.log("   skipped:", s.note); continue; }
    if (s.colour_slots) for (const [k, v] of Object.entries(s.colour_slots)) console.log(`   ${k.padEnd(9)} ${v}`);
    if (s.css_vars && Object.keys(s.css_vars).length) {
      console.log("   css vars:");
      for (const [k, v] of Object.entries(s.css_vars).slice(0, 24)) console.log(`     ${k} = ${v}`);
    }
    if (s.theme_color) console.log("   theme-color:", s.theme_color);
    if (s.colours && s.colours.length) {
      console.log("   colours by count:");
      for (const c of s.colours.slice(0, 12)) {
        const roles = Object.entries(c.roles).map(([r, n]) => `${r}×${n}`).join(" ");
        console.log(`     ${c.hex}  ×${String(c.count).padStart(3)}  ${roles}`);
      }
    }
    if (s.gradients) console.log(`   gradients: ${s.gradients} (a gradient logo rarely has ONE brand hex — pick the stops deliberately)`);
    if (s.fonts) {
      if (Array.isArray(s.fonts) && s.fonts.length) console.log("   fonts:", s.fonts.slice(0, 8).map((f) => (f.name ? `${f.name}×${f.count}` : f)).join(", "));
      else if (s.fonts.major_display || s.fonts.minor_body) console.log(`   fonts: display=${s.fonts.major_display}  body=${s.fonts.minor_body}`);
    }
    if (s.google_fonts && s.google_fonts.length) console.log("   google fonts:", s.google_fonts.join(", "));
    if (s.logo_imgs && s.logo_imgs.length) console.log("   logo imgs:", s.logo_imgs.slice(0, 5).join("\n              "));
    if (s.inline_svg_logos) console.log(`   inline svg logos: ${s.inline_svg_logos} (view-source and save one as .svg, then re-run on it)`);
    if (s.og_image) console.log("   og:image:", s.og_image);
    if (s.text_lines && s.text_lines.length) {
      console.log(`   ${s.text_lines.length} colour/type lines (first 15):`);
      for (const l of s.text_lines.slice(0, 15)) console.log("     |", l.slice(0, 110));
    }
    if (s.note) console.log("   note:", s.note);
  }
  console.log(`\nWrote ${outFile}`);
  if (failures === sources.length) process.exit(2);
})();
