"use strict";

// ---------------------------------------------------------------
// PANELS
// ---------------------------------------------------------------
function openPanel(id){ el(id).classList.add('open'); paused=true; }
function closePanel(id){ el(id).classList.remove('open'); paused=false; }
document.querySelectorAll('[data-close]').forEach(b=>{
  b.addEventListener('click',()=>closePanel(b.dataset.close));
});
el('btnBuild').addEventListener('click',()=>{ renderBuildPanel(); openPanel('buildOverlay'); });
el('btnCraft').addEventListener('click',()=>{ renderCraftPanel(); openPanel('craftOverlay'); });
el('btnGun').addEventListener('click',()=>{ renderGunPanel(); openPanel('gunOverlay'); });

document.querySelectorAll('.tabBtn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tabBtn').forEach(b=>b.classList.remove('on'));
    document.querySelectorAll('.tabPane').forEach(p=>p.classList.remove('on'));
    btn.classList.add('on'); el('tab'+btn.dataset.tab[0].toUpperCase()+btn.dataset.tab.slice(1)).classList.add('on');
  });
});

function affordStr(cost){
  const parts=[];
  if(cost.wood) parts.push(`<span class="${player.wood>=cost.wood?'ok':'bad'}">${cost.wood}🪵</span>`);
  if(cost.metal) parts.push(`<span class="${player.metal>=cost.metal?'ok':'bad'}">${cost.metal}⚙️</span>`);
  if(cost.scrap) parts.push(`<span class="${player.scrap>=cost.scrap?'ok':'bad'}">${cost.scrap}🔩</span>`);
  return parts.join('  ');
}
function canAfford(cost){
  return (!cost.wood||player.wood>=cost.wood) && (!cost.metal||player.metal>=cost.metal) && (!cost.scrap||player.scrap>=cost.scrap);
}
function pay(cost){
  player.wood-=cost.wood||0; player.metal-=cost.metal||0; player.scrap-=cost.scrap||0;
}

let placingStructure=null;

function renderBuildPanel(){
  const list=el('buildList'); list.innerHTML='';
  Object.entries(BUILD_DEFS).forEach(([key,d])=>{
    if(d.lvl && player.level<d.lvl) return;
    const row=document.createElement('div'); row.className='itemRow';
    row.innerHTML=`<div class="itemInfo"><div class="itemName">${d.icon} ${d.name}</div>
      <div class="itemCost">${affordStr(d.cost)} &nbsp; HP ${d.hp}</div></div>`;
    const btn=document.createElement('button'); btn.className='buyBtn';
    btn.textContent= placingStructure===key ? 'Placing…' : 'Place';
    btn.disabled=!canAfford(d.cost);
    btn.onclick=()=>{
      placingStructure=key;
      closePanel('buildOverlay');
      toast('SELECT LOCATION','Tap the ground near you to place '+d.name);
    };
    row.appendChild(btn); list.appendChild(row);
  });
}

function renderCraftPanel(){
  const wList=el('tabWeapons'); wList.innerHTML='';
  Object.entries(WEAPON_DEFS).forEach(([key,d])=>{
    if(key==='pistol'||key==='hands') return;
    if(d.lvl && player.level<d.lvl){
      const row=document.createElement('div'); row.className='itemRow';
      row.innerHTML=`<div class="itemInfo"><div class="itemName" style="opacity:.5">${d.name}</div>
        <div class="itemCost">Unlocks at Level ${d.lvl}</div></div>`;
      wList.appendChild(row); return;
    }
    const owned=player.weapons[key];
    const row=document.createElement('div'); row.className='itemRow';
    row.innerHTML=`<div class="itemInfo"><div class="itemName">${d.name}</div>
      <div class="itemCost">${owned?'Crafted':affordStr(d.cost)} &nbsp; DMG ${d.dmg}</div></div>`;
    const btn=document.createElement('button'); btn.className='buyBtn'+(owned?' equipped':'');
    btn.textContent= owned? 'Owned':'Craft';
    btn.disabled= owned || !canAfford(d.cost);
    btn.onclick=()=>{ pay(d.cost); player.weapons[key]={owned:true,parts:{}}; player.curWeapon=key; updateHUD(); renderCraftPanel(); toast('CRAFTED', d.name+' ready to fire'); };
    row.appendChild(btn); wList.appendChild(row);
  });

  const pList=el('tabParts'); pList.innerHTML='';
  Object.entries(PART_DEFS).forEach(([key,d])=>{
    const owned = player.inventoryParts && player.inventoryParts[key];
    const row=document.createElement('div'); row.className='itemRow';
    row.innerHTML=`<div class="itemInfo"><div class="itemName">${d.icon} ${d.name}</div>
      <div class="itemCost">${d.desc} — ${affordStr(d.cost)}</div></div>`;
    const btn=document.createElement('button'); btn.className='buyBtn';
    btn.textContent='Craft';
    btn.disabled=!canAfford(d.cost);
    btn.onclick=()=>{
      pay(d.cost);
      player.inventoryParts = player.inventoryParts||{};
      player.inventoryParts[key]=(player.inventoryParts[key]||0)+1;
      updateHUD(); renderCraftPanel();
      toast('CRAFTED', d.name+' added to inventory');
    };
    row.appendChild(btn); pList.appendChild(row);
  });
}

