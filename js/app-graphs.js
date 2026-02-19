/* ==================================================================
   DSE Economics Graph / Diagram Generator — v6.0 SAFE-ZONE + DUAL LABELS
   
   CHANGELOG v6.0:
   ─────────────────────────────────────────────────────────────────
   1. SAFE-ZONE CANVAS: viewBox 600×480. 80px left/bottom margins.
      Mapping:
        X-axis: normalized x (0→1) maps to  80 → 520  (440px plot width)
        Y-axis: normalized y (0→1) maps to 400 → 60   (340px plot height)
      Massive margins prevent P/Q axis label cropping.

   2. DUAL-END CURVE LABELING:
      Every curve gets TWO labels — one at each endpoint.
      • Label A at (x1, y1): offset 15px, text-anchor="end" for starts.
      • Label B at (x2, y2): offset 15px, text-anchor="start" for ends.
      Demand (D) start-label at top-left, end-label at bottom-right.
      Supply (S) start-label at bottom-left, end-label at top-right.
      Anti-stacking collision detection nudges overlapping labels.

   3. AXIS LABEL PLACEMENT (80/80 Rule):
      P (Y-axis) at (x: 30, y: 60) text-anchor="start" — deep inside.
      Q (X-axis) at (x: 520, y: 440) text-anchor="start" — deep inside.
      No cropping possible.

   4. EQUILIBRIUM LABEL ANTI-STACKING:
      All point labels at y - 20 above the dot.
      Answer point (Red #ef4444) has white halo stroke for visibility.

   5. DARK MODE CONSISTENCY:
      stroke="currentColor" + fill="currentColor" on all structural.
      CSS variable --graph-axis drives color; auto-flips in dark mode.
      Explain-mode: Demand shift = Blue (#3b82f6),
                    Supply shift = Green (#22c55e),
                    Answer point = Red (#ef4444) r=6.

   6. BOLD PDF LINES: stroke-width 3.5 for curves, 2.5 for axes.
      All text 18–20px Bold.

   7. CONTAINERLESS: generateSvgConfigHTML() returns raw SVG
      in a minimal wrapper div — no background, border, or padding.
   ─────────────────────────────────────────────────────────────────
   
   Supported renderers:
   A) svg_config: Strict coordinate renderer for exam-accurate PDFs
      - Uses normalized 0–1 coordinates from CSV data
      - OR uses raw pixel coords from JSON (auto-detected)
      - Dual-end labeling for all curves
   B) type-based: Computed diagrams (sd_cross, sd_shift, etc.)
   ================================================================== */

/* ---- SVG namespace helper ---- */
var GRAPH_NS = 'http://www.w3.org/2000/svg';

/* ============================================================
   v6 SAFE-ZONE DIMENSIONS — 600×480 canvas, 80px margins
   ============================================================ */
var V4 = {
  W: 600,
  H: 480,

  /* Plot boundaries — 80px left/bottom safe zone for axis labels */
  plotL: 80,    // left edge (massive room for Y-axis label "P")
  plotT: 60,    // top edge  (room for arrow tip + top labels)
  plotR: 520,   // right edge (room for right-end curve labels)
  plotB: 400,   // bottom edge (80px room for X-axis label "Q")

  get plotW() { return this.plotR - this.plotL; },  // 440
  get plotH() { return this.plotB - this.plotT; },  // 340

  /* Map normalized x (0→1) to SVG pixel x */
  nx: function(frac) { return this.plotL + frac * this.plotW; },
  /* Map normalized y (0→1) to SVG pixel y  (0=bottom-left, 1=top) */
  ny: function(frac) { return this.plotB - frac * this.plotH; }
};


/* ============================================================
   TYPE-BASED DIMENSIONS (sd_cross, sd_shift, etc.)
   Uses same safe-zone canvas
   ============================================================ */
var GW = V4.W, GH = V4.H;
var GM = { l: V4.plotL, r: V4.W - V4.plotR, t: V4.plotT, b: V4.H - V4.plotB };
var PW = V4.plotW;
var PH = V4.plotH;


/* ============================================================
   COLOR PALETTE — All theme-aware via CSS variables
   ============================================================ */
var GC = {
  /* Axis / structural — uses currentColor so it flips with theme */
  axis:      'var(--graph-axis, currentColor)',
  axisLabel: 'var(--graph-axis-label, currentColor)',

  /* Base curve color in question mode — use currentColor */
  base:      'var(--graph-axis, currentColor)',

  /* Explicit type-based curve colors (for computed graphs) */
  demand:    '#3B82F6',
  supply:    '#EF4444',

  /* Explain-mode shift highlighting */
  demandShift: '#3b82f6',   // blue for demand shifts
  supplyShift: '#22c55e',   // green for supply shifts
  answer:      '#ef4444',   // red for answer point

  /* Legacy high-contrast aliases */
  demand2:   '#3b82f6',
  supply2:   '#22c55e',

  /* Points & dashes */
  eq:        '#10B981',
  dash:      'var(--graph-dash, #94a3b8)',
  halo:      'var(--graph-point-halo, #ffffff)',

  /* Fills */
  fill:      'rgba(59,130,246,0.08)',
  fillCS:    'rgba(59,130,246,0.12)',
  fillPS:    'rgba(239,68,68,0.12)',
  fillDWL:   'rgba(245,158,11,0.18)',

  /* Specialty */
  lorenz1:   '#3B82F6',
  lorenz2:   '#EF4444',
  equality:  'var(--graph-dash, #94a3b8)',
  priceLine: '#A855F7',
  grid:      'var(--graph-grid, #e2e8f0)'
};


/* ============================================================
   STROKE CONSTANTS — Bold PDF-like
   ============================================================ */
var SW = {
  axis: 2.5,
  curve: 3.5,
  dash: 1.2,
  arrow: 2.5,
  priceLine: 2.5,
  grid: 0.5,
  halo: 3
};


/* ============================================================
   FONT CONSTANTS — Large, bold, academic
   ============================================================ */
var GF = {
  family:     "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  axisLabel:  20,
  curveLabel: 18,
  pointLabel: 18,
  tickLabel:  14,
  smallLabel: 13
};


/* ============================================================
   HELPER: SVG open tag
   ============================================================ */
function svgOpen(w, h, cls) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h
    + '" class="econ-graph-svg ' + (cls || '')
    + '" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;color:var(--graph-axis,currentColor)">';
}


/* ============================================================
   HELPER: Axes with arrow tips (type-based renderer)
   ============================================================ */
function svgAxes(xLabel, yLabel) {
  var ox = V4.plotL, oy = V4.plotT;
  var bx = V4.plotL, by = V4.plotB;
  var ex = V4.plotR, ey = V4.plotB;
  var s = '';

  // Y axis
  s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + bx + '" y2="' + by + '" stroke="currentColor" stroke-width="' + SW.axis + '"/>';
  // X axis
  s += '<line x1="' + bx + '" y1="' + by + '" x2="' + ex + '" y2="' + ey + '" stroke="currentColor" stroke-width="' + SW.axis + '"/>';

  // Arrow tips
  s += '<polygon points="' + (ox - 6) + ',' + (oy + 12) + ' ' + ox + ',' + oy + ' ' + (ox + 6) + ',' + (oy + 12) + '" fill="currentColor"/>';
  s += '<polygon points="' + (ex - 12) + ',' + (ey - 6) + ' ' + ex + ',' + ey + ' ' + (ex - 12) + ',' + (ey + 6) + '" fill="currentColor"/>';

  // Y-axis label: deep inside safe zone at (30, 60) text-anchor="start"
  s += '<text x="30" y="' + (oy) + '" text-anchor="start" class="econ-graph-label" fill="currentColor">' + (yLabel || 'P') + '</text>';
  // X-axis label: deep inside safe zone at (plotR, 440) text-anchor="start"
  s += '<text x="' + ex + '" y="' + (ey + 32) + '" text-anchor="start" class="econ-graph-label" fill="currentColor">' + (xLabel || 'Q') + '</text>';

  // Origin
  s += '<text x="' + (V4.plotL - 14) + '" y="' + (V4.plotB + 22) + '" text-anchor="end" class="econ-graph-label-sm" fill="currentColor">0</text>';
  return s;
}


