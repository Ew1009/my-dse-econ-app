/* === DSE ECON v2.1 - Main Application === */

/**
 * Initialize dark mode based on system preferences
 */
(function initDarkMode() {
  try {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)');
    if (prefersDark?.matches) {
      document.documentElement.classList.add('dark');
    }
    prefersDark?.addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  } catch (error) {
    console.error('Error initializing dark mode:', error);
  }
})();

/* ---- Topics Configuration ---- */
const TOPICS = [
  { id: 'micro-1', name: 'Basic Economic Concepts', icon: 'fa-lightbulb', cat: 'Micro' },
  { id: 'micro-2', name: 'Firms and Production', icon: 'fa-industry', cat: 'Micro' },
  { id: 'micro-3', name: 'Markets and Prices', icon: 'fa-chart-line', cat: 'Micro' },
  { id: 'micro-4', name: 'Competition & Market Structures', icon: 'fa-chess', cat: 'Micro' },
  { id: 'micro-5', name: 'Efficiency, Equity & Government', icon: 'fa-balance-scale', cat: 'Micro' },
  { id: 'macro-1', name: 'Measuring Economic Performance', icon: 'fa-tachometer-alt', cat: 'Macro' },
  { id: 'macro-2', name: 'National Income Determination', icon: 'fa-coins', cat: 'Macro' },
  { id: 'macro-3', name: 'Money and Banking', icon: 'fa-university', cat: 'Macro' },
  { id: 'macro-4', name: 'Macro Problems & Policies', icon: 'fa-cogs', cat: 'Macro' },
  { id: 'macro-5', name: 'International Trade & Finance', icon: 'fa-globe-asia', cat: 'Macro' }
];

/**
 * Find topic by ID
 * @param {string} id - Topic ID
 * @returns {Object|null} Topic object or null
 */
function topicById(id) {
  if (!id || typeof id !== 'string') return null;
  return TOPICS.find(topic => topic.id === id) || null;
}

/* ---- Question Banks ---- */
let MCQ_BANK = [];
let LQ_BANK = [];

/**
 * Load questions from JSON file
 */
async function loadQuestions() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    MCQ_BANK = data.mcq || [];
    LQ_BANK = data.longQuestions || [];
    console.log(`✓ Loaded ${MCQ_BANK.length} MCQ and ${LQ_BANK.length} long questions`);
    return true;
  } catch (error) {
    console.error('Error loading questions:', error);
    Toast.show('Failed to load questions. Some features may be limited.', 'err');
    return false;
  }
}

/* ---- Application State ---- */
const State = {
  view: 'dashboard',
  mcq: { ses: null, history: [] },
  longQ: { ses: null, history: [], bank: [] },
  aiGen: { history: [] },
  stats: { sessions: 0, time: 0, recent: [], topics: {}, graphsUsed: 0 }
};

// Alias for backward compatibility
const S = State;

/* ---- Utility Functions ---- */

/**
 * Generate unique ID
 * @returns {string} Unique identifier
 */
