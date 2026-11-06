(() => {
 const store=window.DemoStore;
 const inDemo=/\/demo\/(index\.html)?$/.test(location.pathname);
 const storageKey='lg-prospect-guide-v1';
 const demo=(page,params={})=>{
  const query=new URLSearchParams(params);
  return (inDemo?'index.html#':'demo/index.html#')+page+(query.size?'?'+query:'');
 };
 const fresh=()=>({position:0,mode:'idle',contact:'',appointment:''});
 let state;
 try{state=JSON.parse(sessionStorage.getItem(storageKey))||fresh();}catch{state=fresh();}
 let menu=false;
 const modules=[
  ['CRM','crm','Solicitudes, cotizaciones y próximos seguimientos.'],
  ['Agenda','agenda','Horarios libres y ocupados por sucursal.'],
  ['Sucursales','sucursales','Ubicaciones, responsables y capacidad.'],
  ['Inventario','inventario','Existencias, mínimos y movimientos.'],
  ['Facturación','facturacion','Borradores y emisión de prueba.'],
  ['Promociones','promociones','Campañas comerciales por mes y sede.'],
  ['Indicadores','analitica','Gráficas de solicitudes, citas y ocupación.'],
  ['Personal','personal','Responsables, funciones y turnos.'],
  ['Administración','admin','Vistas por rol y configuración del entorno.']
 ];
 const route=()=>{
  const [page,query]=location.hash.slice(1).split('?');
  return {page,query:new URLSearchParams(query)};
 };
 function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{}}
 function getData(){try{return store.read();}catch{return null;}}
 function visibleContact(contact){
  const scope=document.querySelector('#scope')?.value;
  return !scope||scope==='Toda la red'||scope===contact.branch;
 }
 function availableContact(data,contact){
  return contact&&visibleContact(contact)&&contact.stage!=='Atendida'&&!data.appointments.some(a=>a.contact===contact.id&&a.status==='Confirmada');
 }
 function findDay(data,branch){
  for(let i=1;i<=30;i++){
   const day=store.date(i);
   if(store.available(data,branch,day).length)return day;
  }
  return store.date(1);
 }

 const panel=document.createElement('section');
 panel.id='lab-guide';panel.className='guide-panel';panel.hidden=true;
 panel.setAttribute('aria-label','Guía del demo de Lab Gutiérrez');
 document.body.append(panel);
 const resume=document.createElement('button');
 resume.type='button';resume.className='guide-resume';resume.textContent='Retomar guía ↗';resume.hidden=true;
 resume.onclick=()=>{if(state.position>=5)openMenu();else start();};
 document.body.append(resume);

 function element(tag,text,className){
  const node=document.createElement(tag);
  if(text)node.textContent=text;
  if(className)node.className=className;
  return node;
 }
 function link(label,href,primary=false){
  const node=element('a',label,'guide-button'+(primary?' guide-primary':''));
  node.href=href;return node;
 }
 function control(label,action,primary=false){
  const node=element('button',label,'guide-button'+(primary?' guide-primary':''));
  node.type='button';node.onclick=action;return node;
 }
 function goPatient(){
  pause();
  if(inDemo)location.href='../?asistente=cita';
  else window.openPatientAssistant?.();
 }
 function pause(){
  if(state.mode==='active')state.mode='paused';
  menu=false;persist();render();
 }
 function openMenu(){
  for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
  menu=true;render();
  panel.querySelector('.guide-primary')?.focus();
 }
 function start(){
  if(state.position>=5)state=fresh();
  menu=false;state.mode='active';persist();observe();
  panel.querySelector('.guide-primary, .guide-button')?.focus();
 }
 function skip(){
  state.position=Math.min(5,state.position+1);persist();observe();
 }
 function observe(){
  if(state.mode!=='active'||!inDemo){render();return;}
  const {page,query}=route(),data=getData();
  if(state.position===0&&page==='crm')state.position=1;
  if(state.position===1&&page==='crm'&&data){
   const contact=data.contacts.find(c=>c.id===query.get('ficha'));
   if(availableContact(data,contact)){state.contact=contact.id;state.position=2;}
  }
  if(state.position===2&&data&&state.contact){
   const appt=data.appointments.find(a=>a.contact===state.contact&&a.status==='Confirmada');
   if(appt){state.appointment=appt.id;state.position=3;}
  }
  if(state.position===3&&page==='avisos')state.position=4;
  if(state.position===4&&page==='alcance')state.position=5;
  persist();render();
 }
 function menuContents(body){
  body.append(element('h2','¿Cómo quieres recorrer el demo?'),element('p','El CRM reúne las solicitudes y su seguimiento. También puedes explorar agenda, sucursales, inventario, facturación, promociones y otros módulos.'));
  const actions=element('div','','guide-menu-actions');
  actions.append(
   control(state.position>0&&state.position<5?'Retomar el recorrido por el CRM':'Guíame por el CRM',start,true),
   control('Quiero simular una cita',goPatient),
   control('Prefiero explorar por mi cuenta',()=>{
    pause();
    if(!inDemo)location.href=demo('crm');
   })
  );
  body.append(actions,moduleLinks());
 }
 function moduleLinks(){
  const section=element('details','','guide-modules');
  section.append(element('summary','¿Qué puedo explorar en el sistema?'));
  const list=element('ul');
  for(const [label,page,desc] of modules){
   if(inDemo&&!document.querySelector('#nav a[href="#'+page+'"]'))continue;
   const item=element('li');
   const moduleLink=link(label,demo(page));
   moduleLink.addEventListener('click',pause);
   item.append(moduleLink,element('span',desc));
   list.append(item);
  }
  section.append(list);return section;
 }
 function render(){
  panel.hidden=!menu&&state.mode!=='active';
  resume.hidden=state.mode!=='paused'||state.position>=5;
  if(panel.hidden)return;
  const focused=document.activeElement;
  const focusLabel=panel.contains(focused)?focused.textContent:'';
  const head=element('div','','guide-head');
  const identity=element('div');
  identity.append(element('span','ASISTENTE GUTIÉRREZ'),element('strong','Guía del demo'));
  const close=control('×',pause);close.setAttribute('aria-label','Pausar o cerrar la guía');
  head.append(identity,close);
  const body=element('div','','guide-body');
  if(menu){menuContents(body);}
  else{
   const {page,query}=route(),data=getData();
   const contact=data?.contacts.find(c=>c.id===state.contact);
   const candidate=data?.contacts.find(c=>availableContact(data,c));
   const actions=element('div','','guide-actions');
   let title,text;
   switch(state.position){
    case 0:
     title='Entra al CRM';
     text='Aquí verás las solicitudes, de qué canal llegaron y a quién le toca darles seguimiento.';
     actions.append(link('Abrir CRM',demo('crm'),true));
     break;
    case 1:
     title='Abre una solicitud';
     text=candidate?`Usaremos ${candidate.name} de ${candidate.branch}. En la ficha encontrarás el estudio, la etapa y el historial de atención.`:'Crea una solicitud ficticia en tu ámbito actual. Usaremos su ficha para mostrar cómo se da el seguimiento.';
     actions.append(candidate?link('Abrir solicitud',demo('crm',{vista:'lista',ficha:candidate.id}),true):link('Crear solicitud de prueba',demo('crm',{nueva:'1'}),true));
     break;
    case 2:
     title='Agenda desde la ficha';
     if(!contact||!data){
      text='Elige una solicitud abierta para vincularla con un horario. También puedes continuar a Avisos con el botón Saltar paso.';
      if(candidate)actions.append(control('Elegir solicitud',()=>{state.position=1;persist();location.href=demo('crm',{vista:'lista',ficha:candidate.id});},true));
      break;
     }
     if(inDemo&&page==='agenda'&&query.get('sede')===contact.branch){
      text=`En «Registrar cita», selecciona ${contact.name}, elige un horario libre y pulsa «Confirmar cita de prueba». La guía avanzará al registrarla.`;
     }else{
      text=`Abre la agenda de ${contact.branch} desde la ficha. Podrás elegir un horario libre para ${contact.name}.`;
      actions.append(link('Ir a la agenda',demo('agenda',{sede:contact.branch,fecha:findDay(data,contact.branch),contacto:contact.id}),true));
     }
     break;
    case 3:
     title='Sigue la cita en Avisos';
     text=state.appointment?`La cita ${state.appointment} ya ocupó su horario y actualizó el CRM. En Avisos verás el mismo folio y los enlaces a ambos registros.`:'En Avisos se reúnen las citas registradas y sus enlaces a Agenda y CRM.';
     actions.append(link('Abrir Avisos',demo('avisos',state.appointment?{cita:state.appointment}:{}),true));
     break;
    case 4:
     title='Elige qué quieres evaluar';
     text='En Armar propuesta puedes elegir el CRM, la web u otros módulos y preparar un correo para contarle a Vector Inside qué te interesa.';
     actions.append(link('Armar mi propuesta',demo('alcance'),true));
     break;
    default:
     title='Ya recorriste el CRM';
     text='Ya puedes revisar tu solicitud y abrir el correo para enviarla a Vector Inside. Si quieres seguir explorando, elige otro módulo o simula una cita desde la web.';
     actions.append(control('Explorar otros módulos',openMenu,true),control('Simular una cita',goPatient));
   }
   const progress=element('div',state.position<5?`Paso ${state.position+1} de 5`:'Recorrido completado','guide-progress');
   body.append(progress,element('h2',title),element('p',text),actions);
   const utilities=element('div','','guide-utilities');
   if(state.position<5)utilities.append(control('Saltar paso',skip));
   utilities.append(control(state.position<5?'Pausar':'Cerrar guía',pause));
   body.append(utilities);
  }
  panel.replaceChildren(head,body);
  if(focusLabel){
   [...panel.querySelectorAll('a,button,summary')].find(node=>node.textContent===focusLabel)?.focus({preventScroll:true});
  }
 }
 document.addEventListener('click',event=>{if(event.target.closest('[data-guide-menu]'))openMenu();});
 document.addEventListener('change',event=>{if(['scope','role'].includes(event.target.id))observe();});
 window.addEventListener('hashchange',observe);
 window.addEventListener('lg-demo-updated',observe);
 window.addEventListener('storage',event=>{if(event.key===store.key)observe();});
 window.LabGuide={hide:pause,open:openMenu};
 observe();
})();
