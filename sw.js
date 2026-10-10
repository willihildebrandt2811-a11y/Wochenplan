const V = 'willi-rezepte-v74';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => fetch(new Request(u, {cache: 'reload'})).then(r => { if (!r.ok) throw 0; return c.put(u, r); })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'willi-share').map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method === 'POST' && u.pathname.endsWith('/share-target')){
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData(), c = await caches.open('willi-share');
        for (const k of await c.keys()) await c.delete(k);
        let i = 0;
        for (const f of fd.getAll('shot')) if (f && f.size) await c.put('/share-img-' + (i++), new Response(f, {headers: {'content-type': f.type || 'image/jpeg'}}));
        const t = [fd.get('title'), fd.get('text'), fd.get('url')].filter(Boolean).join(' ');
        if (t) await c.put('/share-text', new Response(t));
      } catch(err){}
      return Response.redirect('./?shared=1', 303);
    })());
    return;
  }
  if (/allorigins|corsproxy|codetabs/.test(u.hostname)) return;
  if (e.request.method !== 'GET') return;
  if (/\/start\//i.test(u.pathname)) return;
  if (/\/(daten|rezepte)\.json$/.test(u.pathname)){ e.respondWith(fetch(e.request, {cache: 'no-store'})); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res && (res.ok || res.type === 'opaque')){ const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
