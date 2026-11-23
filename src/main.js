import "./style.css";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
const LABELS=[
  ["Field 01 / 04","Finance"],["Field 02 / 04","Healthcare"],["Field 03 / 04","Music"],["Field 04 / 04","Fashion"],
  ["Style 01 / 05","Brutalism"],["Style 02 / 05","International Typographic Style"],["Style 03 / 05","Y2K"],["Style 04 / 05","Art Déco"],["Style 05 / 05","Glitch"],
  ["Culture 01 / 04","日本 · Japan"],["Culture 02 / 04","México"],["Culture 03 / 04","العالم العربي · Arab world"],["Culture 04 / 04","Venezuela"],["Hello","Web Developer · UX/UI"]];
const ACT=[0,0,0,0,1,1,1,1,1,2,2,2,2,3];
const $=id=>document.getElementById(id);
const track=$("track"),strip=$("strip"),panels=[...strip.children],N=panels.length,
      tagA=$("tagA"),tagB=$("tagB"),dots=$("dots"),meter=$("meter");
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const HOLD=.45;          // share of each strip panel's scroll spent standing still
const FIN_VH=5;          // the finance scene gets 5 screens of scroll (camera tour = first half)
const STEP_VH=1.1;
const medscroll=$("medscroll"),ctop=$("ctop"),dcur=$("dcur"),demoAp=$("demoAp"),bdetail=$("bdetail"),bdin=$("bdin"),medPanel=medscroll.parentElement;
let MED_PX=0,MED_LEN=0,TL=[],ECG_PX=400; // ECG_PX: screen y of the page's heartbeat baseline
const MEASURE=new Map();function cached(key,fn){if(!MEASURE.has(key)){const v=fn();if(!v||v.w!==0)MEASURE.set(key,v);return v}return MEASURE.get(key)}
function offIn(el,root){let x=0,y=0,e=el;while(e&&e!==root){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}return{x,y,w:el.offsetWidth,h:el.offsetHeight}}
function layout(){const vh=innerHeight;MED_PX=Math.max(0,medscroll.offsetHeight-vh);
  const bandEl=$("ecgband"),cf=document.querySelector(".cframe");
  bandEl.style.width=medPanel.clientWidth+"px";bandEl.style.marginLeft=-offIn(cf,medscroll).x+"px";
  const band=offIn(bandEl,medscroll);ECG_PX=band.y+band.h*.6;
  const yS=clamp(offIn($("sec-services"),medscroll).y-vh*.2,0,MED_PX),bk=offIn($("sec-book"),medscroll),
        yB=clamp(bk.y-Math.max(30,(vh-bk.h)/2),yS,MED_PX),yA=MED_PX;
  // [kind, scroll length, page y from, page y to]
  const segs=[["assemble",1.1*vh,0,0],["scroll",yS,0,yS],["svc",.8*vh,yS,yS],["scroll",yB-yS,yS,yB],["book",1.8*vh,yB,yB],["scroll",yA-yB,yB,yA],["cal",.8*vh,yA,yA],["lift",1.0*vh,yA,yA],["decode",1.3*vh,yA,yA],["settle",1.1*vh,yA,yA],["roll",1.9*vh,yA,yA],["fly",.8*vh,yA,yA],["end",.3*vh,yA,yA]];
  measureParts();
  let s=0;TL=segs.map(([k,len,y0,y1])=>{const o={k,s0:s,s1:s+len,y0,y1};s+=len;return o});MED_LEN=s;
  track.style.height=(FIN_VH*vh+MED_LEN+(N-1)*STEP_VH*vh+vh)+"px"}
function seg(s){for(const g of TL)if(s<g.s1)return{g,t:g.s1>g.s0?(s-g.s0)/(g.s1-g.s0):1};return{g:TL[TL.length-1],t:1}}
const phase=(name,s)=>{const g=TL.find(x=>x.k===name);return clamp((s-g.s0)/(g.s1-g.s0))};
const pageY=s=>{const {g,t}=seg(s);return lerp(g.y0,g.y1,t)};
function sOfY(y){for(const g of TL)if(g.k==="scroll"&&y<=g.y1&&g.y1>g.y0)return g.s0+(y-g.y0)/(g.y1-g.y0)*(g.s1-g.s0);return 0}

/* ---------- assembly: every component builds itself, piece by piece ---------- */
// intro pieces appear in order during the "assemble" hold; cards (and their pieces) build as they come into view
let PARTS=[],INTRO=[],INTRO_N=1;
document.querySelectorAll(".ttl .w").forEach(w=>{const s=w.textContent;w.textContent="";[...s].forEach(c=>{const e=document.createElement("span");e.className="tch";e.textContent=c;w.appendChild(e)})});
function measureParts(){
  const q=(r,s)=>[...r.querySelectorAll(s)];
  INTRO=[...q(document,".cnav > *").map(el=>({el})),{el:document.querySelector(".tkick")}];
  q(document,".ttl .wg").forEach(g=>{q(g,".tch").forEach(el=>INTRO.push({el,kind:"ch",w:.45}));INTRO.push({el:g.querySelector(".pc"),kind:"pc",w:.8})});
  INTRO.push({el:document.querySelector(".tbar"),kind:"bar",w:1.5});
  q(document,".ctabs button").forEach(el=>INTRO.push({el,w:.6}));INTRO.push({el:$("tind"),w:.6},{el:$("ctop").querySelector(".cintro")});
  let acc=0;INTRO.forEach(it=>{it.w=it.w||1;it.at=acc;acc+=it.w});INTRO_N=acc;
  PARTS=[];
  q(document,".clinic .cc, .clinic .ccal").forEach((card,ci)=>{
    let bits;
    if(card.classList.contains("ccal"))bits=[...q(card,".cal-h > *"),...q(card,".dh"),...q(card,".tm"),...q(card,".ap:not(#demoAp)")];
    else if(card.classList.contains("book"))bits=[card.querySelector(".cc-h"),$("bsvc"),...q(card,"#bdays button"),...q(card,"#bdays .puck"),...q(card,"#bslots button"),...q(card,"#bslots .puck"),...q(card,".bfoot > *")];
    else if(card.classList.contains("loc"))bits=[card.querySelector(".map"),...q(card,".cc-f > *")];
    else bits=[...q(card,".cc-h > *"),...q(card,".cc-f > *")];
    const col=card.parentElement.classList.contains("cgrid")?[...card.parentElement.children].indexOf(card)%3:(card.parentElement.classList.contains("crow")?[...card.parentElement.children].indexOf(card):0);
    PARTS.push({card,top:offIn(card,medscroll).y,col,bits:bits.filter(Boolean)})});
}
function assemble(s,y){
  const H=innerHeight,a=phase("assemble",s),n=INTRO.length;
  const pos=a/.7*INTRO_N;INTRO.forEach(it=>build(it.el,(pos-it.at)/(it.kind==="ch"?1.6:it.kind==="bar"?it.w:Math.max(it.w,1.6)),it.kind));
  document.querySelector(".cglow").style.opacity=a;$("mgrad").style.opacity=a;
  const gate=clamp((a-.45)/.55);
  PARTS.forEach(p=>{
    // cards already on the first screen build with the intro; the rest build as they scroll in
    const r=p.top<H*1.15?gate*1.4-p.col*.18:Math.min(clamp((H*.97-(p.top-y))/(H*.42)-p.col*.18),1);
    const c=clamp(r*1.6);p.card.style.setProperty("--bgA",c);p.card.style.transform=`translateY(${(1-c)*18}px) scale(${.97+.03*c})`;
    const m=p.bits.length;p.bits.forEach((el,j)=>build(el,clamp((r-.25)/.75*(m*.6+1)-j*.6)))});
}
function build(el,r,kind){r=smooth(clamp(r));if(!el||el._r===r)return;el._r=r;
  if(kind==="bar"){el.style.transform=`scaleX(${r})`;return}
  el.style.opacity=r;
  if(kind==="ch"){el.style.transform=r>=1?"":`translateY(${(1-r)*.6}em) rotate(${(1-r)*8}deg)`;el.style.filter=r>=1?"":`blur(${(1-r)*12}px)`}
  else if(kind==="pc"){const o=r<1?1-r:0;el.style.transform=r>=1?"":`translateY(${-o*.9}em) scale(${1+o*1.4})`}
  else el.style.transform=r>=1?"":`translateY(${(1-r)*10}px)`}