function genId() {
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format seconds to MM:SS format
 * @param {number} sec - Seconds
 * @returns {string} Formatted time string
 */
function fmtTime(sec) {
  if (typeof sec !== 'number' || sec < 0) return '0:00';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Format timestamp to date string (Hong Kong locale)
 * @param {number} ts - Timestamp
 * @returns {string} Formatted date
 */
function fmtDate(ts) {
  if (typeof ts !== 'number') return 'N/A';
  try {
    return new Date(ts).toLocaleDateString('en-HK', { day: 'numeric', month: 'short' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * HTML escape string
 * @param {string} str - String to escape
 * @returns {string} Escaped HTML
 */
function esc(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Render markdown with sanitization
 * @param {string} text - Markdown text
 * @returns {string} Sanitized HTML
 */
function renderMd(text) {
  try {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(marked.parse(text || ''));
    }
  } catch (error) {
    console.error('Error rendering markdown:', error);
  }
  return esc(text || '');
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 * @param {Array} arr - Array to shuffle
 * @returns {Array} Shuffled copy of array
 */
function shuffle(arr) {
  if (!Array.isArray(arr)) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ---- Toast Notifications ---- */
const Toast = {
  /**
   * Show toast notification
   * @param {string} msg - Message text
   * @param {string} type - Type: 'ok', 'err', or 'info'
   */
  show(msg, type = 'info') {
    if (!msg || typeof msg !== 'string') return;

    const container = document.getElementById('toastCtr');
    if (!container) {
      console.warn('Toast container not found');
      return;
    }

    const typeConfig = {
      ok: { cls: 't-ok', icon: 'fa-check-circle' },
      err: { cls: 't-err', icon: 'fa-times-circle' },
      info: { cls: 't-info', icon: 'fa-info-circle' }
    };

    const config = typeConfig[type] || typeConfig.info;
    const el = document.createElement('div');
    el.className = `toast ${config.cls}`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    
    el.innerHTML = `
      <i class="fas ${config.icon}" style="font-size:18px"></i>
      <div style="flex:1;font-weight:600;font-size:13px">${esc(msg)}</div>
    `;

    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
};

/* Legacy function for backward compatibility */
function toast(msg, type) {
  Toast.show(msg, type);
}

/* ---- Modal Dialog System ---- */
const Modal = {
  /**
   * Show modal with custom HTML
   * @param {string} html - HTML content
   */
  show(html) {
    if (!html || typeof html !== 'string') return;
    const container = document.getElementById('modalCtr');
    if (!container) return;
    
    container.innerHTML = `
      <div class="modal-ov" id="modalOverlay">
        <div class="modal-box">${html}</div>
      </div>
    `;

    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.hide();
      });
    }
  },

  /**
   * Show confirmation dialog
   * @param {string} msg - Confirmation message
   * @param {Function} onConfirm - Callback on confirmation
   */
  confirm(msg, onConfirm) {
    if (!msg || typeof msg !== 'string') return;
    
    const html = `
      <p style="font-size:15px;margin-bottom:18px">${esc(msg)}</p>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-s" id="cancelBtn">Cancel</button>
        <button class="btn btn-p" id="confirmBtn">Confirm</button>
      </div>
    `;
    
    this.show(html);

    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    if (cancelBtn) cancelBtn.addEventListener('click', () => this.hide());
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.hide();
        if (typeof onConfirm === 'function') onConfirm();
      });
    }
  },

  /**
   * Hide modal
   */
  hide() {
    const container = document.getElementById('modalCtr');
    if (container) container.innerHTML = '';
  }
};

/* ---- Navigation Configuration ---- */
const NAV = [
  { id: 'dashboard', icon: 'fa-home', label: 'Dashboard' },
  { id: 'practice', icon: 'fa-graduation-cap', label: 'Practice' },
  { id: 'ai-gen', icon: 'fa-robot', label: 'AI Generation' },
  { id: 'analytics', icon: 'fa-chart-pie', label: 'Analytics' }
];

/**
 * Record user activity
 * @param {string} type - Activity type ('mcq' or 'longQ')
 * @param {number} score - Score percentage
 * @param {number} duration - Duration in seconds
 * @param {string} topicId - Topic ID
 */
function recordActivity(type, score, duration, topicId) {
  if (typeof score !== 'number' || score < 0 || score > 100) return;
  if (typeof duration !== 'number' || duration < 0) return;

  State.stats.sessions++;
  State.stats.time += duration;

  State.stats.recent.push({
    type: type || 'unknown',
    score,
    duration,
    topic: topicId || null,
    ts: Date.now()
  });

  // Keep only last 50 activities
  if (State.stats.recent.length > 50) {
    State.stats.recent.shift();
  }
}

/**
 * Initialize navigation and event listeners
 */
function initNav() {
  const sbNav = document.getElementById('sbNav');
  if (!sbNav) {
    console.error('Navigation element not found');
    return;
  }

  let html = '<div class="nav-lbl">Menu</div>';
  NAV.forEach(n => {
    const isActive = State.view === n.id ? ' active' : '';
    html += `
      <div class="nav-item${isActive}" data-nav="${esc(n.id)}" role="button" tabindex="0">
        <i class="fas ${esc(n.icon)}"></i>${esc(n.label)}
      </div>
    `;
  });

  sbNav.innerHTML = html;

  // Attach navigation click handlers
  sbNav.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const navId = el.dataset.nav;
      if (navId) switchView(navId);
    });

    // Keyboard support
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const navId = el.dataset.nav;
        if (navId) switchView(navId);
      }
    });
  });

  // Mobile menu toggle
  const mobBtn = document.getElementById('mobBtn');
  const sidebar = document.getElementById('sidebar');
  const sbOv = document.getElementById('sbOv');

  if (mobBtn && sidebar) {
    mobBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (sbOv) sbOv.classList.toggle('show');
    });
  }

  if (sbOv && sidebar) {
    sbOv.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sbOv.classList.remove('show');
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('themeBtn');
  const themeIc = document.getElementById('themeIc');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      if (themeIc) {
        themeIc.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }
    });
  }
}

