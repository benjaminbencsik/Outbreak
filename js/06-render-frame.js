"use strict";

function draw(){
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#17251a');bg.addColorStop(1,'#0d1710');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  for(let i=0;i<28;i++){
    const wx=((i*233 - camera.x*.18)%(W+180))-90, wy=((i*151 - camera.y*.16)%(H+160))-80;
    const rr=34+(i%5)*11;ctx.fillStyle=i%3===0?'rgba(105,91,60,.055)':'rgba(70,105,67,.05)';ctx.beginPath();ctx.ellipse(wx,wy,rr,rr*.55,(i%7)*.31,0,7);ctx.fill();
  }
  groundDetails.forEach(g=>{const s=worldToScreen(g.x,g.y);if(s.x<-20||s.x>W+20||s.y<-20||s.y>H+20)return;if(g.kind==='grass')drawGrassClump(s.x,s.y,g.size,g.rot);else drawDebris(s.x,s.y,g.size,g.rot);});
  const bTL=worldToScreen(0,0);ctx.strokeStyle='#5c2a1a';ctx.lineWidth=6;ctx.strokeRect(bTL.x,bTL.y,WORLD.w,WORLD.h);
  monuments.forEach(m=>{if(m.key==='airfield')drawAirfield(m);});
  resourceNodes.forEach(n=>{if(n.amount<=0)return;const s=worldToScreen(n.x,n.y);if(s.x<-40||s.x>W+40||s.y<-40||s.y>H+40)return;if(n.type==='tree')drawTree(s.x,s.y);else if(n.type==='rock')drawRock(s.x,s.y);else drawScrapPile(s.x,s.y);});
  lootCrates.forEach(c=>{if(c.amount<=0)return;const s=worldToScreen(c.x,c.y);if(s.x<-50||s.x>W+50||s.y<-50||s.y>H+50)return;drawLootCrate(s.x,s.y,c.tier);});
  structures.forEach(st=>{const s=worldToScreen(st.x,st.y);if(s.x<-60||s.x>W+60||s.y<-60||s.y>H+60)return;if(st.type==='spike')drawSpike(s.x,s.y,st.r);else if(st.type==='metalwall')drawMetalWall(s.x,s.y,st.r);else drawWoodWall(s.x,s.y,st.r);ctx.fillStyle='#000';ctx.fillRect(s.x-20,s.y-st.r-11,40,4);ctx.fillStyle='#8a9a5b';ctx.fillRect(s.x-20,s.y-st.r-11,40*(st.hp/st.maxHp),4);});
  drawJeep(worldToScreen(vehicle.x,vehicle.y),vehicle.angle,vehicle.speed);
  particles.forEach(p=>{const s=worldToScreen(p.x,p.y);ctx.globalAlpha=clamp(p.life/500,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,p.r,0,7);ctx.fill();ctx.globalAlpha=1;});
  drawWeatherOverlay();
  drawCharacters();
  bullets.forEach(b=>{const s=worldToScreen(b.x,b.y),ang=Math.atan2(b.vy,b.vx),col=b.owner==='player'?'#ffd27a':'#ff5a4a';ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ang);ctx.strokeStyle=col;ctx.globalAlpha=0.55;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-2,0);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,b.r,0,7);ctx.fill();ctx.restore();});
  if(lightning){const s=worldToScreen(lightning.x,lightning.y);if(lightning.phase===0){ctx.strokeStyle='rgba(255,80,60,0.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,70,0,7);ctx.stroke();}else{ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(s.x,s.y,70,0,7);ctx.fill();}}
  const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.24)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}

const fogCanvas=document.createElement('canvas');
const fogCtx=fogCanvas.getContext('2d');
function drawWeatherOverlay(){
  const wi=WEATHER_INFO[weather.state];
  const px=player.x-camera.x,py=player.y-camera.y;
  if(weather.state==='clear')return;
  if(fogCanvas.width!==canvas.width||fogCanvas.height!==canvas.height){fogCanvas.width=canvas.width;fogCanvas.height=canvas.height;}
  fogCtx.setTransform(DPR,0,0,DPR,0,0);fogCtx.clearRect(0,0,W,H);fogCtx.fillStyle='rgba(4,6,4,0.92)';fogCtx.fillRect(0,0,W,H);fogCtx.globalCompositeOperation='destination-out';
  const grad=fogCtx.createRadialGradient(px,py,0,px,py,wi.visRadius);grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(0.75,'rgba(0,0,0,0.85)');grad.addColorStop(1,'rgba(0,0,0,0)');fogCtx.fillStyle=grad;fogCtx.beginPath();fogCtx.arc(px,py,wi.visRadius,0,7);fogCtx.fill();fogCtx.globalCompositeOperation='source-over';
  ctx.save();ctx.drawImage(fogCanvas,0,0,W,H);ctx.restore();
  if(weather.state==='rain'||weather.state==='storm'){
    ctx.strokeStyle='rgba(180,200,220,0.25)';ctx.lineWidth=1;
    for(let i=0;i<40;i++){const rx=(i*97+((performance.now()*0.5)|0))%W,ry=(i*53+((performance.now()*0.8)|0))%H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-6,ry+14);ctx.stroke();}
  }
}
