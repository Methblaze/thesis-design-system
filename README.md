# Thesis 2.0 design system

The tokens behind the 2.0 redesign of the nutrition-tracking thesis prototype, kept as one source that feeds both Figma and code.

- Figma: [Wireframe sketching](https://www.figma.com/design/fo6dQ2X8bGhxifuz567KjX/Wireframe-sketching?node-id=476-472), pages "2.0 · Design system" and "2.0 · Prototype"
- Themes: Calm light (default), Calm dark, Warm and colourful

## How it fits together

```
tokens/base.json            primitives: color/*, size/*, font/*, typography/*
tokens/themes/*.json        semantic color/* per theme, pointing at primitives
tokens/descriptions.json    one description per semantic token, used everywhere
tokens/checks.json          WCAG pairs checked in every theme
        │
        ├── npm run tokens:build ──► build/tokens.css        CSS variables, :root + [data-theme]
        │                           build/tokens.js         resolved values per theme
        │                           build/tailwind.js       Tailwind theme object
        │                           build/tokens-studio.json  multi-set file for the Tokens Studio plugin
        │                           build/figma.json        input for the native Figma sync
        │                           build/preview.html      the design system page, also published to
        │                                                   portfoliokjaer/public/design-systems/thesis/
        │
        └── npm run tokens:check ─► the proof: names, types, aliases, layers, theme parity,
                                    descriptions, contrast, and drift against tokens/figma-export.json
```

The format is DTCG (`$value`, `$type`, `{alias}`), so the same files work with Style Dictionary, the Tokens Studio plugin and Figma's own variables.

## Changing a token

1. Edit `tokens/base.json`, a file in `tokens/themes/` or `tokens/descriptions.json`.
2. `npm run tokens:build` and `npm run tokens:check`. The check fails on a broken alias, a raw colour in a theme, a missing description or a contrast pair below its minimum.
3. Open `tokens/build/preview.html` to see the change in every theme.
4. Sync Figma, either way:
   - Native: Claude runs `tokens/scripts/figma/figma-sync.js` per collection with the output of `figma-payload.mjs`, then `figma-sync-text.js` for the text styles. Variables keep their IDs, so every binding in the file follows.
   - Tokens Studio: import `tokens/build/tokens-studio.json` in the plugin and apply it to Figma variables.
5. Export Figma back to `tokens/figma-export.json` (`figma-export.mjs`) and run the check again: it must report 0 drift.

## AI readiness

Audited with ds-ai-check on 2026-10-17: 43/100 (D) before the fixes, 75/100 (B) after. See `audits/`. Code Connect, which would lift the score further, needs a Figma Organization or Enterprise Dev seat.