/**
 * Switch to a different view/section
 * @param {string} id - View ID
 */
function switchView(id) {
  if (!id || typeof id !== 'string') return;

  State.view = id;

  const navItem = NAV.find(n => n.id === id);
  const pageTitle = document.getElementById('pgTitle');
  if (pageTitle) {
    pageTitle.textContent = navItem ? navItem.label : 'App';
  }

  // Update active nav item
  const sbNav = document.getElementById('sbNav');
  if (sbNav) {
    sbNav.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === id);
    });
  }

  // Close mobile menu
  const sidebar = document.getElementById('sidebar');
  const sbOv = document.getElementById('sbOv');
  if (sidebar) sidebar.classList.remove('open');
  if (sbOv) sbOv.classList.remove('show');

  // Render section
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = '';

  if (Sections[id]) {
    try {
      Sections[id](content);
    } catch (error) {
      console.error(`Error rendering section ${id}:`, error);
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-ic"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="empty-t">Error Loading Section</div>
          <div class="empty-tx">${esc(error.message)}</div>
        </div>
      `;
    }
  } else {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-ic"><i class="fas fa-wrench"></i></div>
        <div class="empty-t">Coming Soon</div>
      </div>
    `;
  }
}

/* ---- Section Renderers ---- */
const Sections = {};

/**
 * Create stat card HTML
 * @param {string} val - Value
 * @param {string} lbl - Label
 * @param {string} icon - FA icon class
 * @param {string} bg - Background color
 * @param {string} col - Icon color
 * @returns {string} HTML
 */
function statCard(val, lbl, icon, bg, col) {
  return `
    <div class="stat-card">
      <div class="stat-ic" style="background:${esc(bg)};color:${esc(col)}">
        <i class="fas ${esc(icon)}"></i>
      </div>
      <div class="stat-val">${esc(String(val))}</div>
      <div class="stat-lbl">${esc(lbl)}</div>
    </div>
  `;
}

/**
 * Dashboard section renderer
 */
