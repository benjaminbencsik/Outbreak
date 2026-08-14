"use strict";

// ---------------------------------------------------------------
// SETUP
// ---------------------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Compatibility: some mobile WebViews do not support ctx.roundRect yet.
if(typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    r = Math.min(typeof r === 'number' ? r : 0, Math.abs(w)/2, Math.abs(h)/2);
    this.moveTo(x+r,y);
    this.lineTo(x+w-r,y);
    this.quadraticCurveTo(x+w,y,x+w,y+r);
    this.lineTo(x+w,y+h-r);
    this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    this.lineTo(x+r,y+h);
    this.quadraticCurveTo(x,y+h,x,y+h-r);
    this.lineTo(x,y+r);
    this.quadraticCurveTo(x,y,x+r,y);
    return this;
  };
}
let W=0,H=0,DPR=Math.min(window.devicePixelRatio||1,2);
function resize(){
  W=window.innerWidth; H=window.innerHeight;
  canvas.width=W*DPR; canvas.height=H*DPR;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize',resize); resize();

const WORLD = {w:3200,h:3200};
function rand(a,b){return a+Math.random()*(b-a);}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function pointInRect(px,py,x,y,w,h){return px>=x-w/2 && px<=x+w/2 && py>=y-h/2 && py<=y+h/2;}

// ---------------------------------------------------------------
// GAME STATE
// ---------------------------------------------------------------
let running=false, paused=false, gameOver=false;
let camera={x:0,y:0};
let elapsedSurvived=0;
let kills=0;

const WEAPON_DEFS = {
  hands:   {name:'Hands', melee:true, dmg:10, rate:420, range:46, cost:null},
  pistol:  {name:'Pistol', dmg:9, rate:340, speed:900, spread:0.06, range:520, cost:null},
  smg:     {name:'SMG', dmg:6, rate:110, speed:950, spread:0.13, range:460, cost:{wood:0,metal:10,scrap:14}, lvl:2},
  rifle:   {name:'Rifle', dmg:16, rate:260, speed:1200,spread:0.035,range:760, cost:{wood:0,metal:22,scrap:20}, lvl:4},
  shotgun: {name:'Shotgun', dmg:8, rate:620, speed:820, spread:0.32, range:300, pellets:6, cost:{wood:0,metal:16,scrap:16}, lvl:3},
};

const PART_DEFS = {
  scope:{name:'Scope',icon:'🔭',desc:'+range, -spread',cost:{wood:0,metal:6,scrap:6},effect:{range:1.35,spread:0.7}},
  grip:{name:'Grip',icon:'🤚',desc:'-spread',cost:{wood:2,metal:4,scrap:2},effect:{spread:0.6}},
  extmag:{name:'Extended Mag',icon:'🧲',desc:'+fire rate',cost:{wood:0,metal:8,scrap:8},effect:{rate:0.8}},
  suppressor:{name:'Suppressor',icon:'🔇',desc:'-dmg, quiet',cost:{wood:0,metal:5,scrap:9},effect:{dmg:0.85}},
};

const BUILD_DEFS = {
  wall:{name:'Wood Wall',icon:'🧱',hp:120,cost:{wood:20,metal:0,scrap:0}},
  spike:{name:'Spike Trap',icon:'⚠️',hp:60,cost:{wood:10,metal:5,scrap:0},dmg:14},
  metalwall:{name:'Metal Wall',icon:'🛡️',hp:260,cost:{wood:10,metal:24,scrap:0},lvl:3},
};

const player = {
  x:WORLD.w/2,y:WORLD.h/2,r:15,angle:0,
  hp:100,maxHp:100,level:1,xp:0,xpNext:110,
  speed:3.0,wood:35,metal:15,scrap:10,
  inVehicle:false,fireTimer:0,regenTimer:0,
  weapons:{hands:{owned:true,parts:{}},pistol:{owned:true,parts:{}}},
  curWeapon:'hands',spawnX:WORLD.w/2,spawnY:WORLD.h/2,
};

let zombies=[],bots=[],bullets=[],resourceNodes=[],structures=[],particles=[];
let groundDetails=[];
let vehicle=null;
let monuments=[],lootCrates=[],currentMonument=null,lastMonumentKey=null;

let weather={state:'clear',t:0,dur:32000};
const WEATHER_ORDER=['clear','rain','storm','fog'];
const WEATHER_INFO={
  clear:{icon:'☀️',label:'CLEAR',speedMul:1,visRadius:1400},
  rain:{icon:'🌧️',label:'RAIN',speedMul:0.92,visRadius:620},
  storm:{icon:'⛈️',label:'STORM',speedMul:0.8,visRadius:460},
  fog:{icon:'🌫️',label:'FOG',speedMul:1,visRadius:300},
};
let lightning=null;
let lightningTimer=rand(4000,8000);
let spawnTimer=6000;
let botSpawnTimer=20000;

// ---------------------------------------------------------------
// WORLD GEN
// ---------------------------------------------------------------
function genWorld(){
  resourceNodes=[]; lootCrates=[];
  monuments=[{key:'airfield',name:'ECHO AIRFIELD',icon:'✈️',x:2450,y:850,radius:660,hotRadius:310,threat:2.4,lootTier:3,hint:'High-tier weapon parts and military scrap. Expect heavy infected pressure.',color:'#a2a86b'}];
  for(let i=0;i<70;i++){
    let x=rand(80,WORLD.w-80),y=rand(80,WORLD.h-80);
    const af=monuments[0];
    if(dist({x,y},af)<af.hotRadius){i--;continue;}
    resourceNodes.push({type:Math.random()<0.45?'tree':Math.random()<0.7?'rock':'scrap',x,y,amount:3,r:16,cooldown:0});
  }
  groundDetails=[];
  for(let i=0;i<220;i++) groundDetails.push({x:rand(40,WORLD.w-40),y:rand(40,WORLD.h-40),kind:Math.random()<0.72?'grass':'debris',size:rand(0.8,1.35),rot:rand(0,Math.PI*2)});
  [{x:2320,y:720,tier:3},{x:2520,y:715,tier:3},{x:2685,y:905,tier:2},{x:2355,y:1015,tier:2},{x:2470,y:855,tier:3},{x:2195,y:880,tier:2}].forEach(c=>lootCrates.push({type:'airdrop',x:c.x,y:c.y,tier:c.tier,r:18,amount:1,cooldown:0,monument:'airfield'}));
  vehicle={x:WORLD.w/2+260,y:WORLD.h/2+120,angle:0,speed:0,maxSpeed:7.6,hp:220,maxHp:220,driver:false,w:44,h:26};
}
genWorld();

// ---------------------------------------------------------------
// MONUMENTS / POI RISK-REWARD
// ---------------------------------------------------------------
function getMonumentAt(x,y){
  let best=null;
  for(const m of monuments){const d=Math.hypot(x-m.x,y-m.y);if(d<m.radius&&(!best||d<best.d))best={...m,d,heat:clamp(1-d/m.radius,0,1)};}
  return best;
}
function getSpawnThreatMul(){const m=getMonumentAt(player.x,player.y);if(!m)return 1;return lerp(1.25,m.threat,m.heat);}
function randomPointNearMonument(m,minR,maxR){const ang=rand(0,Math.PI*2),rr=rand(minR,maxR);return{x:clamp(m.x+Math.cos(ang)*rr,20,WORLD.w-20),y:clamp(m.y+Math.sin(ang)*rr,20,WORLD.h-20)};}
function lootCrate(crate){
  if(crate.amount<=0)return;
  crate.amount=0;crate.cooldown=45000+crate.tier*15000;
  const metalGain=rand(6,11)*crate.tier,scrapGain=rand(5,10)*crate.tier;
  player.metal+=metalGain;player.scrap+=scrapGain;player.inventoryParts=player.inventoryParts||{};
  if(Math.random()<0.35+crate.tier*0.15){const keys=Object.keys(PART_DEFS),rk=keys[Math.floor(Math.random()*keys.length)];player.inventoryParts[rk]=(player.inventoryParts[rk]||0)+1;toast('AIRFIELD LOOT',`+${Math.floor(metalGain)} metal, +${Math.floor(scrapGain)} scrap, ${PART_DEFS[rk].name}`);}else toast('AIRFIELD LOOT',`+${Math.floor(metalGain)} metal, +${Math.floor(scrapGain)} scrap`);
  spawnParticles(crate.x,crate.y,'#c9a24b',12);updateHUD();
}

// ---------------------------------------------------------------
// UI ELEMENTS
// ---------------------------------------------------------------
const el=id=>document.getElementById(id);
const hpFill=el('hpFill'),hpText=el('hpText'),xpFill=el('xpFill'),xpText=el('xpText'),lvlNum=el('lvlNum');
const woodCt=el('woodCt'),metalCt=el('metalCt'),scrapCt=el('scrapCt');
const wIcon=el('wIcon'),wLabel=el('wLabel'),interactPrompt=el('interactPrompt'),weaponStrip=el('weaponStrip');
function fmt(n){return Math.floor(n);}
function updateHUD(){
  hpFill.style.width=clamp(player.hp/player.maxHp*100,0,100)+'%';hpText.textContent=fmt(player.hp)+'/'+player.maxHp;
  xpFill.style.width=clamp(player.xp/player.xpNext*100,0,100)+'%';xpText.textContent=fmt(player.xp)+'/'+player.xpNext;lvlNum.textContent=player.level;
  woodCt.textContent=fmt(player.wood);metalCt.textContent=fmt(player.metal);scrapCt.textContent=fmt(player.scrap);
  const wi=WEATHER_INFO[weather.state];wIcon.textContent=wi.icon;wLabel.textContent=wi.label;
  const fireLabel=el('fireBtn');if(fireLabel)fireLabel.textContent=player.curWeapon==='hands'?'PUNCH':'FIRE';renderWeaponStrip();
}
function renderWeaponStrip(){weaponStrip.innerHTML='';Object.keys(player.weapons).forEach(key=>{const d=WEAPON_DEFS[key],div=document.createElement('div');div.className='wSlot'+(key===player.curWeapon?' sel':'');div.textContent=(key==='hands'?'👊 ':key==='pistol'?'🔫 ':'')+d.name;div.onclick=()=>{player.curWeapon=key;updateHUD();toast(key==='hands'?'HANDS READY':'WEAPON READY',d.name);};weaponStrip.appendChild(div);});}
function toast(big,small){const t=el('centerToast');el('toastBig').textContent=big;el('toastSmall').textContent=small||'';t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600);}
function flash(color){const f=el('flash');f.style.background=color||'#fff';f.style.transition='none';f.style.opacity='0.55';requestAnimationFrame(()=>{f.style.transition='opacity .5s';f.style.opacity='0';});}

