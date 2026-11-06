let csrf='',dashboardData={guests:[],photos:[]};
const $=s=>document.querySelector(s);
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
async function refresh(){try{dashboardData=await request('/api/admin/dashboard');for(const key of ['confirmed','companions','people','pending'])$('#total-'+key).textContent=dashboardData.totals[key];$('#declined-summary').textContent=dashboardData.totals.declined+' personas indicaron que no podrán asistir.';$('#dashboard').hidden=false;$('#login').hidden=true;renderGuests();renderPhotos();$('#last-update').textContent='Actualizado '+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});$('#panel-feedback').textContent='';}catch(error){$('#panel-feedback').textContent=error.message;}}
$('#login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;try{const session=await request('/api/admin/login',{password:$('#password').value});csrf=session.csrf;$('#password').value='';$('#login-feedback').textContent='';await refresh();}catch(error){$('#login-feedback').textContent=error.message;}finally{button.disabled=false;}});
$('#refresh').addEventListener('click',refresh);
$('#logout').addEventListener('click',async()=>{try{await request('/api/admin/logout',{});csrf='';dashboardData={guests:[],photos:[]};$('#guest-rows').replaceChildren();$('#photo-grid').replaceChildren();$('#dashboard').hidden=true;$('#login').hidden=false;}catch(error){$('#panel-feedback').textContent=error.message;}});
for(const [button,panel] of [['guests','guests-panel'],['photos','photos-panel']])$('#show-'+button).addEventListener('click',()=>{for(const name of ['guests','photos']){$('#show-'+name).setAttribute('aria-pressed',String(name===button));$('#'+name+'-panel').hidden=name!==button;}});
function renderGuests(){const query=$('#guest-search').value.toLocaleLowerCase('es');const guests=dashboardData.guests.filter(g=>(g.name+' '+g.id).toLocaleLowerCase('es').includes(query));const body=$('#guest-rows');body.replaceChildren();for(const guest of guests){const tr=document.createElement('tr');for(const value of [guest.name,guest.attendance==='yes'?'Sí asistiré':'No podré asistir',guest.companions,guest.id]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}$('#guest-empty').hidden=guests.length>0;}
$('#guest-search').addEventListener('input',renderGuests);
function renderPhotos(){const grid=$('#photo-grid');grid.replaceChildren();const filter=$('#photo-filter').value;const photos=dashboardData.photos.filter(p=>filter==='all'||p.status===filter);for(const photo of photos){const card=document.createElement('article');const img=document.createElement('img');img.src='/media/'+photo.id+'.jpg';img.alt='Recuerdo de '+photo.name;img.loading='lazy';const name=document.createElement('h3');name.textContent=photo.name;const caption=document.createElement('p');caption.textContent=photo.caption;const status=document.createElement('small');status.textContent={pending:'Pendiente de revisión',approved:'Publicado en la invitación',hidden:'Oculto'}[photo.status];const actions=document.createElement('div');for(const [label,state] of [['Aprobar y publicar','approved'],['Ocultar','hidden']]){if(state===photo.status)continue;const button=document.createElement('button');button.textContent=label;button.className=state==='hidden'?'secondary':'';button.addEventListener('click',async()=>{button.disabled=true;try{await request('/api/admin/moderate',{id:photo.id,status:state});await refresh();}catch(error){$('#panel-feedback').textContent=error.message;button.disabled=false;}});actions.append(button);}card.append(img,name,caption,status,actions);grid.append(card);}$('#photo-empty').hidden=photos.length>0;}
$('#photo-filter').addEventListener('change',renderPhotos);
$('#export-guests').addEventListener('click',()=>{const safe=value=>'"'+String(value).replace(/^[=+@\-\t\r]/,"'").replaceAll('"','""')+'"';const rows=[['Nombre','Asistencia','Acompañantes','Referencia'],...dashboardData.guests.map(g=>[g.name,g.attendance==='yes'?'Sí':'No',g.companions,g.id])];const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='Invitados-Karina-Alexis.csv';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);});
(async()=>{try{const session=await request('/api/admin/session');if(session.authenticated){csrf=session.csrf;await refresh();}}catch{$('#login-feedback').textContent='El panel necesita el servicio de la invitación. Abre la vista previa con el servidor incluido.';}})();

// Al volver desde el historial, no restaurar un panel abierto sin pedir acceso.
window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload();});