Sections.dashboard = function(container) {
  const st = State.stats;
  let totalQuestions = 0;
  let totalCorrect = 0;

  Object.keys(st.topics).forEach(k => {
    totalQuestions += (st.topics[k].attempted || 0);
    totalCorrect += (st.topics[k].correct || 0);
  });

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  let html = '<div class="page-sec active">';
  html += `
    <div style="margin-bottom:24px">
      <h2 style="font-size:1.5rem;font-weight:800">Welcome back! 📚</h2>
      <p style="color:var(--tx2);font-size:14px">HKDSE Economics Study Companion</p>
    </div>
  `;

  html += '<div class="grid-4" style="margin-bottom:24px">';
  html += statCard(st.sessions, 'Sessions', 'fa-book-open', 'rgba(37,99,235,.1)', 'var(--pr)');
  html += statCard(totalQuestions, 'Questions', 'fa-list-ol', 'rgba(6,182,212,.1)', 'var(--ac)');
  html += statCard(`${accuracy}%`, 'Accuracy', 'fa-bullseye', 'rgba(16,185,129,.1)', 'var(--ok)');
  html += statCard(fmtTime(st.time), 'Study Time', 'fa-clock', 'rgba(245,158,11,.1)', 'var(--wn)');
  html += '</div>';

  html += '<h3 style="font-weight:700;margin-bottom:12px">Quick Start</h3>';
  html += '<div class="grid-3" style="margin-bottom:24px">';

  const quickActions = [
    { icon: 'fa-graduation-cap', co: 'var(--pr)', l: 'Practice', d: 'MCQ & Long Questions', v: 'practice' },
    { icon: 'fa-robot', co: 'var(--ok)', l: 'AI Generation', d: 'Custom questions', v: 'ai-gen' },
    { icon: 'fa-chart-pie', co: 'var(--ac)', l: 'Analytics', d: 'Track your progress', v: 'analytics' }
  ];

  quickActions.forEach(a => {
    html += `
      <div class="card" style="cursor:pointer;transition:all .2s" data-view="${esc(a.v)}">
        <div class="card-body" style="display:flex;align-items:center;gap:14px">
          <div style="width:44px;height:44px;border-radius:10px;background:${esc(a.co)}18;display:flex;align-items:center;justify-content:center">
            <i class="fas ${esc(a.icon)}" style="color:${esc(a.co)};font-size:18px"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:14px">${esc(a.l)}</div>
            <div style="font-size:12px;color:var(--tx3)">${esc(a.d)}</div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  // Recent activity
  const recentActivities = st.recent.slice().reverse().slice(0, 5);
  html += '<h3 style="font-weight:700;margin-bottom:12px">Recent Activity</h3>';

  if (!recentActivities.length) {
    html += `
      <div class="empty-state" style="padding:30px">
        <div class="empty-ic"><i class="fas fa-clock"></i></div>
        <div class="empty-t">No activity yet</div>
        <div class="empty-tx">Start a practice session!</div>
      </div>
    `;
  } else {
    recentActivities.forEach(r => {
      const color = r.score >= 70 ? 'var(--ok)' : r.score >= 50 ? 'var(--wn)' : 'var(--no)';
      const icon = r.type === 'mcq' ? 'fa-list-ol' : 'fa-pen-fancy';

      html += `
        <div class="card" style="margin-bottom:8px">
          <div class="card-body" style="padding:14px 18px;display:flex;align-items:center;gap:14px">
            <div style="width:38px;height:38px;border-radius:50%;background:${esc(color)}18;display:flex;align-items:center;justify-content:center">
              <i class="fas ${esc(icon)}" style="color:${esc(color)};font-size:14px"></i>
            </div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px">${esc(r.type.toUpperCase())} Session</div>
              <div style="font-size:12px;color:var(--tx3)">${esc(fmtDate(r.ts))} • ${esc(fmtTime(r.duration))}</div>
            </div>
            <span class="badge" style="background:${esc(color)}18;color:${esc(color)}">${r.score}%</span>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  container.innerHTML = html;

  // Attach quick action listeners
  container.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => {
      const viewId = el.dataset.view;
      if (viewId) switchView(viewId);
    });

    el.addEventListener('mouseover', () => {
      el.style.transform = 'translateY(-2px)';
    });

    el.addEventListener('mouseout', () => {
      el.style.transform = 'none';
    });
  });
};

/**
 * Practice section renderer
 */