/* ============================================================
   HELPER: Dashed lines from point to axes
   ============================================================ */
function svgDash(x, y, showX, showY, labelX, labelY, dashColor) {
  var dc = dashColor || GC.dash;
  var s = '';
  if (showX !== false) {
    s += '<line x1="' + V4.plotL + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" stroke="' + dc + '" stroke-width="' + SW.dash + '" stroke-dasharray="6 5"/>';
    if (labelY) s += '<text x="' + (V4.plotL - 10) + '" y="' + (y + 5) + '" text-anchor="end" class="econ-graph-label-sm" fill="currentColor">' + labelY + '</text>';
  }
  if (showY !== false) {
    s += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + V4.plotB + '" stroke="' + dc + '" stroke-width="' + SW.dash + '" stroke-dasharray="6 5"/>';
    if (labelX) s += '<text x="' + x + '" y="' + (V4.plotB + 20) + '" text-anchor="middle" class="econ-graph-label-sm" fill="currentColor">' + labelX + '</text>';
  }
  return s;
}


/* ============================================================
   HELPER: Labeled point (halo + dot + label)
   ============================================================ */
function svgPoint(x, y, label, pos, color) {
  var c = color || GC.eq;
  var dx = 0, dy = 0;
  if (pos === 'tr')      { dx = 12;  dy = -10; }
  else if (pos === 'tl') { dx = -12; dy = -10; }
  else if (pos === 'br') { dx = 12;  dy = 22;  }
  else if (pos === 'bl') { dx = -12; dy = 22;  }
  else if (pos === 'r')  { dx = 15;  dy = 5;   }
  else if (pos === 'l')  { dx = -15; dy = 5;   }
  else if (pos === 't')  { dx = 0;   dy = -14; }
  else if (pos === 'b')  { dx = 0;   dy = 24;  }
  else                   { dx = 12;  dy = -10; }

  var s = '';
  s += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + GC.halo + '" stroke="none"/>';
  s += '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + c + '" stroke="' + GC.halo + '" stroke-width="' + SW.halo + '"/>';
  var anch = dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle';
  s += '<text x="' + (x + dx) + '" y="' + (y + dy) + '" text-anchor="' + anch + '" class="econ-graph-point-label" fill="' + c + '">' + (label || '') + '</text>';
  return s;
}


/* ============================================================
   HELPER: Line with optional label
   ============================================================ */
function svgLine(x1, y1, x2, y2, color, width, label, labelPos) {
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (width || SW.curve) + '"/>';
  if (label) {
    var lx, ly;
    if (labelPos === 'start') { lx = x1; ly = y1; }
    else { lx = x2; ly = y2; }
    s += '<text x="' + (lx + 10) + '" y="' + (ly + 5) + '" class="econ-graph-curve-label" fill="' + color + '">' + label + '</text>';
  }
  return s;
}


/* ============================================================
   HELPER: Shift arrow
   ============================================================ */
function svgArrow(x1, y1, x2, y2, color) {
  var dx = x2 - x1, dy = y2 - y1;
  var len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return '';
  var ux = dx / len, uy = dy / len;
  var ax = x2 - ux * 9, ay = y2 - uy * 9;
  var perpx = -uy * 5.5, perpy = ux * 5.5;
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + SW.arrow + '" stroke-dasharray="6 4"/>';
  s += '<polygon points="' + x2 + ',' + y2 + ' ' + (ax + perpx) + ',' + (ay + perpy) + ' ' + (ax - perpx) + ',' + (ay - perpy) + '" fill="' + color + '"/>';
  return s;
}


/* ============================================================
   COORDINATE SYSTEM (type-based)
   ============================================================ */
function px(frac) { return V4.plotL + frac * PW; }
function py(frac) { return V4.plotT + (1 - frac) * PH; }

function demandLine(offset) {
  var o = offset || 0;
  return { x1: 0.05 + o, y1: 0.92, x2: 0.92 + o, y2: 0.08 };
}

function supplyLine(offset) {
  var o = offset || 0;
  return { x1: 0.05 + o, y1: 0.08, x2: 0.92 + o, y2: 0.92 };
}

function lineIntersect(l1, l2) {
  var a1 = l1.y2 - l1.y1, b1 = l1.x1 - l1.x2, c1 = a1 * l1.x1 + b1 * l1.y1;
  var a2 = l2.y2 - l2.y1, b2 = l2.x1 - l2.x2, c2 = a2 * l2.x1 + b2 * l2.y1;
  var det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 0.0001) return { x: 0.5, y: 0.5 };
  return { x: (c1 * b2 - c2 * b1) / det, y: (a1 * c2 - a2 * c1) / det };
}

function svgEconLine(line, color, label, labelEnd) {
  var x1 = px(line.x1), y1 = py(line.y1);
  var x2 = px(line.x2), y2 = py(line.y2);
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + SW.curve + '"/>';
  if (label) {
    if (labelEnd === 'start') {
      s += '<text x="' + (x1 - 6) + '" y="' + (y1 - 10) + '" class="econ-graph-curve-label" fill="' + color + '">' + label + '</text>';
    } else {
      s += '<text x="' + (x2 + 8) + '" y="' + (y2 + 6) + '" class="econ-graph-curve-label" fill="' + color + '">' + label + '</text>';
    }
  }
  return s;
}


/* ============================================================
   TYPE 1: sd_cross
   ============================================================ */
