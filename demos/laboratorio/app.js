const $ = selector => document.querySelector(selector);
const form = $('#booking');
const branches = [
 ['Chiapas', ['Arriaga','Tonalá','Cintalapa','Pijijiapan','Cacahoatán','Jiquipilas','Unión Juárez']],
 ['Oaxaca', ['Chahuites','Zanatepec','Tapanatepec']]
];

for (const link of document.querySelectorAll('[data-study]')) {
 const study = link.dataset.study;
 form.elements.study.add(new Option(study));
 link.addEventListener('click', () => {
  form.elements.study.value = study;
  $('#request').hidden = true;
 });
}
for (const [region, names] of branches) {
 const group = document.createElement('optgroup');
 group.label = region;
 for (const name of names) {
  group.append(new Option(name));
  const link = document.createElement('a');
  link.className = 'branch';
  link.href = '#agenda';
  const label = document.createElement('b');
  label.textContent = name;
  const detail = document.createElement('small');
  detail.textContent = region + ' · Solicitar cita ↗';
  link.append(label, detail);
  link.addEventListener('click', () => {
   form.elements.branch.value = name;
   $('#request').hidden = true;
  });
  $('#branch-list').append(link);
 }
 form.elements.branch.append(group);
}

const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'America/Mexico_City'}).format(new Date());
form.elements.date.min = today;
form.addEventListener('input', () => { $('#request').hidden = true; });
form.addEventListener('submit', event => {
 event.preventDefault();
 const {study, branch, date, shift} = Object.fromEntries(new FormData(form));
 const day = new Intl.DateTimeFormat('es-MX', {dateStyle:'full'}).format(new Date(date+'T12:00:00'));
 $('#summary').textContent = [study, branch, day, shift].join(' · ');
 const message = `Hola, quisiera consultar disponibilidad para una cita en la sucursal ${branch} el ${day}, en el turno ${shift.toLowerCase()}. Gracias.`;
 $('#send').href = 'https://wa.me/529661041795?text=' + encodeURIComponent(message);
 $('#request').hidden = false;
 $('#send').focus();
});