/* ---------- the demo booking, driven by scroll ---------- */
const ctr=el=>{const b=cached(el,()=>offIn(el,medscroll));return[b.x+b.w*.55,b.y+b.h*.6]};
let demoStage=-1;
function demo(s){
  const W=medPanel.clientWidth,H=medPanel.clientHeight;
  const ps=phase("svc",s),pb=phase("book",s),pc=phase("cal",s),pz=phase("lift",s);
  const P0=ctr(document.querySelector('[data-go="book"].cpill')),Pp=ctr(document.querySelector('.svc[data-svc="Pediatrics"] .go')),
        Pd=ctr(document.querySelector('#bdays [data-d="3"]')),Pt=ctr(document.querySelector('#bslots [data-r="12"]')),
        Pc=ctr($("bconfirm")),Pa=ctr(demoAp.hidden?document.querySelector(".ln:nth-of-type(1)")||demoAp:demoAp);
  const mv=(A,B,u)=>{u=smooth(clamp(u));return[lerp(A[0],B[0],u),lerp(A[1],B[1],u)]};
  let p,click=-1;
  if(pb<=0){p=mv(P0,Pp,ps/.65);click=(ps-.72)/.15}
  else if(pc<=0){p=pb<.3?mv(Pp,Pd,pb/.22):pb<.62?mv(Pd,Pt,(pb-.33)/.2):mv(Pt,Pc,(pb-.66)/.2);
    click=Math.max((pb-.24)/.08,(pb-.55)/.08,(pb-.88)/.08)}
  else p=mv(Pc,ctr(demoAp),pc/.6);
  dcur.style.transform=`translate(${p[0]}px,${p[1]}px)`;dcur.style.opacity=pz>0?1-clamp(pz/.15):clamp((phase("assemble",s)-.85)/.15);
  const ring=dcur.querySelector("i"),cl=click>=0&&click<=1?click:-1;
  ring.style.opacity=cl<0?0:1-cl;ring.style.transform=`scale(${cl<0?.4:.4+cl*1.4})`;
  const stage=ps>=.74?(pb>=.26?(pb>=.57?(pb>=.9?(pc>=.15?5:4):3):2):1):0;
  if(stage!==demoStage){const prev=demoStage;demoStage=stage;
    book.svc=stage>=1?"Pediatrics":"Cardiology";book.d=stage>=2?3:1;book.r=stage>=3?12:4;renderBook();
    $("bk").classList.toggle("live",stage>=1&&stage<4);$("bk").classList.toggle("booked",stage>=4);
    if(stage>=4&&prev<4)confirmAnim();else if(stage<4)setConfirm("idle");
    demoAp.hidden=stage<5;demoAp.classList.toggle("show",stage>=5);
    if(stage>=5)$("caldet").innerHTML="<b>You · Pediatrics</b><span>Thu 26 · 14:00 · Dra. Márquez</span>"}
  ending(s,W,H);
}
/* ---------- ending: glass, the booking lifts and decodes, the calendar detaches, weeks roll, black ---------- */
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DOW=["Mon","Tue","Wed","Thu","Fri"];
const calG=$("calg"),lift=bdetail,lfT=$("lfT"),gdim=$("gdim"),blackout=$("blackout"),calfly=$("calfly"),ccalEl=$("sec-agenda");
const SAY="No, I really mean any field.",GLY="*|%:#~[&>+.}=/@<^";
const APD=[...document.querySelectorAll(".cal-g .ap:not(#demoAp)")].map(el=>{const r=el.style.gridRow.split("/"),span=+(r[1]||"span 1").replace("span","");
  return{col:+el.style.gridColumn-2,row:+r[0]-2,span,tone:[...el.classList].find(c=>c.startsWith("t-")),s1:el.classList.contains("s1"),html:el.innerHTML}});
// Swishy-style decode: resolved letters on the left, a short run of shifting glyphs at the edge
function decode(p,time){const n=SAY.length,head=p*(n+5);let o="";
  for(let i=0;i<n;i++){if(i<head-5)o+=SAY[i];else if(i<head)o+=SAY[i]===" "?" ":GLY[(i*7+Math.floor(time*22))%GLY.length];else break}return o}
function weekStart(w){return new Date(2026,10,23+7*w)}
function weekLabel(w){const d=weekStart(w),e=new Date(2026,10,27+7*w);
  return d.getMonth()===e.getMonth()?`${MON[d.getMonth()]} ${d.getDate()} – ${e.getDate()}`:`${MON[d.getMonth()]} ${d.getDate()} – ${MON[e.getMonth()]} ${e.getDate()}`}
