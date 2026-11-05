(()=>{
 const audio=document.querySelector('#wedding-music');
 const lines=Array.from(document.querySelectorAll('[data-lyric]'));
 const slider=document.querySelector('#song-progress');
 const elapsed=document.querySelector('#song-elapsed');
 const duration=document.querySelector('#song-duration');
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let cues=[],active=-2,changeTimer=0;
 const format=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
 function show(index){
  if(index===active)return;active=index;clearTimeout(changeTimer);
  const text=index>=0?cues[index].text:(audio.currentTime<15?'Un instante para guardar.':'Photograph');
  const paint=()=>{for(const line of lines){line.textContent=text;line.classList.remove('lyric-changing');}};
  if(preference.matches)paint();else{lines.forEach(line=>line.classList.add('lyric-changing'));changeTimer=setTimeout(paint,180);}
 }
 function update(){
  const time=audio.currentTime;
  elapsed.textContent=format(time);
  if(Number.isFinite(audio.duration)){slider.max=audio.duration;slider.disabled=false;duration.textContent=format(audio.duration);}
  slider.value=time;
  slider.setAttribute('aria-valuetext',`${format(time)} de ${Number.isFinite(audio.duration)?format(audio.duration):'4:18'}`);
  if(cues.length&&(audio.readyState>0||time>0||!audio.paused))show(cues.findIndex(cue=>time>=cue.start&&time<cue.end));
 }
 slider.addEventListener('input',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(slider.value);update();}});
 for(const event of ['timeupdate','loadedmetadata','seeked','play','pause','ended'])audio.addEventListener(event,update);
 fetch('assets/music/photograph-lyrics.json').then(response=>{if(!response.ok)throw new Error();return response.json();}).then(data=>{cues=data.cues;update();}).catch(()=>{lines.forEach(line=>line.textContent='Disfruta nuestra canción junto a nuestros recuerdos.');});
})();
