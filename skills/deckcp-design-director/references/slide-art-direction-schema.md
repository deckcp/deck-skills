# Schemas — design-direction.json + slide-plan.json

These schemas are intentionally plain JSON. Extra fields are allowed when useful.

## design-direction.json

```json
{
  "build_mode": "fast | brand | reference-exact",
  "direction": {
    "name": "",
    "one_line": "",
    "brand_character": [""],
    "composition_strategy": "",
    "typography_strategy": "",
    "imagery_strategy": "",
    "data_strategy": "",
    "signature_moves": [""],
    "restraint_rules": [""]
  },
  "binding_rules": {
    "accent_job": "",
    "chrome_behavior": "",
    "grid_behavior": "",
    "density_default": "low | medium | high",
    "intentional_repetition": "",
    "reference_fidelity": [""]
  },
  "visual_media_mix": {
    "typography_led": "30-45%",
    "photography": "10-25%",
    "diagrammatic": "15-30%",
    "data_visualization": "10-20%",
    "illustration_or_pictogram": "5-20%"
  },
  "iconography_direction": {
    "enabled": true,
    "style": "minimal custom pictogram",
    "stroke": "medium",
    "geometry": "angular and architectural",
    "fill": "mostly outline with occasional solid accent",
    "color_usage": "primary foreground plus accent only for emphasis",
    "container": "none",
    "corner_language": "sharp",
    "detail_level": "low",
    "avoid": ["icons inside circles", "generic corporate icon libraries", "mixed icon styles", "emoji", "3D icons", "decorative icons with no semantic job"]
  },
  "rhythm": {
    "opening": "",
    "density_arc": "",
    "image_arc": "",
    "section_punctuation": "",
    "peak_slide": 0,
    "closing": ""
  },
  "anti_patterns": [""]
}
```

## slide-plan.json

```json
{
  "deck_type": "",
  "design_direction": "name from design-direction.json",
  "slides": [
    {
      "n": 1,
      "purpose": "hook",
      "headline": "conclusion, not topic",
      "key_points": [""],
      "evidence": null,
      "visual": "photo | chart | diagram | product | table | none",
      "visual_translation": {
        "needed": true,
        "type": "photography | pictogram | iconography | diagram | process | timeline | map | spatial-plan | data-viz | illustration | annotated-image | product-visual | symbol | none",
        "concept": "concrete description of the visual idea, or null",
        "communication_job": "what the audience should understand faster/better, or null",
        "source": "concept | data | process | geography | product | people | spatial | comparison | sequence | brand | none",
        "priority": "primary | supporting | optional"
      },
      "art_direction": {
        "archetype": "cover | statement | big-stat | stat-row | split-feature | media-steps | timeline | table | image-story | comparison | quote-proof | case-study | product | map | section-divider | closing | spatial-explainer | visual-sequence | pictogram-system | annotated-visual | cluster-map | proportion-graphic | custom",
        "density": "low | medium | high",
        "rhythm_role": "open | build | explain | proof | pause | turn | peak | close",
        "focal_point": "",
        "composition": "",
        "hierarchy": ["headline", "primary visual", "supporting copy"],
        "imagery_treatment": "",
        "data_treatment": "",
        "accent_job": "",
        "master": null,
        "repetition_intent": null,
        "avoid": [""]
      }
    }
  ]
}
```

## Rules

- `composition` describes spatial intent, not implementation syntax.
- `focal_point` must be singular.
- `hierarchy` is ordered from strongest to weakest.
- `repetition_intent` is set only when the slide deliberately shares a layout with another slide or series.
- `master` is a desired semantic master id; the build skill may map it to an available DeckCP master.
- Keep the old top-level `visual` field for compatibility with existing pipeline mappings.

### Visual storytelling fields (v0.8.1 — additive, all optional)

- **`visual_translation`** (per slide) — decides whether the slide's key idea should become a
  visual and, if so, which representation and how concretely. **Optional and backward
  compatible**: a slide plan without it stays valid. When present with `needed:false`, every
  other field may be `none`/`null` — that is the correct shape for a typography-led slide, and
  QC must not demand a graphic for it. `concept` must be concrete ("top-down grill + counter
  seating"), never "use icons" / "add diagram". `type` extends, not replaces, the coarse
  top-level `visual`.
- **`visual_media_mix`** (deck level) — directional ranges to prevent accidental monotony,
  **not quotas**. Omit it entirely for a purely typographic deck. The system must never force
  every category into every deck.
- **`iconography_direction`** (deck level) — one consistent icon/pictogram style + avoid-list,
  or `{ "enabled": false }` when icons are not appropriate. Icons are never required.
- New archetype variants (`spatial-explainer`, `visual-sequence`, `pictogram-system`,
  `annotated-visual`, `cluster-map`, `proportion-graphic`) are documented in
  `../../deckcp-build-deck/references/layout-archetypes.md` as guidance on existing archetypes,
  not a larger taxonomy.