// ---------------------------------------------------------------
// INPUT: JOYSTICK
// ---------------------------------------------------------------
let move={x:0,y:0,active:false};
let aim={x:1,y:0,active:false,screenX:0,screenY:0};
const joyZone=el('joyZone'),joyBase=el('joyBase'),joyStick=el('joyStick');
let joyId=null,joyOrigin={x:0,y:0};const JOY_R=50;
function joyStart(id,x,y){joyId=id;joyOrigin={x,y};joyBase.style.display='block';joyStick.style.display='block';joyBase.style.left=(x-50)+'px';joyBase.style.top=(y-50)+'px';joyStick.style.left=(x-22)+'px';joyStick.style.top=(y-22)+'px';move.active=true;}
function joyMove(x,y){let dx=x-joyOrigin.x,dy=y-joyOrigin.y;const d=Math.hypot(dx,dy),cl=Math.min(d,JOY_R),ang=Math.atan2(dy,dx),sx=joyOrigin.x+Math.cos(ang)*cl,sy=joyOrigin.y+Math.sin(ang)*cl;joyStick.style.left=(sx-22)+'px';joyStick.style.top=(sy-22)+'px';move.x=d<6?0:Math.cos(ang)*(cl/JOY_R);move.y=d<6?0:Math.sin(ang)*(cl/JOY_R);}
function joyEnd(){joyId=null;joyBase.style.display='none';joyStick.style.display='none';move.x=0;move.y=0;move.active=false;}
joyZone.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];joyStart(t.identifier,t.clientX,t.clientY);},{passive:false});
joyZone.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===joyId)joyMove(t.clientX,t.clientY);},{passive:false});
joyZone.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===joyId)joyEnd();});

