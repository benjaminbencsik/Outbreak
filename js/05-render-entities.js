"use strict";

function drawZombie(x,y,r,angle,phase,tier){
  const brute=tier==='brute';
  const gait=Math.sin(phase);
  const bob=Math.abs(Math.cos(phase))*1.3;
  shadow(x,y+r*.86,r*1.08,r*.4);
  ctx.save();ctx.translate(x,y+bob);ctx.rotate(angle);
  const skin=brute?'#786047':'#718653';
  const skinDark=brute?'#4c3e31':'#465b3b';
  const cloth=brute?'#4a3c34':'#344438';
  const clothHi=brute?'#665147':'#465b48';
  ctx.lineCap='round';ctx.strokeStyle='#1d2720';ctx.lineWidth=brute?7:5;
  ctx.beginPath();ctx.moveTo(-4,4);ctx.lineTo(-7+gait*5,r*.92);ctx.stroke();
  ctx.beginPath();ctx.moveTo(4,4);ctx.lineTo(7-gait*5,r*.92);ctx.stroke();
  ctx.fillStyle='#151b17';ctx.beginPath();ctx.ellipse(-8+gait*5,r*.98,6,3,.08,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(8-gait*5,r*.98,6,3,-.08,0,7);ctx.fill();
  const tg=ctx.createLinearGradient(-r,-r,r,r);tg.addColorStop(0,clothHi);tg.addColorStop(.55,cloth);tg.addColorStop(1,'#222d27');
  ctx.fillStyle=tg;ctx.strokeStyle='#131a16';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,-1,r*.78,r*.86,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(20,25,21,.38)';ctx.beginPath();ctx.moveTo(-r*.62,-r*.5);ctx.lineTo(-r*.18,-r*.62);ctx.lineTo(-r*.28,r*.16);ctx.lineTo(-r*.7,r*.05);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(118,31,27,.72)';ctx.beginPath();ctx.ellipse(-r*.32,r*.12,r*.23,r*.17,-.35,0,7);ctx.fill();
  ctx.fillStyle='rgba(190,83,55,.32)';ctx.beginPath();ctx.ellipse(-r*.28,r*.08,r*.10,r*.07,-.35,0,7);ctx.fill();
  ctx.strokeStyle=skinDark;ctx.lineWidth=brute?8:6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-r*.52,-r*.18);ctx.lineTo(r*.48,-r*.42+gait*2);ctx.stroke();ctx.beginPath();ctx.moveTo(r*.48,r*.08);ctx.lineTo(r*.94,r*.30-gait*2);ctx.stroke();
  ctx.strokeStyle=skin;ctx.lineWidth=brute?5:4;ctx.beginPath();ctx.moveTo(r*.46,-r*.40+gait*2);ctx.lineTo(r*.92,-r*.38);ctx.stroke();
  ctx.fillStyle=skinDark;ctx.fillRect(-r*.15,-r*.78,r*.3,r*.22);ctx.fillStyle=skin;ctx.strokeStyle='#242920';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,-r*1.02,r*.45,r*.50,-.08,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(83,41,33,.72)';ctx.beginPath();ctx.arc(-r*.20,-r*.98,r*.14,0,7);ctx.fill();ctx.fillStyle='#303329';ctx.beginPath();ctx.arc(r*.06,-r*1.25,r*.30,Math.PI,0);ctx.fill();
  ctx.fillStyle='#d9674e';ctx.beginPath();ctx.arc(-r*.14,-r*1.05,2,0,7);ctx.arc(r*.16,-r*1.05,2,0,7);ctx.fill();ctx.strokeStyle='#34231f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.16,-r*.82);ctx.lineTo(r*.20,-r*.79);ctx.stroke();
  ctx.fillStyle='#d2c7a6';for(let i=-1;i<=1;i++)ctx.fillRect(i*3-1,-r*.82,1.5,2.5);
  if(brute){ctx.strokeStyle='rgba(115,69,48,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*.55,-r*.52);ctx.lineTo(r*.5,r*.36);ctx.stroke();}
  ctx.restore();
}

function drawRaider(x,y,r,angle,phase,muzzleFlash){
  shadow(x,y+r*.8,r*.95,r*.34);ctx.save();ctx.translate(x,y);const step=Math.sin(phase)*5;
  ctx.strokeStyle='#272522';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-3,2);ctx.lineTo(-3+step,r*.92);ctx.stroke();ctx.beginPath();ctx.moveTo(3,2);ctx.lineTo(3-step,r*.92);ctx.stroke();
  ctx.rotate(angle);const jacket=ctx.createLinearGradient(-r,0,r,0);jacket.addColorStop(0,'#572625');jacket.addColorStop(.55,'#8a3a33');jacket.addColorStop(1,'#3f1b1b');
  ctx.fillStyle=jacket;ctx.strokeStyle='#1b0d0c';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,r*.78,r*.7,0,0,7);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#d1c7ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.5,-r*.42);ctx.lineTo(r*.42,r*.42);ctx.stroke();
  ctx.fillStyle='#171a19';ctx.fillRect(r*.25,-3,r*1.22,6);ctx.fillRect(r*.42,2,6,7);ctx.fillStyle='#59605c';ctx.fillRect(r*.62,-2,r*.34,4);
  if(muzzleFlash){ctx.fillStyle='#ffd78a';ctx.beginPath();ctx.moveTo(r*1.52,0);ctx.lineTo(r*1.85,-6);ctx.lineTo(r*1.73,0);ctx.lineTo(r*1.85,6);ctx.closePath();ctx.fill();}
  ctx.rotate(-angle);ctx.fillStyle='#c99a72';ctx.beginPath();ctx.arc(0,-r*1.04,r*.42,0,7);ctx.fill();ctx.fillStyle='#343a36';ctx.beginPath();ctx.arc(0,-r*1.15,r*.46,Math.PI,0);ctx.fill();ctx.fillStyle='#171a18';ctx.fillRect(-r*.4,-r*1.12,r*.8,3);ctx.restore();
}

