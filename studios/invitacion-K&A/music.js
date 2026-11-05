(()=>{
 const audio=document.querySelector('#wedding-music');
 const hero=document.querySelector('.hero');
 const button=document.querySelector('#music-toggle');
 const floating=document.querySelector('#music-float');
 const status=document.querySelector('#music-status');
 const lyricButton=document.querySelector('#lyrics-toggle');
 const controls=[button,floating,lyricButton].filter(Boolean);
 let loading=false,hasPlayed=false;
 audio.volume=.55;
 function render(){
  const playing=!audio.paused&&!audio.ended;
  for(const control of controls){control.setAttribute('aria-pressed',String(playing));control.disabled=loading;}
  document.querySelector('#music-label').textContent=playing?'PAUSAR MÚSICA':'TOCA PARA ESCUCHAR';
  if(lyricButton)lyricButton.textContent=playing?'PAUSAR CANCIÓN Ⅱ':'ESCUCHAR CANCIÓN ♫';
  document.querySelector('#music-icon').textContent=playing?'Ⅱ':'♫';
  floating.querySelector('span').textContent=playing?'Ⅱ':'♫';
  floating.setAttribute('aria-label',playing?'Pausar música':'Reanudar música');
  floating.hidden=!hasPlayed;
  document.body.classList.toggle('music-playing',playing);
 }
 async function toggle(){
  if(loading)return;
  if(!audio.paused){audio.pause();return;}
  loading=true;status.textContent='Preparando nuestra canción…';render();
  try{await audio.play();hasPlayed=true;status.textContent='La canción está sonando. Puedes pausarla cuando quieras.';}
  catch{status.textContent='No se pudo iniciar la canción. Toca otra vez para intentarlo.';}
  finally{loading=false;render();}
 }
 for(const control of controls)control.addEventListener('click',toggle);
 audio.addEventListener('play',()=>{hasPlayed=true;render();});
 audio.addEventListener('pause',()=>{status.textContent='Música en pausa.';render();});
 audio.addEventListener('error',()=>{loading=false;status.textContent='No pudimos cargar la canción. Puedes seguir disfrutando la invitación.';render();});
 if('IntersectionObserver'in window){new IntersectionObserver(entries=>{hero.classList.toggle('is-in-view',entries[0].isIntersecting);},{threshold:0}).observe(hero);}else hero.classList.add('is-in-view');
 render();
})();
