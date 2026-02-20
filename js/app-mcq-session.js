/* ---- MCQ Session Render ---- */
/*
  Mode behaviours:
  - topic:  Click option → instant reveal (correct/wrong + explanation). Next → next Q.
  - exam:   Click option → select only (no feedback). Next → next Q. Review at end.
  - quiz:   Same as exam but timed.

  AI Explanation Caching (v2.3):
  - Explanations are cached in window.sessionExplanations[questionId]
  - Once fetched, the AI button is hidden and the explanation auto-renders
  - Cache persists for the browser session only (cleared on beforeunload)
  - Cached explanations also appear automatically in the Results/Review tab
*/

/* ============================================================
   HELPER: Render a cached or freshly-fetched AI explanation box
   Returns HTML string. fontSize defaults to 13px.
   ============================================================ */
function renderAiExplanationBox(text, fontSize) {
  var fs = fontSize || '13px';
  return '<div class="ai-explanation-box" style="margin-top:10px;border-top:1px solid var(--bd);padding-top:10px">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;color:var(--tx3);font-weight:600"><i class="fas fa-robot"></i>AI Explanation</div>'
    + '<div class="md-content" style="font-size:' + fs + ';line-height:1.6;background:var(--bg2);padding:12px;border-radius:8px">'
    + renderMd(text) + '</div></div>';
}

/* ============================================================
   ASK AI TO EXPLAIN (MCQ)
   - Calls AI, saves response to sessionExplanations
   - Replaces the Ask AI button with the explanation
   ============================================================ */
function askMcqAi(q, chosenIdx, letters, btnEl, replyEl) {
  if (!btnEl) btnEl = document.getElementById('mcqAskAi');
  if (!replyEl) replyEl = document.getElementById('mcqAiReply');
  if (!replyEl) return;

  /* Check if AIHelper is available */
  if (!window.AIHelper || !window.AIHelper.isAvailable()) {
    replyEl.innerHTML = '<div style="font-size:13px;color:var(--wn)"><i class="fas fa-info-circle"></i> AI service is not available.</div>';
    return;
  }

  if (btnEl) btnEl.disabled = true;
  replyEl.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--tx3)"><div class="spinner" style="width:18px;height:18px;margin:0;border-width:2px"></div>AI is thinking...</div>';

  var tp = topicById(q.topic);
  var prompt = 'You are an HKDSE Economics tutor. A student got this MCQ wrong:\n\nQuestion: ' + q.q + '\n';
  prompt += 'Options: ' + q.opts.map(function(o, i) { return letters[i] + '. ' + o; }).join(' | ') + '\n';
  prompt += 'Student chose: ' + letters[chosenIdx] + ' (' + q.opts[chosenIdx] + ')\nCorrect answer: ' + letters[q.ans] + ' (' + q.opts[q.ans] + ')\n';
  if (tp) prompt += 'Topic: ' + tp.name + '\n';
  prompt += '\nExplain in 3-4 sentences why their answer is wrong and why the correct answer is right. Use simple language suitable for HKDSE students.';

  window.AIHelper.callAI(prompt, {
    systemPrompt: 'You are an expert HKDSE Economics tutor. Provide clear, concise explanations in simple language. Use Markdown formatting.',
    maxTokens: 500,
    temperature: 0.5
  }).then(function(response) {
    /* ---- SAVE to session cache ---- */
    window.setSessionExplanation(q.id, response);

    /* ---- Replace button + reply area with the full explanation box ---- */
    var container = (btnEl && btnEl.parentNode) ? btnEl.parentNode : replyEl.parentNode;
    if (container) {
      container.innerHTML = renderAiExplanationBox(response, '13px');
    } else {
      replyEl.innerHTML = renderAiExplanationBox(response, '13px');
    }
  }).catch(function(err) {
    replyEl.innerHTML = '<div style="font-size:13px;color:var(--no)"><i class="fas fa-exclamation-triangle"></i> ' + esc(String(err.message || err)) + '</div>';
    if (btnEl) btnEl.disabled = false;
  });
}

/* ============================================================
   REVEAL TOPIC ANSWER (click handler for topic mode)
   ============================================================ */
