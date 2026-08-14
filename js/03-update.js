"use strict";

// ---------------------------------------------------------------
// MAIN UPDATE
// ---------------------------------------------------------------
let lastT=performance.now();
function update(dt){
  if(paused||gameOver) return;
  elapsedSurvived+=dt;

  weather.t+=dt;
  if(weather.t>weather.dur){
    weather.t=0;
    let idx=WEATHER_ORDER.indexOf(weather.state);
    weather.state=WEATHER_ORDER[(idx+1)%WEATHER_ORDER.length];
    weather.dur = weather.state==='clear'? rand(26000,34000): rand(18000,26000);
    toast('WEATHER SHIFTING', WEATHER_INFO[weather.state].label);
  }
  const wi=WEATHER_INFO[weather.state];

  if(weather.state==='storm'){
    lightningTimer-=dt;
    if(lightning){
      lightning.t+=dt;
      if(lightning.phase===0 && lightning.t>1100){ lightning.phase=1; lightning.t=0;
        if(dist(lightning,player)<70 && !player.inVehicle){ damagePlayer(22); flash('#fff'); }
        zombies.forEach(z=>{ if(dist(lightning,z)<70) z.hp-=40; });
      }
      if(lightning.phase===1 && lightning.t>150){ lightning=null; lightningTimer=rand(5000,9000); }
    } else if(lightningTimer<=0){
      lightning={x:player.x+rand(-500,500), y:player.y+rand(-500,500), t:0, phase:0};
    }
  }

  resourceNodes.forEach(n=>{ if(n.amount<=0){ n.cooldown-=dt; if(n.cooldown<=0){ n.amount=3; } } });
  lootCrates.forEach(c=>{ if(c.amount<=0){ c.cooldown-=dt; if(c.cooldown<=0){ c.amount=1; } } });

  currentMonument=getMonumentAt(player.x,player.y);
  const monKey=currentMonument?currentMonument.key:null;
  if(monKey!==lastMonumentKey){
    lastMonumentKey=monKey;
    if(currentMonument) toast(currentMonument.icon+' '+currentMonument.name, currentMonument.hint);
    else toast('WILDERNESS','Lower loot, lower infected density');
  }

  spawnTimer-=dt;
  const threatMul=getSpawnThreatMul();
  const survivalPressure=clamp(elapsedSurvived/480000,0,1);
  const spawnInterval=clamp(4200/threatMul - survivalPressure*550, 1250, 4600);
  const zombieCap=Math.floor(9 + threatMul*4 + survivalPressure*5);
  if(spawnTimer<=0 && zombies.length<zombieCap){
    spawnZombie();
    spawnTimer=spawnInterval*rand(.82,1.18);
  }

  zombies=zombies.filter(z=>dist(z,player)<1450 || (currentMonument && z.monument===currentMonument.key));

  botSpawnTimer-=dt;
  if(botSpawnTimer<=0 && bots.length<3){ spawnBot(); botSpawnTimer=rand(currentMonument?19000:26000,currentMonument?29000:38000); }

  keyboardMove();
  if(player.inVehicle){
    const throttle = -move.y;
    vehicle.speed = clamp(vehicle.speed + throttle*0.4, -vehicle.maxSpeed*0.5, vehicle.maxSpeed);
    vehicle.speed *= 0.965;
    if(Math.abs(vehicle.speed)>0.05){ vehicle.angle += move.x*0.045*Math.sign(vehicle.speed||1); }
    vehicle.x += Math.cos(vehicle.angle)*vehicle.speed;
    vehicle.y += Math.sin(vehicle.angle)*vehicle.speed;
    vehicle.x=clamp(vehicle.x,30,WORLD.w-30); vehicle.y=clamp(vehicle.y,30,WORLD.h-30);
    player.x=vehicle.x; player.y=vehicle.y;
    zombies.forEach(z=>{
      if(dist(z,vehicle)<34 && Math.abs(vehicle.speed)>1.5){ z.hp-=6; z.x -= Math.cos(vehicle.angle)*4; z.y -= Math.sin(vehicle.angle)*4; }
    });
  } else {
    const spd = player.speed * wi.speedMul;
    let nx=player.x+move.x*spd, ny=player.y+move.y*spd;
    let blocked=false;
    for(const s of structures){
      if(Math.hypot(nx-s.x, ny-s.y) < player.r+s.r*0.6){ blocked=true; break; }
    }
    if(!blocked){ player.x=clamp(nx,20,WORLD.w-20); player.y=clamp(ny,20,WORLD.h-20); }
    if(move.x||move.y) player.angle = firing? player.angle : Math.atan2(move.y,move.x);
  }

  player.regenTimer-=dt;
  if(player.regenTimer<=0 && player.hp<player.maxHp && player.hp>0){ player.hp=Math.min(player.maxHp,player.hp+0.4); }

  if(player.fireTimer>0) player.fireTimer-=dt;
  if(firing && !placingStructure) useEquippedAction();

  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    b.x+=b.vx*dt*0.06; b.y+=b.vy*dt*0.06; b.life-=dt*0.06;
    let dead = b.life<=0;
    if(b.owner==='player'){
      for(const z of zombies){ if(!dead && dist(b,z)<z.r+b.r){ z.hp-=b.dmg; dead=true; spawnParticles(b.x,b.y,'#7a1f1f',4); } }
      for(const bo of bots){ if(!dead && dist(b,bo)<bo.r+b.r){ bo.hp-=b.dmg; dead=true; spawnParticles(b.x,b.y,'#7a1f1f',4); } }
    } else {
      if(!player.inVehicle && dist(b,player)<player.r+b.r){ damagePlayer(b.dmg); dead=true; }
      if(player.inVehicle && dist(b,vehicle)<26){ dead=true; }
    }
    for(const s of structures){ if(!dead && dist(b,s)<s.r){ s.hp-=b.dmg||5; dead=true; } }
    if(dead) bullets.splice(i,1);
  }

  for(let i=zombies.length-1;i>=0;i--){
    const z=zombies[i];
    if(z.hp<=0){
      spawnParticles(z.x,z.y,'#4a5a34',8);
      kills++; gainXP(z.tier==='brute'?24:11);
      if(Math.random()<0.5) player.scrap+=rand(1,3);
      zombies.splice(i,1); continue;
    }
    let target = player.inVehicle? vehicle : player;
    let blockedStruct=null;
    for(const s of structures){
      if(dist(z,s) < 40 && dist(z,target) > dist(s,target)){ blockedStruct=s; break; }
    }
    const tgt = blockedStruct || target;
    const ang=Math.atan2(tgt.y-z.y, tgt.x-z.x);
    const spd=z.speed*WEATHER_INFO[weather.state].speedMul;
    z.x+=Math.cos(ang)*spd; z.y+=Math.sin(ang)*spd;
    z.angle=ang; z.phase+=spd*0.35;
    z.atkCooldown-=dt;
    const rangeR = (blockedStruct? blockedStruct.r : (target===vehicle?36:player.r))+z.r+4;
    if(dist(z,tgt)<rangeR && z.atkCooldown<=0){
      z.atkCooldown=800;
      if(blockedStruct){ blockedStruct.hp-=z.dmg; }
      else if(target===vehicle){ vehicle.hp-=z.dmg*0.6; }
      else { damagePlayer(z.dmg); }
    }
  }

  structures=structures.filter(s=>s.hp>0);
  structures.forEach(s=>{ if(s.type==='spike'){ zombies.forEach(z=>{ if(dist(z,s)<s.r+z.r){ z.hp-=BUILD_DEFS.spike.dmg*dt/1000; } }); } });

  for(let i=bots.length-1;i>=0;i--){
    const b=bots[i];
    if(b.hp<=0){ spawnParticles(b.x,b.y,'#7a1f1f',8); kills++; gainXP(30);
      player.inventoryParts=player.inventoryParts||{};
      const keys=Object.keys(PART_DEFS); const rk=keys[Math.floor(Math.random()*keys.length)];
      player.inventoryParts[rk]=(player.inventoryParts[rk]||0)+1;
      player.metal+=rand(2,6);
      bots.splice(i,1); continue;
    }
    const tgt = player.inVehicle? vehicle : player;
    const d=dist(b,tgt);
    const ang=Math.atan2(tgt.y-b.y, tgt.x-b.x);
    b.angle=ang;
    if(d>360){ b.x+=Math.cos(ang)*b.speed; b.y+=Math.sin(ang)*b.speed; b.phase+=b.speed*0.35; }
    else if(d<220){ b.x-=Math.cos(ang)*b.speed*0.6; b.y-=Math.sin(ang)*b.speed*0.6; b.phase+=b.speed*0.25; }
    b.fireTimer-=dt;
    if(b.muzzle>0) b.muzzle-=dt;
    if(d<520 && b.fireTimer<=0){ b.fireTimer=rand(700,1200); botShoot(b); }
  }

  for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.life-=dt; if(p.life<=0) particles.splice(i,1); }

  nearInteract=null;
  if(!player.inVehicle && dist(player,vehicle)<70){ nearInteract={type:'vehicle'}; }
  if(vehicle.driver && dist(vehicle,vehicle)<9999 && player.inVehicle){ nearInteract={type:'vehicle'}; }
  if(!nearInteract && !player.inVehicle){
    for(const c of lootCrates){ if(c.amount>0 && dist(c,player)<72){ nearInteract={type:'crate',ref:c}; break; } }
  }
  if(!nearInteract && !player.inVehicle){
    for(const n of resourceNodes){ if(n.amount>0 && dist(n,player)<64){ nearInteract={type:'node',ref:n}; break; } }
  }
  interactPrompt.style.display = nearInteract? 'block':'none';
  if(nearInteract){
    interactPrompt.textContent = nearInteract.type==='vehicle' ? (player.inVehicle?'Tap to exit jeep':'Tap to enter jeep') : nearInteract.type==='crate' ? 'Loot airfield crate' : 'Gathering… (tap for bonus)';
  }
  player.gatherCooldown = (player.gatherCooldown||0) - dt;
  if(nearInteract && nearInteract.type==='node' && player.gatherCooldown<=0){
    gatherNode(nearInteract.ref);
    player.gatherCooldown = player.curWeapon==='hands' ? 450 : 900;
  }

  const cx=player.x, cy=player.y;
  camera.x=clamp(cx-W/2,0,WORLD.w-W);
  camera.y=clamp(cy-H/2,0,WORLD.h-H);

  updateHUD();
}
