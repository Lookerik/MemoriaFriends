(()=>{
'use strict'
const $=s=>document.querySelector(s)
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const IC={home:'<path d="M3 10.5 12 3l9 7.5V21H3z"/>',users:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5"/>',book:'<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM4 16a4 4 0 0 1 4-4h12"/>',gift:'<rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9M8 8a2.5 2.5 0 1 1 4-2 2.5 2.5 0 1 1 4 2"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',pen:'<path d="M4 20l1-4L17 4l3 3L8 19z"/>',x:'<path d="M5 5l14 14M19 5 5 19"/>',dl:'<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',ul:'<path d="M12 15V3m-5 5 5-5 5 5M4 21h16"/>',ok:'<path d="m5 12 5 5 9-10"/>'}
const ic=(n,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`
const CATS=['Flores','Colores','Música','Comida','Bebidas','Películas','Actividades','Lugares']
const NAV=[['home','Inicio','home'],['people','Personas','users'],['diary','Diario','book'],['gifts','Regalos','gift'],['cal','Calendario','cal'],['set','Ajustes','gear']]
const F={
 person:[{k:'name',l:'Nombre',r:1},{k:'nickname',l:'Apodo'},{k:'birthday',l:'Cumpleaños',t:'date'},{k:'photo',l:'Fotografía',t:'photo'},...CATS.map(c=>({k:'l_'+c,l:c+' (separa con comas)'})),{k:'custom',l:'Preferencias personalizadas (Título: valor, una por línea)',t:'area'},{k:'dreams',l:'Sueños y metas',t:'area'},{k:'notes',l:'Notas',t:'area'}],
 memory:[{k:'personId',l:'Persona',t:'person'},{k:'date',l:'Fecha',t:'date',r:1},{k:'title',l:'Título'},{k:'text',l:'Recuerdo o conversación',t:'area',r:1}],
 gift:[{k:'personId',l:'Para',t:'person',r:1},{k:'idea',l:'Idea de regalo',r:1},{k:'note',l:'Notas o enlace'}],
 event:[{k:'title',l:'Evento',r:1},{k:'date',l:'Fecha',t:'date',r:1},{k:'personId',l:'Persona',t:'person'}]}
const TITLE={person:'persona',memory:'recuerdo',gift:'regalo',event:'evento'}
const uid=()=>crypto.randomUUID()
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10)
const D=d=>new Date(d+'T00:00:00')
const fmt=d=>D(d).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})
const daysTo=(d,yearly=true)=>{const n=new Date();n.setHours(0,0,0,0);const b=D(d);let x=yearly?new Date(n.getFullYear(),b.getMonth(),b.getDate()):b;if(yearly&&x<n)x=new Date(n.getFullYear()+1,b.getMonth(),b.getDate());return Math.round((x-n)/864e5)}
const when=n=>n===0?'Hoy':n===1?'Mañana':'En '+n+' días'
let S={items:[],view:'home',sel:null,q:''},cur=null,stopLock=()=>{}
const of=t=>S.items.filter(i=>i.type===t)
const byId=id=>S.items.find(i=>i.id===id)
const pName=id=>(byId(id)||{}).name

// ---------- vistas ----------
const av=(p,c='a40')=>p&&p.photo?`<img class="av ${c}" src="${esc(p.photo)}" alt="">`:`<div class="av ${c}">${esc(((p||{}).name||'?')[0])}</div>`
const empty=t=>`<p class="empty">${t}</p>`
const memRow=m=>`<div class="card"><div class="row" style="align-items:flex-start"><div class="grow"><div class="mu">${fmt(m.date)}${pName(m.personId)?' · '+esc(pName(m.personId)):''}</div>${m.title?`<div style="font-weight:500;margin-top:4px">${esc(m.title)}</div>`:''}<p class="mu2 pre" style="margin-top:4px">${esc(m.text)}</p></div>
 <button class="ib" data-act="edit" data-id="${m.id}" aria-label="Editar">${ic('pen',16)}</button><button class="ib" data-act="del" data-id="${m.id}" aria-label="Eliminar">${ic('trash',16)}</button></div></div>`
const giftRow=g=>`<div class="card row"><button class="chk ${g.done?'on':''}" data-act="tog" data-id="${g.id}" aria-label="Marcar">${g.done?ic('ok',14):''}</button>
 <div class="grow ${g.done?'done':''}"><div>${esc(g.idea)}</div><div class="mu">${esc(pName(g.personId)||'')}${g.note?' · '+esc(g.note):''}</div></div>
 <button class="ib" data-act="edit" data-id="${g.id}" aria-label="Editar">${ic('pen',16)}</button><button class="ib" data-act="del" data-id="${g.id}" aria-label="Eliminar">${ic('trash',16)}</button></div>`
const bdays=()=>of('person').filter(p=>p.birthday).map(p=>({p,n:daysTo(p.birthday)})).sort((a,b)=>a.n-b.n)
const head=(t,btn)=>`<div class="top"><h1>${t}</h1>${btn}</div>`
const newBtn=(k,l,extra='')=>`<button class="btn" data-act="new" data-kind="${k}" ${extra}>${l}</button>`

function dash(){
 const P=of('person'),M=of('memory').sort((a,b)=>b.date.localeCompare(a.date)),G=of('gift'),B=bdays()
 const bk=localStorage.getItem('memoria_bk'),old=!bk||Date.now()-+bk>30*864e5
 return `<div class="rise"><div class="g3">${[['Personas',P.length],['Recuerdos',M.length],['Regalos pendientes',G.filter(g=>!g.done).length]].map(([l,n])=>`<div class="card" style="margin:0"><div class="num">${n}</div><div class="mu">${l}</div></div>`).join('')}</div>
 ${old&&S.items.length?'<div class="card warn" style="margin-top:16px">Hace tiempo que no creas una copia de seguridad. Ve a Ajustes para guardar una.</div>':''}
 <div class="h">Próximos cumpleaños</div>${B.length?B.slice(0,5).map(({p,n})=>`<div class="card click row" data-act="sel" data-id="${p.id}">${av(p)}<div class="grow">${esc(p.name)}</div><div class="mu2">${when(n)}</div></div>`).join(''):empty('Añade el cumpleaños de alguien para verlo aquí.')}
 <div class="h">Recuerdos recientes</div>${M.slice(0,4).map(memRow).join('')||empty('Pulsa + para guardar tu primera nota.')}</div>`}

function peopleV(){
 if(S.sel&&byId(S.sel))return personV(byId(S.sel))
 const P=of('person').sort((a,b)=>a.name.localeCompare(b.name))
 return `<div class="rise">${head('Personas',newBtn('person','Nueva persona'))}${P.length?`<div class="g2">${P.map(p=>`<div class="card click" data-act="sel" data-id="${p.id}">${av(p,'a64')}<div>${esc(p.name)}</div>${p.nickname?`<div class="mu">${esc(p.nickname)}</div>`:''}</div>`).join('')}</div>`:empty('Empieza añadiendo a alguien importante para ti.')}</div>`}

function personV(p){
 const chips=CATS.filter(c=>p['l_'+c])
 return `<div class="rise"><button class="back" data-act="back">← Personas</button>
 <div class="row"><div class="av a80">${p.photo?`<img class="av a80" src="${esc(p.photo)}" alt="">`:esc(p.name[0])}</div><div class="grow"><h1>${esc(p.name)}</h1>${p.nickname?`<div class="mu2">«${esc(p.nickname)}»</div>`:''}${p.birthday?`<div class="mu">${fmt(p.birthday)} · ${when(daysTo(p.birthday))}</div>`:''}</div>
 <button class="ib" data-act="edit" data-id="${p.id}" aria-label="Editar">${ic('pen',18)}</button><button class="ib" data-act="del" data-id="${p.id}" aria-label="Eliminar">${ic('trash',18)}</button></div>
 <div class="h">Gustos</div>${chips.length?chips.map(c=>`<div class="card"><div class="mu">${c}</div><div class="chips">${p['l_'+c].split(',').map(x=>x.trim()).filter(Boolean).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div>`).join(''):empty('Aún no hay gustos. Pulsa el lápiz para añadirlos.')}
 ${p.custom?`<div class="card pre mu2">${esc(p.custom)}</div>`:''}
 ${p.dreams?`<div class="h">Sueños y metas</div><div class="card pre mu2">${esc(p.dreams)}</div>`:''}
 ${p.notes?`<div class="h">Notas</div><div class="card pre mu2">${esc(p.notes)}</div>`:''}
 <div class="h">Ideas de regalo</div>${of('gift').filter(g=>g.personId===p.id).map(giftRow).join('')}<button class="btn2" data-act="new" data-kind="gift" data-pid="${p.id}">Añadir idea</button>
 <div class="h">Recuerdos</div>${of('memory').filter(m=>m.personId===p.id).sort((a,b)=>b.date.localeCompare(a.date)).map(memRow).join('')}<button class="btn2" data-act="new" data-kind="memory" data-pid="${p.id}">Añadir recuerdo</button></div>`}

const diaryV=()=>`<div class="rise">${head('Diario',newBtn('memory','Nuevo recuerdo'))}${of('memory').sort((a,b)=>b.date.localeCompare(a.date)).map(memRow).join('')||empty('Tu diario está vacío.')}</div>`
const giftsV=()=>`<div class="rise">${head('Regalos',newBtn('gift','Nueva idea'))}${of('gift').sort((a,b)=>!!a.done-!!b.done).map(giftRow).join('')||empty('Anota ideas de regalo cuando se te ocurran.')}</div>`
function calV(){
 const L=[...bdays().map(({p,n})=>({n,t:'Cumpleaños de '+esc(p.name),ev:null})),...of('event').map(e=>({n:daysTo(e.date,false),t:esc(e.title)+(pName(e.personId)?` <span class="mu">· ${esc(pName(e.personId))}</span>`:''),ev:e})).filter(x=>x.n>=0)].sort((a,b)=>a.n-b.n)
 return `<div class="rise">${head('Calendario',newBtn('event','Nuevo evento'))}${L.map(x=>{const d=new Date(Date.now()+x.n*864e5);return `<div class="card row ${x.ev?'click':''}" ${x.ev?`data-act="edit" data-id="${x.ev.id}"`:''}><div class="date"><b>${d.getDate()}</b><span class="mu">${d.toLocaleDateString('es-ES',{month:'short'})}</span></div><div class="grow">${x.t}</div><div class="mu2">${when(x.n)}</div></div>`}).join('')||empty('No hay fechas próximas.')}</div>`}
const setV=()=>`<div class="rise"><h1 style="margin-bottom:16px">Ajustes</h1>
 <div class="card warn">Tus datos se guardan solo en este navegador y este dispositivo. Si borras los datos del sitio, usas navegación privada o cambias de dispositivo, se pierden. No hay sincronización: usa copias cifradas para llevar tus datos de un dispositivo a otro.</div>
 <div class="card"><div style="font-weight:500;margin-bottom:8px">Copias de seguridad cifradas</div><input id="bpw" type="password" placeholder="Contraseña de la copia (mínimo 10 caracteres)" autocomplete="new-password">
 <div class="row wrap" style="margin-top:12px"><button class="btn" data-act="exp">${ic('dl',16)}Exportar</button><label class="btn2" style="cursor:pointer">${ic('ul',16)}Importar<input id="imp" type="file" hidden></label></div>
 <p id="msg" class="mu2" style="margin-top:12px"></p><p class="mu" style="margin-top:8px">Al importar, se combinan con tus datos actuales; si un elemento ya existe, se sustituye. Usa la contraseña con la que se creó la copia.</p></div>
 <div class="card row wrap"><button class="btn2" data-act="lock">${ic('lock',16)}Bloquear ahora</button><span class="mu">Se bloquea tras 5 min sin actividad o 1 min en segundo plano.</span></div>
 <div class="card"><button data-act="wipe" style="color:#f87171;font-size:14px">Borrar todos los datos de este dispositivo</button></div></div>`
function search(q){
 const H=S.items.filter(i=>Object.entries(i).filter(([k])=>!['photo','id','type','personId'].includes(k)).map(e=>e[1]).join(' ').toLowerCase().includes(q)||(pName(i.personId)||'').toLowerCase().includes(q))
 return `<div class="rise"><div class="h" style="margin-top:0">${H.length} resultados</div>${H.map(i=>i.type==='person'?`<div class="card click row" data-act="sel" data-id="${i.id}">${av(i)}${esc(i.name)}</div>`:i.type==='memory'?memRow(i):i.type==='gift'?giftRow(i):`<div class="card click" data-act="edit" data-id="${i.id}">${esc(i.title)} · ${fmt(i.date)}</div>`).join('')}</div>`}

function render(){
 const q=S.q.trim().toLowerCase()
 $('#side').innerHTML='<div class="logo">MEMORIA</div>'+NAV.map(([k,l,i])=>`<button class="nv ${S.view===k&&!q?'on':''}" data-act="nav" data-v="${k}">${ic(i,18)}${l}</button>`).join('')
 $('#tabs').innerHTML=NAV.map(([k,l,i])=>`<button class="tb ${S.view===k&&!q?'on':''}" data-act="nav" data-v="${k}" aria-label="${l}">${ic(i,22)}</button>`).join('')
 $('#body').innerHTML=q?search(q):({home:dash,people:peopleV,diary:diaryV,gifts:giftsV,cal:calV,set:setV}[S.view])()}

// ---------- formularios ----------
const shrink=f=>new Promise(res=>{const i=new Image();i.onload=()=>{const k=Math.min(1,360/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.8))};i.src=URL.createObjectURL(f)})
function openForm(kind,init={}){
 cur={kind,init,photo:init.photo}
 const people=of('person').sort((a,b)=>a.name.localeCompare(b.name))
 const fld=f=>{const v=esc(init[f.k]||''),r=f.r?'required':''
  const c=f.t==='area'?`<textarea name="${f.k}" rows="4" ${r}>${v}</textarea>`
  :f.t==='photo'?`<input name="photo" type="file" accept="image/*">`
  :f.t==='person'?`<select name="${f.k}" ${r}><option value="">${f.r?'Elige una persona':'Sin persona'}</option>${people.map(p=>`<option value="${p.id}" ${init[f.k]===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`
  :`<input name="${f.k}" type="${f.t||'text'}" value="${v}" ${r}>`
  return `<label>${f.l}${c}</label>`}
 $('#modal').innerHTML=`<div class="sheet rise"><div class="top"><h1 style="font-size:20px">${init.id?'Editar':'Nuevo'} ${TITLE[kind]}</h1><button class="ib" data-act="close" aria-label="Cerrar">${ic('x')}</button></div><form id="mf">${F[kind].map(fld).join('')}<button class="btn">Guardar</button></form></div>`
 $('#modal').hidden=false}
const closeForm=()=>{$('#modal').hidden=true;$('#modal').innerHTML='';cur=null}
const put=async o=>{await Store.save(o);const i=S.items.findIndex(x=>x.id===o.id);i<0?S.items.push(o):S.items[i]=o}

// ---------- eventos ----------
document.addEventListener('click',async e=>{
 if(e.target.id==='modal')return closeForm()
 const el=e.target.closest('[data-act]');if(!el)return
 const a=el.dataset.act,id=el.dataset.id
 if(a==='nav'){S.view=el.dataset.v;S.sel=null;S.q='';$('#q').value='';render()}
 else if(a==='sel'){S.view='people';S.sel=id;S.q='';$('#q').value='';render()}
 else if(a==='back'){S.sel=null;render()}
 else if(a==='new'){const k=el.dataset.kind,i={};if(k==='memory'||k==='event')i.date=today()
  const pid=el.dataset.pid||(S.view==='people'&&S.sel?S.sel:'');if(pid&&k!=='person'&&k!=='event')i.personId=pid;openForm(k,i)}
 else if(a==='edit')openForm(byId(id).type,byId(id))
 else if(a==='del'){if(!confirm('¿Eliminar definitivamente?'))return;await Store.remove(id);S.items=S.items.filter(i=>i.id!==id);if(S.sel===id)S.sel=null;render()}
 else if(a==='tog'){const g=byId(id);await put({...g,done:!g.done});render()}
 else if(a==='close')closeForm()
 else if(a==='lock')lock()
 else if(a==='wipe'){if(confirm('Se borrarán TODOS los datos de este dispositivo. ¿Continuar?'))Store.wipe()}
 else if(a==='exp'){const pw=$('#bpw').value,m=$('#msg')
  if(pw.length<10)return m.textContent='La contraseña de la copia necesita al menos 10 caracteres.'
  try{const t=await Store.exportBackup(S.items,pw),l=document.createElement('a');l.href=URL.createObjectURL(new Blob([t],{type:'application/octet-stream'}));l.download='memoria-'+today()+'.memoria';document.body.appendChild(l);l.click();l.remove();localStorage.setItem('memoria_bk',''+Date.now());m.textContent='Copia creada. Guárdala fuera de este navegador, en un lugar seguro.'}catch(x){m.textContent=x.message}}})
document.addEventListener('change',async e=>{
 if(e.target.name==='photo'&&e.target.files[0]&&cur)cur.photo=await shrink(e.target.files[0])
 if(e.target.id==='imp'&&e.target.files[0]){const m=$('#msg');try{const a=await Store.readBackup(await e.target.files[0].text(),$('#bpw').value);for(const o of a)await put(o);m.textContent='Se restauraron '+a.length+' elementos.'}catch(x){m.textContent=x.message}e.target.value=''}})
document.addEventListener('submit',async e=>{if(e.target.id!=='mf')return;e.preventDefault()
 const v=Object.fromEntries(new FormData(e.target));delete v.photo
 const o={...cur.init,...v,type:cur.kind,id:cur.init.id||uid()};if(cur.kind==='person')o.photo=cur.photo
 await put(o);closeForm();render()})
$('#q').addEventListener('input',e=>{S.q=e.target.value;render()})

// ---------- bloqueo y acceso ----------
function lock(){stopLock();Store.lock();S.items=[];S.q='';S.sel=null;$('#q').value='';closeForm();$('#app').hidden=true;gate('lock')}
function startLock(){let t,h=0;const r=()=>{clearTimeout(t);t=setTimeout(lock,3e5)},vis=()=>{if(document.hidden)h=Date.now();else if(h&&Date.now()-h>6e4)lock()},ev=['pointerdown','keydown','scroll']
 ev.forEach(x=>addEventListener(x,r,{passive:true}));document.addEventListener('visibilitychange',vis);r()
 stopLock=()=>{clearTimeout(t);ev.forEach(x=>removeEventListener(x,r));document.removeEventListener('visibilitychange',vis)}}
function gate(mode){
 const g=$('#gate'),n=mode==='new';g.hidden=false
 g.innerHTML=`<form class="gate rise" id="gf"><div class="t">MEMORIA</div><div class="mu" style="text-align:center;margin-top:-8px">People &amp; Moments</div>
 <input id="p1" type="password" autocomplete="${n?'new-password':'current-password'}" placeholder="${n?'Crea tu contraseña maestra':'Contraseña maestra'}">
 ${n?`<input id="p2" type="password" autocomplete="new-password" placeholder="Repite la contraseña"><p class="mu2" style="color:#fcd34d">Si olvidas esta contraseña, nadie podrá recuperar tus datos: no existe ningún reinicio. Tus datos viven solo en este navegador; si lo borras, se pierden. Crea copias de seguridad cifradas en Ajustes.</p>`:''}
 <p class="err" id="err"></p><button class="btn" id="go" style="justify-content:center">${n?'Crear MEMORIA':'Desbloquear'}</button></form>`
 $('#p1').focus()
 $('#gf').onsubmit=async e=>{e.preventDefault();const pw=$('#p1').value,er=$('#err');er.textContent=''
  if(n){if(pw.length<10)return er.textContent='Usa al menos 10 caracteres.';if(pw!==$('#p2').value)return er.textContent='Las contraseñas no coinciden.'}
  $('#go').disabled=true;$('#go').textContent='Procesando…'
  try{if(n){await Store.create(pw);S.items=[]}else S.items=await Store.unlock(pw)
   g.hidden=true;g.innerHTML='';S.view='home';$('#app').hidden=false;render();startLock()}
  catch(x){er.textContent=x.message;$('#go').disabled=false;$('#go').textContent=n?'Crear MEMORIA':'Desbloquear'}}}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()
Store.hasVault().then(h=>gate(h?'lock':'new')).catch(()=>{$('#gate').hidden=false;$('#gate').innerHTML='<p class="err">Este navegador no permite guardar datos locales (¿navegación privada?). Abre MEMORIA en una ventana normal.</p>'})
})()
