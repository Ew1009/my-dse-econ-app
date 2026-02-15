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
