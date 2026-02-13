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
  { id: 'micro-1', name: 'Basic Economic Concepts', icon: '💡', cat: 'Micro' },
  { id: 'micro-2', name: 'Firms and Production', icon: '🏢', cat: 'Micro' },
  { id: 'micro-3', name: 'Markets and Prices', icon: '📈', cat: 'Micro' },
  { id: 'micro-4', name: 'Competition & Market Structures', icon: '♟️', cat: 'Micro' },
  { id: 'micro-5', name: 'Efficiency, Equity & Government', icon: '⚖️', cat: 'Micro' },
  { id: 'macro-1', name: 'Measuring Economic Performance', icon: '📊', cat: 'Macro' },
  { id: 'macro-2', name: 'National Income Determination', icon: '💰', cat: 'Macro' },
  { id: 'macro-3', name: 'Money and Banking', icon: '🏦', cat: 'Macro' },
  { id: 'macro-4', name: 'Macro Problems & Policies', icon: '⚙️', cat: 'Macro' },
  { id: 'macro-5', name: 'International Trade & Finance', icon: '🌍', cat: 'Macro' }
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
 * Load questions from questions.json or use embedded fallback
 */
async function loadQuestions() {
  try {
    // Try to fetch from questions.json first
    const response = await fetch('questions.json');
    if (response.ok) {
      const data = await response.json();
      MCQ_BANK = data.mcq || [];
      LQ_BANK = data.longQuestions || [];
      console.log(`✓ Loaded ${MCQ_BANK.length} MCQ from questions.json`);
      return true;
    }
  } catch (error) {
    console.warn('Could not load questions.json, using embedded data:', error.message);
  }

  // Fallback: embedded question data with all 40 questions
  const questionData = {
    mcq: [
      {"id":"q1","topic":"micro-1","question":"Which best illustrates opportunity cost?","options":["The monetary price paid for a good","The value of the next best alternative foregone","The total cost of production","The profit earned from selling a good"],"answer":1,"explanation":"Opportunity cost is the value of the next best alternative given up."},
      {"id":"q2","topic":"micro-1","question":"The Production Possibilities Curve (PPC) shows:","options":["Maximum profit combinations","Maximum output combinations with given resources","All possible prices","Consumer preferences"],"answer":1,"explanation":"The PPC illustrates maximum output combinations producible with given resources."},
      {"id":"q3","topic":"micro-1","question":"Which statement about economic goods is correct?","options":["Always tangible","Free of charge","Scarce relative to wants","No opportunity cost"],"answer":2,"explanation":"Economic goods are scarce relative to wants."},
      {"id":"q4","topic":"micro-1","question":"The basic economic problem arises because:","options":["Government intervention","Scarce resources, unlimited wants","Fast technology change","Human irrationality"],"answer":1,"explanation":"Scarcity: limited resources vs unlimited wants creates the fundamental economic problem."},
      {"id":"q5","topic":"micro-2","question":"Law of diminishing marginal returns states:","options":["Total output falls","More variable input then smaller increments","Average costs always rise","Fixed costs increase"],"answer":1,"explanation":"Marginal product of variable input eventually decreases."},
      {"id":"q6","topic":"micro-2","question":"If MC < ATC, then ATC is:","options":["Rising","Falling","Constant","At minimum"],"answer":1,"explanation":"MC < ATC pulls the average down."},
      {"id":"q7","topic":"micro-2","question":"Economies of scale refer to:","options":["Rising costs","Falling average costs with output","Constant returns","Diminishing returns"],"answer":1,"explanation":"Larger scale leads to lower LRAC."},
      {"id":"q8","topic":"micro-2","question":"Which is an example of a fixed cost for a bakery?","options":["Flour purchased","Labour wages","Rent of premises","Packaging materials"],"answer":2,"explanation":"Rent is a fixed cost that doesn't change with output."},
      {"id":"q9","topic":"micro-3","question":"Price rises from $10 to $12, Qd falls 100 to 80. PED is:","options":["-0.5","-1.0","-1.5","-2.0"],"answer":1,"explanation":"PED = (-20%/20%) = -1.0"},
      {"id":"q10","topic":"micro-3","question":"XED between A and B is +2.5. The goods are:","options":["Complements","Substitutes","Unrelated","Inferior"],"answer":1,"explanation":"Positive XED = substitute goods."},
      {"id":"q11","topic":"micro-3","question":"Price ceiling below equilibrium results in:","options":["Surplus","Shortage","No change","Higher price"],"answer":1,"explanation":"Binding price ceiling creates shortage (Qd > Qs)."},
      {"id":"q12","topic":"micro-3","question":"Law of demand states, ceteris paribus:","options":["Income up then demand up","Price down then Qd up","Supply up then price down","Tech up then cost down"],"answer":1,"explanation":"Inverse relationship between price and quantity demanded."},
      {"id":"q13","topic":"micro-3","question":"Leftward shift of supply could be caused by:","options":["Better technology","Lower input costs","Higher input costs","More firms"],"answer":2,"explanation":"Higher input costs reduce supply."},
      {"id":"q14","topic":"micro-3","question":"YED for an inferior good is:","options":["Positive","Zero","Negative","Greater than 1"],"answer":2,"explanation":"Inferior goods: negative YED."},
      {"id":"q15","topic":"micro-3","question":"Inelastic demand + price increase results in:","options":["TR increases","TR decreases","TR unchanged","Profits eliminated"],"answer":0,"explanation":"Percentage change in Qd < percentage change in P so TR rises."},
      {"id":"q16","topic":"micro-4","question":"In perfect competition, firms are price takers because:","options":["Gov sets prices","Each firm output is negligible","Barriers to entry","Differentiated products"],"answer":1,"explanation":"Each firm is too small to influence market price."},
      {"id":"q17","topic":"micro-4","question":"Monopolist earns LR profits because:","options":["Elastic demand","No barriers","Significant barriers to entry","Min AC production"],"answer":2,"explanation":"Barriers prevent entry, sustaining profits."},
      {"id":"q18","topic":"micro-4","question":"Most firms operate in which market structure?","options":["Monopoly","Oligopoly","Monopolistic competition","Perfect competition"],"answer":3,"explanation":"Perfect competition: very large number of firms."},
      {"id":"q19","topic":"micro-4","question":"Oligopoly is characterized by:","options":["Many small firms","Few large firms","One dominant firm","Perfect competition"],"answer":1,"explanation":"Oligopoly: few firms with interdependent decisions."},
      {"id":"q20","topic":"micro-5","question":"Negative externality in production means:","options":["Social cost > Private cost","Private cost > Social cost","Social benefit > Private benefit","No market failure"],"answer":0,"explanation":"Negative externalities: social cost exceeds private cost."},
      {"id":"q21","topic":"micro-5","question":"Example of a public good:","options":["Private pool","Bread","National defence","Cinema ticket"],"answer":2,"explanation":"National defence: non-excludable and non-rivalrous."},
      {"id":"q22","topic":"micro-5","question":"HK plastic bag levy is:","options":["Subsidy","Pigouvian tax","Price ceiling","Public good"],"answer":1,"explanation":"Corrective tax to reduce negative externalities."},
      {"id":"q23","topic":"micro-5","question":"Government education provision justified by:","options":["Negative externalities","Positive externalities","No externalities","Only private benefits"],"answer":1,"explanation":"Education: positive externalities for society."},
      {"id":"q24","topic":"macro-1","question":"GDP at market prices includes:","options":["Only final goods and services","Intermediate goods","Second-hand goods","Transfer payments"],"answer":0,"explanation":"GDP counts only final goods to avoid double counting."},
      {"id":"q25","topic":"macro-1","question":"NOT included in HK GDP calculation:","options":["Gov hospital spending","Resident groceries","Foreign worker remittances","Factory investment"],"answer":2,"explanation":"Remittances are transfer payments."},
      {"id":"q26","topic":"macro-1","question":"Real GDP vs nominal: real GDP is:","options":["Includes depreciation","Adjusted for price changes","Excludes exports","Always higher"],"answer":1,"explanation":"Real GDP removes price change effects."},
      {"id":"q27","topic":"macro-2","question":"The multiplier effect refers to:","options":["Doubling money supply","Amplified spending impact on national income","Interest rate effects","Tax multiplication"],"answer":1,"explanation":"Initial injection triggers successive spending rounds."},
      {"id":"q28","topic":"macro-2","question":"If MPC = 0.8, multiplier is:","options":["2","4","5","8"],"answer":2,"explanation":"1/(1-0.8) = 5."},
      {"id":"q29","topic":"macro-2","question":"Increase in G shifts:","options":["AS left","AD right","AS right","AD left"],"answer":1,"explanation":"G is AD component; increase shifts AD right."},
      {"id":"q30","topic":"macro-3","question":"A function of money:","options":["Store of debt","Medium of exchange","Source of inflation","Measure of profit"],"answer":1,"explanation":"Money: medium of exchange, store of value, unit of account."},
      {"id":"q31","topic":"macro-3","question":"When a bank makes a loan, it:","options":["Destroys money","Creates money via credit creation","Reduces money supply","No effect"],"answer":1,"explanation":"Banks create deposits when making loans."},
      {"id":"q32","topic":"macro-3","question":"Reserve ratio 10%, credit multiplier is:","options":["5","10","20","100"],"answer":1,"explanation":"1/0.1 = 10."},
      {"id":"q33","topic":"macro-3","question":"HKMA maintains linked rate using:","options":["Tax changes","Open market operations","Min wage","Import quotas"],"answer":1,"explanation":"HKMA buys/sells USD."},
      {"id":"q34","topic":"macro-4","question":"Demand-pull inflation caused by:","options":["Rising costs","Excessive AD","Supply disruptions","Falling money supply"],"answer":1,"explanation":"AD exceeds AS at full employment."},
      {"id":"q35","topic":"macro-4","question":"Fiscal policy to reduce inflation:","options":["More gov spending","Tax cuts","Less gov spending","More money supply"],"answer":2,"explanation":"Contractionary fiscal policy reduces AD."},
      {"id":"q36","topic":"macro-4","question":"Structural unemployment caused by:","options":["Seasonal changes","Skills-job mismatch","Low AD","Job searching"],"answer":1,"explanation":"Mismatch between skills and job requirements."},
      {"id":"q37","topic":"macro-4","question":"Stagflation refers to:","options":["High growth, low inflation","High inflation + high unemployment","Low inflation, low unemployment","Rapid growth"],"answer":1,"explanation":"Stagnant growth + rising prices."},
      {"id":"q38","topic":"macro-4","question":"Increasing money supply is:","options":["Contractionary fiscal","Expansionary monetary","Supply-side","Trade policy"],"answer":1,"explanation":"Expansionary monetary policy stimulates activity."},
      {"id":"q39","topic":"macro-5","question":"Comparative advantage: trade benefits when:","options":["Country produces everything cheaply","Specialise in lower opportunity cost","Balanced trade","Fixed exchange rates"],"answer":1,"explanation":"Specialise where opportunity cost is lowest."},
      {"id":"q40","topic":"macro-5","question":"HK linked rate pegs HKD to:","options":["Yuan","Yen","US Dollar","Pound"],"answer":2,"explanation":"Since 1983, pegged to USD ~7.8:1."}
    ]
  };
  
  MCQ_BANK = questionData.mcq || [];
  LQ_BANK = questionData.longQuestions || [];
  console.log(`✓ Loaded ${MCQ_BANK.length} MCQ from embedded data (questions.json not found)`);
  return true;
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
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'practice', icon: '🎓', label: 'Practice' },
  { id: 'ai-gen', icon: '🤖', label: 'AI Generation' },
  { id: 'analytics', icon: '📊', label: 'Analytics' }
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
        <span style="font-size:24px">${esc(icon)}</span>
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
      <h2 style="font-size:1.5rem;font-weight:800">📚 Welcome back!</h2>
      <p style="color:var(--tx2);font-size:14px">HKDSE Economics Study Companion</p>
    </div>
  `;

  html += '<div class="grid-4" style="margin-bottom:24px">';
  html += statCard(st.sessions, 'Sessions', '📖', 'rgba(37,99,235,.1)', 'var(--pr)');
  html += statCard(totalQuestions, 'Questions', '📋', 'rgba(6,182,212,.1)', 'var(--ac)');
  html += statCard(`${accuracy}%`, 'Accuracy', '🎯', 'rgba(16,185,129,.1)', 'var(--ok)');
  html += statCard(fmtTime(st.time), 'Study Time', '⏱️', 'rgba(245,158,11,.1)', 'var(--wn)');
  html += '</div>';

  html += '<h3 style="font-weight:700;margin-bottom:12px">Quick Start</h3>';
  html += '<div class="grid-3" style="margin-bottom:24px">';

  const quickActions = [
    { icon: '🎓', co: 'var(--pr)', l: 'Practice', d: 'MCQ & Long Questions', v: 'practice' },
    { icon: '🤖', co: 'var(--ok)', l: 'AI Generation', d: 'Custom questions', v: 'ai-gen' },
    { icon: '📊', co: 'var(--ac)', l: 'Analytics', d: 'Track your progress', v: 'analytics' }
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
          🎓 Practice
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
          <div style="font-size:36px;margin-bottom:10px">📋</div>
          <div style="font-weight:700;font-size:16px;margin-bottom:4px">MCQ Practice</div>
          <div style="font-size:13px;color:var(--tx3);margin-bottom:12px">${MCQ_BANK.length} questions</div>
          <button class="btn btn-p btn-s">Start</button>
        </div>
      </div>
      <div class="card" style="cursor:pointer;transition:all .2s" data-mode="lq">
        <div class="card-body" style="text-align:center;padding:24px">
          <div style="font-size:36px;margin-bottom:10px">✏️</div>
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
          🤖 AI Generation
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
            ✨ Generate Question
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
