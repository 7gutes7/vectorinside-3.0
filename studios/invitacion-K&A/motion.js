// Movimiento progresivo: contenido visible si JavaScript o la animación no están disponibles.
(()=>{
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const root=document.documentElement;
 const fan=document.querySelector('.photo-fan');
 const targets=Array.from(document.querySelectorAll('.gallery-head h2,.guest-memories h3,.rsvp h2,.full-names,.dress,.brand-credit'));
 const scenes=[document.querySelector('.story')].filter(Boolean);
 let observer=null,sceneObserver=null,frame=0;const visibleScenes=new Set();
 document.querySelectorAll('[data-fan-photo]').forEach(card=>card.addEventListener('click',()=>{
  document.querySelector('.gallery-photo[data-photo="'+card.dataset.fanPhoto+'"]').click();
 }));
 function paint(){frame=0;for(const scene of visibleScenes){const box=scene.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(innerHeight/2-box.top-box.height/2)/(innerHeight/2+box.height/2)));scene.style.setProperty('--scene-drift',(progress*(innerWidth<701?9:18)).toFixed(2)+'px');}}
 function requestPaint(){if(!frame)frame=requestAnimationFrame(paint);}
 function configure(){
  observer?.disconnect();sceneObserver?.disconnect();removeEventListener('scroll',requestPaint);removeEventListener('resize',requestPaint);cancelAnimationFrame(frame);frame=0;visibleScenes.clear();
  const enabled=!preference.matches&&'IntersectionObserver'in window;
  root.classList.toggle('motion-on',enabled);
  if(!enabled){targets.forEach(el=>el.classList.remove('motion-ready'));fan.classList.add('fan-open');scenes.forEach(el=>el.style.removeProperty('--scene-drift'));return;}
  targets.forEach((el,index)=>{el.classList.add('motion-ready');el.style.setProperty('--entrance-delay',(index%2)*85+'ms');});
  observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.classList.add(entry.target===fan?'fan-open':'motion-visible');observer.unobserve(entry.target);}},{threshold:.18});
  targets.forEach(el=>observer.observe(el));observer.observe(fan);
  sceneObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visibleScenes.add(entry.target);else visibleScenes.delete(entry.target);}requestPaint();});scenes.forEach(el=>sceneObserver.observe(el));
  addEventListener('scroll',requestPaint,{passive:true});addEventListener('resize',requestPaint,{passive:true});requestPaint();
 }
 preference.addEventListener('change',configure);configure();
})();
