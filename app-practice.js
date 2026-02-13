/* ---- Unified Practice Section ---- */
var practiceTab=S._practiceTab||'mcq';
Sections.practice=function(c){
  /* If active MCQ session, show it directly */
  if(S.mcq.ses){renderMcqSession(c);return;}
  /* If active Long Q session, show it directly */
  if(S.longQ.ses){renderLongQSession(c);return;}
  var h='<div class="page-sec active">';
  h+='<div style="text-align:center;margin-bottom:24px"><h2 style="font-size:1.5rem;font-weight:800"><i class="fas fa-graduation-cap" style="color:var(--pr);margin-right:8px"></i>Practice</h2><p style="color:var(--tx2);margin-top:4px">Sharpen your skills for the HKDSE</p></div>';

  /* Top-level tabs: MCQ | Long Questions */
  h+='<div class="tab-bar" id="pracTabs" style="margin-bottom:20px">';
  h+='<button class="tab-btn '+(practiceTab==='mcq'?'active':'')+'" data-ptab="mcq"><i class="fas fa-list-ol" style="margin-right:6px"></i>MCQ (Paper 1)</button>';
  h+='<button class="tab-btn '+(practiceTab==='longq'?'active':'')+'" data-ptab="longq"><i class="fas fa-pen-fancy" style="margin-right:6px"></i>Long Questions (Paper 2)</button>';
  h+='</div>';

  /* MCQ pane */
  h+='<div id="pracMcqPane" style="display:'+(practiceTab==='mcq'?'block':'none')+'">';
  h+=renderMcqLanding();
  h+='</div>';

  /* Long Q pane */
  h+='<div id="pracLqPane" style="display:'+(practiceTab==='longq'?'block':'none')+'">';
  h+=renderLqLanding();
  h+='</div>';

  h+='</div>';
  c.innerHTML=h;

  /* Tab switching */
  c.querySelectorAll('#pracTabs .tab-btn').forEach(function(btn){
    btn.onclick=function(){
      c.querySelectorAll('#pracTabs .tab-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      practiceTab=btn.dataset.ptab;
      S._practiceTab=practiceTab;
      document.getElementById('pracMcqPane').style.display=practiceTab==='mcq'?'block':'none';
      document.getElementById('pracLqPane').style.display=practiceTab==='longq'?'block':'none';
      if(practiceTab==='mcq')wireMcqLanding(c);
      if(practiceTab==='longq')wireLqLanding(c);
    };
  });

  /* Wire MCQ pane */
  if(practiceTab==='mcq')wireMcqLanding(c);

  /* Wire Long Q pane if active */
  if(practiceTab==='longq')wireLqLanding(c);
};

/* Wire MCQ landing interactions */
function wireMcqLanding(c){
  /* Sub-tab switching */
  var subBtns=c.querySelectorAll('#mcqSubTabs .tab-btn');
  if(!subBtns.length)return;
  subBtns.forEach(function(btn){
    btn.onclick=function(){
      c.querySelectorAll('#mcqSubTabs .tab-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      var st=btn.dataset.msub;
      document.getElementById('mcqSetupPane').style.display=st==='setup'?'block':'none';
      document.getElementById('mcqHistoryPane').style.display=st==='history'?'block':'none';
      if(st==='history')renderMcqHistory();
    };
  });

  /* Mode selector cards */
  c.querySelectorAll('[data-mcqmode]').forEach(function(el){
    el.onclick=function(){
      c.querySelectorAll('[data-mcqmode]').forEach(function(e){e.classList.remove('sel');});
      el.classList.add('sel');
      _mcqMode=el.dataset.mcqmode;
      document.getElementById('mcqPanelTopic').style.display=_mcqMode==='topic'?'block':'none';
      document.getElementById('mcqPanelExam').style.display=_mcqMode==='exam'?'block':'none';
      document.getElementById('mcqPanelQuiz').style.display=_mcqMode==='quiz'?'block':'none';
    };
  });

  /* ---- Topic Practice wiring ---- */
  var topicItems=c.querySelectorAll('#topicTopicList .topic-sel-item');
  topicItems.forEach(function(el){
    el.onclick=function(){
      /* Single-select: clicking one deselects others */
      topicItems.forEach(function(e){e.classList.remove('sel');});
      el.classList.add('sel');
    };
  });
  var topicStartBtn=document.getElementById('topicStartBtn');
  if(topicStartBtn)topicStartBtn.onclick=function(){
    var selTid=null;
    c.querySelectorAll('#topicTopicList .topic-sel-item.sel').forEach(function(e){selTid=e.dataset.tid;});
    if(!selTid){toast('Select a topic','err');return;}
    var topics=selTid==='all'?TOPICS.map(function(t){return t.id;}):[selTid];
    var count=parseInt(document.getElementById('topicQCount').value,10);
    var hasTime=document.getElementById('topicTimeCheck').checked;
    startMcqSession(hasTime?'quiz':'topic',topics,count);
  };

  /* ---- Exam Mode wiring ---- */
  var examStartBtn=document.getElementById('examStartBtn');
  if(examStartBtn)examStartBtn.onclick=function(){
    startMcqSession('exam',TOPICS.map(function(t){return t.id;}),40);
  };

  /* ---- Quiz Mode wiring ---- */
  var quizTopicItems=c.querySelectorAll('#quizTopicList .topic-sel-item');
  quizTopicItems.forEach(function(el){
    el.onclick=function(){el.classList.toggle('sel');};
  });
  c.querySelectorAll('#mcqPanelQuiz .type-card').forEach(function(el){
    el.onclick=function(){
      c.querySelectorAll('#mcqPanelQuiz .type-card').forEach(function(e){e.classList.remove('sel');});
      el.classList.add('sel');
    };
  });
  var quizStartBtn=document.getElementById('quizStartBtn');
  if(quizStartBtn)quizStartBtn.onclick=function(){
    var topics=[];
    c.querySelectorAll('#quizTopicList .topic-sel-item.sel').forEach(function(e){topics.push(e.dataset.tid);});
    if(!topics.length){toast('Select at least one topic','err');return;}
    var timeEl=c.querySelector('#mcqPanelQuiz .type-card.sel');
    var timeMins=timeEl?parseInt(timeEl.dataset.time,10):10;
    var qcount=timeEl?parseInt(timeEl.dataset.qcount,10):10;
    startMcqSession('quiz',topics,qcount,timeMins*60);
  };

  /* Past Sessions renderer */
  function renderMcqHistory(){
    var list=document.getElementById('mcqHistoryList');if(!list)return;
    if(!S.mcq.history.length){list.innerHTML='<div class="empty-state" style="padding:30px"><div class="empty-ic" style="font-size:32px"><i class="fas fa-inbox"></i></div><div class="empty-t">No sessions yet</div><div class="empty-tx">Complete a practice session to see your history</div></div>';return;}
    var hh='';
    S.mcq.history.slice().reverse().forEach(function(s3){
      var co=s3.score>=70?'var(--ok)':s3.score>=50?'var(--wn)':'var(--no)';
      hh+='<div class="card" style="margin-bottom:10px"><div class="card-body" style="padding:14px 18px;display:flex;align-items:center;gap:14px">';
      hh+='<div style="width:38px;height:38px;border-radius:50%;background:'+co+'18;display:flex;align-items:center;justify-content:center"><i class="fas fa-list-ol" style="color:'+co+';font-size:14px"></i></div>';
      hh+='<div style="flex:1"><div style="font-weight:600;font-size:14px">'+s3.mode.charAt(0).toUpperCase()+s3.mode.slice(1)+' Mode &bull; '+s3.correct+'/'+s3.total+'</div><div style="font-size:12px;color:var(--tx3)">'+fmtDate(s3.ts)+' &bull; '+fmtTime(s3.duration)+'</div></div>';
      hh+='<span class="badge" style="background:'+co+'18;color:'+co+'">'+s3.score+'%</span>';
      hh+='</div></div>';
    });
    list.innerHTML=hh;
  }
}

function startMcqSession(mode,topics,count,customTimeLimit){
  var pool=MCQ_BANK.filter(function(q){return topics.indexOf(q.topic)>=0;});
  pool=shuffle(pool).slice(0,Math.min(count,pool.length));
  if(!pool.length){toast('No questions for selected topics','err');return;}
  var tl=0;
  if(customTimeLimit){tl=customTimeLimit;}
  else if(mode==='quiz'){tl=pool.length*45;}
  else if(mode==='exam'){tl=3600;}
  S.mcq.lastCfg={mode:mode,topics:topics,count:count,timeLimit:tl};
  S.mcq.ses={mode:mode,questions:pool,idx:0,answers:new Array(pool.length).fill(-1),revealed:new Array(pool.length).fill(false),elapsed:0,timeLimit:tl,startTime:Date.now()};
  startMcqTimer();
  var c=document.getElementById('content');c.innerHTML='';renderMcqSession(c);
}