function revealTopicAnswer(c, ses, chosenIdx) {
  var q = ses.questions[ses.idx]; var letters = ['A', 'B', 'C', 'D'];
  ses.answers[ses.idx] = chosenIdx; ses.revealed[ses.idx] = true;
  var isCorrect = chosenIdx === q.ans;
  c.querySelectorAll('.mcq-opt').forEach(function(o, i) {
    o.classList.remove('sel'); o.classList.add('dis');
    if (i === q.ans) o.classList.add('c-ok');
    else if (i === chosenIdx && !isCorrect) o.classList.add('c-wrong');
  });

  /* inject explanation */
  var optsDiv = c.querySelector('.mcq-opts');
  if (optsDiv) {
    var expDiv = document.createElement('div'); expDiv.className = 'ans-sec';
    var ico = isCorrect ? 'fa-check-circle' : 'fa-times-circle';
    var col = isCorrect ? 'var(--ok)' : 'var(--no)';
    var lbl = isCorrect ? 'Correct!' : 'Incorrect — Answer: ' + letters[q.ans];

    /* Build the AI section: check cache first */
    var aiSection = '';
    if (!isCorrect) {
      var cached = window.getSessionExplanation(q.id);
      if (cached) {
        /* Already explained — show cached, no button */
        aiSection = renderAiExplanationBox(cached, '13px');
      } else {
        /* Show the Ask AI button */
        aiSection = '<div style="margin-top:10px;border-top:1px solid var(--bd);padding-top:10px">'
          + '<button class="btn btn-sm btn-s" id="mcqAskAi"><i class="fas fa-robot"></i> Ask AI to explain</button>'
          + '<div id="mcqAiReply" style="margin-top:8px"></div></div>';
      }
    }

    expDiv.innerHTML = '<div style="font-weight:700;color:' + col + ';margin-bottom:6px;display:flex;align-items:center;gap:6px;font-size:13px"><i class="fas ' + ico + '"></i>' + lbl + '</div>'
      + '<div style="font-size:13px;line-height:1.6">' + esc(q.exp) + '</div>'
      + aiSection;
    optsDiv.parentNode.insertBefore(expDiv, optsDiv.nextSibling);

    /* Wire Ask AI button (only if not cached) */
    if (!isCorrect && !window.getSessionExplanation(q.id)) {
      var askBtn = document.getElementById('mcqAskAi');
      if (askBtn) askBtn.onclick = function() { askMcqAi(q, chosenIdx, letters); };
    }
  }
}

/* ============================================================
   RENDER MCQ SESSION (main question view)
   ============================================================ */
