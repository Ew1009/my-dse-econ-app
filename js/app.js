/* === DSE ECON v2.2 === */

/* ---- Dark Mode Detection (runs immediately) ---- */
(function(){
  if(window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches) document.documentElement.classList.add('dark');
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', function(e) {
    e.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  });
})();

/* ---- Global State (explicitly on window + var alias for bare S access) ---- */
var S = window.S = {
  view: 'dashboard',
  mcq: { ses: null, history: [] },
  longQ: { ses: null, history: [], bank: [] },
  aiGen: { history: [] },
  stats: {
    sessions: 0,
    time: 0,
    recent: [],
    topics: {},
    graphsUsed: 0
  }
};

/* ---- Sections Object (explicitly on window + var alias for bare Sections access) ---- */
var Sections = window.Sections = {};

/* ---- Utils (all global) ---- */
function genId() { return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
function fmtTime(sec) { 
  var m = Math.floor(sec / 60);
  var s2 = sec % 60;
  return m + ':' + (s2 < 10 ? '0' : '') + s2;
}
function fmtDate(ts) { return new Date(ts).toLocaleDateString('en-HK', { day: 'numeric', month: 'short' }); }
function esc(str) { 
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}
function renderMd(t) { 
  try {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(marked.parse(t || ''));
    }
  } catch (e) { /* empty */ }
  return esc(t || '');
}
function shuffle(a) { 
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/* ---- Toast ---- */
function toast(msg, type) {
  type = type || 'info';
  var ctr = document.getElementById('toastCtr');
  if (!ctr) return;
  var cls = type === 'ok' ? 't-ok' : type === 'err' ? 't-err' : 't-info';
  var col = type === 'ok' ? 'var(--ok)' : type === 'err' ? 'var(--no)' : 'var(--pr)';
  var icons = { ok: 'fa-check-circle', err: 'fa-times-circle', info: 'fa-info-circle' };
  var el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '" style="font-size:18px;color:' + col + '"></i><div style="flex:1;font-weight:600;font-size:13px">' + msg + '</div>';
  ctr.appendChild(el);
  setTimeout(function() { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function() { el.remove(); }, 300); }, 3000);
}

/* ---- Modal ---- */
var Modal = window.Modal = {
  show: function(html) {
    document.getElementById('modalCtr').innerHTML = '<div class="modal-ov" onclick="if(event.target===this)Modal.hide()"><div class="modal-box">' + html + '</div></div>';
  },
  confirm: function(msg, onYes) {
    var h = '<p style="font-size:15px;margin-bottom:18px">' + msg + '</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-s" onclick="Modal.hide()">Cancel</button><button class="btn btn-p" id="mcBtn">Confirm</button></div>';
    this.show(h);
    document.getElementById('mcBtn').onclick = function() { Modal.hide(); if (onYes) onYes(); };
  },
  hide: function() {
    document.getElementById('modalCtr').innerHTML = '';
  }
};

/* ---- Nav ---- */
var NAV = [
  { id: 'dashboard', icon: 'fa-home', label: 'Dashboard' },
  { id: 'practice', icon: 'fa-graduation-cap', label: 'Practice' },
  { id: 'ai-gen', icon: 'fa-robot', label: 'AI Generation' },
  { id: 'analytics', icon: 'fa-chart-pie', label: 'Analytics' }
];

function recordActivity(type, score, dur, topicId) {
  window.S.stats.sessions++;
  window.S.stats.time += dur;
  window.S.stats.recent.push({ type: type, score: score, duration: dur, topic: topicId, ts: Date.now() });
  if (window.S.stats.recent.length > 50) window.S.stats.recent.shift();
}

function initNav() {
  var sb = document.getElementById('sbNav');
  if (!sb) return;
  var h = '<div class="nav-lbl">Menu</div>';
  NAV.forEach(function(n) {
    h += '<div class="nav-item' + (window.S.view === n.id ? ' active' : '') + '" data-nav="' + n.id + '"><i class="fas ' + n.icon + '"></i>' + n.label + '</div>';
  });
  sb.innerHTML = h;
  sb.querySelectorAll('.nav-item').forEach(function(el) {
    el.onclick = function() { switchView(el.dataset.nav); };
  });
  document.getElementById('mobBtn').onclick = function() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sbOv').classList.toggle('show');
  };
  document.getElementById('sbOv').onclick = function() {
    document.getElementById('sidebar').classList.remove('open');
    this.classList.remove('show');
  };
  document.getElementById('themeBtn').onclick = function() {
    document.documentElement.classList.toggle('dark');
    document.getElementById('themeIc').className = document.documentElement.classList.contains('dark') ? 'fas fa-sun' : 'fas fa-moon';
  };
}

function switchView(id) {
  window.S.view = id;
  var navItem = NAV.find(function(n) { return n.id === id; });
  document.getElementById('pgTitle').textContent = navItem ? navItem.label : 'App';
  document.getElementById('sbNav').querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.nav === id);
  });
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOv').classList.remove('show');
  var c = document.getElementById('content');
  c.innerHTML = '';
  if (window.Sections[id]) window.Sections[id](c);
  else c.innerHTML = '<div class="empty-state"><div class="empty-ic"><i class="fas fa-wrench"></i></div><div class="empty-t">Coming Soon</div></div>';
}

/* ---- Dashboard ---- */
function statCard(val, lbl, icon, bg, col) {
  return '<div class="stat-card"><div class="stat-ic" style="background:' + bg + ';color:' + col + '"><i class="fas ' + icon + '"></i></div><div class="stat-val">' + val + '</div><div class="stat-lbl">' + lbl + '</div></div>';
}

