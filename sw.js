// /sw.js
const CACHE_VERSION = 'v3';
const STATIC_CACHE = `prisma-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `prisma-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/', '/index.html',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/js/modules/nav.js',

  '/manifest.webmanifest',
  '/assets/img/favicon.ico',
  '/assets/img/favicon-16.png',
  '/assets/img/favicon-32.png',
  '/assets/img/apple-touch-icon.png',
  '/assets/img/icon-192.png',
  '/assets/img/icon-192-maskable.png',
  '/assets/img/icon-512.png',
  '/assets/img/icon-512-maskable.png',

  '/assets/img/logo.png',
  '/assets/img/logo@2x.png',
  '/assets/img/logo.svg',
  '/assets/svg/sprite.svg'
];

// Instalação: pre-cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos + navigation preload
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // habilita navigation preload quando suportado
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch {}
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => k.startsWith('prisma-') && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Roteamento
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navegação / documentos HTML
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(req, event));
    return;
  }

  // Estáticos comuns
  const dest = req.destination; // 'style', 'script', 'image', 'font', etc.
  if (['style', 'script', 'image', 'font'].includes(dest)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Fallback same-origin
  event.respondWith(cacheFirst(req));
});

async function networkFirst(request, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    // usa navigation preload se disponível
    const preload = await event?.preloadResponse;
    const fresh = preload || await fetch(request);
    if (fresh && fresh.ok && fresh.type === 'basic') {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/index.html');
  }
}

async function staleWhileRevalidate(request) {
  // 1) procura em QUALQUER cache (STATIC/RUNTIME)
  const cached = await caches.match(request);
  // 2) atualiza em background no RUNTIME
  const cache = await caches.open(RUNTIME_CACHE);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // entrega rápido o que tiver; senão tenta rede; se tudo falhar, devolve o que veio (null)
  return cached || networkPromise || (async () => { throw new Error('offline'); })();
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}