function renderMcqSession(c) {
  var ses = S.mcq.ses; if (!ses) return;
  var q = ses.questions[ses.idx]; var letters = ['A', 'B', 'C', 'D'];
  var isTopic = ses.mode === 'topic';
  var pct = Math.round((ses.idx + 1) / ses.questions.length * 100);
  var h = '<div class="quiz-ctr page-sec active">';
  /* progress bar */
  h += '<div class="quiz-prog"><span class="quiz-prog-tx">Q' + (ses.idx + 1) + '/' + ses.questions.length + '</span><div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:' + pct + '%"></div></div></div>';
  /* timer */
  if (ses.timeLimit > 0) { var rem = ses.timeLimit - ses.elapsed; h += '<div class="timer-box"><div class="timer-disp' + (rem < 30 ? ' crit' : rem < 60 ? ' warn' : '') + '" id="mcqTimerDisp">' + fmtTime(Math.max(0, rem)) + '</div></div>'; }
  else { h += '<div class="timer-box"><div class="timer-disp" id="mcqTimerDisp">' + fmtTime(ses.elapsed) + '</div></div>'; }
  /* mode label */
  var modeLbl = isTopic ? 'Topic Practice' : ses.mode === 'exam' ? 'Exam Mode' : 'Quiz Mode';
  var modeIc = isTopic ? 'fa-bullseye' : ses.mode === 'exam' ? 'fa-file-alt' : 'fa-clock';
  var tp = topicById(q.topic);
  h += '<div class="card" style="margin-bottom:16px"><div class="card-body">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap"><span class="badge badge-p">' + (tp ? tp.name : q.topic) + '</span><span class="badge" style="background:var(--bg2);color:var(--tx2)"><i class="fas ' + modeIc + '" style="margin-right:4px"></i>' + modeLbl + '</span></div>';
  h += '<div class="question-text" style="font-size:15px;font-weight:600;line-height:1.6;margin-bottom:16px">' + formatQuestionText(q.q) + '</div>';
  /* Render graph/diagram if question has one — priority: svg_config > svg > graph */
  /* If explain mode is active and svg_config_explain exists, use it */
  var useExplainDiagram = isTopic && ses.revealed[ses.idx] && window['he_shown_' + q.id] && q.svg_config_explain;
  if (useExplainDiagram && typeof generateSvgConfigHTML === 'function') {
    h += '<div id="mcqDiagramContainer">' + generateSvgConfigHTML(q.svg_config_explain) + '</div>';
    h += '<div style="text-align:center;margin-top:4px;margin-bottom:4px"><span style="font-size:11px;color:var(--tx3)"><i class="fas fa-info-circle" style="margin-right:3px"></i>Diagram: Explain mode — <span style="color:#0000FF">■</span> D shift · <span style="color:#00AA00">■</span> S shift · <span style="color:#FF0000">●</span> Answer</span></div>';
  } else if (q.svg_config && typeof generateSvgConfigHTML === 'function') {
    h += '<div id="mcqDiagramContainer">' + generateSvgConfigHTML(q.svg_config) + '</div>';
  } else if (q.svg) {
    h += '<div class="econ-graph-container"><div class="econ-graph-wrap">' + q.svg + '</div></div>';
  } else if (q.graph && typeof generateGraphHTML === 'function') {
    h += generateGraphHTML(q.graph);
  }
  h += '<div class="mcq-opts">';
  for (var i = 0; i < q.opts.length; i++) {
    var cls = 'mcq-opt';
    if (isTopic && ses.revealed[ses.idx]) {
      cls += ' dis';
      if (i === q.ans) cls += ' c-ok';
      else if (i === ses.answers[ses.idx] && i !== q.ans) cls += ' c-wrong';
    } else if (ses.answers[ses.idx] === i) { cls += ' sel'; }
    h += '<div class="' + cls + '" data-oi="' + i + '"><div class="opt-let">' + letters[i] + '</div><div class="opt-tx">' + esc(q.opts[i]) + '</div></div>';
  }
  h += '</div>';

  /* show explanation only for topic mode after reveal */
  if (isTopic && ses.revealed[ses.idx]) {
    var wasCorrect = ses.answers[ses.idx] === q.ans;
    var ico2 = wasCorrect ? 'fa-check-circle' : 'fa-times-circle';
    var col2 = wasCorrect ? 'var(--ok)' : 'var(--no)';
    var lbl2 = wasCorrect ? 'Correct!' : 'Incorrect — Answer: ' + letters[q.ans];

    /* ---- Check session cache for AI explanation ---- */
    var aiSection2 = '';
    if (!wasCorrect) {
      var cached2 = window.getSessionExplanation(q.id);
      if (cached2) {
        /* Cached — auto-display, no button */
        aiSection2 = renderAiExplanationBox(cached2, '13px');
      } else {
        /* Not cached — show button */
        aiSection2 = '<div style="margin-top:10px;border-top:1px solid var(--bd);padding-top:10px">'
          + '<button class="btn btn-sm btn-s" id="mcqAskAi"><i class="fas fa-robot"></i> Ask AI to explain</button>'
          + '<div id="mcqAiReply" style="margin-top:8px"></div></div>';
      }
    }
    h += '<div class="ans-sec"><div style="font-weight:700;color:' + col2 + ';margin-bottom:6px;display:flex;align-items:center;gap:6px;font-size:13px"><i class="fas ' + ico2 + '"></i>' + lbl2 + '</div>'
      + '<div style="font-size:13px;line-height:1.6">' + esc(q.exp) + '</div>'
      + aiSection2;
    /* Hidden diagram explanation — shown via button click */
    if (q.hidden_explanation || q.svg_config_explain) {
      var heKey = 'he_shown_' + q.id;
      if (window[heKey]) {
        if (q.hidden_explanation) {
          h += '<div class="hidden-exp-box" style="margin-top:10px;padding:10px 12px;background:var(--bg2);border-radius:8px;border-left:3px solid var(--pr);font-size:13px;line-height:1.6"><i class="fas fa-chart-line" style="color:var(--pr);margin-right:6px"></i><strong>Diagram Explanation:</strong><br>' + esc(q.hidden_explanation) + '</div>';
        }
      } else {
        h += '<div style="margin-top:8px"><button class="btn btn-sm btn-s" id="mcqExplainDiagram" style="font-size:12px"><i class="fas fa-chart-line" style="margin-right:4px"></i>Explain Diagram</button></div>';
      }
    }
    h += '</div>';
  }
  h += '</div></div>';
  /* action buttons */
  h += '<div class="quiz-acts">';
  h += '<button class="btn btn-s" ' + (ses.idx === 0 ? 'disabled' : '') + ' id="mcqPrev"><i class="fas fa-arrow-left"></i> Prev</button>';
  h += '<div style="display:flex;gap:8px">';
  if (ses.idx < ses.questions.length - 1) { h += '<button class="btn btn-p" id="mcqNext">Next <i class="fas fa-arrow-right"></i></button>'; }
  else { h += '<button class="btn btn-ok" id="mcqFinish"><i class="fas fa-flag-checkered"></i> Finish</button>'; }
  h += '</div></div></div>';
  c.innerHTML = h;

  /* ---- Wire events per mode ---- */

  if (isTopic) {
    /* TOPIC MODE: click option → instant reveal */
    c.querySelectorAll('.mcq-opt:not(.dis)').forEach(function(el) {
      el.onclick = function() {
        var idx = parseInt(el.dataset.oi, 10);
        revealTopicAnswer(c, ses, idx);
      };
    });
  } else {
    /* EXAM / QUIZ MODE: click option → select only, no feedback */
    c.querySelectorAll('.mcq-opt').forEach(function(el) {
      el.onclick = function() {
        ses.answers[ses.idx] = parseInt(el.dataset.oi, 10);
        c.querySelectorAll('.mcq-opt').forEach(function(o) { o.classList.remove('sel'); });
        el.classList.add('sel');
      };
    });
  }

  var prevBtn = document.getElementById('mcqPrev');
  if (prevBtn) prevBtn.onclick = function() { ses.idx--; renderMcqSession(c); };

  var nextBtn = document.getElementById('mcqNext');
  if (nextBtn) nextBtn.onclick = function() { ses.idx++; renderMcqSession(c); };

  var finBtn = document.getElementById('mcqFinish');
  if (finBtn) finBtn.onclick = function() { finishMcq(); };

  /* Wire Ask AI on re-rendered revealed wrong answers (only if NOT already cached) */
  if (isTopic && ses.revealed[ses.idx] && ses.answers[ses.idx] !== q.ans && !window.getSessionExplanation(q.id)) {
    var askAiBtn = document.getElementById('mcqAskAi');
    if (askAiBtn) {
      askAiBtn.onclick = function() { askMcqAi(q, ses.answers[ses.idx], letters); };
    }
  }

  /* Wire "Explain Diagram" button for hidden_explanation */
  var explDiagBtn = document.getElementById('mcqExplainDiagram');
  if (explDiagBtn) {
    explDiagBtn.onclick = function() {
      window['he_shown_' + q.id] = true;
      renderMcqSession(c);
    };
  }
}

