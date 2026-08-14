"use strict";

// ---------------------------------------------------------------
// RENDER
// ---------------------------------------------------------------
function worldToScreen(x,y){ return {x:x-camera.x, y:y-camera.y}; }

function shadow(x,y,rx,ry){
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(x+2,y+2,rx*1.18,ry*1.35,0,0,7); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,7); ctx.fill();
  ctx.restore();
}

function drawTree(x,y){
  shadow(x,y+16,16,6);
  ctx.save();
  const trunk=ctx.createLinearGradient(x-5,y,x+5,y);
  trunk.addColorStop(0,'#3f2919'); trunk.addColorStop(.5,'#765033'); trunk.addColorStop(1,'#392317');
  ctx.fillStyle=trunk; ctx.fillRect(x-4,y-1,8,20);
  ctx.strokeStyle='rgba(32,20,12,.7)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x,y+1); ctx.lineTo(x-1,y+18); ctx.stroke();
  const crown=ctx.createRadialGradient(x-5,y-12,3,x,y-5,23);
  crown.addColorStop(0,'#648548'); crown.addColorStop(.48,'#3f6538'); crown.addColorStop(1,'#213b26');
  ctx.fillStyle=crown;
  [[0,-9,18],[-10,-3,13],[9,-5,14],[-4,-17,12],[8,-15,10]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,7);ctx.fill();});
  ctx.fillStyle='rgba(182,206,139,.18)';
  ctx.beginPath();ctx.arc(x-7,y-14,6,0,7);ctx.fill();
  ctx.restore();
}
function drawRock(x,y){
  shadow(x,y+12,14,5);
  ctx.save();
  const rg=ctx.createLinearGradient(x-12,y-14,x+10,y+10);
  rg.addColorStop(0,'#899096'); rg.addColorStop(.45,'#626b70'); rg.addColorStop(1,'#343b3f');
  ctx.fillStyle=rg; ctx.strokeStyle='#252b2e'; ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x-14,y+8);ctx.lineTo(x-10,y-8);ctx.lineTo(x-2,y-15);ctx.lineTo(x+9,y-11);ctx.lineTo(x+15,y-1);ctx.lineTo(x+10,y+10);ctx.lineTo(x-5,y+12);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.12)';
  ctx.beginPath();ctx.moveTo(x-9,y-8);ctx.lineTo(x-2,y-15);ctx.lineTo(x+1,y-4);ctx.lineTo(x-7,y+1);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawScrapPile(x,y){
  shadow(x,y+10,15,5);
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='#504739'; ctx.beginPath(); ctx.ellipse(0,4,14,7,0,0,7); ctx.fill();
  ctx.save();ctx.rotate(.38);ctx.fillStyle='#8a5a34';ctx.fillRect(-12,-5,22,6);ctx.fillStyle='#b5713d';ctx.fillRect(-8,-4,5,4);ctx.restore();
  ctx.save();ctx.rotate(-.55);ctx.fillStyle='#a4abb0';ctx.fillRect(-9,-8,17,5);ctx.fillStyle='#d0a848';ctx.fillRect(-3,-9,5,7);ctx.restore();
  ctx.strokeStyle='#2d3134';ctx.lineWidth=2;ctx.beginPath();ctx.arc(6,4,5,0,7);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(-6,-7,5,2);
  ctx.restore();
}
function drawGrassClump(x,y,size,rot){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
  ctx.strokeStyle='rgba(84,116,66,0.65)'; ctx.lineWidth=1.4*size; ctx.lineCap='round';
  [[0,0,-2,-8],[0,0,2,-9],[0,0,0,-11],[-2,1,-5,-7],[2,1,5,-7]].forEach(v=>{ ctx.beginPath(); ctx.moveTo(v[0]*size,v[1]*size); ctx.lineTo(v[2]*size,v[3]*size); ctx.stroke(); });
  ctx.restore();
}
function drawDebris(x,y,size,rot){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
  ctx.fillStyle='rgba(120,116,92,0.35)'; ctx.fillRect(-4*size,-1*size,8*size,2*size);
  ctx.fillStyle='rgba(82,88,90,0.25)'; ctx.fillRect(-2*size,-3*size,4*size,2*size);
  ctx.restore();
}
function drawWoodWall(x,y,r){
  shadow(x,y+r*0.7,r*0.9,r*0.3);
  ctx.fillStyle='#7a5230'; ctx.strokeStyle='#3a2612'; ctx.lineWidth=2;
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.roundRect(x-6+i*14,y-r,11,r*2,3);ctx.fill();ctx.stroke();}
  ctx.strokeStyle='#5a3a1e'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x-r*0.8,y); ctx.lineTo(x+r*0.8,y); ctx.stroke();
}
function drawMetalWall(x,y,r){
  shadow(x,y+r*0.7,r*0.9,r*0.3);
  ctx.fillStyle='#7d8892'; ctx.strokeStyle='#2c3238'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(x-r*0.85,y-r,r*1.7,r*2,4); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x-r*0.85,y-r); ctx.lineTo(x+r*0.85,y+r); ctx.moveTo(x-r*0.85,y+r); ctx.lineTo(x+r*0.85,y-r); ctx.stroke();
  ctx.fillStyle='#c7cfd6';
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{ ctx.beginPath(); ctx.arc(x+dx*r*0.65,y+dy*r*0.75,2.2,0,7); ctx.fill(); });
}
function drawSpike(x,y,r){
  shadow(x,y+r*0.5,r*0.9,r*0.35);
  ctx.fillStyle='#4a4f45'; ctx.beginPath(); ctx.arc(x,y,r*0.85,0,7); ctx.fill();
  ctx.fillStyle='#c94a2a'; ctx.strokeStyle='#3a1a10'; ctx.lineWidth=1;
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2;
    const tx=x+Math.cos(a)*r*1.15,ty=y+Math.sin(a)*r*1.15;
    const p1x=x+Math.cos(a+0.35)*r*0.4,p1y=y+Math.sin(a+0.35)*r*0.4;
    const p2x=x+Math.cos(a-0.35)*r*0.4,p2y=y+Math.sin(a-0.35)*r*0.4;
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(p1x,p1y);ctx.lineTo(p2x,p2y);ctx.closePath();ctx.fill();ctx.stroke();
  }
}
function drawJeep(s,angle,speed){
  if(Math.abs(speed)>2){const bx=s.x-Math.cos(angle)*26,by=s.y-Math.sin(angle)*26;spawnParticles(bx+camera.x,by+camera.y,'rgba(120,120,110,0.4)',1);}
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle);shadow(0,5,28,14);
  ctx.fillStyle='#151816';[[-17,-15],[17,-15],[-17,15],[17,15]].forEach(([wx,wy])=>{ctx.beginPath();ctx.roundRect(wx-5,wy-4,10,8,2);ctx.fill();});
  const body=ctx.createLinearGradient(-25,-14,25,14);body.addColorStop(0,'#39462f');body.addColorStop(.5,'#5f713f');body.addColorStop(1,'#2f3929');
  ctx.fillStyle=body;ctx.strokeStyle='#1a2118';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-25,-13,50,26,6);ctx.fill();ctx.stroke();
  ctx.fillStyle='#71844c';ctx.beginPath();ctx.roundRect(-18,-11,20,22,4);ctx.fill();
  ctx.fillStyle='#202923';ctx.beginPath();ctx.roundRect(2,-10,15,20,3);ctx.fill();
  ctx.fillStyle='#9fb7bf';ctx.globalAlpha=.72;ctx.beginPath();ctx.roundRect(4,-8,10,16,2);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(9,-8);ctx.lineTo(9,8);ctx.stroke();
  ctx.fillStyle='#e4d38d';ctx.beginPath();ctx.arc(23,-8,3,0,7);ctx.arc(23,8,3,0,7);ctx.fill();
  ctx.fillStyle='#252a27';ctx.fillRect(-26,-5,3,10);ctx.fillRect(23,-5,3,10);ctx.fillStyle='#1d211e';ctx.fillRect(-8,-2,10,4);ctx.restore();
}
