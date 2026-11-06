let csrf='',dashboardData={guests:[],photos:[]};
const $=s=>document.querySelector(s);
const fmtDate=ts=>ts?new Date(ts*1000).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
async function request(path,data){
  const response=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},body:data?JSON.stringify(data):undefined});
  let result;
  try{
    result=await response.json();
  }catch(e){
    if(response.status===401){$('#dashboard').hidden=true;$('#login').hidden=false;}
    throw new Error('El servicio de datos no devolvió respuesta JSON. Si acabas de actualizar en GitHub, realiza Deploy y Purge All en Hostinger.');
  }
  if(response.status===401){$('#dashboard').hidden=true;$('#login').hidden=false;}
  if(!response.ok)throw new Error(result.error||'No pudimos completar la acción.');
  return result;
}
async function refresh(){
  try{
    dashboardData=await request('api/admin/dashboard');
    for(const key of ['confirmed','companions','people','pending'])$('#total-'+key).textContent=dashboardData.totals[key];
    $('#declined-summary').textContent=dashboardData.totals.declined+' personas indicaron que no podrán asistir.';
    $('#dashboard').hidden=false;$('#login').hidden=true;
    renderGuests();renderPhotos();
    $('#last-update').textContent='Actualizado '+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
    $('#panel-feedback').textContent='';
  }catch(error){$('#panel-feedback').textContent=error.message;}
}
$('#login-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
  try{const session=await request('api/admin/login',{password:$('#password').value});csrf=session.csrf;$('#password').value='';$('#login-feedback').textContent='';await refresh();}
  catch(error){$('#login-feedback').textContent=error.message;}
  finally{button.disabled=false;}
});
$('#refresh').addEventListener('click',refresh);
$('#logout').addEventListener('click',async()=>{
  try{await request('api/admin/logout',{});csrf='';dashboardData={guests:[],photos:[]};$('#guest-rows').replaceChildren();$('#photo-grid').replaceChildren();$('#dashboard').hidden=true;$('#login').hidden=false;}
  catch(error){$('#panel-feedback').textContent=error.message;}
});
for(const [button,panel] of [['guests','guests-panel'],['photos','photos-panel']])$('#show-'+button).addEventListener('click',()=>{
  for(const name of ['guests','photos']){$('#show-'+name).setAttribute('aria-pressed',String(name===button));$('#'+name+'-panel').hidden=name!==button;}
});

function visibleGuests(){
  const query=$('#guest-search').value.toLocaleLowerCase('es');
  const filter=$('#guest-filter').value;
  return dashboardData.guests.filter(g=>(filter==='all'||g.attendance===filter)&&[g.name,g.email,g.phone,g.id].join(' ').toLocaleLowerCase('es').includes(query));
}
function renderGuests(){
  const guests=visibleGuests();const body=$('#guest-rows');body.replaceChildren();
  for(const guest of guests){
    const tr=document.createElement('tr');
    const yes=guest.attendance==='yes';
    const cells=[
      [fmtDate(guest.created||guest.updated),''],
      [guest.id,''],
      [guest.name,''],
      [guest.email,guest.email?'':'empty'],
      [guest.phone,guest.phone?'':'empty'],
      [yes?'Sí asistirá':'No asistirá',yes?'yes':'no'],
      [yes?guest.companions:0,''],
      [yes?Number(guest.companions)+1:0,''],
      [guest.notes,'notes'+(guest.notes?'':' empty')]
    ];
    for(const [value,cls] of cells){const td=document.createElement('td');td.textContent=(value===''||value==null)?'—':value;if(cls)td.className=cls;tr.append(td);}
    const actions=document.createElement('td');const del=document.createElement('button');del.className='danger';del.textContent='Eliminar';
    del.addEventListener('click',async()=>{
      if(!confirm('¿Eliminar la respuesta de '+guest.name+'? Esta acción no se puede deshacer.'))return;
      del.disabled=true;
      try{await request('api/admin/delete-guest',{id:guest.id});await refresh();}catch(error){$('#panel-feedback').textContent=error.message;del.disabled=false;}
    });
    actions.append(del);tr.append(actions);body.append(tr);
  }
  $('#guest-empty').hidden=guests.length>0;
  $('#guest-empty').textContent=dashboardData.guests.length?'Ninguna respuesta coincide con tu búsqueda.':'Aún no hay respuestas registradas.';
}
$('#guest-search').addEventListener('input',renderGuests);
$('#guest-filter').addEventListener('change',renderGuests);