/* ============================================================
   MCQ FINISH — End session, record stats, show results
   ============================================================ */
function finishMcq() {
  if (mcqTimer) clearInterval(mcqTimer);
  var ses = S.mcq.ses; if (!ses) return;
  var correct = 0; var topicCounts = {};
  for (var i = 0; i < ses.questions.length; i++) {
    var q = ses.questions[i]; var isCorrect = ses.answers[i] === q.ans;
    if (isCorrect) correct++;
    if (!topicCounts[q.topic]) topicCounts[q.topic] = { correct: 0, attempted: 0 };
    topicCounts[q.topic].attempted++;
    if (isCorrect) topicCounts[q.topic].correct++;
  }
  var score = Math.round(correct / ses.questions.length * 100);
  var dur = ses.elapsed;
  // Update stats
  Object.keys(topicCounts).forEach(function(tid) {
    if (!S.stats.topics[tid]) S.stats.topics[tid] = { correct: 0, attempted: 0 };
    S.stats.topics[tid].correct += topicCounts[tid].correct;
    S.stats.topics[tid].attempted += topicCounts[tid].attempted;
  });
  recordActivity('mcq', score, dur, Object.keys(topicCounts).join(','));
  S.mcq.history.push({ mode: ses.mode, score: score, correct: correct, total: ses.questions.length, duration: dur, ts: Date.now(), topicCounts: topicCounts });
  renderMcqResults(document.getElementById('content'), ses, correct, score, dur);
  S.mcq.ses = null;
}

/* ============================================================
   RENDER MCQ RESULTS / REVIEW TAB
   - Auto-displays cached AI explanations for wrong answers
   - Shows "Ask AI" button only for uncached wrong answers
   ============================================================ */
