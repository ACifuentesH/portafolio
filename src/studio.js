// STUDIO — the fashion field. A faceless store mannequin and its clothes, all built in code (no external model):
// a smooth egg head, lofted garments with fabric texture, standing still on a white plinth. The camera arrives
// from the dark behind its head, swings round its right side to the front, then pulls back to the shop.
import * as THREE from "three";
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t,smooth=x=>{x=clamp(x);return x*x*(3-2*x)};

/* ---------- catalogue: slots on the mannequin ---------- */
export const CATALOG=[
  {id:"tee-bone",slot:"top",style:"tee",name:"Heavy Tee",shade:"Bone",price:48,color:"#e8e2d6",fabric:"jersey",code:"TP-01"},
  {id:"tee-blk",slot:"top",style:"tee",name:"Heavy Tee",shade:"Black",price:48,color:"#1c1c1e",fabric:"jersey",code:"TP-02"},
  {id:"crew-club",slot:"top",style:"crew",name:"Club Crewneck",shade:"Grey marl",price:89,color:"#b9b8b3",fabric:"fleece",print:true,code:"TP-03"},
  {id:"hood-char",slot:"top",style:"hood",name:"Box Hoodie",shade:"Charcoal",price:110,color:"#3a3a3d",fabric:"fleece",code:"TP-04"},
  {id:"hood-red",slot:"top",style:"hood",name:"Box Hoodie",shade:"Signal red",price:110,color:"#d8283f",fabric:"fleece",code:"TP-05"},
  {id:"jkt-tweed",slot:"layer",style:"jacket",name:"Cropped Tweed",shade:"Salt & pepper",price:189,color:"#8d8881",fabric:"tweed",code:"LY-01"},
  {id:"pant-choc",slot:"bottom",style:"pleat",name:"Wide Pleat Trouser",shade:"Chocolate",price:129,color:"#3a2a24",fabric:"wool",code:"BT-01"},
  {id:"pant-denim",slot:"bottom",style:"denim",name:"Baggy Denim",shade:"Washed indigo",price:119,color:"#4d6489",fabric:"denim",code:"BT-02"},
  {id:"pant-para",slot:"bottom",style:"para",name:"Parachute Pant",shade:"Black nylon",price:139,color:"#18181a",fabric:"nylon",code:"BT-03"},
  {id:"beanie",slot:"hat",style:"beanie",name:"Rib Beanie",shade:"Charcoal",price:35,color:"#3d3f43",fabric:"rib",code:"AC-01"}
];

/* ---------- fabric textures (generated) ---------- */
function canvasTex(w,h,draw,repeat=[1,1]){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=4;return t}
function noise(g,w,h,amt,size=1){const d=g.getImageData(0,0,w,h),a=d.data;for(let i=0;i<a.length;i+=4){const n=(Math.random()-.5)*amt;a[i]+=n;a[i+1]+=n;a[i+2]+=n}g.putImageData(d,0,0)}
const FABRIC={};
function fabricBump(kind){if(FABRIC[kind])return FABRIC[kind];let t;
  if(kind==="rib"||kind==="cuff")t=canvasTex(64,64,(g,w,h)=>{for(let x=0;x<w;x++){const v=128+100*Math.sin(x/w*Math.PI*8);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,0,1,h)}},[10,1]);
  else if(kind==="tweed")t=canvasTex(128,128,(g,w,h)=>{g.fillStyle="#808080";g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const x=Math.random()*w,y=Math.random()*h,v=Math.random()<.5?40:220;
      g.fillStyle=`rgba(${v},${v},${v},.55)`;g.fillRect(x,y,Math.random()<.5?3:1,Math.random()<.5?1:3)}},[6,6]);
  else if(kind==="denim")t=canvasTex(128,128,(g,w,h)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x+=2){const v=128+70*Math.sin((x+y)*.9)+(Math.random()-.5)*60;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,y,2,1)}},[8,8]);
  else if(kind==="nylon")t=canvasTex(128,128,(g,w,h)=>{g.fillStyle="#808080";g.fillRect(0,0,w,h);for(let y=0;y<h;y+=4){g.fillStyle="rgba(255,255,255,.12)";g.fillRect(0,y,w,1)}noise(g,w,h,30)},[6,6]);
  else t=canvasTex(128,128,(g,w,h)=>{g.fillStyle="#808080";g.fillRect(0,0,w,h);noise(g,w,h,kind==="fleece"?70:45)},[8,8]);
  FABRIC[kind]=t;return t}
