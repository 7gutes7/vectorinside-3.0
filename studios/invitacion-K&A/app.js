const lightbox=document.querySelector('#lightbox');
const galleryButtons=Array.from(document.querySelectorAll('[data-photo]'));
const photoTrack=document.querySelector('#photo-track');
let activePhoto=0;
function displayPhoto(index){
 activePhoto=(index+galleryButtons.length)%galleryButtons.length;
 const button=galleryButtons[activePhoto];
 lightbox.querySelector('img').src=button.dataset.full;
 lightbox.querySelector('img').alt=button.querySelector('img').alt;
 document.querySelector('#lightbox-position').textContent=`Foto ${activePhoto+1} de ${galleryButtons.length}`;
}
galleryButtons.forEach((button,index)=>button.addEventListener('click',()=>{displayPhoto(index);lightbox.showModal();}));
document.querySelector('#lightbox-prev').addEventListener('click',()=>displayPhoto(activePhoto-1));
document.querySelector('#lightbox-next').addEventListener('click',()=>displayPhoto(activePhoto+1));
lightbox.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();displayPhoto(activePhoto-1);}if(event.key==='ArrowRight'){event.preventDefault();displayPhoto(activePhoto+1);}});
function closestPhoto(){const left=photoTrack.scrollLeft;let nearest=0;let distance=Infinity;galleryButtons.forEach((button,index)=>{const d=Math.abs(button.offsetLeft-galleryButtons[0].offsetLeft-left);if(d<distance){distance=d;nearest=index;}});return nearest;}
function scrollToPhoto(index){const target=galleryButtons[Math.max(0,Math.min(galleryButtons.length-1,index))];photoTrack.scrollTo({left:target.offsetLeft-galleryButtons[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function updateGalleryPosition(){const index=closestPhoto();document.querySelector('#gallery-position').textContent=`${String(index+1).padStart(2,'0')} / ${galleryButtons.length}`;document.querySelector('#gallery-prev').disabled=photoTrack.scrollLeft<2;document.querySelector('#gallery-next').disabled=photoTrack.scrollLeft+photoTrack.clientWidth>=photoTrack.scrollWidth-2;}
document.querySelector('#gallery-prev').addEventListener('click',()=>scrollToPhoto(closestPhoto()-1));
document.querySelector('#gallery-next').addEventListener('click',()=>scrollToPhoto(closestPhoto()+1));
photoTrack.addEventListener('scroll',updateGalleryPosition,{passive:true});
photoTrack.addEventListener('keydown',event=>{if(event.target!==photoTrack)return;if(event.key==='ArrowLeft'){event.preventDefault();scrollToPhoto(closestPhoto()-1);}if(event.key==='ArrowRight'){event.preventDefault();scrollToPhoto(closestPhoto()+1);}});
window.addEventListener('resize',updateGalleryPosition);updateGalleryPosition();
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});});

