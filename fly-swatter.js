/* Fly Swatter mini-game v2 — TEST COPY ONLY (solitaire-fly-test-v2).
   Standalone overlay: the solitaire engine/UI code is NOT modified.
   Board lock is a shield div over the board, not a change to card handlers,
   so the frozen hand resumes exactly. No Word Whomp, no streak goals,
   no lives, no fail screens, no punishment for missing.
   Design: ~/workspace/goals/mom-s-solitaire-game/files/fly-swatter-v2-design-2026-11-02.md
   HIT POINT (single, documented): the swatter is positioned so its head
   centre IS the pointer point (element offset -64/-50), and hit distance
   is measured from the pointer point. No competing hit point exists. */
(function(){
"use strict";
var GAME_SECONDS = 120;
var state = { mode:false, teaser:false, score:0, swats:0, streak:0, best:0,
  timeLeft:GAME_SECONDS, flies:[], timers:[], raf:0, song:null, buzz:null,
  buzzSynth:null, buzzCtx:null, startAt:0, lastGoldAt:-999, sleepyCount:0,
  dda:false, endReason:"", cheerCount:0 };
var TAUNTS = ["Missed me!","Too slow!","Nyah nyah!","Ha! Missed!"];
var CHEERS = ["You got it!","Take THAT, flies!","Nice one!","Swat-tastic!"];
var TYPES = {
  regular:{img:"assets/fly/fly-regular-128.png", pts:10, size:64, dart:140, name:"regular"},
  fast:{img:"assets/fly/fly-fast-128.png", pts:25, size:64, dart:220, name:"fast"},
  bonus:{img:"assets/fly/fly-bonus-128.png", pts:50, size:72, dart:160, name:"bonus"},
  sleepy:{img:"assets/fly/fly-regular-128.png", pts:5, size:80, dart:100, name:"sleepy"}
};
/* Time-gated phases: [untilSec, spawnMs, maxFlies, regular%, fast%, bonus%, regSpd, fastSpd, bonusSpd] */
var PHASES = [
  [30, 2000, 1, 85, 10, 5, 1.0, 1.5, 1.2],
  [60, 1750, 2, 75, 17, 8, 1.0, 1.8, 1.4],
  [90, 1500, 3, 70, 20, 10, 1.1, 2.0, 1.4],
  [120, 1250, 3, 65, 22, 13, 1.1, 2.0, 1.4]
];
function phaseFor(elapsed){
  for(var i=0;i<PHASES.length;i++){ if(elapsed < PHASES[i][0]) return PHASES[i]; }
  return PHASES[PHASES.length-1];
}
function elapsed(){ return state.mode ? (performance.now()-state.startAt)/1000 : 0; }
function phaseSpeed(typeName){
  var p = phaseFor(elapsed());
  var idx = typeName==="fast"?7:(typeName==="bonus"?8:(typeName==="sleepy"?6:6));
  var sp = typeName==="sleepy" ? 0.7 : p[idx];
  if(state.dda) sp *= 0.9;
  return sp;
}
function $(id){ return document.getElementById(id); }
function crappyUnlocked(){
  try{ if(window.ui && typeof window.ui.poopArrived==="function" && window.ui.poopArrived()) return true; }catch(e){}
  try{ return JSON.parse(localStorage.getItem("ms_poop_arrived")||"false")===true; }catch(e){ return false; }
}
function later(fn,ms){ var t=setTimeout(fn,ms); state.timers.push(t); return t; }
function clearTimers(){ state.timers.forEach(clearTimeout); state.timers=[]; }
function injectCSS(){
  if($("fly-css")) return;
  var s=document.createElement("style"); s.id="fly-css"; s.textContent=[
    "#fly-shield{position:fixed;inset:0;z-index:190;background:rgba(10,20,10,.35);cursor:crosshair;}",
    "#fly-hud{position:fixed;left:0;right:0;top:0;z-index:220;display:flex;gap:12px;align-items:center;justify-content:center;padding:10px;background:rgba(0,0,0,.55);color:#fff;font-family:Georgia,serif;font-weight:700;}",
    "#fly-hud .fly-score{font-size:min(34px,7vw);} #fly-hud .fly-time{font-size:min(30px,6vw);color:#ffe699;}",
    "#fly-hud .fly-time.fly-urgent{animation:flyPulse .5s ease-in-out infinite;}",
    "@keyframes flyPulse{50%{transform:scale(1.25);color:#ffd75e;}}",
    "#fly-hud button{font-size:20px;font-weight:700;padding:10px 18px;border-radius:12px;border:2px solid #4a3418;background:#ffe699;color:#4a3418;cursor:pointer;}",
    "#fly-swatter{position:fixed;top:0;left:0;z-index:215;width:128px;height:160px;pointer-events:none;transform:translate(-9999px,-9999px);transition:transform .05s linear;}",
    "#fly-swatter img{width:100%;height:160px;object-fit:contain;display:block;}",
    "#fly-swatter.smacked{filter:brightness(.85);} #fly-swatter.smacked img{transform:scaleY(.75) rotate(8deg);}",
    ".fly-bug2{position:fixed;top:0;left:0;z-index:212;pointer-events:none;}",
    ".fly-bug2 img{width:100%;height:100%;display:block;animation:flyFlap .12s ease-in-out infinite alternate;}",
    "@keyframes flyFlap{from{transform:scaleY(1);}to{transform:scaleY(.88);}}",
    ".fly-bug2.bonus img{filter:drop-shadow(0 0 10px #ffd75e) drop-shadow(0 0 22px #ffd75e);}",
    ".fly-bug2.fly-rush img{filter:drop-shadow(0 0 8px #ffd75e);}",
    ".fly-taunt{position:fixed;z-index:225;pointer-events:none;background:#fffbe8;color:#4a3418;font-family:Georgia,serif;font-weight:700;font-size:22px;padding:8px 12px;border-radius:12px;border:2px solid #4a3418;}",
    "#fly-announce{position:fixed;inset:0;z-index:230;display:flex;align-items:center;justify-content:center;pointer-events:none;}",
    "#fly-announce span{font-family:Georgia,serif;font-weight:900;font-size:min(64px,10vw);color:#ffe699;text-align:center;text-shadow:0 6px 24px rgba(0,0,0,.8);transform:rotate(-4deg);}",
    "#fly-entry{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:210;text-align:center;cursor:pointer;}",
    "#fly-entry img{width:96px;height:96px;display:block;}",
    "#fly-entry .fly-ready{display:none;font-family:Georgia,serif;font-weight:700;font-size:22px;color:#ffe699;background:rgba(0,0,0,.7);padding:6px 12px;border-radius:12px;margin-bottom:6px;}",
    "#fly-entry:hover .fly-ready,#fly-entry:focus .fly-ready{display:block;}",
    "#fly-entry:hover img{filter:drop-shadow(0 0 14px #ffd75e);}",
    "#fly-end{position:fixed;inset:0;z-index:230;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);}",
    "#fly-end .fly-card{background:#fffbe8;color:#4a3418;font-family:Georgia,serif;border:3px solid #4a3418;border-radius:18px;padding:24px;max-width:min(520px,90vw);text-align:center;}",
    "#fly-end h2{font-size:min(40px,8vw);margin:0 0 8px;} #fly-end p{font-size:22px;margin:8px 0;}",
    "#fly-end button{font-size:22px;font-weight:700;padding:12px 20px;margin:8px;border-radius:12px;border:2px solid #4a3418;background:#ffe699;color:#4a3418;cursor:pointer;}",
    "#poopbuddy.fly-panic{animation:flyPanic .5s ease-in-out infinite !important;}",
    "@keyframes flyPanic{0%,100%{transform:rotate(0) translateY(0);}25%{transform:rotate(-14deg) translateY(-8px);}50%{transform:rotate(12deg) translateY(0);}75%{transform:rotate(-8deg) translateY(-6px);}}",
    ".fly-stink{position:absolute;left:50%;top:-18px;transform:translateX(-50%);z-index:96;pointer-events:none;color:#7ed957;font-size:26px;font-weight:900;letter-spacing:2px;animation:flyStink 3s ease-out forwards;text-shadow:0 0 6px #2e7d32;}",
    "@keyframes flyStink{0%{opacity:0;transform:translateX(-50%) translateY(8px);}20%{opacity:1;}100%{opacity:0;transform:translateX(-50%) translateY(-26px);}}"
  ].join("\n"); document.head.appendChild(s);
}
/* --- audio: real buzz loop primary, synth backup only on audio error --- */
function playSfx(name, vol, rate){
  try{
    var a=new Audio("assets/fly/"+name+".mp3");
    a.volume=(vol===undefined?0.8:vol);
    if(rate) a.playbackRate=rate;
    var p=a.play(); if(p&&p.catch) p.catch(function(){});
    return a;
  }catch(e){ return null; }
}
function startBuzz(){
  if(state.buzz) return;
  try{
    var a=new Audio("assets/fly/fly-buzz-loop.mp3");
    a.loop=true; a.volume=0.35; a.id="fly-buzz";
    a.addEventListener("error", function(){ startBuzzSynth(); });
    document.body.appendChild(a); state.buzz=a;
    var p=a.play(); if(p&&p.catch) p.catch(function(){ startBuzzSynth(); });
    /* audibility check hook: test can read state.buzz.paused / currentTime */
  }catch(e){ startBuzzSynth(); }
}
function startBuzzSynth(){
  if(state.buzzSynth || state.buzzCtx) return;
  try{
    var Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return;
    var ctx=new Ctx(); if(ctx.state==="suspended") ctx.resume();
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type="sawtooth"; o.frequency.value=170; g.gain.value=0.015;
    o.connect(g); g.connect(ctx.destination); o.start();
    state.buzzCtx=ctx; state.buzzSynth=o;
  }catch(e){}
}
function stopBuzz(){
  try{ if(state.buzz){ state.buzz.pause(); state.buzz.currentTime=0; state.buzz.remove(); } }catch(e){}
  try{ if(state.buzzSynth) state.buzzSynth.stop(); }catch(e){}
  try{ if(state.buzzCtx) state.buzzCtx.close(); }catch(e){}
  state.buzz=null; state.buzzSynth=null; state.buzzCtx=null;
}
function stopAllSounds(){
  stopBuzz();
  if(state.song){ try{state.song.pause(); state.song.currentTime=0; state.song.remove();}catch(e){} state.song=null; }
}
function showStink(){
  try{
    var b=$("poopbuddy"); if(!b || b.style.display==="none") return;
    var old=b.querySelector(".fly-stink"); if(old) old.remove();
    var d=document.createElement("div"); d.className="fly-stink"; d.textContent="~~~";
    b.appendChild(d);
    later(function(){ try{d.remove();}catch(e){} },3000);
  }catch(e){}
}
function spawnFly(typeName, teaser){
  var t=TYPES[typeName]||TYPES.regular;
  var el=document.createElement("div");
  el.className="fly-bug2 fly-live"+(typeName==="bonus"?" bonus":"");
  el.dataset.flyType=typeName;
  el.style.width=t.size+"px"; el.style.height=t.size+"px";
  el.style.top="0px"; el.style.left="0px";
  var img=document.createElement("img"); img.src=t.img; img.alt=typeName+" fly"; el.appendChild(img);
  document.body.appendChild(el);
  /* Edge entry: flies come in from the left or right edge, never the centre. */
  var fromLeft = Math.random()<0.5;
  var x = fromLeft ? 40+Math.random()*40 : Math.max(80, innerWidth-t.size-80);
  var y = 70+Math.random()*(Math.max(200,innerHeight-t.size-120));
  var f={el:el, type:t, typeName:typeName, x:x, y:y, px:x, py:y,
    dartUntil:0, teaser:!!teaser, bornAt:performance.now(), burstSeed:Math.random()*700,
    id:(state.flySeq=(state.flySeq||0)+1)};
  state.flies.push(f);
  if(typeName==="bonus") state.lastGoldAt=elapsed();
  return f;
}
function removeFly(f){
  var i=state.flies.indexOf(f); if(i>=0) state.flies.splice(i,1);
  try{ f.el.remove(); }catch(e){}
}
function showTaunt(x,y,text){
  document.querySelectorAll(".fly-taunt").forEach(function(e){e.remove();});
  var d=document.createElement("div"); d.className="fly-taunt";
  d.textContent=text||TAUNTS[(Math.random()*TAUNTS.length)|0];
  d.style.left=Math.max(8,Math.min(innerWidth-160,x))+"px";
  d.style.top=Math.max(60,y-50)+"px"; document.body.appendChild(d);
  later(function(){ try{d.remove();}catch(e){} },1300);
}
function splatAt(x,y,pts){
  var d=document.createElement("div"); d.className="fly-bug2 fly-splat";
  d.style.width="80px"; d.style.height="60px"; d.style.top="0px"; d.style.left="0px";
  d.style.transform="translate("+(x-40)+"px,"+(y-30)+"px)";
  var img=document.createElement("img"); img.src="assets/fly/splat-128.png"; img.alt="Splat"; d.appendChild(img);
  var t=document.createElement("div"); t.className="fly-taunt fly-splat-text"; t.textContent="SPLAT! +"+pts;
  t.style.left=(x-40)+"px"; t.style.top=(y-70)+"px";
  document.body.appendChild(d); document.body.appendChild(t);
  later(function(){ try{d.remove();t.remove();}catch(e){} },1500);
}
function updateHUD(){
  var s=$("fly-score"), w=$("fly-swats"), tm=$("fly-time");
  if(s) s.textContent="Score: "+state.score;
  if(w) w.textContent="Swats: "+state.swats;
  if(tm){ var m=Math.floor(state.timeLeft/60), sec=state.timeLeft%60;
    tm.textContent=m+":"+(sec<10?"0":"")+sec;
    if(state.timeLeft<=10) tm.classList.add("fly-urgent"); }
}
function flyLoop(){
  if(!state.mode && !state.teaser) return;
  var now=performance.now();
  var i=0;
  while(i<state.flies.length){
    var f=state.flies[i];
    /* Soft lifetime: ~25 s in mode, then wander off with a taunt. Not a miss. */
    if(state.mode && now-f.bornAt>25000){
      var cx=f.x+f.type.size/2, cy=f.y+f.type.size/2;
      removeFly(f); showTaunt(cx,cy,"See ya!"); continue;
    }
    if(now < f.dartUntil){ i++; continue; }
    var t=now/1000;
    var near=false;
    if(state.swatterPos){
      var dx=state.swatterPos.x-(f.x+f.type.size/2), dy=state.swatterPos.y-(f.y+f.type.size/2);
      if(Math.hypot(dx,dy)<150) near=true;
    }
    var sp=phaseSpeed(f.typeName)*(near?2.0:1.0);
    var nx=0, ny=0;
    if(f.typeName==="fast"){
      /* Dart bursts: fast ~0.4 s, pause ~0.3 s, repeat. */
      var cycle=(now+f.burstSeed)%700;
      if(cycle<400){ nx=(Math.sin(1.2*t)+Math.sin(2.7*t)*0.5)*sp; ny=(Math.cos(0.9*t)+Math.cos(3.1*t)*0.5)*sp; }
    } else if(f.typeName==="bonus"){
      /* Slow wide arcs: larger amplitude, lower frequency. */
      nx=Math.sin(0.6*t)*1.5*sp; ny=Math.cos(0.5*t)*1.2*sp;
    } else {
      nx=(Math.sin(1.2*t)+Math.sin(2.7*t)*0.5)*sp;
      ny=(Math.cos(0.9*t)+Math.cos(3.1*t)*0.5)*sp;
    }
    f.px=f.x; f.py=f.y;
    f.x=Math.max(40,Math.min(innerWidth-f.type.size-20,f.x+nx));
    f.y=Math.max(60,Math.min(innerHeight-f.type.size-20,f.y+ny));
    var ang=Math.atan2(f.y-f.py,f.x-f.px)*180/Math.PI+90;
    var rush = state.mode && state.timeLeft<=10 ? " fly-rush" : "";
    f.el.className="fly-bug2 fly-live"+(f.typeName==="bonus"?" bonus":"")+rush;
    f.el.style.transform="translate("+f.x+"px,"+f.y+"px) rotate("+ang+"deg)";
    i++;
  }
  state.raf=requestAnimationFrame(flyLoop);
}
function pickType(){
  var el=elapsed(), p=phaseFor(el);
  var hasBonus=state.flies.some(function(f){return f.typeName==="bonus";});
  /* Sleepy fly: once or twice per run, after 60 s, as a confidence builder. */
  if(el>60 && state.sleepyCount<2 && Math.random()<0.05){ state.sleepyCount++; return "sleepy"; }
  var r=Math.random()*100;
  if(r < p[5] && !hasBonus) return "bonus";
  if(r < p[5]+p[4]) return "fast";
  return "regular";
}
function spawnTimer(){
  if(!state.mode) return;
  var el=elapsed(), p=phaseFor(el);
  /* Quiet DDA safety net: 0 swats after 45 s -> speeds -10%, extra regular. */
  if(el>=45 && state.swats===0 && !state.dda){
    state.dda=true;
    if(state.flies.length<4) spawnFly("regular",false);
  }
  var max = el>=15 ? p[2] : 1;
  /* Gold pity: no gold in 45 s, or last 10 s with no gold on screen -> force one. */
  var hasBonus=state.flies.some(function(f){return f.typeName==="bonus";});
  var goldDue = (el-state.lastGoldAt>45) || (state.timeLeft<=10 && !hasBonus);
  if(goldDue && !hasBonus && state.flies.length<4){
    spawnFly("bonus",false);
  } else if(state.flies.length<max){
    spawnFly(pickType(),false);
  }
  later(spawnTimer, p[1]);
}
function startGame(){
  if(state.mode) return;
  endTeaser(true);
  state.mode=true; state.score=0; state.swats=0; state.streak=0; state.sleepyCount=0;
  state.dda=false; state.timeLeft=GAME_SECONDS; state.startAt=performance.now();
  state.lastGoldAt=0; state.endReason="";
  injectCSS();
  var shield=document.createElement("div"); shield.id="fly-shield"; document.body.appendChild(shield);
  var hud=document.createElement("div"); hud.id="fly-hud";
  hud.innerHTML='<span class="fly-score" id="fly-score">Score: 0</span><span id="fly-swats">Swats: 0</span><span class="fly-time" id="fly-time">2:00</span><button id="fly-back" type="button">Back to cards</button>';
  document.body.appendChild(hud);
  $("fly-back").addEventListener("click",function(e){ e.stopPropagation(); endGame(false); });
  var sw=document.createElement("div"); sw.id="fly-swatter";
  sw.innerHTML='<img src="assets/fly/swatter-128.png" alt="Fly swatter">'; document.body.appendChild(sw);
  var ann=document.createElement("div"); ann.id="fly-announce";
  ann.innerHTML='<span>IT\'S FLY SWATTER LAURA!!!</span>'; document.body.appendChild(ann);
  later(function(){ try{ann.remove();}catch(e){} },2600);
  playSfx("start-sting", 0.8);
  var song=new Audio("assets/fly/fly-swatter-laura.mp3");
  song.id="fly-song"; song.loop=true; song.volume=0.3;
  document.body.appendChild(song); state.song=song;
  var p=song.play(); if(p&&p.catch) p.catch(function(){});
  startBuzz();
  spawnFly("regular",false); spawnTimer();
  state.raf=requestAnimationFrame(flyLoop);
  state.tick=setInterval(function(){
    state.timeLeft--; updateHUD();
    if(state.timeLeft<=0) endGame(true);
  },1000);
  updateHUD();
}
function endGame(timedOut){
  if(!state.mode) return;
  state.mode=false; state.endReason=timedOut?"timed":"early";
  clearInterval(state.tick);
  cancelAnimationFrame(state.raf);
  state.flies.slice().forEach(removeFly);
  /* Stop song + buzz FIRST, then the end jingle, then the comment. */
  stopAllSounds();
  if(timedOut) playSfx("end-jingle", 0.8);
  ["fly-shield","fly-swatter"].forEach(function(id){ var e=$(id); if(e) e.remove(); });
  var hud=$("fly-hud"); if(hud) hud.remove();
  document.querySelectorAll(".fly-taunt").forEach(function(e){e.remove();});
  document.querySelectorAll("#fly-end").forEach(function(e){ e.remove(); });
  var isBest = state.score>0 && state.score>state.best;
  if(isBest) state.best=state.score;
  var comment="", face="celebrate";
  if(crappyUnlocked()){
    if(state.score<400){ comment="Sorry, Mom \u2014 I think they came for me. I'm poop, that's my fault. You still got some though!"; face="worried"; }
    else if(state.score<=800){ comment="Whoa, you're getting good at this! Sorry about the flies \u2014 they just love me. Want another round?"; face="giggle"; }
    else { comment="WOW! You are a fly-swatting legend! \u2026I am so sorry I brought them all here. Please don't stop, this is the best day of my poop life."; face="dance"; }
    try{ if(window.ui) window.ui.poopFace(face); }catch(e){}
    showStink();
  }
  var end=document.createElement("div"); end.id="fly-end";
  end.innerHTML='<div class="fly-card">'
    +(timedOut?'<h2>Time\'s up!</h2>':'')
    +'<p>Score: <b>'+state.score+'</b></p><p>Swats: <b>'+state.swats+'</b></p>'
    +(isBest?'<p>That\'s your best yet!</p>':'')
    +(comment?'<p>\ud83d\udca9 Crappy: '+comment+'</p>':'')
    +'<div><button id="fly-again" type="button">Play again</button><button id="fly-done" type="button">Back to cards</button></div></div>';
  document.body.appendChild(end);
  $("fly-again").addEventListener("click",function(){ end.remove(); startGame(); });
  $("fly-done").addEventListener("click",function(){ end.remove(); });
}
function endTeaser(silent){
  state.teaser=false;
  cancelAnimationFrame(state.raf);
  state.flies.slice().forEach(function(f){ if(f.teaser) removeFly(f); });
  stopBuzz();
  var e=$("fly-entry"); if(e) e.remove();
  var b=$("poopbuddy"); if(b) b.classList.remove("fly-panic");
  if(!silent) scheduleTeaser(45000+Math.random()*45000);
}
function startTeaser(){
  if(state.mode||state.teaser) return;
  injectCSS(); state.teaser=true;
  spawnFly("regular",true);
  startBuzz();
  state.raf=requestAnimationFrame(flyLoop);
  if(crappyUnlocked()){
    try{
      var buddy=window.ui.poopFace("panic"); buddy.style.display="block";
      buddy.classList.add("fly-panic");
      window.ui.poopSay("stupid flies....! Laura! HELP ME!", 6000);
    }catch(e){}
    showStink();
  }
  later(function(){
    if(!state.teaser) return;
    var entry=document.createElement("div"); entry.id="fly-entry"; entry.tabIndex=0;
    entry.innerHTML='<div class="fly-ready">Ready to swat!??</div><img id="fly-entry-img" src="assets/fly/swatter-icon-128.png" alt="Swatter">';
    document.body.appendChild(entry);
    entry.addEventListener("mouseenter",function(){ var i=$("fly-entry-img"); if(i) i.src="assets/fly/swatter-icon-glow-128.png"; });
    entry.addEventListener("mouseleave",function(){ var i=$("fly-entry-img"); if(i) i.src="assets/fly/swatter-icon-128.png"; });
    entry.addEventListener("click",function(e){ e.stopPropagation(); startGame(); });
    entry.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); startGame(); } });
  }, crappyUnlocked()?7000:6000);
  later(function(){ if(state.teaser) endTeaser(false); }, 60000);
}
function scheduleTeaser(ms){ later(startTeaser, ms); }
function scheduleIdleStink(){
  later(function(){
    if(!state.mode && !state.teaser){
      try{ var b=$("poopbuddy"); if(b && b.style.display!=="none") showStink(); }catch(e){}
    }
    scheduleIdleStink();
  }, 25000);
}
document.addEventListener("pointermove",function(e){
  if(!state.mode) return;
  state.swatterPos={x:e.clientX,y:e.clientY};
  /* Head centre on pointer: swatter element is 128x160, head centre ~ (64,50). */
  var sw=$("fly-swatter"); if(sw) sw.style.transform="translate("+(e.clientX-64)+"px,"+(e.clientY-50)+"px)";
},true);
document.addEventListener("pointerdown",function(e){
  if(!state.mode) return;
  if(e.target.closest && (e.target.closest("#fly-hud")||e.target.closest("#fly-end"))) return;
  e.preventDefault(); e.stopPropagation();
  var sw=$("fly-swatter"); if(sw) sw.classList.add("smacked");
  var hx=e.clientX, hy=e.clientY, hit=null, best=1e9;
  var hitRadius = innerWidth<500 ? 60 : 50;
  state.flies.forEach(function(f){
    var cx=f.x+f.type.size/2, cy=f.y+f.type.size/2, d=Math.hypot(hx-cx,hy-cy);
    if(d<hitRadius && d<best){ best=d; hit=f; }
  });
  if(hit){
    var rate = 0.92+Math.random()*0.16;
    state.score+=hit.type.pts; state.swats++; state.streak++;
    if(state.streak%5===0){
      state.score+=10;
      splatAt(hit.x+hit.type.size/2, hit.y+hit.type.size/2, hit.type.pts+10);
      showTaunt(hit.x+hit.type.size/2, hit.y, "Streak! +10");
    } else {
      splatAt(hit.x+hit.type.size/2, hit.y+hit.type.size/2, hit.type.pts);
    }
    playSfx("swat", 0.8, rate*(1+Math.min(state.streak,5)*0.02));
    playSfx("splat", 0.8, rate);
    playSfx("fly-ouch", 0.8, rate);
    if(hit.typeName==="bonus") playSfx("bonus-chime", 0.8);
    if(hit.typeName==="sleepy") state.sleepyCount=Math.max(state.sleepyCount,1);
    removeFly(hit); updateHUD();
    if(crappyUnlocked() && state.swats%5===0){
      try{ window.ui.poopFace("celebrate"); window.ui.poopSay(CHEERS[(Math.random()*CHEERS.length)|0], 2500); }catch(e){}
    }
  } else {
    state.streak=0; /* silent break: counter resets, no message, no penalty */
    var anyNear=false;
    state.flies.forEach(function(f){
      var cx=f.x+f.type.size/2, cy=f.y+f.type.size/2, d=Math.hypot(hx-cx,hy-cy);
      if(d<260){
        anyNear=true;
        f.x=Math.max(40,Math.min(innerWidth-f.type.size-20,f.x+(Math.random()<0.5?-f.type.dart:f.type.dart)));
        f.y=Math.max(60,Math.min(innerHeight-f.type.size-20,f.y+(Math.random()<0.5?-110:110)));
        f.dartUntil=performance.now()+400;
        f.el.style.transform="translate("+f.x+"px,"+f.y+"px)";
        if(d<75) showTaunt(cx,cy,"So close!");
        else showTaunt(cx,cy);
      }
    });
    if(anyNear){ playSfx("miss-whoosh", 0.8); playSfx("taunt-melody", 0.4); }
  }
},true);
document.addEventListener("pointerup",function(){
  if(!state.mode) return;
  var sw=$("fly-swatter"); if(sw) sw.classList.remove("smacked");
},true);
document.addEventListener("keydown",function(e){
  if(e.key==="Escape" && state.mode) endGame(false);
});
window.addEventListener("load",function(){
  var testMode = /[?&]flytest=1/.test(location.search);
  scheduleTeaser(testMode ? 12000 : 15000+Math.random()*30000);
  scheduleIdleStink();
});
window.__flyTest={
  startTeaser:startTeaser, startGame:startGame, endGame:function(){ endGame(true); },
  spawnTestFly:function(t){ if(state.mode) return spawnFly(t||"regular",false); },
  backdateStart:function(s){ state.startAt-=s*1000; },
  setTimeLeft:function(n){ state.timeLeft=n; updateHUD(); },
  ageOldestFly:function(ms){ var f=state.flies[0]; if(f) f.bornAt=performance.now()-ms; },
  state:function(){ return {mode:state.mode, teaser:state.teaser, score:state.score,
    swats:state.swats, streak:state.streak, best:state.best, timeLeft:state.timeLeft,
    elapsed:elapsed(), phase:phaseFor(elapsed()),
    flies:state.flies.map(function(f){return f.id+":"+f.typeName+":"+f.type.size;}),
    song:!!state.song, songPaused:state.song?state.song.paused:null,
    buzz:!!state.buzz, buzzPaused:state.buzz?state.buzz.paused:null,
    dda:state.dda, sleepyCount:state.sleepyCount, endReason:state.endReason}; }
};
})();