function heather(hex){const t=canvasTex(256,256,(g,w,h)=>{g.fillStyle=hex;g.fillRect(0,0,w,h);noise(g,w,h,34)},[4,4]);t.colorSpace=THREE.SRGBColorSpace;return t}
function fabricMat(item){const k=item.fabric;const m=new THREE.MeshPhysicalMaterial({color:item.color,roughness:k==="nylon"?.42:.9,metalness:0,
    sheen:k==="nylon"?.2:.6,sheenRoughness:.75,sheenColor:new THREE.Color(item.color).lerp(new THREE.Color("#fff"),.35),
    bumpMap:fabricBump(k),bumpScale:k==="tweed"?2.2:k==="rib"?1.4:.7,side:THREE.DoubleSide});
  if(k==="fleece"||k==="tweed"){m.map=heather(item.color);m.color.set("#ffffff")}
  return m}

/* ---------- geometry helpers ---------- */
// loft: horizontal superellipse rings stacked along y; ring = {y,x,z,rx,rz,e,cut} (cut = front opening half-angle)
function loft(rings,n=56){const pos=[],uv=[],idx=[];
  rings.forEach((r,j)=>{for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a),e=2/(r.e||2.4);
      const px=Math.sign(s)*Math.pow(Math.abs(s),e)*r.rx,pz=Math.sign(c)*Math.pow(Math.abs(c),e)*r.rz;
      pos.push((r.x||0)+px,r.y,(r.z||0)+pz);uv.push(i/n,j/(rings.length-1))}});
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const cut=rings[j].cut||0,a=(i+.5)/n*Math.PI*2;
    if(cut&&(a<cut||a>Math.PI*2-cut))continue;const p=j*(n+1)+i,q=p+n+1;idx.push(p,q,p+1,p+1,q,q+1)}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();return g}
// limb: rings around a smooth path, radius profile r(t), optional wobble near the hem (folds)
function limb(points,rad,{n=36,seg=40,folds=0,flare=0}={}){const curve=new THREE.CatmullRomCurve3(points);const pos=[],uv=[],idx=[];
  const frames=curve.computeFrenetFrames(seg,false);
  for(let j=0;j<=seg;j++){const t=j/seg,p=curve.getPointAt(t),N=frames.normals[j],B=frames.binormals[j],R=rad(t);
    for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;const fold=folds?Math.sin(a*5+t*40)*folds*smooth((t-.72)/.28):0;const rr=R*(1+fold);
      pos.push(p.x+(Math.cos(a)*N.x+Math.sin(a)*B.x)*rr,p.y+(Math.cos(a)*N.y+Math.sin(a)*B.y)*rr,p.z+(Math.cos(a)*N.z+Math.sin(a)*B.z)*rr);uv.push(i/n,t)}}
  for(let j=0;j<seg;j++)for(let i=0;i<n;i++){const p=j*(n+1)+i,q=p+n+1;idx.push(p,q,p+1,p+1,q,q+1)}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();return g}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

/* ---------- the mannequin (static, contrapposto-light) ---------- */
function buildMannequin(skinMat){const g=new THREE.Group();
  const head=new THREE.Mesh(new THREE.SphereGeometry(1,64,48),skinMat);head.scale.set(.092,.122,.108);head.position.set(0,1.66,.005);head.rotation.x=.08;g.add(head);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.05,.058,.13,32),skinMat);neck.position.set(0,1.52,-.005);g.add(neck);
  for(const s of [-1,1]){const hand=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),skinMat);hand.scale.set(.028,.08,.046);hand.position.set(s*.228,.8,.07);hand.rotation.set(.1,0,s*-.08);g.add(hand)}
  return g}

