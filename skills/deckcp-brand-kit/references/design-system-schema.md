# brand-kit.json — Complete Schema + Structured Design System

`brand-kit.json` keeps the legacy fields so existing DeckCP scripts/generation remain compatible, and adds a structured `design_system` object so design direction and QC do not have to interpret the whole visual system from prose.

## Complete shape

```json
{
  "mode": "extract | synthesize",
  "direction": "named synthesized direction | null for extract",
  "brand_name": "",
  "colors": {
    "Background": { "hex": "#FAFAF7", "source": "site :root --bg", "confidence": "literal | sampled | named | chosen" },
    "Text":       { "hex": "#141414", "source": "", "confidence": "" },
    "Primary":    { "hex": "", "source": "", "confidence": "" },
    "Accent":     { "hex": "", "source": "", "confidence": "" },
    "Secondary":  { "hex": null, "source": "absent in source", "confidence": "" }
  },
  "extra_colors": {
    "Optional descriptive role": { "hex": "", "source": "" }
  },
  "fonts": {
    "display": { "brand": "Söhne", "mapped": "Inter", "why": "" },
    "body":    { "brand": "Inter", "mapped": "Inter", "why": "in catalog" },
    "scripts": [
      { "script": "Korean", "sans": "Noto Sans KR", "serif": "Noto Serif KR" }
    ]
  },
  "logos": {
    "color": "./deck-assets/logo.svg",
    "white": null,
    "icon": null,
    "uploaded": {}
  },
  "surface": {
    "default_variant": "light | dark",
    "mood": "editorial | keynote | null",
    "page_margin": 96
  },
  "design_system": {
    "canvas": {
      "width": 1920,
      "height": 1080,
      "aspect_ratio": "16:9"
    },
    "layout": {
      "margins": { "left": 96, "right": 96, "top": 72, "bottom": 72 },
      "grid": { "columns": 12, "gutter": 24 },
      "common_splits": ["40/60", "50/50"],
      "alignment": "left-led | centered | mixed, with evidence"
    },
    "spacing": {
      "xs": 12,
      "sm": 20,
      "md": 32,
      "lg": 56,
      "xl": 88
    },
    "typography": {
      "eyebrow": {
        "font": null,
        "size": null,
        "weight": null,
        "tracking": null,
        "case": null
      },
      "headline": {
        "font": "mapped display",
        "size": 68,
        "weight": 400,
        "line_height": 1.0,
        "max_lines": 2,
        "max_width": null
      },
      "body": {
        "font": "mapped body",
        "size": 28,
        "weight": 400,
        "line_height": 1.35,
        "max_width": null
      },
      "caption": {
        "font": "mapped body",
        "size": 22,
        "weight": 400,
        "line_height": 1.25
      }
    },
    "chrome": {
      "enabled": false,
      "elements": [],
      "master_candidate": false,
      "notes": "only repeating elements actually present in the source"
    },
    "imagery": {
      "role": "primary | supporting | rare | none",
      "coverage": "full-bleed | panel | cutout | screenshot | mixed | none",
      "crop": "",
      "treatment": "",
      "preferred_sources": ["user assets", "approved brand assets"]
    },
    "containers": {
      "language": "cards | hairlines | flat-panels | editorial-grid | none",
      "radius": null,
      "border": null,
      "shadow": "none | source-derived",
      "rules": []
    },
    "color_jobs": {
      "accent": "one explicit job",
      "primary": "",
      "secondary": ""
    },
    "data_visualization": {
      "chart_style": "",
      "table_style": "",
      "highlight_rule": ""
    },
    "density": {
      "default": "medium",
      "low": "",
      "medium": "",
      "high": ""
    },
    "reference_fidelity": {
      "measured": false,
      "hard_rules": [],
      "soft_rules": []
    }
  },
  "chrome": "legacy prose fallback: repeating frame if one exists",
  "imagery": "legacy prose fallback: image role/crop/treatment",
  "layout_style": "legacy prose fallback: body layout language",
  "graphic_elements": ["source-derived repeated devices"],
  "signature_device": "single most recognizable repeated device, or none",
  "structural_language": "cards | hairlines | flat-panels | editorial-grid | none",
  "guidelines": "2–4 sentences a pipeline can obey",
  "dont": ["source-derived / synthesized restraint rules"],
  "sources": ["logo.svg", "https://example.com", "brand-guide.pdf"]
}
```

## Structured-field guidance

### Canvas + layout

Record canvas size/aspect, margins, grid, common split ratios, alignment behavior, and any measured recurring positions.

### Spacing

Use a small spacing scale. For extraction, infer repeated distances from the reference rather than inventing arbitrary values.

### Typography

Record family, size, weight, tracking, line height, max lines, and max width for roles that actually exist. Do not invent an eyebrow role if the brand does not have one.

### Chrome

`enabled:false` is valid. When true, list only actual repeating elements and whether they should become a master.

### Imagery

Record whether imagery is primary/supporting/rare/none, how it is cropped/contained, and preferred asset sources.

### Containers

Record the system's structural language, radii, borders, shadows, and constraints. A `none` language is valid for open editorial compositions.

### Color jobs

Do not merely list colors; state what each does. One accent with one job is stronger than many interchangeable accents.

### Data visualization

Capture chart/table treatment: gridlines, labels, number emphasis, highlight color, table rules, etc.

### Density

Define low / medium / high in language the build step can obey. Example: low = one focal point + one support line; high = chart/table evidence with strict hierarchy.

### Reference fidelity

When a reference has been measured:

```json
{
  "measured": true,
  "hard_rules": [
    "headline left edge x=128±4px",
    "headline <= 2 lines",
    "content bottom never below y=930px"
  ],
  "soft_rules": [
    "image-led slides feel asymmetric",
    "accent is visually sparse"
  ]
}
```

Hard rules are intended to be checked/obeyed when the DeckCP authoring surface makes that possible. Soft rules are judged visually by `deckcp-design-director` and `deckcp-quality-control`.
