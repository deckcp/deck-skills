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
      "art_direction": {
        "archetype": "cover | statement | big-stat | stat-row | split-feature | media-steps | timeline | table | image-story | comparison | quote-proof | case-study | product | map | section-divider | closing | custom",
        "density": "low | medium | high",
        "rhythm_role": "open | build | proof | pause | turn | peak | close",
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
