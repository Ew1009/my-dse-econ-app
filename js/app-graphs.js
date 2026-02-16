/* ==================================================================
   DSE Economics Graph / Diagram Generator
   
   Generates SVG-based economics diagrams for MCQ questions.
   
   Supported diagram types:
   1. sd_cross       — Standard S&D cross with 4 equilibrium quadrant points
   2. sd_shift       — S&D with one or both curves shifting
   3. sd_shift_cross — S&D shift with 4 equilibrium points
   4. sd_floor       — S&D with price floor
   5. sd_ceiling     — S&D with price ceiling
   6. sd_tax         — S&D with per-unit tax (wedge)
   7. sd_quota       — S&D with quota
   8. sd_surplus     — S&D with shaded consumer/producer surplus areas
   9. lorenz         — Lorenz curve(s) for income distribution
   10. sd_multi      — Multiple S&D diagrams (for "which diagram" questions)
   
   Usage:
     generateGraphHTML(graphConfig) → HTML string
   
   graphConfig = {
     type: 'sd_cross',        // diagram type
     labels: {...},            // axis/curve/point labels
     ... type-specific props
   }
   ================================================================== */

/* ---- SVG namespace helper ---- */
var GRAPH_NS = 'http://www.w3.org/2000/svg';

/* ---- Dimensions ---- */
var GW = 280, GH = 240;        // viewBox size
var GM = { l: 45, r: 20, t: 20, b: 35 }; // margins
var PW = GW - GM.l - GM.r;     // plot width
var PH = GH - GM.t - GM.b;     // plot height

/* ---- Color palette (uses CSS vars at render time) ---- */
var GC = {
  axis: 'var(--tx1)',
  demand: '#2563eb',       // blue
  supply: '#ef4444',       // red
  demand2: '#06b6d4',      // cyan (shifted demand)
  supply2: '#f59e0b',      // amber (shifted supply)
  eq: '#10b981',           // green (equilibrium)
  dash: 'var(--tx3)',
  fill: 'rgba(37,99,235,0.08)',
  fillCS: 'rgba(37,99,235,0.12)',  // consumer surplus
  fillPS: 'rgba(239,68,68,0.12)',  // producer surplus
  fillDWL: 'rgba(245,158,11,0.18)', // deadweight loss
  lorenz1: '#2563eb',
  lorenz2: '#ef4444',
  equality: 'var(--tx3)',
  priceLine: '#8b5cf6',    // purple for price floor/ceiling
  grid: 'var(--bd)'
};

/* ---- Helper: SVG open tag ---- */
function svgOpen(w, h, cls) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" class="econ-graph-svg ' + (cls||'') + '" preserveAspectRatio="xMidYMid meet">';
}

/* ---- Helper: axis lines ---- */
function svgAxes(xLabel, yLabel) {
  var ox = GM.l, oy = GM.t, bx = GM.l, by = GM.t + PH;
  var ex = GM.l + PW, ey = GM.t + PH;
  var s = '';
  // Y axis
  s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + bx + '" y2="' + by + '" stroke="' + GC.axis + '" stroke-width="1.5"/>';
  // X axis
  s += '<line x1="' + bx + '" y1="' + by + '" x2="' + ex + '" y2="' + ey + '" stroke="' + GC.axis + '" stroke-width="1.5"/>';
  // Arrow tips
  s += '<polygon points="' + (ox-4) + ',' + (oy+8) + ' ' + ox + ',' + oy + ' ' + (ox+4) + ',' + (oy+8) + '" fill="' + GC.axis + '"/>';
  s += '<polygon points="' + (ex-8) + ',' + (ey-4) + ' ' + ex + ',' + ey + ' ' + (ex-8) + ',' + (ey+4) + '" fill="' + GC.axis + '"/>';
  // Labels
  s += '<text x="' + (ox - 8) + '" y="' + (oy + 4) + '" text-anchor="end" class="econ-graph-label">' + (yLabel || 'P') + '</text>';
  s += '<text x="' + ex + '" y="' + (ey + 16) + '" text-anchor="middle" class="econ-graph-label">' + (xLabel || 'Q') + '</text>';
  // Origin
  s += '<text x="' + (GM.l - 6) + '" y="' + (GM.t + PH + 14) + '" text-anchor="end" class="econ-graph-label-sm">0</text>';
  return s;
}