// the detached calendar: an exact stand-in for the page calendar, but its days live on a horizontal track of whole weeks
const ROLL_WEEKS=10;let FLY=null;
function buildFly(){
  const cr=offIn(ccalEl,medscroll),gr=offIn(calG,medscroll),gw=gr.w,dayW=(gw-44-5*6)/5,colW=dayW+6,weekW=colW*5;
  const gh=gr.h,bodyTop=gr.y-cr.y;
  let times="";for(let i=0;i<18;i++)times+=`<span style="top:${54+i*32}px">${8+(i>>1)}:${i%2?"30":"00"}</span>`;
  let track="";
  for(let w=ROLL_WEEKS;w>=0;w--){ // future weeks to the left, so rolling right brings them in
    for(let d=0;d<5;d++){const date=new Date(2026,10,23+7*w+d);
      let aps=APD.filter((a,i)=>(w?(i*7+w*3)%5:a.col)===d).map((a,i)=>{const row=w?((APD.indexOf(a)*5+w*11)%(19-a.span-1)):a.row;
        return`<div class="ap ${a.tone}${a.s1?" s1":""}" style="top:${54+row*32+2}px;height:${a.span*32-4}px">${a.html}</div>`}).join("");
      if(!w&&d===3)aps+=`<div class="ap t-z" style="top:${54+12*32+2}px;height:${2*32-4}px"><b>You</b><span class="lf-dec">${SAY}</span><em>14:00</em></div>`;
      track+=`<div class="cf-day" style="width:${colW}px"><div class="dh${!w&&d===4?" on":""}" style="width:${dayW}px"><span>${DOW[d]}</span><b>${date.getDate()}</b></div><div style="position:absolute;top:0;left:0;width:${dayW}px;bottom:0">${aps}</div></div>`}}
  calfly.innerHTML=`<div class="cf-card"><div class="cal-h">${ccalEl.querySelector(".cal-h").innerHTML.replace('id="wkLbl"','id="cfLbl"').replace(/id="(caldet|wkPrev|wkNext)"/g,"")}</div>
    <div class="cf-body" style="top:${bodyTop}px;height:${gh}px"><div class="cf-lines" style="top:54px;left:50px"></div><div class="cf-times">${times}</div>
    <div class="cf-view" style="left:50px"><div class="cf-track" id="cfTrack">${track}</div></div></div></div>`;
  FLY={cr,weekW,track:$("cfTrack"),lbl:$("cfLbl")}}
let lastLbl="";
function ending(s,W,H){
  const pl=phase("lift",s),pd=phase("decode",s),pt=phase("settle",s),pr=phase("roll",s),pf=phase("fly",s);
  const dSpan=demoAp.querySelector("span");
  if(pl<=0||demoAp.hidden){lift.hidden=true;calfly.hidden=true;gdim.style.opacity=0;blackout.style.opacity=0;demoAp.style.visibility="";
    if(dSpan&&dSpan.textContent!=="Pediatrics"){dSpan.textContent="Pediatrics";dSpan.className=""}return}
  const y=pageY(s),b=cached("demoAp",()=>offIn(demoAp,medscroll)),L=b.x,T=b.y-y;
  // 1. glass falls over the page, the booking lifts toward you in place (no travel, no tilt)
  const up=smooth(pl)*(1-smooth(clamp(pt/.45))),S=1+1.6*up;
  const onCard=pt<.5;
  lift.hidden=!onCard;demoAp.style.visibility=onCard?"hidden":"";
  if(onCard){Object.assign(lift.style,{left:L+"px",top:T+"px",width:b.w+"px",height:b.h+"px",
      transform:`translate3d(0,${-14*up}px,0) scale(${S})`,boxShadow:`0 ${28*up}px ${70*up}px rgba(0,0,0,${.65*up}),0 0 0 ${up}px rgba(255,255,255,.25)`});
    // 2. "Pediatrics" decodes into the line, same size
    const txt=pd<=0?"Pediatrics":decode(pd,performance.now()/1000);
    if(lfT.textContent!==txt)lfT.textContent=txt;lfT.className=pd>0?"lf-t":""}
  if(dSpan){const want=pd>=1?SAY:"Pediatrics";if(dSpan.textContent!==want){dSpan.textContent=want;dSpan.className=pd>=1?"lf-dec":""}}
  gdim.style.opacity=(smooth(pl)*(1-smooth(clamp(pt/.6)))).toFixed(3);
  // 3. back in the calendar: the rest of the page goes black and the calendar detaches
  const dark=smooth(clamp((pt-.25)/.6));blackout.style.opacity=dark.toFixed(3);
  if(pt>=.25){if(!FLY)buildFly();calfly.hidden=false;
    const lift2=smooth(clamp((pt-.25)/.75)),fly=smooth(pf);
    Object.assign(calfly.style,{left:FLY.cr.x+"px",top:(FLY.cr.y-y)+"px",width:FLY.cr.w+"px",height:FLY.cr.h+"px",
      transform:`translate3d(0,${-fly*H*.08}px,0) scale(${(1-.06*lift2)*(1+1.1*fly)})`,opacity:(1-fly).toFixed(3),filter:fly>0?`blur(${(fly*14).toFixed(1)}px)`:""});
    // 4. whole weeks roll to the right, faster then settling
    const w=ROLL_WEEKS*ease(pr),off=-(ROLL_WEEKS-w)*FLY.weekW,speed=Math.sin(Math.PI*pr);
    FLY.track.style.transform=`translate3d(${off.toFixed(1)}px,0,0)`;FLY.track.style.filter=speed>.08?`blur(${(speed*5).toFixed(1)}px)`:"";
    const lbl=weekLabel(Math.round(w));if(lbl!==lastLbl){lastLbl=lbl;FLY.lbl.textContent=lbl}}
  else calfly.hidden=true;
}

panels.forEach(p=>{const w=p.querySelector(".word");if(!w)return;const t=w.textContent;w.textContent="";
  [...t].forEach((c,i)=>{const o=document.createElement("span");o.className="ch";o.style.setProperty("--i",i);
    const n=document.createElement("span");n.className="ci";n.textContent=c;n.style.setProperty("--d",(.28+((i*37)%23)/50)+"s");o.appendChild(n);w.appendChild(o)})});
for(let i=0;i<LABELS.length-1;i++){const d=document.createElement("i");if(i>0&&ACT[i]!==ACT[i-1])d.className="gap";dots.appendChild(d)}
const pic=document.querySelector(".d-picado");["#FF2D87","#FFB000","#00C2A8","#FF6A2B","#8B5CF6","#FF2D87","#FFB000","#00C2A8","#FF6A2B","#8B5CF6"].forEach(c=>{const s=document.createElement("span");s.style.background=c;pic.appendChild(s)});