/* ---------- garments ---------- */
function topGeo(style){ // oversized torso + dropped shoulders
  const big=style==="jacket"?1.12:style==="hood"?1.06:1;const hemY=style==="jacket"?1.02:style==="tee"?.9:.93;
  const R=[];const prof=[[hemY,.205,.135],[1.05,.208,.138],[1.2,.214,.142],[1.32,.222,.146],[1.4,.215,.138],[1.445,.17,.115],[1.47,.105,.09],[1.48,.072,.072]];
  for(const [y,rx,rz] of prof)R.push({y,rx:rx*big,rz:rz*big,e:y>1.44?2:2.6,z:-.005,cut:style==="jacket"&&y<1.46?.16:0});
  return loft(R)}
function sleeveGeo(style,s){const big=style==="jacket"?1.12:1;const short=style==="tee";
  const pts=[V(s*.182,1.385,-.005),V(s*.232,1.24,.0),V(s*.243,1.03,.03),V(s*.232,.9,.06)];
  const end=short?.42:1;const curve=new THREE.CatmullRomCurve3(pts);const sub=[];for(let i=0;i<=8;i++)sub.push(curve.getPointAt(i/8*end));
  return limb(sub,t=>{const base=short?lerp(.072,.068,t):lerp(.07,.056,t);return base*big*Math.sqrt(clamp(t/(short?.14:.06)))*(style==="hood"||style==="crew"?(t>.9?.85:1):1)},{seg:24})}
function cuffGeo(s){return limb([V(s*.236,.93,.055),V(s*.232,.885,.062)],()=> .046,{seg:4})}
function hoodGeo(){return limb([V(-.09,1.47,.06),V(-.12,1.5,-.04),V(0,1.56,-.13),V(.12,1.5,-.04),V(.09,1.47,.06)],t=>.045+.03*Math.sin(Math.PI*t),{seg:40,n:28})}
function pantGeo(style){const g=[];const wide=style==="pleat"?.112:style==="denim"?.104:.118;
  // upper block: waist to crotch
  g.push(loft([{y:.76,rx:.19,rz:.135,e:2.2},{y:.86,rx:.185,rz:.13,e:2.4},{y:.97,rx:.172,rz:.122,e:2.4},{y:1.0,rx:.168,rz:.12,e:2.4}]));
  for(const s of [-1,1]){g.push(limb([V(s*.095,.84,0),V(s*.1,.5,.005),V(s*.105,.18,.01),V(s*.108,.035,.02)],
      t=>lerp(.1,wide,smooth(t))+(style==="para"?.012*Math.sin(t*Math.PI*3):0),{folds:style==="denim"?.05:style==="para"?.08:.035,seg:48}))}
  return g}
function shoeGeo(s){const g=new RoundedBoxGeometry(.11,.085,.29,4,.035);g.translate(s*.108,.045,.06);return g}
function soleGeo(s){const g=new RoundedBoxGeometry(.118,.028,.3,3,.012);g.translate(s*.108,.014,.06);return g}
function beanieGeo(){const g=new THREE.SphereGeometry(1,48,32,0,Math.PI*2,0,Math.PI*.62);g.scale(.104,.12,.118);g.translate(0,1.715,.0);return g}
function beanieCuffGeo(){return limb([V(0,1.64,0),V(0,1.70,0)],()=>.113,{seg:3,n:48})}
function printTex(){const t=canvasTex(512,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle="rgba(22,22,24,.86)";g.textAlign="center";
  g.font="800 64px 'Archivo', Arial";g.fillText("ANY FIELD",w/2,92);g.font="italic 600 44px 'Instrument Serif', Georgia";g.fillText("Athletic Club",w/2,150);
  g.font="700 34px 'Archivo', Arial";g.fillText("CARACAS · EST. 2026",w/2,212)});t.colorSpace=THREE.SRGBColorSpace;return t}