function drawSurvivor(x,y,angle,isFiring){
  const moving=Math.hypot(move.x,move.y)>.08;
  const gait=moving?Math.sin(elapsedSurvived*.018)*5:0;
  const bob=moving?Math.abs(Math.cos(elapsedSurvived*.018))*1.1:0;
  shadow(x,y+15,16,5.5);
  ctx.save();ctx.translate(x,y+bob);ctx.rotate(angle);
  ctx.strokeStyle='#252a27';ctx.lineWidth=5.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4,4);ctx.lineTo(-6+gait,14);ctx.stroke();ctx.beginPath();ctx.moveTo(4,4);ctx.lineTo(6-gait,14);ctx.stroke();
  ctx.fillStyle='#141817';ctx.beginPath();ctx.ellipse(-7+gait,15,5,2.6,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(7-gait,15,5,2.6,0,0,7);ctx.fill();
  const pack=ctx.createLinearGradient(-15,-10,-2,12);pack.addColorStop(0,'#526146');pack.addColorStop(1,'#28352d');ctx.fillStyle=pack;ctx.strokeStyle='#172019';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-16,-9,14,20,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#6d694d';ctx.beginPath();ctx.roundRect(-17,8,15,5,2);ctx.fill();ctx.strokeStyle='#202920';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-10,-7);ctx.lineTo(-10,9);ctx.stroke();
  const torso=ctx.createLinearGradient(-14,-11,14,11);torso.addColorStop(0,'#757552');torso.addColorStop(.48,'#b2a777');torso.addColorStop(1,'#5f654a');ctx.fillStyle=torso;ctx.strokeStyle='#111713';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(0,0,15.5,13.2,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(34,43,32,.55)';ctx.fillRect(-2,-11,4,22);ctx.strokeStyle='#53623d';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-10,-9);ctx.lineTo(9,8);ctx.stroke();ctx.fillStyle='#5c644b';ctx.beginPath();ctx.roundRect(-10,3,6,5,1);ctx.fill();
  const skin='#d6b28d';
  if(player.curWeapon==='hands'){
    const jab=isFiring?10:1;ctx.strokeStyle='#756b50';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(8,-6);ctx.lineTo(18+jab,-7);ctx.stroke();ctx.beginPath();ctx.moveTo(8,6);ctx.lineTo(19,8);ctx.stroke();ctx.fillStyle=skin;ctx.beginPath();ctx.arc(20+jab,-7,3.6,0,7);ctx.arc(21,8,3.6,0,7);ctx.fill();
  }else{
    ctx.strokeStyle='#756b50';ctx.lineWidth=5.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(7,-6);ctx.lineTo(17,-3);ctx.stroke();ctx.beginPath();ctx.moveTo(7,6);ctx.lineTo(17,2);ctx.stroke();ctx.fillStyle=skin;ctx.beginPath();ctx.arc(17,-3,3,0,7);ctx.arc(17,2,3,0,7);ctx.fill();
    const longGun=player.curWeapon==='rifle'||player.curWeapon==='shotgun'||player.curWeapon==='smg';const gunLen=longGun?31:20;ctx.fillStyle='#151918';ctx.beginPath();ctx.roundRect(14,-3,gunLen,6,2);ctx.fill();ctx.fillStyle='#59605b';ctx.fillRect(18,-5,longGun?13:8,2.5);ctx.fillStyle='#101312';ctx.fillRect(18,2,5,7);if(longGun){ctx.fillStyle='#353b38';ctx.fillRect(11,-2,7,4);}if(isFiring){const mx=15+gunLen;ctx.fillStyle='#ffd47c';ctx.beginPath();ctx.moveTo(mx,0);ctx.lineTo(mx+11,-6);ctx.lineTo(mx+7,0);ctx.lineTo(mx+11,6);ctx.closePath();ctx.fill();}
  }
  ctx.fillStyle=skin;ctx.fillRect(-3,-13,6,4);ctx.fillStyle='#d7b58f';ctx.strokeStyle='#171b18';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,-16,8.8,9.4,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#3b3429';ctx.beginPath();ctx.arc(0,-19,8.8,Math.PI,0);ctx.fill();ctx.fillStyle='#262c27';ctx.fillRect(-8,-20,16,3);ctx.fillStyle='#171c18';ctx.beginPath();ctx.arc(3,-16,1.25,0,7);ctx.fill();ctx.strokeStyle='rgba(81,56,44,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(3,-12);ctx.lineTo(6,-12);ctx.stroke();ctx.restore();
}

function drawAirfield(m){
  const s=worldToScreen(m.x,m.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-0.08);ctx.fillStyle='#373e3a';ctx.fillRect(-225,-135,470,220);ctx.fillStyle='rgba(255,255,255,.025)';for(let i=-210;i<230;i+=42)ctx.fillRect(i,-135,3,220);
  const rg=ctx.createLinearGradient(-370,-42,370,42);rg.addColorStop(0,'#262c29');rg.addColorStop(.5,'#444a45');rg.addColorStop(1,'#252a27');ctx.fillStyle=rg;ctx.strokeStyle='#626a63';ctx.lineWidth=3;ctx.fillRect(-370,-44,740,88);ctx.strokeRect(-370,-44,740,88);ctx.strokeStyle='rgba(235,231,213,.6)';ctx.lineWidth=3;ctx.setLineDash([24,20]);ctx.beginPath();ctx.moveTo(-330,0);ctx.lineTo(330,0);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(235,231,213,.72)';ctx.lineWidth=2;for(let x of [-330,300])for(let y=-28;y<=28;y+=14){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+28,y);ctx.stroke();}for(let x=-330;x<=330;x+=55){ctx.fillStyle='rgba(210,225,190,.6)';ctx.beginPath();ctx.arc(x,-48,1.8,0,7);ctx.arc(x,48,1.8,0,7);ctx.fill();}ctx.restore();
  const buildings=[[-165,-145,110,72],[55,-150,130,78],[255,95,116,70],[-245,120,92,62]];buildings.forEach(([dx,dy,w,h],idx)=>{const b=worldToScreen(m.x+dx,m.y+dy);shadow(b.x,b.y+h*.42,w*.48,8);const hg=ctx.createLinearGradient(b.x-w/2,b.y-h/2,b.x+w/2,b.y+h/2);hg.addColorStop(0,'#667069');hg.addColorStop(.5,'#4a534e');hg.addColorStop(1,'#2d3531');ctx.fillStyle=hg;ctx.strokeStyle='#202622';ctx.lineWidth=2;ctx.fillRect(b.x-w/2,b.y-h/2,w,h);ctx.strokeRect(b.x-w/2,b.y-h/2,w,h);ctx.fillStyle='#262e2a';ctx.fillRect(b.x-w*.34,b.y+h*.05,w*.68,h*.44);ctx.strokeStyle='rgba(255,255,255,.08)';ctx.beginPath();for(let k=-w/2+12;k<w/2;k+=18){ctx.moveTo(b.x+k,b.y-h/2+4);ctx.lineTo(b.x+k+10,b.y+h/2-4);}ctx.stroke();if(idx<2){ctx.fillStyle='rgba(188,198,174,.18)';ctx.fillRect(b.x-w/2+8,b.y-h/2+8,w-16,7);}});
}
function drawLootCrate(x,y,tier){shadow(x,y+11,15,5);ctx.save();const g=ctx.createLinearGradient(x-15,y-12,x+15,y+12);g.addColorStop(0,tier>=3?'#777d47':'#725f37');g.addColorStop(1,tier>=3?'#3d4429':'#43351f');ctx.fillStyle=g;ctx.strokeStyle='#1d2117';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-16,y-12,32,24,3);ctx.fill();ctx.stroke();ctx.fillStyle='#c6a246';ctx.fillRect(x-3,y-13,6,26);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(x-13,y-9,26,3);ctx.fillStyle='#20251c';ctx.fillRect(x-4,y-2,8,5);ctx.restore();}
function drawCharacters(){zombies.forEach(z=>{const s=worldToScreen(z.x,z.y);if(s.x<-50||s.x>W+50||s.y<-50||s.y>H+50)return;drawZombie(s.x,s.y,z.r,z.angle,z.phase,z.tier);ctx.fillStyle='#000';ctx.fillRect(s.x-16,s.y-z.r-16,32,3.5);ctx.fillStyle='#8fae4d';ctx.fillRect(s.x-16,s.y-z.r-16,32*(z.hp/z.maxHp),3.5);});bots.forEach(b=>{const s=worldToScreen(b.x,b.y);if(s.x<-50||s.x>W+50||s.y<-50||s.y>H+50)return;drawRaider(s.x,s.y,b.r,b.angle,b.phase,b.muzzle>0);ctx.fillStyle='#000';ctx.fillRect(s.x-16,s.y-b.r-18,32,3.5);ctx.fillStyle='#d94f30';ctx.fillRect(s.x-16,s.y-b.r-18,32*(b.hp/b.maxHp),3.5);});if(!player.inVehicle){const s=worldToScreen(player.x,player.y);drawSurvivor(s.x,s.y,player.angle,firing);}}
