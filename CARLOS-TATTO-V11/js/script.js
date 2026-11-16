'use strict';
/* [00] AJUSTES EDITABLES: TODO-CARLOS-05 cambia galleryTilt o scrollSensitivity */
const OPTIONS = { galleryTilt: 13, maxPhotos: 5, maxPhotoMB: 6, scrollSensitivity: 1 };
const $ = (s, parent = document) => parent.querySelector(s);
const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const ease = (t) => t * t * (3 - 2 * t);
const interpolate = (a, b, t) => a + (b - a) * t;
const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.classList.add('has-js');

/* [01] TEMA: funcionalidad extra A; classList.toggle en el body */
const themeButton = $('#themeToggle');
const themeText = $('#themeText');
function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
  themeText.textContent = isDark ? 'LIGHT' : 'DARK';
  $('meta[name="theme-color"]').content = isDark ? '#10100f' : '#e8e2d8';
  try { localStorage.setItem('carlostatto-theme', isDark ? 'dark' : 'light'); } catch (_) { /* Almacenamiento desactivado */ }
}
try { applyTheme(localStorage.getItem('carlostatto-theme') === 'dark'); } catch (_) { applyTheme(false); }
themeButton.addEventListener('click', () => applyTheme(!document.body.classList.contains('dark-mode')));

/* [02] MENÚ MÓVIL MOSTRAR/OCULTAR */
const menuButton = $('#menuToggle');
const navLinks = $('#navLinks');
function closeMenu() { navLinks.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); $('#menuText').textContent = 'MENÚ'; }
menuButton.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
  $('#menuText').textContent = open ? 'CERRAR' : 'MENÚ';
});
$$('a', navLinks).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

/* [03] REVEAL ACCESIBLE: si JavaScript falla, HTML sigue visible */
const revealItems = $$('.reveal');
if (!('IntersectionObserver' in window) || prefersReduce.matches) {
  revealItems.forEach(node => node.classList.add('is-visible'));
} else {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); } });
  }, { threshold: .11 });
  revealItems.forEach(node => obs.observe(node));
}

/* [04] MÁQUINA CINEMATOGRÁFICA — 96 FOTOGRAMAS REALES CONTROLADOS POR SCROLL */
/* [EDITABLE-MACHINE] Cambia el tamaño de la escena en CSS, no las piezas de la imagen. */
const machineSection = $('#maquina');
const machineViewport = $('#machineViewport');
const machineStage = $('#machineStage');
const machineCanvas = $('#machineCanvas');
const machineContext = machineCanvas.getContext('2d', { alpha: true });
const machineCount = $('#machineCount');
const machineStatus = $('#machineStatus');
const machineTrack = $('#machineTrackFill');
const machineSteps = $$('.machine-steps li');
const led = $('#machineLed');
const inkLine = $('#machineInk');
const motionButton = $('#motionOverride');
const frameCount = 96;
const frames = Array(frameCount).fill(null);
const frameReady = Array(frameCount).fill(false);
let motionMode = 'auto';
let machineVisible = false;
let lastActiveStep = -1;
let lastCompletedCount = -1;
let currentFrameIndex = -1;
let pendingFrame = 0;
let previousFrame = null;
let machineProgress = 0;

function machineMotionReduced() {
  return motionMode === 'reduced' || (motionMode === 'auto' && prefersReduce.matches);
}

function frameURL(index) {
  return `assets/img/machine/frames/frame_${String(index).padStart(3, '0')}.webp`;
}

function loadFrame(index) {
  if (index < 0 || index >= frameCount || frames[index]) return;
  const image = new Image();
  frames[index] = image;
  image.decoding = 'async';
  image.addEventListener('load', () => {
    frameReady[index] = true;
    if (index === 0) machineStage.classList.add('has-frame');
    if (Math.abs(index - pendingFrame) < 4) scheduleUpdate();
  });
  image.addEventListener('error', () => {
    // Si un fotograma no existe, la imagen maestra sigue siendo visible.
    frameReady[index] = false;
  });
  image.src = frameURL(index);
}

function startFrameLoading() {
  [0, 95, 1, 2, 3].forEach(loadFrame);
  // Cargamos el resto escalonadamente para no bloquear la portada.
  let next = 4;
  function batch() {
    let loaded = 0;
    while (next < frameCount && loaded < 9) {
      if (!frames[next]) loadFrame(next);
      next++;
      loaded++;
    }
    if (next < frameCount) window.setTimeout(batch, 85);
  }
  window.setTimeout(batch, 160);
}

