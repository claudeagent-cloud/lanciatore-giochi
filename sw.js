// Service worker del lanciatore: tiene in cache SOLO i file del lanciatore stesso.
// I giochi stanno in IndexedDB e non passano mai da qui; qualunque altra richiesta va in rete.
const VERSIONE = 'lanciatore-v2';
const FILE = ['./', './index.html', './manifest.json', './icona-180.png', './icona-512.png'];
const MIEI = new Set(FILE.map(f => new URL(f, self.registration.scope).href));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url); url.search = '';
  if (!MIEI.has(url.href)) return;               // non è un file del lanciatore: rete normale
  e.respondWith(
    fetch(e.request).then(res => {               // prima la rete, così gli aggiornamenti arrivano
      caches.open(VERSIONE).then(c => c.put(e.request, res.clone())).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