function renderSdCross(cfg) {
  var lb = cfg.labels || {};
  var pts = lb.points || ['E₁', 'E₂', 'E₃', 'E₄'];
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  var eqX = px(eq.x), eqY = py(eq.y);

  var spread = 0.17;
  var qpts = [
    { x: eq.x - spread, y: eq.y + spread, pos: 'tl' },
    { x: eq.x + spread, y: eq.y + spread, pos: 'tr' },
    { x: eq.x + spread, y: eq.y - spread, pos: 'br' },
    { x: eq.x - spread, y: eq.y - spread, pos: 'bl' }
  ];

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');
  svg += svgDash(eqX, eqY, true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(eqX, eqY, lb.eq || 'E', 'tr', GC.eq);

  for (var i = 0; i < pts.length && i < 4; i++) {
    svg += svgPoint(px(qpts[i].x), py(qpts[i].y), pts[i], qpts[i].pos, GC.dash);
  }

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 2: sd_shift
   ============================================================ */
function renderSdShift(cfg) {
  var lb = cfg.labels || {};
  var shift = cfg.shift || 'demand';
  var shiftDir = cfg.shiftDir || 'right';
  var offset = 0.15;

  var d1 = demandLine(), s1 = supplyLine();
  var d2 = d1, s2 = s1;

  var dDir = typeof shiftDir === 'object' ? shiftDir.demand : (shift === 'demand' || shift === 'both' ? shiftDir : null);
  var sDir = typeof shiftDir === 'object' ? shiftDir.supply : (shift === 'supply' || shift === 'both' ? shiftDir : null);

  if (dDir) d2 = demandLine(dDir === 'right' ? offset : -offset);
  if (sDir) s2 = supplyLine(sDir === 'right' ? offset : -offset);

  var eq1 = lineIntersect(d1, s1);
  var eq2 = lineIntersect(
    (shift === 'demand' || shift === 'both') ? d2 : d1,
    (shift === 'supply' || shift === 'both') ? s2 : s1
  );

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d1, GC.demand, lb.demand || 'D₁');
  svg += svgEconLine(s1, GC.supply, lb.supply || 'S');

  if (dDir) {
    svg += svgEconLine(d2, GC.demand2, lb.demand2 || 'D₂');
    var midD = { x: (d1.x1 + d1.x2) / 2, y: (d1.y1 + d1.y2) / 2 };
    var arrowOff = dDir === 'right' ? offset * 0.5 : -offset * 0.5;
    svg += svgArrow(px(midD.x), py(midD.y), px(midD.x + arrowOff), py(midD.y), GC.demand2);
  }
  if (sDir) {
    svg += svgEconLine(s2, GC.supply2, lb.supply2 || 'S₂');
    var midS = { x: (s1.x1 + s1.x2) / 2, y: (s1.y1 + s1.y2) / 2 };
    var arrowOffS = sDir === 'right' ? offset * 0.5 : -offset * 0.5;
    svg += svgArrow(px(midS.x), py(midS.y), px(midS.x + arrowOffS), py(midS.y), GC.supply2);
  }

  svg += svgDash(px(eq1.x), py(eq1.y), true, true, '', '');
  svg += svgPoint(px(eq1.x), py(eq1.y), lb.eq || 'E', 'tl', GC.eq);
  svg += svgDash(px(eq2.x), py(eq2.y), true, true, '', '');
  svg += svgPoint(px(eq2.x), py(eq2.y), lb.eq2 || 'E\'', 'tr', GC.demand2);

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 3: sd_shift_cross
   ============================================================ */
function renderSdShiftCross(cfg) {
  var lb = cfg.labels || {};
  var pts = lb.points || ['E₁', 'E₂', 'E₃', 'E₄'];
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  var eqX = px(eq.x), eqY = py(eq.y);

  var spread = 0.17;
  var qpts = [
    { x: eq.x - spread, y: eq.y + spread, pos: 'tl' },
    { x: eq.x + spread, y: eq.y + spread, pos: 'tr' },
    { x: eq.x + spread, y: eq.y - spread, pos: 'br' },
    { x: eq.x - spread, y: eq.y - spread, pos: 'bl' }
  ];

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');

  svg += '<line x1="' + V4.plotL + '" y1="' + eqY + '" x2="' + V4.plotR + '" y2="' + eqY + '" stroke="' + GC.dash + '" stroke-width="' + (SW.dash * 0.8) + '" stroke-dasharray="6 5"/>';
  svg += '<line x1="' + eqX + '" y1="' + V4.plotT + '" x2="' + eqX + '" y2="' + V4.plotB + '" stroke="' + GC.dash + '" stroke-width="' + (SW.dash * 0.8) + '" stroke-dasharray="6 5"/>';

  svg += svgPoint(eqX, eqY, lb.eq || 'E₀', 'tr', GC.eq);

  for (var i = 0; i < pts.length && i < 4; i++) {
    svg += svgPoint(px(qpts[i].x), py(qpts[i].y), pts[i], qpts[i].pos, GC.dash);
  }

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 4: sd_floor
   ============================================================ */
function renderSdFloor(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  var floorY = eq.y + 0.18;

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');

  svg += '<line x1="' + V4.plotL + '" y1="' + py(floorY) + '" x2="' + V4.plotR + '" y2="' + py(floorY) + '" stroke="' + GC.priceLine + '" stroke-width="' + SW.priceLine + '" stroke-dasharray="8 5"/>';
  svg += '<text x="' + (V4.plotR + 6) + '" y="' + (py(floorY) + 5) + '" class="econ-graph-label-sm" fill="' + GC.priceLine + '">' + (lb.floor || 'Pf') + '</text>';

  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);

  var qdFrac = eq.x - (floorY - eq.y) * (d.x2 - d.x1) / (d.y2 - d.y1);
  var qsFrac = eq.x + (floorY - eq.y) * (s.x2 - s.x1) / (s.y2 - s.y1);

  svg += svgDash(px(qdFrac), py(floorY), false, true, lb.qd || 'Qd', '');
  svg += svgDash(px(qsFrac), py(floorY), false, true, lb.qs || 'Qs', '');

  svg += '<text x="' + px((qdFrac + qsFrac) / 2) + '" y="' + (py(floorY) - 12) + '" text-anchor="middle" class="econ-graph-label-xs" fill="' + GC.priceLine + '">Excess supply</text>';

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 5: sd_ceiling
   ============================================================ */
function renderSdCeiling(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  var ceilY = eq.y - 0.18;

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');

  svg += '<line x1="' + V4.plotL + '" y1="' + py(ceilY) + '" x2="' + V4.plotR + '" y2="' + py(ceilY) + '" stroke="' + GC.priceLine + '" stroke-width="' + SW.priceLine + '" stroke-dasharray="8 5"/>';
  svg += '<text x="' + (V4.plotR + 6) + '" y="' + (py(ceilY) + 5) + '" class="econ-graph-label-sm" fill="' + GC.priceLine + '">' + (lb.ceiling || 'Pc') + '</text>';

  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);

  var qdFrac = eq.x + (eq.y - ceilY) * (d.x2 - d.x1) / (d.y1 - d.y2);
  var qsFrac = eq.x - (eq.y - ceilY) * (s.x2 - s.x1) / (s.y2 - s.y1);

  svg += svgDash(px(qdFrac), py(ceilY), false, true, lb.qd || 'Qd', '');
  svg += svgDash(px(qsFrac), py(ceilY), false, true, lb.qs || 'Qs', '');

  svg += '<text x="' + px((qsFrac + qdFrac) / 2) + '" y="' + (py(ceilY) + 24) + '" text-anchor="middle" class="econ-graph-label-xs" fill="' + GC.priceLine + '">Shortage</text>';

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 6: sd_tax
   ============================================================ */
function renderSdTax(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s1 = supplyLine();
  var s2 = supplyLine(-0.15);
  var eq1 = lineIntersect(d, s1);
  var eq2 = lineIntersect(d, s2);

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s1, GC.supply, lb.supply || 'S');
  svg += svgEconLine(s2, GC.supply2, lb.supply2 || 'S + Tax');

  var midS = { x: (s1.x1 + s1.x2) / 2, y: (s1.y1 + s1.y2) / 2 };
  svg += svgArrow(px(midS.x), py(midS.y), px(midS.x - 0.075), py(midS.y), GC.supply2);

  svg += svgDash(px(eq1.x), py(eq1.y), true, true, lb.q1 || 'Q₁', lb.p1 || 'P₁');
  svg += svgPoint(px(eq1.x), py(eq1.y), lb.eq || 'E₁', 'tr', GC.eq);
  svg += svgDash(px(eq2.x), py(eq2.y), true, true, lb.q2 || 'Q₂', lb.p2 || 'P₂');
  svg += svgPoint(px(eq2.x), py(eq2.y), lb.eq2 || 'E₂', 'tl', GC.supply2);

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 7: sd_quota
   ============================================================ */
function renderSdQuota(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  var quotaX = eq.x - 0.15;

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');

  svg += '<line x1="' + px(quotaX) + '" y1="' + V4.plotT + '" x2="' + px(quotaX) + '" y2="' + V4.plotB + '" stroke="' + GC.priceLine + '" stroke-width="' + SW.priceLine + '" stroke-dasharray="8 5"/>';
  svg += '<text x="' + px(quotaX) + '" y="' + (V4.plotT - 8) + '" text-anchor="middle" class="econ-graph-label-sm" fill="' + GC.priceLine + '">Quota</text>';
  svg += '<text x="' + px(quotaX) + '" y="' + (V4.plotB + 20) + '" text-anchor="middle" class="econ-graph-label-sm" fill="currentColor">' + (lb.q1 || 'Q₁') + '</text>';

  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 8: sd_surplus
   ============================================================ */
function renderSdSurplus(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  var topD = { x: d.x1, y: d.y1 };
  var botS = { x: s.x1, y: s.y1 };

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);

  if (cfg.showCS !== false) {
    svg += '<polygon points="' + px(topD.x) + ',' + py(topD.y) + ' ' + px(eq.x) + ',' + py(eq.y) + ' ' + V4.plotL + ',' + py(eq.y) + '" fill="' + GC.fillCS + '" stroke="none"/>';
    svg += '<text x="' + (px(topD.x) + 24) + '" y="' + py((topD.y + eq.y) / 2) + '" class="econ-graph-label-xs" fill="' + GC.demand + '">CS</text>';
  }
  if (cfg.showPS !== false) {
    svg += '<polygon points="' + V4.plotL + ',' + py(eq.y) + ' ' + px(eq.x) + ',' + py(eq.y) + ' ' + px(botS.x) + ',' + py(botS.y) + '" fill="' + GC.fillPS + '" stroke="none"/>';
    svg += '<text x="' + (px(botS.x) + 24) + '" y="' + (py((botS.y + eq.y) / 2) + 5) + '" class="econ-graph-label-xs" fill="' + GC.supply + '">PS</text>';
  }

  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');
  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);

  if (lb.areaPoints) {
    lb.areaPoints.forEach(function(ap) {
      svg += svgPoint(px(ap.x), py(ap.y), ap.label, ap.pos || 'tr', ap.color || GC.axis);
    });
  }

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 9: lorenz
   ============================================================ */
function renderLorenz(cfg) {
  var lb = cfg.labels || {};
  var curves = cfg.curves || 1;

  var svg = svgOpen(GW, GH, 'lorenz');
  var ox = V4.plotL, oy = V4.plotB;

  svg += '<line x1="' + ox + '" y1="' + V4.plotT + '" x2="' + ox + '" y2="' + oy + '" stroke="currentColor" stroke-width="' + SW.axis + '"/>';
  svg += '<line x1="' + ox + '" y1="' + oy + '" x2="' + V4.plotR + '" y2="' + oy + '" stroke="currentColor" stroke-width="' + SW.axis + '"/>';

  svg += '<polygon points="' + (ox - 6) + ',' + (V4.plotT + 12) + ' ' + ox + ',' + V4.plotT + ' ' + (ox + 6) + ',' + (V4.plotT + 12) + '" fill="currentColor"/>';
  svg += '<polygon points="' + (V4.plotR - 12) + ',' + (oy - 6) + ' ' + V4.plotR + ',' + oy + ' ' + (V4.plotR - 12) + ',' + (oy + 6) + '" fill="currentColor"/>';

  svg += '<text x="' + (V4.plotL - 8) + '" y="' + (V4.plotT + 12) + '" text-anchor="end" class="econ-graph-label-xs" fill="currentColor">Cumulative</text>';
  svg += '<text x="' + (V4.plotL - 8) + '" y="' + (V4.plotT + 26) + '" text-anchor="end" class="econ-graph-label-xs" fill="currentColor">% of</text>';
  svg += '<text x="' + (V4.plotL - 8) + '" y="' + (V4.plotT + 40) + '" text-anchor="end" class="econ-graph-label-xs" fill="currentColor">income</text>';
  svg += '<text x="' + V4.plotR + '" y="' + (oy + 28) + '" text-anchor="end" class="econ-graph-label-xs" fill="currentColor">Cumulative % of households</text>';

  svg += '<line x1="' + ox + '" y1="' + oy + '" x2="' + V4.plotR + '" y2="' + V4.plotT + '" stroke="' + GC.equality + '" stroke-width="1.5" stroke-dasharray="6 5"/>';
  svg += '<text x="' + (V4.plotL + PW * 0.55) + '" y="' + (V4.plotT + PH * 0.38) + '" class="econ-graph-label-xs" fill="' + GC.equality + '" transform="rotate(-42,' + (V4.plotL + PW * 0.55) + ',' + (V4.plotT + PH * 0.38) + ')">Line of equality</text>';

  var bowAmounts = cfg.bow || [0.35];
  var colors = [GC.lorenz1, GC.lorenz2];
  var curveLabels = lb.curves || ['Lorenz curve'];

  for (var i = 0; i < curves; i++) {
    var bow = bowAmounts[i] || 0.35;
    var cx1 = ox + PW * 0.5;
    var cy1 = oy - PH * (0.5 - bow);
    var cx2 = ox + PW * 0.75;
    var cy2 = oy - PH * (0.75 - bow * 0.7);
    svg += '<path d="M ' + ox + ' ' + oy + ' C ' + cx1 + ' ' + cy1 + ', ' + cx2 + ' ' + cy2 + ', ' + V4.plotR + ' ' + V4.plotT + '" fill="none" stroke="' + colors[i] + '" stroke-width="' + SW.curve + '"/>';
    if (curveLabels[i]) {
      var lblX = ox + PW * 0.6;
      var lblY = oy - PH * (0.6 - bow * 0.6) + (i * 20);
      svg += '<text x="' + lblX + '" y="' + lblY + '" class="econ-graph-curve-label" fill="' + colors[i] + '">' + curveLabels[i] + '</text>';
    }
  }

  for (var p = 0.25; p < 1; p += 0.25) {
    var tick = Math.round(p * 100);
    svg += '<text x="' + (ox + PW * p) + '" y="' + (oy + 18) + '" text-anchor="middle" class="econ-graph-label-xs" fill="currentColor">' + tick + '%</text>';
    svg += '<text x="' + (ox - 8) + '" y="' + (oy - PH * p + 5) + '" text-anchor="end" class="econ-graph-label-xs" fill="currentColor">' + tick + '%</text>';
    svg += '<line x1="' + (ox + PW * p) + '" y1="' + V4.plotT + '" x2="' + (ox + PW * p) + '" y2="' + oy + '" stroke="' + GC.grid + '" stroke-width="' + SW.grid + '"/>';
    svg += '<line x1="' + ox + '" y1="' + (oy - PH * p) + '" x2="' + (ox + PW) + '" y2="' + (oy - PH * p) + '" stroke="' + GC.grid + '" stroke-width="' + SW.grid + '"/>';
  }

  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 10: sd_surplus_labeled
   ============================================================ */
function renderSdSurplusLabeled(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');

  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);

  if (cfg.priceLine) {
    var plY = cfg.priceLine.y || (eq.y + 0.15);
    svg += '<line x1="' + V4.plotL + '" y1="' + py(plY) + '" x2="' + V4.plotR + '" y2="' + py(plY) + '" stroke="' + GC.priceLine + '" stroke-width="' + SW.priceLine + '" stroke-dasharray="8 5"/>';
    if (cfg.priceLine.label) {
      svg += '<text x="' + (V4.plotL - 10) + '" y="' + (py(plY) + 5) + '" text-anchor="end" class="econ-graph-label-sm" fill="' + GC.priceLine + '">' + cfg.priceLine.label + '</text>';
    }
  }

  if (lb.extraPoints) {
    lb.extraPoints.forEach(function(ep) {
      if (ep.dash) svg += svgDash(px(ep.x), py(ep.y), ep.dashX !== false, ep.dashY !== false, ep.labelX || '', ep.labelY || '');
      svg += svgPoint(px(ep.x), py(ep.y), ep.label, ep.pos || 'tr', ep.color || GC.axis);
    });
  }

  svg += '</svg>';
  return svg;
}


/* ============================================================
   MAIN DISPATCHER: generateGraphHTML(config)
   ============================================================ */
function generateGraphHTML(cfg) {
  if (!cfg || !cfg.type) return '';

  var svg = '';
  switch (cfg.type) {
    case 'sd_cross':           svg = renderSdCross(cfg); break;
    case 'sd_shift':           svg = renderSdShift(cfg); break;
    case 'sd_shift_cross':     svg = renderSdShiftCross(cfg); break;
    case 'sd_floor':           svg = renderSdFloor(cfg); break;
    case 'sd_ceiling':         svg = renderSdCeiling(cfg); break;
    case 'sd_tax':             svg = renderSdTax(cfg); break;
    case 'sd_quota':           svg = renderSdQuota(cfg); break;
    case 'sd_surplus':         svg = renderSdSurplus(cfg); break;
    case 'sd_surplus_labeled': svg = renderSdSurplusLabeled(cfg); break;
    case 'lorenz':             svg = renderLorenz(cfg); break;
    default: return '';
  }

  var title = cfg.title || '';
  var h = '<div class="econ-graph-wrap">';
  if (title) h += '<div class="econ-graph-title" style="font-weight:700;font-size:14px;margin-bottom:6px;text-align:center;color:currentColor">' + title + '</div>';
  h += svg;
  h += '</div>';
  return h;
}


/* ============================================================
   ███████████████████████████████████████████████████████████
   STRICT COORDINATE SVG RENDERER  (svg_config system)
   v5.0 — FULL-BLEED Rewrite
   ███████████████████████████████████████████████████████████
   
   Canvas: 600×450 viewBox
   Plot area: (50,30) → (580,420) — FULL BLEED
   
   Uses NORMALIZED coordinates (0–1) from CSV data.
   Also supports raw pixel coords from legacy JSON (auto-scaled).
   
   Key v5 changes:
   • 600×450 canvas, plot fills to edges
   • Slope-aware label placement:
     - D labels at top-left of line, text-anchor="end", x-10
     - S labels at top-right of line, text-anchor="start", x+10
     - Points: label at y-15 (above), text-anchor="middle"
   • Y-axis label at x=40, text-anchor="end" → no clipping
   • currentColor everywhere → dark mode auto
   • No container background/border
   ============================================================ */


/* ---- Color sanitizer v5: map hardcoded colors to theme-aware ---- */
function themeColor(hex, mode) {
  if (!hex) return 'currentColor';
  var h = hex.toLowerCase().trim();

  /* Black / dark colors → use currentColor via CSS var */
  if (h === '#1e293b' || h === '#000000' || h === '#111827' || h === '#0f172a' || h === 'black') {
    return 'currentColor';
  }

  /* Explain-mode shift colors → high-contrast */
  if (h === '#0000ff')                    return GC.demandShift;   // blue = demand shift
  if (h === '#00aa00' || h === '#008000') return GC.supplyShift;   // green = supply shift
  if (h === '#ff0000')                    return GC.answer;        // red = answer highlight

  return hex;
}


/* ---- Slope-aware label positioning for demand & supply curves ---- 
   v6.0: Now supports DUAL-END labeling. Returns offsets for BOTH ends.
   
   Demand lines slope downward (high-left to low-right):
   → Start (top-left):  text-anchor="end", offset (-15, -8)
   → End (bottom-right): text-anchor="start", offset (+15, +18)
   
   Supply lines slope upward (low-left to high-right):
   → Start (bottom-left): text-anchor="end", offset (-15, +18)
   → End (top-right):     text-anchor="start", offset (+15, -8)
*/
function slopeAwareLabelOffset(x1, y1, x2, y2, curveType, label) {
  /* Determine the "top" end (lower SVG Y = higher on screen) */
  var topIsStart = (y1 < y2);   /* y1 is higher on screen */
  
  if (curveType === 'demand') {
    /* Demand: label at the top-left end */
    if (topIsStart) {
      return { endType: 'start', dx: -15, dy: -8, anchor: 'end' };
    } else {
      return { endType: 'end', dx: -15, dy: -8, anchor: 'end' };
    }
  } else {
    /* Supply: label at the top-right end */
    if (topIsStart) {
      return { endType: 'start', dx: 15, dy: -8, anchor: 'start' };
    } else {
      return { endType: 'end', dx: 15, dy: -8, anchor: 'start' };
    }
  }
}

/* ---- Dual-end label offset: get offset for the OTHER end of the curve ---- */
function dualEndLabelOffset(x1, y1, x2, y2, curveType) {
  /* Determine the "bottom" end (higher SVG Y = lower on screen) */
  var bottomIsEnd = (y2 > y1);   /* y2 is lower on screen */
  
  if (curveType === 'demand') {
    /* Demand bottom-right end */
    if (bottomIsEnd) {
      return { endType: 'end', dx: 15, dy: 18, anchor: 'start' };
    } else {
      return { endType: 'start', dx: 15, dy: 18, anchor: 'start' };
    }
  } else {
    /* Supply bottom-left end */
    if (bottomIsEnd) {
      return { endType: 'end', dx: -15, dy: 18, anchor: 'end' };
    } else {
      return { endType: 'start', dx: -15, dy: 18, anchor: 'end' };
    }
  }
}

/* ---- Generic curve end label offset (fallback) ---- */
function curveEndLabelOffset(x1, y1, x2, y2, isStartEnd, label) {
  var dx = x2 - x1, dy = y2 - y1;
  var len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { dx: 10, dy: -10, anchor: 'start' };
  var ux = dx / len, uy = dy / len;
  var perpX = -uy, perpY = ux;
  var ext = 18, push = 12;
  var ox, oy;
  if (isStartEnd) {
    ox = -ux * ext + perpX * push;
    oy = -uy * ext + perpY * push;
  } else {
    ox = ux * ext + perpX * push;
    oy = uy * ext + perpY * push;
  }
  var anchor;
  if (ox < -3) anchor = 'end';
  else if (ox > 3) anchor = 'start';
  else anchor = 'middle';
  return { dx: ox, dy: oy, anchor: anchor };
}


/* ---- Smart point label offset to avoid sitting ON the dot ---- 
   v6.0: Default is ABOVE at y - 20 for anti-stacking */
function pointLabelOffset(pos) {
  var dx = 0, dy = 0;
  switch (pos) {
    case 'tr': dx = 16;  dy = -14; break;
    case 'tl': dx = -16; dy = -14; break;
    case 'br': dx = 16;  dy = 24;  break;
    case 'bl': dx = -16; dy = 24;  break;
    case 'r':  dx = 18;  dy = 6;   break;
    case 'l':  dx = -18; dy = 6;   break;
    case 't':  dx = 0;   dy = -20; break;
    case 'b':  dx = 0;   dy = 26;  break;
    default:   dx = 0;   dy = -20; break;  /* Default: ABOVE at y-20 */
  }
  var anchor = dx < -3 ? 'end' : dx > 3 ? 'start' : 'middle';
  return { dx: dx, dy: dy, anchor: anchor };
}


/* ---- Collision detection: nudge overlapping labels apart ---- */
function nudgeOverlappingLabels(labelPositions) {
  var MIN_DIST = 22;
  for (var i = 0; i < labelPositions.length; i++) {
    for (var j = i + 1; j < labelPositions.length; j++) {
      var a = labelPositions[i], b = labelPositions[j];
      var ddx = b.x - a.x, ddy = b.y - a.y;
      var dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist < MIN_DIST && dist > 0) {
        var push = (MIN_DIST - dist) / 2;
        var ux = ddx / dist, uy = ddy / dist;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
      }
    }
  }
}


/* ---- Render strict SVG from normalized config ---- */
function renderSvgConfig(cfg) {
  if (!cfg) return '';

  var axes = cfg.axes || {};
  var xL = axes.xLabel || 'Q';
  var yL = axes.yLabel || 'P';

  var xLabelLines = xL.split('\n');
  var yLabelLines = yL.split('\n');

  /* v6.0: 600×480 viewBox with safe-zone margins */
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + V4.W + ' ' + V4.H
    + '" class="econ-graph-svg" preserveAspectRatio="xMidYMid meet"'
    + ' style="width:100%;height:auto;color:var(--graph-axis,currentColor)">';


  /* ==================== AXES ==================== */
  var axL = V4.plotL, axT = V4.plotT, axR = V4.plotR, axB = V4.plotB;

  // Y-axis line
  s += '<line x1="' + axL + '" y1="' + axT + '" x2="' + axL + '" y2="' + axB
    + '" stroke="currentColor" stroke-width="' + SW.axis + '"/>';
  // Y-axis arrow
  s += '<polygon points="'
    + (axL - 6) + ',' + (axT + 12) + ' '
    + axL + ',' + axT + ' '
    + (axL + 6) + ',' + (axT + 12)
    + '" fill="currentColor"/>';

  // X-axis line
  s += '<line x1="' + axL + '" y1="' + axB + '" x2="' + axR + '" y2="' + axB
    + '" stroke="currentColor" stroke-width="' + SW.axis + '"/>';
  // X-axis arrow
  s += '<polygon points="'
    + (axR - 12) + ',' + (axB - 6) + ' '
    + axR + ',' + axB + ' '
    + (axR - 12) + ',' + (axB + 6)
    + '" fill="currentColor"/>';

  // Y-axis label — v6.0 Safe Zone: at (30, 60) text-anchor="start", deep inside visible area
  for (var yi = 0; yi < yLabelLines.length; yi++) {
    s += '<text x="30" y="' + (axT + yi * 18) + '" text-anchor="start"'
      + ' font-size="' + GF.axisLabel + '" font-weight="700" font-family="' + GF.family + '"'
      + ' fill="currentColor">' + yLabelLines[yi] + '</text>';
  }

  // X-axis label — v6.0 Safe Zone: at (plotR, 440) text-anchor="start", deep inside visible area
  for (var xi = 0; xi < xLabelLines.length; xi++) {
    s += '<text x="' + axR + '" y="' + (axB + 28 + xi * 18) + '" text-anchor="start"'
      + ' font-size="' + GF.axisLabel + '" font-weight="700" font-family="' + GF.family + '"'
      + ' fill="currentColor">' + xLabelLines[xi] + '</text>';
  }

  // Origin "0"
  s += '<text x="' + (axL - 14) + '" y="' + (axB + 22) + '" text-anchor="end"'
    + ' font-size="' + GF.tickLabel + '" font-family="' + GF.family + '"'
    + ' fill="currentColor">0</text>';


  /* ==================== HORIZONTAL LINES ==================== */
  if (cfg.hLines) {
    cfg.hLines.forEach(function(hl) {
      var legMin = 30, legMinY = 20, legR = 150;
      function normHV(v, isY) {
        if (v > 1.5) return isY ? 1 - ((v - legMinY) / legR) : (v - legMin) / legR;
        return v;
      }
      var x1 = hl.x1 != null ? V4.nx(normHV(hl.x1, false)) : axL;
      var x2 = hl.x2 != null ? V4.nx(normHV(hl.x2, false)) : axR;
      var y = V4.ny(normHV(hl.y, true));
      var da = hl.dash ? ' stroke-dasharray="6 5"' : '';
      var hlCol = themeColor(hl.color) || GC.priceLine;
      s += '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y
        + '" stroke="' + hlCol + '" stroke-width="' + (hl.width || SW.dash) + '"' + da + '/>';
      if (hl.label) {
        s += '<text x="' + (x2 + 6) + '" y="' + (y + 5) + '" font-size="' + GF.tickLabel
          + '" font-family="' + GF.family + '" fill="' + hlCol + '">' + hl.label + '</text>';
      }
    });
  }

  /* ==================== VERTICAL LINES ==================== */
  if (cfg.vLines) {
    cfg.vLines.forEach(function(vl) {
      var legMin = 30, legMinY = 20, legR = 150;
      function normHV2(v, isY) {
        if (v > 1.5) return isY ? 1 - ((v - legMinY) / legR) : (v - legMin) / legR;
        return v;
      }
      var x = V4.nx(normHV2(vl.x, false));
      var y1 = vl.y1 != null ? V4.ny(normHV2(vl.y1, true)) : axT;
      var y2 = vl.y2 != null ? V4.ny(normHV2(vl.y2, true)) : axB;
      var da = vl.dash ? ' stroke-dasharray="6 5"' : '';
      var vlCol = themeColor(vl.color) || GC.priceLine;
      s += '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2
        + '" stroke="' + vlCol + '" stroke-width="' + (vl.width || SW.dash) + '"' + da + '/>';
      if (vl.label) {
        s += '<text x="' + x + '" y="' + (y2 + 18) + '" text-anchor="middle" font-size="' + GF.tickLabel
          + '" font-family="' + GF.family + '" fill="' + vlCol + '">' + vl.label + '</text>';
      }
    });
  }


  /* ==================== CURVES (lines) — v6.0 DUAL-END LABELING ==================== */
  /* Collect label positions for collision detection */
  var curveLabelPositions = [];

  if (cfg.curves) {
    cfg.curves.forEach(function(cv) {
      var c = cv.coords;
      var nx1, ny1, nx2, ny2;
      if (c[0] > 1.5 || c[1] > 1.5 || c[2] > 1.5 || c[3] > 1.5) {
        var legacyMinX = 30, legacyMinY = 20, legacyRange = 150;
        nx1 = (c[0] - legacyMinX) / legacyRange;
        ny1 = 1 - ((c[1] - legacyMinY) / legacyRange);
        nx2 = (c[2] - legacyMinX) / legacyRange;
        ny2 = 1 - ((c[3] - legacyMinY) / legacyRange);
      } else {
        nx1 = c[0]; ny1 = c[1];
        nx2 = c[2]; ny2 = c[3];
      }

      var x1 = V4.nx(nx1), y1 = V4.ny(ny1);
      var x2 = V4.nx(nx2), y2 = V4.ny(ny2);

      var col = themeColor(cv.color) || 'currentColor';
      var w = cv.width || SW.curve;
      var da = cv.dash ? ' stroke-dasharray="6 5"' : '';

      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1)
        + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1)
        + '" stroke="' + col + '" stroke-width="' + w + '"' + da + '/>';

      /* v6.0 DUAL-END CURVE LABELING */
      if (cv.label) {
        var cType = cv.type || 'other';
        var dualLabel = cv.dualLabel !== false; /* default: dual labels ON */
        
        if (cv.labelOffX != null && cv.labelOffY != null) {
          /* Explicit offsets provided — single label only */
          var lx = (cv.labelPos === 'start') ? x1 : x2;
          var ly = (cv.labelPos === 'start') ? y1 : y2;
          var off = { dx: cv.labelOffX * 1.5, dy: cv.labelOffY * 1.5, anchor: cv.labelAnchor || 'start' };
          var finalLx = Math.max(10, Math.min(V4.W - 10, lx + off.dx));
          var finalLy = Math.max(16, Math.min(V4.H - 4, ly + off.dy));
          curveLabelPositions.push({ x: finalLx, y: finalLy, col: col, anchor: off.anchor, label: cv.label });
        } else if (cType === 'demand' || cType === 'supply') {
          /* LABEL A: Primary end (top end) — slope-aware */
          var sOff = slopeAwareLabelOffset(x1, y1, x2, y2, cType, cv.label);
          var lxA = (sOff.endType === 'start') ? x1 : x2;
          var lyA = (sOff.endType === 'start') ? y1 : y2;
          var finalLxA = Math.max(10, Math.min(V4.W - 10, lxA + sOff.dx));
          var finalLyA = Math.max(16, Math.min(V4.H - 4, lyA + sOff.dy));
          curveLabelPositions.push({ x: finalLxA, y: finalLyA, col: col, anchor: sOff.anchor, label: cv.label });

          /* LABEL B: Secondary end (bottom end) — dual labeling */
          if (dualLabel) {
            var dOff = dualEndLabelOffset(x1, y1, x2, y2, cType);
            var lxB = (dOff.endType === 'start') ? x1 : x2;
            var lyB = (dOff.endType === 'start') ? y1 : y2;
            var finalLxB = Math.max(10, Math.min(V4.W - 10, lxB + dOff.dx));
            var finalLyB = Math.max(16, Math.min(V4.H - 4, lyB + dOff.dy));
            curveLabelPositions.push({ x: finalLxB, y: finalLyB, col: col, anchor: dOff.anchor, label: cv.label });
          }
        } else {
          /* Fallback for non-demand/supply lines — single label */
          var lxC = x2; var lyC = y2;
          var offC = curveEndLabelOffset(x1, y1, x2, y2, false, cv.label);
          var finalLxC = Math.max(10, Math.min(V4.W - 10, lxC + offC.dx));
          var finalLyC = Math.max(16, Math.min(V4.H - 4, lyC + offC.dy));
          curveLabelPositions.push({ x: finalLxC, y: finalLyC, col: col, anchor: offC.anchor, label: cv.label });
        }
      }
    });

    /* Nudge overlapping curve labels */
    nudgeOverlappingLabels(curveLabelPositions);

    /* Render curve labels after nudging */
    curveLabelPositions.forEach(function(lp) {
      /* Re-clamp after nudging */
      var clx = Math.max(10, Math.min(V4.W - 10, lp.x));
      var cly = Math.max(16, Math.min(V4.H - 4, lp.y));
      s += '<text x="' + clx.toFixed(1) + '" y="' + cly.toFixed(1)
        + '" text-anchor="' + lp.anchor + '" font-size="' + GF.curveLabel
        + '" font-weight="700" font-family="' + GF.family + '" fill="' + lp.col + '">'
        + lp.label + '</text>';
    });
  }


  /* ==================== POINTS — v6.0 Anti-Stacking ==================== */
  var pointLabelPositions = [];

  if (cfg.points) {
    cfg.points.forEach(function(pt, ptIdx) {
      /* Normalize coordinates */
      var pnx, pny;
      if (pt.x > 1.5 || pt.y > 1.5) {
        var legacyMinX = 30, legacyMinY = 20, legacyRange = 150;
        pnx = (pt.x - legacyMinX) / legacyRange;
        pny = 1 - ((pt.y - legacyMinY) / legacyRange);
      } else {
        pnx = pt.x; pny = pt.y;
      }

      var ptX = V4.nx(pnx), ptY = V4.ny(pny);
      var col = themeColor(pt.color);
      var isHighlight = (pt.highlight === true);
      var isAnswer = (col === GC.answer) || isHighlight;
      var r = isHighlight ? 6 : (pt.r || 5.5);

      /* Dashed lines to axes */
      if (pt.dashed) {
        s += '<line x1="' + axL + '" y1="' + ptY.toFixed(1) + '" x2="' + ptX.toFixed(1) + '" y2="' + ptY.toFixed(1)
          + '" stroke="' + GC.dash + '" stroke-width="' + SW.dash + '" stroke-dasharray="6 5"/>';
        s += '<line x1="' + ptX.toFixed(1) + '" y1="' + ptY.toFixed(1) + '" x2="' + ptX.toFixed(1) + '" y2="' + axB
          + '" stroke="' + GC.dash + '" stroke-width="' + SW.dash + '" stroke-dasharray="6 5"/>';
        if (pt.dashLabelY) {
          s += '<text x="' + (axL - 8) + '" y="' + (ptY + 5).toFixed(1)
            + '" text-anchor="end" font-size="' + GF.tickLabel
            + '" font-family="' + GF.family + '" fill="currentColor">'
            + pt.dashLabelY + '</text>';
        }
        if (pt.dashLabelX) {
          s += '<text x="' + ptX.toFixed(1) + '" y="' + (axB + 18)
            + '" text-anchor="middle" font-size="' + GF.tickLabel
            + '" font-family="' + GF.family + '" fill="currentColor">'
            + pt.dashLabelX + '</text>';
        }
      }

      /* v6.0: Answer points get WHITE HALO stroke for visibility even when lines pass through */
      if (isAnswer) {
        /* Extra-large white halo for answer points */
        s += '<circle cx="' + ptX.toFixed(1) + '" cy="' + ptY.toFixed(1)
          + '" r="' + (r + 4) + '" fill="' + GC.halo + '" stroke="' + GC.halo + '" stroke-width="3"/>';
      } else {
        /* Standard halo ring */
        s += '<circle cx="' + ptX.toFixed(1) + '" cy="' + ptY.toFixed(1)
          + '" r="' + (r + 2.5) + '" fill="' + GC.halo + '" stroke="none"/>';
      }

      /* Main dot */
      s += '<circle cx="' + ptX.toFixed(1) + '" cy="' + ptY.toFixed(1)
        + '" r="' + r + '" fill="' + col + '" stroke="' + GC.halo + '" stroke-width="' + SW.halo + '"/>';

      /* Highlight ring for answer points (explain mode) */
      if (isHighlight) {
        s += '<circle cx="' + ptX.toFixed(1) + '" cy="' + ptY.toFixed(1)
          + '" r="' + (r + 5) + '" fill="none" stroke="' + col + '" stroke-width="2" opacity="0.5"/>';
      }

      /* Label: v6.0 default position is ABOVE the point (y - 20) with text-anchor="middle" */
      if (pt.label) {
        var pos = pt.pos || 't';  /* Default: label ABOVE */
        var off = pointLabelOffset(pos);
        var fw = pt.bold !== false ? '700' : '500';

        /* Clamp within viewBox */
        var finalPLx = Math.max(10, Math.min(V4.W - 10, ptX + off.dx));
        var finalPLy = Math.max(16, Math.min(V4.H - 4, ptY + off.dy));

        pointLabelPositions.push({ x: finalPLx, y: finalPLy, col: col, anchor: off.anchor, label: pt.label, fw: fw, fontSize: pt.fontSize || GF.pointLabel });
      }
    });

    /* Nudge overlapping point labels */
    nudgeOverlappingLabels(pointLabelPositions);

    /* Render point labels after nudging */
    pointLabelPositions.forEach(function(lp) {
      var clx = Math.max(10, Math.min(V4.W - 10, lp.x));
      var cly = Math.max(16, Math.min(V4.H - 4, lp.y));
      s += '<text x="' + clx.toFixed(1) + '" y="' + cly.toFixed(1)
        + '" text-anchor="' + lp.anchor + '" font-size="' + lp.fontSize
        + '" font-weight="' + lp.fw + '" font-family="' + GF.family + '" fill="' + lp.col + '">'
        + lp.label + '</text>';
    });
  }


  /* ==================== ARROWS ==================== */
  if (cfg.arrows) {
    cfg.arrows.forEach(function(ar) {
      var anx1, any1, anx2, any2;
      if (ar.from[0] > 1.5 || ar.from[1] > 1.5) {
        var legacyMinX = 30, legacyMinY = 20, legacyRange = 150;
        anx1 = (ar.from[0] - legacyMinX) / legacyRange;
        any1 = 1 - ((ar.from[1] - legacyMinY) / legacyRange);
        anx2 = (ar.to[0] - legacyMinX) / legacyRange;
        any2 = 1 - ((ar.to[1] - legacyMinY) / legacyRange);
      } else {
        anx1 = ar.from[0]; any1 = ar.from[1];
        anx2 = ar.to[0];   any2 = ar.to[1];
      }

      var fx = V4.nx(anx1), fy = V4.ny(any1);
      var tx = V4.nx(anx2), ty = V4.ny(any2);
      var col = themeColor(ar.color) || 'currentColor';

      var dx = tx - fx, dy = ty - fy;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      var ux = dx / len, uy = dy / len;
      var ax = tx - ux * 9, ay = ty - uy * 9;
      var perpx = -uy * 5.5, perpy = ux * 5.5;

      s += '<line x1="' + fx.toFixed(1) + '" y1="' + fy.toFixed(1)
        + '" x2="' + tx.toFixed(1) + '" y2="' + ty.toFixed(1)
        + '" stroke="' + col + '" stroke-width="' + SW.arrow + '" stroke-dasharray="6 4"/>';
      s += '<polygon points="' + tx.toFixed(1) + ',' + ty.toFixed(1)
        + ' ' + (ax + perpx).toFixed(1) + ',' + (ay + perpy).toFixed(1)
        + ' ' + (ax - perpx).toFixed(1) + ',' + (ay - perpy).toFixed(1)
        + '" fill="' + col + '"/>';

      if (ar.label) {
        s += '<text x="' + ((fx + tx) / 2).toFixed(1) + '" y="' + ((fy + ty) / 2 - 10).toFixed(1)
          + '" text-anchor="middle" font-size="' + GF.tickLabel
          + '" font-family="' + GF.family + '" fill="' + col + '">' + ar.label + '</text>';
      }
    });
  }


  /* ==================== EXTRA LABELS ==================== */
  if (cfg.labels && Array.isArray(cfg.labels)) {
    cfg.labels.forEach(function(lb) {
      var legMin = 30, legMinY = 20, legR = 150;
      var lnx = lb.x > 1.5 ? (lb.x - legMin) / legR : lb.x;
      var lny = lb.y > 1.5 ? 1 - ((lb.y - legMinY) / legR) : lb.y;
      var lx = V4.nx(lnx), ly = V4.ny(lny);
      s += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1)
        + '" text-anchor="' + (lb.anchor || 'middle')
        + '" font-size="' + (lb.size || GF.tickLabel)
        + '" font-weight="' + (lb.weight || '500')
        + '" font-family="' + GF.family
        + '" fill="' + themeColor(lb.color) + '">' + lb.text + '</text>';
    });
  }

  s += '</svg>';
  return s;
}