function paintFrame(index) {
  if (!machineContext) return;
  if (currentFrameIndex === index && frameReady[index]) return;
  pendingFrame = index;
  loadFrame(index);
  for (let delta = 1; delta <= 2; delta++) { loadFrame(index - delta); loadFrame(index + delta); }
  let source = frameReady[index] ? index : -1;
  if (source < 0) {
    for (let delta = 1; delta < frameCount && source < 0; delta++) {
      if (index - delta >= 0 && frameReady[index - delta]) source = index - delta;
      else if (index + delta < frameCount && frameReady[index + delta]) source = index + delta;
    }
  }
  if (source < 0) return;
  machineContext.clearRect(0, 0, 900, 960);
  machineContext.drawImage(frames[source], 0, 0, 900, 960);
  currentFrameIndex = source;
  machineStage.classList.add('has-frame');
}

function setMachineState(step, count) {
  if (count !== lastCompletedCount) {
    const hadPiece = lastCompletedCount;
    lastCompletedCount = count;
    machineCount.innerHTML = `${String(count).padStart(2, '0')}<span>/06</span>`;
    // Un pequeño destello marca los acoples. No muestra flashes en modo reducido.
    if (count > hadPiece && hadPiece >= 0 && count > 0 && !machineMotionReduced()) {
      const snap = $('#machineSnap');
      snap.classList.remove('is-snapping');
      void snap.offsetWidth; // reinicia el efecto solo cuando encaja una pieza
      snap.classList.add('is-snapping');
    }
  }
  if (step !== lastActiveStep) {
    lastActiveStep = step;
    const messages = [
      'Seis piezas. Una sola máquina.',
      'Cada pieza encaja cuando avanzas.',
      'Montaje completo. Precisión milimétrica.',
      'La máquina está encendida. Lista para crear.'
    ];
    machineStatus.textContent = messages[step];
    machineSteps.forEach((node, i) => node.classList.toggle('is-active', i === step));
  }
}

function scaleMachine() {
  // El canvas y todas las luces escalan juntos mediante CSS responsive.
  const bounds = machineViewport.getBoundingClientRect();
  const safe = Math.min(1.13, Math.max(.36, (bounds.height - 12) / 770), Math.max(.36, (bounds.width - 12) / 750));
  machineStage.style.setProperty('--scene-scale', safe.toFixed(3));
}

function renderMachine() {
  const area = machineSection.getBoundingClientRect();
  const travel = Math.max(1, area.height - innerHeight);
  const p = clamp((-area.top / travel) * OPTIONS.scrollSensitivity);
  machineVisible = area.bottom > 0 && area.top < innerHeight;
  machineProgress = p;
  const phase = clamp((p - .025) / .86);
  const stepEnds = [.20,.35,.49,.63,.77,.87];
  const joined = stepEnds.filter(end => p >= end).length;
  const currentStep = p < .06 ? 0 : p < .87 ? 1 : p < .92 ? 2 : 3;
  setMachineState(currentStep, joined);
  machineTrack.style.transform = `scaleX(${clamp(p / .87)})`;

  let frame = Math.round(p * (frameCount - 1));
  if (machineMotionReduced()) {
    // Discreto por fases (no desaparece el montaje, pero sin desplazamientos largos continuos).
    const markers = [0, 20, 35, 49, 63, 77, 86, 95];
    frame = markers.reduce((best, candidate) => Math.abs(candidate - frame) < Math.abs(best - frame) ? candidate : best, 0);
  }
  if (machineVisible || currentFrameIndex < 0) paintFrame(frame);
  machineStage.style.setProperty('--machine-zoom', (1 + ease(p) * .065).toFixed(4));
  const working = clamp((p - .91) / .06);
  led.style.opacity = String(working);
  led.classList.toggle('is-on', working > .85 && !machineMotionReduced());
  inkLine.style.transform = `scaleX(${working})`;
  machineStage.classList.toggle('is-working', working > .88 && !machineMotionReduced());
}

motionButton.addEventListener('click', () => {
  motionMode = motionMode === 'auto' ? 'full' : motionMode === 'full' ? 'reduced' : 'auto';
  motionButton.textContent = {auto: 'Movimiento: automático', full: 'Movimiento: completo', reduced: 'Movimiento: reducido'}[motionMode];
  motionButton.setAttribute('aria-pressed', String(motionMode === 'full'));
  currentFrameIndex = -1;
  scheduleUpdate();
});
$('#replayAssembly').addEventListener('click', () => {
  const sectionStart = machineSection.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({top: sectionStart, behavior: machineMotionReduced() ? 'instant' : 'smooth'});
});
startFrameLoading();

