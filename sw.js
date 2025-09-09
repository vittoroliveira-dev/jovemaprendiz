// /sw.js
// Escopo: "/"  (garanta o registro em /assets/js/app.js conforme abaixo)

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `prisma-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `prisma-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',                        // shell
  '/index.html',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/js/modules/nav.js',

  // Manifest + ícones (PWA / favicons / Apple)
  '/manifest.webmanifest',
  '/assets/img/favicon.ico',
  '/assets/img/favicon-16.png',
  '/assets/img/favicon-32.png',
  '/assets/img/apple-touch-icon.png',
  '/assets/img/icon-192.png',
  '/assets/img/icon-192-maskable.png',
  '/assets/img/icon-512.png',
  '/assets/img/icon-512-maskable.png',

  // Logo / sprite usados no header
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

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('prisma-') && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégias de cache:
// - HTML/navigation -> network-first (fallback cache)
// - CSS/JS/IMG/FONT -> stale-while-revalidate (rápido + atualiza)
// - Demais GET same-origin -> cache-first básico
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // apenas GET e mesmo domínio
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return; // deixa ir direto à rede
  }

  // Navegação (document)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Estáticos por destino
  const dest = req.destination; // 'style', 'script', 'image', 'font', 'document', etc.
  if (['style', 'script', 'image', 'font'].includes(dest)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Fallback: cache-first simples para outras respostas same-origin
  event.respondWith(cacheFirst(req));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(request);
    // fallback mínimo ao shell se não houver cache específico
    return cached || caches.match('/index.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || networkPromise || fetch(request);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}
