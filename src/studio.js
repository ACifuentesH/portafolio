// STUDIO — the fashion field. A free Ready Player Me avatar (from the three.js examples) restyled as an obsidian
// mannequin; the camera starts behind its head in the dark, circles to the face, then pulls back to a white studio
// with a shop whose garments are tried on the model itself.
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";

export const CATALOG=[
  {id:"obs",name:"Obsidian Shell",kind:"Tailored jacket",price:320,color:"#2a2a2e",rough:.38,metal:.15,sheen:.6,code:"OBS-01"},
  {id:"sig",name:"Signal Coat",kind:"Tailored jacket",price:380,color:"#ff2d4b",rough:.55,metal:0,sheen:.4,code:"SIG-02"},
  {id:"bone",name:"Bone Tailor",kind:"Tailored jacket",price:290,color:"#e7e1d6",rough:.7,metal:0,sheen:.3,code:"BNE-03"},
  {id:"cob",name:"Cobalt Knit",kind:"Tailored jacket",price:260,color:"#2f56ff",rough:.6,metal:0,sheen:.8,code:"CBK-04"},
  {id:"chr",name:"Chrome Edition",kind:"Tailored jacket",price:640,color:"#eef1f4",rough:.12,metal:1,sheen:0,code:"CHR-05"},
  {id:"iri",name:"Iris Foil",kind:"Tailored jacket",price:520,color:"#d8dce6",rough:.25,metal:.6,sheen:0,iri:1,code:"IRS-06"}
];

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t,smooth=x=>{x=clamp(x);return x*x*(3-2*x)};

// greyscale copy of a texture so a garment keeps its weave and seams but takes any colour cleanly
function greyTexture(tex){const img=tex.image;if(!img||!img.width)return tex;
  const c=document.createElement("canvas");c.width=img.width;c.height=img.height;const g=c.getContext("2d");g.drawImage(img,0,0);
  const d=g.getImageData(0,0,c.width,c.height),a=d.data;
  for(let i=0;i<a.length;i+=4){const l=.3*a[i]+.59*a[i+1]+.11*a[i+2],v=Math.min(255,34+l*.62);a[i]=a[i+1]=a[i+2]=v}
  g.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.flipY=tex.flipY;t.wrapS=tex.wrapS;t.wrapT=tex.wrapT;return t}

