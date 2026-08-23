#!/usr/bin/env node
/**
 * spine.js — print the headline-only read of a deck. Zero model tokens.
 *
 * The first critique test is mechanical: strip everything but the headlines
 * and see whether they still make an argument. This prints that list from
 * whatever you have:
 *   outline.json   (deck-outline output: slides[].headline / purpose)
 *   deck.json      (a saved get_deck result: slides[].frontmatter.title)
 *   brief.json     (deck-interview output: prints audience / ask / weakest so
 *                   the critique can be held against them)
 *   anything.md    (lines starting with # or a numbered list)
 *
 * Usage: node spine.js [./deck-brief/outline.json | ./deck-brief/deck.json | file.md]...
 *        (no args → tries ./deck-brief/brief.json, outline.json, deck.json)
 */
"use strict";
const fs = require("fs");
const path = require("path");

let files = process.argv.slice(2);
if (!files.length) files = ["./deck-brief/brief.json", "./deck-brief/outline.json", "./deck-brief/deck.json"].filter((f) => fs.existsSync(f));
if (!files.length) { console.error("nothing to read — pass outline.json, a saved get_deck JSON, or a .md"); process.exit(1); }

for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`\n== ${f}: not found`); continue; }
  const ext = path.extname(f).toLowerCase();
  const raw = fs.readFileSync(f, "utf8");
  console.log(`\n== ${f}`);
  if (ext === ".json") {
    let j; try { j = JSON.parse(raw); } catch (e) { console.log("   not JSON:", e.message); continue; }
    if (j.audience && j.ask && !j.slides) {
      // brief.json
      const a = typeof j.audience === "object" ? j.audience : { who: j.audience };
      console.log(`   type: ${j.deck_type || "?"} · setting: ${j.setting || "?"}`);
      console.log(`   audience: ${a.who || "?"}${a.skeptical_of ? " — skeptical of: " + a.skeptical_of : ""}`);
      console.log(`   success: ${j.success_outcome || "?"}`);
      console.log(`   ask: ${j.ask}`);
      const proof = Array.isArray(j.proof) ? j.proof : [];
      console.log(`   proof: ${proof.length ? proof.map((p) => `${p.claim} [${p.kind || "?"}]`).join("; ") : "NONE"}`);
      if (j.assessment) console.log(`   weakest (per brief): ${j.assessment.weakest || "?"}`);
      const obj = Array.isArray(j.objections) ? j.objections : [];
      if (obj.length) console.log(`   objections: ${obj.map((o) => o.objection).join(" · ")}`);
      continue;
    }
    const slides = Array.isArray(j.slides) ? j.slides : [];
    if (!slides.length) { console.log("   no slides[]"); continue; }
    slides.forEach((s, i) => {
      const n = s.n ?? s.slide_order ?? i + 1;
      const headline = s.headline ?? (s.frontmatter && s.frontmatter.title) ?? s.title ?? "(no headline)";
      const purpose = s.purpose ? ` (${s.purpose})` : s.frontmatter && s.frontmatter.variant ? ` [${s.frontmatter.variant}]` : "";
      const evidence = s.evidence ? `  ← ${s.evidence}` : "";
      console.log(`   ${String(n).padStart(3)}  ${headline}${purpose}${evidence}`);
    });
    if (j.ask) console.log(`   ask: ${j.ask}`);
    if (Array.isArray(j.cut) && j.cut.length) console.log(`   cut: ${j.cut.join(" · ")}`);
  } else {
    const lines = raw.split(/\r?\n/).filter((l) => /^\s*(#{1,3}\s|\d+[.)]\s)/.test(l));
    if (!lines.length) console.log("   no headings or numbered lines found");
    for (const l of lines) console.log("   " + l.trim());
  }
}
console.log("\nRead the headlines in order. If they don't make the argument on their own, that's finding #1.");