/* [04B] RITUAL — ESCENA INTERMEDIA QUE SE DIBUJA CON EL SCROLL */
const ritual = $('#ritual');
const ritualPath = $('#ritualPath');
const ritualPathB = $('#ritualPathB');
const ritualChapter = $('#ritualChapter');
const ritualDescription = $('#ritualDescription');
const ritualCounter = $('#ritualCounter');
const ritualTexts = [
  ['LA IDEA', 'Antes de tocar la piel, todo empieza en la imaginación.'],
  ['EL TRAZO', 'La intención se transforma en una línea que lo cambia todo.'],
  ['LA TINTA', 'Cuando el diseño encuentra su lugar, aparece una historia.']
];
let ritualStep = -1;
const pathLength = ritualPath.getTotalLength();
const pathLengthB = ritualPathB.getTotalLength();
ritualPath.style.strokeDasharray = `${pathLength}`;
ritualPathB.style.strokeDasharray = `${pathLengthB}`;
function renderRitual() {
  const rect = ritual.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > innerHeight) return;
  const distance = Math.max(1, rect.height - innerHeight);
  const p = clamp(-rect.top / distance);
  ritual.style.setProperty('--ritual-progress', p.toFixed(4));
  ritualPath.style.strokeDashoffset = String(pathLength * (1 - ease(p)));
  ritualPathB.style.strokeDashoffset = String(pathLengthB * (1 - ease(clamp((p - .33) / .67))));
  const chapter = Math.min(2, Math.floor(p * 3));
  if (chapter !== ritualStep) {
    ritualStep = chapter;
    ritualChapter.textContent = ritualTexts[chapter][0];
    ritualDescription.textContent = ritualTexts[chapter][1];
    ritualCounter.textContent = String(chapter + 1).padStart(2, '0');
  }
}

/* [04C] NAVEGACIÓN POR CAPÍTULOS Y LUZ SUAVE DE PORTADA */
const railLinks = $$('[data-rail]');
const railSections = railLinks.map(a => document.getElementById(a.dataset.rail)).filter(Boolean);
const railObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    railLinks.forEach(a => a.classList.toggle('is-active', a.dataset.rail === entry.target.id));
  });
}, {rootMargin:'-38% 0px -38% 0px'});
railSections.forEach(section => railObserver.observe(section));
const heroFrame = $('#hero');
heroFrame.addEventListener('pointermove', e => {
  if (prefersReduce.matches || e.pointerType === 'touch') return;
  const r = heroFrame.getBoundingClientRect();
  heroFrame.style.setProperty('--pointer-x', `${((e.clientX-r.left)/r.width * 100).toFixed(1)}%`);
  heroFrame.style.setProperty('--pointer-y', `${((e.clientY-r.top)/r.height * 100).toFixed(1)}%`);
}, {passive:true});

/* [05] BARRA DE SCROLL Y ACTUALIZACIÓN SIN TIRONES */
let framePending = false;
const hero = $('#hero');
function updatePage(now) {
  framePending = false;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  $('#progressBar').style.transform = `scaleX(${clamp(window.scrollY / max)})`;
  if (!prefersReduce.matches || motionMode === 'full') {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--hero-shift', (clamp(-rect.top / Math.max(1, rect.height)) * 70).toFixed(1) + 'px');
  }
  renderRitual();
  renderMachine();
}
function scheduleUpdate() { if (!framePending) { framePending = true; requestAnimationFrame(updatePage); } }
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => { closeMenu(); scaleMachine(); renderGallery(); scheduleUpdate(); }, {passive:true});
document.addEventListener('visibilitychange', scheduleUpdate);
scaleMachine();