// ---------------------------------------------------------------
// INPUT: AIM / FIRE
// ---------------------------------------------------------------
const fireZone=el('fireZone'),fireBtn=el('fireBtn');let fireId=null,firing=false;
function setAimFromScreen(x,y){aim.screenX=x;aim.screenY=y;const pcx=W/2,pcy=H/2,ang=Math.atan2(y-pcy,x-pcx);aim.x=Math.cos(ang);aim.y=Math.sin(ang);player.angle=ang;}
fireZone.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];fireId=t.identifier;firing=true;setAimFromScreen(t.clientX,t.clientY);},{passive:false});
fireZone.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===fireId)setAimFromScreen(t.clientX,t.clientY);},{passive:false});
fireZone.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===fireId){fireId=null;firing=false;}});
fireBtn.addEventListener('touchstart',e=>{e.preventDefault();firing=true;const t=e.changedTouches[0];if(t)setAimFromScreen(t.clientX,t.clientY);},{passive:false});
fireBtn.addEventListener('touchend',e=>{e.preventDefault();firing=false;},{passive:false});
fireBtn.addEventListener('mousedown',e=>{firing=true;setAimFromScreen(e.clientX,e.clientY);});
const keys={};window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);canvas.addEventListener('mousemove',e=>setAimFromScreen(e.clientX,e.clientY));canvas.addEventListener('mousedown',()=>{firing=true;});window.addEventListener('mouseup',()=>{firing=false;});
function keyboardMove(){let x=0,y=0;if(keys['w']||keys['arrowup'])y-=1;if(keys['s']||keys['arrowdown'])y+=1;if(keys['a']||keys['arrowleft'])x-=1;if(keys['d']||keys['arrowright'])x+=1;if(x||y){const d=Math.hypot(x,y);move.x=x/d;move.y=y/d;}else if(!move.active){move.x=0;move.y=0;}}
let nearInteract=null;
interactPrompt.addEventListener('touchstart',e=>{e.preventDefault();doInteract();},{passive:false});interactPrompt.addEventListener('mousedown',()=>doInteract());window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e')doInteract();});
function doInteract(){if(!nearInteract)return;if(nearInteract.type==='vehicle'){if(vehicle.driver){vehicle.driver=false;player.inVehicle=false;player.x=vehicle.x-40;player.y=vehicle.y;}else{vehicle.driver=true;player.inVehicle=true;}}else if(nearInteract.type==='node')gatherNode(nearInteract.ref);else if(nearInteract.type==='crate')lootCrate(nearInteract.ref);}
function gatherNode(node){if(node.amount<=0)return;node.amount--;let key=node.type==='tree'?'wood':node.type==='rock'?'metal':'scrap';player[key]+=rand(4,8);spawnParticles(node.x,node.y,key==='wood'?'#6b8f4e':key==='metal'?'#9aa0a8':'#c9a24b',6);if(node.amount<=0)node.cooldown=25000;updateHUD();}
