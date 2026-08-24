# Reference Fidelity — when the user says "make it look like this"

A reference deck is not a palette suggestion. It contains a visual grammar.

## Measure before interpreting

When practical, capture:

- canvas dimensions / aspect ratio
- page margins
- headline x/y positions
- headline width and max lines
- font families, sizes, weights, tracking, line height
- repeated chrome positions
- logo position / size
- image rectangles and image coverage ratios
- panel dimensions
- common split ratios
- grid columns / gutters
- rule thickness
- border radius
- spacing between recurring elements
- chart/table treatment
- section-divider behavior

`deckcp-brand-kit/references/match-a-reference-deck.md` contains the technical measurement workflow.

## Convert observations into rules

Weak:

```text
Minimal editorial layout with lots of whitespace.
```

Strong:

```text
Content begins on a fixed left edge at x≈128px. Headline occupies ≤42% of canvas
width and usually stays within two lines. Photography is either edge-to-edge or
contained in a single rectangular panel; no floating card shadows. Accent appears
only in small labels and key numbers. Footer sits on a fixed baseline.
```

## Fidelity hierarchy

For `reference-exact`, prioritize in this order:

1. geometry / composition
2. typography scale and line behavior
3. spacing rhythm
4. surface and color roles
5. imagery crop / treatment
6. chrome and signature devices
7. micro-decoration

Matching colors while missing geometry does not count as a match.

## Source precedence

Use this order:

1. user-provided reference deck explicitly chosen as target
2. user-provided brand/design-system files
3. user-provided branded collateral
4. company website / product UI
5. DeckCP template library
6. DeckCP synthesized defaults

Never let a generic template override a strong user-provided reference.
