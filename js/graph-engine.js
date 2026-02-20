/* ==========================================================
   DSE ECON v3.0 — Graph Engine Module (Integrated Build)
   
   Rewrite of v2.1 standalone engine for Answer-Tab integration.
   
   CHANGELOG v3.0:
   ─────────────────────────────────────────────────────────────
   1. DYNAMIC SCALING
      - init() measures parent container, not hardcoded dims.
      - ResizeObserver + window resize listener auto-re-render.
      - Econ coordinate system (0–100) is resolution-independent.

   2. VARIABLE MAPPING (External Config)
      - init() accepts an optional `config` object:
        { initialCurves, theme, readOnly, axisLabels, onStateChange }
      - Theme syncs with host app's light/dark via config.theme
        or auto-detects from <html class="dark">.
      - readOnly disables all pointer events.

   3. WHOLE-CURVE INTERACTION
      - Drag a curve by its body: maintains slope, translates
        both endpoints by the same delta.
      - Endpoints still individually draggable.

   4. STATE EXPORT (toJSON)
      - Captures: curves, labels, shading (manual polygons),
        referenceLines, quotas, lines, paintState history.
      - fromJSON() restores full state for reload.

   5. PEDAGOGICAL SILENCE
      - Zero automatic equilibrium calculations.
      - Zero automatic "D" / "S" labeling on curves.
      - All labels and shading are user-placed via Paint / Text tool.
   ─────────────────────────────────────────────────────────────
   ========================================================== */

