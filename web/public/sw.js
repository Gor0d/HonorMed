// Cache only a public offline document. Authenticated financial data is never cached.
const CACHE='honormed-public-v2';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.add('/offline.html')));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.match('/offline.html')));});
