/* ---- MCQ Functions ---- */
function topicById(id){for(var i=0;i<TOPICS.length;i++){if(TOPICS[i].id===id)return TOPICS[i];}return null;}

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
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><i class="fas fa-exchange-alt" style="color:var(--pr)"></i><span style="font-weight:700;font-size:16px">Practice Mode</span></div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:16px">Choose your practice mode with <strong>'+totalQ+' authentic HKDSE past paper questions</strong>.</p>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
  [{id:'topic',ic:'fa-bullseye',t:'Topic Practice',d:'Intensive training'},
   {id:'exam',ic:'fa-file-alt',t:'Exam Mode',d:'40 Qs · 1 Hour'},
   {id:'quiz',ic:'fa-clock',t:'Quiz Mode',d:'Timed challenge'}].forEach(function(m){
    h+='<div class="type-card'+(m.id===_mcqMode?' sel':'')+'" data-mcqmode="'+m.id+'" style="padding:18px 10px"><i class="fas '+m.ic+'"></i><div class="type-card-t">'+m.t+'</div><div class="type-card-w">'+m.d+'</div></div>';
  });
  h+='</div></div></div>';

  /* ---- Topic Practice panel ---- */
  h+='<div id="mcqPanelTopic" class="card" style="margin-bottom:20px;display:'+(_mcqMode==='topic'?'block':'none')+'"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-bullseye" style="color:var(--pr)"></i><span style="font-weight:700;font-size:16px">Topic Practice</span></div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:16px">Focus on specific topics for intensive revision. No time pressure.</p>';
  h+='<div style="font-weight:700;font-size:13px;margin-bottom:10px">Select Topic</div>';
  h+='<div class="topic-sel-grid" id="topicTopicList">';
  /* All Topics option */
  h+='<div style="margin-bottom:10px"><div class="topic-sel-item sel" data-tid="all" style="width:100%"><i class="fas fa-th-large"></i><span style="flex:1">All Topics</span><span style="color:var(--tx3);font-size:12px">('+totalQ+')</span></div></div>';
  /* Group by category: Micro then Macro */
  ['Micro','Macro'].forEach(function(cat){
    h+='<div style="margin-bottom:8px"><div style="font-weight:700;margin-bottom:6px">'+cat+'</div>';
    TOPICS.filter(function(t){return t.cat===cat;}).forEach(function(t){
      var cnt=mcqCountByTopic(t.id);
      h+='<div class="topic-sel-item" data-tid="'+t.id+'"><i class="fas '+t.icon+'"></i><span style="flex:1">'+t.name+'</span><span style="color:var(--tx3);font-size:12px">('+cnt+')</span></div>';
    });
    h+='</div>';
  });
  h+='</div>';
  h+='<div style="font-weight:700;font-size:13px;margin:18px 0 10px">Number of Questions</div>';
  h+='<select class="form-sel" id="topicQCount" style="width:100%;font-size:16px"><option value="10">10 Questions</option><option value="20">20 Questions</option><option value="30">30 Questions</option></select>';
  h+='<label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-size:13px;cursor:pointer"><input type="checkbox" id="topicTimeCheck"><span>Enable Time Limit</span></label>';
  h+='<button class="btn btn-p btn-lg" style="width:100%;margin-top:18px;justify-content:center" id="topicStartBtn"><i class="fas fa-play"></i>Start Topic Practice</button>';
  h+='</div></div>';

  /* ---- Exam Mode panel ---- */
  h+='<div id="mcqPanelExam" class="card" style="margin-bottom:20px;display:'+(_mcqMode==='exam'?'block':'none')+'"><div class="card-body" style="text-align:center">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;justify-content:center"><i class="fas fa-file-alt" style="color:var(--pr)"></i><span style="font-weight:700;font-size:16px">Exam Mode</span></div>';
  h+='<div style="font-size:48px;margin-bottom:12px"><i class="fas fa-file-signature" style="color:var(--wn)"></i></div>';
  h+='<div style="font-weight:700;font-size:17px;margin-bottom:6px">HKDSE Exam Simulation</div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:20px">40 randomly selected questions from all topics.<br>Strict 1-hour time limit. No going back!</p>';
  h+='<div style="display:flex;gap:12px;justify-content:center;margin-bottom:18px">';
  [{v:'40',l:'Questions'},{v:'60',l:'Minutes'},{v:''+TOPICS.length,l:'Topics'}].forEach(function(s4){
    h+='<div style="border:2px solid var(--ac);border-radius:12px;padding:14px 20px;min-width:80px"><div style="font-size:22px;font-weight:800;color:var(--ac)">'+s4.v+'</div><div style="font-size:11px;color:var(--tx3)">'+s4.l+'</div></div>';
  });
  h+='</div>';
  h+='<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:12px 16px;color:var(--wn);font-size:12px;font-weight:600;margin-bottom:18px"><i class="fas fa-exclamation-triangle" style="margin-right:6px"></i>Warning: Once started, you cannot pause or restart. Make sure you have 1 hour available.</div>';
  h+='<button class="btn btn-p btn-lg" style="justify-content:center" id="examStartBtn"><i class="fas fa-play"></i>Begin Exam</button>';
  h+='</div></div>';

  /* ---- Quiz Mode panel ---- */
  h+='<div id="mcqPanelQuiz" class="card" style="margin-bottom:20px;display:'+(_mcqMode==='quiz'?'block':'none')+'"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-clock" style="color:var(--pr)"></i><span style="font-weight:700;font-size:16px">Quiz Mode</span></div>';
  h+='<p style="color:var(--tx2);font-size:13px;margin-bottom:16px">Timed challenge! Question count is based on time selected.</p>';
  h+='<div style="font-weight:700;font-size:13px;margin-bottom:10px">Select Topics (multiple allowed)</div>';
  h+='<div class="topic-sel-grid" id="quizTopicList">';
  ['Micro','Macro'].forEach(function(cat){
    h+='<div style="margin-bottom:8px"><div style="font-weight:700;margin-bottom:6px">'+cat+'</div>';
    TOPICS.filter(function(t){return t.cat===cat;}).forEach(function(t){
      var cnt=mcqCountByTopic(t.id);
      h+='<div class="topic-sel-item" data-tid="'+t.id+'"><i class="fas '+t.icon+'"></i><span style="flex:1">'+t.name+'</span><span style="color:var(--tx3);font-size:12px">('+cnt+')</span></div>';
    });
    h+='</div>';
  });
  h+='</div>';
  h+='<div style="font-weight:700;font-size:13px;margin:18px 0 10px">Time Limit</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
  [{t:'10 min',d:'10 Questions',v:10},{t:'15 min',d:'15 Questions',v:15},{t:'30 min',d:'25 Questions',v:30}].forEach(function(tl,i){
    h+='<div class="type-card'+(i===0?' sel':'')+'" data-time="'+tl.v+'" data-qcount="'+(tl.v===10?10:tl.v===15?15:25)+'"><div class="type-card-t">'+tl.t+'</div><div class="type-card-w">'+tl.d+'</div></div>';
  });
  h+='</div>';
  h+='<button class="btn btn-p btn-lg" style="width:100%;margin-top:18px;justify-content:center" id="quizStartBtn"><i class="fas fa-play"></i>Start Quiz</button>';
  h+='</div></div>';

  h+='</div>'; /* end mcqSetupPane */

  /* Past Sessions pane */
  h+='<div id="mcqHistoryPane" style="display:none"><div id="mcqHistoryList"></div></div>';

  return h;
}