/* [06] GALERÍA COVERFLOW: FLECHAS, RATÓN, TECLADO Y TACTO */
const cards = $$('.coverflow-card');
const stage = $('#coverflowStage');
const galleryDots = $('#galleryDots');
const galleryCounter = $('#galleryCounter');
let activeIndex = 2;
let pointerStart = null;
let dragShift = 0;
let suppressClick = false;
function wrappedDiff(index) { let d = index - activeIndex; const half = cards.length / 2; if (d > half) d -= cards.length; if (d < -half) d += cards.length; return d; }
function renderGallery(shift = 0) {
  const mobile = innerWidth <= 760;
  const gap = mobile ? 133 : 215;
  cards.forEach((card, index) => {
    const d = wrappedDiff(index); const abs = Math.abs(d);
    card.style.zIndex = String(20 - abs);
    card.style.pointerEvents = abs > 2 ? 'none' : 'auto';
    card.style.opacity = String(abs > 2 ? 0 : 1 - abs * .24);
    card.style.transform = `translate3d(calc(-50% + ${d * gap + shift}px), -50%, ${-abs * (mobile ? 140 : 190)}px) rotateY(${-d * (mobile ? 28 : 34)}deg) scale(${1 - abs * .09})`;
    card.setAttribute('aria-current', String(d === 0));
    card.setAttribute('aria-label', `${card.dataset.title}: ${d === 0 ? 'ampliar imagen' : 'seleccionar imagen'}`);
    card.tabIndex = abs > 2 ? -1 : 0;
  });
  $$('.gallery-dot', galleryDots).forEach((dot,i) => { dot.classList.toggle('is-active',i===activeIndex); dot.setAttribute('aria-current',String(i===activeIndex)); });
  galleryCounter.textContent = `${String(activeIndex+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
}
function goTo(index) { activeIndex = (index + cards.length) % cards.length; renderGallery(); }
cards.forEach((card,i) => {
  const image = $('img',card);
  image.addEventListener('error', () => { if (image.dataset.failed) return; image.dataset.failed='yes'; image.src=image.dataset.fallback || ''; });
  const dot = document.createElement('button'); dot.type='button'; dot.className='gallery-dot'; dot.setAttribute('aria-label','Ver pieza '+(i+1)); dot.addEventListener('click',()=>goTo(i)); galleryDots.append(dot);
  card.addEventListener('click', () => {
    if (suppressClick) return;
    if (i !== activeIndex) goTo(i); else showDialog(card);
  });
});
$('#galleryPrev').addEventListener('click', () => goTo(activeIndex - 1));
$('#galleryNext').addEventListener('click', () => goTo(activeIndex + 1));
stage.addEventListener('keydown', e=> { if (e.key==='ArrowLeft'){e.preventDefault();goTo(activeIndex-1);} if(e.key==='ArrowRight'){e.preventDefault();goTo(activeIndex+1);} });
stage.addEventListener('pointerdown', e => { if (e.button !== 0) return; pointerStart=e.clientX; dragShift=0; stage.classList.add('is-dragging'); });
stage.addEventListener('pointermove',e=> { if (pointerStart === null)return; dragShift=e.clientX-pointerStart; renderGallery(clamp(dragShift,-120,120)); });
function endDrag() { if(pointerStart===null)return; if(Math.abs(dragShift)>55) { suppressClick=true;goTo(activeIndex+(dragShift<0?1:-1));setTimeout(()=>suppressClick=false,0); }else renderGallery();pointerStart=null;dragShift=0;stage.classList.remove('is-dragging'); }
stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
renderGallery();

/* [07] LIGHTBOX: fotografía en perspectiva 3D interactiva (no es un modelo 3D) */
const dialog = $('#galleryDialog'); const dialogFigure = $('#dialogFigure'); const dialogStage=$('#dialogStage');
let dialogDrag = false;
function showDialog(card) {
  const image=$('img',card); $('#dialogImage').src=image.currentSrc||image.src; $('#dialogImage').alt=image.alt; $('#dialogTitle').textContent=card.dataset.title;
  dialogFigure.style.transform='rotateX(0deg) rotateY(0deg)';
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open','');
  document.body.classList.add('modal-open');$('#dialogClose').focus();
}
function closeDialog(){if(dialog.open){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}document.body.classList.remove('modal-open');}
$('#dialogClose').addEventListener('click',closeDialog);
dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog();});
function tiltDialog(x,y){if(prefersReduce.matches && motionMode!=='full')return;const r=dialogStage.getBoundingClientRect();const px=clamp((x-r.left)/r.width);const py=clamp((y-r.top)/r.height);dialogFigure.style.transform=`rotateX(${((.5-py)*OPTIONS.galleryTilt*2).toFixed(2)}deg) rotateY(${((px-.5)*OPTIONS.galleryTilt*2).toFixed(2)}deg)`;}
dialogStage.addEventListener('pointerdown',e=>{dialogDrag=true;tiltDialog(e.clientX,e.clientY);});
dialogStage.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||dialogDrag)tiltDialog(e.clientX,e.clientY);});
dialogStage.addEventListener('pointerup',()=>dialogDrag=false);
dialogStage.addEventListener('pointerleave',()=>{if(!dialogDrag)dialogFigure.style.transform='rotateX(0deg) rotateY(0deg)';});

/* [08] FORMULARIO: validación, imágenes, previews y limpieza segura */
const form=$('#ideaForm');const nameField=$('#name');const emailField=$('#email');const messageField=$('#message');const photosField=$('#references');
const previewGrid=$('#previewGrid');const dropZone=$('#uploadZone');const formStatus=$('#formStatus');
let photos=[];
function setError(input,id,msg){const target=$('#'+id);target.textContent=msg; input.setAttribute('aria-invalid',String(Boolean(msg)));}
function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function validate(){let okay=true;
  const name=nameField.value.trim();const email=emailField.value.trim();const idea=messageField.value.trim();
  const n=name.length<2?'Error: escribe al menos 2 caracteres.':''; const e=!validEmail(email)?'Error: introduce un correo válido.':'';const m=idea.length<12?'Error: explica tu idea con al menos 12 caracteres.':'';
  setError(nameField,'nameError',n);setError(emailField,'emailError',e);setError(messageField,'messageError',m);
  if(n||e||m)okay=false;return okay;
}
function updateCharCounter(){ $('#charCounter').textContent=String(messageField.value.length).padStart(3,'0')+' / 600'; }
messageField.addEventListener('input',updateCharCounter);updateCharCounter();
[nameField,emailField,messageField].forEach(field=>field.addEventListener('input',()=>{if(field.getAttribute('aria-invalid')==='true')validate();formStatus.textContent='';formStatus.classList.remove('is-success');}));
function clearPhotoURLs(){photos.forEach(p=>URL.revokeObjectURL(p.url));photos=[];}
function renderPhotos(){previewGrid.replaceChildren(); photos.forEach((entry,index)=>{
  const frame=document.createElement('div');frame.className='upload-preview';const img=document.createElement('img');img.src=entry.url;img.alt='Referencia '+(index+1)+': '+entry.file.name;
  const btn=document.createElement('button');btn.type='button';btn.textContent='×';btn.setAttribute('aria-label','Eliminar '+entry.file.name);btn.addEventListener('click',()=>{URL.revokeObjectURL(entry.url);photos.splice(index,1);renderPhotos();});frame.append(img,btn);previewGrid.append(frame);
});}
function addPhotos(files){const allowed=new Set(['image/jpeg','image/png','image/webp']);let error='';
 for(const file of Array.from(files||[])){
   if(!allowed.has(file.type)){error='Error: solo se admiten JPG, PNG y WEBP.';continue;}
   if(file.size>OPTIONS.maxPhotoMB*1024*1024){error=`Error: máximo ${OPTIONS.maxPhotoMB} MB por archivo.`;continue;}
   if(photos.length>=OPTIONS.maxPhotos){error=`Error: máximo ${OPTIONS.maxPhotos} imágenes.`;break;}
   if(photos.some(p=>p.file.name===file.name&&p.file.size===file.size)){error='Esta imagen ya está añadida.';continue;}
   photos.push({file,url:URL.createObjectURL(file)});
 }$('#referencesError').textContent=error;photosField.value='';renderPhotos();}
photosField.addEventListener('change',e=>addPhotos(e.target.files));
['dragenter','dragover'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.add('is-over');}));
['dragleave','drop'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.remove('is-over');}));
dropZone.addEventListener('drop',e=>addPhotos(e.dataTransfer.files));
$('#clearForm').addEventListener('click',()=>{form.reset();clearPhotoURLs();renderPhotos();[nameField,emailField,messageField].forEach(f=>f.setAttribute('aria-invalid','false'));$$('.field-error').forEach(node=>node.textContent='');formStatus.textContent='';formStatus.classList.remove('is-success');updateCharCounter();});
form.addEventListener('submit',e=>{
 e.preventDefault();formStatus.classList.remove('is-success');formStatus.textContent='';
 if(!validate()){form.querySelector('[aria-invalid=true]')?.focus();return;}
 // TODO-CARLOS-06: modifica este mensaje final en tus propias palabras.
 formStatus.classList.add('is-success');formStatus.textContent=`Idea preparada: ${photos.length} ${photos.length === 1 ? "imagen" : "imágenes"} de referencia${typeof strokes !== "undefined" && strokes.length && activeSketchMode === "draw" ? " y tu boceto original" : ""}. Esta demo no envía datos a ningún servidor.`;
});
window.addEventListener('pagehide',clearPhotoURLs);

/* [08B] RESUMEN VISUAL DE LA IDEA — NO GUARDA DATOS, SOLO LOS MUESTRA */
const ticketTitle = $('#ideaTicketTitle');
const ticketStyle = $('#ideaTicketStyle');
const ticketCount = $('#ideaTicketCount');
const styleField = $('#tattooStyle');
function updateIdeaTicket() {
  const idea = messageField.value.trim();
  ticketTitle.textContent = idea ? (idea.length > 52 ? `${idea.slice(0,49)}…` : idea) : 'TU PRÓXIMA HISTORIA';
  ticketStyle.textContent = styleField.value || 'Aún sin definir · Eso también está bien.';
  ticketCount.textContent = `${String(messageField.value.length).padStart(2,'0')} caracteres · ${photos.length} referencia${photos.length===1?'':'s'}`;
}
messageField.addEventListener('input', updateIdeaTicket);
styleField.addEventListener('change', updateIdeaTicket);
photosField.addEventListener('change', () => setTimeout(updateIdeaTicket,0));
const originalRenderPhotos = renderPhotos;
// Cada vez que renderizamos archivos, refrescamos la tarjeta de resumen.
renderPhotos = function (...args) { originalRenderPhotos(...args); updateIdeaTicket(); refreshTicketPhotos(); };
$('#clearForm').addEventListener('click', () => setTimeout(updateIdeaTicket, 0));
updateIdeaTicket();

/* [09] Arranque */
scheduleUpdate();


/* ===================================================================== */
/* [V10-ATELIER] Boceto / tinta. Editable sin tocar el resto del scroll. */
/* ===================================================================== */
const atelierRange = $('#inkReveal');
const atelierInkLayer = $('#atelierInkLayer');
const atelierDivider = $('#atelierDivider');
const atelierPercent = $('#inkPercent');
const atelierLabel = $('#atelierStageLabel');
const atelierSketch = $('#atelierSketch');
const atelierInk = $('#atelierInk');
const atelierChoices = $$('.atelier-choice');
function updateAtelier() {
  const percent = Math.max(0, Math.min(100, Number(atelierRange.value)));
  atelierInkLayer.style.clipPath = `inset(0 ${100-percent}% 0 0)`;
  atelierDivider.style.left = `${percent}%`;
  atelierPercent.textContent = `${percent}%`;
  atelierLabel.textContent = percent < 30 ? '01 / BOCETO' : percent < 80 ? '02 / EN TRANSFORMACIÓN' : '03 / TINTA FINAL';
}
function selectAtelierMotif(motif) {
  const allowed = new Set(['botanical','orbit','serpent']);
  if (!allowed.has(motif)) return;
  atelierSketch.src = `assets/img/atelier/${motif}-sketch.svg`;
  atelierInk.src = `assets/img/atelier/${motif}-ink.svg`;
  atelierChoices.forEach(button => {
    const selected = button.dataset.art === motif;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
atelierRange.addEventListener('input', updateAtelier);
atelierChoices.forEach(button => button.addEventListener('click', () => selectAtelierMotif(button.dataset.art)));
updateAtelier();

/* [V10-INTERLUDE] Una sola lectura de scroll y transformaciones ligeras. */
const interlude = $('.interlude');
const interludeShutter = $('.interlude-shutter');
const ambientMeter = $('#ambientMeterFill');
let cinematicPending = false;
function paintCinematicScroll() {
  cinematicPending = false;
  if (!interlude) return;
  const rect = interlude.getBoundingClientRect();
  if (rect.top < innerHeight && rect.bottom > 0 && !(prefersReduce.matches && motionMode !== 'full')) {
    const progress = clamp((innerHeight - rect.top) / (rect.height + innerHeight));
    interludeShutter.style.transform = `scale(${(1.17 - progress*.15).toFixed(3)}) translate3d(0,${((progress-.5)*22).toFixed(1)}px,0)`;
  }
  const maximum = Math.max(1, document.documentElement.scrollHeight-innerHeight);
  ambientMeter.style.transform = `scaleX(${clamp(scrollY/maximum).toFixed(5)})`;
}
function requestCinematic() {
  if (cinematicPending) return;
  cinematicPending = true;
  requestAnimationFrame(paintCinematicScroll);
}
window.addEventListener('scroll',requestCinematic,{passive:true});
window.addEventListener('resize',requestCinematic,{passive:true});
requestCinematic();

/* ================================================================ */
/* [V11-CARLOS-01] LIENZO LIBRE — trazos propios, sin plantillas      */
/* El usuario dibuja con el ratón, el dedo o un lápiz táctil.        */
/* Se guarda cada trazo para poder deshacerlo sin borrar los otros.  */
/* ================================================================ */
const drawModeButton = $('#drawMode');
const presetModeButton = $('#presetMode');
const sketchTools = $('#sketchTools');
const presetTools = $('#presetTools');
const sketchPadShell = $('#sketchPadShell');
const sketchPad = $('#sketchPad');
const sketchContext = sketchPad.getContext('2d', { alpha: true });
const sketchInstructions = $('#sketchInstructions');
const sketchHint = $('#sketchHint');
const brushTool = $('#brushTool');
const eraserTool = $('#eraserTool');
const brushSizeInput = $('#brushSize');
const brushSizeText = $('#brushSizeText');
const undoSketchButton = $('#undoSketch');
const redoSketchButton = $('#redoSketch');
const clearSketchButton = $('#clearSketch');
const downloadSketchButton = $('#downloadSketch');
const ticketSketchPreview = $('#ticketSketchPreview');
const ticketPresetPreview = $('#ticketPresetPreview');
const ticketEmpty = $('#ticketEmpty');
const ticketDesignStatus = $('#ticketDesignStatus');
const ticketPhotoGrid = $('#ticketPhotoGrid');
let activeSketchMode = 'draw';
let activeDrawingTool = 'brush';
let drawingActive = false;
let currentStroke = null;
let strokes = [];
let undoneStrokes = [];
let sketchRenderPending = false;
let drawingWidth = 900;
let drawingHeight = 600;
let drawingPixelRatio = 1;
let selectedPreset = 'botanical';

// [V11-CARLOS-02] Cada trazo se guarda en coordenadas relativas al lienzo.
// Así un dibujo mantiene la proporción al girar el móvil o redimensionar.
function drawStoredStroke(ctx, stroke, width, height) {
  if (!stroke.points.length) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#000' : stroke.color;
  ctx.fillStyle = stroke.tool === 'eraser' ? '#000' : stroke.color;
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.lineWidth = Math.max(1, stroke.size * Math.min(width / 700, height / 500));
  const first = stroke.points[0];
  ctx.beginPath();
  ctx.moveTo(first.x * width, first.y * height);
  if (stroke.points.length === 1) {
    ctx.arc(first.x * width, first.y * height, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(point.x * width, point.y * height);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// [V11-CARLOS-03] Repinta siempre desde el historial, incluso al redimensionar.
function renderSketch() {
  if (!sketchContext) return;
  sketchContext.setTransform(drawingPixelRatio, 0, 0, drawingPixelRatio, 0, 0);
  sketchContext.clearRect(0, 0, drawingWidth, drawingHeight);
  for (const stroke of strokes) drawStoredStroke(sketchContext, stroke, drawingWidth, drawingHeight);
  if (currentStroke) drawStoredStroke(sketchContext, currentStroke, drawingWidth, drawingHeight);
  const hasDrawing = strokes.length > 0 || Boolean(currentStroke);
  sketchInstructions.hidden = hasDrawing;
  undoSketchButton.disabled = !strokes.length;
  redoSketchButton.disabled = !undoneStrokes.length;
  clearSketchButton.disabled = !strokes.length;
  drawTicketDesign();
}

function requestSketchRender() {
  if (sketchRenderPending) return;
  sketchRenderPending = true;
  requestAnimationFrame(() => { sketchRenderPending = false; renderSketch(); });
}

function resizeSketchCanvas() {
  const rect = sketchPad.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  drawingWidth = rect.width;
  drawingHeight = rect.height;
  drawingPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.max(1, Math.round(drawingWidth * drawingPixelRatio));
  const targetHeight = Math.max(1, Math.round(drawingHeight * drawingPixelRatio));
  if (sketchPad.width !== targetWidth || sketchPad.height !== targetHeight) {
    sketchPad.width = targetWidth;
    sketchPad.height = targetHeight;
  }
  requestSketchRender();
}

function normalizedPointer(event) {
  const rect = sketchPad.getBoundingClientRect();
  return { x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) };
}

sketchPad.addEventListener('pointerdown', (event) => {
  if (activeSketchMode !== 'draw' || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault();
  drawingActive = true;
  sketchPad.setPointerCapture(event.pointerId);
  currentStroke = { tool: activeDrawingTool, color:'#211c18', size:Number(brushSizeInput.value), points:[normalizedPointer(event)] };
  requestSketchRender();
});
sketchPad.addEventListener('pointermove', (event) => {
  if (!drawingActive || !currentStroke) return;
  event.preventDefault();
  const point = normalizedPointer(event);
  const previous = currentStroke.points[currentStroke.points.length - 1];
  if (Math.hypot((point.x - previous.x) * drawingWidth, (point.y - previous.y) * drawingHeight) >= .7) {
    currentStroke.points.push(point);
    requestSketchRender();
  }
});
function finishCurrentStroke() {
  if (!drawingActive || !currentStroke) return;
  drawingActive = false;
  strokes.push(currentStroke);
  currentStroke = null;
  undoneStrokes = [];
  sketchHint.textContent = `Boceto guardado en la sesión: ${strokes.length} trazo${strokes.length === 1 ? '' : 's'}. Lo verás en el ticket.`;
  requestSketchRender();
}
sketchPad.addEventListener('pointerup', finishCurrentStroke);
sketchPad.addEventListener('pointercancel', finishCurrentStroke);
sketchPad.addEventListener('lostpointercapture', finishCurrentStroke);

function setDrawingTool(name) {
  activeDrawingTool = name;
  brushTool.classList.toggle('is-active', name === 'brush');
  eraserTool.classList.toggle('is-active', name === 'eraser');
  brushTool.setAttribute('aria-pressed', String(name === 'brush'));
  eraserTool.setAttribute('aria-pressed', String(name === 'eraser'));
  sketchPad.style.cursor = name === 'eraser' ? 'cell' : 'crosshair';
}
brushTool.addEventListener('click', () => setDrawingTool('brush'));
eraserTool.addEventListener('click', () => setDrawingTool('eraser'));
brushSizeInput.addEventListener('input', () => { brushSizeText.textContent = brushSizeInput.value; });
undoSketchButton.addEventListener('click', () => {
  if (!strokes.length) return;
  undoneStrokes.push(strokes.pop()); renderSketch();
});
redoSketchButton.addEventListener('click', () => {
  if (!undoneStrokes.length) return;
  strokes.push(undoneStrokes.pop()); renderSketch();
});
clearSketchButton.addEventListener('click', () => {
  strokes = []; undoneStrokes = []; currentStroke = null;
  sketchHint.textContent = 'Lienzo limpio: puedes empezar otra idea.';
  renderSketch();
});

// [V11-CARLOS-04] Descarga del boceto sin enviar nada a Internet.
downloadSketchButton.addEventListener('click', () => {
  if (!strokes.length) { sketchHint.textContent = 'Primero dibuja tu idea para poder descargarla.'; return; }
  const output = document.createElement('canvas');
  output.width = 1200; output.height = 960;
  const ctx = output.getContext('2d');
  const inkLayer = document.createElement('canvas');
  inkLayer.width = output.width; inkLayer.height = output.height;
  const inkCtx = inkLayer.getContext('2d');
  for (const stroke of strokes) drawStoredStroke(inkCtx, stroke, output.width, output.height);
  ctx.fillStyle = '#f7f0e6'; ctx.fillRect(0, 0, output.width, output.height);
  ctx.drawImage(inkLayer, 0, 0);
  const link = document.createElement('a');
  link.href = output.toDataURL('image/png');
  link.download = 'carlos-tatto-mi-boceto.png';
  link.click();
  sketchHint.textContent = 'Boceto descargado en PNG.';
});

// [V11-CARLOS-05] Alterna entre lienzo libre y diseños de inspiración.
function setSketchMode(mode) {
  activeSketchMode = mode;
  const free = mode === 'draw';
  drawModeButton.classList.toggle('is-active', free);
  presetModeButton.classList.toggle('is-active', !free);
  drawModeButton.setAttribute('aria-pressed', String(free));
  presetModeButton.setAttribute('aria-pressed', String(!free));
  sketchTools.hidden = !free;
  presetTools.hidden = free;
  sketchPadShell.hidden = !free;
  atelierDivider.hidden = free;
  $('#atelierCanvas').classList.toggle('is-drawing', free);
  $('#atelierCanvas').setAttribute('aria-label', free ? 'Lienzo libre para dibujar un tatuaje propio' : 'Comparador: boceto de estudio frente a tinta final');
  atelierLabel.textContent = free ? 'TU BOCETO / LIENZO LIBRE' : '01 / BOCETO';
  if (free) resizeSketchCanvas();
  drawTicketDesign();
}
drawModeButton.addEventListener('click', () => setSketchMode('draw'));
presetModeButton.addEventListener('click', () => setSketchMode('preset'));
atelierChoices.forEach(button => button.addEventListener('click', () => {
  selectedPreset = button.dataset.art;
  drawTicketDesign();
}));

/* ================================================================ */
/* [V11-CARLOS-06] TICKET VISUAL — boceto + fotos + formulario        */
/* Este apartado NO envía archivos: refleja la idea en vivo.        */
/* ================================================================ */
const ticketContext = ticketSketchPreview.getContext('2d');
function drawTicketDesign() {
  if (!ticketContext) return;
  const isDrawing = activeSketchMode === 'draw';
  const hasDrawing = strokes.length > 0 || Boolean(currentStroke);
  ticketSketchPreview.hidden = !isDrawing || !hasDrawing;
  ticketPresetPreview.hidden = isDrawing;
  ticketEmpty.hidden = !isDrawing || hasDrawing;
  ticketDesignStatus.textContent = isDrawing
    ? (hasDrawing ? `Boceto original · ${strokes.length + (currentStroke ? 1 : 0)} ${strokes.length + (currentStroke ? 1 : 0) === 1 ? 'trazo' : 'trazos'}` : 'Tu boceto personal aparecerá aquí')
    : `Diseño elegido: ${selectedPreset}`;
  if (!isDrawing || !hasDrawing) return;
  const { width, height } = ticketSketchPreview;
  ticketContext.setTransform(1,0,0,1,0,0);
  ticketContext.clearRect(0,0,width,height);
  const srcWidth = sketchPad.width;
  const srcHeight = sketchPad.height;
  const zoom = Math.min((width - 18) / srcWidth, (height - 18) / srcHeight);
  const w = srcWidth * zoom, h = srcHeight * zoom;
  ticketContext.drawImage(sketchPad, (width - w)/2, (height - h)/2, w, h);
}

function refreshTicketPhotos() {
  ticketPhotoGrid.replaceChildren();
  for (const entry of photos) {
    const img = document.createElement('img');
    img.src = entry.url;
    img.alt = `Referencia añadida: ${entry.file.name}`;
    img.title = entry.file.name;
    img.loading = 'lazy';
    ticketPhotoGrid.append(img);
  }
}

// La selección de un motivo también alimenta el ticket.
atelierChoices.forEach(button => button.addEventListener('click', () => {
  if (activeSketchMode === 'preset') {
    selectedPreset = button.dataset.art;
    ticketPresetPreview.src = `assets/img/atelier/${selectedPreset}-ink.svg`;
    drawTicketDesign();
  }
}));

// Si el usuario borra el formulario, las referencias desaparecen de ambas vistas.
$('#clearForm').addEventListener('click', () => {
  refreshTicketPhotos();
  sketchHint.textContent = 'El formulario se ha limpiado. Tu boceto sigue disponible en el atelier.';
});

// Atajos solo cuando estamos usando el lienzo y sin interferir en el formulario.
document.addEventListener('keydown', event => {
  if (activeSketchMode !== 'draw') return;
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
  if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
  event.preventDefault();
  if (event.shiftKey) redoSketchButton.click(); else undoSketchButton.click();
});

if ('ResizeObserver' in window) {
  new ResizeObserver(() => { if (activeSketchMode === 'draw') resizeSketchCanvas(); }).observe(sketchPadShell);
} else {
  window.addEventListener('resize', resizeSketchCanvas);
}
setSketchMode('draw');
refreshTicketPhotos();
requestSketchRender();
