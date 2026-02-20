# DSE Econ — Graph Engine v3.0 Integration

## Overview
Complete rewrite of the standalone Graph Engine (v2.1 → v3.0) for integration into the DSE Economics tutoring app's **Answer Tab** (Long Question diagram pane). The engine is now a proper constructor-based class with dynamic scaling, external configuration, whole-curve interaction, full state serialization, and pedagogical silence.

---

## Currently Completed Features

### 1. Dynamic Scaling ✅
- `GraphEngine` constructor measures parent container dimensions via `getBoundingClientRect()`.
- **ResizeObserver** + `window.resize` listener auto-re-renders when the container changes size.
- Econ coordinate system (0–100 units) stays consistent regardless of pixel dimensions.
- DPR-aware canvas scaling for retina displays.

### 2. Variable Mapping (External Config) ✅
- `new GraphEngine(container, state, config)` accepts a config object:
  - `initialCurves: [{type, label, color, p1:{x,y}, p2:{x,y}}]` — preload curves from question data
  - `theme: 'light' | 'dark' | 'auto'` — syncs with app's dark mode
  - `readOnly: true/false` — disables all pointer events for solution viewing
  - `axisLabels: {x, y, origin}` — custom axis labels
  - `onStateChange: function(state){}` — callback after every mutation (for auto-save)
- Runtime update via `engine.updateConfig({readOnly: true})`.

### 3. Whole-Curve Interaction ✅
- Click & drag a curve by its **body** (not just endpoints): slope is preserved, both endpoints translate by the same delta.
- Endpoint dragging still works independently.
- Attached reference lines and quota lines follow the curve during translation.

### 4. State Export (toJSON / fromJSON) ✅
- `engine.toJSON()` returns a deep clone capturing **everything**:
  - All curves (positions, labels, colors)
  - All manual polygon shading (points, labels, colors)
  - All reference lines (positions, axis labels)
  - All quota lines
  - All horizontal lines
  - All free-text labels
  - Grid visibility, selected curve, current mode
- `engine.fromJSON(savedState)` restores the complete state.
- `engine.toPNG()` exports as data URL (backward compat).

### 5. Pedagogical Silence ✅
- **Zero** automatic equilibrium calculations.
- **Zero** automatic "D" / "S" / "D₁" labeling on curves.
- All new curves have `label: ''` by default.
- Students must manually label via the **Label** tool (click curve → dialog).
- Shaded regions have empty labels until manually set.

---

## File Structure

```
index.html                    Main app entry (updated with graph-engine.js script tag)
integration-demo.html         Standalone demo showing how to embed the engine
js/
  ├── graph-engine.js          ← NEW: Graph Engine v3.0 (constructor-based)
  ├── app-longq-session.js     ← UPDATED: Answer Tab uses GraphEngine instead of GraphTool
  ├── app-graph.js             Legacy GraphTool (kept for backward compat)
  ├── app.js                   Core app state + navigation
  ├── app-graphs.js            SVG diagram generator (unchanged)
  ├── app-ai.js                AI functions (unchanged)
  ├── ai-helper.js             AI helper module (unchanged)
  ├── questions.js             Question bank data (unchanged)
  ├── app-formatters.js        Question formatters (unchanged)
  ├── app-mcq.js               MCQ landing (unchanged)
  ├── app-mcq-session.js       MCQ session (unchanged)
  ├── app-practice.js          Practice section (unchanged)
  ├── app-longq.js             Long Q landing (unchanged)
  └── app-analytics.js         Analytics (unchanged)
css/
  ├── style.css                Main styles
  └── question-formats.css     Question format styles
graph-engine-original.js       Original v2.1 engine (reference copy)
graph-engine-standalone.html   Original standalone demo page
```

---

## Functional Entry URIs

| Path | Description |
|------|-------------|
| `index.html` | Main DSE Econ app (Dashboard → Practice → Long Q → Diagram tab) |
| `integration-demo.html` | Standalone demo of GraphEngine v3.0 with all config toggles |
| `graph-engine-standalone.html` | Original v2.1 standalone demo (preserved for reference) |

---

## Integration Guide

### Minimal Integration (3 lines)

```html
<!-- 1. Include the script -->
<script src="js/graph-engine.js"></script>

<!-- 2. Create a container div -->
<div id="my-graph" style="width:100%; height:400px;"></div>

<script>
// 3. Instantiate
var engine = new GraphEngine(
  document.getElementById('my-graph'),
  initGraphState(),
  {
    theme: 'auto',
    readOnly: false,
    onStateChange: function(state) {
      // Save state to your database
      localStorage.setItem('graph', JSON.stringify(state));
    }
  }
);
</script>
```

### Pre-loading Curves from Question Data

