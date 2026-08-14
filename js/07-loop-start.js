"use strict";

function loop(t){
  const dt=Math.min(50,t-lastT); lastT=t;
  if(running){ update(dt); draw(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

el('startBtn').addEventListener('click',()=>{
  el('startOverlay').style.display='none';
  running=true; updateHUD();
});
