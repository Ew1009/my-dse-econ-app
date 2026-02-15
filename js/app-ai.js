/* ==================================================================
   AI Functions Module - Replaces Poe API with direct AI API calls
   
   All AI calls go through window.AIHelper.callAI(prompt, options)
   which sends to /api/chat with body:
   { prompt, systemPrompt, maxTokens, temperature }
   ================================================================== */

/* ---- Submit Long Q for AI Feedback ---- */
function submitLongQ(c){
  var ses=S.longQ.ses;
  if(!ses){
    console.error('submitLongQ: No active long-question session');
    return;
  }
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

  /* Build prompt string for AI feedback */
  var prompt='You are an expert HKDSE Economics teacher. Grade and give detailed feedback on this student\'s answer.\n\n';
  prompt+='**Question: '+(ses.question.title||'Untitled Question')+'** ('+(ses.question.marks||0)+' marks total)\n\n';

  ses.question.parts.forEach(function(p,idx){
    var ans=(ses.answers[idx]||'').replace(/<[^>]*>/g,'').trim();
    prompt+=(p.label||('Part '+(idx+1)))+' '+(p.text||'')+' ['+(p.marks||0)+' marks]\n';
    prompt+='**Student\'s answer:** '+(ans||'(No answer provided)')+'\n\n';
  });

  prompt+='\nFor each part:\n';
  prompt+='1. Award marks out of maximum\n';
  prompt+='2. State what was done well\n';
  prompt+='3. State what was missing or incorrect\n';
  prompt+='4. Provide a model answer\n\n';
  prompt+='End with overall marks, percentage, and key areas for improvement.\n';
  prompt+='Format using Markdown.';

  /* Validate prompt is not empty before calling AI */
  if(!prompt||!prompt.trim()){
    console.error('submitLongQ: Built prompt is empty, aborting AI call');
    toast('Error: Could not build feedback prompt','err');
    lqTimer=setInterval(function(){if(!S.longQ.ses)return;S.longQ.ses.elapsed++;var el=document.getElementById('lqTimerDisp');if(el)el.textContent=fmtTime(S.longQ.ses.elapsed);},1000);
    return;
  }

  console.log('submitLongQ: prompt built successfully, length='+prompt.length);

  ses.submitted=true;

  /* Show loading overlay */
  document.getElementById('loadOv').style.display='flex';
  document.getElementById('loadTx').textContent='Getting AI Feedback...';
  document.getElementById('loadSub').textContent='Analyzing your answers';

  /* Call AI — prompt is the first argument (string), options is the second argument (object) */
  window.AIHelper.callAI(prompt, {
    systemPrompt: "You are an expert HKDSE Economics teacher. Provide professional, structured feedback with high visibility:\n\n" +
    "1. **Vertical Spacing**: Use blank lines between the student's score, the critique, and the model answer.\n" +
    "2. **Clear Marks**: State awarded marks clearly at the start of each section (e.g., **Score: 3/4**).\n" +
    "3. **Simple Indicators**: Use a (+) for things done well and a (-) for missing points.\n" +
    "4. **Model Answer Box**: Use a single `> Blockquote` for the sample answer to make it stand out from the critique.\n" +
    "5. **No Clutter**: Avoid extra symbols or dividers. Use whitespace to create separation.",
  maxTokens: 3000,
  temperature: 0.4
}).then(function(feedback){
    document.getElementById('loadOv').style.display='none';
    ses.feedback=feedback;
    /* Record history */
    var completed=0;
    for(var j=0;j<ses.question.parts.length;j++){
      if((ses.answers[j]||'').replace(/<[^>]*>/g,'').trim())completed++;
    }
    S.longQ.history.push({
      title:ses.question.title,
      qId:ses.question.id,
      ts:Date.now(),
      duration:ses.elapsed,
      partsCompleted:completed,
      partsTotal:ses.question.parts.length,
      feedbackReceived:true,
      feedback:ses.feedback
    });
    recordActivity('long-q',0,ses.elapsed,ses.question.topic);
    renderLongQSession(c);
    toast('Feedback received!','ok');
  }).catch(function(err){
    document.getElementById('loadOv').style.display='none';
    console.error('submitLongQ: AI call failed:', err.message);
    toast('Failed to get feedback: '+err.message,'err');
    /* Re-allow editing — restart timer */
    ses.submitted=false;
    lqTimer=setInterval(function(){if(!S.longQ.ses)return;S.longQ.ses.elapsed++;var el=document.getElementById('lqTimerDisp');if(el)el.textContent=fmtTime(S.longQ.ses.elapsed);},1000);
  });
}

