/* === DSE ECON v2.1 === */
(function(){
if(window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark');
window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){e.matches?document.documentElement.classList.add('dark'):document.documentElement.classList.remove('dark');});
})();

/* ---- Topics ---- */
var TOPICS=[
{id:'micro-1',name:'Basic Economic Concepts',icon:'💡',cat:'Micro'},
{id:'micro-2',name:'Firms and Production',icon:'🏢',cat:'Micro'},
{id:'micro-3',name:'Markets and Prices',icon:'📈',cat:'Micro'},
{id:'micro-4',name:'Competition & Market Structures',icon:'♟️',cat:'Micro'},
{id:'micro-5',name:'Efficiency, Equity & Government',icon:'⚖️',cat:'Micro'},
{id:'macro-1',name:'Measuring Economic Performance',icon:'📊',cat:'Macro'},
{id:'macro-2',name:'National Income Determination',icon:'💰',cat:'Macro'},
{id:'macro-3',name:'Money and Banking',icon:'🏛️',cat:'Macro'},
{id:'macro-4',name:'Macro Problems & Policies',icon:'⚙️',cat:'Macro'},
{id:'macro-5',name:'International Trade & Finance',icon:'🌍',cat:'Macro'}
];
function topicById(id){for(var i=0;i<TOPICS.length;i++){if(TOPICS[i].id===id)return TOPICS[i];}return null;}

/* ---- State ---- */
var S={view:'dashboard',mcq:{ses:null,history:[]},longQ:{ses:null,history:[],bank:[]},aiGen:{history:[]},stats:{sessions:0,time:0,recent:[],topics:{},graphsUsed:0}};

/* ---- Utils ---- */
function genId(){return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);}
function fmtTime(sec){var m=Math.floor(sec/60);var s2=sec%60;return m+':'+(s2<10?'0':'')+s2;}
function fmtDate(ts){return new Date(ts).toLocaleDateString('en-HK',{day:'numeric',month:'short'});}
function esc(str){var d=document.createElement('div');d.appendChild(document.createTextNode(str));return d.innerHTML;}
function renderMd(t){try{if(typeof marked!=='undefined'&&typeof DOMPurify!=='undefined')return DOMPurify.sanitize(marked.parse(t||''));}catch(e){/* empty */}return esc(t||'');}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=a[i];a[i]=a[j];a[j]=tmp;}return a;}

/* ---- Load Questions from External JSON ---- */
var MCQ_BANK=[];
function loadQuestions(){
  fetch('questions.json')
    .then(function(res){return res.json();})
    .then(function(data){
      if(data.mcq&&Array.isArray(data.mcq)){
        MCQ_BANK=data.mcq;
      }
    })
    .catch(function(err){console.error('Error loading questions:',err);});
}

/* ---- Toast ---- */
function toast(msg,type){
  type=type||'info';var ctr=document.getElementById('toastCtr');
  var cls=type==='ok'?'t-ok':type==='err'?'t-err':'t-info';
  var col=type==='ok'?'var(--ok)':type==='err'?'var(--no)':'var(--pr)';
  var el=document.createElement('div');el.className='toast '+cls;
  el.innerHTML='<div style="font-size:18px">✓</div><div style="flex:1;font-weight:600;font-size:13px">'+msg+'</div>';
  ctr.appendChild(el);setTimeout(function(){el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(function(){el.remove();},300);},3000);
}

/* ---- Modal ---- */
var Modal={
  show:function(html){document.getElementById('modalCtr').innerHTML='<div class="modal-ov" onclick="if(event.target===this)Modal.hide()"><div class="modal-box">'+html+'</div></div>';},
  confirm:function(msg,onYes){
    var h='<p style="font-size:15px;margin-bottom:18px">'+msg+'</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-s" onclick="Modal.hide()">Cancel</button><button class="btn btn-p" id="mcBtn">Confirm</button></div>';
    this.show(h);document.getElementById('mcBtn').onclick=function(){Modal.hide();if(onYes)onYes();};
  },
  hide:function(){document.getElementById('modalCtr').innerHTML='';}
};

