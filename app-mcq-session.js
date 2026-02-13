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
    var ico=isCorrect?'fa-check-circle':'fa-times-circle';
    var col=isCorrect?'var(--ok)':'var(--no)';
    var lbl=isCorrect?'Correct!':'Incorrect — Answer: '+letters[q.ans];
    expDiv.innerHTML='<div style="font-weight:700;color:'+col+';margin-bottom:6px;display:flex;align-items:center;gap:6px;font-size:13px"><i class="fas '+ico+'"></i>'+lbl+'</div><div style="font-size:13px;line-height:1.6">'+esc(q.exp)+'</div>';
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
  var modeIc=isTopic?'fa-bullseye':ses.mode==='exam'?'fa-file-alt':'fa-clock';
  var tp=topicById(q.topic);
  h+='<div class="card" style="margin-bottom:16px"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:q.topic)+'</span><span class="badge" style="background:var(--bg2);color:var(--tx2)"><i class="fas '+modeIc+'" style="margin-right:4px"></i>'+modeLbl+'</span></div>';
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
    var ico2=wasCorrect?'fa-check-circle':'fa-times-circle';
    var col2=wasCorrect?'var(--ok)':'var(--no)';
    var lbl2=wasCorrect?'Correct!':'Incorrect — Answer: '+letters[q.ans];
    h+='<div class="ans-sec"><div style="font-weight:700;color:'+col2+';margin-bottom:6px;display:flex;align-items:center;gap:6px;font-size:13px"><i class="fas '+ico2+'"></i>'+lbl2+'</div><div style="font-size:13px;line-height:1.6">'+esc(q.exp)+'</div></div>';
  }
  h+='</div></div>';
  /* action buttons */
  h+='<div class="quiz-acts">';
  h+='<button class="btn btn-s" '+(ses.idx===0?'disabled':'')+' id="mcqPrev"><i class="fas fa-arrow-left"></i> Prev</button>';
  h+='<div style="display:flex;gap:8px">';
  if(ses.idx<ses.questions.length-1){h+='<button class="btn btn-p" id="mcqNext">Next <i class="fas fa-arrow-right"></i></button>';}
  else{h+='<button class="btn btn-ok" id="mcqFinish"><i class="fas fa-flag-checkered"></i> Finish</button>';}
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
  h+='<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap"><button class="btn btn-p" id="newSesBtn"><i class="fas fa-redo"></i>New Session</button><button class="btn btn-s" onclick="switchView(\'practice\')"><i class="fas fa-arrow-left"></i>Back to Practice</button><button class="btn btn-s" onclick="switchView(\'dashboard\')"><i class="fas fa-home"></i>Dashboard</button>';
  if(wrong>0)h+='<button class="btn btn-s" id="retryWrong"><i class="fas fa-sync"></i>Retry Wrong ('+wrong+')</button>';
  h+='</div>';
  h+='<div class="card"><div class="card-hdr"><div class="card-t"><i class="fas fa-clipboard-list"></i>Review</div></div><div class="card-body">';
  for(var i=0;i<ses.questions.length;i++){
    var q2=ses.questions[i];var isC=ses.answers[i]===q2.ans;
    h+='<div style="padding:14px 0;border-bottom:1px solid var(--bd)">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-weight:700;font-size:13px;color:'+(isC?'var(--ok)':'var(--no)')+'"><i class="fas '+(isC?'fa-check-circle':'fa-times-circle')+'"></i> Q'+(i+1)+'</span><span class="badge badge-p" style="font-size:11px">'+(topicById(q2.topic)?topicById(q2.topic).name:q2.topic)+'</span></div>';
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
