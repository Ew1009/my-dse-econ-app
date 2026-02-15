/* ---- Analytics Section ---- */
var anCharts = {trend: null, radar: null, doughnut: null};

Sections.analytics=function(c){
  var st=S.stats;var tq=0,tc=0;
  Object.keys(st.topics||{}).forEach(function(k){
    var tk = st.topics[k];
    if (!tk) return;
    if (typeof tk.attempted === 'number' && typeof tk.correct === 'number') {
      tq += tk.attempted;
      tc += tk.correct;
    }
  });
  var acc=tq>0?Math.round(tc/tq*100):0;
  var allHist=S.mcq.history.concat(S.longQ.history||[]).sort(function(a,b){return(b.ts||0)-(a.ts||0);});
  var streak=0;if(allHist.length){var d=new Date();d.setHours(0,0,0,0);var check=true;while(check){var dt=d.getTime();var found=allHist.some(function(h2){var hd=new Date(h2.ts);hd.setHours(0,0,0,0);return hd.getTime()===dt;});if(found){streak++;d.setDate(d.getDate()-1);}else{check=false;}}}
  var h='<div class="page-sec active">';
  h+='<div style="text-align:center;margin-bottom:22px"><h2 style="font-size:1.5rem;font-weight:800"><i class="fas fa-chart-pie" style="color:var(--pr);margin-right:8px"></i>Analytics</h2><p style="color:var(--tx2);margin-top:4px;font-size:14px">Track your study progress and performance</p></div>';
  /* tabs */
  h+='<div class="an-tabs"><button class="an-tab active" data-an="overview">Overview</button><button class="an-tab" data-an="topics">Topics</button><button class="an-tab" data-an="history">History</button><button class="an-tab" data-an="insights">Insights</button></div>';
  /* OVERVIEW pane */
  h+='<div class="an-pane active" id="anOverview">';
  h+='<div class="an-kpi-row">';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+st.sessions+'</div><div class="an-kpi-lbl"><i class="fas fa-book-open"></i> Sessions</div></div>';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+tq+'</div><div class="an-kpi-lbl"><i class="fas fa-list-ol"></i> Questions</div></div>';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+acc+'%</div><div class="an-kpi-lbl"><i class="fas fa-bullseye"></i> Accuracy</div></div>';
  h+='<div class="an-kpi"><div class="an-kpi-val">'+streak+'</div><div class="an-kpi-lbl"><i class="fas fa-fire"></i> Day Streak</div></div>';
  h+='</div>';
  /* Score Trend chart */
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><i class="fas fa-chart-line"></i>Score Trend</div><div class="an-canvas-box" style="height:220px"><canvas id="anTrendChart"></canvas></div></div>';
  /* Study Activity heatmap */
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><i class="fas fa-fire"></i>Study Activity (Last 28 Days)</div><div style="display:flex;gap:4px;margin-bottom:6px;font-size:10px;color:var(--tx3)"><span style="flex:1">Mon</span><span style="flex:1">Tue</span><span style="flex:1">Wed</span><span style="flex:1">Thu</span><span style="flex:1">Fri</span><span style="flex:1">Sat</span><span style="flex:1">Sun</span></div><div class="an-streak-grid" id="anStreak"></div><div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;font-size:11px;color:var(--tx3)">Less <div class="an-streak-day" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l1" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l2" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l3" style="width:14px;height:14px;display:inline-block"></div><div class="an-streak-day l4" style="width:14px;height:14px;display:inline-block"></div> More</div></div>';
  /* Time studied */
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><i class="fas fa-clock"></i>Total Study Time</div><div style="text-align:center;padding:16px"><span style="font-size:38px;font-weight:800">'+fmtTime(st.time)+'</span><div style="font-size:13px;color:var(--tx3);margin-top:4px">minutes:seconds</div></div></div>';
  h+='</div>';
  /* TOPICS pane */
  h+='<div class="an-pane" id="anTopics">';
  h+='<div class="an-chart-wrap"><div class="an-chart-title"><i class="fas fa-spider"></i>Topic Radar</div><div class="an-canvas-box" style="height:280px"><canvas id="anRadarChart"></canvas></div></div>';
  h+='<div class="topic-stat-grid">';
  TOPICS.forEach(function(t){
    var ts=st.topics[t.id];var pct=0,att=0,cor=0;
    if(ts){att=ts.attempted||0;cor=ts.correct||0;pct=att>0?Math.round(cor/att*100):0;}
    var col=pct>=70?'var(--ok)':pct>=50?'var(--wn)':att>0?'var(--no)':'var(--tx3)';
    h+='<div class="topic-stat-card"><div class="ts-hdr"><div class="ts-ic" style="background:'+col+'18;color:'+col+'"><i class="fas '+t.icon+'"></i></div><div class="ts-name">'+t.name+'</div><div class="ts-acc" style="color:'+col+'">'+(att>0?pct+'%':'—')+'</div></div>';
    h+='<div style="height:6px;background:var(--bd);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:3px;transition:width .3s"></div></div>';
    h+='<div style="font-size:11px;color:var(--tx3);margin-top:6px">'+att+' attempted &bull; '+cor+' correct</div></div>';
  });
  h+='</div></div>';
  /* HISTORY pane */
  h+='<div class="an-pane" id="anHistory">';
  if(!allHist.length)h+='<div class="empty-state"><div class="empty-ic"><i class="fas fa-clock"></i></div><div class="empty-t">No Sessions Yet</div><div class="empty-tx">Complete practice sessions to see your history here.</div></div>';
  else{
    allHist.forEach(function(s4){
      var co=s4.score>=70?'var(--ok)':s4.score>=50?'var(--wn)':'var(--no)';
      var isLq=!!s4.qTitle;
      h+='<div class="an-hist-item"><div class="an-hist-badge" style="background:'+co+'18;color:'+co+'">'+s4.score+'<small>%</small></div><div class="an-hist-info"><div class="an-hist-title">'+(isLq?'Long Q: '+(s4.qTitle||'Question'):(s4.mode||'Practice')+' &bull; '+s4.correct+'/'+s4.total)+'</div><div class="an-hist-meta"><span><i class="fas fa-calendar"></i> '+fmtDate(s4.ts)+'</span><span><i class="fas fa-clock"></i> '+fmtTime(s4.duration||0)+'</span>'+(s4.topics?'<span><i class="fas fa-tag"></i> '+s4.topics+'</span>':'')+'</div></div></div>';
    });
  }
  h+='</div>';
  /* INSIGHTS pane */
  h+='<div class="an-pane" id="anInsights">';
  var weakTopics=[];var strongTopics=[];
  TOPICS.forEach(function(t){var ts=st.topics[t.id];if(ts&&ts.attempted>0){var p=Math.round(ts.correct/ts.attempted*100);if(p<60)weakTopics.push({name:t.name,pct:p,att:ts.attempted});else if(p>=80)strongTopics.push({name:t.name,pct:p,att:ts.attempted});}});
  if(tq===0){
    h+='<div class="empty-state"><div class="empty-ic"><i class="fas fa-brain"></i></div><div class="empty-t">No Data Yet</div><div class="empty-tx">Complete some practice sessions to unlock AI-powered study insights.</div></div>';
  }else{
    h+='<div class="an-chart-wrap"><div class="an-chart-title"><i class="fas fa-chart-doughnut"></i>Score Distribution</div><div class="an-canvas-box" style="height:220px"><canvas id="anDoughnut"></canvas></div></div>';
    if(weakTopics.length){h+='<div class="an-ins-card" style="border-left-color:var(--no)"><h4><i class="fas fa-exclamation-triangle" style="color:var(--no)"></i>Focus Areas</h4><p>You scored below 60% in: <strong>'+weakTopics.map(function(w){return w.name+' ('+w.pct+'%)';}).join(', ')+'</strong>. Consider reviewing these topics and practising more questions.</p></div>';}
    if(strongTopics.length){h+='<div class="an-ins-card" style="border-left-color:var(--ok)"><h4><i class="fas fa-trophy" style="color:var(--ok)"></i>Strong Topics</h4><p>Excellent performance in: <strong>'+strongTopics.map(function(s5){return s5.name+' ('+s5.pct+'%)';}).join(', ')+'</strong>. Keep up the great work!</p></div>';}
    h+='<div class="an-ins-card"><h4><i class="fas fa-lightbulb" style="color:var(--wn)"></i>Study Tips</h4><p>You\'ve completed <strong>'+st.sessions+'</strong> sessions with an overall accuracy of <strong>'+acc+'%</strong>.'+(acc<70?' Try to review incorrect answers after each session and focus on understanding the reasoning behind correct answers.':' Great accuracy! Challenge yourself with harder questions and try timed exam mode.')+'</p></div>';
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
    var cv=document.getElementById('anTrendChart');if(!cv||typeof Chart==='undefined')return;
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
    var cv=document.getElementById('anRadarChart');if(!cv||typeof Chart==='undefined')return;
    if(anCharts.radar){anCharts.radar.destroy();}
    var labels=TOPICS.map(function(t){return t.name.length>18?t.name.substring(0,16)+'…':t.name;});
    var data=TOPICS.map(function(t){var ts=st.topics[t.id];return ts&&ts.attempted>0?Math.round(ts.correct/ts.attempted*100):0;});
    var isDark=document.documentElement.classList.contains('dark');
    var gridC=isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)';
    var txC=isDark?'#94a3b8':'#64748b';
    anCharts.radar=new Chart(cv,{type:'radar',data:{labels:labels,datasets:[{label:'Accuracy %',data:data,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.18)',pointBackgroundColor:'#3b82f6',pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{min:0,max:100,ticks:{display:false,stepSize:20},grid:{color:gridC},pointLabels:{color:txC,font:{size:10}}}}}});
  }
  function renderDoughnut(){
    var cv=document.getElementById('anDoughnut');if(!cv||typeof Chart==='undefined')return;
    if(anCharts.doughnut){anCharts.doughnut.destroy();}
    var good=0,mid=0,bad=0;
    S.mcq.history.forEach(function(h2){if(h2.score>=70)good++;else if(h2.score>=50)mid++;else bad++;});
    anCharts.doughnut=new Chart(cv,{type:'doughnut',data:{labels:['≥70% (Good)','50-69% (Fair)','<50% (Needs Work)'],datasets:[{data:[good,mid,bad],backgroundColor:['#10b981','#f59e0b','#ef4444'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{padding:12,font:{size:12}}}}}});
  }
};
