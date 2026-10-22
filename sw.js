const VERSION = 'r6.3.13-test-20261022';
const BASE = new URL('./', self.location.href);
const PREFIX = 'vios-care-shell-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE = PREFIX + VERSION;
const FILES = ['index.html', 'cloud.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'vioscare-chat-banner.jpg'];
const HOME = new URL('index.html', BASE).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILES.map(path => new Request(new URL(path, BASE).href, {cache: 'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin) return;
  const isHome = request.mode === 'navigate' && (url.pathname === BASE.pathname || url.pathname === new URL(HOME).pathname);
  const asset = FILES.find(path => new URL(path, BASE).pathname === url.pathname);
  if (!isHome && !asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = isHome ? HOME : new URL(asset, BASE).href;
    try {
      const response = await fetch(new Request(request, {cache: 'no-store'}));
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(key);
      if (cached) return cached;
      throw error;
    }
  })());
});
