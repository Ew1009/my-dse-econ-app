/* ---- Analytics Section ---- */
Sections.analytics=function(c){
  var h='<div class="page-sec active">';
  h+='<div style="text-align:center;margin-bottom:24px"><h2 style="font-size:1.5rem;font-weight:800"><i class="fas fa-chart-pie" style="color:var(--pr);margin-right:8px"></i>Analytics</h2><p style="color:var(--tx2);margin-top:4px">Track your progress and performance</p></div>';

  /* Stats Overview */
  h+='<div class="grid-3" style="margin-bottom:24px">';
  h+='<div class="card"><div class="card-body" style="text-align:center"><h3 style="font-weight:700;margin-bottom:12px;color:var(--pr)">Total Sessions</h3><div style="font-size:32px;font-weight:800;color:var(--pr)">'+S.stats.sessions+'</div></div></div>';
  h+='<div class="card"><div class="card-body" style="text-align:center"><h3 style="font-weight:700;margin-bottom:12px;color:var(--ok)">Study Time</h3><div style="font-size:32px;font-weight:800;color:var(--ok)">'+fmtTime(S.stats.time)+'</div></div></div>';
  h+='<div class="card"><div class="card-body" style="text-align:center"><h3 style="font-weight:700;margin-bottom:12px;color:var(--ac)">Average Score</h3><div style="font-size:32px;font-weight:800;color:var(--ac)">'+(S.stats.recent.length?Math.round(S.stats.recent.reduce(function(sum,r){return sum+r.score;},0)/S.stats.recent.length):0)+'%</div></div></div>';
  h+='</div>';

  /* Topic Performance */
  h+='<div class="card" style="margin-bottom:20px"><div class="card-hdr"><div class="card-t"><i class="fas fa-chart-bar"></i>Topic Performance</div></div>';
  h+='<div class="card-body">';
  if(!S.stats.topics||Object.keys(S.stats.topics).length===0){
    h+='<div class="empty-state" style="padding:30px"><div class="empty-ic"><i class="fas fa-chart-bar"></i></div><div class="empty-t">No data yet</div><div class="empty-tx">Complete some practice sessions to see your analytics!</div></div>';
  } else {
    h+='<div class="an-tabs"><button class="an-tab active" data-antab="overview">Overview</button><button class="an-tab" data-antab="topics">Topics</button><button class="an-tab" data-antab="history">History</button></div>';
    h+='<div class="an-pane active" id="anOverview">';
    h+='<div class="an-kpi-row">';
    Object.keys(S.stats.topics).forEach(function(topicId){
      var topic=S.stats.topics[topicId];
      var avgScore=0, bestScore=0;
      if (Array.isArray(topic.sessions) && topic.sessions.length){
        avgScore=Math.round(topic.sessions.reduce(function(sum,s){return sum+(s.score||0);},0)/topic.sessions.length);
        bestScore=Math.max.apply(Math,topic.sessions.map(function(s){return s.score||0;}));
      } else if (typeof topic.attempted === 'number' && topic.attempted>0){
        avgScore = Math.round((topic.correct||0)/topic.attempted*100);
        bestScore = avgScore;
      }
      h+='<div class="an-kpi"><div class="an-kpi-val">'+avgScore+'%</div><div class="an-kpi-lbl">'+topicId+'</div></div>';
    });
    h+='</div>';
    h+='<div class="an-streak-grid">';
    for(var i=0;i<7;i++){
      var date=new Date();
      date.setDate(date.getDate()-(6-i));
      var dateStr=date.toISOString().split('T')[0];
      var hasData=S.stats.recent.some(function(r){return r.ts>=new Date(dateStr).getTime();});
      h+='<div class="an-streak-day l'+(hasData?'1':'0')+'"></div>';
    }
    h+='</div>';
    h+='<div style="margin-top:20px"><h4 style="font-weight:700;margin-bottom:12px">Topic Breakdown</h4>';
    h+='<div class="an-ins-cards">';
    Object.keys(S.stats.topics).forEach(function(topicId){
      var topic=S.stats.topics[topicId];
      if (Array.isArray(topic.sessions) && topic.sessions.length>0){
        var avgScore=Math.round(topic.sessions.reduce(function(sum,s){return sum+(s.score||0);},0)/topic.sessions.length);
        var bestScore=Math.max.apply(Math,topic.sessions.map(function(s){return s.score||0;}));
        var recentSessions=topic.sessions.slice(-3).reverse();
        h+='<div class="an-ins-card"><h4><i class="fas fa-chart-bar"></i>'+topicId+'</h4><p>Average Score: <strong>'+avgScore+'%</strong> | Best Score: <strong>'+bestScore+'%</strong></p>';
        h+='<div style="margin-top:10px"><h5>Recent Sessions:</h5>';
        recentSessions.forEach(function(session){
          h+='<div class="an-hist-item"><div class="an-hist-badge"><div>'+Math.round(session.score||0)+'%</div><small>'+(session.score||0)+'/100</small></div><div class="an-hist-info"><div class="an-hist-title">'+(session.type||'')+'</div><div class="an-hist-meta">'+fmtDate(session.ts)+' &bull; '+fmtTime(session.duration||0)+'</div></div></div>';
        });
        h+='</div>';
      } else if (typeof topic.attempted === 'number' && topic.attempted>0){
        var avgScore2 = Math.round((topic.correct||0)/topic.attempted*100);
        h+='<div class="an-ins-card"><h4><i class="fas fa-chart-bar"></i>'+topicId+'</h4><p>Average Score: <strong>'+avgScore2+'%</strong> | Attempts: <strong>'+topic.attempted+'</strong></p></div>';
      }
    });
    h+='</div>';
    h+='</div>';
    h+='</div>';
  }

  /* History Tab */
  h+='<div class="an-pane" id="anHistory">';
  if(!S.stats.recent.length){
    h+='<div class="empty-state" style="padding:30px"><div class="empty-ic"><i class="fas fa-inbox"></i></div><div class="empty-t">No practice sessions yet</div><div class="empty-tx">Start a practice session to see your history!</div></div>';
  } else {
    h+='<div class="an-hist-grid">';
    S.stats.recent.slice().reverse().forEach(function(r){
      var co=r.score>=70?'var(--ok)':r.score>=50?'var(--wn)':'var(--no)';
      h+='<div class="an-hist-item"><div class="an-hist-badge" style="background:'+co+'"><div>'+Math.round(r.score)+'%</div><small>'+r.score+'/'+r.possible+'</small></div><div class="an-hist-info"><div class="an-hist-title">'+r.type+'</div><div class="an-hist-meta">'+fmtDate(r.ts)+' &bull; '+fmtTime(r.duration)+'</div></div></div>';
    });
    h+='</div>';
  }
  h+='</div>';

  /* Tab switching */
  h+='<script>';
  h+='document.querySelectorAll(".an-tabs .an-tab").forEach(function(btn){';
  h+='  btn.onclick=function(){';
  h+='    document.querySelectorAll(".an-tabs .an-tab").forEach(function(b){b.classList.remove("active");});';
  h+='    btn.classList.add("active");';
  h+='    var tab=btn.dataset.antab;';
  h+='    document.querySelectorAll(".an-pane").forEach(function(p){p.style.display="none";});';
  h+='    document.getElementById("an"+tab.charAt(0).toUpperCase()+tab.slice(1)).style.display="block";';
  h+='  };';
  h+='});';
  h+='</script>';

  c.innerHTML=h;
}