/* ---- Nav ---- */
var NAV=[
{id:'dashboard',icon:'🏠',label:'Dashboard'},
{id:'practice',icon:'🎓',label:'Practice'},
{id:'ai-gen',icon:'🤖',label:'AI Generation'},
{id:'analytics',icon:'📊',label:'Analytics'}
];
function recordActivity(type,score,dur,topicId){
  S.stats.sessions++;S.stats.time+=dur;
  S.stats.recent.push({type:type,score:score,duration:dur,topic:topicId,ts:Date.now()});
  if(S.stats.recent.length>50)S.stats.recent.shift();
}
function initNav(){
  var sb=document.getElementById('sbNav');var h='<div class="nav-lbl">Menu</div>';
  NAV.forEach(function(n){h+='<div class="nav-item'+(S.view===n.id?' active':'')+'" data-nav="'+n.id+'"><span>'+n.icon+'</span>'+n.label+'</div>';});
  sb.innerHTML=h;
  sb.querySelectorAll('.nav-item').forEach(function(el){el.onclick=function(){switchView(el.dataset.nav);};});
  document.getElementById('mobBtn').onclick=function(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sbOv').classList.toggle('show');};
  document.getElementById('sbOv').onclick=function(){document.getElementById('sidebar').classList.remove('open');this.classList.remove('show');};
  document.getElementById('themeBtn').onclick=function(){
    document.documentElement.classList.toggle('dark');
    document.getElementById('themeIc').textContent=document.documentElement.classList.contains('dark')?'☀️':'🌙';
  };
}
function switchView(id){
  S.view=id;
  var navItem=NAV.find(function(n){return n.id===id;});
  document.getElementById('pgTitle').textContent=navItem?navItem.label:'App';
  document.getElementById('sbNav').querySelectorAll('.nav-item').forEach(function(el){el.classList.toggle('active',el.dataset.nav===id);});
  document.getElementById('sidebar').classList.remove('open');document.getElementById('sbOv').classList.remove('show');
  var c=document.getElementById('content');c.innerHTML='';
  if(Sections[id])Sections[id](c);
  else c.innerHTML='<div class="empty-state"><div class="empty-ic">⚙️</div><div class="empty-t">Coming Soon</div></div>';
}
var Sections={};

/* ---- Dashboard ---- */
function statCard(val,lbl,emoji,bg,col){return '<div class="stat-card"><div class="stat-ic" style="background:'+bg+';color:'+col+'"><span>'+emoji+'</span></div><div class="stat-val">'+val+'</div><div class="stat-lbl">'+lbl+'</div></div>';}
Sections.dashboard=function(c){
  var st=S.stats;var tq=0,tc=0;
  Object.keys(st.topics).forEach(function(k){tq+=st.topics[k].attempted;tc+=st.topics[k].correct;});
  var acc=tq>0?Math.round(tc/tq*100):0;
  var h='<div class="page-sec active">';
  h+='<div style="margin-bottom:24px"><h2 style="font-size:1.5rem;font-weight:800">Welcome back! 📚</h2><p style="color:var(--tx2);font-size:14px">HKDSE Economics Study Companion</p></div>';
  h+='<div class="grid-4" style="margin-bottom:24px">';
  h+=statCard(st.sessions,'Sessions','📖','rgba(37,99,235,.1)','var(--pr)');
  h+=statCard(tq,'Questions','📋','rgba(6,182,212,.1)','var(--ac)');
  h+=statCard(acc+'%','Accuracy','🎯','rgba(16,185,129,.1)','var(--ok)');
  h+=statCard(fmtTime(st.time),'Study Time','⏱️','rgba(245,158,11,.1)','var(--wn)');
  h+='</div>';
  h+='<h3 style="font-weight:700;margin-bottom:12px">Quick Start</h3><div class="grid-3" style="margin-bottom:24px">';
  [{icon:'🎓',co:'var(--pr)',l:'Practice',d:'MCQ & Long Questions',v:'practice'},{icon:'🤖',co:'var(--ok)',l:'AI Generation',d:'Custom questions',v:'ai-gen'},{icon:'📊',co:'var(--ac)',l:'Analytics',d:'Track your progress',v:'analytics'}].forEach(function(a){
    h+='<div class="card" style="cursor:pointer;transition:all .2s" onclick="switchView(\''+a.v+'\')" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'"><div class="card-body" style="display:flex;align-items:center;gap:14px"><div style="width:44px;height:44px;border-radius:10px;background:'+a.co+'18;display:flex;align-items:center;justify-content:center;font-size:22px">'+a.icon+'</div><div><div style="font-weight:700;font-size:14px">'+a.l+'</div><div style="font-size:12px;color:var(--tx3)">'+a.d+'</div></div></div></div>';
  });
  h+='</div>';
  var rec=st.recent.slice().reverse().slice(0,5);
  h+='<h3 style="font-weight:700;margin-bottom:12px">Recent Activity</h3>';
  if(!rec.length)h+='<div class="empty-state" style="padding:30px"><div class="empty-ic">⏰</div><div class="empty-t">No activity yet</div><div class="empty-tx">Start a practice session!</div></div>';
  else rec.forEach(function(r){var co=r.score>=70?'var(--ok)':r.score>=50?'var(--wn)':'var(--no)';h+='<div class="card" style="margin-bottom:8px"><div class="card-body" style="padding:14px 18px;display:flex;align-items:center;gap:14px"><div style="width:38px;height:38px;border-radius:50%;background:'+co+'18;display:flex;align-items:center;justify-content:center;font-size:16px">'+(r.type==='mcq'?'📝':'✏️')+'</div><div style="flex:1"><div style="font-weight:600;font-size:14px">'+r.type.toUpperCase()+' Session</div><div style="font-size:12px;color:var(--tx3)">'+fmtDate(r.ts)+' &bull; '+fmtTime(r.duration)+'</div></div><span class="badge" style="background:'+co+'18;color:'+co+'">'+r.score+'%</span></div></div>';});
  h+='</div>';c.innerHTML=h;
};

/* ---- MCQ Timer ---- */
var mcqTimer=null;
function startMcqTimer(){
  if(mcqTimer)clearInterval(mcqTimer);
  mcqTimer=setInterval(function(){
    var ses=S.mcq.ses;if(!ses){clearInterval(mcqTimer);return;}
    ses.elapsed++;
    if(ses.timeLimit>0&&ses.elapsed>=ses.timeLimit){clearInterval(mcqTimer);finishMcq();}
    var el=document.getElementById('mcqTimerDisp');
    if(el){var rem=ses.timeLimit>0?ses.timeLimit-ses.elapsed:ses.elapsed;
      el.textContent=fmtTime(Math.max(0,rem));
      if(ses.timeLimit>0){el.className='timer-disp'+(rem<30?' crit':rem<60?' warn':'');}
    }
  },1000);
}

/* ---- Unified Practice Section ---- */
var practiceTab=S._practiceTab||'mcq';
Sections.practice=function(c){
  /* If active MCQ session, show it directly */
  if(S.mcq.ses){renderMcqSession(c);return;}
  /* If active Long Q session, show it directly */
  if(S.longQ.ses){renderLongQSession(c);return;}
  var h='<div class="page-sec active">';
  h+='<div style="text-align:center;margin-bottom:24px"><h2 style="font-size:1.5rem;font-weight:800"><span style="font-size:28px">🎓</span>Practice</h2><p style="color:var(--tx2);margin-top:4px">Sharpen your skills for the HKDSE</p></div>';

  /* Top-level tabs: MCQ | Long Questions */
  h+='<div class="tab-bar" id="pracTabs" style="margin-bottom:20px">';
  h+='<button class="tab-btn '+(practiceTab==='mcq'?'active':'')+'" data-ptab="mcq"><span style="margin-right:6px">📋</span>MCQ (Paper 1)</button>';
  h+='<button class="tab-btn '+(practiceTab==='longq'?'active':'')+'" data-ptab="longq"><span style="margin-right:6px">✏️</span>Long Questions (Paper 2)</button>';
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

/* ---- MCQ: count questions per topic ---- */
function mcqCountByTopic(tid){
  if(!tid)return MCQ_BANK.length;
  var c2=0;for(var i=0;i<MCQ_BANK.length;i++){if(MCQ_BANK[i].topic===tid)c2++;}return c2;
}
var _mcqMode='topic';

/* MCQ landing HTML — matches reference screenshots */
function renderMcqLanding(){
  var totalQ=MCQ_BANK.length;
  var h='';

  /* Sub-tabs: Practice | Past Sessions */
  h+='<div class="tab-bar" id="mcqSubTabs" style="margin-bottom:16px">';
  h+='<button class="tab-btn active" data-msub="setup">Practice</button>';
  h+='<button class="tab-btn" data-msub="history">Past Sessions</button>';
  h+='</div>';

  /* Practice setup pane */
  h+='<div id="mcqSetupPane">';

  /* Mode selector card */
  h+='<div class="card" style="margin-bottom:20px"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="font-size:18px">🔄</span><span style="font-weight:700;font-size:16px">Practice Mode</span></div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:16px">Choose your practice mode with <strong>'+totalQ+' authentic HKDSE past paper questions</strong>.</p>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
  [{id:'topic',em:'🎯',t:'Topic Practice',d:'Intensive training'},
   {id:'exam',em:'📄',t:'Exam Mode',d:'40 Qs · 1 Hour'},
   {id:'quiz',em:'⏱️',t:'Quiz Mode',d:'Timed challenge'}].forEach(function(m){
    h+='<div class="type-card'+(m.id===_mcqMode?' sel':'')+'" data-mcqmode="'+m.id+'" style="padding:18px 10px"><span style="font-size:24px">'+m.em+'</span><div class="type-card-t">'+m.t+'</div><div class="type-card-w">'+m.d+'</div></div>';
  });
  h+='</div></div></div>';

  /* ---- Topic Practice panel ---- */
  h+='<div id="mcqPanelTopic" class="card" style="margin-bottom:20px;display:'+(_mcqMode==='topic'?'block':'none')+'"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:18px">🎯</span><span style="font-weight:700;font-size:16px">Topic Practice</span></div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:16px">Focus on specific topics for intensive revision. No time pressure.</p>';
  h+='<div style="font-weight:700;font-size:13px;margin-bottom:10px">Select Topic</div>';
  h+='<div class="topic-sel-grid" id="topicTopicList">';
  /* All Topics option */
  h+='<div class="topic-sel-item sel" data-tid="all"><span style="font-size:16px">📚</span><span style="flex:1">All Topics</span><span style="color:var(--tx3);font-size:12px">('+totalQ+')</span></div>';
  TOPICS.forEach(function(t){
    var cnt=mcqCountByTopic(t.id);
    h+='<div class="topic-sel-item" data-tid="'+t.id+'"><span style="font-size:16px">'+t.icon+'</span><span style="flex:1">'+t.name+'</span><span style="color:var(--tx3);font-size:12px">('+cnt+')</span></div>';
  });
  h+='</div>';
  h+='<div style="font-weight:700;font-size:13px;margin:18px 0 10px">Number of Questions</div>';
  h+='<select class="form-sel" id="topicQCount" style="width:100%;font-size:16px"><option value="10">10 Questions</option><option value="20">20 Questions</option><option value="30">30 Questions</option></select>';
  h+='<label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-size:13px;cursor:pointer"><input type="checkbox" id="topicTimeCheck"><span>Enable Time Limit</span></label>';
  h+='<button class="btn btn-p btn-lg" style="width:100%;margin-top:18px;justify-content:center" id="topicStartBtn"><span style="margin-right:6px">▶️</span>Start Topic Practice</button>';
  h+='</div></div>';

  /* ---- Exam Mode panel ---- */
  h+='<div id="mcqPanelExam" class="card" style="margin-bottom:20px;display:'+(_mcqMode==='exam'?'block':'none')+'"><div class="card-body" style="text-align:center">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;justify-content:center"><span style="font-size:18px">📄</span><span style="font-weight:700;font-size:16px">Exam Mode</span></div>';
  h+='<div style="font-size:48px;margin-bottom:12px">📋</div>';
  h+='<div style="font-weight:700;font-size:17px;margin-bottom:6px">HKDSE Exam Simulation</div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:20px">40 randomly selected questions from all topics.<br>Strict 1-hour time limit. No going back!</p>';
  h+='<div style="display:flex;gap:12px;justify-content:center;margin-bottom:18px">';
  [{v:'40',l:'Questions'},{v:'60',l:'Minutes'},{v:''+TOPICS.length,l:'Topics'}].forEach(function(s4){
    h+='<div style="border:2px solid var(--ac);border-radius:12px;padding:14px 20px;min-width:80px"><div style="font-size:22px;font-weight:800;color:var(--ac)">'+s4.v+'</div><div style="font-size:11px;color:var(--tx3)">'+s4.l+'</div></div>';
  });
  h+='</div>';
  h+='<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:12px 16px;color:var(--wn);font-size:12px;font-weight:600;margin-bottom:18px"><span style="margin-right:6px">⚠️</span>Warning: Once started, you cannot pause or restart. Make sure you have 1 hour available.</div>';
  h+='<button class="btn btn-p btn-lg" style="justify-content:center" id="examStartBtn"><span style="margin-right:6px">▶️</span>Begin Exam</button>';
  h+='</div></div>';

  /* ---- Quiz Mode panel ---- */
  h+='<div id="mcqPanelQuiz" class="card" style="margin-bottom:20px;display:'+(_mcqMode==='quiz'?'block':'none')+'"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:18px">⏱️</span><span style="font-weight:700;font-size:16px">Quiz Mode</span></div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:16px">Timed challenge! Question count is based on time selected.</p>';
  h+='<div style="font-weight:700;font-size:13px;margin-bottom:10px">Select Topics (multiple allowed)</div>';
  h+='<div class="topic-sel-grid" id="quizTopicList">';
  TOPICS.forEach(function(t){
    var cnt=mcqCountByTopic(t.id);
    h+='<div class="topic-sel-item" data-tid="'+t.id+'"><span style="font-size:16px">'+t.icon+'</span><span style="flex:1">'+t.name+'</span><span style="color:var(--tx3);font-size:12px">('+cnt+')</span></div>';
  });
  h+='</div>';
  h+='<div style="font-weight:700;font-size:13px;margin:18px 0 10px">Time Limit</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
  [{t:'10 min',d:'10 Questions',v:10},{t:'15 min',d:'15 Questions',v:15},{t:'30 min',d:'25 Questions',v:30}].forEach(function(tl,i){
    h+='<div class="type-card'+(i===0?' sel':'')+'" data-time="'+tl.v+'" data-qcount="'+(tl.v===10?10:tl.v===15?15:25)+'"><div class="type-card-t">'+tl.t+'</div><div class="type-card-w">'+tl.d+'</div></div>';
  });
  h+='</div>';
  h+='<button class="btn btn-p btn-lg" style="width:100%;margin-top:18px;justify-content:center" id="quizStartBtn"><span style="margin-right:6px">▶️</span>Start Quiz</button>';
  h+='</div></div>';

  h+='</div>'; /* end mcqSetupPane */

  /* Past Sessions pane */
  h+='<div id="mcqHistoryPane" style="display:none"><div id="mcqHistoryList"></div></div>';

  return h;
}

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
    if(!S.mcq.history.length){list.innerHTML='<div class="empty-state" style="padding:30px"><div class="empty-ic" style="font-size:32px">📥</div><div class="empty-t">No sessions yet</div><div class="empty-tx">Complete a practice session to see your history</div></div>';return;}
    var hh='';
    S.mcq.history.slice().reverse().forEach(function(s3){
      var co=s3.score>=70?'var(--ok)':s3.score>=50?'var(--wn)':'var(--no)';
      hh+='<div class="card" style="margin-bottom:10px"><div class="card-body" style="padding:14px 18px;display:flex;align-items:center;gap:14px">';
      hh+='<div style="width:38px;height:38px;border-radius:50%;background:'+co+'18;display:flex;align-items:center;justify-content:center;font-size:16px">📝</div>';
      hh+='<div style="flex:1"><div style="font-weight:600;font-size:14px">'+s3.mode.charAt(0).toUpperCase()+s3.mode.slice(1)+' Mode • '+s3.correct+'/'+s3.total+'</div><div style="font-size:12px;color:var(--tx3)">'+fmtDate(s3.ts)+' • '+fmtTime(s3.duration)+'</div></div>';
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

/* ---- MCQ Session Render ---- */
/*
  Mode behaviours:
  - topic:  Click option → instant reveal (correct/wrong + explanation). Next → next Q.
  - exam:   Click option → select only (no feedback). Next → next Q. Review at end.
  - quiz:   Same as exam but timed.
*/
function revealTopicAnswer(c,ses,chosenIdx){
  var q=ses.questions[ses.idx];var letters=['A','B','C','D'];
  ses.answers[ses.idx]=chosenIdx;ses.revealed[ses.idx]=true;
  var isCorrect=chosenIdx===q.ans;
  c.querySelectorAll('.mcq-opt').forEach(function(o,i){
    o.classList.remove('sel');o.classList.add('dis');
    if(i===q.ans)o.classList.add('c-ok');
    else if(i===chosenIdx&&!isCorrect)o.classList.add('c-wrong');
  });
  /* inject explanation */
  var optsDiv=c.querySelector('.mcq-opts');
  if(optsDiv){
    var expDiv=document.createElement('div');expDiv.className='ans-sec';
    var ico=isCorrect?'✓':'✗';
    var col=isCorrect?'var(--ok)':'var(--no)';
    var lbl=isCorrect?'Correct!':'Incorrect — Answer: '+letters[q.ans];
    expDiv.innerHTML='<div style="font-weight:700;color:'+col+';margin-bottom:6px;display:flex;align-items:center;gap:6px;font-size:13px"><span style="font-size:16px">'+ico+'</span>'+lbl+'</div><div style="font-size:13px;line-height:1.6">'+esc(q.exp)+'</div>';
    optsDiv.parentNode.insertBefore(expDiv,optsDiv.nextSibling);
  }
}

function renderMcqSession(c){
  var ses=S.mcq.ses;if(!ses)return;
  var q=ses.questions[ses.idx];var letters=['A','B','C','D'];
  var isTopic=ses.mode==='topic';
  var pct=Math.round((ses.idx+1)/ses.questions.length*100);
  var h='<div class="quiz-ctr page-sec active">';
  /* progress bar */
  h+='<div class="quiz-prog"><span class="quiz-prog-tx">Q'+(ses.idx+1)+'/'+ses.questions.length+'</span><div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:'+pct+'%"></div></div></div>';
  /* timer */
  if(ses.timeLimit>0){var rem=ses.timeLimit-ses.elapsed;h+='<div class="timer-box"><div class="timer-disp'+(rem<30?' crit':rem<60?' warn':'')+'" id="mcqTimerDisp">'+fmtTime(Math.max(0,rem))+'</div></div>';}
  else{h+='<div class="timer-box"><div class="timer-disp" id="mcqTimerDisp">'+fmtTime(ses.elapsed)+'</div></div>';}
  /* mode label */
  var modeLbl=isTopic?'Topic Practice':ses.mode==='exam'?'Exam Mode':'Quiz Mode';
  var modeEm=isTopic?'🎯':ses.mode==='exam'?'📄':'⏱️';
  var tp=topicById(q.topic);
  h+='<div class="card" style="margin-bottom:16px"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:q.topic)+'</span><span class="badge" style="background:var(--bg2);color:var(--tx2)"><span style="margin-right:4px">'+modeEm+'</span>'+modeLbl+'</span></div>';
  h+='<p style="font-size:15px;font-weight:600;line-height:1.6;margin-bottom:16px">'+esc(q.q)+'</p>';
  h+='<div class="mcq-opts">';
  for(var i=0;i<q.opts.length;i++){
    var cls='mcq-opt';
    if(isTopic&&ses.revealed[ses.idx]){
      cls+=' dis';
      if(i===q.ans)cls+=' c-ok';
      else if(i===ses.answers[ses.idx]&&i!==q.ans)cls+=' c-wrong';
    }else if(ses.answers[ses.idx]===i){cls+=' sel';}
    h+='<div class="'+cls+'" data-oi="'+i+'"><div class="opt-let">'+letters[i]+'</div><div class="opt-tx">'+esc(q.opts[i])+'</div></div>';
  }
  h+='</div>';
  /* show explanation only for topic mode after reveal */
  if(isTopic&&ses.revealed[ses.idx]){
    var wasCorrect=ses.answers[ses.idx]===q.ans;
    var ico2=wasCorrect?'✓':'✗';
    var col2=wasCorrect?'var(--ok)':'var(--no)';
    var lbl2=wasCorrect?'Correct!':'Incorrect — Answer: '+letters[q.ans];
    h+='<div class="ans-sec"><div style="font-weight:700;color:'+col2+';margin-bottom:6px;display:flex;align-items:center;gap:6px;font-size:13px"><span style="font-size:16px">'+ico2+'</span>'+lbl2+'</div><div style="font-size:13px;line-height:1.6">'+esc(q.exp)+'</div></div>';
  }
  h+='</div></div>';
  /* action buttons */
  h+='<div class="quiz-acts">';
  h+='<button class="btn btn-s" '+(ses.idx===0?'disabled':'')+' id="mcqPrev"><span style="margin-right:4px">←</span> Prev</button>';
  h+='<div style="display:flex;gap:8px">';
  if(ses.idx<ses.questions.length-1){h+='<button class="btn btn-p" id="mcqNext">Next <span style="margin-left:4px">→</span></button>';}
  else{h+='<button class="btn btn-ok" id="mcqFinish"><span style="margin-right:4px">✓</span>Finish</button>';}
  h+='</div></div></div>';
  c.innerHTML=h;

  /* ---- Wire events per mode ---- */

  if(isTopic){
    /* TOPIC MODE: click option → instant reveal */
    c.querySelectorAll('.mcq-opt:not(.dis)').forEach(function(el){
      el.onclick=function(){
        var idx=parseInt(el.dataset.oi,10);
        revealTopicAnswer(c,ses,idx);
      };
    });
  }else{
    /* EXAM / QUIZ MODE: click option → select only, no feedback */
    c.querySelectorAll('.mcq-opt').forEach(function(el){
      el.onclick=function(){
        ses.answers[ses.idx]=parseInt(el.dataset.oi,10);
        c.querySelectorAll('.mcq-opt').forEach(function(o){o.classList.remove('sel');});
        el.classList.add('sel');
      };
    });
  }

  var prevBtn=document.getElementById('mcqPrev');
  if(prevBtn)prevBtn.onclick=function(){ses.idx--;renderMcqSession(c);};

  var nextBtn=document.getElementById('mcqNext');
  if(nextBtn)nextBtn.onclick=function(){ses.idx++;renderMcqSession(c);};

  var finBtn=document.getElementById('mcqFinish');
  if(finBtn)finBtn.onclick=function(){finishMcq();};
}

/* ---- MCQ Finish ---- */
function finishMcq(){
  if(mcqTimer)clearInterval(mcqTimer);
  var ses=S.mcq.ses;if(!ses)return;
  var correct=0;var topicCounts={};
  for(var i=0;i<ses.questions.length;i++){
    var q=ses.questions[i];var isCorrect=ses.answers[i]===q.ans;
    if(isCorrect)correct++;
    if(!topicCounts[q.topic])topicCounts[q.topic]={correct:0,attempted:0};
    topicCounts[q.topic].attempted++;
    if(isCorrect)topicCounts[q.topic].correct++;
  }
  var score=Math.round(correct/ses.questions.length*100);
  var dur=ses.elapsed;
  // Update stats
  Object.keys(topicCounts).forEach(function(tid){
    if(!S.stats.topics[tid])S.stats.topics[tid]={correct:0,attempted:0};
    S.stats.topics[tid].correct+=topicCounts[tid].correct;
    S.stats.topics[tid].attempted+=topicCounts[tid].attempted;
  });
  recordActivity('mcq',score,dur,Object.keys(topicCounts).join(','));
  S.mcq.history.push({mode:ses.mode,score:score,correct:correct,total:ses.questions.length,duration:dur,ts:Date.now(),topicCounts:topicCounts});
  renderMcqResults(document.getElementById('content'),ses,correct,score,dur);
  S.mcq.ses=null;
}

function renderMcqResults(c,ses,correct,score,dur){
  var wrong=ses.questions.length-correct;var letters=['A','B','C','D'];
  var h='<div class="quiz-ctr page-sec active">';
  h+='<div class="res-sum"><div class="res-score">'+score+'%</div><div class="res-lbl">'+correct+' of '+ses.questions.length+' correct</div>';
  h+='<div class="res-bd"><div class="bd-item"><div class="bd-val">'+correct+'</div><div class="bd-lbl">Correct</div></div><div class="bd-item"><div class="bd-val">'+wrong+'</div><div class="bd-lbl">Wrong</div></div><div class="bd-item"><div class="bd-val">'+fmtTime(dur)+'</div><div class="bd-lbl">Time</div></div></div></div>';
  h+='<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap"><button class="btn btn-p" id="newSesBtn"><span style="margin-right:4px">🔄</span>New Session</button><button class="btn btn-s" onclick="switchView(\'practice\')"><span style="margin-right:4px">←</span>Back to Practice</button><button class="btn btn-s" onclick="switchView(\'dashboard\')"><span style="margin-right:4px">🏠</span>Dashboard</button>';
  if(wrong>0)h+='<button class="btn btn-s" id="retryWrong"><span style="margin-right:4px">🔁</span>Retry Wrong ('+wrong+')</button>';
  h+='</div>';
  h+='<div class="card"><div class="card-hdr"><div class="card-t"><span style="margin-right:4px">📋</span>Review</div></div><div class="card-body">';
  for(var i=0;i<ses.questions.length;i++){
    var q2=ses.questions[i];var isC=ses.answers[i]===q2.ans;
    h+='<div style="padding:14px 0;border-bottom:1px solid var(--bd)">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-weight:700;font-size:13px;color:'+(isC?'var(--ok)':'var(--no)');'><span style="margin-right:4px">'+(isC?'✓':'✗')+'</span>Q'+(i+1)+'</span><span class="badge badge-p" style="font-size:11px">'+(topicById(q2.topic)?topicById(q2.topic).name:q2.topic)+'</span></div>';
    h+='<p style="font-size:13px;margin-bottom:6px">'+esc(q2.q)+'</p>';
    if(!isC&&ses.answers[i]>=0)h+='<div style="font-size:12px;color:var(--no);margin-bottom:4px">Your answer: '+letters[ses.answers[i]]+'. '+esc(q2.opts[ses.answers[i]])+'</div>';
    h+='<div style="font-size:12px;color:var(--ok)">Correct: '+letters[q2.ans]+'. '+esc(q2.opts[q2.ans])+'</div>';
    h+='<div style="font-size:12px;color:var(--tx3);margin-top:4px">'+esc(q2.exp)+'</div></div>';
  }
  h+='</div></div></div>';
  c.innerHTML=h;
  /* New Session — restart with same config */
  var newSesBtn=document.getElementById('newSesBtn');
  if(newSesBtn)newSesBtn.onclick=function(){
    var cfg=S.mcq.lastCfg;
    if(cfg){startMcqSession(cfg.mode,cfg.topics,cfg.count,cfg.timeLimit);}
    else{switchView('practice');}
  };
  /* Retry Wrong */
  var retryBtn=document.getElementById('retryWrong');
  if(retryBtn)retryBtn.onclick=function(){
    var wrongQs=[];
    for(var j=0;j<ses.questions.length;j++){if(ses.answers[j]!==ses.questions[j].ans)wrongQs.push(ses.questions[j]);}
    if(!wrongQs.length)return;
    S.mcq.ses={mode:'topic',questions:shuffle(wrongQs),idx:0,answers:new Array(wrongQs.length).fill(-1),revealed:new Array(wrongQs.length).fill(false),elapsed:0,timeLimit:0,startTime:Date.now()};
    S.mcq.lastCfg={mode:'topic',topics:wrongQs.map(function(q){return q.topic;}),count:wrongQs.length,timeLimit:0};
    startMcqTimer();c.innerHTML='';renderMcqSession(c);
  };
}

/* ---- Long Questions Bank ---- */
var LQ_BANK=[
{id:'lq1',topic:'micro-3',title:'Demand & Supply Analysis',marks:12,difficulty:'Medium',parts:[
  {label:'(a)',text:'Explain the law of demand and illustrate with a demand curve diagram.',marks:4,hint:'Define law, draw diagram with labels, explain inverse relationship.'},
  {label:'(b)',text:'Using a supply and demand diagram, explain the effect of an increase in production costs on equilibrium price and quantity.',marks:4,hint:'Shift supply left, show new equilibrium, explain price rises & qty falls.'},
  {label:'(c)',text:'Discuss whether government intervention through a price ceiling is desirable when rents are rising.',marks:4,hint:'Define price ceiling, draw diagram showing shortage, discuss pros/cons.'}
]},
{id:'lq2',topic:'micro-5',title:'Market Failure & Externalities',marks:16,difficulty:'Hard',parts:[
  {label:'(a)',text:'Define negative externality and give one example relevant to Hong Kong.',marks:3,hint:'Social cost > private cost. Example: traffic congestion / pollution.'},
  {label:'(b)',text:'With the aid of a diagram, explain why a negative externality leads to market failure.',marks:5,hint:'Draw MSC above MPC, show overproduction at market equilibrium, deadweight loss.'},
  {label:'(c)',text:'Evaluate the effectiveness of a Pigouvian tax in correcting this market failure.',marks:4,hint:'Tax shifts MPC to MSC, discuss merits (efficient) and limitations (info problems).'},
  {label:'(d)',text:'Suggest and explain one alternative government measure to address the externality.',marks:4,hint:'Regulation / tradeable permits / subsidies for cleaner alternatives.'}
]},
{id:'lq3',topic:'macro-2',title:'National Income & Multiplier',marks:12,difficulty:'Medium',parts:[
  {label:'(a)',text:'Define the multiplier and explain how it works using the circular flow model.',marks:4,hint:'Multiplier = 1/(1-MPC). Injection → successive rounds of spending.'},
  {label:'(b)',text:'If MPC is 0.75 and the government increases spending by $200 million, calculate the total increase in national income. Show your working.',marks:4,hint:'k = 1/(1-0.75) = 4. ΔY = 4 × $200m = $800m.'},
  {label:'(c)',text:'Discuss the limitations of the multiplier effect in the real world.',marks:4,hint:'Leakages (savings, taxes, imports), time lags, crowding out, inflation.'}
]},
{id:'lq4',topic:'macro-4',title:'Inflation & Unemployment',marks:16,difficulty:'Hard',parts:[
  {label:'(a)',text:'Distinguish between demand-pull inflation and cost-push inflation.',marks:4,hint:'Demand-pull: AD rises. Cost-push: AS falls. Different causes & policy responses.'},
  {label:'(b)',text:'Using an AD-AS diagram, explain the effects of demand-pull inflation on price level and real output.',marks:4,hint:'AD shifts right along upward-sloping SRAS. Price rises, output rises initially.'},
  {label:'(c)',text:'Explain the concept of stagflation and why it is difficult for the government to address.',marks:4,hint:'High inflation + high unemployment. Expansionary policy worsens inflation; contractionary worsens unemployment.'},
  {label:'(d)',text:'Evaluate one fiscal and one monetary policy measure to combat demand-pull inflation in Hong Kong.',marks:4,hint:'Fiscal: reduce G or raise taxes. Monetary: HK has limited monetary independence due to linked exchange rate.'}
]},
{id:'lq5',topic:'macro-5',title:'International Trade & HK Economy',marks:12,difficulty:'Medium',parts:[
  {label:'(a)',text:'Explain the principle of comparative advantage and how it leads to gains from trade.',marks:4,hint:'Country specialises in good with lower opportunity cost. Both gain via trade.'},
  {label:'(b)',text:'Discuss two benefits and two costs of free trade for Hong Kong.',marks:4,hint:'Benefits: efficiency, consumer choice. Costs: structural unemployment, dependence.'},
  {label:'(c)',text:'Explain how the linked exchange rate system affects Hong Kong\'s monetary policy autonomy.',marks:4,hint:'Pegged to USD → cannot set independent interest rates → imports US monetary conditions.'}
]},
{id:'lq6',topic:'micro-4',title:'Market Structures',marks:12,difficulty:'Medium',parts:[
  {label:'(a)',text:'Compare the characteristics of perfect competition and monopoly.',marks:4,hint:'Number of firms, product type, barriers, price-taking vs price-making.'},
  {label:'(b)',text:'Using a diagram, explain why a monopolist may earn supernormal profits in the long run.',marks:4,hint:'AR > AC at profit-maximising output (MC=MR). Barriers prevent entry.'},
  {label:'(c)',text:'Discuss whether monopoly is always harmful to society.',marks:4,hint:'Harms: higher P, lower Q, DWL. Benefits: economies of scale, innovation, natural monopoly.'}
]},
{id:'lq7',topic:'macro-3',title:'Money & Banking',marks:12,difficulty:'Medium',parts:[
  {label:'(a)',text:'Explain three functions of money.',marks:3,hint:'Medium of exchange, store of value, unit of account.'},
  {label:'(b)',text:'Explain the process of credit creation by commercial banks with a reserve ratio of 10%.',marks:5,hint:'Initial deposit → loans → redeposit cycle. Credit multiplier = 1/r = 10.'},
  {label:'(c)',text:'Discuss how the HKMA maintains the stability of the linked exchange rate system.',marks:4,hint:'Convertibility undertaking, buying/selling USD, adjusting aggregate balance.'}
]},
{id:'lq8',topic:'micro-2',title:'Costs & Production',marks:12,difficulty:'Medium',parts:[
  {label:'(a)',text:'Distinguish between fixed costs and variable costs, giving examples for a bakery.',marks:3,hint:'FC: rent, equipment. VC: flour, labour. FC constant, VC changes with output.'},
  {label:'(b)',text:'Draw and explain the relationship between MC, ATC, and AVC curves.',marks:5,hint:'MC cuts ATC & AVC at minimums. When MC < ATC, ATC falls; when MC > ATC, ATC rises.'},
  {label:'(c)',text:'Explain the concept of economies of scale and give two examples.',marks:4,hint:'Falling LRAC as output rises. Technical (larger machines), financial (cheaper borrowing).'}
]}
];

/* ---- Long Question Graph Tool ---- */
var GraphTool={
  canvas:null,ctx:null,mode:'pen',color:'#2563eb',lineW:2,drawing:false,paths:[],undone:[],lastPt:null,
  init:function(canvasEl){
    this.canvas=canvasEl;this.ctx=canvasEl.getContext('2d');this.paths=[];this.undone=[];this.drawing=false;this.lastPt=null;
    var dpr=window.devicePixelRatio||1;var rect=canvasEl.getBoundingClientRect();
    canvasEl.width=rect.width*dpr;canvasEl.height=rect.height*dpr;
    this.ctx.scale(dpr,dpr);this.ctx.lineCap='round';this.ctx.lineJoin='round';
    this.drawGrid();
    var self=this;
    function getPos(e){var r=canvasEl.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
    canvasEl.onmousedown=canvasEl.ontouchstart=function(e){e.preventDefault();self.drawing=true;self.lastPt=getPos(e);self.undone=[];self.paths.push({pts:[self.lastPt],color:self.color,width:self.lineW,mode:self.mode});};
    canvasEl.onmousemove=canvasEl.ontouchmove=function(e){if(!self.drawing)return;e.preventDefault();var p=getPos(e);var cur=self.paths[self.paths.length-1];cur.pts.push(p);self.redraw();self.lastPt=p;};
    canvasEl.onmouseup=canvasEl.ontouchend=canvasEl.onmouseleave=function(){self.drawing=false;self.lastPt=null;};
  },
  drawGrid:function(){
    var c=this.ctx;var w=this.canvas.width/(window.devicePixelRatio||1);var h2=this.canvas.height/(window.devicePixelRatio||1);
    c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--bg1').trim()||'#fff';c.fillRect(0,0,w,h2);
    c.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--bd').trim()||'#e2e8f0';c.lineWidth=0.5;
    for(var x=0;x<=w;x+=20){c.beginPath();c.moveTo(x,0);c.lineTo(x,h2);c.stroke();}
    for(var y=0;y<=h2;y+=20){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  },
  redraw:function(){
    this.drawGrid();var c=this.ctx;
    for(var i=0;i<this.paths.length;i++){
      var p=this.paths[i];if(p.pts.length<2)continue;
      c.strokeStyle=p.mode==='eraser'?(getComputedStyle(document.documentElement).getPropertyValue('--bg1').trim()||'#fff'):p.color;
      c.lineWidth=p.mode==='eraser'?16:p.width;
      c.beginPath();c.moveTo(p.pts[0].x,p.pts[0].y);
      for(var j=1;j<p.pts.length;j++)c.lineTo(p.pts[j].x,p.pts[j].y);
      c.stroke();
    }
  },
  undo:function(){if(this.paths.length){this.undone.push(this.paths.pop());this.redraw();}},
  redo:function(){if(this.undone.length){this.paths.push(this.undone.pop());this.redraw();}},
  clear:function(){this.paths=[];this.undone=[];this.redraw();},
  toDataURL:function(){return this.canvas.toDataURL('image/png');}
};

/* ---- Long Questions Landing (HTML generator) ---- */
function renderLqLanding(){
  var h='';
  /* Sub-tabs: Bank / History */
  h+='<div class="tab-bar" id="lqTabs"><button class="tab-btn active" data-tab="bank">Question Bank</button><button class="tab-btn" data-tab="history">Past Sessions</button></div>';
  h+='<div id="lqTabBank">';
  h+='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">';
  h+='<div style="flex:1;min-width:180px"><input class="form-inp" id="lqSearch" placeholder="Search questions..." style="font-size:16px"></div>';
  h+='<select class="form-sel" id="lqTopicFilter" style="width:auto;min-width:140px"><option value="">All Topics</option>';
  TOPICS.forEach(function(t){h+='<option value="'+t.id+'">'+t.name+'</option>';});
  h+='</select>';
  h+='<select class="form-sel" id="lqDiffFilter" style="width:auto;min-width:120px"><option value="">All Levels</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select>';
  h+='</div>';
  h+='<div class="bank-grid" id="lqBankGrid"></div>';
  h+='</div>';
  h+='<div id="lqTabHistory" style="display:none"><div id="lqHistoryList"></div></div>';
  return h;
}

/* Wire Long Q landing events */
function wireLqLanding(c){
  var lqTabBtns=c.querySelectorAll('#lqTabs .tab-btn');
  if(!lqTabBtns.length)return;
  lqTabBtns.forEach(function(btn){
    btn.onclick=function(){
      c.querySelectorAll('#lqTabs .tab-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      var tab=btn.dataset.tab;
      document.getElementById('lqTabBank').style.display=tab==='bank'?'':'none';
      document.getElementById('lqTabHistory').style.display=tab==='history'?'':'none';
      if(tab==='history')lqRenderHistory();
    };
  });
  function lqRenderBank(){
    var searchEl=document.getElementById('lqSearch');if(!searchEl)return;
    var search=(searchEl.value||'').toLowerCase();
    var topicF=document.getElementById('lqTopicFilter').value;
    var diffF=document.getElementById('lqDiffFilter').value;
    var filtered=LQ_BANK.filter(function(q){
      if(topicF&&q.topic!==topicF)return false;
      if(diffF&&q.difficulty!==diffF)return false;
      if(search&&q.title.toLowerCase().indexOf(search)<0&&q.parts.map(function(p){return p.text;}).join(' ').toLowerCase().indexOf(search)<0)return false;
      return true;
    });
    var grid=document.getElementById('lqBankGrid');if(!grid)return;
    if(!filtered.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:30px"><div class="empty-ic" style="font-size:32px">🔍</div><div class="empty-t">No questions found</div><div class="empty-tx">Try adjusting your filters</div></div>';return;}
    var gh='';
    filtered.forEach(function(q){
      var tp=topicById(q.topic);
      var dcol=q.difficulty==='Hard'?'var(--no)':'var(--wn)';
      gh+='<div class="card" style="cursor:pointer;transition:all .2s" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'var(--shl)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'var(--sh)\'" data-lqid="'+q.id+'">';
      gh+='<div class="card-body">';
      gh+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:'')+'</span><span class="badge" style="background:'+dcol+'18;color:'+dcol+'">'+q.difficulty+'</span><span class="badge" style="background:var(--ac)18;color:var(--ac)">'+q.marks+' marks</span></div>';
      gh+='<div style="font-weight:700;font-size:14px;margin-bottom:8px">'+esc(q.title)+'</div>';
      gh+='<div style="font-size:12px;color:var(--tx3);margin-bottom:10px">'+q.parts.length+' parts</div>';
      gh+='<button class="btn btn-p btn-sm" style="width:100%"><span style="margin-right:4px">▶️</span>Start Practice</button>';
      gh+='</div></div>';
    });
    grid.innerHTML=gh;
    grid.querySelectorAll('[data-lqid]').forEach(function(el){
      el.querySelector('.btn').onclick=function(e){e.stopPropagation();startLongQ(el.dataset.lqid);};
      el.onclick=function(){previewLongQ(el.dataset.lqid);};
    });
  }
  lqRenderBank();
  var sEl=document.getElementById('lqSearch');if(sEl)sEl.oninput=lqRenderBank;
  var tfEl=document.getElementById('lqTopicFilter');if(tfEl)tfEl.onchange=lqRenderBank;
  var dfEl=document.getElementById('lqDiffFilter');if(dfEl)dfEl.onchange=lqRenderBank;

  function lqRenderHistory(){
    var list=document.getElementById('lqHistoryList');if(!list)return;
    if(!S.longQ.history.length){list.innerHTML='<div class="empty-state" style="padding:30px"><div class="empty-ic" style="font-size:32px">📥</div><div class="empty-t">No sessions yet</div><div class="empty-tx">Start a long question practice!</div></div>';return;}
    var hh='';
    S.longQ.history.slice().reverse().forEach(function(s5){
      hh+='<div class="card" style="margin-bottom:10px"><div class="card-body" style="padding:14px 18px;display:flex;align-items:center;gap:14px">';
      hh+='<div style="width:38px;height:38px;border-radius:50%;background:var(--ac)18;display:flex;align-items:center;justify-content:center;font-size:16px">✏️</div>';
      hh+='<div style="flex:1"><div style="font-weight:600;font-size:14px">'+esc(s5.title)+'</div><div style="font-size:12px;color:var(--tx3)">'+fmtDate(s5.ts)+' • '+fmtTime(s5.duration)+' • '+s5.partsCompleted+'/'+s5.partsTotal+' parts</div></div>';
      if(s5.feedbackReceived)hh+='<span class="badge badge-ok"><span style="margin-right:4px">✓</span>Feedback</span>';
      hh+='</div></div>';
    });
    list.innerHTML=hh;
  }
}

/* ---- Long Question Preview ---- */
function previewLongQ(qId){
  var q=null;for(var i=0;i<LQ_BANK.length;i++){if(LQ_BANK[i].id===qId){q=LQ_BANK[i];break;}}
  if(!q)return;var tp=topicById(q.topic);
  var h='<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><h3 style="font-weight:700;flex:1">'+esc(q.title)+'</h3><button class="btn btn-ghost" onclick="Modal.hide()"><span style="font-size:18px">✕</span></button></div>';
  h+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:'')+'</span><span class="badge badge-w">'+q.difficulty+'</span><span class="badge" style="background:var(--ac)18;color:var(--ac)">'+q.marks+' marks</span></div>';
  q.parts.forEach(function(p){
    h+='<div style="padding:12px 0;border-bottom:1px solid var(--bd)"><div style="display:flex;gap:8px;align-items:baseline"><span style="font-weight:700;color:var(--pr)">'+p.label+'</span><span style="font-size:14px;line-height:1.6">'+esc(p.text)+'</span></div><div style="font-size:12px;color:var(--tx3);margin-top:4px">'+p.marks+' marks</div></div>';
  });
  h+='<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px"><button class="btn btn-s" onclick="Modal.hide()">Close</button><button class="btn btn-p" onclick="Modal.hide();startLongQ(\''+q.id+'\')"><span style="margin-right:4px">▶️</span>Start Practice</button></div>';
  Modal.show(h);
}

/* ---- Start Long Q Session ---- */
function startLongQ(qId){
  var q=null;for(var i=0;i<LQ_BANK.length;i++){if(LQ_BANK[i].id===qId){q=LQ_BANK[i];break;}}
  if(!q)return;
  S.longQ.ses={
    question:q,partIdx:0,startTime:Date.now(),elapsed:0,
    answers:q.parts.map(function(){return '';}),
    graphs:q.parts.map(function(){return null;}),
    feedback:null,submitted:false
  };
  lqTimer=setInterval(function(){
    if(!S.longQ.ses)return;S.longQ.ses.elapsed++;
    var el=document.getElementById('lqTimerDisp');if(el)el.textContent=fmtTime(S.longQ.ses.elapsed);
  },1000);
  var c=document.getElementById('content');c.innerHTML='';renderLongQSession(c);
}
var lqTimer=null;

/* ---- Render Long Q Session ---- */
function renderLongQSession(c){
  var ses=S.longQ.ses;if(!ses)return;
  var q=ses.question;var pidx=ses.partIdx;var part=q.parts[pidx];var tp=topicById(q.topic);
  var pct=Math.round((pidx+1)/q.parts.length*100);

  var h='<div class="quiz-ctr page-sec active">';
  /* Progress */
  h+='<div class="quiz-prog"><span class="quiz-prog-tx">Part '+(pidx+1)+'/'+q.parts.length+'</span><div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:'+pct+'%"></div></div><span class="quiz-prog-tx" id="lqTimerDisp">'+fmtTime(ses.elapsed)+'</span></div>';

  /* Question header */
  h+='<div class="card" style="margin-bottom:16px"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:'')+'</span><span style="font-weight:700;font-size:15px">'+esc(q.title)+'</span></div>';
  h+='<div style="display:flex;gap:8px;align-items:baseline;margin-bottom:8px"><span style="font-weight:800;color:var(--pr);font-size:16px">'+part.label+'</span><span style="font-size:15px;line-height:1.6">'+esc(part.text)+'</span></div>';
  h+='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="badge" style="background:var(--ac)18;color:var(--ac)">'+part.marks+' marks</span>';
  h+='<button class="btn btn-ghost btn-sm" id="lqHintBtn"><span style="margin-right:4px">💡</span>Show Hint</button>';
  h+='</div>';
  h+='<div id="lqHintBox" style="display:none;margin-top:10px;padding:12px;background:rgba(245,158,11,.08);border-radius:8px;border-left:3px solid var(--wn);font-size:13px;color:var(--tx2)"></div>';
  h+='</div></div>';

  /* Tabbed answer/diagram area */
  var activeAnsTab=ses._activeTab||'write';
  h+='<div class="card" style="margin-bottom:0">';
  h+='<div class="tab-bar" id="lqAnsTabs" style="padding:0 16px;border-bottom:1px solid var(--bd)">';
  h+='<button class="tab-btn '+(activeAnsTab==='write'?'active':'')+'" data-anstab="write"><span style="margin-right:6px">✏️</span>Written Answer</button>';
  h+='<button class="tab-btn '+(activeAnsTab==='diagram'?'active':'')+'" data-anstab="diagram"><span style="margin-right:6px">📊</span>Diagram</button>';
  h+='</div>';

  /* Written answer pane */
  h+='<div id="lqWritePane" style="display:'+(activeAnsTab==='write'?'block':'none')+'">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px 0"><div style="font-size:12px;color:var(--tx3)" id="lqWordCount">0 words</div></div>';
  h+='<div class="rich-bar" id="lqRichBar">';
  [{em:'✍️',cmd:'bold'},{em:'🔤',cmd:'italic'},{em:'__',cmd:'underline'},{em:'•',cmd:'insertUnorderedList'},{em:'1.',cmd:'insertOrderedList'},{em:'ₓ',cmd:'subscript'},{em:'ˣ',cmd:'superscript'}].forEach(function(b){
    h+='<button data-cmd="'+b.cmd+'" title="'+b.cmd+'"><span style="margin-right:2px">'+b.em+'</span></button>';
  });
  h+='</div>';
  h+='<div contenteditable="true" class="form-inp rich-ta" id="lqEditor" style="min-height:320px;max-height:500px;overflow-y:auto;line-height:1.7;font-size:15px;white-space:pre-wrap;margin:0 16px 16px;border-radius:8px">'+ses.answers[pidx]+'</div>';
  h+='</div>';

  /* Diagram pane */
  h+='<div id="lqDiagramPane" style="display:'+(activeAnsTab==='diagram'?'block':'none')+';padding:16px">';
  h+='<canvas id="lqCanvas" style="width:100%;height:360px;border-radius:8px;border:1px solid var(--bd)"></canvas>';
  h+='<div class="graph-tools" style="margin-top:10px">';
  h+='<button class="lqg-btn" data-tool="pen" style="background:rgba(37,99,235,.1);color:var(--pr);border-color:var(--pr)"><span style="margin-right:4px">✏️</span>Pen</button>';
  h+='<button class="lqg-btn" data-tool="eraser"><span style="margin-right:4px">🗑️</span>Eraser</button>';
  h+='<button class="lqg-btn" data-tool="text"><span style="margin-right:4px">🅰️</span>Label</button>';
  h+='<input type="color" value="#2563eb" id="lqGraphColor" style="width:32px;height:28px;border:none;cursor:pointer;border-radius:4px">';
  h+='<select id="lqGraphWidth" style="padding:4px 8px;border:1px solid var(--bd);border-radius:6px;font-size:12px;background:var(--bg1);color:var(--tx1)"><option value="2">Thin</option><option value="4">Medium</option><option value="6">Thick</option></select>';
  h+='<span style="flex:1"></span>';
  h+='<button class="lqg-btn" data-tool="undo"><span style="margin-right:4px">↶</span>Undo</button>';
  h+='<button class="lqg-btn" data-tool="redo"><span style="margin-right:4px">↷</span>Redo</button>';
  h+='<button class="lqg-btn" data-tool="clear"><span style="margin-right:4px">🗑️</span>Clear</button>';
  h+='</div>';
  h+='</div>';

  h+='</div>'; /* end card */

  /* Navigation */
  h+='<div class="quiz-acts" style="margin-top:16px">';
  h+='<button class="btn btn-s" '+(pidx===0?'disabled':'')+' id="lqPrev"><span style="margin-right:4px">←</span>Previous</button>';
  h+='<div style="display:flex;gap:8px">';
  if(pidx<q.parts.length-1){h+='<button class="btn btn-p" id="lqNext">Next Part<span style="margin-left:4px">→</span></button>';}
  else{h+='<button class="btn btn-ok" id="lqSubmit"><span style="margin-right:4px">✈️</span>Submit for Feedback</button>';}
  h+='</div></div>';

  /* Feedback area */
  if(ses.feedback){
    h+='<div class="card" style="margin-top:16px"><div class="card-hdr"><div class="card-t"><span style="margin-right:4px">🤖</span>AI Feedback</div></div><div class="card-body md-content" id="lqFeedbackContent">'+renderMd(ses.feedback)+'</div></div>';
  }
  h+='</div>';
  c.innerHTML=h;

  /* Wire answer/diagram tab switching */
  var graphInited=activeAnsTab==='diagram';
  c.querySelectorAll('#lqAnsTabs .tab-btn').forEach(function(btn){
    btn.onclick=function(){
      c.querySelectorAll('#lqAnsTabs .tab-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      var tab=btn.dataset.anstab;
      ses._activeTab=tab;
      document.getElementById('lqWritePane').style.display=tab==='write'?'block':'none';
      document.getElementById('lqDiagramPane').style.display=tab==='diagram'?'block':'none';
      if(tab==='diagram'&&!graphInited){
        graphInited=true;
        var cv=document.getElementById('lqCanvas');
        GraphTool.init(cv);
        if(ses.graphs[pidx]){
          var im=new Image();im.onload=function(){GraphTool.drawGrid();GraphTool.ctx.drawImage(im,0,0,cv.width/(window.devicePixelRatio||1),cv.height/(window.devicePixelRatio||1));};im.src=ses.graphs[pidx];
        }
      }
    };
  });

  /* Wire editor */
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
    if(box.style.display==='none'){box.style.display='block';box.textContent=part.hint;this.innerHTML='<span style="margin-right:4px">💡</span>Hide Hint';}
    else{box.style.display='none';this.innerHTML='<span style="margin-right:4px">💡</span>Show Hint';}
  };

  /* Init graph only if diagram tab is already active */
  var canvas=document.getElementById('lqCanvas');
  if(activeAnsTab==='diagram'){
    graphInited=true;
    GraphTool.init(canvas);
    if(ses.graphs[pidx]){
      var img=new Image();img.onload=function(){
        GraphTool.drawGrid();
        GraphTool.ctx.drawImage(img,0,0,canvas.width/(window.devicePixelRatio||1),canvas.height/(window.devicePixelRatio||1));
      };img.src=ses.graphs[pidx];
    }
  }

  /* Graph tool buttons */
  document.querySelectorAll('.lqg-btn').forEach(function(btn){
    btn.onclick=function(){
      var tool=btn.dataset.tool;
      if(tool==='undo'){GraphTool.undo();return;}
      if(tool==='redo'){GraphTool.redo();return;}
      if(tool==='clear'){GraphTool.clear();return;}
      if(tool==='text'){
        var label=null;
        /* Simple text label modal */
        var mh='<h3 style="font-weight:700;margin-bottom:12px">Add Label</h3>';
        mh+='<input class="form-inp" id="graphLabelInp" placeholder="Enter text (e.g. P1, S1, D)" style="margin-bottom:14px">';
        mh+='<div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-s" onclick="Modal.hide()">Cancel</button><button class="btn btn-p" id="graphLabelOk">Add</button></div>';
        Modal.show(mh);
        document.getElementById('graphLabelInp').focus();
        document.getElementById('graphLabelOk').onclick=function(){
          label=document.getElementById('graphLabelInp').value;Modal.hide();
          if(label){
            var cFont='bold 14px Plus Jakarta Sans, sans-serif';GraphTool.ctx.font=cFont;GraphTool.ctx.fillStyle=GraphTool.color;
            /* Place in center - user can use pen to mark where */
            var cw2=canvas.width/(window.devicePixelRatio||1);var ch2=canvas.height/(window.devicePixelRatio||1);
            GraphTool.ctx.fillText(label,cw2/2,ch2/2);
            GraphTool.paths.push({pts:[{x:cw2/2,y:ch2/2}],color:GraphTool.color,width:1,mode:'text',label:label});
          }
        };
        return;
      }
      GraphTool.mode=tool;
      document.querySelectorAll('.lqg-btn').forEach(function(b){b.style.background='';b.style.color='';b.style.borderColor='';});
      btn.style.background='rgba(37,99,235,.1)';btn.style.color='var(--pr)';btn.style.borderColor='var(--pr)';
    };
  });
  document.getElementById('lqGraphColor').onchange=function(){GraphTool.color=this.value;};
  document.getElementById('lqGraphWidth').onchange=function(){GraphTool.lineW=parseInt(this.value,10);};

  /* Navigation */
  function saveCurrent(){ses.answers[pidx]=editor.innerHTML;if(graphInited)ses.graphs[pidx]=GraphTool.toDataURL();}
  var prevBtn=document.getElementById('lqPrev');if(prevBtn)prevBtn.onclick=function(){saveCurrent();ses.partIdx--;renderLongQSession(c);};
  var nextBtn=document.getElementById('lqNext');if(nextBtn)nextBtn.onclick=function(){saveCurrent();ses.partIdx++;renderLongQSession(c);};
  var subBtn=document.getElementById('lqSubmit');if(subBtn)subBtn.onclick=function(){saveCurrent();submitLongQ(c);};
}

/* ---- Submit Long Q for Feedback ---- */
function submitLongQ(c){
  var ses=S.longQ.ses;if(!ses)return;
  if(lqTimer)clearInterval(lqTimer);

  /* Check if any answers are empty */
  var emptyParts=[];
  for(var i=0;i<ses.question.parts.length;i++){
    var txt=(ses.answers[i]||'').replace(/<[^>]*>/g,'').trim();
    if(!txt)emptyParts.push(ses.question.parts[i].label);
  }
  if(emptyParts.length===ses.question.parts.length){
    toast('Please write at least one answer before submitting','err');
    lqTimer=setInterval(function(){if(!S.longQ.ses)return;S.longQ.ses.elapsed++;var el=document.getElementById('lqTimerDisp');if(el)el.textContent=fmtTime(S.longQ.ses.elapsed);},1000);
    return;
  }

  /* Build prompt for AI feedback */
  var prompt='You are an expert HKDSE Economics teacher. Grade and give detailed feedback on this student\'s answer.\n\n';
  prompt+='**Question: '+ses.question.title+'** ('+ses.question.marks+' marks total)\n\n';
  ses.question.parts.forEach(function(p,idx){
    var ans=(ses.answers[idx]||'').replace(/<[^>]*>/g,'').trim();
    prompt+=p.label+' '+p.text+' ['+p.marks+' marks]\n';
    prompt+='**Student\'s answer:** '+(ans||'(No answer provided)')+'\n\n';
  });
  prompt+='\nFor each part:\n1. Award marks out of the maximum\n2. State what was done well\n3. State what was missing or incorrect\n4. Provide a model answer\n\nEnd with overall marks, percentage, and key areas for improvement.\nFormat using Markdown.';

  ses.submitted=true;

  /* Show loading */
  document.getElementById('loadOv').style.display='flex';
  document.getElementById('loadTx').textContent='Getting AI Feedback...';
  document.getElementById('loadSub').textContent='Analyzing your answers';

  /* For now, show placeholder feedback */
  ses.feedback='AI Feedback is being developed. In the meantime, please review your answers against the model solutions in the Question Bank.';
  var completed=0;
  for(var j=0;j<ses.question.parts.length;j++){if((ses.answers[j]||'').replace(/<[^>]*>/g,'').trim())completed++;}
  S.longQ.history.push({
    title:ses.question.title,qId:ses.question.id,ts:Date.now(),
    duration:ses.elapsed,partsCompleted:completed,partsTotal:ses.question.parts.length,
    feedbackReceived:true,feedback:ses.feedback
  });
  recordActivity('long-q',0,ses.elapsed,ses.question.topic);
  document.getElementById('loadOv').style.display='none';
  renderLongQSession(c);
  toast('Session saved!','ok');
}

/* ---- AI Generation (placeholder) ---- */
Sections['ai-gen']=function(c){
  c.innerHTML='<div class="page-sec active"><div style="text-align:center;margin-bottom:28px"><h2 style="font-size:1.5rem;font-weight:800"><span style="margin-right:8px">🤖</span>AI Generation</h2><p style="color:var(--tx2);margin-top:4px">Generate custom questions with AI</p></div><div class="empty-state"><div class="empty-ic">🤖</div><div class="empty-t">AI Generation Module</div><div class="empty-tx">AI-powered question generation and tutoring coming in next update.</div></div></div>';
};

/* ---- Analytics ---- */
var anCharts={};
Sections.analytics=function(c){
  var st=S.stats;var tq=0,tc=0;
  Object.keys(st.topics).forEach(function(k){tq+=st.topics[k].attempted;tc+=st.topics[k].correct;});
  var acc=tq>0?Math.round(tc/tq*100):0;
  var allHist=S.mcq.history.concat(S.longQ.history||[]).sort(function(a,b){return(b.ts||0)-(a.ts||0);});
  var streak=0;if(allHist.length){var d=new Date();d.setHours(0,0,0,0);var check=true;while(check){var dt=d.getTime();var found=allHist.some(function(h2){var hd=new Date(h2.ts);hd.setHours(0,0,0,0);return hd.getTime()===dt;});if(found){streak++;d.setDate(d.getDate()-1);}else{check=false;}}}
  var h='<div class="page-sec active">';
  h+='<div style="text-align:center;margin-bottom:22px"><h2 style="font-size:1.5rem;font-weight:800"><span style="margin-right:8px">📊</span>Analytics</h2><p style="color:var(--tx2);margin-top:4px;font-size:14px">Track your study progress and performance</p></div>';
  /* tabs */
  h+='<div class="an-tabs"><button class="an-tab active" data-an="overview">Overview</button><button class="an-tab" data-an="topics">Topics</button><button class="an-tab" data-an="history">History</button><button class="an-tab" data-an="insights">Insights</button></div>';
  /* OVERVIEW pane */
  h+='<div class="an-pane active" id="anOverview">';
  h+='<div class="an-kpi-row">';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+st.sessions+'</div><div class="an-kpi-lbl"><span style="margin-right:4px">📖</span>Sessions</div></div>';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+tq+'</div><div class="an-kpi-lbl"><span style="margin-right:4px">📋</span>Questions</div></div>';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+acc+'%</div><div class="an-kpi-lbl"><span style="margin-right:4px">🎯</span>Accuracy</div></div>';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+streak+'</div><div class="an-kpi-lbl"><span style="margin-right:4px">🔥</span>Day Streak</div></div>';
  h+='</div>';
  /* Score Trend chart */
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><span style="margin-right:4px">📈</span>Score Trend</div><div class="an-canvas-box" style="height:220px"><canvas id="anTrendChart"></canvas></div></div>';
  /* Study Activity heatmap */
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><span style="margin-right:4px">🔥</span>Study Activity (Last 28 Days)</div><div style="display:flex;gap:4px;margin-bottom:6px;font-size:10px;color:var(--tx3)"><span style="flex:1">Mon</span><span style="flex:1">Tue</span><span style="flex:1">Wed</span><span style="flex:1">Thu</span><span style="flex:1">Fri</span><span style="flex:1">Sat</span><span style="flex:1">Sun</span></div><div class="an-streak-grid" id="anStreak"></div><div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;font-size:11px;color:var(--tx3)">Less <div class="an-streak-day" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l1" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l2" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l3" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l4" style="width:14px;height:14px;display:inline-block"></div> More</div></div>';
  /* Time studied */
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><span style="margin-right:4px">⏱️</span>Total Study Time</div><div style="text-align:center;padding:16px"><span style="font-size:38px;font-weight:800">'+fmtTime(st.time)+'</span><div style="font-size:13px;color:var(--tx3);margin-top:4px">minutes:seconds</div></div></div>';
  h+='</div>';
  /* TOPICS pane */
  h+='<div class="an-pane" id="anTopics">';
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><span style="margin-right:4px">🎯</span>Topic Radar</div><div class="an-canvas-box" style="height:280px"><canvas id="anRadarChart"></canvas></div></div>';
  h+='<div class="topic-stat-grid">';
  TOPICS.forEach(function(t){
    var ts=st.topics[t.id];var pct=0,att=0,cor=0;
    if(ts){att=ts.attempted;cor=ts.correct;pct=att>0?Math.round(cor/att*100):0;}
    var col=pct>=70?'var(--ok)':pct>=50?'var(--wn)':att>0?'var(--no)':'var(--tx3)';
    h+='<div class="topic-stat-card"><div class="ts-hdr"><div class="ts-ic" style="background:'+col+'18;color:'+col+'"><span style="font-size:18px">'+t.icon+'</span></div><div class="ts-name">'+t.name+'</div><div class="ts-acc" style="color:'+col+'">'+(att>0?pct+'%':'—')+'</div></div>';
    h+='<div style="height:6px;background:var(--bd);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:3px;transition:width .3s"></div></div>';
    h+='<div style="font-size:11px;color:var(--tx3);margin-top:6px">'+att+' attempted • '+cor+' correct</div></div>';
  });
  h+='</div></div>';
  /* HISTORY pane */
  h+='<div class="an-pane" id="anHistory">';
  if(!allHist.length)h+='<div class="empty-state"><div class="empty-ic">⏰</div><div class="empty-t">No Sessions Yet</div><div class="empty-tx">Complete practice sessions to see your history here.</div></div>';
  else{
    allHist.forEach(function(s4){
      var co=s4.score>=70?'var(--ok)':s4.score>=50?'var(--wn)':'var(--no)';
      var isLq=!!s4.qTitle;
      h+='<div class="an-hist-item"><div class="an-hist-badge" style="background:'+co+'18;color:'+co+'">'+s4.score+'<small>%</small></div><div class="an-hist-info"><div class="an-hist-title">'+(isLq?'Long Q: '+(s4.qTitle||'Question'):(s4.mode||'Practice')+' • '+s4.correct+'/'+s4.total)+'</div><div class="an-hist-meta"><span><span style="margin-right:4px">📅</span>'+fmtDate(s4.ts)+'</span><span><span style="margin-right:4px">⏱️</span>'+fmtTime(s4.duration||0)+'</span>'+(s4.topics?'<span><span style="margin-right:4px">🏷️</span>'+s4.topics+'</span>':'')+'</div></div></div>';
    });
  }
  h+='</div>';
  /* INSIGHTS pane */
  h+='<div class="an-pane" id="anInsights">';
  var weakTopics=[];var strongTopics=[];
  TOPICS.forEach(function(t){var ts=st.topics[t.id];if(ts&&ts.attempted>0){var p=Math.round(ts.correct/ts.attempted*100);if(p<60)weakTopics.push({name:t.name,pct:p,att:ts.attempted});else if(p>=80)strongTopics.push({name:t.name,pct:p,att:ts.attempted});}});
  if(tq===0){
    h+='<div class="empty-state"><div class="empty-ic">🧠</div><div class="empty-t">No Data Yet</div><div class="empty-tx">Complete some practice sessions to unlock AI-powered study insights.</div></div>';
  }else{
    h+='<div class="an-chart-wrap"><div class="an-chart-title"><span style="margin-right:4px">📊</span>Score Distribution</div><div class="an-canvas-box" style="height:220px"><canvas id="anDoughnut"></canvas></div></div>';
    if(weakTopics.length){h+='<div class="an-ins-card" style="border-left-color:var(--no)"><h4><span style="margin-right:4px">⚠️</span>Focus Areas</h4><p>You scored below 60% in: <strong>'+weakTopics.map(function(w){return w.name+' ('+w.pct+'%)';}).join(', ')+'</strong>. Consider reviewing these topics and practising more questions.</p></div>';}
    if(strongTopics.length){h+='<div class="an-ins-card" style="border-left-color:var(--ok)"><h4><span style="margin-right:4px">🏆</span>Strong Topics</h4><p>Excellent performance in: <strong>'+strongTopics.map(function(s5){return s5.name+' ('+s5.pct+'%)';}).join(', ')+'</strong>. Keep up the great work!</p></div>';}
    h+='<div class="an-ins-card"><h4><span style="margin-right:4px">💡</span>Study Tips</h4><p>You\'ve completed <strong>'+st.sessions+'</strong> sessions with an overall accuracy of <strong>'+acc+'%</strong>.'+(acc<70?' Try to review incorrect answers after each session and focus on understanding the reasoning behind correct answers.':' Great accuracy! Challenge yourself with harder questions and try timed exam mode.')+'</p></div>';
  }
  h+='</div>';
  h+='</div>';
  c.innerHTML=h;
  /* Wire tabs */
  c.querySelectorAll('.an-tab').forEach(function(tb){tb.onclick=function(){
    c.querySelectorAll('.an-tab').forEach(function(b){b.classList.remove('active');});
    c.querySelectorAll('.an-pane').forEach(function(p){p.classList.remove('active');});
    tb.classList.add('active');
    var paneId='an'+tb.getAttribute('data-an').charAt(0).toUpperCase()+tb.getAttribute('data-an').slice(1);
    var pane=document.getElementById(paneId);if(pane)pane.classList.add('active');
    if(tb.getAttribute('data-an')==='topics')renderRadar();
    if(tb.getAttribute('data-an')==='insights')renderDoughnut();
  };});
  /* Render streak heatmap */
  (function(){
    var grid=document.getElementById('anStreak');if(!grid)return;
    var today=new Date();today.setHours(0,0,0,0);
    var dayOfWeek=today.getDay();var startOffset=((dayOfWeek+6)%7)+27;
    var startDate=new Date(today);startDate.setDate(startDate.getDate()-startOffset);
    for(var i=0;i<28;i++){
      var dd=new Date(startDate);dd.setDate(dd.getDate()+i);dd.setHours(0,0,0,0);
      var cnt=0;allHist.forEach(function(h2){var hd=new Date(h2.ts);hd.setHours(0,0,0,0);if(hd.getTime()===dd.getTime())cnt++;});
      var lvl=cnt===0?'':cnt<=1?'l1':cnt<=2?'l2':cnt<=4?'l3':'l4';
      var cell=document.createElement('div');cell.className='an-streak-day '+lvl;
      cell.title=dd.toLocaleDateString('en-HK',{day:'numeric',month:'short'})+': '+cnt+' session'+(cnt!==1?'s':'');
      grid.appendChild(cell);
    }
  })();
  /* Render trend chart */
  renderTrend();
  function renderTrend(){
    var cv=document.getElementById('anTrendChart');if(!cv)return;
    if(anCharts.trend){anCharts.trend.destroy();}
    var mcqH=S.mcq.history.slice(-15);
    var labels=mcqH.map(function(h2,i){return fmtDate(h2.ts)||'#'+(i+1);});
    var scores=mcqH.map(function(h2){return h2.score;});
    if(!labels.length){labels=['No data'];scores=[0];}
    var isDark=document.documentElement.classList.contains('dark');
    var gridC=isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';
    var txC=isDark?'#94a3b8':'#64748b';
    anCharts.trend=new Chart(cv,{type:'line',data:{labels:labels,datasets:[{label:'Score %',data:scores,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.12)',fill:true,tension:.4,pointRadius:4,pointBackgroundColor:'#3b82f6',pointBorderColor:'#fff',pointBorderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,grid:{color:gridC},ticks:{color:txC,font:{size:11}}},x:{grid:{display:false},ticks:{color:txC,font:{size:11},maxRotation:45}}}}});
  }
  function renderRadar(){
    var cv=document.getElementById('anRadarChart');if(!cv)return;
    if(anCharts.radar){anCharts.radar.destroy();}
    var labels=TOPICS.map(function(t){return t.name.length>18?t.name.substring(0,16)+'…':t.name;});
    var data=TOPICS.map(function(t){var ts=st.topics[t.id];return ts&&ts.attempted>0?Math.round(ts.correct/ts.attempted*100):0;});
    var isDark=document.documentElement.classList.contains('dark');
    var gridC=isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)';
    var txC=isDark?'#94a3b8':'#64748b';
    anCharts.radar=new Chart(cv,{type:'radar',data:{labels:labels,datasets:[{label:'Accuracy %',data:data,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.18)',pointBackgroundColor:'#3b82f6',pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{min:0,max:100,ticks:{display:false,stepSize:20},grid:{color:gridC},pointLabels:{color:txC,font:{size:10}}}}}});
  }
  function renderDoughnut(){
    var cv=document.getElementById('anDoughnut');if(!cv)return;
    if(anCharts.doughnut){anCharts.doughnut.destroy();}
    var good=0,mid=0,bad=0;
    S.mcq.history.forEach(function(h2){if(h2.score>=70)good++;else if(h2.score>=50)mid++;else bad++;});
    anCharts.doughnut=new Chart(cv,{type:'doughnut',data:{labels:['≥70% (Good)','50-69% (Fair)','<50% (Needs Work)'],datasets:[{data:[good,mid,bad],backgroundColor:['#10b981','#f59e0b','#ef4444'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{padding:12,font:{size:12}}}}}});
  }
};

/* ---- App Init ---- */
(function(){
  loadQuestions();
  setTimeout(function(){initNav();switchView('dashboard');},100);
})();
