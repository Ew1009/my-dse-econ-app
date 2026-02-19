# DSE Econ v2.2 — AI Enhanced

## Overview
An interactive HKDSE Economics study app with MCQ practice, long-question drills, AI-powered explanations, and analytics. Features **Safe-Zone + Dual-Label SVG economics diagrams** (v6.0).

---

## Currently Completed Features

### Graph Engine v6.0 (Safe-Zone + Dual Labels Upgrade)
- ✅ **600×480 Canvas**: ViewBox `600×480`. 80px left/bottom margins ensure axis labels (P, Q) are never cropped.
- ✅ **Safe-Zone Coordinate Mapping**: Normalized coordinates (0–1) map to:
  - X-axis: `80 → 520` (440px plot width)
  - Y-axis: `400 → 60` (340px plot height)
  - 80px margins on left and bottom prevent label clipping in all scenarios.
- ✅ **Dual-End Curve Labeling**:
  - Every curve (D, S) gets **TWO labels** — one at each endpoint.
  - **Demand (D)** start-label at TOP-LEFT (`text-anchor="end"`, -15px offset); end-label at BOTTOM-RIGHT (`text-anchor="start"`, +15px offset).
  - **Supply (S)** start-label at BOTTOM-LEFT (`text-anchor="end"`, -15px offset); end-label at TOP-RIGHT (`text-anchor="start"`, +15px offset).
  - Shift-only diagrams (e.g., m157) use `dualLabel: false` for single-end labels.
  - Full collision detection nudges overlapping labels apart.
- ✅ **Axis Label Placement (80/80 Rule)**:
  - P (Y-axis) at `(x: 30, y: 60)` with `text-anchor="start"` — deep inside visible area.
  - Q (X-axis) at `(x: 520, y: 440)` with `text-anchor="start"` — deep inside visible area.
  - Origin "0" at `(plotL - 14, plotB + 22)`.
