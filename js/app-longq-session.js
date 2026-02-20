/* ---- Render Long Q Session ---- */
/* v3.0: Integrated with GraphEngine (replaces old GraphTool canvas) */

var _lqGraphEngine = null; // module-level reference for the current engine instance

function renderLongQSession(c){
  var ses=S.longQ.ses;if(!ses)return;
  var q=ses.question;var pidx=ses.partIdx;var part=q.parts[pidx];var tp=topicById(q.topic);
  var pct=Math.round((pidx+1)/q.parts.length*100);

  // Destroy previous engine instance to avoid leaked listeners
  if(_lqGraphEngine){
    _lqGraphEngine.destroy();
    _lqGraphEngine = null;
  }

  var h='<div class="quiz-ctr page-sec active">';
  /* Progress */
  h+='<div class="quiz-prog"><span class="quiz-prog-tx">Part '+(pidx+1)+'/'+q.parts.length+'</span><div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:'+pct+'%"></div></div><span class="quiz-prog-tx" id="lqTimerDisp">'+fmtTime(ses.elapsed)+'</span></div>';

  /* Question header */
  h+='<div class="card" style="margin-bottom:16px"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:'')+'</span><span style="font-weight:700;font-size:15px">'+esc(q.title)+'</span></div>';
  h+='<div class="question-text" style="display:flex;gap:8px;align-items:baseline;margin-bottom:8px"><span style="font-weight:800;color:var(--pr);font-size:16px">'+part.label+'</span><span style="font-size:15px;line-height:1.6">'+formatQuestionText(part.text)+'</span></div>';
  h+='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="badge" style="background:var(--ac)18;color:var(--ac)">'+part.marks+' marks</span>';
  h+='<button class="btn btn-ghost btn-sm" id="lqHintBtn"><i class="fas fa-lightbulb" style="color:var(--wn)"></i>Show Hint</button>';
  h+='<div id="lqHintBox" style="display:none;margin-top:10px;padding:12px;background:rgba(245,158,11,.08);border-radius:8px;border-left:3px solid var(--wn);font-size:13px;color:var(--tx2)"></div>';
  h+='</div></div>';

  /* Tabbed answer/diagram area */
  var activeAnsTab=ses._activeTab||'write';
  h+='<div class="card" style="margin-bottom:0">';
  h+='<div class="tab-bar" id="lqAnsTabs" style="padding:0 16px;border-bottom:1px solid var(--bd)">';
  h+='<button class="tab-btn '+(activeAnsTab==='write'?'active':'')+'" data-anstab="write"><i class="fas fa-edit" style="margin-right:6px"></i>Written Answer</button>';
  h+='<button class="tab-btn '+(activeAnsTab==='diagram'?'active':'')+'" data-anstab="diagram"><i class="fas fa-chart-area" style="margin-right:6px"></i>Diagram</button>';
  h+='</div>';

  /* Written answer pane */
  h+='<div id="lqWritePane" style="display:'+(activeAnsTab==='write'?'block':'none')+'">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px 0"><div style="font-size:12px;color:var(--tx3)" id="lqWordCount">0 words</div></div>';
  h+='<div class="rich-bar" id="lqRichBar">';
  [{ic:'fa-bold',cmd:'bold'},{ic:'fa-italic',cmd:'italic'},{ic:'fa-underline',cmd:'underline'},{ic:'fa-list-ul',cmd:'insertUnorderedList'},{ic:'fa-list-ol',cmd:'insertOrderedList'},{ic:'fa-subscript',cmd:'subscript'},{ic:'fa-superscript',cmd:'superscript'}].forEach(function(b){
    h+='<button data-cmd="'+b.cmd+'" title="'+b.cmd+'"><i class="fas '+b.ic+'"></i></button>';
  });
  h+='</div>';
  h+='<div contenteditable="true" class="form-inp rich-ta" id="lqEditor" style="min-height:320px;max-height:500px;overflow-y:auto;line-height:1.7;font-size:15px;white-space:pre-wrap;margin:0 16px 16px;border-radius:8px">'+ses.answers[pidx]+'</div>';
  h+='</div>';

  /* ──── Diagram pane (GraphEngine v3.0 integration) ──── */
  h+='<div id="lqDiagramPane" style="display:'+(activeAnsTab==='diagram'?'block':'none')+';padding:16px">';
  /* Container div — GraphEngine will create its own canvas inside */
  h+='<div id="lqGraphContainer" style="width:100%;height:380px;border-radius:8px;border:1px solid var(--bd);overflow:hidden;background:var(--bg1);"></div>';
  /* Toolbar */
  h+='<div class="graph-tools" id="geToolbar" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">';
  h+='<button class="lqg-btn active" data-mode="curve" title="Move / Drag"><i class="fas fa-arrows-alt"></i> Move</button>';
  h+='<button class="lqg-btn" data-mode="draw-curve" title="Draw Curve"><i class="fas fa-bezier-curve"></i> Draw</button>';
  h+='<button class="lqg-btn" data-mode="paint" title="Shade Region"><i class="fas fa-fill-drip"></i> Shade</button>';
  h+='<input type="color" value="#3498DB" id="gePaintColor" style="width:32px;height:28px;border:none;cursor:pointer;border-radius:4px">';
  h+='<button class="lqg-btn" data-mode="line" title="Horizontal Line"><i class="fas fa-grip-lines"></i> Line</button>';
  h+='<button class="lqg-btn" data-mode="quota" title="Quota"><i class="fas fa-ruler-vertical"></i> Quota</button>';
  h+='<button class="lqg-btn" data-mode="reference" title="Reference Lines"><i class="fas fa-crosshairs"></i> Ref</button>';
  h+='<button class="lqg-btn" data-mode="label" title="Add Label"><i class="fas fa-font"></i> Label</button>';
  h+='<button class="lqg-btn" data-mode="eraser" title="Eraser"><i class="fas fa-eraser"></i> Erase</button>';
  h+='<span style="flex:1"></span>';
  h+='<button class="lqg-btn" data-tool="undo" title="Undo"><i class="fas fa-undo"></i></button>';
  h+='<button class="lqg-btn" data-tool="redo" title="Redo"><i class="fas fa-redo"></i></button>';
  h+='<button class="lqg-btn" data-tool="clear" title="Clear All"><i class="fas fa-trash"></i></button>';
  h+='</div>';
  h+='</div>';

  h+='</div>'; /* end card */

  /* Navigation */
  h+='<div class="quiz-acts" style="margin-top:16px">';
  h+='<button class="btn btn-s" '+(pidx===0?'disabled':'')+' id="lqPrev"><i class="fas fa-arrow-left"></i>Previous</button>';
  h+='<div style="display:flex;gap:8px">';
  if(pidx<q.parts.length-1){h+='<button class="btn btn-p" id="lqNext">Next Part<i class="fas fa-arrow-right"></i></button>';}
  else{h+='<button class="btn btn-ok" id="lqSubmit"><i class="fas fa-paper-plane"></i>Submit for Feedback</button>';}
  h+='</div></div>';

  /* Feedback area */
  if(ses.feedback){
    h+='<div class="card" style="margin-top:16px"><div class="card-hdr"><div class="card-t"><i class="fas fa-robot"></i>AI Feedback</div></div><div class="card-body md-content" id="lqFeedbackContent">'+renderMd(ses.feedback)+'</div></div>';
  }
  h+='</div>';
  c.innerHTML=h;

  /* ──── Wire answer/diagram tab switching ──── */
  var graphInited = (activeAnsTab === 'diagram');

  function _initGraphEngine(){
    if(_lqGraphEngine) return; // already inited

    var containerEl = document.getElementById('lqGraphContainer');
    if(!containerEl) return;

    // Restore saved state, or create fresh
    var savedState = null;
    if(ses.graphStates && ses.graphStates[pidx]){
      try { savedState = JSON.parse(ses.graphStates[pidx]); } catch(e){}
    }
    var graphState = savedState ? initGraphState(savedState) : initGraphState();
    // Copy full arrays if restoring
    if(savedState){
      ['curves','labels','shading','referenceLines','quotas','lines'].forEach(function(k){
        if(savedState[k]) graphState[k] = savedState[k];
      });
    }

    // Check if question has pre-defined curves to load
    var preloadCurves = null;
    if(q.graphCurves && !savedState){
      preloadCurves = q.graphCurves; // array of {type, label, color, p1, p2}
    }

    _lqGraphEngine = new GraphEngine(containerEl, graphState, {
      initialCurves: preloadCurves,
      theme: 'auto',
      readOnly: false,
      axisLabels: (q.axisLabels || null),
      onStateChange: function(state){
        // Auto-save graph state to session
        if(!ses.graphStates) ses.graphStates = {};
        ses.graphStates[pidx] = JSON.stringify(state);
      }
    });
  }

  c.querySelectorAll('#lqAnsTabs .tab-btn').forEach(function(btn){
    btn.onclick=function(){
      c.querySelectorAll('#lqAnsTabs .tab-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      var tab=btn.dataset.anstab;
      ses._activeTab=tab;
      document.getElementById('lqWritePane').style.display=tab==='write'?'block':'none';
      document.getElementById('lqDiagramPane').style.display=tab==='diagram'?'block':'none';
      if(tab==='diagram' && !graphInited){
        graphInited=true;
        _initGraphEngine();
      }
    };
  });

  /* Init graph engine immediately if diagram tab is already active */
  if(activeAnsTab==='diagram'){
    graphInited=true;
    // Use setTimeout to ensure DOM is rendered
    setTimeout(function(){ _initGraphEngine(); }, 0);
  }

  /* ──── Wire GraphEngine toolbar ──── */
  document.querySelectorAll('#geToolbar .lqg-btn[data-mode]').forEach(function(btn){
    btn.onclick=function(){
      if(!_lqGraphEngine) return;
      var mode = btn.dataset.mode;
      _lqGraphEngine.setMode(mode);
      document.querySelectorAll('#geToolbar .lqg-btn[data-mode]').forEach(function(b){
        b.classList.remove('active');
        b.style.background=''; b.style.color=''; b.style.borderColor='';
      });
      btn.classList.add('active');
      btn.style.background='rgba(37,99,235,.1)';
      btn.style.color='var(--pr)';
      btn.style.borderColor='var(--pr)';
    };
  });

  document.querySelectorAll('#geToolbar .lqg-btn[data-tool]').forEach(function(btn){
    btn.onclick=function(){
      if(!_lqGraphEngine) return;
      var tool = btn.dataset.tool;
      if(tool === 'undo') _lqGraphEngine.undo();
      else if(tool === 'redo') _lqGraphEngine.redo();
      else if(tool === 'clear'){
        if(confirm('Clear all diagram elements?')) _lqGraphEngine.clearAll();
      }
    };
  });

  var paintColorEl = document.getElementById('gePaintColor');
  if(paintColorEl){
    paintColorEl.onchange = function(){
      if(!_lqGraphEngine) return;
      _lqGraphEngine.gs.paintColor = this.value;
      if(_lqGraphEngine.gs.paintState){
        _lqGraphEngine.gs.paintState.color = this.value;
      }
    };
  }

  /* ──── Wire editor ──── */
  var editor=document.getElementById('lqEditor');
  var wcEl=document.getElementById('lqWordCount');
  function updateWC(){var txt=(editor.innerText||'').trim();var words=txt?txt.split(/\s+/).length:0;wcEl.textContent=words+' words';ses.answers[pidx]=editor.innerHTML;}
  editor.oninput=updateWC;
  updateWC();

  /* Rich bar commands */
  document.querySelectorAll('#lqRichBar button').forEach(function(btn){
    btn.onclick=function(e){e.preventDefault();document.execCommand(btn.dataset.cmd,false,null);editor.focus();};
  });

  /* Hint toggle */
  document.getElementById('lqHintBtn').onclick=function(){
    var box=document.getElementById('lqHintBox');
    if(box.style.display==='none'){box.style.display='block';box.textContent=part.hint;this.innerHTML='<i class="fas fa-lightbulb" style="color:var(--wn)"></i>Hide Hint';}
    else{box.style.display='none';this.innerHTML='<i class="fas fa-lightbulb" style="color:var(--wn)"></i>Show Hint';}
  };

  /* ──── Navigation ──── */
  function saveCurrent(){
    ses.answers[pidx]=editor.innerHTML;
    // Save graph state via engine's auto-save (already wired in onStateChange)
    if(_lqGraphEngine){
      if(!ses.graphStates) ses.graphStates = {};
      ses.graphStates[pidx] = JSON.stringify(_lqGraphEngine.toJSON());
      // Also keep PNG for backward compat with old submission flow
      ses.graphs[pidx] = _lqGraphEngine.toPNG();
    }
  }
  var prevBtn=document.getElementById('lqPrev');if(prevBtn)prevBtn.onclick=function(){saveCurrent();ses.partIdx--;renderLongQSession(c);};
  var nextBtn=document.getElementById('lqNext');if(nextBtn)nextBtn.onclick=function(){saveCurrent();ses.partIdx++;renderLongQSession(c);};
  var subBtn=document.getElementById('lqSubmit');if(subBtn)subBtn.onclick=function(){saveCurrent();submitLongQ(c);};
}
