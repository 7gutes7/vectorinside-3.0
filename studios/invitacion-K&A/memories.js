const memoryDialog=document.querySelector('#memory-dialog');
document.querySelector('#open-memory').addEventListener('click',()=>memoryDialog.showModal());
async function loadMemories(){
 try{const response=await fetch('api/photos');if(!response.ok)throw new Error();const data=await response.json();const track=document.querySelector('#memory-track');track.replaceChildren();
 for(const memory of data.photos){const card=document.createElement('article');card.className='memory-card';const image=document.createElement('img');image.src='media/'+memory.id+'.jpg';image.alt='Recuerdo compartido por '+memory.name;image.loading='lazy';const quote=document.createElement('p');quote.textContent=memory.caption;const name=document.createElement('span');name.textContent=memory.name;card.append(image,quote,name);track.append(card);}
 document.querySelector('#memory-empty').hidden=data.photos.length>0;
 }catch{document.querySelector('#memory-empty').textContent='El álbum compartido estará disponible cuando se conecte el servicio de recuerdos.';}
}
loadMemories();
const photoInput=document.querySelector('#memory-file');let previewUrl;
photoInput.addEventListener('change',()=>{const preview=document.querySelector('#memory-preview');if(previewUrl)URL.revokeObjectURL(previewUrl);const file=photoInput.files[0];preview.hidden=!file;if(file){previewUrl=URL.createObjectURL(file);preview.src=previewUrl;}});
document.querySelector('#memory-form').addEventListener('submit',async event=>{
 event.preventDefault();const feedback=document.querySelector('#memory-feedback');const button=event.target.querySelector('button[type=submit]');const file=photoInput.files[0];
 if(!file||file.size>8000000){feedback.textContent='Elige una foto de hasta 8 MB.';return;}
 button.disabled=true;feedback.textContent='Enviando tu recuerdo…';
 try{
  const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
  const response=await fetch('api/photos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.querySelector('#memory-name').value.trim(),caption:document.querySelector('#memory-caption').value.trim(),consent:document.querySelector('#memory-consent').checked,image})});
  const result=await response.json();if(!response.ok)throw new Error(result.error);event.target.reset();document.querySelector('#memory-preview').hidden=true;if(previewUrl)URL.revokeObjectURL(previewUrl);feedback.textContent='¡Gracias! Recibimos tu recuerdo. Aparecerá en el álbum cuando los organizadores lo aprueben.';
 }catch(error){feedback.textContent=error.message==='Failed to fetch'?'No pudimos enviarlo. Revisa tu conexión e intenta de nuevo.':(error.message||'No pudimos enviar la foto. Intenta de nuevo.');}finally{button.disabled=false;}
});
