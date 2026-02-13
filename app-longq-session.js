/* ---- Render Long Q Session ---- */
function renderLongQSession(c){
  var ses=S.longQ.ses;if(!ses)return;
  var q=ses.question;var pidx=ses.partIdx;var part=q.parts[pidx];var tp=topicById(q.topic);
  var pct=Math.round((pidx+1)/q.parts.length*100);

  var h='<div class="quiz-ctr page-sec active">';
  /* Progress */
  h+='<div class="quiz-prog"><span class="quiz-prog-tx">Part '+(pidx+1)+'/'+q.parts.length+'</span><div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:'+pct+'%"></div><span class="quiz-prog-tx" id="lqTimerDisp">'+fmtTime(ses.elapsed)+'</span></div>';

  /* Question header */
  h+='<div class="card" style="margin-bottom:16px"><div class="card-body">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap"><span class="badge badge-p">'+(tp?tp.name:'')+'</span><span style="font-weight:700;font-size:15px">'+esc(q.title)+'</span></div>';
  h+='<div style="display:flex;gap:8px;align-items:baseline;margin-bottom:8px"><span style="font-weight:800;color:var(--pr);font-size:16px">'+part.label+'</span><span style="font-size:15px;line-height:1.6">'+esc(part.text)+'</span></div>';
  h+='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="badge" style="background:var(--ac)18;color:var(--ac)">'+part.marks+' marks</span>';
  h+='<button class="btn btn-ghost btn-sm" id="lqHintBtn"><i class="fas fa-lightbulb" style="color:var(--wn)"></i>Show Hint</button>';
  h+='</div>';
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

  /* Diagram pane */
  h+='<div id="lqDiagramPane" style="display:'+(activeAnsTab==='diagram'?'block':'none')+';padding:16px">';
  h+='<canvas id="lqCanvas" style="width:100%;height:360px;border-radius:8px;border:1px solid var(--bd)"></canvas>';
  h+='<div class="graph-tools" style="margin-top:10px">';
  h+='<button class="lqg-btn" data-tool="pen" style="background:rgba(37,99,235,.1);color:var(--pr);border-color:var(--pr)"><i class="fas fa-pen"></i> Pen</button>';
  h+='<button class="lqg-btn" data-tool="eraser"><i class="fas fa-eraser"></i> Eraser</button>';
  h+='<button class="lqg-btn" data-tool="text"><i class="fas fa-font"></i> Label</button>';
  h+='<input type="color" value="#2563eb" id="lqGraphColor" style="width:32px;height:28px;border:none;cursor:pointer;border-radius:4px">';
  h+='<select id="lqGraphWidth" style="padding:4px 8px;border:1px solid var(--bd);border-radius:6px;font-size:12px;background:var(--bg1);color:var(--tx1)"><option value="2">Thin</option><option value="4">Medium</option><option value="6">Thick</option></select>';
  h+='<span style="flex:1"></span>';
  h+='<button class="lqg-btn" data-tool="undo"><i class="fas fa-undo"></i></button>';
  h+='<button class="lqg-btn" data-tool="redo"><i class="fas fa-redo"></i></button>';
  h+='<button class="lqg-btn" data-tool="clear"><i class="fas fa-trash"></i></button>';
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
    if(box.style.display==='none'){box.style.display='block';box.textContent=part.hint;this.innerHTML='<i class="fas fa-lightbulb" style="color:var(--wn)"></i>Hide Hint';}
    else{box.style.display='none';this.innerHTML='<i class="fas fa-lightbulb" style="color:var(--wn)"></i>Show Hint';}
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
