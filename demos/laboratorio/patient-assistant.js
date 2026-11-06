(() => {
 const store=window.DemoStore;
 const normalize=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const money=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
 const dayFormat=new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
 const timeFormat=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Mexico_City',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const formatDay=day=>dayFormat.format(new Date(day+'T12:00:00Z'));
 const pick=(label,value=label)=>({label,value});
 const intro=()=>({text:'Hola, soy el asistente de Lab Gutiérrez. Puedo darte un precio de prueba o ayudarte a elegir un horario. ¿Qué estudio buscas?',choices:[pick('Agendar una cita'),pick('Cotizar un estudio'),pick('Ver horarios')]});
 const aliases=[/biometria|hemograma/,/quimica/,/orina|uroanalisis|\bego\b/,/chequeo|check.?up/,/prenatal/,/hormonal/];
 const weekdays=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

 function parseDay(q){
  let day;
  const iso=q.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const slash=q.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  const weekday=weekdays.findIndex(value=>new RegExp('\\b'+value+'\\b').test(q));
  if(iso)day=iso[1];
  else if(slash)day=(slash[3]||store.date().slice(0,4))+'-'+slash[2].padStart(2,'0')+'-'+slash[1].padStart(2,'0');
  else if(/pasado manana/.test(q))day=store.date(2);
  else if(/\bmanana\b/.test(q.replace(/(?:por|en) la manana/g,'')))day=store.date(1);
  else if(/\bhoy\b/.test(q))day=store.date();
  else if(weekday>=0){
   const current=new Date(store.date()+'T12:00:00Z').getUTCDay();
   day=store.date((weekday-current+7)%7||7);
  }
  if(day===undefined)return undefined;
  const parsed=new Date(day+'T12:00:00Z');
  return Number.isFinite(+parsed)&&parsed.toISOString().slice(0,10)===day&&day>=store.date()&&day<=store.date(30)?day:null;
 }
 function parseHour(q,expected){
  const match=q.match(/(?:\ba las? |\bhorario de )(\d{1,2})(?::([0-5]\d))?(?:\s*(am|pm))?\b/)
   ||q.match(/^(\d{1,2})(?::([0-5]\d))?(?:\s*(am|pm))?$/)
   ||q.match(/\b(\d{1,2}):([0-5]\d)(?:\s*(am|pm))?\b/);
  if(!match||(!expected&&!q.includes(':')&&!/a las? |horario de /.test(q)))return '';
  let hour=Number(match[1]);
  if(match[3])hour=hour%12+(match[3]==='pm'?12:0);
  return hour<=23?String(hour).padStart(2,'0')+':'+(match[2]||'00'):'';
 }

 function conversation(){
  const draft={};
  let mode='',step='';
  const clear=key=>delete draft[key];
  function reply(next,text,choices=[],link){
   step=next;
   return {text,choices,link,step};
  }
  function begin(prefill={}){
   Object.assign(draft,prefill);
   mode='book';
   return advance();
  }
  function hours(day=draft.day){
   const options=store.available(store.read(),draft.branch,day);
   return day===store.date()?options.filter(hour=>hour>timeFormat.format(new Date())):options;
  }
  function nextDay(){
   for(let i=1;i<=30;i++){
    const day=store.date(i);
    if(day>draft.day&&hours(day).length)return day;
   }
   return '';
  }
  function advance(prefix='',all=false){
   const withPrefix=text=>prefix?prefix+'\n\n'+text:text;
   if(!draft.study&&mode!=='slots')return reply('study',withPrefix('¿Qué estudio o paquete necesitas? Puedes escribir el nombre que aparece en tu orden.'),store.studies.map(name=>pick(name)));
   if(mode==='quote'){
    const price=store.prices[store.studies.indexOf(draft.study)];
    mode='';
    return reply('quoted',`${draft.study} cuesta ${money.format(price)} MXN en esta demostración. ¿Te busco un horario?`,[pick('Sí, ver horarios','Ver horarios'),pick('Quiero agendar'),pick('Otro estudio','Cambiar estudio')]);
   }
   if(!draft.branch)return reply('branch',withPrefix(draft.study?`Para ${draft.study.toLowerCase()}, ¿qué sucursal te queda mejor?`:'¿En qué sucursal te queda mejor?'),store.names.map(name=>pick(name)));
   if(!draft.day)return reply('day',withPrefix(`¿Qué día te queda bien en ${draft.branch}?`),[pick('Hoy'),pick('Mañana'),pick('Pasado mañana')]);
   let free;
   try{free=hours();}catch{return reply('hour',withPrefix('Por ahora no pude consultar la agenda de prueba. Puedes volver a intentarlo.'),[pick('Reintentar')]);}
   if(draft.hour&&!free.includes(draft.hour)){
    prefix=`El horario de las ${draft.hour} ya está ocupado o queda fuera de la jornada en ${draft.branch} para el ${formatDay(draft.day)}.`;
    clear('hour');
   }
   if(!free.length){
    const next=nextDay();
    return reply('day',withPrefix(next?`Ya no quedan horarios para el ${formatDay(draft.day)} en ${draft.branch}. El siguiente día con espacio es el ${formatDay(next)}. ¿Te queda bien?`:`No encontré horarios próximos en ${draft.branch}. ¿Quieres buscar en otra sucursal?`),
     [...(next?[pick(formatDay(next),next)]:[]),pick('Cambiar fecha'),pick('Cambiar sucursal')]);
   }
   if(!draft.hour){
    const visible=all?free:free.slice(0,4);
    return reply('hour',withPrefix(`En ${draft.branch}, el ${formatDay(draft.day)}, tengo ${visible.join(', ')}. ¿Qué hora te acomoda?`),
     [...visible.map(hour=>pick(hour)),...(!all&&free.length>4?[pick('Ver más horarios')]:[]),pick('Cambiar fecha')]);
   }
   if(mode==='slots')mode='book';
   if(!draft.study)return reply('study',withPrefix(`De acuerdo, a las ${draft.hour}. ¿Para qué estudio quieres la cita?`),store.studies.map(name=>pick(name)));
   if(!draft.name)return reply('name',withPrefix(`Perfecto, ${draft.branch} a las ${draft.hour}. ¿A nombre de quién pongo la cita de prueba?`));
   if(!draft.phone)return reply('phone',withPrefix(`Gracias, ${draft.name.split(' ')[0]}. ¿Qué teléfono de prueba de 10 dígitos anoto?`));
   if(!draft.email)return reply('email',withPrefix('¿Qué correo de prueba dejo en la ficha? Puedes usar uno como paciente@example.com.'));
   return reply('confirm',withPrefix(`Así quedaría tu cita de prueba:\n${draft.study} · ${draft.branch}\n${formatDay(draft.day)} a las ${draft.hour}\nA nombre de ${draft.name}\n${draft.phone} · ${draft.email}\n\n¿La confirmo?`),[pick('Confirmar cita'),pick('Cambiar horario'),pick('Cambiar datos')]);
  }
  async function answer(message){
   const q=normalize(message.trim()).replace(/[¿?¡!,]/g,'').replace(/\.+$/,'').trim();
   if(/^(?:empezar de nuevo|nueva cita|otra cita|reiniciar|cancelar solicitud)$/.test(q)){
    Object.keys(draft).forEach(clear);mode='';step='';return intro();
   }
   if(/^(?:no|aun no|todavia no|cambiar datos|quiero cambiar algo)$/.test(q)&&step==='confirm'){
    return reply('edit','Claro. ¿Qué quieres cambiar?',[pick('Cambiar estudio'),pick('Cambiar sucursal'),pick('Cambiar fecha'),pick('Cambiar horario'),pick('Cambiar nombre'),pick('Cambiar teléfono'),pick('Cambiar correo')]);
   }
   const edits={estudio:'study',sucursal:'branch',fecha:'day',horario:'hour',hora:'hour',nombre:'name',telefono:'phone',correo:'email'};
   const edit=q.match(/^cambiar (estudio|sucursal|fecha|horario|hora|nombre|telefono|correo)$/);
   if(edit){
    const key=edits[edit[1]];
    clear(key);
    if(['branch','day'].includes(key))clear('hour');
    if(!mode&&step!=='quoted')mode='book';
    if(step==='quoted'&&key==='study')mode='quote';
    return advance();
   }
   if(/^(si|si por favor|confirmo|confirmar cita|si confirmo|adelante|de acuerdo|correcto)$/.test(q)&&step==='confirm'){
    try{
     const result=await store.bookFromPortal(draft);
     if(result.error){
      if(result.error.includes('ocupó')){clear('hour');return advance('Ese horario se acaba de ocupar. Te muestro los que siguen libres.');}
      return reply('confirm',result.error,[pick('Cambiar datos'),pick('Cambiar horario'),pick('Empezar de nuevo')]);
     }
     const confirmation=`Listo, ${draft.name.split(' ')[0]}. Tu cita de prueba quedó para el ${formatDay(draft.day)} a las ${draft.hour} en ${draft.branch}. Tu folio es ${result.appointmentId}.`;
     Object.keys(draft).forEach(clear);mode='';
     return reply('done',confirmation,[pick('Otra cita')],'demo/index.html#avisos?cita='+encodeURIComponent(result.appointmentId));
    }catch{return reply('confirm','No pude guardar la cita de prueba en este navegador. Puedes intentar de nuevo.',[pick('Confirmar cita')]);}
   }
   const explicitName=message.trim().match(/^(?:me llamo|mi nombre es|a nombre de)\s+([\p{L} .'-]{2,70})$/iu);
   const explicitEmail=message.match(/^(?:(?:mejor|cambia el correo a|mi correo es|el correo es)\s+)?([^\s<>]+@[^\s<>]+\.[^\s<>.,!?]+)[.!]?$/i);
   const explicitPhone=q.match(/^(?:mi telefono es|el telefono es|cambia el telefono a)\s+([+\d ()-]+)$/);
   if(mode==='book'&&['name','phone','email','confirm','edit'].includes(step)){
    if(explicitName){draft.name=explicitName[1].trim();return advance();}
    if(explicitEmail&&explicitEmail[1].length<=120){draft.email=explicitEmail[1];return advance();}
    if(explicitPhone){
     const phone=explicitPhone[1].replace(/\D/g,'').replace(/^52(?=\d{10}$)/,'');
     if(phone.length===10){draft.phone=phone;return advance();}
     return reply('phone','Dime un teléfono de prueba de 10 dígitos.');
    }
   }
   if(/^(?:hola|buenos dias|buenas tardes|buenas noches)$/.test(q)&&!mode)return intro();
   if(/^(?:gracias|muchas gracias)$/.test(q)&&!mode)return reply(step,'Con gusto. Aquí estoy si quieres consultar otro estudio o buscar una cita.',[pick('Agendar una cita'),pick('Cotizar un estudio')]);
   if(/resultado|diagnostic|sintoma|ayuno|medicamento|preparacion/.test(q)){
    return reply(step,'Para resultados o indicaciones de preparación, el equipo del laboratorio puede orientarte. Puedo ayudarte a retomar tu cotización o tu cita aquí.',[pick('Continuar')],'tel:+529661041795');
   }
   if(q==='continuar'||q==='reintentar')return mode?advance():intro();
   if(q==='ver mas horarios'&&draft.branch&&draft.day)return advance('',true);

   const studyIndex=aliases.findIndex(pattern=>pattern.test(q));
   const branch=store.names.find(name=>q.includes(normalize(name)));
   const day=parseDay(q);
   const requestedHour=parseHour(q,step==='hour');
   const first=/primer(?:a|o)? horario|primer(?:a|o)\b/.test(q);
   const morning=/temprano|por la manana/.test(q);
   const afternoon=/\b(?:por la tarde|vespertino|mas tarde)\b/.test(q);
   const wantsQuote=/precio|cuanto|cotiz|costo/.test(q);
   const wantsSlots=/disponib|ver horarios|que horarios|hay horarios|agenda libre/.test(q);
   const wantsBook=/agend|reserv|apart|\bcita\b/.test(q);
   const oldMode=mode;
   const contactStep=['name','phone','email','confirm','edit'].includes(step);
   if(wantsQuote){if(!draft.study||studyIndex>=0||!mode)mode='quote';}
   else if(wantsBook)mode='book';
   else if(wantsSlots&&!mode)mode='slots';
   else if(!mode&&(studyIndex>=0||branch||day||requestedHour))mode='book';
   const changedBranch=branch&&branch!==draft.branch;
   const changedDay=day&&day!==draft.day;
   if(changedBranch||changedDay)clear('hour');
   if(studyIndex>=0)draft.study=store.studies[studyIndex];
   if(branch)draft.branch=branch;
   if(day)draft.day=day;
   if(day===null)return reply('day','Esa fecha queda fuera de la agenda de prueba. Elige un día desde hoy y hasta 30 días después.',[pick('Mañana'),pick('Pasado mañana')]);
   if(requestedHour)draft.hour=requestedHour;
   if(wantsQuote&&draft.study&&oldMode==='book'){
    mode='book';
    const price=store.prices[store.studies.indexOf(draft.study)];
    return advance(`Para ${draft.study.toLowerCase()}, el importe de prueba es ${money.format(price)} MXN.`);
   }
   if((first||morning||afternoon)&&draft.branch&&draft.day&&!requestedHour){
    try{
     const free=hours();
     if(afternoon){
      const later=free.filter(hour=>hour>=(q.includes('mas tarde')?'09:00':'12:00'));
      if(!later.length)return advance(q.includes('mas tarde')?'No encontré bloques más tarde en esa fecha.':'Para ese día solo tengo bloques por la mañana.');
      return reply('hour','Puedo ofrecerte '+later.join(', ')+'. ¿Cuál prefieres?',later.map(hour=>pick(hour)));
     }
     if(first&&free.length){draft.hour=free[0];return advance();}
     if(morning){clear('hour');return advance();}
    }catch{return advance();}
   }
   const changed=studyIndex>=0||branch||day||requestedHour;
   if(mode==='book'&&contactStep&&!changed&&!wantsBook&&!wantsSlots&&!wantsQuote){
    if(step==='name'){
     const name=message.trim().replace(/^(?:me llamo|mi nombre es|a nombre de|soy)\s+/i,'').trim();
     if(name.length<2||name.length>70||!/^[\p{L} .'-]+$/u.test(name)||/^(si|ok|no|confirmo|gracias|adelante)$/i.test(normalize(name)))return reply('name','Dime el nombre que quieres usar para esta cita de prueba.');
     draft.name=name;
    }else if(step==='phone'){
     const phone=message.replace(/\D/g,'').replace(/^52(?=\d{10}$)/,'');
     if(phone.length!==10)return reply('phone','Me faltan los 10 dígitos del teléfono de prueba. Por ejemplo, 5550100200.');
     draft.phone=phone;
    }else if(step==='email'){
     const email=message.match(/[^\s<>]+@[^\s<>]+\.[^\s<>.,!?]+/);
     if(!email||email[0].length>120)return reply('email','Escríbelo con el formato de un correo, por ejemplo paciente@example.com.');
     draft.email=email[0];
    }else if(step==='confirm')return advance('Puedo confirmarla así o cambiar el horario o los datos.');
    else return reply('edit','¿Qué dato cambiamos?',[pick('Cambiar fecha'),pick('Cambiar horario'),pick('Cambiar sucursal'),pick('Cambiar nombre'),pick('Cambiar teléfono'),pick('Cambiar correo')]);
    return advance();
   }
   if(!mode)return reply('','Puedo ayudarte con precios de prueba, horarios y citas. Por ejemplo, dime «Biometría hemática en Tonalá mañana».',intro().choices);
   if(!changed&&!wantsBook&&!wantsSlots&&!wantsQuote){
    const hints={study:'No encontré ese estudio en el catálogo de prueba. Puedes elegir uno de estos.',branch:'No ubiqué esa sede. ¿Cuál de estas sucursales te queda mejor?',day:'Puedes decirme «mañana», un día de la semana o una fecha como 15/11.',hour:'Dime qué hora prefieres, por ejemplo «a las 8:30», o elige uno de los bloques.'};
    return advance(hints[step]||'');
   }
   return advance();
  }
  return {answer,begin};
 }

 const dialog=document.querySelector('#patient-assistant');
 const thread=document.querySelector('#patient-thread');
 const replies=document.querySelector('#patient-replies');
 const form=document.querySelector('#patient-query');
 const input=form.elements.query;
 const session=conversation();
 let started=false,pending=false;

 function append(text,kind,link){
  const bubble=document.createElement('div');
  bubble.className='patient-bubble '+kind;
  bubble.textContent=text;
  if(link){
   const action=document.createElement('a');action.href=link;
   action.textContent=link.startsWith('tel:')?'Llamar al laboratorio ↗':'Ver aviso en el demo ↗';
   bubble.append(action);
  }
  thread.append(bubble);thread.scrollTop=thread.scrollHeight;
 }
 function show(result){
  append(result.text,'assistant',result.link);
  replies.replaceChildren();
  for(const choice of result.choices){
   const button=document.createElement('button');
   button.type='button';button.textContent=choice.label;
   button.onclick=()=>send(choice.value,choice.label);replies.append(button);
  }
  const placeholders={name:'Escribe un nombre ficticio',phone:'Escribe un teléfono ficticio',email:'Escribe un correo ficticio'};
  input.placeholder=placeholders[result.step]||'Escribe tu mensaje…';
  input.inputMode=result.step==='phone'?'tel':result.step==='email'?'email':'text';
  thread.scrollTop=thread.scrollHeight;
 }
 async function send(value,label=value){
  if(pending||!value.trim())return;
  if(/guiame|guia del demo|recorrido|que puedo explorar|que puedo hacer aqui|mostrar el crm/.test(normalize(value))&&window.LabGuide){window.LabGuide.open();return;}
  pending=true;append(label,'user');replies.replaceChildren();
  form.querySelector('button').disabled=true;
  try{show(await session.answer(value));}
  catch{show({text:'No pude continuar en este momento. Intenta de nuevo.',choices:[pick('Continuar')]});}
  finally{pending=false;form.querySelector('button').disabled=false;}
 }
 function open(intent){
  window.LabGuide?.hide();
  if(!dialog.open)dialog.showModal();
  if(!started){
   started=true;
   if(intent==='book'){
    const fields=document.querySelector('#booking').elements;
    const prefill={};
    if(store.studies.includes(fields.study.value))prefill.study=fields.study.value;
    if(store.names.includes(fields.branch.value))prefill.branch=fields.branch.value;
    if(fields.date.value>=store.date()&&fields.date.value<=store.date(30))prefill.day=fields.date.value;
    show(session.begin(prefill));
   }else show(intro());
  }else if(intent==='book')send('Quiero agendar');
 }
 window.openPatientAssistant=()=>open();
 if(new URLSearchParams(location.search).get('asistente')==='cita'){
  open();
  history.replaceState(history.state,'',location.pathname+location.hash);
 }
 document.querySelectorAll('[data-patient-open]').forEach(button=>button.onclick=()=>open(button.dataset.intent));
 document.querySelector('#patient-close').onclick=()=>dialog.close();
 form.onsubmit=event=>{
  event.preventDefault();
  if(pending||!input.value.trim())return;
  const value=input.value.trim();input.value='';
  send(value);
 };
})();