function renderGunPanel(){
  const key=player.curWeapon; const d=WEAPON_DEFS[key]; const w=player.weapons[key];
  el('gunEquippedName').textContent=d.name;
  if(key==='hands'){
    el('gunPartList').innerHTML='<div class="hint">Hands cannot use gun parts. Switch to the pistol or a crafted weapon to attach parts.</div>';
    el('gunStats').innerHTML='<b>Punch:</b> short range melee for zombies, raiders, and quick gathering.';
    return;
  }
  const list=el('gunPartList'); list.innerHTML='';
  player.inventoryParts=player.inventoryParts||{};
  Object.entries(PART_DEFS).forEach(([pk,pd])=>{
    const count=player.inventoryParts[pk]||0;
    const attached = w.parts[pk];
    const row=document.createElement('div'); row.className='itemRow';
    row.innerHTML=`<div class="itemInfo"><div class="itemName">${pd.icon} ${pd.name}</div>
      <div class="itemCost">${pd.desc} — Owned: ${count}</div></div>`;
    const btn=document.createElement('button'); btn.className='partToggle'+(attached?' on':'');
    btn.textContent= attached?'Detach':'Attach';
    btn.disabled = !attached && count<=0;
    btn.onclick=()=>{
      if(attached){ w.parts[pk]=false; player.inventoryParts[pk]++; }
      else { w.parts[pk]=true; player.inventoryParts[pk]--; }
      renderGunPanel();
    };
    row.appendChild(btn); list.appendChild(row);
  });
  const stats=computeWeaponStats(key);
  el('gunStats').innerHTML = `<b>Damage:</b> ${stats.dmg.toFixed(1)} &nbsp; <b>Fire Rate:</b> ${stats.rate.toFixed(0)}ms &nbsp; <b>Range:</b> ${stats.range.toFixed(0)} &nbsp; <b>Spread:</b> ${(stats.spread*100).toFixed(0)}%`;
}

function computeWeaponStats(key){
  const d=WEAPON_DEFS[key]; const w=player.weapons[key];
  if(d.melee) return {dmg:d.dmg, rate:d.rate, range:d.range, spread:0, pellets:1, melee:true};
  let dmg=d.dmg, rate=d.rate, range=d.range, spread=d.spread;
  if(w && w.parts){
    if(w.parts.scope){ range*=PART_DEFS.scope.effect.range; spread*=PART_DEFS.scope.effect.spread; }
    if(w.parts.grip){ spread*=PART_DEFS.grip.effect.spread; }
    if(w.parts.extmag){ rate*=PART_DEFS.extmag.effect.rate; }
    if(w.parts.suppressor){ dmg*=PART_DEFS.suppressor.effect.dmg; }
  }
  return {dmg,rate,range,spread,pellets:d.pellets||1};
}

canvas.addEventListener('touchstart', handleCanvasTap, {passive:false});
canvas.addEventListener('mousedown', handleCanvasTap);
function handleCanvasTap(e){
  if(!placingStructure) return;
  e.preventDefault();
  const t = e.touches? e.touches[0] : e;
  const wx = t.clientX + camera.x, wy = t.clientY + camera.y;
  if(dist({x:wx,y:wy}, player) > 200){ toast('TOO FAR','Move closer to place'); return; }
  const d=BUILD_DEFS[placingStructure];
  if(!canAfford(d.cost)){ toast('NOT ENOUGH RESOURCES',''); placingStructure=null; return; }
  pay(d.cost);
  structures.push({type:placingStructure, x:wx, y:wy, hp:d.hp, maxHp:d.hp, r:22});
  placingStructure=null;
  updateHUD();
}

// ---------------------------------------------------------------
// SPAWNING
// ---------------------------------------------------------------
function spawnZombie(){
  let x,y;
  const m=getMonumentAt(player.x,player.y);
  if(m && Math.random()<0.68){
    const p=randomPointNearMonument(m, m.hotRadius*0.45, m.radius*0.98);
    x=p.x; y=p.y;
  } else {
    const ang=rand(0,Math.PI*2);
    const rr=rand(620,920);
    x=clamp(player.x+Math.cos(ang)*rr,20,WORLD.w-20);
    y=clamp(player.y+Math.sin(ang)*rr,20,WORLD.h-20);
  }
  const localThreat=getMonumentAt(x,y);
  const heat=localThreat?localThreat.heat:0;
  const bruteChance=0.07 + heat*0.25;
  const tier=Math.random()<bruteChance?'brute':'walker';
  const hpBoost=1+heat*0.30;
  const baseHp=tier==='brute'?105:30;
  zombies.push({x,y,r:tier==='brute'?23:15,hp:baseHp*hpBoost,maxHp:baseHp*hpBoost,speed:(tier==='brute'?0.95:rand(1.25,1.75))*(1+heat*0.08),dmg:tier==='brute'?18:8,atkCooldown:0,tier,targetStruct:null,phase:rand(0,10),angle:0,lean:rand(-0.15,0.15),monument:localThreat?localThreat.key:null});
}
function spawnBot(){
  const ang=rand(0,Math.PI*2),rr=rand(780,1000),local=getMonumentAt(player.x,player.y),heat=local?local.heat:0,hp=58+heat*18;
  bots.push({x:clamp(player.x+Math.cos(ang)*rr,20,WORLD.w-20),y:clamp(player.y+Math.sin(ang)*rr,20,WORLD.h-20),r:15,hp,maxHp:hp,speed:1.6+heat*.08,fireTimer:rand(0,600),dmg:7+heat*1.5,phase:rand(0,10),angle:0,muzzle:0});
}
function spawnParticles(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-2,2),vy:rand(-2,2),life:400+Math.random()*300,color,r:rand(2,4)});}