window.Sections.dashboard = function(c) {
  var st = window.S.stats;
  var totalQ = 0, totalCorrect = 0;
  Object.keys(st.topics || {}).forEach(function(k) {
    var tk = st.topics[k];
    if (!tk) return;
    if (typeof tk.attempted === 'number' && typeof tk.correct === 'number') {
      totalQ += tk.attempted;
      totalCorrect += tk.correct;
    } else if (Array.isArray(tk.sessions) && tk.sessions.length) {
      totalQ += tk.sessions.length * 10;
      totalCorrect += tk.sessions.reduce(function(s, it) { return s + ((it.score || 0) / 100 * 10); }, 0);
    }
  });
  var tq = totalQ;
  var tc = totalCorrect;
  var acc = tq > 0 ? Math.round(tc / tq * 100) : 0;
  var h = '<div class="page-sec active">';
  h += '<div style="margin-bottom:24px"><h2 style="font-size:1.5rem;font-weight:800">Welcome back! 📚</h2><p style="color:var(--tx2);font-size:14px">HKDSE Economics Study Companion</p></div>';
  h += '<div class="grid-4" style="margin-bottom:24px">';
  h += statCard(st.sessions, 'Sessions', 'fa-book-open', 'rgba(37,99,235,.1)', 'var(--pr)');
  h += statCard(tq, 'Questions', 'fa-list-ol', 'rgba(6,182,212,.1)', 'var(--ac)');
  h += statCard(acc + '%', 'Accuracy', 'fa-bullseye', 'rgba(16,185,129,.1)', 'var(--ok)');
  h += statCard(fmtTime(st.time), 'Study Time', 'fa-clock', 'rgba(245,158,11,.1)', 'var(--wn)');
  h += '</div>';
  var rec = st.recent.slice().reverse().slice(0, 5);
  h += '<h3 style="font-weight:700;margin-bottom:12px">Recent Activity</h3>';
  if (!rec.length) h += '<div class="empty-state" style="padding:30px"><div class="empty-ic"><i class="fas fa-clock"></i></div><div class="empty-t">No activity yet</div><div class="empty-tx">Start a practice session!</div></div>';
  else rec.forEach(function(r) {
    var co = r.score >= 70 ? 'var(--ok)' : r.score >= 50 ? 'var(--wn)' : 'var(--no)';
    h += '<div class="card" style="margin-bottom:8px"><div class="card-body" style="padding:14px 18px;display:flex;align-items:center;gap:14px"><div style="width:38px;height:38px;border-radius:50%;background:' + co + '18;display:flex;align-items:center;justify-content:center"><i class="fas ' + (r.type === 'mcq' ? 'fa-list-ol' : 'fa-pen-fancy') + '" style="color:' + co + ';font-size:14px"></i></div><div style="flex:1"><div style="font-weight:600;font-size:14px">' + r.type.toUpperCase() + ' Session</div><div style="font-size:12px;color:var(--tx3)">' + fmtDate(r.ts) + ' &bull; ' + fmtTime(r.duration || 0) + '</div></div><span class="badge" style="background:' + co + '18;color:' + co + '">' + r.score + '%</span></div></div></div>';
  });
  h += '</div>';
  c.innerHTML = h;
};

/* ---- MCQ Timer ---- */
var mcqTimer = null;

function startMcqTimer() {
  if (mcqTimer) clearInterval(mcqTimer);
  mcqTimer = setInterval(function() {
    var ses = window.S.mcq.ses;
    if (!ses) {
      clearInterval(mcqTimer);
      return;
    }
    ses.elapsed++;
    if (ses.timeLimit > 0 && ses.elapsed >= ses.timeLimit) {
      clearInterval(mcqTimer);
      finishMcq();
    }
    var el = document.getElementById('mcqTimerDisp');
    if (el) {
      var rem = ses.timeLimit > 0 ? ses.timeLimit - ses.elapsed : ses.elapsed;
      el.textContent = fmtTime(Math.max(0, rem));
      if (ses.timeLimit > 0) {
        el.className = 'timer-disp' + (rem < 30 ? ' crit' : rem < 60 ? ' warn' : '');
      }
    }
  }, 1000);
}

/* ---- Legacy Poe Shim (for old bundled code in questions.js) ---- */
function hasPoe() { return false; }

/* ============================================================
   SESSION EXPLANATIONS CACHE
   
   Stores AI explanations per question ID for the current browser
   session only. Cleared on page unload.
   
   API:
     window.sessionExplanations            — the store object
     window.getSessionExplanation(qId)     — get cached explanation or null
     window.setSessionExplanation(qId, txt)— cache an explanation
   ============================================================ */
window.sessionExplanations = {};

window.getSessionExplanation = function(qId) {
  return window.sessionExplanations[qId] || null;
};
window.setSessionExplanation = function(qId, text) {
  window.sessionExplanations[qId] = text;
};

/* Clear on tab close / navigation away — keep app lightweight */
window.addEventListener('beforeunload', function() {
  window.sessionExplanations = {};
});

/* ---- App Init (deferred to DOMContentLoaded) ---- */
/* 
 * NOTE: We do NOT auto-init here anymore. 
 * The init is triggered from a <script> block at the bottom of index.html 
 * AFTER all other scripts have loaded.
 */
function initApp() {
  initNav();
  switchView('dashboard');
  console.log('DSE Econ v2.2 initialized — sessionExplanations active');
}
