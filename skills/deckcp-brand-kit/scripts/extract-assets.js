#!/usr/bin/env node
/**
 * extract-assets.js — pull LOGO, IMAGES and TEXTURES out of a brand PDF
 * (a brand guide, an old deck) so slides can use the real assets.
 * Zero model tokens. Node 18+.
 *
 * What it does:
 *   --images          every embedded raster ≥ --min px (textures, photos, mockups) → out/images/
 *   --logo-page N     render page N at 8×, MASK every text run (so "A.1 MAIN LOGO"
 *                     labels don't pollute the crop), trim to the artwork, knock
 *                     white out to alpha → out/logo/logo-black.png, then recolour
 *                     variants: white, plus any --colors (e.g. the kit's Primary)
 *   --pages a,b,c     render pages at 2× for study (what a brand guide LOOKS like)
 *
 * Usage:
 *   node extract-assets.js guide.pdf --out ./deck-assets/extracted --images --logo-page 6 \
 *        --colors "#A08162,#112118" [--pages 5,6,12] [--min 200] [--deps <dir-with-node_modules>]
 *
 * Needs three libraries that are NOT bundled with the skill:
 *   pdfjs-dist, @napi-rs/canvas, sharp
 * They resolve from the current directory's node_modules, or from --deps <dir>
 * (e.g. a project that already has them). Otherwise:  npm i pdfjs-dist @napi-rs/canvas sharp
 *
 * Gotchas handled: PDF pages with knockout/soft-mask groups (foil/emboss effects)
 * crash napi-canvas — those pages are skipped with a note, not fatal. Embedded
 * images come out in 1/3/4-channel raw form and are normalised to RGBA.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

// ---------- args ----------
const argv = process.argv.slice(2);
const opt = { out: "./deck-assets/extracted", min: 200, images: false, logoPage: null, pages: [], colors: [], deps: null, pdf: null, scale: 8 };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") opt.out = argv[++i];
  else if (a === "--min") opt.min = +argv[++i];
  else if (a === "--images") opt.images = true;
  else if (a === "--logo-page") opt.logoPage = +argv[++i];
  else if (a === "--pages") opt.pages = argv[++i].split(",").map(Number).filter(Boolean);
  else if (a === "--colors") opt.colors = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
  else if (a === "--deps") opt.deps = argv[++i];
  else if (a === "--scale") opt.scale = +argv[++i];
  else if (a === "-h" || a === "--help") { console.log(fs.readFileSync(__filename, "utf8").split("*/")[0]); process.exit(0); }
  else opt.pdf = a;
}
if (!opt.pdf || !fs.existsSync(opt.pdf)) { console.error("usage: node extract-assets.js <brand.pdf> [--images] [--logo-page N] [--pages a,b] [--colors #hex,#hex] [--out dir] [--deps dir]"); process.exit(1); }
if (!opt.images && opt.logoPage == null && !opt.pages.length) { opt.images = true; console.log("(no job flags given — defaulting to --images; add --logo-page N for the logo)"); }

// ---------- deps ----------
function loadDeps() {
  const roots = [process.cwd(), opt.deps, path.dirname(path.resolve(opt.pdf))].filter(Boolean);
  for (const r of roots) {
    try {
      const req = createRequire(path.join(path.resolve(r), "package.json"));
      const canvas = req("@napi-rs/canvas");
      const sharp = req("sharp");
      const pdfjsPath = req.resolve("pdfjs-dist/legacy/build/pdf.mjs");
      return { canvas, sharp, pdfjsPath, root: r };
    } catch { /* try next */ }
  }
  console.error("Missing libraries. Run from a project that has them, pass --deps <dir>, or:\n  npm i pdfjs-dist @napi-rs/canvas sharp");
  process.exit(2);
}