function renderPhotos(){
  const grid=$('#photo-grid');grid.replaceChildren();
  const filter=$('#photo-filter').value;
  const photos=dashboardData.photos.filter(p=>filter==='all'||p.status===filter);
  for(const photo of photos){
    const card=document.createElement('article');
    const img=document.createElement('img');img.src='media/'+photo.id+'.jpg';img.alt='Recuerdo de '+photo.name;img.loading='lazy';
    const name=document.createElement('h3');name.textContent=photo.name;
    const code=document.createElement('span');code.className='photo-code';code.textContent=photo.rsvp_id?'Código '+photo.rsvp_id:'Sin código';
    const caption=document.createElement('p');caption.textContent=photo.caption;
    const status=document.createElement('small');status.textContent={pending:'Pendiente de revisión',approved:'Publicado en la invitación',hidden:'Oculto'}[photo.status]+(photo.created?' · '+fmtDate(photo.created):'');
    const actions=document.createElement('div');
    for(const [label,state] of [['Aprobar y publicar','approved'],['Ocultar','hidden']]){
      if(state===photo.status)continue;
      const button=document.createElement('button');button.textContent=label;button.className=state==='hidden'?'secondary':'';
      button.addEventListener('click',async()=>{button.disabled=true;try{await request('api/admin/moderate',{id:photo.id,status:state});await refresh();}catch(error){$('#panel-feedback').textContent=error.message;button.disabled=false;}});
      actions.append(button);
    }
    const download=document.createElement('a');download.className='button';download.textContent='Descargar';download.href='media/'+photo.id+'.jpg';download.download=photo.rsvp_id?photo.rsvp_id+'-'+photo.id.slice(0,6)+'.jpg':'Recuerdo-'+photo.name.replace(/[^\p{L}\p{N}]+/gu,'-')+'-'+photo.id.slice(0,6)+'.jpg';
    const remove=document.createElement('button');remove.className='danger';remove.textContent='Eliminar';
    remove.addEventListener('click',async()=>{
      if(!confirm('¿Eliminar esta foto de forma definitiva? Se borra del servidor y no se puede recuperar.'))return;
      remove.disabled=true;
      try{await request('api/admin/delete-photo',{id:photo.id});await refresh();}catch(error){$('#panel-feedback').textContent=error.message;remove.disabled=false;}
    });
    actions.append(download,remove);
    card.append(img,name,code,caption,status,actions);grid.append(card);
  }
  $('#photo-empty').hidden=photos.length>0;
  const approved=dashboardData.photos.filter(p=>p.status==='approved').length;
  $('#download-zip').textContent='Descargar aprobadas ('+approved+') ↓';
}
$('#photo-filter').addEventListener('change',renderPhotos);
$('#download-zip').addEventListener('click',async()=>{
  const button=$('#download-zip'),label=button.textContent;button.disabled=true;button.textContent='Preparando ZIP…';$('#panel-feedback').textContent='';
  try{
    const response=await fetch('api/admin/photos-zip');
    if(!response.ok){
      let message='No pudimos preparar la descarga.';
      try{message=(await response.json()).error||message;}catch{}
      if(response.status===401){$('#dashboard').hidden=true;$('#login').hidden=false;}
      throw new Error(message);
    }
    const blob=await response.blob();
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);
    const match=/filename="([^"]+)"/.exec(response.headers.get('Content-Disposition')||'');
    link.download=match?match[1]:'Recuerdos-Karina-Alexis.zip';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),10000);
  }catch(error){$('#panel-feedback').textContent=error.message;}
  finally{button.disabled=false;button.textContent=label;}
});

$('#export-guests').addEventListener('click',()=>{
  const safe=(value,isPhone)=>{const text=String(value??'');const guarded=(!isPhone&&/^[=+@\-\t\r]/.test(text))?"'"+text:text;return '"'+guarded.replaceAll('"','""')+'"';};
  const header=['Fecha','Referencia','Nombre','Correo','Teléfono','Respuesta','Acompañantes','Total de personas','Comentarios'];
  const lines=[header.map(v=>safe(v)).join(',')];
  for(const g of dashboardData.guests){
    const yes=g.attendance==='yes';
    lines.push([fmtDate(g.created||g.updated),g.id,g.name,g.email,g.phone,yes?'Sí':'No',yes?g.companions:0,yes?Number(g.companions)+1:0,g.notes].map((v,i)=>safe(v,i===4)).join(','));
  }
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='Lista-de-asistencia-Karina-Alexis.csv';link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});

(async()=>{
  try{const session=await request('api/admin/session');if(session.authenticated){csrf=session.csrf;await refresh();}}
  catch{$('#login-feedback').textContent='No pudimos conectar con el servicio de la invitación. Intenta de nuevo en unos minutos.';}
})();

// Al volver desde el historial, no restaurar un panel abierto sin pedir acceso.
window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload();});
