// Bump CACHE (e.g. botany-v1 -> botany-v2) whenever you change any file, so devices fetch the new copy.
const CACHE = 'botany-v7';
const CORE  = ['.', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
const FORMS = ['dafor.html', 'nvc.html', 'monad.html', 'monadmap.html'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    // cache each form individually so a missing one doesn't abort the whole install
    await Promise.all(FORMS.map(f => c.add(f).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// cache-first, then network (and refresh cache when online)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) {
      fetch(e.request).then(r => { if (r && r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); }).catch(() => {});
      return cached;
    }
    try {
      const r = await fetch(e.request);
      if (r && r.ok) { const c = await caches.open(CACHE); c.put(e.request, r.clone()); }
      return r;
    } catch (err) {
      return caches.match('index.html');
    }
  })());
});