// ---------------------------------------------------------------
// COMBAT
// ---------------------------------------------------------------
function punch(){
  const stats=computeWeaponStats('hands'); if(player.fireTimer>0)return; player.fireTimer=stats.rate;
  const originX=player.inVehicle?vehicle.x:player.x,originY=player.inVehicle?vehicle.y:player.y,ang=Math.atan2(aim.y,aim.x),hitX=originX+Math.cos(ang)*stats.range,hitY=originY+Math.sin(ang)*stats.range;
  let hit=false;
  for(const z of zombies){if(dist({x:hitX,y:hitY},z)<z.r+28||dist({x:originX,y:originY},z)<z.r+stats.range){z.hp-=stats.dmg;z.x+=Math.cos(ang)*10;z.y+=Math.sin(ang)*10;spawnParticles(z.x,z.y,'#7a1f1f',5);hit=true;break;}}
  if(!hit)for(const b of bots){if(dist({x:hitX,y:hitY},b)<b.r+26||dist({x:originX,y:originY},b)<b.r+stats.range){b.hp-=stats.dmg*0.8;b.x+=Math.cos(ang)*8;b.y+=Math.sin(ang)*8;spawnParticles(b.x,b.y,'#7a1f1f',4);hit=true;break;}}
  if(!hit&&!player.inVehicle)for(const n of resourceNodes){if(n.amount>0&&dist({x:hitX,y:hitY},n)<n.r+28){gatherNode(n);hit=true;break;}}
  spawnParticles(originX+Math.cos(ang)*24,originY+Math.sin(ang)*24,hit?'#e8e4d0':'#9aa08c',4);
}
function useEquippedAction(){if(player.curWeapon==='hands')punch();else shoot();}
function shoot(){
  if(player.curWeapon==='hands'){punch();return;}
  const stats=computeWeaponStats(player.curWeapon);if(player.fireTimer>0)return;player.fireTimer=stats.rate;
  const originX=player.inVehicle?vehicle.x:player.x,originY=player.inVehicle?vehicle.y:player.y,baseAngle=Math.atan2(aim.y,aim.x);
  for(let i=0;i<stats.pellets;i++){const sp=(Math.random()-0.5)*stats.spread*2,ang=baseAngle+sp;bullets.push({x:originX+Math.cos(ang)*20,y:originY+Math.sin(ang)*20,vx:Math.cos(ang)*stats.speed/60,vy:Math.sin(ang)*stats.speed/60,dmg:stats.dmg,owner:'player',life:stats.range/(stats.speed/60),r:4});}
  spawnParticles(originX+Math.cos(baseAngle)*22,originY+Math.sin(baseAngle)*22,'#ffd27a',3);
}
function botShoot(bot){const ang=Math.atan2(player.y-bot.y,player.x-bot.x)+rand(-0.08,0.08);bullets.push({x:bot.x+Math.cos(ang)*16,y:bot.y+Math.sin(ang)*16,vx:Math.cos(ang)*9,vy:Math.sin(ang)*9,dmg:bot.dmg,owner:'bot',life:80,r:4});bot.muzzle=110;}
function gainXP(n){player.xp+=n;while(player.xp>=player.xpNext){player.xp-=player.xpNext;player.level++;player.xpNext=Math.floor(player.xpNext*1.28);player.maxHp+=14;player.hp=player.maxHp;toast('LEVEL UP','Level '+player.level+' — Max HP '+player.maxHp);flash('#8a9a5b');}updateHUD();}
function damagePlayer(n){if(gameOver)return;player.hp-=n;flash('#d94f30');if(player.hp<=0){player.hp=0;die();}updateHUD();}
function die(){gameOver=true;paused=true;el('deathStats').textContent=`Survived ${Math.floor(elapsedSurvived/1000)}s — Level ${player.level} — Kills ${kills}`;el('deathOverlay').style.display='flex';}
el('respawnBtn').addEventListener('click',()=>{player.hp=player.maxHp*0.6;player.x=player.spawnX;player.y=player.spawnY;player.inVehicle=false;if(vehicle)vehicle.driver=false;zombies=zombies.filter(z=>dist(z,player)>400);el('deathOverlay').style.display='none';gameOver=false;paused=false;updateHUD();});