/* ---------- finance dashboard: static parts ---------- */
const gauge=$("gauge"),TICKS=44;
for(let i=0;i<TICKS;i++){const a=(-210+i/(TICKS-1)*240)*Math.PI/180,cx=85,cy=82;
  const l=document.createElementNS("http://www.w3.org/2000/svg","line");
  l.setAttribute("x1",cx+Math.cos(a)*58);l.setAttribute("y1",cy+Math.sin(a)*58);l.setAttribute("x2",cx+Math.cos(a)*72);l.setAttribute("y2",cy+Math.sin(a)*72);
  l.setAttribute("stroke-width","3");l.setAttribute("stroke-linecap","round");gauge.appendChild(l)}
function setGauge(p){[...gauge.children].forEach((l,i)=>l.setAttribute("stroke",i/(TICKS-1)<=p?"#FF2D4B":"rgba(255,255,255,.1)"))}
setGauge(.68);

/* ---------- finance camera ---------- */
const fin=$("fin"),dash=$("dash"),ccard=$("ccard"),balTile=$("balTile"),finHint=$("finHint"),bridge=$("bridge"),bx=bridge.getContext("2d");
setGauge(.86);
function box(el){let x=0,y=0,e=el;while(e&&e!==dash){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}return{x,y,w:el.offsetWidth,h:el.offsetHeight}}
// camera keys over the finance scene's progress q. f = what the camera looks at, z = how much of the screen it fills
const KEYS=[
  {q:0,   rx:46, ry:-32, rz:14, f:"dash", z:.62},
  {q:.14, rx:16, ry:-15, rz:5,  f:"dash", z:.96},
  {q:.24, rx:9,  ry:-9,  rz:2,  f:"card", z:.92},
  {q:.33, rx:7,  ry:-7,  rz:1.5,f:"card", z:.92},
  {q:.42, rx:8,  ry:-10, rz:2,  f:"chart",z:.95},
  {q:.5,  rx:0,  ry:0,   rz:0,  f:"chart",z:1.2},
  {q:1,   rx:0,  ry:0,   rz:0,  f:"chart",z:1.2}];
const smooth=x=>x*x*(3-2*x),clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t;
function target(name,W,H){const b=name==="dash"?{x:0,y:0,w:1280,h:800}:cached("cam-"+name,()=>box(name==="card"?ccard:balTile));
  const fitW=name==="dash"?.92:.78,fitH=name==="dash"?.86:.66;
  return{x:b.x+b.w/2,y:b.y+b.h/2,s:Math.min(fitW*W/b.w,fitH*H/b.h)}}
const DZ=parseFloat(getComputedStyle(document.querySelector(".dash")).zoom)||1; // dashboard is laid out at DZx for sharp text
const CAMP={};let camTL=null,camST=null;
function applyCam(){const Z=DZ,c=CAMP,W=VW,H=VH;
  dash.style.transform=`translate(${W/2/Z}px,${H/2/Z}px) perspective(${1800/Z}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) scale(${c.s/Z}) translate(${-c.fx}px,${-c.fy}px)`}
function buildCamera(){camST&&camST.kill();camTL&&camTL.kill();
  const val=k=>{const g=target(k.f,VW,VH);return{rx:k.rx,ry:k.ry,rz:k.rz,s:g.s*k.z,fx:g.x,fy:g.y}};
  Object.assign(CAMP,val(KEYS[0]));
  camTL=gsap.timeline({paused:true,defaults:{ease:"power2.inOut"},onUpdate:applyCam});
  for(let i=1;i<KEYS.length-1;i++)camTL.to(CAMP,{...val(KEYS[i]),duration:KEYS[i].q-KEYS[i-1].q},KEYS[i-1].q);
  camST=ScrollTrigger.create({trigger:track,start:"top top",end:()=>"+="+FIN_VH*VH*.5,scrub:true,animation:camTL});
  applyCam()}
function camera(q,W,H){let i=0;while(i<KEYS.length-2&&q>KEYS[i+1].q)i++;
  const A=KEYS[i],B=KEYS[i+1],t=smooth(clamp((q-A.q)/(B.q-A.q)));
  const ta=target(A.f,W,H),tb=target(B.f,W,H);
  const s=lerp(ta.s*A.z,tb.s*B.z,t),fx=lerp(ta.x,tb.x,t),fy=lerp(ta.y,tb.y,t);
  const Z=DZ;dash.style.transform=`translate(${W/2/Z}px,${H/2/Z}px) perspective(${1800/Z}px) rotateX(${lerp(A.rx,B.rx,t)}deg) rotateY(${lerp(A.ry,B.ry,t)}deg) rotateZ(${lerp(A.rz,B.rz,t)}deg) scale(${s/Z}) translate(${-fx}px,${-fy}px)`}

/* ---------- the revenue tile IS the animation: same curve in the tile's SVG and, once the camera lands, on the overlay canvas ---------- */
let BW=0,BH=0;
function sizeBridge(){const D=Math.min(devicePixelRatio||1,1.5);BW=bridge.clientWidth;BH=bridge.clientHeight;bridge.width=BW*D;bridge.height=BH*D;bx.setTransform(D,0,0,D,0,0)}
addEventListener("resize",sizeBridge);sizeBridge();
const RED="#FF2D4B",Q=["Q1","Q2","Q3","Q4"],TOTAL=128400;
const eio=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const CU=u=>[.03+.9*u,.9-.8*eio(u)];            // normalized curve inside the chart area
const chartArea=$("chartArea"),revSvg=$("revSvg"),revAmt=$("revAmt"),revChg=$("revChg"),ranges=[...$("ranges").children];
const SVW=640,SVH=220;
function svgChart(g){let d="";for(let i=0;i<=80;i++){const u=g*i/80,[x,y]=CU(u);d+=(i?"L":"M")+(x*SVW).toFixed(1)+" "+(y*SVH).toFixed(1)}
  const[ex,ey]=CU(g);$("line").setAttribute("d",d);$("area").setAttribute("d",d+`L${ex*SVW} ${SVH}L${CU(0)[0]*SVW} ${SVH}Z`);
  $("dot").setAttribute("cx",ex*SVW);$("dot").setAttribute("cy",ey*SVH)}
svgChart(.25);
function setTile(g){const v=Math.round(TOTAL*g),qi=Math.min(Math.max(Math.ceil(g*4-1e-6)-1,0),3);
  revAmt.innerHTML="$"+v.toLocaleString("en-US")+"<span>.00</span>";
  ranges.forEach((r,i)=>r.classList.toggle("on",i===qi));
  revChg.textContent=qi===0?"↗ Q1 · first quarter":`↗ +${Math.round((v/32100-1)*100)}% since Q1`;return{v,qi}}