/* ---- Helper: dashed lines from point to axes ---- */
function svgDash(x, y, showX, showY, labelX, labelY, dashColor) {
  var dc = dashColor || GC.dash;
  var s = '';
  if (showX !== false) {
    s += '<line x1="' + GM.l + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" stroke="' + dc + '" stroke-width="0.8" stroke-dasharray="4 3"/>';
    if (labelY) s += '<text x="' + (GM.l - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="econ-graph-label-sm">' + labelY + '</text>';
  }
  if (showY !== false) {
    s += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (GM.t + PH) + '" stroke="' + dc + '" stroke-width="0.8" stroke-dasharray="4 3"/>';
    if (labelX) s += '<text x="' + x + '" y="' + (GM.t + PH + 14) + '" text-anchor="middle" class="econ-graph-label-sm">' + labelX + '</text>';
  }
  return s;
}

/* ---- Helper: labeled point (dot + label) ---- */
function svgPoint(x, y, label, pos, color) {
  var c = color || GC.eq;
  var dx = 0, dy = 0;
  if (pos === 'tr') { dx = 7; dy = -7; }
  else if (pos === 'tl') { dx = -7; dy = -7; }
  else if (pos === 'br') { dx = 7; dy = 14; }
  else if (pos === 'bl') { dx = -7; dy = 14; }
  else if (pos === 'r') { dx = 10; dy = 4; }
  else if (pos === 'l') { dx = -10; dy = 4; }
  else if (pos === 't') { dx = 0; dy = -9; }
  else if (pos === 'b') { dx = 0; dy = 16; }
  else { dx = 7; dy = -7; } // default top-right
  var s = '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="' + c + '" stroke="white" stroke-width="1"/>';
  s += '<text x="' + (x + dx) + '" y="' + (y + dy) + '" text-anchor="' + (dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle') + '" class="econ-graph-point-label" fill="' + c + '">' + (label||'') + '</text>';
  return s;
}

/* ---- Helper: a line between two points with optional curve label ---- */
function svgLine(x1, y1, x2, y2, color, width, label, labelPos) {
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (width||1.8) + '"/>';
  if (label) {
    var lx, ly;
    if (labelPos === 'start') { lx = x1; ly = y1; }
    else { lx = x2; ly = y2; } // default end
    s += '<text x="' + (lx + 6) + '" y="' + (ly + 4) + '" class="econ-graph-curve-label" fill="' + color + '">' + label + '</text>';
  }
  return s;
}

/* ---- Helper: shift arrow ---- */
function svgArrow(x1, y1, x2, y2, color) {
  var dx = x2 - x1, dy = y2 - y1;
  var len = Math.sqrt(dx*dx + dy*dy);
  var ux = dx/len, uy = dy/len;
  var ax = x2 - ux*6, ay = y2 - uy*6;
  var px = -uy*4, py = ux*4;
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="1.2" stroke-dasharray="5 3"/>';
  s += '<polygon points="' + x2 + ',' + y2 + ' ' + (ax+px) + ',' + (ay+py) + ' ' + (ax-px) + ',' + (ay-py) + '" fill="' + color + '"/>';
  return s;
}

/* ============================================================
   COORDINATE SYSTEM
   All coordinates are in "plot fraction" (0–1 range) and
   converted to SVG coords via px() and py().
   ============================================================ */
function px(frac) { return GM.l + frac * PW; }   // fraction → SVG x
function py(frac) { return GM.t + (1 - frac) * PH; } // fraction → SVG y (inverted)

/* ---- Standard demand line: goes from top-left to bottom-right ---- */
/* Default: (0.05, 0.92) → (0.92, 0.08) */
function demandLine(offset) {
  var o = offset || 0;
  return { x1: 0.05+o, y1: 0.92, x2: 0.92+o, y2: 0.08 };
}

/* ---- Standard supply line: goes from bottom-left to top-right ---- */
function supplyLine(offset) {
  var o = offset || 0;
  return { x1: 0.05+o, y1: 0.08, x2: 0.92+o, y2: 0.92 };
}

/* ---- Intersection of two lines ---- */
function lineIntersect(l1, l2) {
  var a1 = l1.y2 - l1.y1, b1 = l1.x1 - l1.x2, c1 = a1*l1.x1 + b1*l1.y1;
  var a2 = l2.y2 - l2.y1, b2 = l2.x1 - l2.x2, c2 = a2*l2.x1 + b2*l2.y1;
  var det = a1*b2 - a2*b1;
  if (Math.abs(det) < 0.0001) return { x: 0.5, y: 0.5 };
  return { x: (c1*b2 - c2*b1)/det, y: (a1*c2 - a2*c1)/det };
}

/* ---- Draw a demand or supply line with label ---- */
function svgEconLine(line, color, label, labelEnd) {
  var x1 = px(line.x1), y1 = py(line.y1);
  var x2 = px(line.x2), y2 = py(line.y2);
  var lbl = label || '';
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="1.8"/>';
  if (lbl) {
    if (labelEnd === 'start') {
      s += '<text x="' + (x1 - 2) + '" y="' + (y1 - 6) + '" class="econ-graph-curve-label" fill="' + color + '">' + lbl + '</text>';
    } else {
      s += '<text x="' + (x2 + 4) + '" y="' + (y2 + 4) + '" class="econ-graph-curve-label" fill="' + color + '">' + lbl + '</text>';
    }
  }
  return s;
}


/* ============================================================
   TYPE 1: sd_cross
   Standard S&D cross with equilibrium E and 4 labeled points
   at the quadrants (NW, NE, SW, SE of E).
   
   Config: {
     type: 'sd_cross',
     labels: {
       eq: 'E',
       points: ['E₁','E₂','E₃','E₄'], // NW, NE, SE, SW order
       // OR: points: ['W','X','Y','Z']
       demand: 'D', supply: 'S',
       xAxis: 'Q', yAxis: 'P'
     }
   }
   ============================================================ */
function renderSdCross(cfg) {
  var lb = cfg.labels || {};
  var pts = lb.points || ['E₁','E₂','E₃','E₄'];
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  var eqX = px(eq.x), eqY = py(eq.y);
  
  // Quadrant point offsets (NW, NE, SE, SW)
  var spread = 0.17;
  var qpts = [
    { x: eq.x - spread, y: eq.y + spread, pos: 'tl' },  // NW = higher P, lower Q
    { x: eq.x + spread, y: eq.y + spread, pos: 'tr' },  // NE = higher P, higher Q
    { x: eq.x + spread, y: eq.y - spread, pos: 'br' },  // SE = lower P, higher Q
    { x: eq.x - spread, y: eq.y - spread, pos: 'bl' }   // SW = lower P, lower Q
  ];

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');
  
  // Dashed lines from E to axes
  svg += svgDash(eqX, eqY, true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  
  // Equilibrium point
  svg += svgPoint(eqX, eqY, lb.eq || 'E', 'tr', GC.eq);
  
  // 4 quadrant points
  for (var i = 0; i < pts.length && i < 4; i++) {
    svg += svgPoint(px(qpts[i].x), py(qpts[i].y), pts[i], qpts[i].pos, GC.dash);
  }
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 2: sd_shift
   S&D with curve shift(s). Shows original + shifted curves.
   
   Config: {
     type: 'sd_shift',
     shift: 'demand' | 'supply' | 'both',
     shiftDir: 'right' | 'left' | { demand: 'right', supply: 'left' },
     labels: { demand: 'D₁', demand2: 'D₂', supply: 'S', ... }
   }
   ============================================================ */
function renderSdShift(cfg) {
  var lb = cfg.labels || {};
  var shift = cfg.shift || 'demand';
  var shiftDir = cfg.shiftDir || 'right';
  var offset = 0.15;

  var d1 = demandLine();
  var s1 = supplyLine();
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
  
  // Original curves
  svg += svgEconLine(d1, GC.demand, lb.demand || 'D₁');
  svg += svgEconLine(s1, GC.supply, lb.supply || 'S');
  
  // Shifted curve(s)
  if (dDir) {
    svg += svgEconLine(d2, GC.demand2, lb.demand2 || 'D₂');
    // shift arrow
    var midD = { x: (d1.x1+d1.x2)/2, y: (d1.y1+d1.y2)/2 };
    var arrowOff = dDir === 'right' ? offset*0.5 : -offset*0.5;
    svg += svgArrow(px(midD.x), py(midD.y), px(midD.x + arrowOff), py(midD.y), GC.demand2);
  }
  if (sDir) {
    svg += svgEconLine(s2, GC.supply2, lb.supply2 || 'S₂');
    var midS = { x: (s1.x1+s1.x2)/2, y: (s1.y1+s1.y2)/2 };
    var arrowOffS = sDir === 'right' ? offset*0.5 : -offset*0.5;
    svg += svgArrow(px(midS.x), py(midS.y), px(midS.x + arrowOffS), py(midS.y), GC.supply2);
  }

  // Equilibrium points
  svg += svgDash(px(eq1.x), py(eq1.y), true, true, '', '');
  svg += svgPoint(px(eq1.x), py(eq1.y), lb.eq || 'E', 'tl', GC.eq);
  svg += svgDash(px(eq2.x), py(eq2.y), true, true, '', '');
  svg += svgPoint(px(eq2.x), py(eq2.y), lb.eq2 || 'E\'', 'tr', GC.demand2);
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 3: sd_shift_cross
   Combines shift with 4 quadrant equilibrium points.
   Used for "both curves shift, new eq is at ___" questions.
   ============================================================ */
function renderSdShiftCross(cfg) {
  var lb = cfg.labels || {};
  var pts = lb.points || ['E₁','E₂','E₃','E₄'];
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
  
  // Dashed cross through E
  svg += '<line x1="' + GM.l + '" y1="' + eqY + '" x2="' + (GM.l+PW) + '" y2="' + eqY + '" stroke="' + GC.dash + '" stroke-width="0.6" stroke-dasharray="4 3"/>';
  svg += '<line x1="' + eqX + '" y1="' + GM.t + '" x2="' + eqX + '" y2="' + (GM.t+PH) + '" stroke="' + GC.dash + '" stroke-width="0.6" stroke-dasharray="4 3"/>';
  
  svg += svgPoint(eqX, eqY, lb.eq || 'E₀', 'tr', GC.eq);
  
  for (var i = 0; i < pts.length && i < 4; i++) {
    svg += svgPoint(px(qpts[i].x), py(qpts[i].y), pts[i], qpts[i].pos, GC.dash);
  }
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 4: sd_floor — S&D with price floor
   ============================================================ */
function renderSdFloor(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  
  // Price floor above equilibrium
  var floorY = eq.y + 0.18;
  
  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');
  
  // Price floor line
  svg += '<line x1="' + GM.l + '" y1="' + py(floorY) + '" x2="' + (GM.l + PW) + '" y2="' + py(floorY) + '" stroke="' + GC.priceLine + '" stroke-width="1.5" stroke-dasharray="6 4"/>';
  svg += '<text x="' + (GM.l + PW + 2) + '" y="' + (py(floorY) + 4) + '" class="econ-graph-label-sm" fill="' + GC.priceLine + '">' + (lb.floor || 'Pf') + '</text>';
  
  // Equilibrium
  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);
  
  // Quantity demanded and supplied at floor price
  // Find where floor intersects D and S lines
  var qdFrac = eq.x - (floorY - eq.y) * (d.x2 - d.x1) / (d.y2 - d.y1);
  var qsFrac = eq.x + (floorY - eq.y) * (s.x2 - s.x1) / (s.y2 - s.y1);
  
  svg += svgDash(px(qdFrac), py(floorY), false, true, lb.qd || 'Qd', '');
  svg += svgDash(px(qsFrac), py(floorY), false, true, lb.qs || 'Qs', '');
  
  // Excess supply bracket
  svg += '<text x="' + px((qdFrac + qsFrac)/2) + '" y="' + (py(floorY) - 8) + '" text-anchor="middle" class="econ-graph-label-xs" fill="' + GC.priceLine + '">Excess supply</text>';
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 5: sd_ceiling — S&D with price ceiling
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
  
  // Price ceiling line
  svg += '<line x1="' + GM.l + '" y1="' + py(ceilY) + '" x2="' + (GM.l + PW) + '" y2="' + py(ceilY) + '" stroke="' + GC.priceLine + '" stroke-width="1.5" stroke-dasharray="6 4"/>';
  svg += '<text x="' + (GM.l + PW + 2) + '" y="' + (py(ceilY) + 4) + '" class="econ-graph-label-sm" fill="' + GC.priceLine + '">' + (lb.ceiling || 'Pc') + '</text>';
  
  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);
  
  var qdFrac = eq.x + (eq.y - ceilY) * (d.x2 - d.x1) / (d.y1 - d.y2);
  var qsFrac = eq.x - (eq.y - ceilY) * (s.x2 - s.x1) / (s.y2 - s.y1);
  
  svg += svgDash(px(qdFrac), py(ceilY), false, true, lb.qd || 'Qd', '');
  svg += svgDash(px(qsFrac), py(ceilY), false, true, lb.qs || 'Qs', '');
  
  svg += '<text x="' + px((qsFrac + qdFrac)/2) + '" y="' + (py(ceilY) + 16) + '" text-anchor="middle" class="econ-graph-label-xs" fill="' + GC.priceLine + '">Shortage</text>';
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 6: sd_tax — S&D with per-unit tax wedge
   ============================================================ */
function renderSdTax(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s1 = supplyLine();
  var s2 = supplyLine(-0.15); // tax shifts supply left (up)
  var eq1 = lineIntersect(d, s1);
  var eq2 = lineIntersect(d, s2);
  
  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s1, GC.supply, lb.supply || 'S');
  svg += svgEconLine(s2, GC.supply2, lb.supply2 || 'S + Tax');
  
  // Arrow
  var midS = { x: (s1.x1+s1.x2)/2, y: (s1.y1+s1.y2)/2 };
  svg += svgArrow(px(midS.x), py(midS.y), px(midS.x - 0.075), py(midS.y), GC.supply2);
  
  svg += svgDash(px(eq1.x), py(eq1.y), true, true, lb.q1 || 'Q₁', lb.p1 || 'P₁');
  svg += svgPoint(px(eq1.x), py(eq1.y), lb.eq || 'E₁', 'tr', GC.eq);
  svg += svgDash(px(eq2.x), py(eq2.y), true, true, lb.q2 || 'Q₂', lb.p2 || 'P₂');
  svg += svgPoint(px(eq2.x), py(eq2.y), lb.eq2 || 'E₂', 'tl', GC.supply2);
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 7: sd_quota — S&D with vertical quota line
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
  
  // Quota vertical line
  svg += '<line x1="' + px(quotaX) + '" y1="' + GM.t + '" x2="' + px(quotaX) + '" y2="' + (GM.t+PH) + '" stroke="' + GC.priceLine + '" stroke-width="1.5" stroke-dasharray="6 4"/>';
  svg += '<text x="' + px(quotaX) + '" y="' + (GM.t - 4) + '" text-anchor="middle" class="econ-graph-label-sm" fill="' + GC.priceLine + '">Quota</text>';
  svg += '<text x="' + px(quotaX) + '" y="' + (GM.t + PH + 14) + '" text-anchor="middle" class="econ-graph-label-sm">' + (lb.q1 || 'Q₁') + '</text>';
  
  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 8: sd_surplus — S&D with shaded CS / PS / DWL
   ============================================================ */
function renderSdSurplus(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  
  // Key points for surplus areas
  var topD = { x: d.x1, y: d.y1 }; // top of demand line (where it hits Y axis approximately)
  var botS = { x: s.x1, y: s.y1 }; // bottom of supply line

  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  
  // Consumer surplus triangle (area above Pe, below D, left of Qe)
  if (cfg.showCS !== false) {
    svg += '<polygon points="' + px(topD.x) + ',' + py(topD.y) + ' ' + px(eq.x) + ',' + py(eq.y) + ' ' + GM.l + ',' + py(eq.y) + '" fill="' + GC.fillCS + '" stroke="none"/>';
    svg += '<text x="' + (px(topD.x) + 18) + '" y="' + (py((topD.y + eq.y)/2)) + '" class="econ-graph-label-xs" fill="' + GC.demand + '">CS</text>';
  }
  
  // Producer surplus triangle
  if (cfg.showPS !== false) {
    svg += '<polygon points="' + GM.l + ',' + py(eq.y) + ' ' + px(eq.x) + ',' + py(eq.y) + ' ' + px(botS.x) + ',' + py(botS.y) + '" fill="' + GC.fillPS + '" stroke="none"/>';
    svg += '<text x="' + (px(botS.x) + 18) + '" y="' + (py((botS.y + eq.y)/2) + 4) + '" class="econ-graph-label-xs" fill="' + GC.supply + '">PS</text>';
  }
  
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');
  
  // Points
  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);
  
  // Extra labeled points (for area-based questions like A, B, C, etc.)
  if (lb.areaPoints) {
    lb.areaPoints.forEach(function(ap) {
      svg += svgPoint(px(ap.x), py(ap.y), ap.label, ap.pos || 'tr', ap.color || GC.axis);
    });
  }
  
  svg += '</svg>';
  return svg;
}

/* ============================================================
   TYPE 9: lorenz — Lorenz curve(s) for income distribution
   ============================================================ */
function renderLorenz(cfg) {
  var lb = cfg.labels || {};
  var curves = cfg.curves || 1;
  
  var svg = svgOpen(GW, GH, 'lorenz');
  
  // Special axes for Lorenz
  var ox = GM.l, oy = GM.t + PH;
  svg += '<line x1="' + ox + '" y1="' + GM.t + '" x2="' + ox + '" y2="' + oy + '" stroke="' + GC.axis + '" stroke-width="1.5"/>';
  svg += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (GM.l + PW) + '" y2="' + oy + '" stroke="' + GC.axis + '" stroke-width="1.5"/>';
  
  // Labels
  svg += '<text x="' + (GM.l - 4) + '" y="' + (GM.t + 8) + '" text-anchor="end" class="econ-graph-label-xs">Cumulative</text>';
  svg += '<text x="' + (GM.l - 4) + '" y="' + (GM.t + 18) + '" text-anchor="end" class="econ-graph-label-xs">% of</text>';
  svg += '<text x="' + (GM.l - 4) + '" y="' + (GM.t + 28) + '" text-anchor="end" class="econ-graph-label-xs">income</text>';
  svg += '<text x="' + (GM.l + PW) + '" y="' + (oy + 16) + '" text-anchor="middle" class="econ-graph-label-xs">Cumulative % of households</text>';
  
  // 45° line of equality
  svg += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (GM.l + PW) + '" y2="' + GM.t + '" stroke="' + GC.equality + '" stroke-width="1" stroke-dasharray="4 3"/>';
  svg += '<text x="' + (GM.l + PW*0.55) + '" y="' + (GM.t + PH*0.38) + '" class="econ-graph-label-xs" fill="' + GC.equality + '" transform="rotate(-42,' + (GM.l + PW*0.55) + ',' + (GM.t + PH*0.38) + ')">Line of equality</text>';
  
  // Lorenz curve(s) — drawn as cubic bezier for nice bow shape
  // Curve bows further from diagonal = more inequality
  var bowAmounts = cfg.bow || [0.35];
  var colors = [GC.lorenz1, GC.lorenz2];
  var curveLabels = lb.curves || ['Lorenz curve'];
  
  for (var i = 0; i < curves; i++) {
    var bow = bowAmounts[i] || 0.35;
    var cx1 = ox + PW * 0.5;
    var cy1 = oy - PH * (0.5 - bow);
    var cx2 = ox + PW * 0.75;
    var cy2 = oy - PH * (0.75 - bow * 0.7);
    svg += '<path d="M ' + ox + ' ' + oy + ' C ' + cx1 + ' ' + cy1 + ', ' + cx2 + ' ' + cy2 + ', ' + (GM.l + PW) + ' ' + GM.t + '" fill="none" stroke="' + colors[i] + '" stroke-width="2"/>';
    if (curveLabels[i]) {
      var lblX = ox + PW * 0.6;
      var lblY = oy - PH * (0.6 - bow * 0.6) + (i * 14);
      svg += '<text x="' + lblX + '" y="' + lblY + '" class="econ-graph-curve-label" fill="' + colors[i] + '">' + curveLabels[i] + '</text>';
    }
  }
  
  // Percentage marks
  for (var p = 0.25; p < 1; p += 0.25) {
    var tick = Math.round(p * 100);
    svg += '<text x="' + (ox + PW * p) + '" y="' + (oy + 12) + '" text-anchor="middle" class="econ-graph-label-xs">' + tick + '%</text>';
    svg += '<text x="' + (ox - 4) + '" y="' + (oy - PH * p + 3) + '" text-anchor="end" class="econ-graph-label-xs">' + tick + '%</text>';
    // Grid
    svg += '<line x1="' + (ox + PW * p) + '" y1="' + GM.t + '" x2="' + (ox + PW * p) + '" y2="' + oy + '" stroke="' + GC.grid + '" stroke-width="0.3"/>';
    svg += '<line x1="' + ox + '" y1="' + (oy - PH * p) + '" x2="' + (ox + PW) + '" y2="' + (oy - PH * p) + '" stroke="' + GC.grid + '" stroke-width="0.3"/>';
  }
  
  svg += '</svg>';
  return svg;
}


/* ============================================================
   TYPE 10: sd_surplus_labeled — S&D with labeled area points
   For questions asking about specific areas (A, B, C, etc.)
   ============================================================ */
function renderSdSurplusLabeled(cfg) {
  var lb = cfg.labels || {};
  var d = demandLine(), s = supplyLine();
  var eq = lineIntersect(d, s);
  
  var svg = svgOpen(GW, GH);
  svg += svgAxes(lb.xAxis, lb.yAxis);
  svg += svgEconLine(d, GC.demand, lb.demand || 'D');
  svg += svgEconLine(s, GC.supply, lb.supply || 'S');
  
  // Equilibrium
  svg += svgDash(px(eq.x), py(eq.y), true, true, lb.qe || 'Qe', lb.pe || 'Pe');
  svg += svgPoint(px(eq.x), py(eq.y), lb.eq || 'E', 'tr', GC.eq);
  
  // Additional elements based on config
  if (cfg.priceLine) {
    var plY = cfg.priceLine.y || (eq.y + 0.15);
    svg += '<line x1="' + GM.l + '" y1="' + py(plY) + '" x2="' + (GM.l+PW) + '" y2="' + py(plY) + '" stroke="' + GC.priceLine + '" stroke-width="1.5" stroke-dasharray="6 4"/>';
    if (cfg.priceLine.label) {
      svg += '<text x="' + (GM.l - 6) + '" y="' + (py(plY) + 4) + '" text-anchor="end" class="econ-graph-label-sm" fill="' + GC.priceLine + '">' + cfg.priceLine.label + '</text>';
    }
  }
  
  // Named points
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
   Returns an HTML string wrapping the SVG in a styled container.
   ============================================================ */
function generateGraphHTML(cfg) {
  if (!cfg || !cfg.type) return '';
  
  var svg = '';
  switch (cfg.type) {
    case 'sd_cross':          svg = renderSdCross(cfg); break;
    case 'sd_shift':          svg = renderSdShift(cfg); break;
    case 'sd_shift_cross':    svg = renderSdShiftCross(cfg); break;
    case 'sd_floor':          svg = renderSdFloor(cfg); break;
    case 'sd_ceiling':        svg = renderSdCeiling(cfg); break;
    case 'sd_tax':            svg = renderSdTax(cfg); break;
    case 'sd_quota':          svg = renderSdQuota(cfg); break;
    case 'sd_surplus':        svg = renderSdSurplus(cfg); break;
    case 'sd_surplus_labeled': svg = renderSdSurplusLabeled(cfg); break;
    case 'lorenz':            svg = renderLorenz(cfg); break;
    default: return '';
  }

  var title = cfg.title || '';
  var h = '<div class="econ-graph-container">';
  if (title) h += '<div class="econ-graph-title">' + title + '</div>';
  h += '<div class="econ-graph-wrap">' + svg + '</div>';
  h += '</div>';
  return h;
}

/* ---- Expose globally ---- */
window.generateGraphHTML = generateGraphHTML;