```javascript
var engine = new GraphEngine(container, initGraphState(), {
  initialCurves: [
    { type: 'generic', label: '', color: '#3b82f6', p1: {x:15, y:85}, p2: {x:85, y:15} },
    { type: 'generic', label: '', color: '#ef4444', p1: {x:15, y:15}, p2: {x:85, y:85} }
  ],
  readOnly: false,
  theme: 'auto'
});
```

### Restoring Saved State

```javascript
var savedJSON = JSON.parse(localStorage.getItem('graph'));
if (savedJSON) {
  engine.fromJSON(savedJSON);
}
```

### Switching to Read-Only (Solution View)

```javascript
engine.updateConfig({ readOnly: true });
```

### Answer Tab Integration (app-longq-session.js)

The updated `renderLongQSession()` function:
1. Creates a `<div id="lqGraphContainer">` instead of a `<canvas>`.
2. Instantiates `new GraphEngine(containerEl, graphState, config)`.
3. Wires the toolbar buttons to `engine.setMode()`, `engine.undo()`, etc.
4. Auto-saves state via `onStateChange` callback into `ses.graphStates[partIdx]`.
5. Restores state from `ses.graphStates[partIdx]` on revisit.
6. Calls `engine.destroy()` on re-render to prevent listener leaks.

---

## API Reference

### Constructor
```javascript
var engine = new GraphEngine(containerEl, graphState, config);
```

### Config Object
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `initialCurves` | `Array` | `null` | Pre-load curves from question data |
| `theme` | `String` | `'auto'` | `'light'`, `'dark'`, or `'auto'` |
| `readOnly` | `Boolean` | `false` | Disable all interaction |
| `axisLabels` | `Object` | `{x:'Quantity', y:'Price (HK$)', origin:'0'}` | Custom axis labels |
| `onStateChange` | `Function` | `null` | Called after every state mutation |
| `margin` | `Object` | `{top:24, right:24, bottom:44, left:54}` | Plot area margins (px) |

### Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `render()` | void | Force re-render |
| `updateConfig(cfg)` | void | Update config at runtime |
| `addCurve(opts?)` | `string` | Add a curve, returns its ID |
| `removeCurve(id?)` | void | Remove curve by ID (or selected) |
| `setMode(mode)` | void | Set interaction mode |
| `getMode()` | `string` | Get current mode |
| `undo()` | void | Undo last action |
| `redo()` | void | Redo last undone action |
| `clearAll()` | void | Clear all elements |
| `toJSON()` | `Object` | Export complete state |
| `fromJSON(json)` | void | Restore complete state |
| `toPNG()` | `string` | Export canvas as data URL |
| `destroy()` | void | Clean up listeners & observers |

### Interaction Modes
| Mode | Description |
|------|-------------|
| `curve` | Move mode — drag endpoints or whole curves |
| `draw-curve` | Click 2 points to create a new curve |
| `paint` | Click 4 points to define a shaded polygon |
| `line` | Click to add a horizontal line |
| `quota` | Click a curve to add a quota (vertical) line |
| `reference` | Click a curve to add reference (dashed) lines |
| `label` | Click any element to add/edit labels |
| `eraser` | Click any element to delete it |

---

## Features Not Yet Implemented

- **Curved lines (Bézier)**: Currently only straight-line curves. Bézier control points for demand/supply elasticity would enhance realism.
- **Multi-select**: Select and move multiple curves simultaneously.
- **Snap-to-grid**: Optional snap for precise placement.
- **Arrow tips on axes**: P/Q axis arrows for more standard economics diagrams.
- **Import from SVG**: Load app-graphs.js SVG output back into the interactive engine.

## Recommended Next Steps

1. **Persist graphStates to backend** — Currently saved in client-side session object. Wire `ses.graphStates` to your database (RESTful Table API or Vercel KV).
2. **AI Feedback on Diagrams** — Pass `engine.toJSON()` to the AI prompt so it can analyze student curve placement.
3. **Bézier support** — Add curved demand/supply for realistic diagrams.
4. **Keyboard shortcuts** — Ctrl+Z undo, Ctrl+Y redo, Del to erase selected.
5. **Touch gesture improvements** — Pinch-to-zoom on mobile.

---

## Data Models

### GraphState Object (stored in `ses.graphStates[partIdx]`)
```javascript
{
  curves: [{id, type, label, color, p1:{x,y}, p2:{x,y}}],
  labels: [{id, text, x, y, color, fontSize}],
  shading: [{id, points:[{x,y},...], label, color}],
  referenceLines: [{pointId, curveId, attachment, t, pointX, pointY, labels:{horizontal, vertical}}],
  quotas: [{curveId, pointId, attachment, t, x, start_y, end_y, label}],
  lines: [{type, position, label}],
  showGrid: true,
  selectedCurve: null,
  mode: 'curve'
}
```