/* ---- Generate HTML wrapper for svg_config — NO CONTAINER ---- */
function generateSvgConfigHTML(cfg) {
  if (!cfg) return '';
  var svg = renderSvgConfig(cfg);
  return '<div class="econ-graph-wrap">' + svg + '</div>';
}


/* ============================================================
   CSV DATA PARSER
   Parse CSV normalized coordinates into svg_config format.
   
   CSV format per row:
   normalizedX, normalizedY, endpointFlag(0=start,1=end), label
   
   endpointFlag 0 = first endpoint of line / point position
   endpointFlag 1 = second endpoint of line
   ============================================================ */
function parseCsvToConfig(csvData, options) {
  options = options || {};
  var lines = csvData.trim().split('\n');
  var lineEndpoints = {};
  var pointEntries = {};

  lines.forEach(function(line) {
    var parts = line.split(',').map(function(s) { return s.trim(); });
    if (parts.length < 4) return;
    var x = parseFloat(parts[0]);
    var y = parseFloat(parts[1]);
    var flag = parseInt(parts[2]);
    var label = parts[3];

    if (flag === 0) {
      if (!lineEndpoints[label]) lineEndpoints[label] = {};
      lineEndpoints[label].start = [x, y];
    } else if (flag === 1) {
      if (!lineEndpoints[label]) lineEndpoints[label] = {};
      lineEndpoints[label].end = [x, y];
    }
  });

  var curveConfigs = [];
  var pointConfigs = [];

  Object.keys(lineEndpoints).forEach(function(label) {
    var entry = lineEndpoints[label];
    if (entry.start && entry.end) {
      var isDemand = label.match(/^D/i);
      var isSupply = label.match(/^S/i);
      var isArrow = label.match(/^Arrow/i);
      if (isArrow) return;

      curveConfigs.push({
        id: label,
        type: isDemand ? 'demand' : isSupply ? 'supply' : 'other',
        coords: [entry.start[0], entry.start[1], entry.end[0], entry.end[1]],
        label: label.replace(/(\d)/g, function(m) {
          return '₀₁₂₃₄₅₆₇₈₉'[parseInt(m)];
        }),
        color: null
      });
    } else if (entry.start && !entry.end) {
      pointConfigs.push({
        id: label,
        x: entry.start[0],
        y: entry.start[1],
        label: label.replace(/(\d)/g, function(m) {
          return '₀₁₂₃₄₅₆₇₈₉'[parseInt(m)];
        }),
        color: null
      });
    }
  });

  var arrowConfigs = [];
  Object.keys(lineEndpoints).forEach(function(label) {
    if (label.match(/^Arrow/i)) {
      var entry = lineEndpoints[label];
      if (entry.start && entry.end) {
        arrowConfigs.push({
          from: [entry.start[0], entry.start[1]],
          to: [entry.end[0], entry.end[1]]
        });
      }
    }
  });

  return {
    axes: options.axes || { xLabel: 'Quantity', yLabel: 'Unit Price' },
    curves: curveConfigs,
    points: pointConfigs,
    arrows: arrowConfigs.length > 0 ? arrowConfigs : undefined
  };
}


/* ---- Expose globally ---- */
window.generateGraphHTML = generateGraphHTML;
window.renderSvgConfig = renderSvgConfig;
window.generateSvgConfigHTML = generateSvgConfigHTML;
window.parseCsvToConfig = parseCsvToConfig;
window.V4 = V4;
window.GC = GC;
window.themeColor = themeColor;
