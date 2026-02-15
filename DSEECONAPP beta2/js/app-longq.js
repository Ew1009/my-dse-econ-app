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
    if(!filtered.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:30px"><div class="empty-ic" style="font-size:32px"><i class="fas fa-search"></i></div><div class="empty-t">No questions found</div><div class="empty-tx">Try adjusting your filters</div></div>';return;}
    var gh='';
    filtered.forEach(function(q){
      var tp=topicById(q.topic);
      var dcol=q.difficulty==='Hard'?'var(--no)':'var(--wn)';
      gh+='<div class="card" style="cursor:pointer;transition:all .2s" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'var(--shl)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'var(--sh)\'" data-lqid="'+q.id+'">';
      gh+='<div class="card-body">';
      gh+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:'')+'</span><span class="badge" style="background:'+dcol+'18;color:'+dcol+'">'+q.difficulty+'</span><span class="badge" style="background:var(--ac)18;color:var(--ac)">'+q.marks+' marks</span></div>';
      gh+='<div style="font-weight:700;font-size:14px;margin-bottom:8px">'+esc(q.title)+'</div>';
      gh+='<div style="font-size:12px;color:var(--tx3);margin-bottom:10px">'+q.parts.length+' parts</div>';
      gh+='<button class="btn btn-p btn-sm" style="width:100%"><i class="fas fa-play"></i>Start Practice</button>';
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
    if(!S.longQ.history.length){list.innerHTML='<div class="empty-state" style="padding:30px"><div class="empty-ic" style="font-size:32px"><i class="fas fa-inbox"></i></div><div class="empty-t">No sessions yet</div><div class="empty-tx">Start a long question practice!</div></div>';return;}
    var hh='';
    S.longQ.history.slice().reverse().forEach(function(s5){
      hh+='<div class="card" style="margin-bottom:10px"><div class="card-body" style="padding:14px 18px;display:flex;align-items:center;gap:14px">';
      hh+='<div style="width:38px;height:38px;border-radius:50%;background:var(--ac)18;display:flex;align-items:center;justify-content:center"><i class="fas fa-pen-fancy" style="color:var(--ac);font-size:14px"></i></div>';
      hh+='<div style="flex:1"><div style="font-weight:600;font-size:14px">'+esc(s5.title)+'</div><div style="font-size:12px;color:var(--tx3)">'+fmtDate(s5.ts)+' &bull; '+fmtTime(s5.duration)+' &bull; '+s5.partsCompleted+'/'+s5.partsTotal+' parts</div></div>';
      if(s5.feedbackReceived)hh+='<span class="badge badge-ok"><i class="fas fa-check"></i>Feedback</span>';
      hh+='</div></div>';
    });
    list.innerHTML=hh;
  }
}

/* ---- Long Question Preview ---- */
function previewLongQ(qId){
  var q=null;for(var i=0;i<LQ_BANK.length;i++){if(LQ_BANK[i].id===qId){q=LQ_BANK[i];break;}}
  if(!q)return;var tp=topicById(q.topic);
  var h='<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><h3 style="font-weight:700;flex:1">'+esc(q.title)+'</h3><button class="btn btn-ghost" onclick="Modal.hide()"><i class="fas fa-times"></i></button></div>';
  h+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:'')+'</span><span class="badge badge-w">'+q.difficulty+'</span><span class="badge" style="background:var(--ac)18;color:var(--ac)">'+q.marks+' marks</span></div>';
  q.parts.forEach(function(p){
    h+='<div style="padding:12px 0;border-bottom:1px solid var(--bd)"><div style="display:flex;gap:8px;align-items:baseline"><span style="font-weight:700;color:var(--pr)">'+p.label+'</span><span style="font-size:14px;line-height:1.6">'+esc(p.text)+'</span></div><div style="font-size:12px;color:var(--tx3);margin-top:4px">'+p.marks+' marks</div></div>';
  });
  h+='<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px"><button class="btn btn-s" onclick="Modal.hide()">Close</button><button class="btn btn-p" onclick="Modal.hide();startLongQ(\''+q.id+'\')"><i class="fas fa-play"></i>Start Practice</button></div>';
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