- ✅ **Anti-Stacking Equilibrium Labels**: All point labels at `y - 20` above the dot with `text-anchor="middle"`. Nudge algorithm prevents overlap.
- ✅ **Answer Point White Halo**: Red (#ef4444) answer points have extra-large white halo stroke (`r + 4`, stroke-width 3) for visibility even when lines pass through.
- ✅ **Dark Mode with `currentColor`**: All axes, arrows, and structural elements use `stroke="currentColor"` and `fill="currentColor"`. CSS variable `--graph-axis` drives the color; dark mode flips automatically.
- ✅ **Explain Mode Colors**: Demand shift = Blue (#3b82f6), Supply shift = Green (#22c55e), Answer point = Red (#ef4444) with r=6 + highlight ring + white halo.
- ✅ **Bold PDF Lines**: stroke-width 3.5 for curves, 2.5 for axes. All text 18–20px Bold.
- ✅ **Containerless Rendering**: `generateSvgConfigHTML()` returns raw SVG in a minimal `<div class="econ-graph-wrap">` — no background, border, or max-width constraint.
- ✅ **Type-Based Diagrams**: sd_cross, sd_shift, sd_floor, sd_ceiling, sd_tax, sd_quota, sd_surplus, lorenz
- ✅ **CSV Data Parser**: `parseCsvToConfig()` converts normalized CSV coordinates into render configs
- ✅ **Legacy Pixel Coord Auto-Scaling**: Coordinates > 1.5 are auto-detected as legacy ~200×200 pixel coords and normalized

### MCQ Practice (Paper 1)
- ✅ Topic-based, Exam, and Quiz modes
- ✅ AI-powered explanations with caching
- ✅ Session history tracking

### Long Questions (Paper 2)
- ✅ Question bank with difficulty filtering
- ✅ Multi-part answers with rich text editor
- ✅ AI feedback with marking scheme

### AI Integration
- ✅ OpenRouter API via backend serverless function
- ✅ Primary model with automatic fallback
- ✅ Jitter delay to avoid rate limiting

### Analytics Dashboard
- ✅ Performance charts (trend, radar, doughnut)
- ✅ Study streak tracking
- ✅ Per-topic accuracy breakdown

---

## Functional Entry URIs

| Path | Description |
|------|-------------|
| `index.html` | Main app — Dashboard, Practice (MCQ + Long Q), Analytics |
| `test-svg.html` | Visual verification page for all graph types (v6.0 Safe-Zone + Dual Labels) |

---

## Key Files

| File | Purpose |
|------|---------|
| `js/app-graphs.js` | v6.0 Safe-Zone + Dual Labels graph engine (SVG generator) |
| `js/questions.js` | MCQ & Long Q question bank with graph configs |
| `js/app-formatters.js` | Question rendering with graph integration |
| `js/app.js` | Main app state & navigation |
| `js/app-mcq.js` | MCQ practice logic |
| `js/app-mcq-session.js` | MCQ session renderer |
| `js/app-longq.js` | Long question landing |
| `js/app-longq-session.js` | Long question session renderer |
| `js/app-ai.js` | AI explanation functions |
| `js/ai-helper.js` | AI API helper with fallback |
| `js/app-analytics.js` | Analytics dashboard |
| `js/app-practice.js` | Unified practice section |
| `css/style.css` | Main styles with theme variables |
| `css/question-formats.css` | Question formatter + graph container styles |
| `test-svg.html` | Graph test/verification page |
| `data/*.json` | Graph coordinate data (normalized 0–1 + raw pixel JSON metadata) |

---

## v6.0 Graph Engine — Technical Details

### Coordinate System
```
ViewBox: 0 0 600 480
Plot Area: (80, 60) → (520, 400)

  x = 80 + normalized_x × 440
  y = 400 - normalized_y × 340

Safe Zone: 80px left margin, 80px bottom margin
           Prevents P/Q axis label cropping in all cases.
```

### Label Positioning Strategy
```
Demand lines (D, D₁, D₂) — DUAL LABELS:
  → Label A at TOP-LEFT end:     text-anchor="end",   offset: dx=-15, dy=-8
  → Label B at BOTTOM-RIGHT end: text-anchor="start",  offset: dx=+15, dy=+18

Supply lines (S, S₁, S₂) — DUAL LABELS:
  → Label A at TOP-RIGHT end:    text-anchor="start", offset: dx=+15, dy=-8
  → Label B at BOTTOM-LEFT end:  text-anchor="end",   offset: dx=-15, dy=+18

Points (E, E₁, W, X, Y, Z):
  → Label ABOVE the dot: dy=-20, text-anchor="middle"
  → Collision detection nudges overlapping labels apart

Axis Labels (80/80 Rule):
  → P (Y-axis): x=30, y=60, text-anchor="start"
  → Q (X-axis): x=520, y=440, text-anchor="start"
```

### Color Scheme
```
Question Mode:  All lines use currentColor (adapts to light/dark)
Explain Mode:   Demand shift = #3b82f6 (blue)
                Supply shift = #22c55e (green)
                Answer point = #ef4444 (red) r=6 + glow ring + white halo
```

### Answer Point Visibility
```
Answer points (Red #ef4444) in explain mode:
  → Extra-large white halo: r+4, stroke-width=3 (white fill + stroke)
  → Main dot: r=6, fill=red, stroke=white
  → Outer glow ring: r+5, stroke=red, opacity=0.5
  → Ensures visibility even when lines pass through the point
```

---

## Data Files (data/*.json)

Each graph has both a **question** and **explain** mode configuration:
- `m167.json` — Imported Japanese Automobiles (D₀,D₁,D₂ + S₀,S₁,S₂)
- `m165.json` — Swine Flu Vaccine (D₀,D₁,D₂ + S₀,S₁,S₂)
- `m162.json` — Milk Powder (D,D₁,D₂ + S,S₁,S₂)
- `m158.json` — Residential Property (D,D₁,D₂ + S,S₁,S₂)
- `m157.json` — Exhibition Spaces (D₁→D₂ shift with arrow, no supply)
- `m154.json` — Hotel Accommodation Macau (D₁,D₂ + S₁,S₂,S₃ with E,W,X,Y,Z)

---

## Recommended Next Steps

1. **Graph engine integration testing** — Run `test-svg.html` to verify all 6 graph sets render correctly in both light and dark modes
2. **Add more question data** — Import additional DSE past paper questions with CSV coordinate data
3. **Performance optimization** — Consider lazy-loading graphs that are off-screen
4. **Print styles** — Add `@media print` rules for PDF export of graphs
5. **Accessibility** — Add ARIA labels and `<title>` elements to SVGs for screen readers
6. **Multi-line axis labels** — Test long axis labels (e.g., "Quantity of imported\nJapanese automobiles") for proper wrapping