export function createStudio(canvas,{base="/models/"}={}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();const BLACK=new THREE.Color("#000"),WHITE=new THREE.Color("#efeeea");scene.background=null;
  const cam=new THREE.PerspectiveCamera(32,1,.02,60);
  // a soft studio reflected in chrome, foil and the obsidian skin
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=0;

  // light: a rim that draws the obsidian edges in the dark, then a soft white studio
  const hemi=new THREE.HemisphereLight("#ffffff","#c9c4bc",0);scene.add(hemi);
  const key=new THREE.DirectionalLight("#ffffff",0);key.position.set(2.5,4.5,3.5);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=1;key.shadow.camera.far=12;key.shadow.radius=6;key.shadow.bias=-.0004;scene.add(key);
  const rim=new THREE.DirectionalLight("#cfe0ff",2.6);rim.position.set(-3,2.6,-3.5);scene.add(rim);
  const rim2=new THREE.DirectionalLight("#ffd6dc",1.4);rim2.position.set(3.5,2,-2.5);scene.add(rim2);

  // white plinth with engraved rings + a soft shadow catcher
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({opacity:0}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const plinthMat=new THREE.MeshStandardMaterial({color:"#f7f6f3",roughness:.9,transparent:true,opacity:0});
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.62,.66,.04,96),plinthMat);plinth.position.y=.02;plinth.receiveShadow=true;scene.add(plinth);
  const rings=new THREE.Group();scene.add(rings);
  for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.75+i*.22,.752+i*.22,128),new THREE.MeshBasicMaterial({color:"#111",transparent:true,opacity:0}));
    m.rotation.x=-Math.PI/2;m.position.y=.002;rings.add(m)}
  // scanner band used when a garment is swapped
  const scanMat=new THREE.MeshBasicMaterial({color:"#ff2d4b",transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const scan=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.025,64,1,true),scanMat);scene.add(scan);

  const S={ready:null,model:null,top:null,bottom:null,bones:{},garment:CATALOG[0],swapT:-9,target:new THREE.Vector3(),offsetX:0};
  const obsidian=new THREE.MeshPhysicalMaterial({color:"#08080a",roughness:.22,metalness:.15,clearcoat:1,clearcoatRoughness:.12});

  S.ready=new GLTFLoader().loadAsync(base+"avatar.glb").then(g=>{
    const m=g.scene;S.model=m;scene.add(m);
    m.traverse(o=>{if(o.isBone)S.bones[o.name]=o;if(!o.isMesh)return;o.castShadow=true;o.frustumCulled=false;const n=o.material.name;
      if(n==="Wolf3D_Headwear"||n==="Wolf3D_Beard")o.visible=false;
      else if(n==="Wolf3D_Outfit_Top"||n==="Wolf3D_Outfit_Bottom"){const mt=new THREE.MeshPhysicalMaterial({map:o.material.map?greyTexture(o.material.map):null,normalMap:o.material.normalMap||null,roughness:.5,sheen:.4,sheenRoughness:.6,sheenColor:new THREE.Color("#ffffff")});
        o.material=mt;if(n==="Wolf3D_Outfit_Top")S.top=mt;else S.bottom=mt}
      else o.material=obsidian});
    S.bottom.color.set("#1b1b1e");S.bottom.roughness=.6;
    for(const b of Object.values(S.bones))b.userData.q0=b.quaternion.clone();
    applyGarment(CATALOG[0],true);
    return S});

  function applyGarment(g,instant){S.garment=g;const t=S.top;if(!t)return;
    t.color.set(g.color);t.roughness=g.rough;t.metalness=g.metal;t.sheen=g.sheen;t.iridescence=g.iri||0;t.iridescenceIOR=1.6;t.iridescenceThicknessMinimum=180;t.iridescenceThicknessMaximum=820;
    t.sheenColor.set(g.color).multiplyScalar(.6);t.envMapIntensity=g.metal>.5?1.1:.3;t.needsUpdate=true;if(!instant)S.swapT=performance.now()/1000}

  // a relaxed pose built from the rig itself: arms down, slight elbow bend, weight on one leg, breathing
  const qe=new THREE.Quaternion(),eu=new THREE.Euler();
  function bone(n,x=0,y=0,z=0){const b=S.bones[n];if(!b)return;eu.set(x,y,z);b.quaternion.copy(b.userData.q0).multiply(qe.setFromEuler(eu))}
  function pose(t){
    const br=Math.sin(t*1.6)*.5+.5,sw=Math.sin(t*.55);
    bone("Hips",0,sw*.03,sw*.012);bone("Spine",br*.018,0,0);bone("Spine1",br*.02,sw*-.02,0);bone("Spine2",br*.015,0,0);
    bone("Neck",0,Math.sin(t*.33)*.08,0);bone("Head",-.04+Math.sin(t*.47)*.02,Math.sin(t*.33+.6)*.12,0);
    bone("LeftArm",.14,1.42+br*.02,0);bone("RightArm",.14,-1.42-br*.02,0);
    bone("LeftForeArm",0,.22,-.15);bone("RightForeArm",0,-.22,.15);
    bone("LeftUpLeg",0,0,.03+sw*.01);bone("RightUpLeg",0,0,-.015)}

  // camera choreography over c in [0,1]: behind the head in the dark -> right side -> face -> pull back to the studio
  function cameraAt(c,W,H){
    const head=new THREE.Vector3(0,1.66,0),body=new THREE.Vector3(0,.98,0);
    const a1=smooth(c/.32),a2=smooth((c-.3)/.28),zo=smooth((c-.56)/.44);
    const az=lerp(lerp(Math.PI,Math.PI*.5,a1),-.22,a2)*(1-zo)+(-.32)*zo; // radians around the figure (0 = front)
    const r=lerp(lerp(.3,.62,a1),.78,a2)*(1-zo)+(H>W?5.2:3.9)*zo;
    const tgt=head.clone().lerp(body,zo);
    const side=W>760?.5*zo:0; // leave room on the right for the shop
    const p=new THREE.Vector3(tgt.x+Math.sin(az)*r,tgt.y+lerp(.04,.16,zo),tgt.z+Math.cos(az)*r);
    cam.position.copy(p);const look=tgt.clone();cam.lookAt(look);
    cam.updateMatrixWorld();const right=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0);
    cam.position.addScaledVector(right,side);
    return{zo}}

  let W=0,H=0;
  function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;if(!W)return;renderer.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix()}
  addEventListener("resize",resize);resize();

  function render(c,time){if(!S.model)return{lit:smooth((c-.38)/.42)};if(!W)resize();
    pose(time);
    const {zo}=cameraAt(c,W,H);
    const lit=smooth((c-.38)/.42);
    const wake=smooth((c-.12)/.3); // rims come up as the camera leaves the back of the head
    hemi.intensity=lerp(0,1.05,lit);key.intensity=lerp(0,2.2,lit);rim.intensity=lerp(0,2.6,wake)*(1-.55*lit);rim2.intensity=lerp(0,1.4,wake)*(1-.55*lit);
    scene.environmentIntensity=lerp(.05,.75,lit)*wake;
    floor.material.opacity=.16*lit;plinthMat.opacity=lit;rings.children.forEach((m,i)=>{m.material.opacity=.14*smooth((c-.7-i*.05)/.15);m.rotation.z=time*(.05+i*.03)*(i%2?-1:1)});
    // garment swap scanner: a red band climbs the body
    const st=time-S.swapT,sk=clamp(st/1.1);scan.position.y=lerp(.05,1.85,sk);scanMat.opacity=st>=0&&st<1.1?.55*Math.sin(Math.PI*sk):0;
    renderer.render(scene,cam);return{lit}}

  // product shots for the shop cards, rendered from the model itself
  async function thumbs(){await S.ready;const keep=S.garment,bg=scene.background,w=W,h=H,pr=renderer.getPixelRatio();
    const tc=new THREE.PerspectiveCamera(26,320/380,.05,20);tc.position.set(.55,1.42,1.55);tc.lookAt(0,1.22,0);
    renderer.setPixelRatio(1);renderer.setSize(320,380,false);scene.background=WHITE.clone();scan.visible=false;
    hemi.intensity=1.05;key.intensity=2.2;rim.intensity=1.2;rim2.intensity=.6;scene.environmentIntensity=.75;floor.material.opacity=0;pose(1.2);const out={};
    for(const g of CATALOG){applyGarment(g,true);renderer.render(scene,tc);out[g.id]=canvas.toDataURL("image/jpeg",.86)}
    applyGarment(keep,true);scene.background=bg;scan.visible=true;renderer.setPixelRatio(pr);renderer.setSize(w,h,false);return out}

  return{ready:S.ready,render,resize,applyGarment:g=>applyGarment(g,false),thumbs,get garment(){return S.garment}}
}