Sections.practice = function(container) {
  let html = `
    <div class="page-sec active">
      <div style="text-align:center;margin-bottom:28px">
        <h2 style="font-size:1.5rem;font-weight:800">
          <i class="fas fa-graduation-cap" style="color:var(--pr);margin-right:8px"></i>Practice
        </h2>
        <p style="color:var(--tx2);margin-top:4px">Sharpen your skills for the HKDSE</p>
      </div>
  `;

  if (MCQ_BANK.length === 0 && LQ_BANK.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-ic"><i class="fas fa-database"></i></div>
        <div class="empty-t">No Questions Loaded</div>
        <div class="empty-tx">Questions database failed to load. Please refresh the page.</div>
      </div>
    `;
    container.innerHTML = html;
    return;
  }

  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
      <div class="card" style="cursor:pointer;transition:all .2s" data-mode="mcq">
        <div class="card-body" style="text-align:center;padding:24px">
          <div style="font-size:36px;margin-bottom:10px"><i class="fas fa-list-ol"></i></div>
          <div style="font-weight:700;font-size:16px;margin-bottom:4px">MCQ Practice</div>
          <div style="font-size:13px;color:var(--tx3);margin-bottom:12px">${MCQ_BANK.length} questions</div>
          <button class="btn btn-p btn-s">Start</button>
        </div>
      </div>
      <div class="card" style="cursor:pointer;transition:all .2s" data-mode="lq">
        <div class="card-body" style="text-align:center;padding:24px">
          <div style="font-size:36px;margin-bottom:10px"><i class="fas fa-pen-fancy"></i></div>
          <div style="font-weight:700;font-size:16px;margin-bottom:4px">Long Questions</div>
          <div style="font-size:13px;color:var(--tx3);margin-bottom:12px">${LQ_BANK.length} questions</div>
          <button class="btn btn-p btn-s">Start</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h3 style="font-weight:600;margin-bottom:12px">Topics</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">
  `;

  TOPICS.forEach(t => {
    const stats = State.stats.topics[t.id] || { attempted: 0, correct: 0 };
    const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    
    html += `
      <div style="padding:12px;border-radius:8px;background:var(--bg2);text-align:center">
        <div style="font-size:18px;margin-bottom:6px"><i class="fas ${t.icon}"></i></div>
        <div style="font-size:12px;font-weight:600;line-height:1.3">${t.name}</div>
        <div style="font-size:11px;color:var(--tx3);margin-top:4px">${stats.attempted} questions</div>
        ${accuracy > 0 ? `<div style="font-size:11px;color:var(--ac);margin-top:2px">${accuracy}%</div>` : ''}
      </div>
    `;
  });

  html += `
        </div>
      </div>
    </div>
    </div>
  `;

  container.innerHTML = html;

  // Attach mode listeners
  container.querySelectorAll('[data-mode]').forEach(el => {
    el.addEventListener('click', () => {
      const mode = el.dataset.mode;
      if (mode) {
        Toast.show(`${mode === 'mcq' ? 'MCQ' : 'Long Question'} mode coming soon`, 'info');
      }
    });

    el.addEventListener('mouseover', () => {
      el.style.transform = 'translateY(-2px)';
    });

    el.addEventListener('mouseout', () => {
      el.style.transform = 'none';
    });
  });
};

/**
 * AI Generation section renderer
 */
Sections['ai-gen'] = function(container) {
  let html = `
    <div class="page-sec active">
      <div style="text-align:center;margin-bottom:28px">
        <h2 style="font-size:1.5rem;font-weight:800">
          <i class="fas fa-robot" style="color:var(--ok);margin-right:8px"></i>AI Generation
        </h2>
        <p style="color:var(--tx2);margin-top:4px">Generate custom questions with AI</p>
      </div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-body">
          <h3 style="font-weight:600;margin-bottom:14px">Select Topic</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:20px">
  `;

  TOPICS.forEach(t => {
    html += `
      <button class="btn btn-s" style="text-align:left;justify-content:flex-start;padding:10px 12px" data-topic="${t.id}">
        <i class="fas ${t.icon}" style="margin-right:8px"></i>${t.name}
      </button>
    `;
  });

  html += `
          </div>
          <div style="margin-bottom:16px">
            <label style="display:block;font-weight:600;font-size:13px;margin-bottom:8px">Difficulty:</label>
            <div style="display:flex;gap:8px">
              <button class="btn btn-o" style="flex:1;font-size:13px" data-diff="easy">Easy</button>
              <button class="btn btn-o" style="flex:1;font-size:13px" data-diff="medium">Medium</button>
              <button class="btn btn-o" style="flex:1;font-size:13px" data-diff="hard">Hard</button>
            </div>
          </div>
          <button class="btn btn-p" style="width:100%;margin-bottom:14px" id="genBtn">
            <i class="fas fa-wand-magic-sparkles" style="margin-right:8px"></i>Generate Question
          </button>
        </div>
      </div>
      <div id="genResult"></div>
    </div>
  `;

  container.innerHTML = html;

  const genBtn = container.querySelector('#genBtn');
  if (genBtn) {
    genBtn.addEventListener('click', () => {
      Toast.show('AI question generation coming in next update', 'info');
    });
  }
};

/**
 * Analytics section renderer
 */
Sections.analytics = function(container) {
  const st = State.stats;
  let totalQuestions = 0;
  let totalCorrect = 0;
  
  Object.keys(st.topics).forEach(k => {
    totalQuestions += st.topics[k].attempted || 0;
    totalCorrect += st.topics[k].correct || 0;
  });
  
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  let html = `
    <div class="page-sec active">
      <div style="text-align:center;margin-bottom:22px">
        <h2 style="font-size:1.5rem;font-weight:800">
          <i class="fas fa-chart-pie" style="color:var(--pr);margin-right:8px"></i>Analytics
        </h2>
        <p style="color:var(--tx2);margin-top:4px;font-size:14px">Track your study progress and performance</p>
      </div>

      <div class="an-kpi-row">
        <div class="an-kpi">
          <div class="an-kpi-val">${st.sessions}</div>
          <div class="an-kpi-lbl"><i class="fas fa-book-open"></i> Sessions</div>
        </div>
        <div class="an-kpi">
          <div class="an-kpi-val">${totalQuestions}</div>
          <div class="an-kpi-lbl"><i class="fas fa-list-ol"></i> Questions</div>
        </div>
        <div class="an-kpi">
          <div class="an-kpi-val">${accuracy}%</div>
          <div class="an-kpi-lbl"><i class="fas fa-bullseye"></i> Accuracy</div>
        </div>
        <div class="an-kpi">
          <div class="an-kpi-val">0</div>
          <div class="an-kpi-lbl"><i class="fas fa-fire"></i> Streak</div>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-body">
          <h3 style="font-weight:600;margin-bottom:12px">Summary</h3>
          <p style="font-size:13px;line-height:1.6;color:var(--tx2)">
            You've completed <strong>${st.sessions}</strong> study session${st.sessions !== 1 ? 's' : ''} 
            with an overall accuracy of <strong>${accuracy}%</strong>.
            ${accuracy < 70 
              ? 'Focus on reviewing incorrect answers and understanding the reasoning behind correct answers.' 
              : accuracy < 90 
              ? 'Great progress! Continue practicing to improve your accuracy further.' 
              : 'Excellent work! You\'re well-prepared for the exam.'}
          </p>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-body">
          <h3 style="font-weight:600;margin-bottom:12px">Performance by Topic</h3>
  `;

  const topicStats = TOPICS.map(t => {
    const s = st.topics[t.id] || { attempted: 0, correct: 0 };
    return {
      ...t,
      accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
      attempted: s.attempted
    };
  }).sort((a, b) => b.attempted - a.attempted);

  if (topicStats.filter(t => t.attempted > 0).length === 0) {
    html += `<p style="font-size:13px;color:var(--tx3)">No practice data yet. Start practicing to see topic statistics.</p>`;
  } else {
    topicStats.forEach(t => {
      if (t.attempted > 0) {
        const barWidth = Math.max((t.accuracy / 100) * 100, 10);
        const barColor = t.accuracy >= 80 ? 'var(--ok)' : t.accuracy >= 60 ? 'var(--ac)' : t.accuracy >= 40 ? 'var(--wn)' : 'var(--no)';
        
        html += `
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
              <span style="font-weight:600">${t.name}</span>
              <span style="color:var(--tx3)">${t.accuracy}% · ${t.attempted} Q</span>
            </div>
            <div style="height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${barWidth}%;background:${barColor};transition:width .3s"></div>
            </div>
          </div>
        `;
      }
    });
  }

  html += `
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
};

/* ---- Initialization ---- */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadQuestions();
    initNav();
    switchView('dashboard');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    Toast.show('Failed to initialize application', 'err');
  }
});

// Handle unload
window.addEventListener('beforeunload', () => {
  try {
    // Could save state here
  } catch (error) {
    console.error('Error on unload:', error);
  }
});