(async () => {
  const { canvas, sharp, pdfjsPath, root } = loadDeps();
  console.log(`deps from ${root}`);
  globalThis.DOMMatrix = canvas.DOMMatrix; globalThis.Path2D = canvas.Path2D; globalThis.ImageData = canvas.ImageData;
  const pdfjs = await import(require("url").pathToFileURL(pdfjsPath).href);
  const { createCanvas } = canvas;
  const factory = { create: (w, h) => { const c = createCanvas(w, h); return { canvas: c, context: c.getContext("2d") }; }, reset: (o, w, h) => { o.canvas.width = w; o.canvas.height = h; }, destroy: () => {} };

  const data = new Uint8Array(fs.readFileSync(opt.pdf));
  const doc = await pdfjs.getDocument({ data, disableWorker: true, isEvalSupported: false }).promise;
  fs.mkdirSync(opt.out, { recursive: true });
  const manifest = { source: path.resolve(opt.pdf), pages: doc.numPages, images: [], logo: [], renders: [], notes: [] };
  console.log(`${opt.pdf}: ${doc.numPages} pages`);

  // ---------- 1. embedded images ----------
  if (opt.images) {
    const dir = path.join(opt.out, "images"); fs.mkdirSync(dir, { recursive: true });
    const seen = new Set();
    for (let p = 1; p <= doc.numPages; p++) {
      let page; try { page = await doc.getPage(p); } catch { continue; }
      let ops; try { ops = await page.getOperatorList(); } catch (e) { manifest.notes.push(`page ${p}: operator list failed (${String(e.message).slice(0, 40)})`); continue; }
      const names = [];
      for (let i = 0; i < ops.fnArray.length; i++) if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject) names.push(ops.argsArray[i][0]);
      for (const name of names) {
        if (seen.has(name)) continue; seen.add(name);
        let img; try { img = page.objs.get(name); } catch { try { img = page.commonObjs.get(name); } catch { continue; } }
        if (!img || !img.width || img.width < opt.min || img.height < opt.min) continue;
        const { width: w, height: h } = img; const ch = img.data.length / (w * h);
        const rgba = Buffer.alloc(w * h * 4);
        for (let i = 0, j = 0; i < w * h; i++, j += 4) {
          if (ch === 4) { rgba[j] = img.data[i * 4]; rgba[j + 1] = img.data[i * 4 + 1]; rgba[j + 2] = img.data[i * 4 + 2]; rgba[j + 3] = img.data[i * 4 + 3]; }
          else if (ch === 3) { rgba[j] = img.data[i * 3]; rgba[j + 1] = img.data[i * 3 + 1]; rgba[j + 2] = img.data[i * 3 + 2]; rgba[j + 3] = 255; }
          else { rgba[j] = rgba[j + 1] = rgba[j + 2] = img.data[i]; rgba[j + 3] = 255; }
        }
        const file = path.join(dir, `p${String(p).padStart(2, "0")}-${name.replace(/[^a-z0-9]/gi, "")}-${w}x${h}.png`);
        await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file);
        // quick classification: near-uniform colour → texture/background; else photo/mockup
        const st = await sharp(file).stats();
        const spread = Math.max(...st.channels.slice(0, 3).map((c) => c.stdev));
        const kind = spread < 18 ? "texture" : "photo";
        manifest.images.push({ file, page: p, width: w, height: h, kind, dominant: "#" + st.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, "0")).join("") });
      }
    }
    console.log(`images: ${manifest.images.length} (≥${opt.min}px) → ${dir}`);
    for (const im of manifest.images) console.log(`  p${im.page} ${im.width}x${im.height} ${im.kind.padEnd(7)} ${im.dominant}  ${path.basename(im.file)}`);
  }

  // ---------- 2. logo cut-out ----------
  if (opt.logoPage != null) {
    const dir = path.join(opt.out, "logo"); fs.mkdirSync(dir, { recursive: true });
    const page = await doc.getPage(opt.logoPage);
    const S = opt.scale; const vp = page.getViewport({ scale: S });
    const cv = createCanvas(vp.width, vp.height); const ctx = cv.getContext("2d");
    try { await page.render({ canvasContext: ctx, viewport: vp, canvasFactory: factory }).promise; }
    catch (e) { console.error(`logo page ${opt.logoPage} failed to render (${String(e.message).slice(0, 60)}) — pick a page without foil/knockout effects`); process.exit(3); }
    // mask text runs (labels like "A.1 MAIN LOGO") so the crop finds only artwork
    const tc = await page.getTextContent(); const H = page.getViewport({ scale: 1 }).height;
    ctx.fillStyle = "#ffffff";
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const [a, b, , , x, y] = it.transform; const size = Math.hypot(a, b);
      ctx.fillRect((x - 2) * S, (H - y - size * 0.95) * S, (it.width + 4) * S, (size * 1.3) * S);
    }
    const png = cv.toBuffer("image/png");
    // Find the artwork on a DOWNSCALED copy (cheap): ink = dark pixels. Connected
    // blobs → keep the largest, merge neighbours within 6% of page width (the
    // wordmark under a mark), ignore distant strays (rules, underlines, margin
    // marks) that a global trim would stretch the crop to include.
    const D = 8; const dw = Math.ceil(vp.width / D), dh = Math.ceil(vp.height / D);
    const small = await sharp(png).resize(dw, dh, { fit: "fill", kernel: "nearest" }).greyscale().raw().toBuffer();
    const mask = new Uint8Array(dw * dh); for (let i = 0; i < dw * dh; i++) mask[i] = small[i] < 215 ? 1 : 0;
    const label = new Int32Array(dw * dh).fill(-1); const comps = [];
    for (let i = 0; i < dw * dh; i++) {
      if (!mask[i] || label[i] >= 0) continue;
      const id = comps.length; const box = { x0: dw, y0: dh, x1: 0, y1: 0, area: 0 }; const stack = [i]; label[i] = id;
      while (stack.length) { const k = stack.pop(); const cx = k % dw, cy = (k - cx) / dw; box.area++; if (cx < box.x0) box.x0 = cx; if (cx > box.x1) box.x1 = cx; if (cy < box.y0) box.y0 = cy; if (cy > box.y1) box.y1 = cy;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue; const n = ny * dw + nx; if (mask[n] && label[n] < 0) { label[n] = id; stack.push(n); } } }
      comps.push(box);
    }
    if (!comps.length) { console.error("no ink found on the logo page"); process.exit(3); }
    comps.sort((a, b) => b.area - a.area);
    const near = Math.round(dw * 0.06); let box = { ...comps[0] }; let merged = true; const used = new Set([0]);
    while (merged) { merged = false; comps.forEach((c, ci) => { if (used.has(ci)) return; const gapX = Math.max(0, c.x0 - box.x1, box.x0 - c.x1), gapY = Math.max(0, c.y0 - box.y1, box.y0 - c.y1); if (gapX <= near && gapY <= near) { box = { x0: Math.min(box.x0, c.x0), y0: Math.min(box.y0, c.y0), x1: Math.max(box.x1, c.x1), y1: Math.max(box.y1, c.y1) }; used.add(ci); merged = true; } }); }
    const W = Math.floor(vp.width), Hh = Math.floor(vp.height); const pad = 2 * D;
    const cx0 = Math.max(0, box.x0 * D - pad), cy0 = Math.max(0, box.y0 * D - pad);
    const cw = Math.min(W, (box.x1 + 1) * D + pad) - cx0, chh = Math.min(Hh, (box.y1 + 1) * D + pad) - cy0;
    console.log(`  artwork: largest of ${comps.length} ink blobs; crop ${cw}x${chh} at ${cx0},${cy0}`);
    // crop the PNG, THEN knock white out to alpha on just the crop
    const { data: raw, info } = await sharp(png).extract({ left: cx0, top: cy0, width: cw, height: chh }).raw().toBuffer({ resolveWithObject: true });
    const rgba = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0, j = 0; i < info.width * info.height; i++, j += 4) { const lum = raw[i * info.channels] * 0.299 + raw[i * info.channels + 1] * 0.587 + raw[i * info.channels + 2] * 0.114; rgba[j] = rgba[j + 1] = rgba[j + 2] = 0; rgba[j + 3] = Math.max(0, Math.min(255, Math.round(255 - lum))); }
    const black = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 10 }).png().toBuffer();
    if (comps.length > used.size) manifest.notes.push(`logo page: ignored ${comps.length - used.size} stray ink element(s) away from the artwork (rules, labels)`);
    const meta = await sharp(black).metadata();
    const save = (buf, name) => { const f = path.join(dir, name); fs.writeFileSync(f, buf); manifest.logo.push({ file: f, width: meta.width, height: meta.height }); return f; };
    save(black, "logo-black.png");
    const tint = async (hex, name) => { const { data: d, info: i2 } = await sharp(black).raw().toBuffer({ resolveWithObject: true }); const R = parseInt(hex.slice(1, 3), 16), G = parseInt(hex.slice(3, 5), 16), B = parseInt(hex.slice(5, 7), 16); for (let j = 0; j < d.length; j += 4) { d[j] = R; d[j + 1] = G; d[j + 2] = B; } save(await sharp(d, { raw: { width: i2.width, height: i2.height, channels: 4 } }).png().toBuffer(), name); };
    await tint("#FFFFFF", "logo-white.png");
    for (const c of opt.colors) if (/^#[0-9a-f]{6}$/i.test(c)) await tint(c, `logo-${c.slice(1).toLowerCase()}.png`);
    console.log(`logo: ${meta.width}x${meta.height} transparent from page ${opt.logoPage} → ${dir} (black, white${opt.colors.length ? ", " + opt.colors.join(", ") : ""})`);
    manifest.notes.push("logo is a high-res raster cut from the vector page (8x); ask for the SVG for print, this is plenty for the 1920 canvas");
  }

  // ---------- 3. page renders ----------
  if (opt.pages.length) {
    const dir = path.join(opt.out, "pages"); fs.mkdirSync(dir, { recursive: true });
    for (const p of opt.pages) {
      try { const page = await doc.getPage(p); const vp = page.getViewport({ scale: 2 }); const cv = createCanvas(vp.width, vp.height);
        await page.render({ canvasContext: cv.getContext("2d"), viewport: vp, canvasFactory: factory }).promise;
        const f = path.join(dir, `p${String(p).padStart(2, "0")}.png`); fs.writeFileSync(f, cv.toBuffer("image/png")); manifest.renders.push(f); console.log(`render: p${p} → ${f}`);
      } catch (e) { manifest.notes.push(`page ${p}: render failed (${String(e.message).slice(0, 50)}) — knockout/soft-mask group; skip it`); console.log(`render: p${p} skipped (foil/knockout effect)`); }
    }
  }

  fs.writeFileSync(path.join(opt.out, "assets.json"), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${path.join(opt.out, "assets.json")}`);
  for (const n of manifest.notes) console.log("note:", n);
})().catch((e) => { console.error(e); process.exit(1); });
