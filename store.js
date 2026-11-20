// Cifrado y almacenamiento. PBKDF2-SHA256 (600.000 iteraciones) -> AES-256-GCM.
// Cada registro usa un IV aleatorio de 96 bits y su id como dato autenticado. Sin dependencias.
var Store=(()=>{
const enc=new TextEncoder(),dec=new TextDecoder(),ITER=600000
const b64=b=>{let s='';new Uint8Array(b).forEach(c=>s+=String.fromCharCode(c));return btoa(s)}
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0))
const rnd=n=>crypto.getRandomValues(new Uint8Array(n))
let key=null,_db=null
const idb=()=>_db||(_db=new Promise((res,rej)=>{const r=indexedDB.open('memoria',1)
 r.onupgradeneeded=()=>{r.result.createObjectStore('meta',{keyPath:'id'});r.result.createObjectStore('items',{keyPath:'id'})}
 r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))
const tx=async(st,mode,fn)=>{const d=await idb();return new Promise((res,rej)=>{const t=d.transaction(st,mode);const q=fn(t.objectStore(st));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})}
async function derive(pw,salt,iter=ITER){
 if(!(iter>=1e5&&iter<=2e6))throw new Error('Archivo no válido')
 const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveKey'])
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(k,data,aad){const iv=rnd(12);const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad)},k,enc.encode(data));return{iv,ct}}
const open=async(k,iv,ct,aad)=>dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad)},k,ct))
const S={
 hasVault:async()=>!!(await tx('meta','readonly',s=>s.get('v'))),
 async create(pw){const salt=rnd(16);key=await derive(pw,salt);const s=await seal(key,'MEMORIA','v');await tx('meta','readwrite',st=>st.put({id:'v',salt,iter:ITER,...s}))},
 async unlock(pw){const m=await tx('meta','readonly',s=>s.get('v'));const k=await derive(pw,m.salt,m.iter)
  try{await open(k,m.iv,m.ct,'v')}catch(e){await new Promise(r=>setTimeout(r,1200));throw new Error('Contraseña incorrecta')}
  key=k;return S.loadAll()},
 lock(){key=null},
 async loadAll(){const rows=await tx('items','readonly',s=>s.getAll());return Promise.all(rows.map(async r=>JSON.parse(await open(key,r.iv,r.ct,r.id))))},
 async save(o){const s=await seal(key,JSON.stringify(o),o.id);await tx('items','readwrite',st=>st.put({id:o.id,...s}))},
 remove:id=>tx('items','readwrite',s=>s.delete(id)),
 async wipe(){key=null;try{(await idb()).close()}catch(e){};const r=indexedDB.deleteDatabase('memoria');r.onsuccess=r.onerror=r.onblocked=()=>location.reload()},
 async exportBackup(items,pw){const salt=rnd(16);const k=await derive(pw,salt);const s=await seal(k,JSON.stringify(items),'memoria-backup-v1')
  return JSON.stringify({app:'memoria',v:1,iter:ITER,salt:b64(salt),iv:b64(s.iv),ct:b64(s.ct)})},
 async readBackup(txt,pw){let f;try{f=JSON.parse(txt)}catch(e){throw new Error('Archivo no válido')}
  if(!f||f.app!=='memoria'||!f.ct)throw new Error('Archivo no válido')
  const k=await derive(pw,unb64(f.salt),f.iter)
  try{const a=JSON.parse(await open(k,unb64(f.iv),unb64(f.ct),'memoria-backup-v1'));if(!Array.isArray(a))throw 0;return a.filter(x=>x&&x.id&&x.type)}
  catch(e){throw new Error('Contraseña incorrecta o archivo dañado')}}
}
return S})()