/* ---- AI Generation Section ---- */
var aigTab='generate';
Sections['ai-gen']=function(c){
  var h='<div class="page-sec active">';
  h+='<div style="text-align:center;margin-bottom:22px"><h2 style="font-size:1.5rem;font-weight:800"><i class="fas fa-robot" style="color:var(--ok);margin-right:8px"></i>AI Generation</h2><p style="color:var(--tx2);margin-top:4px;font-size:14px">Generate custom questions with AI</p></div>';
  
  /* AI Settings button */
  h+='<div style="text-align:right;margin-bottom:12px"><button class="btn btn-ghost btn-sm" id="aiSettingsBtn"><i class="fas fa-cog"></i> AI Settings</button></div>';
  
  h+='<div class="tab-bar" id="aigTabs" style="margin-bottom:20px">';
  h+='<button class="tab-btn '+(aigTab==='generate'?'active':'')+'" data-aig="generate"><i class="fas fa-magic" style="margin-right:6px"></i>Generate</button>';
  h+='<button class="tab-btn '+(aigTab==='tutor'?'active':'')+'" data-aig="tutor"><i class="fas fa-chalkboard-teacher" style="margin-right:6px"></i>AI Tutor</button>';
  h+='<button class="tab-btn '+(aigTab==='history'?'active':'')+'" data-aig="history"><i class="fas fa-history" style="margin-right:6px"></i>History</button>';
  h+='</div>';
  /* Generate pane */
  h+='<div class="aig-pane" id="aigGenerate" style="display:'+(aigTab==='generate'?'block':'none')+'">';
  h+=renderAigForm();
  h+='</div>';
  /* Tutor pane */
  h+='<div class="aig-pane" id="aigTutor" style="display:'+(aigTab==='tutor'?'block':'none')+'">';
  h+=renderAigTutor();
  h+='</div>';
  /* History pane */
  h+='<div class="aig-pane" id="aigHistory" style="display:'+(aigTab==='history'?'block':'none')+'">';
  h+=renderAigHistory();
  h+='</div>';
  h+='</div>';
  c.innerHTML=h;
  
  /* AI Settings button */
  document.getElementById('aiSettingsBtn').onclick=showAiSettings;
  
  /* Tab switching */
  c.querySelectorAll('#aigTabs .tab-btn').forEach(function(btn){
    btn.onclick=function(){
      aigTab=btn.dataset.aig;
      c.querySelectorAll('#aigTabs .tab-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      document.getElementById('aigGenerate').style.display=aigTab==='generate'?'block':'none';
      document.getElementById('aigTutor').style.display=aigTab==='tutor'?'block':'none';
      document.getElementById('aigHistory').style.display=aigTab==='history'?'block':'none';
      if(aigTab==='tutor')wireAigTutor(c);
    };
  });
  wireAigForm(c);
  if(aigTab==='tutor')wireAigTutor(c);
};

/* ---- AI Settings Modal ---- */
function showAiSettings(){
  var h='<h3 style="font-weight:700;margin-bottom:16px"><i class="fas fa-cog"></i> AI Settings</h3>';
  
  h+='<div style="background:var(--bg2);padding:14px;border-radius:8px;margin-bottom:16px">';
  h+='<div style="font-size:13px;color:var(--tx2);margin-bottom:8px">Current Provider: <strong>OpenRouter (Arcee Trinity Large)</strong></div>';
  h+='<div style="font-size:13px;color:var(--ok)"><i class="fas fa-check-circle"></i> API Key configured on server (Vercel Environment Variables)</div>';
  h+='</div>';
  
  h+='<div style="background:rgba(6,182,212,.1);border-left:3px solid var(--ac);padding:12px;border-radius:6px;font-size:13px;margin-bottom:16px">';
  h+='<div style="font-weight:600;margin-bottom:4px"><i class="fas fa-info-circle"></i> About OpenRouter Integration</div>';
  h+='<div style="line-height:1.5">This app uses OpenRouter API with the <strong>Z.ai: GLM 4.5 Air</strong> model (free tier). Your API key is securely stored in Vercel Environment Variables and never exposed to the browser.</div>';
  h+='<ul style="margin:8px 0 0 20px;line-height:1.8">';
  h+='<li>Model: <strong>z-ai/glm-4.5-air:free</strong></li>';
  h+='<li>API calls are routed through <code>/api/chat</code> backend</li>';
  h+='<li>No client-side API key storage needed</li>';
  h+='</ul></div>';
  
  h+='<div style="background:rgba(245,158,11,.1);border-left:3px solid var(--wn);padding:12px;border-radius:6px;font-size:13px;margin-bottom:16px">';
  h+='<div style="font-weight:600;margin-bottom:4px"><i class="fas fa-shield-alt"></i> Security & Setup</div>';
  h+='<div style="line-height:1.5">To update your API key, add it to Vercel Environment Variables:</div>';
  h+='<ol style="margin:8px 0 0 20px;line-height:1.8">';
  h+='<li>Go to your Vercel project dashboard</li>';
  h+='<li>Navigate to Settings → Environment Variables</li>';
  h+='<li>Add/update: <code>OPENROUTER_API_KEY</code></li>';
  h+='<li>Get your key from: <a href="https://openrouter.ai/keys" target="_blank" style="color:var(--pr)">openrouter.ai/keys</a></li>';
  h+='</ol></div>';
  
  h+='<div style="display:flex;gap:10px;justify-content:flex-end">';
  h+='<button class="btn btn-p" onclick="Modal.hide()">Got it</button>';
  h+='</div>';
  
  Modal.show(h);
}

/* ---- AI Gen: Generate Form ---- */
function renderAigForm(){
  var h='<div class="card"><div class="card-hdr"><div class="card-t"><i class="fas fa-magic"></i>Generate Questions</div></div><div class="card-body">';
  h+='<div class="form-grp"><label class="form-lbl">Question Type</label><div class="type-cards" id="aigTypeCards">';
  h+='<div class="type-card sel" data-gtype="mcq"><i class="fas fa-list-ol"></i><div class="type-card-t">MCQ</div><div class="type-card-w">Multiple choice</div></div>';
  h+='<div class="type-card" data-gtype="longq"><i class="fas fa-pen-fancy"></i><div class="type-card-t">Long Q</div><div class="type-card-w">Structured</div></div>';
  h+='</div></div>';
  h+='<div class="form-grp"><label class="form-lbl">Topic</label><select class="form-sel" id="aigTopic"><option value="any">Any Topic</option>';
  TOPICS.forEach(function(t){h+='<option value="'+t.id+'">'+t.name+'</option>';});
  h+='</select></div>';
  h+='<div class="form-grp"><label class="form-lbl">Difficulty</label><select class="form-sel" id="aigDiff"><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>';
  h+='<div class="form-grp"><label class="form-lbl">Number of Questions</label><select class="form-sel" id="aigCount"><option value="3">3 Questions</option><option value="5" selected>5 Questions</option><option value="10">10 Questions</option></select></div>';
  h+='<div class="form-grp"><label class="form-lbl">Focus Area (optional)</label><input class="form-inp" id="aigFocus" placeholder="e.g. price elasticity, fiscal policy..."></div>';
  h+='<button class="btn btn-p btn-lg" style="width:100%;justify-content:center" id="aigGenBtn"><i class="fas fa-bolt"></i>Generate with AI</button>';
  h+='</div></div>';
  h+='<div id="aigOutput" style="margin-top:20px"></div>';
  return h;
}

function wireAigForm(c){
  c.querySelectorAll('#aigTypeCards .type-card').forEach(function(el){
    el.onclick=function(){
      c.querySelectorAll('#aigTypeCards .type-card').forEach(function(e){e.classList.remove('sel');});
      el.classList.add('sel');
    };
  });
  var genBtn=document.getElementById('aigGenBtn');
  if(genBtn)genBtn.onclick=function(){startAigGeneration(c);};
}

function buildGenPrompt(type,topic,diff,count,focus){
  var topicName=topic==='any'?'any HKDSE Economics topic':(topicById(topic)?topicById(topic).name:topic);
  var p='You are an expert HKDSE Economics question writer. Generate '+count+' '+type.toUpperCase()+' questions.\n';
  p+='Topic: '+topicName+'\nDifficulty: '+diff+'\n';
  if(focus)p+='Focus area: '+focus+'\n';
  if(type==='mcq'){
    p+='Return ONLY a JSON array. Each object: {"q":"question text","opts":["A","B","C","D"],"ans":0,"exp":"explanation","topic":"'+topic+'"}\n';
    p+='ans is 0-indexed. Make distractors plausible. Include brief explanation.';
  }else{
    p+='Return ONLY a JSON array. Each object: {"title":"title","parts":[{"label":"(a)","text":"question","marks":4,"sampleAns":"model answer"}],"marks":12,"topic":"'+topic+'"}\n';
    p+='Each question should have 2-3 parts totalling the marks. Include model answers.';
  }
  return p;
}

function startAigGeneration(c){
  var typeEl=c.querySelector('#aigTypeCards .type-card.sel');
  var type=typeEl?typeEl.dataset.gtype:'mcq';
  var topicEl=document.getElementById('aigTopic');
  var diffEl=document.getElementById('aigDiff');
  var countEl=document.getElementById('aigCount');
  var focusEl=document.getElementById('aigFocus');

  var topic=topicEl?topicEl.value:'any';
  var diff=diffEl?diffEl.value:'mixed';
  var count=countEl?countEl.value:'5';
  var focus=focusEl?focusEl.value.trim():'';

  /* Build the prompt string */
  var prompt=buildGenPrompt(type,topic,diff,count,focus);

  /* Validate prompt is not empty before calling AI */
  if(!prompt||!prompt.trim()){
    console.error('startAigGeneration: prompt is empty, aborting');
    toast('Error: Could not build generation prompt. Please try again.','err');
    return;
  }

  console.log('startAigGeneration: prompt built, type='+type+', length='+prompt.length);

  var output=document.getElementById('aigOutput');
  output.innerHTML='<div class="card"><div class="card-body" style="text-align:center;padding:40px"><div class="spinner"></div><div style="font-weight:600;margin-bottom:4px">Generating '+count+' '+type.toUpperCase()+' questions...</div><div style="font-size:13px;color:var(--tx3)">This may take a moment</div></div></div>';
  var genBtn=document.getElementById('aigGenBtn');
  if(genBtn)genBtn.disabled=true;

  /* Call AI — prompt is the first argument (string), options is the second argument (object) */
  window.AIHelper.callAI(prompt, {
    systemPrompt: 'You are an expert HKDSE Economics question writer. Return valid JSON only.',
    maxTokens: 3000,
    temperature: 0.8
  }).then(function(content){
    if(genBtn)genBtn.disabled=false;
    parseAndRenderGenResults(output,content,type);
    S.aiGen.history.push({type:type,topic:topic,diff:diff,count:count,focus:focus,content:content,ts:Date.now()});
  }).catch(function(err){
    console.error('startAigGeneration: AI call failed:', err.message);
    output.innerHTML='<div class="card"><div class="card-body" style="color:var(--no);text-align:center;padding:20px"><i class="fas fa-exclamation-triangle" style="font-size:24px;margin-bottom:8px"></i><div>Error: '+esc(err.message)+'</div><div style="font-size:12px;color:var(--tx3);margin-top:8px">Check the browser console for details</div></div></div>';
    if(genBtn)genBtn.disabled=false;
  });
}

function parseAndRenderGenResults(container,raw,type){
  var json=raw;
  /* strip markdown fences */
  var m=json.match(/```(?:json)?\s*([\s\S]*?)```/);
  if(m)json=m[1];
  /* find array bounds */
  var s2=json.indexOf('[');var e2=json.lastIndexOf(']');
  if(s2>=0&&e2>s2)json=json.substring(s2,e2+1);
  try{
    var arr=JSON.parse(json);
    if(!Array.isArray(arr)||!arr.length)throw new Error('Empty result');
    if(type==='mcq')renderGenMcq(container,arr);
    else renderGenLongQ(container,arr);
  }catch(err2){
    container.innerHTML='<div class="card"><div class="card-body"><div style="font-weight:700;color:var(--wn);margin-bottom:8px"><i class="fas fa-exclamation-triangle"></i> Could not parse AI response</div><pre style="white-space:pre-wrap;font-size:12px;max-height:300px;overflow:auto;background:var(--bg2);padding:12px;border-radius:8px">'+esc(raw)+'</pre></div></div>';
  }
}

function renderGenMcq(container,arr){
  var letters=['A','B','C','D'];
  var h='';
  arr.forEach(function(q,qi){
    h+='<div class="card" style="margin-bottom:14px"><div class="card-body">';
    h+='<div style="font-weight:700;font-size:13px;color:var(--pr);margin-bottom:8px">Q'+(qi+1)+'</div>';
    h+='<p style="font-size:14px;font-weight:600;line-height:1.6;margin-bottom:12px">'+esc(q.q)+'</p>';
    h+='<div class="mcq-opts">';
    var opts=q.opts||q.options||[];
    for(var i=0;i<opts.length;i++){
      h+='<div class="mcq-opt" data-qi="'+qi+'" data-oi="'+i+'" style="cursor:pointer"><div class="opt-let">'+letters[i]+'</div><div class="opt-tx">'+esc(opts[i])+'</div></div>';
    }
    h+='</div>';
    h+='<div class="ans-sec" data-ans="'+qi+'" style="display:none"><div style="font-weight:700;color:var(--ok);margin-bottom:4px;font-size:13px"><i class="fas fa-check-circle"></i> Answer: '+letters[q.ans||0]+'</div><div style="font-size:13px;line-height:1.5">'+esc(q.exp||q.explanation||'')+'</div></div>';
    h+='</div></div>';
  });
  container.innerHTML=h;
  /* click-to-reveal */
  container.querySelectorAll('.mcq-opt').forEach(function(el){
    el.onclick=function(){
      var qi2=el.dataset.qi;var oi=parseInt(el.dataset.oi,10);
      var q2=arr[qi2];var correct=(q2.ans||0)===oi;
      var card=el.closest('.card-body');
      card.querySelectorAll('.mcq-opt').forEach(function(o){o.classList.add('dis');});
      if(correct)el.classList.add('c-ok');
      else{el.classList.add('c-wrong');card.querySelectorAll('.mcq-opt')[q2.ans||0].classList.add('c-ok');}
      card.querySelector('[data-ans="'+qi2+'"]').style.display='block';
    };
  });
}

function renderGenLongQ(container,arr){
  var h='';
  arr.forEach(function(q,qi){
    h+='<div class="card" style="margin-bottom:14px"><div class="card-body">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span class="badge badge-p">Q'+(qi+1)+'</span><span style="font-weight:700;font-size:15px">'+esc(q.title||'Question '+(qi+1))+'</span><span class="badge" style="background:var(--bg2);color:var(--tx3)">'+q.marks+' marks</span></div>';
    (q.parts||[]).forEach(function(p){
      h+='<div style="margin-bottom:14px"><div style="font-weight:700;font-size:13px;margin-bottom:4px">'+esc(p.label)+' <span style="color:var(--tx3);font-weight:500">['+p.marks+' marks]</span></div>';
      h+='<p style="font-size:13px;line-height:1.6;margin-bottom:6px">'+esc(p.text)+'</p>';
      if(p.sampleAns){
        h+='<div class="accord-head" data-toggle="sa-'+qi+'-'+p.label+'" style="background:var(--bg2);border-radius:8px;margin-top:6px;font-size:13px"><i class="fas fa-chevron-right" style="font-size:10px;transition:transform .2s"></i>Sample Answer</div>';
        h+='<div class="accord-body" id="sa-'+qi+'-'+p.label+'" style="background:var(--bg2);border-radius:0 0 8px 8px;font-size:13px">'+esc(p.sampleAns)+'</div>';
      }
    });
    h+='</div></div>';
  });
  container.innerHTML=h;
  container.querySelectorAll('.accord-head').forEach(function(hd){
    hd.onclick=function(){
      var bd=document.getElementById(hd.dataset.toggle);
      if(bd){bd.classList.toggle('open');hd.querySelector('i').style.transform=bd.classList.contains('open')?'rotate(90deg)':'rotate(0)';}
    };
  });
}

/* ---- AI Gen: Tutor Chat ---- */
var tutorMsgs=[];
function renderAigTutor(){
  var h='<div class="card" style="display:flex;flex-direction:column;height:60vh;max-height:500px">';
  h+='<div class="card-hdr" style="flex-shrink:0"><div class="card-t"><i class="fas fa-chalkboard-teacher"></i>AI Economics Tutor</div></div>';
  h+='<div id="tutorChat" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px">';
  if(!tutorMsgs.length){
    h+='<div style="text-align:center;padding:30px;color:var(--tx3)"><i class="fas fa-comments" style="font-size:32px;margin-bottom:10px;display:block"></i><div style="font-weight:600;margin-bottom:4px">Ask anything about HKDSE Economics</div><div style="font-size:13px">e.g. Explain price elasticity, What causes inflation?</div></div>';
  }else{
    tutorMsgs.forEach(function(m2){
      var isUser=m2.role==='user';
      h+='<div style="display:flex;justify-content:'+(isUser?'flex-end':'flex-start')+';gap:8px"><div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.6;'+(isUser?'background:var(--pr);color:#fff':'background:var(--bg2);color:var(--tx1)')+'">'+( isUser?esc(m2.text):renderMd(m2.text))+'</div></div>';
    });
  }
  h+='</div>';
  h+='<div style="flex-shrink:0;padding:12px;border-top:1px solid var(--bd);display:flex;gap:8px">';
  h+='<input class="form-inp" id="tutorInput" placeholder="Ask a question..." style="flex:1;font-size:16px">';
  h+='<button class="btn btn-p" id="tutorSend"><i class="fas fa-paper-plane"></i></button>';
  h+='</div>';
  /* suggestion chips */
  h+='<div style="padding:0 12px 12px;display:flex;flex-wrap:wrap;gap:6px">';
  ['Explain opportunity cost','What is GDP?','Causes of inflation','Demand vs supply','Fiscal vs monetary policy'].forEach(function(s5){
    h+='<button class="chip tutor-chip">'+s5+'</button>';
  });
  h+='</div></div>';
  return h;
}

function wireAigTutor(c){
  var sendBtn=document.getElementById('tutorSend');
  var inp=document.getElementById('tutorInput');
  if(!sendBtn||!inp)return;
  function doSend(){
    var txt=inp.value.trim();
    if(!txt){
      toast('Please type a question first','info');
      return;
    }
    inp.value='';
    tutorMsgs.push({role:'user',text:txt});
    tutorMsgs.push({role:'ai',text:''});
    refreshTutorChat();
    
    /* Build conversation context for the AI */
    var conversationContext='';
    tutorMsgs.slice(0,-1).forEach(function(m2){
      if(m2.role==='user')conversationContext+='Student: '+m2.text+'\n';
      else if(m2.text)conversationContext+='Tutor: '+m2.text+'\n';
    });
    
    /* Build the prompt string — must be non-empty */
    var prompt=conversationContext+'Student: '+txt+'\nTutor:';

    console.log('wireAigTutor.doSend: prompt built, length='+prompt.length);

    /* Call AI — prompt is the first argument (string), options is the second argument (object) */
    window.AIHelper.callAI(prompt, {
      systemPrompt: "You are an inspiring HKDSE Economics mentor. Your tone is professional and authoritative, but stays high-energy! Avoid 'Wall of Text' syndrome:\n\n" +
    "1. **Clean Spacing**: Use double line breaks between EVERY paragraph and section for maximum readability.\n\n" +
    "2. **The 'Superpower' Hook**: Briefly explain why a concept (like Opportunity Cost) is a 'superpower' for exams and life decisions.\n\n" +
    "3. **Inspirational Tone**: Use encouraging phrases (e.g., 'Spot on!', 'Let's master this!') while maintaining strict HKEAA academic standards.\n\n" +
    "4. **Visual Scannability**: Use **Bold Headers** for titles and simple dashes (-) for bullet points.\n\n" +
    "5. **Growth Mindset**: End with a quick 1-sentence 'Econ Brain Teaser' to keep them thinking.",
      maxTokens: 1500,
      temperature: 0.7
    }).then(function(response){
      if(tutorMsgs.length>0){
        tutorMsgs[tutorMsgs.length-1].text=response;
        refreshTutorChat();
      }
    }).catch(function(err){
      console.error('wireAigTutor.doSend: AI call failed:', err.message);
      if(tutorMsgs.length>0){
        tutorMsgs[tutorMsgs.length-1].text='Error: '+err.message;
        refreshTutorChat();
      }
    });
  }
  sendBtn.onclick=doSend;
  inp.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();doSend();}};
  c.querySelectorAll('.tutor-chip').forEach(function(ch){
    ch.onclick=function(){inp.value=ch.textContent;doSend();};
  });
}

