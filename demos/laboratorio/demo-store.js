(() => {
const date = (days=0) => {
 const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City'}).format(new Date());
 const value=new Date(day+'T12:00:00Z');
 value.setUTCDate(value.getUTCDate()+days);
 return value.toISOString().slice(0,10);
};
const studies=['Biometría hemática','Química sanguínea','Examen general de orina','Chequeo Básico Familiar','Paquete Prenatal','Perfil Hormonal Femenino'];
const stages=['Nueva','En seguimiento','Cotizada','Cita registrada','Atendida'];
const channels=['WhatsApp','Portal','Teléfono','Mostrador','Convenio'];
const locations=[
 ['Tonalá','Chiapas','Av. Revolución 50, entre 21 de Marzo y Francisco I. Madero'],
 ['Arriaga','Chiapas','3.ª Calle Sur y 3.ª Av. Oriente, Centro'],
 ['Cintalapa','Chiapas','Central Sur 60, entre 3.ª y 4.ª Sur, Centro'],
 ['Pijijiapan','Chiapas','1.ª Avenida Norte 5, entre Central y 1.ª Poniente, Centro'],
 ['Cacahoatán','Chiapas','Av. Central Norte, entre 3.ª y 5.ª Calle Oriente'],
 ['Jiquipilas','Chiapas','1.ª Poniente, entre Av. Central y 1.ª Norte'],
 ['Unión Juárez','Chiapas','Av. Hidalgo, entre Miguel Negrete y 16 de Septiembre'],
 ['Chahuites','Oaxaca','16 de Septiembre 13, entre Av. Agricultura y Av. Ayuntamiento'],
 ['Zanatepec','Oaxaca','Av. Juan Martínez s/n, entre Aldama y Morelos'],
 ['Tapanatepec','Oaxaca','5 de Febrero s/n, esquina 16 de Septiembre']
];
const names=locations.map(([name])=>name);
const products=[['EDTA','Tubos EDTA','pzas.',20],['AGU','Agujas estériles','pzas.',25],['GLV','Guantes de nitrilo','pares',40],['REAC','Reactivo de química','unid.',8]];
const now=()=>new Date().toISOString();
const makeSeed=()=>{
 const branches=Object.fromEntries(locations.map(([name],index)=>[name,{slots:index%3===2?6:8,active:true}]));
 const contacts=Array.from({length:24},(_,i)=>({
  id:'C-'+(101+i),name:'Contacto '+String(i+1).padStart(2,'0'),branch:names[i<8?0:i<13?1:(i-13)%10],
  study:studies[i%studies.length],stage:stages[i%3],channel:channels[i%5],owner:i%2?'Recepción 02':'Recepción 01',
  follow:date(i%4-1),history:[{text:'Solicitud registrada desde '+channels[i%5]+'.',at:now()}]
 }));
 const appointments=[0,1,2,8,9,13,14,15,16].map((i,n)=>{
  const contact=contacts[i];contact.stage=n===0?'Atendida':'Cita registrada';
  return {id:'A-'+(101+n),contact:contact.id,branch:contact.branch,study:contact.study,day:date(n===5?1:0),hour:['07:00','07:30','08:30','08:00','09:00','09:30','07:30','08:00','07:00'][n],status:n===0?'Atendida':'Confirmada'};
 });
 return {
  branches,contacts,appointments,
  stock:names.flatMap((branch,i)=>products.map(([sku,,,minimum],j)=>({branch,sku,quantity:(i+j)%4===0?minimum-4:minimum+11+(i*7+j*5)%35}))),
  movements:[],
  bills:[{id:'F-101',appointment:appointments[0].id,branch:'Tonalá',concept:appointments[0].study,amount:420,status:'Emitida en demo'}],
  staff:names.flatMap((branch,i)=>[{name:'Responsable '+String(i+1).padStart(2,'0'),branch,job:'Coordinación',shift:'Matutino'},{name:'Recepción '+String(i+1).padStart(2,'0'),branch,job:'Recepción',shift:'Matutino'}]),
  promotions:[{name:'Chequeo preventivo de muestra',branch:'Tonalá',month:date().slice(0,7),status:'Borrador'}],
  notices:[],picks:['crm']
 };
};

const key='lg-operacion-demo-v2';
const prices=[190,380,130,680,610,1700];
function read(){
 const state=JSON.parse(localStorage.getItem(key))||makeSeed();
 state.notices??=[];
 return state;
}
const write=state=>{localStorage.setItem(key,JSON.stringify(state));window.dispatchEvent(new Event('lg-demo-updated'));};
const exclusive=work=>navigator.locks?navigator.locks.request(key,work):Promise.resolve().then(work);
const hours=(state,branch)=>state.branches[branch]?.active?Array.from({length:state.branches[branch].slots},(_,i)=>String(7+Math.floor(i/2)).padStart(2,'0')+(i%2?':30':':00')):[];
const daily=(state,branch,day)=>state.appointments.filter(a=>a.branch===branch&&a.day===day&&a.status!=='Cancelada');
const available=(state,branch,day)=>hours(state,branch).filter(hour=>!daily(state,branch,day).some(a=>a.hour===hour));
const nextId=(prefix,list)=>prefix+'-'+(101+list.length);
function bookFromPortal(input){
 return exclusive(()=>{
  const state=read();
  const {study,branch,day,hour}=input;
  const name=input.name.trim(),phone=input.phone.replace(/\D/g,''),email=input.email.trim().toLowerCase();
  if(!studies.includes(study)||!names.includes(branch)||!/^\d{4}-\d{2}-\d{2}$/.test(day)||day<date()||day>date(30)||name.length<2||name.length>70||phone.length!==10||!/^\S+@\S+\.\S+$/.test(email)||email.length>120){
   return {error:'Revisa el estudio, la sede, la fecha y los datos de prueba.'};
  }
  const existing=state.contacts.find(c=>c.email===email&&c.study===study&&c.branch===branch&&state.appointments.some(a=>a.contact===c.id&&a.status==='Confirmada'));
  if(existing)return {error:'Ya hay una cita confirmada para este correo, estudio y sede en el demo.'};
  if(!available(state,branch,day).includes(hour))return {error:'Ese horario ya se ocupó. Elige uno de los bloques que siguen libres.'};
  const at=now(),contactId=nextId('C',state.contacts),appointmentId=nextId('A',state.appointments);
  const quote=prices[studies.indexOf(study)];
  state.contacts.unshift({id:contactId,name,phone,email,branch,study,quote,stage:'Cita registrada',channel:'Portal',source:'Asistente web',owner:'Recepción 01',follow:day,history:[
   {text:'Cita '+appointmentId+' confirmada desde el asistente web · '+day+' a las '+hour+'.',at},
   {text:'Solicitud creada desde el portal. Estimación de prueba: $'+quote+' MXN.',at}
  ]});
  state.appointments.push({id:appointmentId,contact:contactId,branch,study,day,hour,status:'Confirmada'});
  state.notices.unshift({id:appointmentId,contact:contactId,branch,at,read:false});
  write(state);
  return {appointmentId,contactId};
 });
}
window.DemoStore={date,studies,stages,channels,locations,names,products,prices,now,makeSeed,key,read,write,exclusive,hours,daily,available,nextId,bookFromPortal};
})();
