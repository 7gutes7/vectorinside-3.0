const $ = s => document.querySelector(s);
const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const {date,studies,stages,channels,locations,names,products,now,makeSeed,nextId}=DemoStore;
const cash = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
const dayLabel = value => new Date(value+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short'});
const roles={
 Administrador:{scope:'Toda la red',note:'Configura sedes, personal, alcance y operación de toda la red.'},
 Gerente:{scope:'Toda la red',note:'Supervisa resultados, sucursales y operación comercial de toda la red.'},
 'Encargado de sucursal':{scope:'Tonalá',note:'Opera el CRM, la agenda, el inventario y la caja de su sede asignada.'}
};
const moduleList={
 crm:['CRM','◎'],inicio:['Resumen','▦'],agenda:['Agenda y capacidad','▤'],avisos:['Avisos','♢'],sucursales:['Sucursales','⌖'],inventario:['Inventario','▣'],facturacion:['Facturación','◇'],analitica:['Indicadores','▥'],promociones:['Promociones','✦'],personal:['Personal','◉'],admin:['Administración','⚙'],alcance:['Armar propuesta','◈']
};
const managerOnly=new Set(['analitica','promociones','alcance']);
const scopeOptions=()=>role==='Encargado de sucursal'?['Tonalá']:['Toda la red',...names];
const access = page => Object.hasOwn(moduleList,page)
 && (page!=='admin'||role==='Administrador')
 && (!managerOnly.has(page)||role!=='Encargado de sucursal');
let data;
try {data=DemoStore.read();} catch {data={...makeSeed(),notices:[]};}
let role='Administrador',scope='Toda la red',flash='';
const save=()=>DemoStore.write(data);
function changeData(work){
 return DemoStore.exclusive(()=>{
  try{data=DemoStore.read();}catch{}
  work();
 }).catch(()=>reject('No se pudo guardar en este navegador.'));
}
const scoped = item => scope==='Toda la red'||item.branch===scope;
const options=(values,selected)=>values.map(value=>'<option'+(value===selected?' selected':'')+'>'+h(value)+'</option>').join('');
const select=(label,name,values,value,extra='')=>`<label>${label}<select name="${name}" ${extra}>${options(values,value)}</select></label>`;
const input=(label,name,type='text',value='',extra='')=>`<label>${label}<input name="${name}" type="${type}" value="${h(value)}" ${extra}></label>`;
const pill=(value,tone='')=>`<span class="pill ${tone}">${h(value)}</span>`;
const button=(label,href,primary=false)=>`<a class="button ${primary?'primary':''}" href="${h(href)}">${h(label)}</a>`;
const submit=(label='Guardar en demo')=>`<button class="primary" type="submit">${label}</button>`;
const route=(page,values={})=>{const p=new URLSearchParams(values);return '#'+page+(p.size?'?'+p:'');};
const table=(head,rows)=>`<div class="scroll"><table class="table"><thead><tr>${head.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>'<tr>'+row.map(x=>`<td>${x}</td>`).join('')+'</tr>').join(''):`<tr><td class="empty" colspan="${head.length}">Sin registros en esta vista.</td></tr>`}</tbody></table></div>`;
const card=(label,value,note)=>`<div class="card"><span class="kicker">${label}</span><strong>${h(value)}</strong><small>${note}</small></div>`;
const heading=(group,title,desc,actions='')=>`<div class="mast"><div><div class="kicker">${group}</div><h1>${title}</h1><p>${desc}</p></div><div class="actions">${actions}</div></div><div class="notice" role="status">${h(flash)}</div>`;
const panel=(title,body)=>`<section class="panel"><h2>${title}</h2>${body}</section>`;
const note=(contact,text)=>contact.history.unshift({text,at:now()});
const branchSet=()=>scope==='Toda la red'?names:[scope];
const slotHours=branch=>DemoStore.hours(data,branch);
const daily=(branch,day)=>DemoStore.daily(data,branch,day);
const available=(branch,day)=>DemoStore.available(data,branch,day);
const lowStock=()=>data.stock.filter(scoped).filter(x=>x.quantity<=products.find(p=>p[0]===x.sku)[3]);
const followUps=()=>data.contacts.filter(scoped).filter(c=>c.stage!=='Atendida'&&c.follow&&c.follow<=date());
const mapLink=branch=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Laboratorio Gutiérrez '+locations.find(row=>row[0]===branch).join(', '));
const form=(action,body)=>`<form data-action="${action}">${body}</form>`;
const help=(label,text)=>`<details class="guide-help"><summary aria-label="Ayuda sobre ${h(label)}">?</summary><p>${h(text)}</p></details>`;
const hidden=(name,value)=>`<input type="hidden" name="${name}" value="${h(value)}">`;

const chartColors=['#23795d','#528ed0','#9272ca','#be742c','#167b87'];
const stageColors=['#528ed0','#9272ca','#be742c','#167b87','#23795d'];
const by = (list,keys,field)=>keys.map(key=>[key,list.filter(item=>item[field]===key).length]);
function bars(items,links=()=>null,colors=chartColors){
 const max=Math.max(1,...items.map(([,count])=>count));
 return `<div class="visual-bars">${items.map(([label,count],i)=>{
  const href=links(label);
  const content=`<span>${h(label)}</span><span class="visual-track" aria-hidden="true"><span style="--fill:${100*count/max}%;--series:${colors[i%colors.length]}"></span></span><strong>${count}</strong>`;
  return href?`<a class="visual-row" href="${h(href)}">${content}</a>`:`<div class="visual-row">${content}</div>`;
 }).join('')}</div>`;
}
function ring(items,links=()=>null,unit='solicitudes'){
 const total=items.reduce((sum,[,n])=>sum+n,0);
 let angle=0;
 const segments=items.flatMap(([,n],i)=>{
  if(!n)return [];
  const start=angle;angle+=n*360/total;
  return [`${chartColors[i%chartColors.length]} ${start}deg ${angle}deg`];
 });
 const gradient=segments.length?`conic-gradient(${segments.join(',')})`:'var(--tint)';
 return `<div class="ring-chart"><div class="ring" aria-hidden="true" style="--ring:${gradient}"><div><strong>${total}</strong><small>${unit}</small></div></div><div class="ring-legend">${items.map(([name,count],i)=>{
  const href=links(name);
  const content=`<i aria-hidden="true" style="--series:${chartColors[i%chartColors.length]}"></i><span>${h(name)}</span><b>${count}</b>`;
  return href?`<a href="${h(href)}">${content}</a>`:`<div>${content}</div>`;
 }).join('')}</div></div>`;
}
const due = (c,today) => c.stage!=='Atendida'&&c.follow&&c.follow<=today;
function followLabel(c,today){
 if(c.stage==='Atendida'||!c.follow)return '<span class="muted">—</span>';
 if(c.follow<today)return pill('Vencido · '+dayLabel(c.follow),'danger');
 if(c.follow===today)return pill('Hoy','warn');
 return pill(dayLabel(c.follow));
}
const crmViews={resumen:'Resumen',lista:'Lista',tablero:'Tablero',pendientes:'Seguimientos'};
function crm(p){
 const view=Object.hasOwn(crmViews,p.get('vista'))?p.get('vista'):p.has('ficha')?'lista':'resumen';
 const query=(p.get('q')||'').trim();
 const stage=stages.includes(p.get('etapa'))?p.get('etapa'):'Todas';
 const channel=channels.includes(p.get('canal'))?p.get('canal'):'Todos';
 const today=date();
 const scopeContacts=data.contacts.filter(scoped);
 const search=normalize(query);
 const contacts=scopeContacts.filter(c=>(stage==='Todas'||c.stage===stage)&&(channel==='Todos'||c.channel===channel)
  &&(!search||[c.name,c.id,c.study,c.channel,c.branch].some(v=>normalize(v).includes(search))));
 const pending=contacts.filter(c=>due(c,today)).sort((a,b)=>a.follow.localeCompare(b.follow));
 const chosen=scopeContacts.find(c=>c.id===p.get('ficha'));
 const filters={...(query?{q:query}:{}),...(stage!=='Todas'?{etapa:stage}:{}),...(channel!=='Todos'?{canal:channel}:{})};
 const url=(mode=view,changes={})=>route('crm',{vista:mode,...filters,...changes});
 const openContact=(c,mode=view)=>url(mode,{ficha:c.id});
 const listRow=c=>[
  `<a class="contact-name" href="${h(openContact(c))}">${h(c.name)}</a><small>${h(c.id+' · '+c.study)}</small>`,
  h(c.branch),pill(c.stage),h(c.channel),h(c.owner),followLabel(c,today),
  button('Ver ficha',openContact(c))
 ];
 const tasks=pending.slice(0,5).map(c=>`<a class="task-row" href="${h(openContact(c,'pendientes'))}"><span><b>${h(c.name)}</b><small>${h(c.branch+' · '+c.owner)}</small></span>${followLabel(c,today)}<span aria-hidden="true">→</span></a>`).join('');
 const tabs=`<nav class="crm-tabs" aria-label="Vistas del CRM">${Object.entries(crmViews).map(([id,label])=>`<a href="${h(url(id))}" ${id===view?'aria-current="page"':''}>${label}${id==='pendientes'?` <span>${pending.length}</span>`:''}</a>`).join('')}</nav>`;
 const toolbar=`<form class="crm-filters" data-action="crm-filter">${hidden('vista',view)}${input('Buscar solicitud','q','search',query,'placeholder="Nombre, estudio o sede" maxlength="80"')}${select('Etapa','etapa',['Todas',...stages],stage)}${select('Canal','canal',['Todos',...channels],channel)}<button>Aplicar</button>${Object.keys(filters).length?button('Limpiar',route('crm',{vista:view})):''}</form>`;
 const newContact=p.has('nueva')?panel('Registrar solicitud',form('contact-new',`<div class="forms">${input('Nombre ficticio','name','text','','required maxlength="45"')}${select('Sucursal','branch',branchSet())}${select('Estudio','study',studies)}${select('Canal','channel',channels)}</div>`+submit('Crear solicitud'))):'';
 const detail=chosen?`<section class="panel crm-detail" aria-labelledby="detail-title"><div class="detail-head"><div><div class="kicker">Ficha de seguimiento · ${h(chosen.id)}</div><h2 id="detail-title">${h(chosen.name)}</h2><p>${h(chosen.study)} · ${h(chosen.branch)} · ${h(chosen.source||chosen.channel)}</p></div>${button('Cerrar ficha',url())}</div><div class="grid split"><div>
 ${chosen.phone||chosen.email?`<dl class="contact-points"><div><dt>Teléfono de prueba</dt><dd>${h(chosen.phone||'—')}</dd></div><div><dt>Correo de prueba</dt><dd>${h(chosen.email||'—')}</dd></div></dl>`:''}
 ${form('contact-edit',hidden('id',chosen.id)+`<div class="forms detail-form"><div class="guide-field">${select('Etapa','stage',stages,chosen.stage)}${help('Etapa del contacto','Indica en qué punto va la solicitud. La agenda actualiza esta etapa cuando registras o atiendes una cita.')}</div>${select('Responsable','owner',['Recepción 01','Recepción 02','Coordinación'],chosen.owner)}${input('Próximo contacto','follow','date',chosen.follow)}${input('Cotización (MXN)','quote','number',chosen.quote??'','min="1" max="99999" step="0.01"')}<label class="full">Nota<input name="note" maxlength="100" placeholder="Ej. Retomar cotización"></label></div><div class="actions">`+submit('Guardar seguimiento')+(chosen.follow&&chosen.stage!=='Atendida'?`<button type="button" data-follow-done="${h(chosen.id)}">Marcar seguimiento hecho</button>`:'')+'</div>')}
 <div class="actions row">${button('Agendar estudio',route('agenda',{sede:chosen.branch,contacto:chosen.id}))}${button('Ver sucursal',route('sucursales',{sede:chosen.branch}))}</div></div>
 <div><h3>Historial</h3><ul class="timeline">${chosen.history.map(item=>`<li>${h(item.text)} <small>· ${dayLabel(item.at.slice(0,10))}</small></li>`).join('')}</ul></div></div></section>`:'';
 let body;
 if(view==='resumen'){
  body=`<div class="grid crm-charts">${panel('Solicitudes por etapa','<p class="chart-caption">Selecciona una barra para abrir las solicitudes de esa etapa.</p>'+bars(by(contacts,stages,'stage'),step=>url('lista',{etapa:step}),stageColors))}${panel('Canales de entrada','<p class="chart-caption">Selecciona un canal para ver sus solicitudes.</p>'+ring(by(contacts,channels,'channel'),key=>url('lista',{canal:key})))}</div>
  <div class="row">${panel('Próximos seguimientos',tasks?tasks+`<div class="row">${button('Ver todos los seguimientos',url('pendientes'))}</div>`:'<p class="muted">No hay seguimientos para hoy o vencidos con estos filtros.</p>')}</div>`;
 }else if(view==='tablero'){
  body=panel('Tablero por etapa',`<div class="scroll"><div class="lane-grid crm-board">${stages.map((step,i)=>{
   const leads=contacts.filter(c=>c.stage===step);
   return `<section class="lane" style="--stage:${stageColors[i]}"><h3>${step} <span>${leads.length}</span></h3>${leads.map(c=>`<a class="lead ${c===chosen?'selected':''}" href="${h(openContact(c))}"><b>${h(c.name)}</b><small>${h(c.study)}</small><small>${h(c.branch+' · '+c.channel)}</small>${followLabel(c,today)}</a>`).join('')||'<small>Sin solicitudes</small>'}</section>`;
  }).join('')}</div></div>`);
 }else{
  const rows=view==='pendientes'?pending:contacts;
  body=panel(view==='pendientes'?'Para hoy o vencidos':'Solicitudes · '+rows.length,table(['Solicitud','Sucursal','Etapa','Canal','Responsable','Seguimiento','Acción'],rows.map(listRow)));
 }
 return heading('01 / Atención comercial','CRM de atención','Encuentra solicitudes, prioriza seguimientos y consulta el avance de cada sucursal.',button('+ Nueva solicitud',url(view,{nueva:1}),true)+'<button id="crm-assistant">✦ Consultar asistente IA</button><button type="button" data-guide-menu>Recorrido guiado</button>')+
 `<div class="grid kpis crm-kpis">${card('Solicitudes',contacts.length,'Con los filtros actuales')}${card('Por contactar',pending.length,'Vencidas o para hoy')}${card('Con cita',contacts.filter(c=>c.stage==='Cita registrada').length,'En espera de visita')}${card('Atendidas',contacts.filter(c=>c.stage==='Atendida').length,'Visitas completadas')}</div>`+
 tabs+toolbar+newContact+detail+body;
}

function agenda(p){
 const branch=branchSet().includes(p.get('sede'))?p.get('sede'):branchSet()[0];
 const day=/^\d{4}-\d{2}-\d{2}$/.test(p.get('fecha')||'')?p.get('fecha'):date();
 const contacts=data.contacts.filter(c=>c.branch===branch&&c.stage!=='Atendida');
 const chosen=contacts.find(c=>c.id===p.get('contacto'));
 const entries=daily(branch,day);
 const free=available(branch,day);
 const slots=slotHours(branch).map(hour=>{
  const item=entries.find(x=>x.hour===hour);
  return item?`<div class="slot busy"><b>${hour}</b><small>${h(item.status)} · ${h(item.study)}</small></div>`:
   `<a class="slot free" href="${h(route('agenda',{sede:branch,fecha:day,hora:hour,...(chosen?{contacto:chosen.id}:{})}))}"><b>${hour}</b><small>Disponible</small></a>`;
 }).join('');
 const requested=p.get('hora');
 const newBooking=free.length&&contacts.length&&day>=date()?form('book',hidden('branch',branch)+hidden('day',day)+`<div class="forms"><label>Contacto<select name="contact" required>${contacts.map(c=>`<option value="${h(c.id)}" ${c===chosen?'selected':''}>${h(c.name)} · ${h(c.study)}</option>`).join('')}</select></label>${select('Horario disponible','hour',free,requested)}</div>`+submit('Confirmar cita de prueba')):'<p class="muted">Para agendar se necesita un contacto de la sede, una fecha vigente y un horario libre.</p>';
 return heading('02 / Atención presencial','Agenda y capacidad','Consulta horarios disponibles y ocupados. Una cita confirmada actualiza el CRM.',button('Abrir CRM','#crm'))+
 `<form class="filters" data-action="agenda-filter">${select('Sucursal','sede',branchSet(),branch)}${input('Fecha','fecha','date',day,'required')}<button>Consultar</button></form><div class="grid kpis">${card('Disponibles',free.length,'Bloques libres')}${card('Ocupadas',entries.length,'Citas y visitas atendidas')}${card('Atendidas',entries.filter(a=>a.status==='Atendida').length,'En la fecha seleccionada')}${card('Capacidad',slotHours(branch).length,'Bloques configurados')}</div>
 <div class="grid two">${panel('Horarios · '+h(branch)+' '+help('Capacidad de agenda','Cada bloque representa un horario de 30 minutos. Una cita confirmada ocupa un bloque; al cancelarla, vuelve a estar disponible.'),`<div class="day-occupancy">${capacityBars([['Jornada',free.length,entries.length]])}</div><div class="slots">${slots||'<p class="muted">Agenda pausada en esta sede.</p>'}</div>`)}${panel('Registrar cita',newBooking)}</div>
 <div class="row">${panel('Citas de la jornada',table(['Hora','Contacto','Estudio','Estado','Acciones'],data.appointments.filter(a=>a.branch===branch&&a.day===day).sort((a,b)=>a.hour.localeCompare(b.hour)).map(a=>{
  const contact=data.contacts.find(c=>c.id===a.contact);
  return [h(a.hour),`<a href="${h(route('crm',{ficha:a.contact}))}">${h(contact?.name||a.contact)}</a>`,h(a.study),pill(a.status,a.status==='Cancelada'?'danger':''),a.status==='Confirmada'?`<div class="actions"><button data-visit="${a.id}" data-status="Atendida">Marcar atendida</button><button data-visit="${a.id}" data-status="Cancelada">Cancelar</button></div>`:a.status==='Atendida'?button('Ver facturación',route('facturacion',{cita:a.id})):''];
 })))}</div>`;
}

function noticesPage(p){
 const notices=data.notices.filter(scoped);
 const unread=notices.filter(notice=>!notice.read).length;
 return heading('Operación / Avisos','Avisos de citas','Cada cita registrada genera un aviso vinculado a la agenda y al CRM.')+
 `<div class="grid two">${card('Por revisar',unread,'En el ámbito actual')}${card('Avisos de cita',notices.length,'Historial de registros de prueba')}</div><div class="row">${panel('Bandeja de avisos',notices.length?notices.map(notice=>{
  const appointment=data.appointments.find(item=>item.id===notice.id);
  const contact=data.contacts.find(item=>item.id===notice.contact);
  if(!appointment||!contact)return '';
  const timestamp=new Date(notice.at).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short',timeZone:'America/Mexico_City'});
  return `<article class="appointment-notice ${p.get('cita')===notice.id?'highlight':''}"><div><div class="kicker">${h(notice.id)} · ${h(contact.source||'Agenda del demo')}</div><h3>${h(contact.name)} · ${h(appointment.study)}</h3><p>${h(appointment.branch)} · ${dayLabel(appointment.day)} a las ${h(appointment.hour)} · ${h(appointment.status)}</p><small>Registrada ${h(timestamp)}</small></div><div class="actions">${pill(notice.read?'Leído':'Nuevo',notice.read?'':'warn')}${button('Ver en agenda',route('agenda',{sede:appointment.branch,fecha:appointment.day}))}${button('Abrir ficha CRM',route('crm',{ficha:contact.id}))}${notice.read?'':`<button data-notice="${h(notice.id)}">Marcar leído</button>`}</div></article>`;
 }).join(''):'<p class="muted">Los avisos aparecerán aquí cuando se registren citas desde el asistente web o desde la agenda del demo.</p>')}</div>`;
}

function branchesPage(p){
 const branch=branchSet().includes(p.get('sede'))?p.get('sede'):branchSet()[0];
 const [,region,address]=locations.find(x=>x[0]===branch);
 const config=data.branches[branch];
 return heading('03 / Red regional','Sucursales','Ubicación, responsables y capacidad de cada centro.')+
 `<div class="grid split">${panel('Directorio',table(['Sucursal','Estado','Hoy libres','Hoy ocupadas'],locations.filter(([name])=>branchSet().includes(name)).map(([name,state])=>[
  `<a href="${h(route('sucursales',{sede:name}))}">${h(name)}</a><br><small>${h(state)}</small>`,pill(data.branches[name].active?'Agenda activa':'Agenda pausada'),available(name,date()).length,daily(name,date()).length
 ])))}${panel(h(branch)+' · '+h(region),`<p>${h(address)}</p><p class="muted">Responsable: ${h(data.staff.find(s=>s.branch===branch&&s.job==='Coordinación')?.name||'Por asignar')}</p>
 <div class="actions">${button('Cómo llegar',mapLink(branch))}${button('Agenda',route('agenda',{sede:branch}))}${button('Inventario',route('inventario',{sede:branch}))}</div>`+
 (role==='Administrador'?'<h3 class="row">Configuración de la sede</h3>'+form('branch-edit',hidden('branch',branch)+`<div class="forms">${input('Bloques de 30 min','slots','number',config.slots,'min="1" max="18" required')}${select('Agenda','active',['Activa','Pausada'],config.active?'Activa':'Pausada')}</div>`+submit()):''))}</div>`;
}

function inventory(p){
 const allowed=branchSet();
 const branch=allowed.includes(p.get('sede'))?p.get('sede'):scope;
 const list=data.stock.filter(x=>scoped(x)&&(branch==='Toda la red'||x.branch===branch));
 const movements=data.movements.filter(x=>scoped(x)&&(branch==='Toda la red'||x.branch===branch));
 return heading('04 / Insumos','Inventario','Existencias por sede, mínimos y movimientos de entrada o salida.')+
 `<form class="filters" data-action="inventory-filter">${select('Sucursal','sede',scopeOptions().filter(x=>scope==='Toda la red'||x===scope),branch)}<button>Consultar</button></form>
 <div class="grid split">${panel('Existencias',table(['Insumo','Sucursal','Disponible','Mínimo','Estado'],list.map(x=>{
  const [sku,name,unit,minimum]=products.find(p=>p[0]===x.sku);
  return [`<b>${h(name)}</b><br><small>${sku}</small>`,h(x.branch),x.quantity+' '+unit,minimum,pill(x.quantity<=minimum?'Stock bajo':'En rango',x.quantity<=minimum?'warn':'')];
 })))}${panel('Registrar movimiento',form('stock',`<div class="forms">${select('Sucursal','branch',allowed,branch)}${select('Insumo','sku',products.map(p=>p[0]+' · '+p[1]))}${select('Tipo','type',['Entrada','Salida'])}${input('Cantidad','qty','number','','min="1" max="999" required')}${input('Referencia','reason','text','','maxlength="60" placeholder="Ej. Consumo de jornada"')}</div>`+submit('Aplicar movimiento')))}</div>
 <div class="row">${panel('Últimos movimientos',table(['Sucursal','Insumo','Tipo','Cantidad','Referencia'],movements.slice(0,12).map(x=>[h(x.branch),h(x.sku),pill(x.type),x.qty,h(x.reason)])))}</div>`;
}

function billing(p){
 const candidates=data.appointments.filter(a=>scoped(a)&&a.status==='Atendida'&&!data.bills.some(b=>b.appointment===a.id));
 const list=data.bills.filter(scoped);
 const total=list.filter(b=>b.status==='Emitida en demo').reduce((sum,b)=>sum+b.amount,0);
 return heading('05 / Caja','Facturación','Prepara un borrador desde una visita atendida y simula su emisión.')+
 `<div class="notice">Datos ficticios. La emisión de prueba carece de validez fiscal.</div><div class="grid two row">${card('Emitido en demo',cash.format(total),'Total del ámbito actual')}${card('Pendientes',list.filter(b=>b.status==='Borrador').length,'Borradores por emitir')}</div>
 <div class="grid split row">${panel('Registro de facturas',table(['Folio','Sucursal','Concepto','Importe','Estado','Acción'],list.map(b=>[h(b.id),h(b.branch),h(b.concept),cash.format(b.amount),pill(b.status),b.status==='Borrador'?`<button data-invoice="${b.id}">Simular emisión</button>`:'—'])))}${panel('Crear borrador',candidates.length?form('invoice',`<div class="forms"><label class="full">Cita atendida<select name="appointment">${candidates.map(a=>`<option value="${h(a.id)}" ${a.id===p.get('cita')?'selected':''}>${h(a.id+' · '+a.branch+' · '+a.study)}</option>`).join('')}</select></label>${input('Importe (MXN)','amount','number','','required min="1" max="99999" step="0.01"')}</div>`+submit('Guardar borrador')):'<p class="muted">Marca una cita como atendida en la agenda para crear su borrador.</p>'+button('Ir a agenda','#agenda'))}</div>`;
}

function capacityBars(rows){
 const max=Math.max(1,...rows.map(([,free,busy])=>free+busy));
 return `<div class="capacity-legend"><span><i></i> Ocupados</span><span><i></i> Disponibles</span></div><div class="visual-bars">${rows.map(([label,free,busy,href])=>{
  const content=`<span>${h(label)}</span><span class="capacity-track" aria-hidden="true"><i style="width:${busy/max*100}%"></i><i style="width:${free/max*100}%"></i></span><strong>${busy}/${free+busy}</strong>`;
  const description=`${label}: ${busy} ocupados y ${free} disponibles`;
  return href?`<a class="visual-row" aria-label="${h(description)}" href="${h(href)}">${content}</a>`:`<div class="visual-row" aria-label="${h(description)}">${content}</div>`;
 }).join('')}</div>`;
}
function summary(){
 const today=date();
 const rows=branchSet().map(branch=>[branch,available(branch,today).length,daily(branch,today).length,route('agenda',{sede:branch,fecha:today})]);
 return heading('Operación de la red','Resumen de operación','Revisa la jornada y abre los módulos desde un solo lugar.',button('Abrir CRM','#crm',true))+
 `<div class="grid kpis">${card('Sedes',rows.length,'En el ámbito actual')}${card('Citas hoy',rows.reduce((n,r)=>n+r[2],0),'Confirmadas y atendidas')}${card('Horarios libres',rows.reduce((n,r)=>n+r[1],0),'Capacidad disponible hoy')}${card('Stock bajo',lowStock().length,'Insumos en mínimo o por debajo')}</div>
 <div class="grid split">${panel('Ocupación de hoy por sucursal','<p class="chart-caption">Los valores muestran horarios ocupados sobre el total. Abre una fila para ver la agenda.</p>'+capacityBars(rows))}${panel('Alertas y accesos',`<p>${followUps().length} seguimientos para hoy o vencidos.</p><p>${lowStock().length} alertas de inventario en el ámbito actual.</p><div class="actions">${button('Inventario','#inventario')}${button('Agenda','#agenda')}${button('Facturación','#facturacion')}</div>`)}</div>`;
}

function analytics(){
 const appts=data.appointments.filter(scoped).filter(a=>a.status!=='Cancelada');
 const contacts=data.contacts.filter(scoped);
 const volume=by(appts,studies,'study');
 const days=Array.from({length:7},(_,i)=>date(i));
 const weekly=days.map(day=>{
  const visits=appts.filter(a=>a.day===day);
  return [dayLabel(day),visits.filter(a=>a.status==='Confirmada').length,visits.filter(a=>a.status==='Atendida').length];
 });
 const max=Math.max(1,...weekly.map(([,booked,attended])=>booked+attended));
 return heading('06 / Dirección','Indicadores','Consulta la distribución de solicitudes y citas en el ámbito seleccionado.')+
 `<div class="grid kpis">${card('Solicitudes',contacts.length,'Entradas en CRM')}${card('Citas activas',appts.length,'Confirmadas y atendidas')}${card('Visitas',appts.filter(a=>a.status==='Atendida').length,'Atendidas')}${card('Seguimientos',followUps().length,'Para hoy o vencidos')}</div>
 <div class="grid crm-charts">${panel('Citas por tipo de estudio',bars(volume))}${panel('Solicitudes por canal',ring(by(contacts,channels,'channel'),channel=>route('crm',{vista:'lista',canal:channel})))}</div>
 <div class="row">${panel('Agenda de los próximos siete días',`<div class="capacity-legend weekly-legend"><span><i></i> Confirmadas</span><span><i></i> Atendidas</span></div><div class="weekly-chart">${weekly.map(([label,booked,attended])=>`<div class="weekly-column"><span class="weekly-stack" aria-hidden="true"><i style="height:${100*booked/max}%"></i><i style="height:${100*attended/max}%"></i></span><b aria-label="${booked} confirmadas y ${attended} atendidas">${booked+attended}</b><small>${h(label)}</small></div>`).join('')}</div>`)}</div>`;
}

function people(){
 return heading('08 / Equipo','Personal y turnos','Consulta responsables y turnos por sucursal.')+
 `<div class="grid split">${panel('Directorio interno',table(['Colaborador','Sucursal','Función','Turno'],data.staff.filter(scoped).map(s=>[h(s.name),h(s.branch),h(s.job),h(s.shift)])))}
 ${role==='Administrador'?panel('Agregar colaborador de prueba',form('staff',`<div class="forms">${input('Nombre ficticio','name','text','','required maxlength="40"')}${select('Sucursal','branch',branchSet())}${select('Función','job',['Recepción','Toma de muestras','Coordinación'])}${select('Turno','shift',['Matutino','Vespertino','Mixto'])}</div>`+submit())):panel('Acceso por rol','<p>Esta vista permite consultar al equipo. La gestión de colaboradores está en la vista de Administrador.</p>')}</div>`;
}

function promotions(p){
 const month=/^\d{4}-\d{2}$/.test(p.get('mes')||'')?p.get('mes'):date().slice(0,7);
 return heading('07 / Crecimiento','Promociones','Planea campañas por mes y sucursal dentro del demo.')+
 `<form class="filters" data-action="promo-filter">${input('Mes','mes','month',month,'required')}<button>Consultar</button></form>
 <div class="grid split">${panel('Campañas',table(['Nombre','Sucursal','Mes','Estado'],data.promotions.filter(x=>scoped(x)&&x.month===month).map(x=>[h(x.name),h(x.branch),h(x.month),pill(x.status)])))}${panel('Registrar campaña',form('promotion',`<div class="forms">${input('Campaña de ejemplo','name','text','','required maxlength="50"')}${select('Sucursal','branch',branchSet())}${input('Mes','month','month',month,'required')}${select('Estado','status',['Borrador','Programada','Finalizada'])}</div>`+submit()))}</div>`;
}

const offers={
 web:['Página web','Portada, catálogo, sucursales y solicitud de cita por WhatsApp.'],
 crm:['CRM de atención','Embudo, responsables, seguimiento y trazabilidad de solicitudes.'],
 agenda:['Agenda y capacidad','Disponibilidad, citas por sede y control de ocupación.'],
 sucursales:['Administración de sucursales','Directorio, horarios y configuración de capacidad.'],
 inventario:['Inventario','Existencias, mínimos, alertas y movimientos por sede.'],
 facturacion:['Facturación','Flujo comercial y conexión fiscal a definir en la implementación.'],
 analitica:['Indicadores','Estudios, canales y desempeño por sede.'],
 promociones:['Promociones','Campañas por mes y por sede.'],
 personal:['Personal y turnos','Responsables, funciones y horarios.'],
 asistente:['Asistente de inteligencia artificial','Orientación y acceso a flujos con los datos autorizados de cada módulo.']
};
const proposalRecipient=window.LabConfig.proposalRecipient;
const selectedModules=()=>data.picks.filter(key=>Object.hasOwn(offers,key));
const selectionMarkup=chosen=>chosen.length?`<ul>${chosen.map(key=>`<li>${offers[key][0]}</li>`).join('')}</ul>`:'<p class="muted">Elige al menos un módulo para preparar el correo.</p>';
function proposal(){
 const chosen=selectedModules();
 const moduleCards=Object.entries(offers).map(([key,[label,desc]])=>`<label class="proposal-module"><input id="offer-${key}" data-offer="${key}" type="checkbox" aria-labelledby="offer-title-${key}" aria-describedby="offer-desc-${key}" ${chosen.includes(key)?'checked':''}><span><strong id="offer-title-${key}">${label}</strong><small id="offer-desc-${key}">${desc}</small></span></label>`).join('');
 const details=form('proposal-preview',`<div class="forms proposal-fields">
 ${input('Nombre completo','name','text','','required maxlength="70" autocomplete="name" placeholder="Nombre y apellidos"')}
 ${input('Correo electrónico','email','email','','required maxlength="120" autocomplete="email" placeholder="nombre@empresa.com"')}
 <label class="full">¿Qué dejarías para después? <small>Opcional</small><textarea name="later" maxlength="240" rows="2">${h(data.proposalNotes?.later||'')}</textarea></label>
 <label class="full">¿Qué te gustaría aclarar? <small>Opcional</small><textarea name="question" maxlength="240" rows="2">${h(data.proposalNotes?.question||'')}</textarea></label>
 </div><button class="primary" type="submit" id="proposal-prepare" ${chosen.length?'':'disabled'}>Revisar solicitud por correo →</button>`);
 return heading('Alcance comercial','Armar propuesta','Dile a Vector Inside qué módulos te interesa evaluar. Puedes elegir la web y el CRM por separado.')+
 `<div class="proposal-layout">${panel('1. Elige tus módulos',`<div class="proposal-modules">${moduleCards}</div>`)}
 ${panel('2. Prepara tu solicitud',`<div id="selected-offers" aria-live="polite">${selectionMarkup(chosen)}</div><p class="muted">Deja un correo donde podamos responderte. En el siguiente paso podrás revisar el mensaje completo.</p>${details}`)}</div>
 <section class="panel proposal-review row" id="proposal-review" aria-labelledby="proposal-review-title" hidden>
 <div class="kicker">Último paso</div><h2 id="proposal-review-title" tabindex="-1">3. Envía tu solicitud</h2>
 <p class="muted">Revisa tu mensaje. El botón abre un borrador en tu aplicación de correo. Envíalo desde ahí.</p>
 <dl><dt>Para</dt><dd>${h(proposalRecipient||'Por configurar')}</dd><dt>Asunto</dt><dd id="proposal-subject"></dd></dl>
 <pre id="proposal-message"></pre>
 <textarea id="proposal-copy-fallback" aria-label="Correo listo para copiar" readonly hidden></textarea>
 <div class="actions"><a class="button primary" id="proposal-email" ${proposalRecipient?'':'hidden'}>Abrir correo para enviar ↗</a><button type="button" id="copy-proposal">Copiar correo</button><button type="button" id="proposal-back">Editar selección o datos</button></div>
 <p class="muted">${proposalRecipient?'Si tu navegador no abre una aplicación de correo, copia el mensaje y envíalo a '+h(proposalRecipient)+'.':'Puedes copiar el mensaje para compartirlo. El destino del correo se configura al desplegar el demo.'}</p>
 </section>`;
}
function prepareProposal(values){
 if(!access('alcance'))return;
 const chosen=selectedModules();
 const name=values.name.trim(),email=values.email.trim();
 if(!chosen.length||!name||!email)return reject('Elige al menos un módulo y completa tu nombre y correo.');
 const later=values.later.trim(),question=values.question.trim();
 const subject='Lab Gutiérrez | Solicitud de propuesta';
 const body=['Hola, Vector Inside:', '', 'Me interesa conversar sobre estos módulos para Lab Gutiérrez:',...chosen.map(key=>'• '+offers[key][0]),'',...(later?['Para una segunda etapa: '+later]:[]),...(question?['Me gustaría aclarar: '+question]:[]),'','Mis datos para que podamos dar seguimiento:',name,email].join('\r\n');
 $('#proposal-subject').textContent=subject;
 $('#proposal-message').textContent=body;
 if(proposalRecipient)$('#proposal-email').href='mailto:'+proposalRecipient+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 $('#proposal-copy-fallback').hidden=true;
 $('#copy-proposal').textContent='Copiar correo';
 $('#proposal-review').hidden=false;
 $('#proposal-review-title').focus();
}
function invalidateProposal(){
 const review=$('#proposal-review');
 if(review)review.hidden=true;
}

function admin(){
 return heading('09 / Configuración','Administración','Compara las vistas de los tres perfiles y gestiona los datos de prueba.')+
 `<div class="grid three">${Object.entries(roles).map(([name,meta])=>`<div class="card"><h3>${h(name)}</h3><p>${h(meta.note)}</p>${pill(meta.scope)}</div>`).join('')}</div><div class="row">${panel('Entorno de demostración','<p>El selector de rol permite probar las vistas y sus acciones. La identidad y los permisos reales se configurarían en la implementación.</p><button id="reset-demo">Restablecer datos de prueba</button>')}</div>`;
}

const renderPage={crm,inicio:summary,agenda,avisos:noticesPage,sucursales:branchesPage,inventario:inventory,facturacion:billing,analitica:analytics,promociones:promotions,personal:people,admin,alcance:proposal};
function render(scroll=false){
 const [hash,query]=location.hash.slice(1).split('?');
 const page=access(hash)?hash:'crm';
 const p=new URLSearchParams(query);
 const unread=data.notices.filter(item=>scoped(item)&&!item.read).length;
 $('#nav').innerHTML=Object.entries(moduleList).filter(([id])=>access(id)).map(([id,[name,icon]])=>`<a href="#${id}" title="${h(name)}" ${id===page?'class="active" aria-current="page"':''}><span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-label">${name}</span>${id==='avisos'&&unread?` <b class="nav-badge">${unread}</b>`:''}</a>`).join('');
 $('#main').innerHTML=renderPage[page](p);
 if(scroll)window.scrollTo(0,0);
}
function navigate(hash,message=''){
 flash=message;
 if(location.hash===hash)render();
 else location.hash=hash;
}
function finish(message,href=location.hash||'#crm'){save();navigate(href,message);}
function reject(message){flash=message;const node=$('#main [role="status"]');if(node)node.textContent=message;}
$('#role').innerHTML=options(Object.keys(roles),role);
$('#scope').innerHTML=options(scopeOptions(),scope);
$('#role').onchange=e=>{
 role=e.target.value;scope=roles[role].scope;flash='';
 $('#scope').innerHTML=options(scopeOptions(),scope);
 if(!access(location.hash.slice(1).split('?')[0]))navigate('#crm');else render();
};
$('#scope').onchange=e=>{scope=e.target.value;flash='';render();};
window.addEventListener('hashchange',()=>{render(true);flash='';});
window.addEventListener('storage',event=>{if(event.key===DemoStore.key){try{data=DemoStore.read();render();}catch{}}});

const updates={
 'crm-filter':v=>navigate(route('crm',{vista:v.vista,...(v.q.trim()?{q:v.q.trim()}:{}),...(v.etapa!=='Todas'?{etapa:v.etapa}:{}),...(v.canal!=='Todos'?{canal:v.canal}:{})})),
 'agenda-filter':v=>navigate(route('agenda',v)),
 'inventory-filter':v=>navigate(route('inventario',v)),
 'promo-filter':v=>navigate(route('promociones',v)),
 'proposal-preview':prepareProposal,
 'contact-new':v=>{
  if(!branchSet().includes(v.branch)||!v.name.trim())return reject('Selecciona una sede y escribe un nombre de prueba.');
  const id=nextId('C',data.contacts);
  data.contacts.unshift({id,name:v.name.trim(),branch:v.branch,study:v.study,channel:v.channel,stage:'Nueva',owner:'Recepción 01',follow:date(),history:[{text:'Solicitud creada.',at:now()}]});
  finish('Solicitud creada en '+v.branch+'.',route('crm',{ficha:id}));
 },
 'contact-edit':v=>{
  const contact=data.contacts.find(c=>c.id===v.id&&scoped(c));
  if(!contact||!stages.includes(v.stage))return;
  const quote=v.quote?Number(v.quote):null;
  if(quote!==null&&(!Number.isFinite(quote)||quote<1||quote>99999))return reject('Revisa el importe de la cotización.');
  if(contact.stage!==v.stage)note(contact,'Etapa: '+contact.stage+' → '+v.stage+'.');
  if(contact.owner!==v.owner)note(contact,'Responsable: '+v.owner+'.');
  if(contact.follow!==v.follow&&v.follow)note(contact,'Próximo contacto: '+dayLabel(v.follow)+'.');
  if(quote!==(contact.quote??null))note(contact,quote?'Cotización registrada por '+cash.format(quote)+'.':'Importe de cotización retirado.');
  if(v.note.trim())note(contact,v.note.trim());
  Object.assign(contact,{stage:v.stage,owner:v.owner,follow:v.follow,quote});
  finish('Seguimiento guardado.');
 },
 book:v=>{
  const contact=data.contacts.find(c=>c.id===v.contact&&c.branch===v.branch&&scoped(c));
  if(!contact||contact.stage==='Atendida'||v.day<date()||!available(v.branch,v.day).includes(v.hour))return reject('El horario o el contacto ya no están disponibles.');
  if(data.appointments.some(a=>a.contact===contact.id&&a.status==='Confirmada'))return reject('Este contacto ya tiene una cita confirmada. Usa otra solicitud o cancela la cita anterior.');
  const id=nextId('A',data.appointments);
  data.appointments.push({id,contact:contact.id,branch:v.branch,study:contact.study,day:v.day,hour:v.hour,status:'Confirmada'});
  data.notices.unshift({id,contact:contact.id,branch:v.branch,at:now(),read:false});
  contact.stage='Cita registrada';
  note(contact,'Cita '+id+' confirmada en '+v.branch+' · '+dayLabel(v.day)+' a las '+v.hour+'.');
  finish('Cita confirmada. El horario quedó ocupado y el CRM se actualizó.',route('agenda',{sede:v.branch,fecha:v.day}));
 },
 'branch-edit':v=>{
  if(role!=='Administrador'||!branchSet().includes(v.branch))return;
  const slots=Number(v.slots);
  if(!Number.isInteger(slots)||slots<1||slots>18)return reject('Configura entre 1 y 18 bloques.');
  const end=7*60+slots*30;
  if(data.appointments.some(a=>a.branch===v.branch&&a.day>=date()&&a.status==='Confirmada'&&Number(a.hour.slice(0,2))*60+Number(a.hour.slice(3))>=end))return reject('El cambio dejaría citas confirmadas fuera de la jornada. Revísalas en la agenda.');
  Object.assign(data.branches[v.branch],{slots,active:v.active==='Activa'});
  finish('Configuración guardada. La capacidad se actualizó en la agenda.');
 },
 stock:v=>{
  const item=data.stock.find(x=>x.branch===v.branch&&x.sku===v.sku.split(' · ')[0]&&scoped(x));
  const qty=Number(v.qty);
  if(!item||!Number.isInteger(qty)||qty<1||qty>999)return reject('Selecciona un insumo y una cantidad válida.');
  const next=item.quantity+(v.type==='Entrada'?qty:-qty);
  if(next<0)return reject('La salida supera la existencia de esta sucursal.');
  item.quantity=next;
  data.movements.unshift({branch:v.branch,sku:item.sku,type:v.type,qty,reason:v.reason.trim()||'Movimiento de prueba'});
  finish('Movimiento aplicado. La existencia se actualizó.',route('inventario',{sede:v.branch}));
 },
 invoice:v=>{
  const appointment=data.appointments.find(a=>a.id===v.appointment&&a.status==='Atendida'&&scoped(a));
  const amount=Number(v.amount);
  if(!appointment||data.bills.some(b=>b.appointment===appointment.id)||amount<1||amount>99999)return reject('Selecciona una visita pendiente y un importe válido.');
  data.bills.unshift({id:nextId('F',data.bills),appointment:appointment.id,branch:appointment.branch,concept:appointment.study,amount,status:'Borrador'});
  finish('Borrador guardado.');
 },
 staff:v=>{
  if(role!=='Administrador'||!branchSet().includes(v.branch)||!v.name.trim())return;
  data.staff.push({...v,name:v.name.trim()});
  finish('Colaborador registrado.');
 },
 promotion:v=>{
  if(!access('promociones')||!branchSet().includes(v.branch)||!v.name.trim())return;
  data.promotions.push({...v,name:v.name.trim()});
  finish('Campaña de prueba guardada.',route('promociones',{mes:v.month}));
 }
};
$('#main').addEventListener('submit',event=>{
 const action=event.target.dataset.action;
 if(!Object.hasOwn(updates,action))return;
 event.preventDefault();
 const values=Object.fromEntries(new FormData(event.target));
 if(action.endsWith('-filter')||action==='proposal-preview')updates[action](values);
 else changeData(()=>updates[action](values));
});
async function handleDemoClick(control){
 const {visit,status,invoice,followDone,notice}=control.dataset;
 if(notice){
  const item=data.notices.find(value=>value.id===notice&&scoped(value));
  if(item){item.read=true;finish('Aviso marcado como leído.');}
 }
 if(followDone){
  const contact=data.contacts.find(c=>c.id===followDone&&scoped(c));
  if(!contact||!contact.follow)return;
  note(contact,'Seguimiento marcado como hecho.');
  contact.follow='';
  finish('Seguimiento completado. Puedes programar el siguiente desde la ficha.');
 }
 if(visit&&['Atendida','Cancelada'].includes(status)){
  const appointment=data.appointments.find(a=>a.id===visit&&a.status==='Confirmada'&&scoped(a));
  if(!appointment)return;
  const contact=data.contacts.find(c=>c.id===appointment.contact);
  appointment.status=status;
  if(contact){
   contact.stage=status==='Atendida'?'Atendida':'En seguimiento';
   note(contact,'Cita '+visit+' · '+status.toLowerCase()+'.');
  }
  finish(status==='Atendida'?'Visita atendida. Puedes preparar la factura de prueba.':'Cita cancelada. El horario vuelve a estar disponible.');
 }
 if(invoice){
  const bill=data.bills.find(b=>b.id===invoice&&b.status==='Borrador'&&scoped(b));
  if(bill){bill.status='Emitida en demo';finish('Emisión simulada. El documento carece de validez fiscal.');}
 }
 if(control.id==='crm-assistant'){window.LabGuide?.hide();assistant.showModal();}
 if(control.id==='reset-demo'&&role==='Administrador'&&confirm('¿Restablecer todos los cambios de prueba en este navegador?')){
  data=makeSeed();finish('Datos de prueba restaurados.');
 }
 if(control.id==='proposal-back'){
  invalidateProposal();
  $('#proposal-prepare').focus();
 }
 if(control.id==='copy-proposal'){
  const text='Para: '+proposalRecipient+'\nAsunto: '+$('#proposal-subject').textContent+'\n\n'+$('#proposal-message').textContent;
  try{
   await navigator.clipboard.writeText(text);
   control.textContent='Correo copiado';
  }catch{
   const area=$('#proposal-copy-fallback');
   area.value=text;area.hidden=false;area.select();
  }
 }
}
$('#main').addEventListener('click',event=>{
 const control=event.target.closest('button');
 if(!control)return;
 const {visit,invoice,followDone,notice}=control.dataset;
 if(visit||invoice||followDone||notice||control.id==='reset-demo')changeData(()=>handleDemoClick(control));
 else handleDemoClick(control);
});
$('#main').addEventListener('change',event=>{
 const key=event.target.dataset.offer;
 if(!access('alcance')||!Object.hasOwn(offers,key))return;
 const checked=event.target.checked;
 changeData(()=>{
  data.picks=checked?[...new Set([...data.picks,key])]:data.picks.filter(value=>value!==key);
  save();
  const selected=$('#selected-offers');
  if(!selected)return;
  const chosen=selectedModules();
  selected.innerHTML=selectionMarkup(chosen);
  $('#proposal-prepare').disabled=!chosen.length;
  invalidateProposal();
 });
});

$('#main').addEventListener('input',event=>{if(event.target.closest('[data-action="proposal-preview"]'))invalidateProposal();});

const normalize=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const assistant=$('#assistant');
const prompts=['Citas disponibles en Tonalá','¿Qué seguimientos están pendientes?','Inventario bajo','Ver facturación'];
$('#prompts').innerHTML=prompts.map(prompt=>`<button type="button" data-prompt="${h(prompt)}">${h(prompt)}</button>`).join('');
function answer(message){
 const q=normalize(message);
 const mentioned=names.find(name=>q.includes(normalize(name)));
 if(mentioned&&!branchSet().includes(mentioned))return ['Esa sucursal está fuera del ámbito de la vista actual.',[]];
 const branch=mentioned||branchSet()[0];
 if(/cita|agenda|horario|disponib/.test(q)){
  const day=date(/manana/.test(q)?1:0);
  const hours=available(branch,day);
  const booked=daily(branch,day).length;
  return [`${branch} · ${dayLabel(day)}: ${hours.length} disponibles y ${booked} ocupadas.`+(hours.length?' Próximos bloques: '+hours.slice(0,4).join(', ')+'.':''),[[route('agenda',{sede:branch,fecha:day}),'Abrir agenda de '+branch]]];
 }
 if(/inventario|stock|insumo|existencia/.test(q)){
  const low=lowStock().filter(item=>!mentioned||item.branch===mentioned);
  const items=low.slice(0,3).map(item=>products.find(p=>p[0]===item.sku)[1]+' en '+item.branch);
  return [`Encontré ${low.length} insumos en el mínimo o por debajo.`+(items.length?' '+items.join(' · ')+'.':''),[[route('inventario',mentioned?{sede:mentioned}:{}),'Revisar existencias']]];
 }
 if(/crm|seguimiento|contacto|cotiza/.test(q)){
  const list=followUps().filter(contact=>!mentioned||contact.branch===mentioned);
  const next=list.sort((a,b)=>a.follow.localeCompare(b.follow))[0];
  return [`Hay ${list.length} seguimientos para hoy o vencidos.`+(next?' Puedes empezar con '+next.name+' de '+next.branch+'.':''),[[route('crm',next?{ficha:next.id}:{}),next?'Abrir ficha en el CRM':'Abrir CRM']]];
 }
 if(/factur|caja/.test(q)){
  const count=data.bills.filter(b=>scoped(b)&&b.status==='Borrador'&&(!mentioned||b.branch===mentioned)).length;
  return [`Hay ${count} borradores en la vista solicitada. Las visitas atendidas pueden pasar a facturación de prueba.`,[['#facturacion','Abrir facturación']]];
 }
 if(/sucursal|ubicaci|direccion/.test(q))return ['Aquí puedes consultar la dirección y la capacidad de '+branch+'.',[[route('sucursales',{sede:branch}),'Abrir sucursal']]];
 if(/propuesta|modulo|contrat/.test(q)&&access('alcance'))return ['Puedes seleccionar la web, el CRM y los módulos que quieras evaluar.',[['#alcance','Armar propuesta']]];
 return ['Puedo orientarte sobre agenda, seguimientos del CRM, inventario, facturación o sucursales en este demo.',[['#crm','Abrir CRM'],['#agenda','Ver agenda']]];
}
function chat(message){
 if(/guiame|guia del demo|recorrido|que puedo explorar|que puedo hacer aqui/.test(normalize(message))&&window.LabGuide){window.LabGuide.open();return;}
 const [reply,links]=answer(message);
 const log=$('#conversation');
 const user=document.createElement('p');user.className='bubble user';user.textContent=message;
 const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=reply;
 for(const [url,label] of links){
  const link=document.createElement('a');link.href=url;link.textContent=label+' ↗';link.onclick=()=>assistant.close();bubble.append(link);
 }
 log.append(user,bubble);log.scrollTop=log.scrollHeight;
}
$('#assistant-open').onclick=()=>{window.LabGuide?.hide();assistant.showModal();};
$('#assistant-close').onclick=()=>assistant.close();
$('#prompts').onclick=e=>{if(e.target.dataset.prompt)chat(e.target.dataset.prompt);};
$('#ask').onsubmit=e=>{e.preventDefault();const field=e.target.elements.message;if(field.value.trim())chat(field.value.trim());field.value='';};
function applyTheme(mode){
 document.documentElement.dataset.theme=mode;
 $('#theme').textContent=mode==='dark'?'☀':'☾';
 $('#theme').setAttribute('aria-label',mode==='dark'?'Activar modo claro':'Activar modo oscuro');
}
applyTheme(localStorage.getItem('lg-operations-theme')||localStorage.getItem('lg-patient-theme')||'light');
$('#theme').onclick=()=>{const mode=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('lg-operations-theme',mode);applyTheme(mode);};
const sidebarToggle=$('#sidebar-toggle');
function applySidebar(compact){
 document.documentElement.dataset.sidebar=compact?'compact':'expanded';
 const label=compact?'Expandir barra lateral':'Plegar barra lateral';
 sidebarToggle.setAttribute('aria-expanded',String(!compact));
 sidebarToggle.setAttribute('aria-label',label);
 sidebarToggle.title=label;
}
applySidebar(localStorage.getItem('lg-demo-sidebar')==='compact');
sidebarToggle.onclick=()=>{
 const compact=document.documentElement.dataset.sidebar!=='compact';
 applySidebar(compact);
 localStorage.setItem('lg-demo-sidebar',compact?'compact':'expanded');
};
render();