const mix=(c1,c2,t)=>{const h=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));const A=h(c1),B=h(c2);return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(",")})`};
const CLINIC_BG="#06131D",ECG_V=150; // px/s the monitor trace scrolls
// neon line without shadowBlur (which is very slow): two soft wide passes under the core line
function glowStroke(cx,w,a=1){cx.save();cx.lineJoin="round";cx.lineCap="round";
  cx.strokeStyle=`rgba(255,45,75,${.12*a})`;cx.lineWidth=w*4.5;cx.stroke();cx.strokeStyle=`rgba(255,45,75,${.28*a})`;cx.lineWidth=w*2.2;cx.stroke();
  cx.strokeStyle="#FF2D4B";cx.lineWidth=w;cx.stroke();cx.restore()}
// ONE heartbeat renderer: the bridge's final frame and the clinic page both call this, so the hand-off can't change anything
function ecgFrame(cx,W,y0,t){const amp=Math.min(innerHeight*.13,110),hx=W*.9,ph=t*ECG_V,Y=x=>y0+ecg((x+ph)/260)*amp*clamp(x/40);
  cx.beginPath();for(let x=0;x<=hx;x+=2){const y=Y(x);x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.lineTo(hx,Y(hx));glowStroke(cx,3);
  monitorHead(cx,hx,Y(hx),t,7,"Heart rate","72 bpm",1,W)}
// draws the glowing head + "Heart rate" tooltip exactly the same way in the bridge and in the page
function monitorHead(cx,hx,hy,time,dr,label,value,ta,W){const pulse=1+.25*Math.sin(time*6);
  const halo=cx.createRadialGradient(hx,hy,0,hx,hy,26*pulse);halo.addColorStop(0,"rgba(255,45,75,.55)");halo.addColorStop(1,"rgba(255,45,75,0)");
  cx.fillStyle=halo;cx.beginPath();cx.arc(hx,hy,26*pulse,0,7);cx.fill();cx.fillStyle="#FF2D4B";cx.beginPath();cx.arc(hx,hy,dr,0,7);cx.fill();
  if(ta<=0)return;cx.globalAlpha=ta;cx.textAlign="left";cx.textBaseline="alphabetic";
  cx.font='500 11px "Inter Tight",sans-serif';const lw=cx.measureText(label).width;cx.font='700 17px "Inter Tight",sans-serif';const vw=cx.measureText(value).width;
  const bw=Math.max(lw,vw)+24,bh=50,bxp=Math.max(12,Math.min(hx-bw-16,W-bw-12)),byp=hy-bh-14;
  cx.fillStyle="rgba(28,28,31,.92)";cx.strokeStyle="rgba(255,255,255,.08)";cx.beginPath();cx.roundRect(bxp,byp,bw,bh,10);cx.fill();cx.stroke();
  cx.fillStyle="#9A9AA2";cx.font='500 11px "Inter Tight",sans-serif';cx.fillText(label,bxp+12,byp+20);
  cx.fillStyle="#fff";cx.font='700 17px "Inter Tight",sans-serif';cx.fillText(value,bxp+12,byp+40);cx.globalAlpha=1}

const bgc=p=>p<.5?mix("#0A0A0B","#2A2A30",p/.5):mix("#2A2A30",CLINIC_BG,(p-.5)/.5);
let BR=0,RR=null,CAM=[0,0];const finCam=document.querySelector(".fin-cam"); // bridge progress; chart-area rect on screen, captured when the camera lands
function drawBridge(time){
  const W=BW,H=BH,cx=bx;if(!W||!RR)return;cx.clearRect(0,0,W,H);
  const r=BR,gp=clamp(r/.46),pp=clamp((r-.46)/.5),pe=smooth(pp);
  // growth from Q1 to Q4 with stops: run, then rest at each quarter
  const g=.25+.75*gp; // one continuous climb from Q1 to Q4, no stops
  const {v,qi}=setTile(g);
  const k=RR.w/SVW;                                   // design px -> screen px, so line weights match the SVG
  const P=u=>{const[x,y]=CU(u);return[RR.x+x*RR.w,RR.y+y*RR.h]};
  const [x1,y1]=P(1),x0=P(0)[0];
  const amp=Math.min(H*.13,110),beatStart=x1,
        drift=time*ECG_V,ecgY=x=>y1+ecg((x-beatStart+drift)/260)*amp*clamp((x-beatStart)/40);
  const headX=pp>0?x1+pe*W*.9:P(g)[0];
  const camX=pp>0?headX-lerp(x1,W*.9,pe):0,camY=pp>0?y1-lerp(y1,ECG_PX,pe):0;
  const wy=x=>x<=x1?P(invX(x))[1]:ecgY(x);
  function invX(x){return clamp(((x-RR.x)/RR.w-.03)/.9)}
  if(pe>=1){cx.fillStyle=CLINIC_BG;cx.fillRect(0,0,W,H);ecgFrame(cx,W,ECG_PX,time);CAM=[headX-W*.9,y1-ECG_PX];return 1}
  // the tile opens up: ground shifts black -> grey -> clinical navy
  if(pe>0){cx.globalAlpha=clamp(pe/.3);cx.fillStyle=bgc(pe);cx.fillRect(0,0,W,H);cx.globalAlpha=1;
  }
  const pts=[],from=Math.max(x0,camX-20),to=Math.min(headX,camX+W+20);
  for(let x=from;x<=to;x+=2)pts.push([x-camX,wy(x)-camY]);pts.push([headX-camX,wy(headX)-camY]);
  // area under the revenue curve, clipped to the tile until it dissolves
  const ap=pts.filter(p=>p[0]+camX<=x1+1),fa=1-clamp(pe/.4);
  if(fa>0&&ap.length>1){cx.save();cx.beginPath();cx.rect(RR.x-camX,0,RR.w,RR.y+RR.h-camY);cx.clip();
    const gr=cx.createLinearGradient(0,RR.y-camY,0,RR.y+RR.h-camY);gr.addColorStop(0,`rgba(255,45,75,${.38*fa})`);gr.addColorStop(1,"rgba(255,45,75,0)");
    cx.beginPath();cx.moveTo(ap[0][0],RR.y+RR.h-camY);ap.forEach(p=>cx.lineTo(p[0],p[1]));cx.lineTo(ap[ap.length-1][0],RR.y+RR.h-camY);cx.closePath();cx.fillStyle=gr;cx.fill();cx.restore()}
  cx.beginPath();pts.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));glowStroke(cx,lerp(3*k,3,pe),lerp(.5,1,clamp(gp*2)));
  // quarter markers left behind at each stop
  for(let i=0;i<4;i++){if(g<(i+1)/4-.001)continue;const[x,y]=P((i+1)/4),X=x-camX,Y=y-camY;
    cx.fillStyle="#0A0A0B";cx.strokeStyle=RED;cx.lineWidth=2;cx.beginPath();cx.arc(X,Y,4.5,0,7);cx.fill();cx.stroke()}
  // glowing head + tooltip
  const hx=headX-camX,hy=wy(headX)-camY,dr=lerp(7*k,7,pe);
  const heart=pe>.45,label=heart?"Heart rate":`${Q[qi]} · Revenue`,value=heart?"72 bpm":"$"+v.toLocaleString("en-US");
  const ta=heart?clamp((pe-.45)/.1):clamp(r/.03)*(1-clamp((pe-.3)/.1));
  monitorHead(cx,hx,hy,time,dr,label,value,ta,W);
  CAM=[camX,camY];return pe;
}
let RR0=null;
function finance(q,W,H){
  const LAND=.5;
  ccard.style.setProperty("--sheen",lerp(-60,60,clamp((q-.18)/.2))+"%");
  BR=clamp((q-LAND)/(1-LAND));
  if(q>=LAND){if(!RR0){const a=chartArea.getBoundingClientRect(),s=fin.getBoundingClientRect();RR0={x:a.left-s.left+CAM[0],y:a.top-s.top+CAM[1],w:a.width,h:a.height}}RR=RR0}
  else{RR=null;RR0=null;CAM=[0,0];setTile(.25)}
  const live=q>=LAND;
  bridge.style.opacity=live?1:0;revSvg.style.opacity=live?0:1;
  const pe=smooth(clamp((BR-.46)/.5));
  dash.style.opacity=1-clamp(pe/.3);
  fin.style.opacity=1;
  fin.style.visibility=BR>=.97?"hidden":"visible";
  finHint.style.opacity=q<.04?.6:0;
  if(!live)CAM=[0,0];
  finCam.style.transform=`translate(${-CAM[0]}px,${-CAM[1]}px)`;
  return BR;
}
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
let pos=0,active=-1,lastSc=0,AUTO=null;
// the heartbeat hand-off plays by itself: it drives the real scroll position, so it stays perfectly in sync with scrolling
const easeQ=x=>.5*x+.5*(1-Math.cos(Math.PI*x))/2; // steady flow with soft ends: no burst in the middle, no stops
// variable-speed glide: each zone [fromPx,toPx,speed] moves at its own pace, blended smoothly, soft start and end.
// Returns the duration (ms) and an easing that maps time -> distance.
function flowPlan(from,to,zones,pxPerSec){const N=600,span=to-from,ds=span/N,T=[0];let t=0;const w=span*.05;
  const st=x=>{x=clamp(x);return x*x*(3-2*x)};
  for(let i=0;i<N;i++){const d=from+(i+.5)*ds,u=(i+.5)/N;let v=1;
    for(const [a,b,s] of zones){const k=st((d-(a-w))/(2*w))*(1-st((d-(b-w))/(2*w)));v+=(s-1)*k}
    v*=.4+.6*st(Math.min(u,1-u)/.1);t+=ds/(v*pxPerSec);T.push(t)}
  const ease=x=>{const tt=x*t;let lo=0,hi=N;while(hi-lo>1){const m=(lo+hi)>>1;T[m]<=tt?lo=m:hi=m}
    const f=T[hi]>T[lo]?(tt-T[lo])/(T[hi]-T[lo]):0;return(lo+f)/N};
  return{ms:t*1000,ease}}
function autoTo(target,ms,easing=ease){AUTO={};lenis.scrollTo(target+TRACK_TOP,{duration:ms/1000,easing,lock:true,force:true,onComplete:()=>{AUTO=null}})}
let VW=innerWidth,VH=innerHeight,SCROLL_MAX=1,TRACK_TOP=0;
function onScroll(){update(clamp(scrollY-TRACK_TOP,0,SCROLL_MAX))}
function update(sc){
  const vh=VH,W=VW,H=VH,total=SCROLL_MAX;
  meter.style.transform=`scaleX(${sc/total})`;
  const finLen=FIN_VH*vh,q=clamp(sc/finLen),r=finance(q,W,H);
  let a;
  // one gesture is enough: as the camera lands on Revenue, the growth, the heartbeat and the clinic play by themselves
  const trig=finLen*.46,asmEnd=finLen+TL[0].s1;
  if(!AUTO&&!reduce&&lastSc<trig&&sc>=trig&&sc<asmEnd-2){
    // Q1 -> Q4 climbs fast (2.6x); the heartbeat journey and the clinic build keep their calm pace
    const plan=flowPlan(sc,asmEnd,[[finLen*.5,finLen*(.5+.5*.46),2.6]],.7*vh);autoTo(asmEnd,plan.ms,plan.ease)}
  const medStart=finLen,restStart=medStart+MED_LEN,ms=clamp(sc-medStart,0,MED_LEN),y=pageY(ms);
  const zg=TL.find(g=>g.k==="lift"),sw=TL.find(g=>g.k==="fly"),zs=finLen+zg.s0,ze=finLen+sw.s1;
  if(!AUTO&&!reduce&&lastSc<zs&&sc>=zs&&sc<ze-2)autoTo(ze,8200,easeQ);
  lastSc=sc;
  medscroll.style.transform=`translate3d(0,${-y}px,0)`;spy(y);demo(ms);assemble(ms,y);
  if(sc<finLen){pos=0;a=r>.75?1:0}
  else if(sc<restStart){pos=0;a=1}
  else{const f=(sc-restStart)/(STEP_VH*vh),i=Math.min(Math.floor(f),N-2),l=f-i;
    pos=f>=N-1?N-1:i+ease(clamp((l-HOLD)/(1-HOLD)));a=Math.round(pos)+1;
    if(!reduce)panels.forEach((pn,k)=>{const d=k-pos;const c=pn.querySelector(":scope>.copy");if(Math.abs(d)<1.2&&c)c.style.transform=`translate3d(${d*-28}%,0,0)`})}
  strip.style.transform=`translate3d(${-pos*100}%,0,0)`;
  if(a!==active){active=a;tagA.textContent=LABELS[a][0];tagB.textContent=LABELS[a][1];
    [...dots.children].forEach((d,k)=>d.classList.toggle("on",k===a));
    const w=a>0&&panels[a-1].querySelector(".word");if(w){w.classList.remove("enter");void w.offsetWidth;w.classList.add("enter")}}
}
/* ---------- clinic page: it works ---------- */
const secY=id=>cached("sec-"+id,()=>{let e=$("sec-"+id),y=0;while(e&&e!==medscroll){y+=e.offsetTop;e=e.offsetParent}return{y,w:1}}).y;
function goTo(id){const y=Math.min(Math.max(secY(id)-90,0),MED_PX);lenis.scrollTo(track.offsetTop+FIN_VH*innerHeight+sOfY(y),{duration:1.4})}
medscroll.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>goTo(b.dataset.go)));
const tabs=[...document.querySelectorAll("#ctabs button")];
let spyCur="";function spy(y){let cur="overview";["services","book","agenda"].forEach(id=>{if(y+innerHeight*.45>=secY(id))cur=id});if(cur===spyCur)return;spyCur=cur;tabs.forEach(b=>b.classList.toggle("on",b.dataset.go===cur));moveTab()}
const DAYS=["Mon 23","Tue 24","Wed 25","Thu 26","Fri 27"],book={svc:"Cardiology",d:1,r:4};
const rowTime=r=>`${8+(r>>1)}:${r%2?"30":"00"}`;
const slotTxt=()=>[...$("bslots").children].find(b=>+b.dataset.r===book.r)?.textContent||rowTime(book.r);
function puck(box){const p=box.querySelector(".puck"),b=box.querySelector("button.on");if(!p)return;if(!b){p.style.width="0px";return}
  p.style.width=b.offsetWidth+"px";p.style.height=b.offsetHeight+"px";p.style.transform=`translate(${b.offsetLeft}px,${b.offsetTop}px)`}
function setConfirm(st){const c=$("bconfirm"),l=c.querySelector(".cb-l");
  if(!c._w){const keep=c.style.width;c.style.transition="none";c.style.width="";c.className=c.className.replace(/\b(loading|done)\b/g,"");
    l.textContent="Confirm booking";const w0=c.offsetWidth;c.classList.add("done");l.textContent="Booked";const w1=c.offsetWidth;c.classList.remove("done");
    if(w0)c._w={idle:w0,done:w1};void c.offsetWidth;c.style.transition="";c.style.width=keep}
  c.classList.toggle("loading",st==="loading");c.classList.toggle("done",st==="done");
  l.textContent=st==="done"?"Booked":"Confirm booking";
  if(c._w)c.style.width=st==="loading"?c.offsetHeight+"px":(st==="done"?c._w.done:c._w.idle)+"px"}
let cTimer=0;function confirmAnim(after){clearTimeout(cTimer);setConfirm("loading");cTimer=setTimeout(()=>{setConfirm("done");after&&after()},750)}
function moveTab(){const b=document.querySelector("#ctabs button.on"),i=$("tind");if(b&&i){i.style.width=b.offsetWidth+"px";i.style.transform=`translateX(${b.offsetLeft}px)`}}
function renderBook(){$("bsvc").innerHTML=`Service: <b>${book.svc}</b>`;
  const sum=`<b>${DAYS[book.d]} Nov · ${slotTxt()}</b><br>${book.svc} · Dra. Márquez`,bs=$("bsum");
  if(bs.innerHTML!==sum){bs.innerHTML=sum;bs.classList.remove("roll");void bs.offsetWidth;bs.classList.add("roll")}
  [...$("bdays").children].forEach(b=>b.classList.toggle("on",+b.dataset.d===book.d&&!b.disabled));
  [...$("bslots").children].forEach(b=>b.classList.toggle("on",+b.dataset.r===book.r&&!b.disabled));
  document.querySelectorAll(".svc").forEach(c=>c.classList.toggle("picked",c.dataset.svc===book.svc));
  puck($("bdays"));puck($("bslots"))}
$("bdays").addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.disabled)return;book.d=+b.dataset.d;renderBook();setConfirm("idle");$("bk").classList.add("live")});
$("bslots").addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.disabled)return;book.r=+b.dataset.r;renderBook();setConfirm("idle");$("bk").classList.add("live")});
document.querySelectorAll(".svc .go").forEach(b=>b.addEventListener("click",()=>{book.svc=b.closest(".svc").dataset.svc;renderBook();goTo("book")}));
const grid=document.querySelector(".cal-g");
$("bconfirm").addEventListener("click",()=>{if($("bconfirm").classList.contains("done"))return;
  confirmAnim(()=>{$("bk").classList.remove("live");$("bk").classList.add("booked")});
  const ap=document.createElement("button");ap.className="ap s1 t-z mine";
  ap.style.gridColumn=book.d+2;ap.style.gridRow=`${book.r+2}/span 1`;
  ap.innerHTML=`<b>You</b><span>${book.svc}</span><em>${slotTxt()}</em>`;grid.appendChild(ap);
  $("caldet").innerHTML=`<b>You · ${book.svc}</b><span>${DAYS[book.d]} · ${slotTxt()} · added to the agenda</span>`});
grid.addEventListener("click",e=>{const ap=e.target.closest(".ap");if(!ap)return;
  grid.querySelectorAll(".ap.sel").forEach(x=>x.classList.remove("sel"));ap.classList.add("sel");
  const col=parseInt(ap.style.gridColumn)-2,[n,why,tm]=[...ap.children].map(x=>x.textContent);
  $("caldet").innerHTML=`<b>${n}</b><span>${why.replace(/^· /,"")} · ${DAYS[col]} · ${tm}</span>`});
const WEEKS=[["Nov 16 – 20",16],["Nov 23 – 27",23],["Nov 30 – Dec 4",30]];let wk=1;
function renderWeek(){$("wkLbl").textContent=WEEKS[wk][0];document.querySelectorAll(".dh b").forEach((b,i)=>{const n=WEEKS[wk][1]+i;b.textContent=n>30?n-30:n})}
$("wkPrev").addEventListener("click",()=>{wk=Math.max(0,wk-1);renderWeek()});$("wkNext").addEventListener("click",()=>{wk=Math.min(2,wk+1);renderWeek()});
renderBook();

layout();moveTab();
function measure(){MEASURE.clear();RR0=null;FLY=null;layout();if(window.ScrollTrigger)ScrollTrigger.refresh();VW=fin.clientWidth;VH=fin.clientHeight;SCROLL_MAX=Math.max(1,track.offsetHeight-innerHeight);TRACK_TOP=track.offsetTop}
measure();
const lenis=new Lenis({lerp:.085,smoothWheel:true,touchMultiplier:1.1});
lenis.on("scroll",ScrollTrigger.update);
gsap.ticker.add(time=>lenis.raf(time*1000));gsap.ticker.lagSmoothing(0);
buildCamera();
let SC=-1,idle=0;
addEventListener("resize",()=>{measure();size();sizeBridge();buildCamera();ScrollTrigger.refresh();SC=-1});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{layout();onScroll()});

/* ---------- canvas worlds ---------- */
const FX=panels.map((p,k)=>p.dataset.fx?{k,type:p.dataset.fx,cv:p.querySelector("canvas"),cx:p.querySelector("canvas").getContext("2d"),W:0,H:0}:null).filter(Boolean);
function size(){const D=Math.min(devicePixelRatio||1,1.5);FX.forEach(f=>{f.W=f.cv.clientWidth;f.H=f.cv.clientHeight;f.cv.width=f.W*D;f.cv.height=f.H*D;f.cx.setTransform(D,0,0,D,0,0)})}
addEventListener("resize",size);size();

function ecg(x){const t=x%1;
  if(t<.30)return Math.sin(t*20)*.015; if(t<.34)return -.08*Math.sin((t-.30)/.04*Math.PI); if(t<.40)return 0;
  if(t<.42)return .12; if(t<.45)return -.9*Math.sin((t-.42)/.03*Math.PI); if(t<.48)return .25*Math.sin((t-.45)/.03*Math.PI);
  if(t<.60)return 0; if(t<.72)return -.16*Math.sin((t-.60)/.12*Math.PI); return 0}
const stars=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),p:Math.random()*6.28,s:Math.random()*1.5+.5}));

const DRAW={
  med(cx,W,H,t){ecgFrame(cx,W,H*.6,t)},
  music(cx,W,H,t){const n=Math.floor(W/9);
    for(let i=0;i<n;i++){const v=(Math.sin(i*.21+t*3.1)*.5+.5)*(Math.sin(i*.057-t*1.7)*.5+.5)*(.4+.6*Math.abs(Math.sin(t*2.13+i*.9))),h=v*H*.34;
      cx.fillStyle=i%2?"rgba(255,79,163,.55)":"rgba(255,181,71,.45)";cx.fillRect(i*9,H-h,5,h)}},
  y2k(cx,W,H,t){stars.forEach(st=>{const a=Math.sin(t*2+st.p)*.5+.5,x=st.x*W,y=st.y*H,r=st.s*4*a;
      cx.strokeStyle=`rgba(200,220,255,${a})`;cx.lineWidth=1;cx.beginPath();cx.moveTo(x-r*2,y);cx.lineTo(x+r*2,y);cx.moveTo(x,y-r*2);cx.lineTo(x,y+r*2);cx.stroke()});
    const g=cx.createRadialGradient(W*.75,H*.25,0,W*.75,H*.25,W*.5);g.addColorStop(0,"rgba(80,120,255,.35)");g.addColorStop(1,"rgba(6,11,58,0)");cx.fillStyle=g;cx.fillRect(0,0,W,H)},
  deco(cx,W,H,t){const ox=W/2,oy=H*1.05,R=Math.hypot(W,H);cx.strokeStyle="rgba(217,182,95,.22)";cx.lineWidth=1;
    for(let i=0;i<48;i++){const a=Math.PI+i/47*Math.PI+Math.sin(t*.3)*.02;cx.beginPath();cx.moveTo(ox,oy);cx.lineTo(ox+Math.cos(a)*R,oy+Math.sin(a)*R);cx.stroke()}
    for(let k=1;k<6;k++){cx.beginPath();cx.arc(ox,oy,k*Math.min(W,H)*.16,Math.PI,0);cx.strokeStyle=`rgba(217,182,95,${.35-k*.05})`;cx.stroke()}},
  glitch(cx,W,H){if(Math.random()<.35)for(let i=0;i<4;i++){cx.fillStyle=Math.random()<.5?"rgba(255,46,99,.25)":"rgba(8,247,254,.2)";cx.fillRect(Math.random()*W,Math.random()*H,Math.random()*W*.4,Math.random()*8+2)}},
  arab(cx,W,H,t){const sz=Math.max(70,Math.min(W,H)/7),off=(t*6)%sz;cx.strokeStyle="rgba(226,194,122,.18)";cx.lineWidth=1.2;
    for(let y=-sz;y<H+sz;y+=sz)for(let x=-sz;x<W+sz;x+=sz){const X=x+sz/2+off,Y=y+sz/2,r=sz*.42;
      for(let q=0;q<2;q++){cx.save();cx.translate(X,Y);cx.rotate(q*Math.PI/4);cx.strokeRect(-r*.7,-r*.7,r*1.4,r*1.4);cx.restore()}
      cx.beginPath();cx.arc(X,Y,r*.28,0,7);cx.stroke()}},
  vzla(cx,W,H,t,d){ // Cruz-Diez-style bands: the phase slides as the panel moves sideways
    const cols=["#E4002B","#FFCD00","#00247D","#00A651","#FFFFFF","#111111"],w=Math.max(6,W/120),shift=-d*W*.8+t*20;
    for(let x=0;x<W+w;x+=w){const k=Math.floor((x+shift)/w),band=Math.abs(Math.floor((x/W-d)*3+t*.05))%3;
      cx.fillStyle=cols[(k%cols.length+cols.length+band*2)%cols.length];cx.fillRect(x,0,w*.55,H)}}
};
function draw(time){const t=time; // seconds, from the GSAP ticker (same clock as Lenis)
  const sc=clamp(lenis.animatedScroll-TRACK_TOP,0,SCROLL_MAX);
  if(Math.abs(sc-SC)>.01){SC=sc;
    if(!idle){dash.style.willChange="transform,opacity";medscroll.style.willChange="transform"}idle=12;
    try{update(SC)}catch(e){console.warn(e)}}
  else if(idle&&!--idle){dash.style.willChange="";medscroll.style.willChange=""} // at rest: let the browser re-raster crisp
  if(BR<1&&parseFloat(bridge.style.opacity||0)>0){try{drawBridge(t)}catch(e){console.warn(e)}}
  FX.forEach(f=>{const d=f.k-pos;if(Math.abs(d)>=1)return;
    try{f.cx.clearRect(0,0,f.W,f.H);DRAW[f.type](f.cx,f.W,f.H,reduce?0:t,d)}catch(e){console.warn(e)}})}
gsap.ticker.add(draw);