const theme = $('#theme');
function setTheme(mode) {
 document.documentElement.dataset.theme = mode;
 theme.textContent = mode === 'dark' ? '☀' : '☾';
 theme.setAttribute('aria-label', mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
}
setTheme(localStorage.getItem('lg-patient-theme') || 'light');
theme.addEventListener('click', () => {
 const mode = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
 setTheme(mode);
 localStorage.setItem('lg-patient-theme', mode);
});

const heroVideo = $('#dna');
const motion = $('#motion');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (!reduceMotion.matches) {
 document.querySelectorAll('.hero-title-line').forEach((line, row) => {
  let index = 0;
  const words = line.textContent.split(' ');
  const fragment = document.createDocumentFragment();
  for (const [position, word] of words.entries()) {
   if (position) fragment.append(' ');
   const group = document.createElement('span');
   group.className = 'hero-word';
   for (const letter of word) {
    const glyph = document.createElement('span');
    glyph.className = 'hero-letter';
    glyph.textContent = letter;
    glyph.style.setProperty('--reveal-delay', (115 + row * 305 + index * 27) + 'ms');
    index++;
    group.append(glyph);
   }
   fragment.append(group);
  }
  line.replaceChildren(fragment);
 });
}

let allowMotion = !reduceMotion.matches;
let heroVisible = false;

function updateHeroMotion() {
 if (allowMotion && heroVisible) {
  heroVideo.play().catch(() => {
   motion.textContent = 'Reproducir animación';
  });
 } else {
  heroVideo.pause();
 }
}
motion.hidden = false;
heroVideo.addEventListener('playing', () => { motion.textContent = 'Pausar animación'; });
heroVideo.addEventListener('pause', () => { motion.textContent = 'Reproducir animación'; });
heroVideo.addEventListener('error', () => { motion.hidden = true; });
motion.addEventListener('click', () => {
 allowMotion = heroVideo.paused;
 updateHeroMotion();
});
reduceMotion.addEventListener('change', event => {
 allowMotion = !event.matches;
 updateHeroMotion();
});
new IntersectionObserver(([entry]) => {
 heroVisible = entry.isIntersecting;
 updateHeroMotion();
}).observe(heroVideo);

const locations = {
 Arriaga:[-93.899,16.236,'3.ª Calle Sur y 3.ª Avenida Oriente, Centro'],
 Tonalá:[-93.752,16.091,'Av. Revolución 50, entre 21 de Marzo y Francisco I. Madero'],
 Cintalapa:[-93.721,16.698,'Central Sur 60, entre 3.ª y 4.ª Sur, Centro'],
 Pijijiapan:[-93.209,15.686,'1.ª Avenida Norte 5, entre Central y 1.ª Poniente, Centro'],
 Cacahoatán:[-92.166,14.992,'Av. Central Norte, entre 3.ª y 5.ª Calle Oriente'],
 Jiquipilas:[-93.647,16.668,'1.ª Poniente, entre Av. Central y 1.ª Norte'],
 'Unión Juárez':[-92.081,15.065,'Av. Hidalgo, entre Miguel Negrete y 16 de Septiembre'],
 Chahuites:[-94.193,16.289,'16 de Septiembre 13, entre Av. Agricultura y Av. Ayuntamiento'],
 Zanatepec:[-94.347,16.477,'Av. Juan Martínez s/n, entre Aldama y Morelos'],
 Tapanatepec:[-94.193,16.369,'5 de Febrero s/n, esquina 16 de Septiembre']
};
const map = $('#branch-map');
const layer = $('.map-layer');
const markers = $('#map-markers');
const branchSelect = $('#map-select');
const markerByName = new Map();
const regionByName = new Map();
const markerOffset = {
 Arriaga:[12,4], Tonalá:[20,18], Cintalapa:[-12,-14], Jiquipilas:[15,10],
 Cacahoatán:[-9,15], 'Unión Juárez':[11,-12], Chahuites:[-16,18],
 Tapanatepec:[-3,-7], Zanatepec:[-16,-14]
};
let selectedBranch = 'Tonalá';
let zoom=1, offsetX=0, offsetY=0, drag;
let mapWidth=0, mapHeight=0;

function updateBranch(name) {
 const region = regionByName.get(name);
 const address = locations[name][2];
 $('#map-name').textContent = name + ', ' + region;
 $('#map-address').textContent = address;
 const query = ['Laboratorio Gutiérrez', address, name, region].join(', ');
 $('#map-directions').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
 $('#map-book').onclick = () => {
  form.elements.branch.value = name;
  $('#request').hidden = true;
 };
}
function selectBranch(name, center = false) {
 selectedBranch = name;
 branchSelect.value = name;
 for(const [branch, marker] of markerByName) marker.setAttribute('aria-pressed', String(branch === name));
 updateBranch(name);
 if(center && zoom>1) centerOnBranch();
}
for(const [region,names] of branches){
 const group = document.createElement('optgroup');
 group.label=region;
 for(const name of names){
  regionByName.set(name,region);
  group.append(new Option(name));
  const marker=document.createElement('button');
  marker.type='button';
  marker.className='map-marker';
  marker.setAttribute('aria-label', name + ', ' + region);
  const [lon,lat]=locations[name], [dx,dy]=markerOffset[name] || [0,0];
  marker.style.left=((lon+99)*99+dx)/9+'%';
  marker.style.top=((19-lat)*103+dy)/5+'%';
  const tip=document.createElement('span');
  tip.textContent=name;
  tip.setAttribute('aria-hidden','true');
  marker.append(tip);
  marker.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')updateBranch(name);});
  marker.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')updateBranch(selectedBranch);});
  marker.addEventListener('click',()=>selectBranch(name));
  markers.append(marker);
  markerByName.set(name,marker);
 }
 branchSelect.append(group);
}

function paintMap() {
 const maxX=mapWidth*(zoom-1)/2, maxY=mapHeight*(zoom-1)/2;
 offsetX=Math.max(-maxX,Math.min(maxX,offsetX));
 offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
 layer.style.transform=`translate(${offsetX}px,${offsetY}px) scale(${zoom})`;
 layer.style.setProperty('--marker-scale',1/zoom);
 map.classList.toggle('is-zoomed',zoom>1);
 $('#map-in').disabled=zoom>=3;
 $('#map-out').disabled=zoom<=1;
}
function centerOnBranch() {
 const marker=markerByName.get(selectedBranch);
 offsetX=(.5-parseFloat(marker.style.left)/100)*mapWidth*zoom;
 offsetY=(.5-parseFloat(marker.style.top)/100)*mapHeight*zoom;
 paintMap();
}
function resizeMap() {
 const scale=Math.max(map.clientWidth/900,map.clientHeight/500);
 mapWidth=900*scale;
 mapHeight=500*scale;
 Object.assign(layer.style,{width:mapWidth+'px',height:mapHeight+'px',left:(map.clientWidth-mapWidth)/2+'px',top:(map.clientHeight-mapHeight)/2+'px'});
 centerOnBranch();
}
function changeZoom(delta) {
 zoom=Math.max(1,Math.min(3,zoom+delta));
 centerOnBranch();
}
$('#map-in').onclick=()=>changeZoom(.5);
$('#map-out').onclick=()=>changeZoom(-.5);
$('#map-reset').onclick=()=>{zoom=1;centerOnBranch();};
branchSelect.onchange=()=>selectBranch(branchSelect.value,true);
map.addEventListener('pointerdown',event=>{
 if(zoom===1||event.button!==0||event.target.closest('button,a'))return;
 drag={id:event.pointerId,x:event.clientX-offsetX,y:event.clientY-offsetY};
 map.setPointerCapture(event.pointerId);
 map.classList.add('is-dragging');
});
map.addEventListener('pointermove',event=>{
 if(drag?.id!==event.pointerId)return;
 offsetX=event.clientX-drag.x;
 offsetY=event.clientY-drag.y;
 paintMap();
});
map.addEventListener('lostpointercapture',()=>{drag=null;map.classList.remove('is-dragging');});
selectBranch(selectedBranch);
new ResizeObserver(resizeMap).observe(map);
resizeMap();