function refreshTutorChat(){
  var chat=document.getElementById('tutorChat');if(!chat)return;
  var h2='';
  tutorMsgs.forEach(function(m2){
    var isUser=m2.role==='user';
    h2+='<div style="display:flex;justify-content:'+(isUser?'flex-end':'flex-start')+';gap:8px"><div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.6;'+(isUser?'background:var(--pr);color:#fff':'background:var(--bg2);color:var(--tx1)')+'">'+( isUser?esc(m2.text):(m2.text?renderMd(m2.text):'<div class="spinner" style="width:20px;height:20px;margin:0"></div>'))+'</div></div>';
  });
  chat.innerHTML=h2;
  chat.scrollTop=chat.scrollHeight;
}

/* ---- AI Gen: History ---- */
function renderAigHistory(){
  if(!S.aiGen.history.length){
    return '<div class="empty-state"><div class="empty-ic"><i class="fas fa-history"></i></div><div class="empty-t">No History</div><div class="empty-tx">Generated questions will appear here.</div></div>';
  }
  var h='';
  S.aiGen.history.slice().reverse().forEach(function(item,idx){
    var tp=item.topic==='any'?'Any Topic':(topicById(item.topic)?topicById(item.topic).name:item.topic);
    h+='<div class="card" style="margin-bottom:12px"><div class="card-body" style="display:flex;align-items:center;gap:14px">';
    h+='<div style="width:42px;height:42px;border-radius:10px;background:var(--ok)18;display:flex;align-items:center;justify-content:center"><i class="fas '+(item.type==='mcq'?'fa-list-ol':'fa-pen-fancy')+'" style="color:var(--ok);font-size:16px"></i></div>';
    h+='<div style="flex:1"><div style="font-weight:700;font-size:14px">'+item.count+' '+item.type.toUpperCase()+' &bull; '+tp+'</div>';
    h+='<div style="font-size:12px;color:var(--tx3)">'+fmtDate(item.ts)+' &bull; '+item.diff+(item.focus?' &bull; '+esc(item.focus):'')+'</div></div>';
    h+='<button class="btn btn-sm btn-s aig-hist-view" data-hidx="'+(S.aiGen.history.length-1-idx)+'"><i class="fas fa-eye"></i></button>';
    h+='</div></div>';
  });
  return '<div id="aigHistList">'+h+'</div><div id="aigHistDetail"></div>';
}