;(function(root) {
'use strict';

/* ============================================================
   UTILITY
   ============================================================ */
var _U = {
  id: function() {
    return 'ge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
  },
  clamp: function(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  },
  deepClone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
};


/* ============================================================
   GRAPH STATE FACTORY
   Returns a fresh, empty graph state object.
   ============================================================ */
function initGraphState(seed) {
  var base = {
    curves:         [],  // [{id, type:'generic', label:'', color, p1:{x,y}, p2:{x,y}}]
    labels:         [],  // [{id, text, x, y, color, fontSize}]
    shading:        [],  // [{id, points:[{x,y},...], label, color}]
    referenceLines: [],  // [{pointId, curveId, attachment, t, pointX, pointY, labels:{horizontal, vertical}}]
    quotas:         [],  // [{curveId, pointId, attachment, t, x, start_y, end_y, label}]
    lines:          [],  // [{type:'horizontal', position, label}]
    showGrid:       true,
    selectedCurve:  null,
    mode:           'curve', // 'curve','paint','label','draw-curve','eraser','reference','line','quota'
    drawCurveState: null,
    paintState:     null,
    lineState:      null,
    quotaState:     null,
    paintColor:     '#3498DB'
  };
  if (seed) {
    // Merge seed into base (for initialCurves, etc.)
    Object.keys(seed).forEach(function(k) {
      if (seed[k] !== undefined) base[k] = seed[k];
    });
  }
  return base;
}


/* ============================================================
   DEFAULT CONFIG
   ============================================================ */
var DEFAULT_CONFIG = {
  /* Pre-loaded curves from question data. Array of curve objects:
     [{type:'generic', label:'', color:'#000', p1:{x,y}, p2:{x,y}}] */
  initialCurves: null,

  /* 'light' | 'dark' | 'auto' (auto-detect from <html>.classList) */
  theme: 'auto',

  /* If true, all dragging / editing is disabled (view-only) */
  readOnly: false,

  /* Custom axis labels.  null = use defaults */
  axisLabels: null, // { x: 'Quantity', y: 'Price (HK$)', origin: '0' }

  /* Callback fired after every state mutation (for auto-save) */
  onStateChange: null,

  /* Margins around the plot area (px) */
  margin: { top: 24, right: 24, bottom: 44, left: 54 }
};


/* ============================================================
   GRAPH ENGINE CONSTRUCTOR
   Usage:
     var engine = new GraphEngine(containerEl, graphState, config);
   ============================================================ */
function GraphEngine(containerEl, graphState, config) {
  if (!(this instanceof GraphEngine)) {
    return new GraphEngine(containerEl, graphState, config);
  }

  this._container = containerEl;
  this.gs         = graphState || initGraphState();
  this.config     = {};
  this.canvas     = null;
  this.ctx        = null;
  this.w          = 0;
  this.h          = 0;
  this.margin     = { top: 24, right: 24, bottom: 44, left: 54 };

  // Undo / redo
  this._undoStack = [];
  this._redoStack = [];

  // Drag internals
  this._dragging  = null;
  this._dragStartEcon = null; // econ coords at drag start for whole-curve

  // Bound listener refs (for cleanup)
  this._boundHandlers = {};
  this._resizeObserver = null;
  this._resizeTimeout  = null;

  // Apply config
  this._applyConfig(config || {});

  // Inject initial curves if provided
  if (this.config.initialCurves && this.config.initialCurves.length) {
    var self = this;
    this.config.initialCurves.forEach(function(c) {
      var curve = {
        id:    c.id || _U.id(),
        type:  c.type  || 'generic',
        label: c.label || '',    // ← Pedagogical Silence: empty by default
        color: c.color || '#000000',
        p1:    { x: c.p1.x, y: c.p1.y },
        p2:    { x: c.p2.x, y: c.p2.y }
      };
      self.gs.curves.push(curve);
    });
  }

  // Build canvas and attach
  this._buildCanvas();
  this._bindEvents();
  this._startResizeObserver();
  this.render();
}


/* ============================================================
   PROTOTYPE
   ============================================================ */
GraphEngine.prototype = {

  /* ----------------------------------------------------------
     CONFIG
     ---------------------------------------------------------- */
  _applyConfig: function(cfg) {
    var c = this.config;
    var d = DEFAULT_CONFIG;
    c.initialCurves = cfg.initialCurves || d.initialCurves;
    c.theme         = cfg.theme         || d.theme;
    c.readOnly      = !!cfg.readOnly;
    c.axisLabels    = cfg.axisLabels    || d.axisLabels;
    c.onStateChange = cfg.onStateChange || d.onStateChange;
    if (cfg.margin) {
      this.margin = {
        top:    cfg.margin.top    !== undefined ? cfg.margin.top    : d.margin.top,
        right:  cfg.margin.right  !== undefined ? cfg.margin.right  : d.margin.right,
        bottom: cfg.margin.bottom !== undefined ? cfg.margin.bottom : d.margin.bottom,
        left:   cfg.margin.left   !== undefined ? cfg.margin.left   : d.margin.left
      };
    } else {
      this.margin = _U.deepClone(d.margin);
    }
  },

  /* Update config at runtime (e.g., toggle readOnly or theme) */
  updateConfig: function(cfg) {
    if (cfg.theme !== undefined)    this.config.theme    = cfg.theme;
    if (cfg.readOnly !== undefined) this.config.readOnly = !!cfg.readOnly;
    if (cfg.axisLabels !== undefined) this.config.axisLabels = cfg.axisLabels;
    if (cfg.onStateChange !== undefined) this.config.onStateChange = cfg.onStateChange;
    this.render();
  },


  /* ----------------------------------------------------------
     DYNAMIC SCALING — Canvas creation & resize
     ---------------------------------------------------------- */
  _buildCanvas: function() {
    // Create canvas if not already inside container
    var existing = this._container.querySelector('canvas.ge-canvas');
    if (existing) {
      this.canvas = existing;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ge-canvas';
      this.canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:crosshair;';
      this._container.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    this._sizeCanvas();
  },

  _sizeCanvas: function() {
    var rect = this._container.getBoundingClientRect();
    var dpr  = window.devicePixelRatio || 1;
    var w = Math.max(rect.width,  100);
    var h = Math.max(rect.height, 100);

    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    this.ctx.scale(dpr, dpr);
    this.w = w;
    this.h = h;
  },

  _startResizeObserver: function() {
    var self = this;

    // ResizeObserver for parent container
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(function() {
        self._onResize();
      });
      this._resizeObserver.observe(this._container);
    }

    // Fallback: window resize
    this._boundHandlers._winResize = function() { self._onResize(); };
    window.addEventListener('resize', this._boundHandlers._winResize);
  },

  _onResize: function() {
    var self = this;
    clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(function() {
      self._sizeCanvas();
      self.render();
    }, 60);
  },


  /* ----------------------------------------------------------
     COORDINATE TRANSFORMS (Econ 0–100 ↔ Pixel)
     ---------------------------------------------------------- */
  toPixX: function(ex) {
    return this.margin.left + (ex / 100) * (this.w - this.margin.left - this.margin.right);
  },
  toPixY: function(ey) {
    return this.margin.top + (1 - ey / 100) * (this.h - this.margin.top - this.margin.bottom);
  },
  toEconX: function(px) {
    return ((px - this.margin.left) / (this.w - this.margin.left - this.margin.right)) * 100;
  },
  toEconY: function(py) {
    return (1 - (py - this.margin.top) / (this.h - this.margin.top - this.margin.bottom)) * 100;
  },


  /* ----------------------------------------------------------
     UNDO / REDO
     ---------------------------------------------------------- */
  _pushState: function() {
    this._undoStack.push(_U.deepClone(this.gs));
    if (this._undoStack.length > 50) this._undoStack.shift();
    this._redoStack = [];
  },

  undo: function() {
    if (this._undoStack.length) {
      this._redoStack.push(_U.deepClone(this.gs));
      var prev = this._undoStack.pop();
      // Preserve current mode
      var mode = this.gs.mode;
      this.gs = prev;
      this.gs.mode = mode;
      this.render();
      this._notifyChange();
    }
  },

  redo: function() {
    if (this._redoStack.length) {
      this._undoStack.push(_U.deepClone(this.gs));
      var next = this._redoStack.pop();
      var mode = this.gs.mode;
      this.gs = next;
      this.gs.mode = mode;
      this.render();
      this._notifyChange();
    }
  },


  /* ----------------------------------------------------------
     THEME DETECTION
     ---------------------------------------------------------- */
  _isDark: function() {
    if (this.config.theme === 'dark') return true;
    if (this.config.theme === 'light') return false;
    // auto
    return document.documentElement.classList.contains('dark');
  },


  /* ----------------------------------------------------------
     RENDER
     ---------------------------------------------------------- */
  render: function() {
    var ctx = this.ctx, gs = this.gs, w = this.w, h = this.h;
    var self = this;
    var isDark = this._isDark();
    var font = getComputedStyle(document.body).fontFamily || 'sans-serif';

    ctx.clearRect(0, 0, w, h);

    // ── Background ──
    ctx.fillStyle = isDark ? '#1e293b' : '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // ── Grid ──
    if (gs.showGrid) {
      ctx.strokeStyle = isDark ? '#334155' : '#f0f0f0';
      ctx.lineWidth = 0.5;
      for (var i = 0; i <= 10; i++) {
        var gx = this.toPixX(i * 10), gy = this.toPixY(i * 10);
        ctx.beginPath(); ctx.moveTo(gx, this.margin.top); ctx.lineTo(gx, h - this.margin.bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.margin.left, gy); ctx.lineTo(w - this.margin.right, gy); ctx.stroke();
      }
    }

    // ── Manual polygon shading ──
    gs.shading.forEach(function(polygon) {
      self._renderPolygon(ctx, polygon, font);
    });

    // ── Horizontal lines ──
    gs.lines.forEach(function(line) {
      ctx.strokeStyle = isDark ? '#94a3b8' : '#666666';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      if (line.type === 'horizontal') {
        var hy = self.toPixY(line.position);
        ctx.moveTo(self.margin.left, hy);
        ctx.lineTo(self.w - self.margin.right, hy);
      }
      ctx.stroke();
      if (line.label) {
        ctx.fillStyle = isDark ? '#94a3b8' : '#666666';
        ctx.font = '500 11px ' + font;
        var lw = ctx.measureText(line.label).width;
        ctx.fillText(line.label, self.margin.left - lw - 8, self.toPixY(line.position) + 4);
      }
    });

    // ── Quota lines ──
    gs.quotas.forEach(function(quota) {
      ctx.strokeStyle = '#6f42c1';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      var vx = self.toPixX(quota.x);
      var py1 = self.toPixY(quota.start_y);
      var py2 = self.toPixY(quota.end_y);
      ctx.moveTo(vx, py1);
      ctx.lineTo(vx, py2);
      ctx.stroke();
      if (quota.label) {
        ctx.fillStyle = '#6f42c1';
        ctx.font = '500 11px ' + font;
        ctx.textAlign = 'center';
        ctx.fillText(quota.label, vx, Math.min(py1, py2) - 5);
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = '#6f42c1';
      ctx.beginPath();
      ctx.arc(vx, py2, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Curves ──
    // PEDAGOGICAL SILENCE: No auto-labeling. Only render curve.label if user set it.
    gs.curves.forEach(function(curve) {
      var isSelected = (gs.selectedCurve === curve.id);
      ctx.strokeStyle = curve.color;
      ctx.lineWidth = isSelected ? 3.5 : 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(self.toPixX(curve.p1.x), self.toPixY(curve.p1.y));
      ctx.lineTo(self.toPixX(curve.p2.x), self.toPixY(curve.p2.y));
      ctx.stroke();

      // Render label ONLY if user manually placed one (Pedagogical Silence)
      if (curve.label) {
        ctx.fillStyle = curve.color;
        ctx.font = '600 13px ' + font;
        ctx.fillText(curve.label, self.toPixX(curve.p2.x) + 6, self.toPixY(curve.p2.y) + 4);
      }

      // Endpoints
      [curve.p1, curve.p2].forEach(function(pt) {
        ctx.fillStyle = isDark ? '#0f172a' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(self.toPixX(pt.x), self.toPixY(pt.y), isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = curve.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Body highlight when selected (subtle glow)
      if (isSelected) {
        ctx.strokeStyle = curve.color;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(self.toPixX(curve.p1.x), self.toPixY(curve.p1.y));
        ctx.lineTo(self.toPixX(curve.p2.x), self.toPixY(curve.p2.y));
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // ── Axes ──
    ctx.strokeStyle = isDark ? '#94a3b8' : '#5C5650';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(this.margin.left, this.margin.top);
    ctx.lineTo(this.margin.left, h - this.margin.bottom);
    ctx.lineTo(w - this.margin.right, h - this.margin.bottom);
    ctx.stroke();

    // Axis labels
    var axLabels = this.config.axisLabels || { y: 'Price (HK$)', x: 'Quantity', origin: '0' };
    ctx.fillStyle = isDark ? '#cbd5e1' : '#5C5650';
    ctx.font = '600 12px ' + font;
    ctx.fillText(axLabels.y || 'Price (HK$)', 4, this.margin.top - 6);
    ctx.fillText(axLabels.x || 'Quantity', w - this.margin.right - 24, h - 6);
    ctx.fillText(axLabels.origin || '0', this.margin.left - 12, h - this.margin.bottom + 14);

    // ── Custom labels ──
    gs.labels.forEach(function(lbl) {
      ctx.fillStyle = lbl.color || (isDark ? '#f1f5f9' : '#1A1816');
      ctx.font = (lbl.fontSize || '500 11px') + ' ' + font;
      ctx.fillText(lbl.text, self.toPixX(lbl.x), self.toPixY(lbl.y));
    });

    // ── Reference lines ──
    gs.referenceLines.forEach(function(refLine) {
      ctx.strokeStyle = isDark ? '#64748b' : '#666666';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      var hy = self.toPixY(refLine.pointY);
      var vx = self.toPixX(refLine.pointX);
      ctx.beginPath(); ctx.moveTo(self.margin.left, hy); ctx.lineTo(vx, hy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vx, hy); ctx.lineTo(vx, self.h - self.margin.bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#64748b' : '#666666';
      ctx.font = '500 11px ' + font;
      if (refLine.labels.horizontal) {
        ctx.fillText(refLine.labels.horizontal, self.margin.left - 30, hy + 4);
      }
      if (refLine.labels.vertical) {
        ctx.fillText(refLine.labels.vertical, vx + 4, self.h - self.margin.bottom + 15);
      }
    });

    // ── Paint preview ──
    if (gs.mode === 'paint' && gs.paintState && gs.paintState.points.length > 0) {
      ctx.strokeStyle = gs.paintState.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      gs.paintState.points.forEach(function(p, i) {
        var px = self.toPixX(p.x), py = self.toPixY(p.y);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      gs.paintState.points.forEach(function(p) {
        ctx.fillStyle = gs.paintState.color;
        ctx.beginPath();
        ctx.arc(self.toPixX(p.x), self.toPixY(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // ── Draw-curve preview ──
    if (gs.mode === 'draw-curve' && gs.drawCurveState && gs.drawCurveState.points.length > 0) {
      ctx.strokeStyle = isDark ? '#e2e8f0' : '#000000';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      gs.drawCurveState.points.forEach(function(p, i) {
        var px = self.toPixX(p.x), py = self.toPixY(p.y);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      gs.drawCurveState.points.forEach(function(p) {
        ctx.fillStyle = isDark ? '#e2e8f0' : '#000000';
        ctx.beginPath();
        ctx.arc(self.toPixX(p.x), self.toPixY(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // ── Read-only overlay ──
    if (this.config.readOnly) {
      ctx.fillStyle = isDark ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, 0, w, h);
    }
  },

  _renderPolygon: function(ctx, polygon, font) {
    if (!polygon.points || polygon.points.length < 3) return;
    var self = this;
    var isDark = this._isDark();
    ctx.fillStyle = polygon.color || '#3498DB';
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    polygon.points.forEach(function(p, i) {
      var px = self.toPixX(p.x), py = self.toPixY(p.y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    if (polygon.label) {
      var cx = polygon.points.reduce(function(s, p) { return s + p.x; }, 0) / polygon.points.length;
      var cy = polygon.points.reduce(function(s, p) { return s + p.y; }, 0) / polygon.points.length;
      ctx.fillStyle = polygon.color || '#3498DB';
      ctx.font = '700 12px ' + font;
      ctx.fillText(polygon.label, this.toPixX(cx) - 8, this.toPixY(cy) + 4);
    }
  },


  /* ----------------------------------------------------------
     HIT TESTING
     ---------------------------------------------------------- */
  _pointToLineDistance: function(pos, curve) {
    var x1 = this.toPixX(curve.p1.x), y1 = this.toPixY(curve.p1.y);
    var x2 = this.toPixX(curve.p2.x), y2 = this.toPixY(curve.p2.y);
    var A = pos.x - x1, B = pos.y - y1;
    var C = x2 - x1,    D = y2 - y1;
    var dot = A * C + B * D;
    var lenSq = C * C + D * D;
    var param = lenSq !== 0 ? dot / lenSq : -1;
    var xx, yy;
    if (param < 0)      { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else                { xx = x1 + param * C; yy = y1 + param * D; }
    var dx = pos.x - xx, dy = pos.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  },

  _getClosestParamOnCurve: function(pos, curve) {
    var x1 = this.toPixX(curve.p1.x), y1 = this.toPixY(curve.p1.y);
    var x2 = this.toPixX(curve.p2.x), y2 = this.toPixY(curve.p2.y);
    var C = x2 - x1, D = y2 - y1;
    var lenSq = C * C + D * D;
    if (lenSq === 0) return 0;
    return ((pos.x - x1) * C + (pos.y - y1) * D) / lenSq;
  },

  _pointInPolygon: function(pos, polygon) {
    if (!polygon.points || polygon.points.length < 3) return false;
    var inside = false;
    var x = this.toEconX(pos.x), y = this.toEconY(pos.y);
    var pts = polygon.points;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i].x, yi = pts[i].y;
      var xj = pts[j].x, yj = pts[j].y;
      var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  },

  _findHit: function(pos) {
    var gs = this.gs, self = this;

    // Endpoints first (highest priority)
    for (var i = 0; i < gs.curves.length; i++) {
      var c = gs.curves[i];
      var pts = [c.p1, c.p2];
      for (var j = 0; j < pts.length; j++) {
        var dx = self.toPixX(pts[j].x) - pos.x, dy = self.toPixY(pts[j].y) - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 18) {
          return { curveIdx: i, pointIdx: j, type: 'endpoint' };
        }
      }
    }

    // Curve body (for whole-curve drag)
    for (var i = 0; i < gs.curves.length; i++) {
      var dist = self._pointToLineDistance(pos, gs.curves[i]);
      if (dist < 10) {
        return { curveIdx: i, type: 'curve' };
      }
    }

    // Horizontal lines
    for (var i = 0; i < gs.lines.length; i++) {
      var line = gs.lines[i];
      if (line.type === 'horizontal') {
        if (Math.abs(pos.y - self.toPixY(line.position)) < 8) {
          return { type: 'line', lineIdx: i };
        }
      }
    }

    // Quota draggable points
    for (var i = 0; i < gs.quotas.length; i++) {
      var q = gs.quotas[i];
      var vx = self.toPixX(q.x), hy = self.toPixY(q.end_y);
      var dx = vx - pos.x, dy = hy - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 16) {
        return { type: 'quota_point', quotaIdx: i };
      }
    }

    return null;
  },

  findIntersection: function(c1, c2) {
    var x1 = c1.p1.x, y1 = c1.p1.y, x2 = c1.p2.x, y2 = c1.p2.y;
    var x3 = c2.p1.x, y3 = c2.p1.y, x4 = c2.p2.x, y4 = c2.p2.y;
    var denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return null;
    var t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  },


  /* ----------------------------------------------------------
     LABEL DIALOG (Promise-based)
     ---------------------------------------------------------- */
  _showLabelDialog: function(currentLabel) {
    var isDark = this._isDark();
    var bg  = isDark ? '#1e293b' : '#ffffff';
    var bdr = isDark ? '#475569' : '#e2e8f0';
    var txt = isDark ? '#f1f5f9' : '#1e293b';
    var btnBg = '#2563eb';

    var dialog = document.createElement('div');
    dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:' + bg + ';padding:20px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:10000;border:1px solid ' + bdr + ';min-width:260px;';
    dialog.innerHTML = '<div style="font-weight:600;margin-bottom:10px;color:' + txt + ';font-size:14px;">Enter Label</div>' +
      '<input type="text" value="' + (currentLabel || '') + '" style="width:100%;padding:8px 12px;margin-bottom:12px;border:1px solid ' + bdr + ';border-radius:6px;background:' + (isDark ? '#0f172a' : '#f8fafc') + ';color:' + txt + ';font-size:14px;box-sizing:border-box;" placeholder="e.g. P₁, D, CS">' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
      '<button style="padding:6px 16px;background:' + (isDark ? '#334155' : '#e2e8f0') + ';color:' + txt + ';border:none;border-radius:6px;cursor:pointer;font-size:13px;">Cancel</button>' +
      '<button style="padding:6px 16px;background:' + btnBg + ';color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">OK</button>' +
      '</div>';

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;';

    var input     = dialog.querySelector('input');
    var cancelBtn = dialog.querySelectorAll('button')[0];
    var okBtn     = dialog.querySelectorAll('button')[1];

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    input.focus();
    input.select();

    return new Promise(function(resolve) {
      function close(val) {
        if (document.body.contains(dialog))  document.body.removeChild(dialog);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        resolve(val);
      }
      okBtn.onclick     = function() { close(input.value); };
      cancelBtn.onclick = function() { close(null); };
      overlay.onclick   = function() { close(null); };
      input.onkeydown   = function(e) {
        if (e.key === 'Enter')  close(input.value);
        if (e.key === 'Escape') close(null);
      };
    });
  },


  /* ----------------------------------------------------------
     EVENT BINDING
     ---------------------------------------------------------- */
  _bindEvents: function() {
    var self   = this;
    var gs     = this.gs;
    var canvas = this.canvas;

    function getPos(e) {
      var r = canvas.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return { x: x, y: y };
    }

    /* ──── POINTER DOWN ──── */
    function onDown(e) {
      if (self.config.readOnly) return;
      var pos = getPos(e);
      var gs  = self.gs;

      if (gs.mode === 'curve') {
        var hit = self._findHit(pos);
        if (hit) {
          self._pushState();
          self._dragging = hit;

          if (hit.type === 'endpoint' || hit.type === 'curve') {
            gs.selectedCurve = gs.curves[hit.curveIdx].id;
          }

          // For whole-curve drag: store initial cursor in econ coords
          if (hit.type === 'curve') {
            var curve = gs.curves[hit.curveIdx];
            self._dragStartEcon = {
              cursorX: self.toEconX(pos.x),
              cursorY: self.toEconY(pos.y),
              p1: { x: curve.p1.x, y: curve.p1.y },
              p2: { x: curve.p2.x, y: curve.p2.y }
            };
          }

          self.render();
          e.preventDefault();
        }
      } else if (gs.mode === 'reference') {
        var hit = self._findHit(pos);
        if (hit && (hit.type === 'curve' || hit.type === 'endpoint')) {
          self._pushState();
          var curve = gs.curves[hit.curveIdx];
          var point, attachment, t = null;
          var pointId = curve.id + '_' + (hit.type === 'endpoint' ? hit.pointIdx : 'body_' + Date.now());
          attachment = hit.type === 'endpoint' ? (hit.pointIdx === 0 ? 'p1' : 'p2') : 'body';
          if (hit.type === 'endpoint') {
            point = hit.pointIdx === 0 ? curve.p1 : curve.p2;
          } else {
            t = self._getClosestParamOnCurve(pos, curve);
            point = {
              x: curve.p1.x + t * (curve.p2.x - curve.p1.x),
              y: curve.p1.y + t * (curve.p2.y - curve.p1.y)
            };
          }
          gs.referenceLines = gs.referenceLines.filter(function(rl) { return rl.pointId !== pointId; });
          gs.referenceLines.push({
            pointId: pointId, curveId: curve.id, attachment: attachment,
            t: t, pointX: point.x, pointY: point.y,
            labels: { horizontal: '', vertical: '' }
          });
          self.render();
          self._notifyChange();
          e.preventDefault();
        }
      } else if (gs.mode === 'label') {
        _handleLabelDown(pos, e);
      } else if (gs.mode === 'eraser') {
        _handleEraserDown(pos, e);
      } else if (gs.mode === 'draw-curve') {
        _handleDrawCurveDown(pos, e);
      } else if (gs.mode === 'paint') {
        _handlePaintDown(pos, e);
      } else if (gs.mode === 'line') {
        _handleLineDown(pos, e);
      } else if (gs.mode === 'quota') {
        _handleQuotaDown(pos, e);
      }
    }

    /* ──── POINTER MOVE ──── */
    function onMove(e) {
      if (self.config.readOnly) return;
      if (!self._dragging) return;
      var pos = getPos(e);
      var gs  = self.gs;
      var ex  = _U.clamp(self.toEconX(pos.x), 0, 100);
      var ey  = _U.clamp(self.toEconY(pos.y), 0, 100);

      var drg = self._dragging;

      if (drg.type === 'endpoint') {
        var curve = gs.curves[drg.curveIdx];
        var pt    = drg.pointIdx === 0 ? curve.p1 : curve.p2;
        var oldY  = pt.y;
        pt.x = ex; pt.y = ey;
        var dy = ey - oldY;
        _updateAttachedElements(curve, dy);

      } else if (drg.type === 'curve') {
        /* ── WHOLE-CURVE DRAG (slope preserved) ── */
        var curve = gs.curves[drg.curveIdx];
        var ds    = self._dragStartEcon;
        var dex   = ex - ds.cursorX;
        var dey   = ey - ds.cursorY;

        // Compute new positions from stored originals
        var np1x = _U.clamp(ds.p1.x + dex, 0, 100);
        var np1y = _U.clamp(ds.p1.y + dey, 0, 100);
        var np2x = _U.clamp(ds.p2.x + dex, 0, 100);
        var np2y = _U.clamp(ds.p2.y + dey, 0, 100);

        var actualDx = np1x - curve.p1.x;
        var actualDy = np1y - curve.p1.y;

        curve.p1.x = np1x; curve.p1.y = np1y;
        curve.p2.x = np2x; curve.p2.y = np2y;

        _updateAttachedElementsTranslate(curve, actualDx, actualDy);

      } else if (drg.type === 'line') {
        gs.lines[drg.lineIdx].position = ey;

      } else if (drg.type === 'quota_point') {
        var q = gs.quotas[drg.quotaIdx];
        q.end_y = Math.max(q.start_y, ey);
        q.attachment = 'custom';
        q.t = null;
      }

      self.render();
      e.preventDefault();
    }

    /* ──── POINTER UP ──── */
    function onUp() {
      if (self._dragging) {
        self._dragging = null;
        self._dragStartEcon = null;
        self._notifyChange();
      }
    }

    /* ──── Helper: update reference lines & quotas after endpoint drag ──── */
    function _updateAttachedElements(curve, dy) {
      var gs = self.gs;
      gs.referenceLines.forEach(function(rl) {
        if (rl.curveId !== curve.id) return;
        if (rl.attachment === 'p1')   { rl.pointX = curve.p1.x; rl.pointY = curve.p1.y; }
        else if (rl.attachment === 'p2') { rl.pointX = curve.p2.x; rl.pointY = curve.p2.y; }
        else if (rl.attachment === 'body') {
          rl.pointX = curve.p1.x + rl.t * (curve.p2.x - curve.p1.x);
          rl.pointY = curve.p1.y + rl.t * (curve.p2.y - curve.p1.y);
        }
      });
      gs.quotas.forEach(function(q) {
        if (q.curveId !== curve.id || q.attachment === 'custom') return;
        if (q.attachment === 'p1')      { q.x = curve.p1.x; q.start_y = curve.p1.y; q.end_y += dy; }
        else if (q.attachment === 'p2') { q.x = curve.p2.x; q.start_y = curve.p2.y; q.end_y += dy; }
        else if (q.attachment === 'body') {
          q.x = curve.p1.x + q.t * (curve.p2.x - curve.p1.x);
          q.start_y = curve.p1.y + q.t * (curve.p2.y - curve.p1.y);
          q.end_y += dy;
        }
        q.end_y = Math.max(q.start_y, q.end_y);
      });
    }

    /* ──── Helper: update attached elements for whole-curve translate ──── */
    function _updateAttachedElementsTranslate(curve, dx, dy) {
      var gs = self.gs;
      gs.referenceLines.forEach(function(rl) {
        if (rl.curveId !== curve.id) return;
        if (rl.attachment === 'p1')   { rl.pointX = curve.p1.x; rl.pointY = curve.p1.y; }
        else if (rl.attachment === 'p2') { rl.pointX = curve.p2.x; rl.pointY = curve.p2.y; }
        else if (rl.attachment === 'body') {
          rl.pointX = curve.p1.x + rl.t * (curve.p2.x - curve.p1.x);
          rl.pointY = curve.p1.y + rl.t * (curve.p2.y - curve.p1.y);
        }
      });
      gs.quotas.forEach(function(q) {
        if (q.curveId !== curve.id || q.attachment === 'custom') return;
        if (q.attachment === 'p1')      { q.x = curve.p1.x; q.start_y = curve.p1.y; }
        else if (q.attachment === 'p2') { q.x = curve.p2.x; q.start_y = curve.p2.y; }
        else if (q.attachment === 'body') {
          q.x = curve.p1.x + q.t * (curve.p2.x - curve.p1.x);
          q.start_y = curve.p1.y + q.t * (curve.p2.y - curve.p1.y);
        }
        q.end_y += dy;
        q.end_y = Math.max(q.start_y, q.end_y);
      });
    }

    /* ──── LABEL MODE ──── */
    function _handleLabelDown(pos, e) {
      var gs = self.gs;
      // Curves
      for (var i = 0; i < gs.curves.length; i++) {
        if (self._pointToLineDistance(pos, gs.curves[i]) < 8) {
          var c = gs.curves[i];
          self._showLabelDialog(c.label || '').then(function(val) {
            if (val !== null) { self._pushState(); c.label = val; self.render(); self._notifyChange(); }
          });
          e.preventDefault(); return;
        }
      }
      // Polygons
      for (var i = 0; i < gs.shading.length; i++) {
        if (self._pointInPolygon(pos, gs.shading[i])) {
          var poly = gs.shading[i];
          self._showLabelDialog(poly.label || '').then(function(val) {
            if (val !== null) { self._pushState(); poly.label = val; self.render(); self._notifyChange(); }
          });
          e.preventDefault(); return;
        }
      }
      // Reference lines
      for (var i = 0; i < gs.referenceLines.length; i++) {
        var rl = gs.referenceLines[i];
        var hy = self.toPixY(rl.pointY), vx = self.toPixX(rl.pointX);
        if (Math.abs(pos.y - hy) < 8 || Math.abs(pos.x - vx) < 8) {
          var labelType = Math.abs(pos.y - hy) < 8 ? 'horizontal' : 'vertical';
          (function(ref, lt) {
            self._showLabelDialog(ref.labels[lt] || '').then(function(val) {
              if (val !== null) { self._pushState(); ref.labels[lt] = val; self.render(); self._notifyChange(); }
            });
          })(rl, labelType);
          e.preventDefault(); return;
        }
      }
      // Quota lines
      for (var i = 0; i < gs.quotas.length; i++) {
        var q = gs.quotas[i];
        var vx = self.toPixX(q.x);
        var py1 = self.toPixY(q.start_y), py2 = self.toPixY(q.end_y);
        if (Math.abs(pos.x - vx) < 8 && pos.y >= Math.min(py1, py2) && pos.y <= Math.max(py1, py2)) {
          (function(quota) {
            self._showLabelDialog(quota.label || '').then(function(val) {
              if (val !== null) { self._pushState(); quota.label = val; self.render(); self._notifyChange(); }
            });
          })(q);
          e.preventDefault(); return;
        }
      }
      // Simple lines
      for (var i = 0; i < gs.lines.length; i++) {
        if (Math.abs(pos.y - self.toPixY(gs.lines[i].position)) < 8) {
          (function(line) {
            self._showLabelDialog(line.label || '').then(function(val) {
              if (val !== null) { self._pushState(); line.label = val; self.render(); self._notifyChange(); }
            });
          })(gs.lines[i]);
          e.preventDefault(); return;
        }
      }
      // Click on empty space → add a free-floating text label
      var ex = _U.clamp(self.toEconX(pos.x), 0, 100);
      var ey = _U.clamp(self.toEconY(pos.y), 0, 100);
      self._showLabelDialog('').then(function(val) {
        if (val) {
          self._pushState();
          gs.labels.push({ id: _U.id(), text: val, x: ex, y: ey, color: null, fontSize: null });
          self.render();
          self._notifyChange();
        }
      });
      e.preventDefault();
    }

    /* ──── ERASER MODE ──── */
    function _handleEraserDown(pos, e) {
      var gs = self.gs;
      self._pushState();
      // Curves
      for (var i = gs.curves.length - 1; i >= 0; i--) {
        if (self._pointToLineDistance(pos, gs.curves[i]) < 8) {
          var cid = gs.curves[i].id;
          gs.curves.splice(i, 1);
          gs.referenceLines = gs.referenceLines.filter(function(rl) { return rl.curveId !== cid; });
          gs.quotas = gs.quotas.filter(function(q) { return q.curveId !== cid; });
          if (gs.selectedCurve === cid) gs.selectedCurve = null;
          self.render(); self._notifyChange(); e.preventDefault(); return;
        }
      }
      // Polygons
      for (var i = gs.shading.length - 1; i >= 0; i--) {
        if (self._pointInPolygon(pos, gs.shading[i])) {
          gs.shading.splice(i, 1); self.render(); self._notifyChange(); e.preventDefault(); return;
        }
      }
      // Lines
      for (var i = gs.lines.length - 1; i >= 0; i--) {
        if (gs.lines[i].type === 'horizontal' && Math.abs(pos.y - self.toPixY(gs.lines[i].position)) < 8) {
          gs.lines.splice(i, 1); self.render(); self._notifyChange(); e.preventDefault(); return;
        }
      }
      // Reference lines
      for (var i = gs.referenceLines.length - 1; i >= 0; i--) {
        var rl = gs.referenceLines[i];
        if (Math.abs(pos.y - self.toPixY(rl.pointY)) < 8 || Math.abs(pos.x - self.toPixX(rl.pointX)) < 8) {
          gs.referenceLines.splice(i, 1); self.render(); self._notifyChange(); e.preventDefault(); return;
        }
      }
      // Quotas
      for (var i = gs.quotas.length - 1; i >= 0; i--) {
        var q = gs.quotas[i], vx = self.toPixX(q.x);
        var py1 = self.toPixY(q.start_y), py2 = self.toPixY(q.end_y);
        if (Math.abs(pos.x - vx) < 8 && pos.y >= Math.min(py1, py2) && pos.y <= Math.max(py1, py2)) {
          gs.quotas.splice(i, 1); self.render(); self._notifyChange(); e.preventDefault(); return;
        }
      }
      // Labels
      for (var i = gs.labels.length - 1; i >= 0; i--) {
        var lbl = gs.labels[i];
        var lx = self.toPixX(lbl.x), ly = self.toPixY(lbl.y);
        if (Math.abs(pos.x - lx) < 30 && Math.abs(pos.y - ly) < 14) {
          gs.labels.splice(i, 1); self.render(); self._notifyChange(); e.preventDefault(); return;
        }
      }
    }

    /* ──── DRAW CURVE ──── */
    function _handleDrawCurveDown(pos, e) {
      var gs = self.gs;
      if (!gs.drawCurveState) gs.drawCurveState = { points: [] };
      var ex = _U.clamp(self.toEconX(pos.x), 0, 100);
      var ey = _U.clamp(self.toEconY(pos.y), 0, 100);
      gs.drawCurveState.points.push({ x: ex, y: ey });
      if (gs.drawCurveState.points.length >= 2) {
        self._pushState();
        // PEDAGOGICAL SILENCE: label is empty, no auto "D" or "S"
        var newC = {
          id: _U.id(), type: 'generic', label: '',
          color: '#000000',
          p1: gs.drawCurveState.points[0],
          p2: gs.drawCurveState.points[1]
        };
        gs.curves.push(newC);
        gs.selectedCurve = newC.id;
        gs.drawCurveState = null;
        self._notifyChange();
      }
      self.render();
      e.preventDefault();
    }

    /* ──── PAINT (polygon shading) ──── */
    function _handlePaintDown(pos, e) {
      var gs = self.gs;
      if (!gs.paintState) {
        gs.paintState = { id: _U.id(), points: [], color: gs.paintColor };
      }
      var ex = _U.clamp(self.toEconX(pos.x), 0, 100);
      var ey = _U.clamp(self.toEconY(pos.y), 0, 100);
      gs.paintState.points.push({ x: ex, y: ey });
      if (gs.paintState.points.length >= 4) {
        self._pushState();
        gs.shading.push({
          id: gs.paintState.id,
          points: gs.paintState.points,
          label: '',
          color: gs.paintState.color
        });
        gs.paintState = null;
        self._notifyChange();
      }
      self.render();
      e.preventDefault();
    }

    /* ──── LINE ──── */
    function _handleLineDown(pos, e) {
      var gs = self.gs;
      // Check existing lines for drag
      for (var i = 0; i < gs.lines.length; i++) {
        if (gs.lines[i].type === 'horizontal' && Math.abs(pos.y - self.toPixY(gs.lines[i].position)) < 8) {
          self._pushState();
          self._dragging = { type: 'line', lineIdx: i };
          e.preventDefault(); return;
        }
      }
      // New line
      self._pushState();
      gs.lines.push({ type: 'horizontal', position: self.toEconY(pos.y), label: '' });
      self.render();
      self._notifyChange();
      e.preventDefault();
    }

    /* ──── QUOTA ──── */
    function _handleQuotaDown(pos, e) {
      var gs = self.gs;
      var hit = self._findHit(pos);
      if (hit && (hit.type === 'curve' || hit.type === 'endpoint')) {
        self._pushState();
        var curve = gs.curves[hit.curveIdx];
        var point, attachment, t = null;
        var pointId = curve.id + '_quota_' + Date.now();
        attachment = hit.type === 'endpoint' ? (hit.pointIdx === 0 ? 'p1' : 'p2') : 'body';
        if (hit.type === 'endpoint') {
          point = hit.pointIdx === 0 ? curve.p1 : curve.p2;
        } else {
          t = self._getClosestParamOnCurve(pos, curve);
          point = {
            x: curve.p1.x + t * (curve.p2.x - curve.p1.x),
            y: curve.p1.y + t * (curve.p2.y - curve.p1.y)
          };
        }
        gs.quotas = gs.quotas.filter(function(q) { return q.curveId !== curve.id; });
        gs.quotas.push({
          curveId: curve.id, pointId: pointId, attachment: attachment,
          t: t, x: point.x, start_y: point.y, end_y: point.y + 20, label: ''
        });
        self.render();
        self._notifyChange();
        e.preventDefault();
      }
    }

    /* ──── ATTACH LISTENERS ──── */
    canvas.addEventListener('mousedown',  onDown);
    canvas.addEventListener('mousemove',  onMove);
    canvas.addEventListener('mouseup',    onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove',  onMove, { passive: false });
    canvas.addEventListener('touchend',   onUp);

    canvas.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });

    // Store refs for destroy()
    this._boundHandlers.onDown = onDown;
    this._boundHandlers.onMove = onMove;
    this._boundHandlers.onUp   = onUp;
  },


  /* ----------------------------------------------------------
     NOTIFY (onStateChange callback)
     ---------------------------------------------------------- */
  _notifyChange: function() {
    if (typeof this.config.onStateChange === 'function') {
      this.config.onStateChange(this.toJSON());
    }
  },


  /* ----------------------------------------------------------
     PUBLIC API — Curve Management
     ---------------------------------------------------------- */
  addCurve: function(opts) {
    this._pushState();
    var gs = this.gs;
    var count = gs.curves.length;
    var c = {
      id:    (opts && opts.id)    || _U.id(),
      type:  (opts && opts.type)  || 'generic',
      label: (opts && opts.label) || '',  // Pedagogical Silence
      color: (opts && opts.color) || '#000000',
      p1:    (opts && opts.p1)    || { x: 20 + count * 5, y: 80 - count * 5 },
      p2:    (opts && opts.p2)    || { x: 80 + count * 5, y: 20 - count * 5 }
    };
    gs.curves.push(c);
    gs.selectedCurve = c.id;
    this.render();
    this._notifyChange();
    return c.id;
  },

  removeCurve: function(id) {
    var gs = this.gs;
    var removeId = id || gs.selectedCurve;
    if (!removeId) return;
    this._pushState();
    gs.curves = gs.curves.filter(function(c) { return c.id !== removeId; });
    gs.shading = gs.shading.filter(function(s) { return s.demandId !== removeId && s.supplyId !== removeId; });
    gs.referenceLines = gs.referenceLines.filter(function(rl) { return rl.curveId !== removeId; });
    gs.quotas = gs.quotas.filter(function(q) { return q.curveId !== removeId; });
    if (gs.selectedCurve === removeId) gs.selectedCurve = null;
    this.render();
    this._notifyChange();
  },

  setMode: function(mode) {
    this.gs.mode = mode;
    this.gs.paintState = null;
    this.gs.drawCurveState = null;
    this.render();
  },

  getMode: function() {
    return this.gs.mode;
  },

  clearPaint: function() {
    this.gs.paintState = null;
    this.render();
  },

  clearAll: function() {
    this._pushState();
    var gs = this.gs;
    gs.curves = []; gs.shading = []; gs.quotas = []; gs.labels = [];
    gs.referenceLines = []; gs.lines = [];
    gs.selectedCurve = null;
    gs.paintState = null; gs.drawCurveState = null;
    gs.lineState = null;  gs.quotaState = null;
    this.render();
    this._notifyChange();
  },


  /* ----------------------------------------------------------
     STATE EXPORT / IMPORT (Requirement #4)
     
     toJSON() captures the COMPLETE user state:
       - All curves (positions, labels, colors)
       - All manual polygon shading (points + labels + colors)
       - All reference lines (positions + axis labels)
       - All quota lines
       - All horizontal lines
       - All free-text labels
       - Current mode, selectedCurve, grid visibility
     ---------------------------------------------------------- */
  toJSON: function() {
    return _U.deepClone(this.gs);
  },

  fromJSON: function(json) {
    this._pushState();
    this.gs = _U.deepClone(json);
    this.render();
    this._notifyChange();
  },

  toPNG: function() {
    return this.canvas.toDataURL('image/png');
  },


  /* ----------------------------------------------------------
     DESTROY — Clean up listeners, observers
     ---------------------------------------------------------- */
  destroy: function() {
    var canvas = this.canvas;
    if (this._boundHandlers.onDown) {
      canvas.removeEventListener('mousedown',  this._boundHandlers.onDown);
      canvas.removeEventListener('mousemove',  this._boundHandlers.onMove);
      canvas.removeEventListener('mouseup',    this._boundHandlers.onUp);
      canvas.removeEventListener('mouseleave', this._boundHandlers.onUp);
      canvas.removeEventListener('touchstart', this._boundHandlers.onDown);
      canvas.removeEventListener('touchmove',  this._boundHandlers.onMove);
      canvas.removeEventListener('touchend',   this._boundHandlers.onUp);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    if (this._boundHandlers._winResize) {
      window.removeEventListener('resize', this._boundHandlers._winResize);
    }
    clearTimeout(this._resizeTimeout);
  }
};


/* ============================================================
   EXPORT
   ============================================================ */
root.GraphEngine   = GraphEngine;
root.initGraphState = initGraphState;

})(typeof window !== 'undefined' ? window : this);
