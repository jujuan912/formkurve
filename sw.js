// Formkurve Service Worker – App offline nutzbar, Übungsbilder werden gespeichert
const APP='formkurve-app-202611041837', IMG='formkurve-bilder';
const CORE=['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png','lib/qrcode.js','lib/zxing.min.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(APP).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('formkurve-app-')&&k!==APP).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET') return;
  // Übungsbilder: einmal geladen → offline verfügbar
  if(u.hostname==='raw.githubusercontent.com'&&u.pathname.includes('/free-exercise-db/')){
    e.respondWith(caches.open(IMG).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{ if(r.ok) c.put(e.request,r.clone()); return r; }))));
    return;
  }
  if(u.origin!==location.origin) return; // GitHub-API, Open Food Facts usw. immer live
  // App selbst: erst Netz (damit Updates ankommen), offline aus dem Speicher
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(APP).then(c=>c.put(e.request,cp)); } return r; }).catch(()=>caches.match(e.request).then(h=>h||caches.match('index.html'))));
});