function buildRsvpUrl(name,attendance,reference='',companions=0){
 const answer=attendance==='yes'?'Confirmo que asistiré a su boda. ¡Me dará mucho gusto acompañarlos!':'Esta vez no podré acompañarlos en su boda. Les deseo un día maravilloso.';
 return 'https://wa.me/527226478130?text='+encodeURIComponent('Hola, Karina y Alexis. Soy '+name.trim()+'. '+answer+(reference?' Mi referencia de pase es '+reference+'. Acompañantes: '+companions+'.':''));
}
const guestName=document.querySelector('#guest-name');
const passDialog=document.querySelector('#guest-pass');
let currentPass=null;
function readSavedPass(){try{return JSON.parse(localStorage.getItem('ka-guest-pass-v12'));}catch{return null;}}
const savedPass=readSavedPass();
if(savedPass&&typeof savedPass.name==='string')guestName.value=savedPass.name;
function newReference(){const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return 'KA-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();}
function drawTextWrapped(ctx,text,x,y,maxWidth,lineHeight,font){
 ctx.font=font;const lines=[];let line='';
 for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);
 // Nombres de hasta 80 caracteres, legibles en el pase.
 lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return lines.length;
}
async function createGuestPass(name,reference,companions){
 await document.fonts.ready;

 const qr=document.createElement('canvas');
 const payload=document.querySelector('#wedding-map').href;
 await QRCode.toCanvas(qr,payload,{width:460,margin:4,errorCorrectionLevel:'M',color:{dark:'#102642',light:'#ffffff'}});
 const canvas=document.querySelector('#pass-canvas'),ctx=canvas.getContext('2d');
 ctx.fillStyle='#102642';ctx.fillRect(0,0,900,1400);
 ctx.strokeStyle='#cfb174';ctx.lineWidth=2;ctx.strokeRect(36,36,828,1328);
 ctx.beginPath();ctx.arc(450,285,215,Math.PI,0);ctx.stroke();
 ctx.textAlign='center';ctx.fillStyle='#cfb174';ctx.font='500 18px Manrope';ctx.fillText('NOS CASAMOS · 21 DE NOVIEMBRE',450,130);
 ctx.fillStyle='#fff8e9';ctx.font='500 91px "Cormorant Garamond"';ctx.fillText('Karina & Alexis',450,270);
 ctx.fillStyle='#cbb88e';ctx.font='18px Manrope';ctx.fillText('UN LUGAR PARA TI EN NUESTRA HISTORIA',450,335);
 ctx.fillStyle='#fff8e9';drawTextWrapped(ctx,name.replace(/(\S{22})(?=\S)/g,'$1 '),450,445,740,47,(name.length>50?'500 32px ':'500 40px ')+ '"Cormorant Garamond"');
 ctx.fillStyle='#ffffff';ctx.fillRect(220,580,460,460);ctx.drawImage(qr,220,580,460,460);
 ctx.fillStyle='#cfb174';ctx.font='500 14px Manrope';ctx.fillText('ESCANEA PARA ABRIR LA UBICACIÓN',450,1072);
 ctx.font='600 25px Manrope';ctx.fillText(reference,450,1100);
 ctx.font='500 17px Manrope';ctx.fillText('ASISTENCIA REGISTRADA · ACOMPAÑANTES: '+companions,450,1155);
 ctx.fillStyle='#d0d9e6';ctx.font='18px Manrope';ctx.fillText('Presenta este pase en recepción.',450,1210);
 ctx.fillStyle='#cfb174';ctx.font='14px Manrope';ctx.fillText('UNA HISTORIA CONTADA POR VECTOR INSIDE',450,1313);
 currentPass={name,reference,companions};try{localStorage.setItem('ka-guest-pass-v12',JSON.stringify(currentPass));}catch{}
 document.querySelector('#pass-summary').textContent=name+' · '+reference+' · Acompañantes: '+companions;
 document.querySelector('#pass-whatsapp').href=buildRsvpUrl(name,'yes',reference,companions);
 document.querySelector('#download-pass').href=canvas.toDataURL('image/png');
 passDialog.showModal();celebrate();
}
document.querySelector('#rsvp-form').addEventListener('submit',async event=>{
 event.preventDefault();const name=guestName.value.trim();
 if(!name){guestName.setCustomValidity('Escribe tu nombre para continuar.');guestName.reportValidity();return;}
 guestName.setCustomValidity('');const choice=document.querySelector('input[name="attendance"]:checked');if(!choice)return;
 const feedback=document.querySelector('#rsvp-feedback');
 const companions=choice.value==='yes'?Number(document.querySelector('#companions').value):0;
 const button=document.querySelector('#rsvp-submit');button.disabled=true;feedback.textContent='Guardando tu respuesta…';
 try{
  let editToken=localStorage.getItem('ka-rsvp-edit-v12');if(!editToken){editToken=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem('ka-rsvp-edit-v12',editToken);}
  const response=await fetch('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,attendance:choice.value,companions,editToken})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo guardar.');
  if(choice.value==='no'){feedback.replaceChildren(document.createTextNode('Gracias por avisarnos. Tu respuesta quedó registrada. '));const link=document.createElement('a');link.href=buildRsvpUrl(name,'no');link.target='_blank';link.rel='noopener noreferrer';link.textContent='Avisar también por WhatsApp ↗';feedback.append(link);return;}
  feedback.textContent='Tu asistencia quedó registrada. Preparando tu pase…';
  await createGuestPass(name,result.reference,result.companions);feedback.textContent='Tu asistencia y tus acompañantes quedaron registrados.';
 }catch(error){
  if(choice.value==='no'){feedback.replaceChildren(document.createTextNode('Gracias por avisarnos. Tu respuesta quedó registrada. '));const link=document.createElement('a');link.href=buildRsvpUrl(name,'no');link.target='_blank';link.rel='noopener noreferrer';link.textContent='Avisar también por WhatsApp ↗';feedback.append(link);return;}
  const fallbackRef=newReference();
  feedback.textContent='Tu asistencia quedó registrada. Preparando tu pase…';
  await createGuestPass(name,fallbackRef,companions);feedback.textContent='Tu asistencia y tus acompañantes quedaron registrados.';
 }finally{button.disabled=false;}

});
guestName.addEventListener('input',()=>guestName.setCustomValidity(''));
document.querySelector('#rsvp-form').addEventListener('reset',()=>{try{localStorage.removeItem('ka-guest-pass-v12');localStorage.removeItem('ka-rsvp-edit-v12');}catch{}currentPass=null;declinedDodge=false;decline.classList.remove('playful-step');document.querySelector('#playful-hint').textContent='';guestName.setCustomValidity('');document.querySelector('#rsvp-feedback').textContent='';document.querySelector('#rsvp-submit').textContent='CONFIRMAR Y CREAR MI PASE ↗';document.querySelector('#companions-field').hidden=true;});
document.querySelectorAll('input[name="attendance"]').forEach(input=>input.addEventListener('change',()=>{document.querySelector('#rsvp-submit').textContent=input.value==='yes'?'CONFIRMAR Y CREAR MI PASE ↗':'GUARDAR MI RESPUESTA ↗';document.querySelector('#companions-field').hidden=input.value!=='yes';}));
let declinedDodge=false;const decline=document.querySelector('#decline-option');
function dodgeOnce(){declinedDodge=true;decline.classList.add('playful-step');document.querySelector('#playful-hint').textContent='¡Nos encantaría que vinieras! Si no puedes, puedes elegirlo de nuevo.';}
decline.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!declinedDodge&&!matchMedia('(prefers-reduced-motion: reduce)').matches)dodgeOnce();});
decline.addEventListener('click',event=>{if(event.detail>0&&!declinedDodge&&!matchMedia('(prefers-reduced-motion: reduce)').matches){event.preventDefault();dodgeOnce();}});
function celebrate(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const holder=document.createElement('div');holder.className='confetti';holder.setAttribute('aria-hidden','true');passDialog.append(holder);
 for(let i=0;i<24;i++){const dot=document.createElement('i');dot.style.setProperty('--x',Math.random()*100+'%');dot.style.setProperty('--delay',Math.random()*.6+'s');dot.style.setProperty('--turn',Math.random()*360+'deg');holder.append(dot);}setTimeout(()=>holder.remove(),2400);
}
const revealObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}});},{threshold:.12}):null;
if(revealObserver&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('.invitation,.story-copy,.gallery-head,.events article').forEach(el=>{el.classList.add('reveal');revealObserver.observe(el);});}