function renderMcqResults(c, ses, correct, score, dur) {
  var wrong = ses.questions.length - correct; var letters = ['A', 'B', 'C', 'D'];
  var h = '<div class="quiz-ctr page-sec active">';
  h += '<div class="res-sum"><div class="res-score">' + score + '%</div><div class="res-lbl">' + correct + ' of ' + ses.questions.length + ' correct</div>';
  h += '<div class="res-bd"><div class="bd-item"><div class="bd-val">' + correct + '</div><div class="bd-lbl">Correct</div></div><div class="bd-item"><div class="bd-val">' + wrong + '</div><div class="bd-lbl">Wrong</div></div><div class="bd-item"><div class="bd-val">' + fmtTime(dur) + '</div><div class="bd-lbl">Time</div></div></div></div>';
  h += '<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap"><button class="btn btn-p" id="newSesBtn"><i class="fas fa-redo"></i>New Session</button><button class="btn btn-s" onclick="switchView(\'practice\')"><i class="fas fa-arrow-left"></i>Back to Practice</button><button class="btn btn-s" onclick="switchView(\'dashboard\')"><i class="fas fa-home"></i>Dashboard</button>';
  if (wrong > 0) h += '<button class="btn btn-s" id="retryWrong"><i class="fas fa-sync"></i>Retry Wrong (' + wrong + ')</button>';
  h += '</div>';
  h += '<div class="card"><div class="card-hdr"><div class="card-t"><i class="fas fa-clipboard-list"></i>Review</div></div><div class="card-body">';

  for (var i = 0; i < ses.questions.length; i++) {
    var q2 = ses.questions[i]; var isC = ses.answers[i] === q2.ans;
    h += '<div style="padding:14px 0;border-bottom:1px solid var(--bd)">';
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-weight:700;font-size:13px;color:' + (isC ? 'var(--ok)' : 'var(--no)') + '"><i class="fas ' + (isC ? 'fa-check-circle' : 'fa-times-circle') + '"></i> Q' + (i + 1) + '</span><span class="badge badge-p" style="font-size:11px">' + (topicById(q2.topic) ? topicById(q2.topic).name : q2.topic) + '</span></div>';
    h += '<div class="question-text" style="font-size:13px;margin-bottom:6px">' + formatQuestionText(q2.q) + '</div>';
    /* In review, show explain diagram if available, otherwise question diagram */
    if (q2.svg_config_explain && typeof generateSvgConfigHTML === 'function') {
      h += generateSvgConfigHTML(q2.svg_config_explain);
      h += '<div style="text-align:center;margin-top:2px;margin-bottom:4px"><span style="font-size:10px;color:var(--tx3)"><span style="color:#0000FF">■</span> D shift · <span style="color:#00AA00">■</span> S shift · <span style="color:#FF0000">●</span> Answer</span></div>';
    } else if (q2.svg_config && typeof generateSvgConfigHTML === 'function') { h += generateSvgConfigHTML(q2.svg_config); }
    else if (q2.svg) { h += '<div class="econ-graph-container"><div class="econ-graph-wrap">' + q2.svg + '</div></div>'; }
    else if (q2.graph && typeof generateGraphHTML === 'function') { h += generateGraphHTML(q2.graph); }
    if (!isC && ses.answers[i] >= 0) h += '<div style="font-size:12px;color:var(--no);margin-bottom:4px">Your answer: ' + letters[ses.answers[i]] + '. ' + esc(q2.opts[ses.answers[i]]) + '</div>';
    h += '<div style="font-size:12px;color:var(--ok)">Correct: ' + letters[q2.ans] + '. ' + esc(q2.opts[q2.ans]) + '</div>';
    h += '<div style="font-size:12px;color:var(--tx3);margin-top:4px">' + esc(q2.exp) + '</div>';
    /* Show hidden diagram explanation in review */
    if (q2.hidden_explanation) {
      h += '<div style="margin-top:6px;padding:8px 10px;background:var(--bg2);border-radius:6px;border-left:3px solid var(--pr);font-size:12px;line-height:1.5"><i class="fas fa-chart-line" style="color:var(--pr);margin-right:4px"></i><strong>Diagram:</strong> ' + esc(q2.hidden_explanation) + '</div>';
    }

    /* ---- AI Explanation in Review: check cache first ---- */
    if (!isC) {
      var cachedReview = window.getSessionExplanation(q2.id);
      if (cachedReview) {
        /* Auto-display the cached explanation — no button needed */
        h += renderAiExplanationBox(cachedReview, '12px');
      } else {
        /* No cache — show Ask AI button */
        h += '<div style="margin-top:8px"><button class="btn btn-sm btn-s rev-ask-ai" data-ri="' + i + '"><i class="fas fa-robot"></i> Ask AI to explain</button><div class="rev-ai-reply" data-ri="' + i + '" style="margin-top:6px"></div></div>';
      }
    }
    h += '</div>';
  }
  h += '</div></div></div>';
  c.innerHTML = h;

  /* New Session — restart with same config */
  var newSesBtn = document.getElementById('newSesBtn');
  if (newSesBtn) newSesBtn.onclick = function() {
    var cfg = S.mcq.lastCfg;
    if (cfg) { startMcqSession(cfg.mode, cfg.topics, cfg.count, cfg.timeLimit); }
    else { switchView('practice'); }
  };

  /* Retry Wrong */
  var retryBtn = document.getElementById('retryWrong');
  if (retryBtn) retryBtn.onclick = function() {
    var wrongQs = [];
    for (var j = 0; j < ses.questions.length; j++) { if (ses.answers[j] !== ses.questions[j].ans) wrongQs.push(ses.questions[j]); }
    if (!wrongQs.length) return;
    S.mcq.ses = { mode: 'topic', questions: shuffle(wrongQs), idx: 0, answers: new Array(wrongQs.length).fill(-1), revealed: new Array(wrongQs.length).fill(false), elapsed: 0, timeLimit: 0, startTime: Date.now() };
    S.mcq.lastCfg = { mode: 'topic', topics: wrongQs.map(function(q) { return q.topic; }), count: wrongQs.length, timeLimit: 0 };
    startMcqTimer(); c.innerHTML = ''; renderMcqSession(c);
  };

  /* Wire Ask AI buttons in review — only for questions NOT already cached */
  c.querySelectorAll('.rev-ask-ai').forEach(function(btn) {
    btn.onclick = function() {
      var ri = parseInt(btn.dataset.ri, 10);
      var q3 = ses.questions[ri]; var chosen = ses.answers[ri];
      var replyEl = c.querySelector('.rev-ai-reply[data-ri="' + ri + '"]');
      if (!replyEl) return;

      /* Check if AIHelper is available */
      if (!window.AIHelper || !window.AIHelper.isAvailable()) {
        replyEl.innerHTML = '<div style="font-size:12px;color:var(--wn)"><i class="fas fa-info-circle"></i> AI service is not available.</div>';
        return;
      }

      btn.disabled = true;
      replyEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--tx3)"><div class="spinner" style="width:16px;height:16px;margin:0;border-width:2px"></div>AI is thinking...</div>';

      var tp = topicById(q3.topic);
      var prompt = 'You are an HKDSE Economics tutor. A student got this MCQ wrong:\n\nQuestion: ' + q3.q + '\n';
      prompt += 'Options: ' + q3.opts.map(function(o, k) { return letters[k] + '. ' + o; }).join(' | ') + '\n';
      prompt += 'Student chose: ' + letters[chosen] + ' (' + q3.opts[chosen] + ')\nCorrect: ' + letters[q3.ans] + ' (' + q3.opts[q3.ans] + ')\n';
      if (tp) prompt += 'Topic: ' + tp.name + '\n';
      prompt += '\nExplain in 3-4 sentences why their answer is wrong and why the correct answer is right. Simple language suitable for HKDSE students.';

      window.AIHelper.callAI(prompt, {
        systemPrompt: 'You are an expert HKDSE Economics tutor. Provide clear, concise explanations. Use Markdown.',
        maxTokens: 500,
        temperature: 0.5
      }).then(function(response) {
        /* ---- SAVE to session cache ---- */
        window.setSessionExplanation(q3.id, response);

        /* Replace the button + reply container with the full explanation box */
        var parentDiv = btn.parentNode;
        if (parentDiv) {
          parentDiv.innerHTML = renderAiExplanationBox(response, '12px');
        } else {
          replyEl.innerHTML = renderAiExplanationBox(response, '12px');
        }
      }).catch(function(err) {
        replyEl.innerHTML = '<div style="font-size:12px;color:var(--no)"><i class="fas fa-exclamation-triangle"></i> ' + esc(String(err.message || err)) + '</div>';
        btn.disabled = false;
      });
    };
  });
}