export function createStudio(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});renderer.setClearColor(0,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(32,1,.02,60);
  scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=0;

  const hemi=new THREE.HemisphereLight("#ffffff","#cfcac2",0);scene.add(hemi);
  const key=new THREE.DirectionalLight("#ffffff",0);key.position.set(2.2,4.2,3.4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.near=1;key.shadow.camera.far=12;key.shadow.bias=-.0005;key.shadow.radius=4;scene.add(key);
  const rimL=new THREE.DirectionalLight("#dfe8ff",0);rimL.position.set(-2.6,2.4,-3);scene.add(rimL);
  const rimR=new THREE.DirectionalLight("#fff0f0",0);rimR.position.set(2.8,2.2,-2.4);scene.add(rimR);

  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({opacity:0}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const plinthMat=new THREE.MeshStandardMaterial({color:"#f6f5f2",roughness:.92,transparent:true,opacity:0});
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.6,.63,.035,96),plinthMat);plinth.position.y=-.018;plinth.receiveShadow=true;scene.add(plinth);
  const rings=new THREE.Group();scene.add(rings);
  for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.74+i*.2,.742+i*.2,128),new THREE.MeshBasicMaterial({color:"#111",transparent:true,opacity:0}));m.rotation.x=-Math.PI/2;m.position.y=.002;rings.add(m)}
  const scanMat=new THREE.MeshBasicMaterial({color:"#ff2d4b",transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const scan=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.02,64,1,true),scanMat);scene.add(scan);

  const skin=new THREE.MeshPhysicalMaterial({color:"#efede8",roughness:.48,clearcoat:.35,clearcoatRoughness:.4,sheen:.3,sheenColor:new THREE.Color("#ffffff")});
  const figure=new THREE.Group();figure.rotation.y=-.06;scene.add(figure);
  const body=buildMannequin(skin);figure.add(body);
  const worn={top:CATALOG[2],layer:null,bottom:CATALOG[6],hat:CATALOG[9]};
  const slots={top:new THREE.Group(),layer:new THREE.Group(),bottom:new THREE.Group(),hat:new THREE.Group(),shoes:new THREE.Group()};
  Object.values(slots).forEach(s=>figure.add(s));
  // sneakers (always on): grey suede upper, white sole
  const suede=fabricMat({color:"#5d6066",fabric:"fleece"}),sole=new THREE.MeshStandardMaterial({color:"#f2f0ec",roughness:.7});
  for(const s of [-1,1]){slots.shoes.add(new THREE.Mesh(shoeGeo(s),suede));slots.shoes.add(new THREE.Mesh(soleGeo(s),sole))}
  const printMat=new THREE.MeshBasicMaterial({map:printTex(),transparent:true,depthWrite:false});

  function dress(slot){const grp=slots[slot];grp.children.slice().forEach(c=>{grp.remove(c);c.geometry.dispose()});const it=worn[slot];if(!it)return;const m=fabricMat(it);
    if(slot==="top"||slot==="layer"){grp.add(new THREE.Mesh(topGeo(it.style),m));for(const s of [-1,1]){grp.add(new THREE.Mesh(sleeveGeo(it.style,s),m));
        if(it.style!=="tee"&&it.style!=="jacket"){const cm=fabricMat({...it,fabric:"rib"});grp.add(new THREE.Mesh(cuffGeo(s),cm))}}
      if(it.style==="hood"){grp.add(new THREE.Mesh(hoodGeo(),m));const cord=new THREE.MeshStandardMaterial({color:"#efede8",roughness:.6});
        for(const s of [-1,1]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.16,8),cord);c.position.set(s*.035,1.36,.135);c.rotation.x=.12;grp.add(c)}}
      if(it.print){const p=new THREE.Mesh(new THREE.PlaneGeometry(.26,.13),printMat);p.position.set(0,1.27,.15);grp.add(p)}
      if(it.style==="jacket"){const collar=new THREE.Mesh(limb([V(-.11,1.47,.02),V(0,1.5,-.1),V(.11,1.47,.02)],()=> .028,{seg:20}),m);grp.add(collar)}}
    else if(slot==="bottom")pantGeo(it.style).forEach(gm=>grp.add(new THREE.Mesh(gm,m)));
    else if(slot==="hat"){grp.add(new THREE.Mesh(beanieGeo(),m));grp.add(new THREE.Mesh(beanieCuffGeo(),fabricMat({...it,fabric:"rib"})))}
    grp.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}})}
  ["top","layer","bottom","hat"].forEach(dress);slots.shoes.traverse(o=>{if(o.isMesh)o.castShadow=true});body.traverse(o=>{if(o.isMesh)o.castShadow=true});
  let swapT=-9;
  function wear(item,instant){if(item.slot==="layer"||item.slot==="hat"){worn[item.slot]=worn[item.slot]===item?null:item}else worn[item.slot]=item;
    dress(item.slot);if(!instant)swapT=performance.now()/1000}

  // camera: begins behind the head, swings round the figure's right side (screen content keeps moving left, like the calendar), then pulls back
  function cameraAt(c,W,H){const head=V(0,1.62,0),full=V(0,.98,0);
    const orbit=smooth(c/.5),zo=smooth((c-.4)/.6);
    const az=lerp(Math.PI,Math.PI*2-.28,1-Math.pow(1-orbit,2.2)); // PI = behind; 2PI = front
    const r=lerp(.55,.95,orbit)*(1-zo)+(H>W?5:3.7)*zo;const tgt=head.clone().lerp(full,zo);
    cam.position.set(tgt.x+Math.sin(az)*r,tgt.y+lerp(.06,.18,zo),tgt.z+Math.cos(az)*r);cam.lookAt(tgt);cam.updateMatrixWorld();
    const right=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0);cam.position.addScaledVector(right,W>760?.48*zo:0)}

  let W=0,H=0;function resize(){const b=canvas.getBoundingClientRect();W=b.width;H=b.height;if(!W)return;renderer.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix()}
  addEventListener("resize",resize);resize();

  function render(c,time){if(!W)resize();
    cameraAt(c,W,H);
    const wake=smooth(c/.2),lit=smooth((c-.32)/.38);
    rimL.intensity=lerp(1.6,3.2,wake)*(1-.6*lit);rimR.intensity=lerp(1.1,2.1,wake)*(1-.6*lit);hemi.intensity=lerp(.06,.85,lit);key.intensity=lerp(0,1.9,lit);
    scene.environmentIntensity=lerp(.12,.55,lit);floor.material.opacity=.15*lit;plinthMat.opacity=lit;
    rings.children.forEach((m,i)=>{m.material.opacity=.13*smooth((c-.72-i*.05)/.15);m.rotation.z=time*(.04+i*.02)*(i%2?-1:1)});
    const st=time-swapT,sk=clamp(st/1);scan.position.y=lerp(.05,1.85,sk);scanMat.opacity=st>=0&&st<1?.5*Math.sin(Math.PI*sk):0;
    renderer.render(scene,cam);return{lit}}

  // product shots from the mannequin itself: each item worn, framed on its slot
  function thumbs(){const keep={top:CATALOG[2],layer:null,bottom:CATALOG[6],hat:CATALOG[9]},live={...worn},w=W,h=H,pr=renderer.getPixelRatio();const out={};
    renderer.setPixelRatio(1);renderer.setSize(320,220,false);scan.visible=false;hemi.intensity=.85;key.intensity=1.9;rimL.intensity=1.2;rimR.intensity=.8;scene.environmentIntensity=.55;floor.material.opacity=0;
    const tc=new THREE.PerspectiveCamera(28,320/220,.05,20);
    for(const it of CATALOG){Object.assign(worn,keep);worn[it.slot]=it;if(it.slot==='layer'&&!keep.top)worn.top=CATALOG[0];["top","layer","bottom","hat"].forEach(dress);
      const fy=it.slot==="bottom"?.5:it.slot==="hat"?1.66:1.22,d=it.slot==="bottom"?2.2:it.slot==="hat"?.85:1.55;
      tc.position.set(.42*d,fy+.08,d);tc.lookAt(0,fy,0);renderer.setClearColor("#e9e7e2",1);renderer.render(scene,tc);out[it.id]=canvas.toDataURL("image/jpeg",.86)}
    Object.assign(worn,live);["top","layer","bottom","hat"].forEach(dress);renderer.setClearColor(0,0);scan.visible=true;renderer.setPixelRatio(pr);renderer.setSize(w,h,false);return out}

  return{ready:Promise.resolve(),render,resize,thumbs,wear:it=>wear(it,false),worn}
}
