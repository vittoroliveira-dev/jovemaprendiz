/* ========================================================================
   PRISMA TALENTOS | SERVICE WORKER
   ======================================================================== */

// Versão do Service Worker (incrementar para forçar atualização)
const VERSION = 'v30'; 

// Nomes dos caches
const STATIC_CACHE = `prisma-static-${VERSION}`;
const RUNTIME_CACHE = `prisma-runtime-${VERSION}`;

// URLs a serem pré-cachetadas durante a instalação
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/contato.html', 
  '/manifest.webmanifest',

 // CSS
  '/assets/css/main.css',
  '/assets/css/base/_elements.css', 
  '/assets/css/base/_generic.css', 
  '/assets/css/base/_settings.css',
  '/assets/css/objects/_o-container.css',
  '/assets/css/utilities/_u-helpers.css', 
  '/assets/css/utilities/_u-sr-only.css',   
  '/assets/css/components/_c-band.css',
  '/assets/css/components/_c-brand.css',
  '/assets/css/components/_c-button.css',
  '/assets/css/components/_c-card.css',
  '/assets/css/components/_c-contact.css',
  '/assets/css/components/_c-field.css',
  '/assets/css/components/_c-footer.css',
  '/assets/css/components/_c-form.css',
  '/assets/css/components/_c-header.css',
  '/assets/css/components/_c-hero.css',
  '/assets/css/components/_c-nav.css',
  '/assets/css/components/_c-pain.css',
  '/assets/css/components/_c-toast.css',
  '/assets/css/components/_c-whatsapp.css',
  

 // JS (ESM)
  '/assets/js/app.js',
  '/assets/js/modules/click-anim.js',
  '/assets/js/modules/contact.js', 
  '/assets/js/modules/header-over-hero.js',
  '/assets/js/modules/nav.js',
  

 // Ícones / PWA (ajuste para os que EXISTEM no projeto)
  '/assets/img/apple-touch-icon.png', 
  '/assets/img/android-chrome-192x192.png',
  '/assets/img/android-chrome-512x512.png',
  '/assets/img/android-chrome-maskable-192x192.png',
  '/assets/img/android-chrome-maskable-512x512.png',
  '/assets/img/favicon-16x16.png', 
  '/assets/img/favicon-32x32.png', 
  '/assets/img/mstile-150x150.png',
  '/assets/img/favicon.ico',
  
   // OG Cover (ajuste para os que EXISTEM no projeto)
   '/assets/img/og-cover-1200x630.png',

  // SVG usados no site
  '/assets/svg/logo.svg',
  '/assets/svg/sprite.svg',
  '/assets/svg/icons/whatsapp.svg',

  // Hero (ajuste se necessário)
  '/assets/webp/hero-contato.webp',
  '/assets/webp/hero-person-800.webp',
  '/assets/webp/hero-person-1200.webp',
  '/assets/webp/hero-person-1600.webp',
  '/assets/img/hero-contato.png',
  '/assets/img/hero-person-800.png',
  '/assets/img/hero-person-1200.png',
  '/assets/img/hero-person-1600.png',
];

/**
 * Tenta pré-cachear URLs de forma segura, ignorando falhas individuais.
 * @param {string[]} urls - Array de URLs a serem pré-cachetadas.
 */
 
async function safePrecache(urls){
  const cache = await caches.open(STATIC_CACHE);
  await Promise.allSettled(urls.map(async (u)=>{
    try{
		 // Usa new Request com cache: 'reload' para garantir que a versão mais recente seja buscada
      await cache.add(new Request(u, { cache: 'reload' }));
    } catch (error) {
		 // Ignora erros como 404 ou recursos opacos que não podem ser cachetados
      console.warn(`Falha ao pré-cachear ${u}:`, error);
    }
  }));
}

// Evento 'install': instala o Service Worker e pré-cacheia recursos estáticos.
self.addEventListener('install', (event) => {
  event.waitUntil(safePrecache(PRECACHE_URLS));
// self.skipWaiting(); // Não chamamos skipWaiting aqui; a UI controla via mensagem
});

// Evento 'activate': limpa caches antigos e ativa o Service Worker.
self.addEventListener('activate', (event) => {
  event.waitUntil((async ()=>{
	  // Habilita navigation preload se suportado (melhora o desempenho de navegação)
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
	
	// Limpa caches antigos
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter(k => k.startsWith('prisma-') && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
        .map(k => caches.delete(k))
    );
	// Assume o controle de clientes não controlados (útil após atualização)
    await self.clients.claim();
	// Notifica clientes que o SW está pronto (para UI de atualização)
    await notifyClients('SW_READY');
  })());
});

// Evento 'message': ouve mensagens do cliente (e.g., para pular o estado 'waiting').
self.addEventListener('message', (event) => {
  const t = event.data?.type || event.data;
  if (t === 'SKIP_WAITING') self.skipWaiting();
});

// Evento 'fetch': intercepta requisições de rede e serve recursos do cache ou da rede.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // não cachear o próprio SW nem o manifest
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.webmanifest') return;

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, event)); return;
  }
  if (['style','script','image','font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, event)); return;
  }
  event.respondWith(cacheFirst(request));
});

// --- Estratégias de Caching ---

/**
 * Estratégia Network First: Tenta buscar o recurso da rede primeiro.
 * Se falhar, serve a versão cachetada. Usado para HTML (navegação).
 * @param {Request} request - A requisição a ser processada.
 * @param {ExtendableEvent} event - O evento fetch, usado para preloadResponse.
 * @returns {Promise<Response>} A resposta da rede ou do cache.
 */

async function networkFirst(request, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    // Tenta usar o preloadResponse se disponível (otimização do navegador)
    const preloadResponse = await event?.preloadResponse;
    const freshResponse = preloadResponse || await fetch(request);

    // Se a resposta da rede for válida, cacheia e retorna.
    if (freshResponse && freshResponse.ok && freshResponse.type === 'basic') {
      await cache.put(request, freshResponse.clone());
    }
    return freshResponse;
  } catch (error) {
    // Se a rede falhar, tenta servir do cache.
    console.warn(`Network First falhou para ${request.url}. Servindo do cache.`, error);
    const cachedResponse = await caches.match(request);
    // Fallback para index.html se a requisição original não estiver no cache (offline page)
    return cachedResponse || caches.match('/index.html');
  }
}

/**
 * Estratégia Stale While Revalidate: Serve o recurso do cache imediatamente.
 * Em paralelo, busca uma nova versão da rede e atualiza o cache para futuras requisições.
 * Usado para CSS, JS, imagens, fontes.
 * @param {Request} request - A requisição a ser processada.
 * @param {ExtendableEvent} event - O evento fetch, usado para waitUntil.
 * @returns {Promise<Response>} A resposta do cache ou da rede.
 */
 
async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await caches.match(request);

  // Tenta buscar da rede e atualizar o cache em segundo plano.
  const networkPromise = (async () => {
    try {
      const response = await fetch(request);
      // Verifica se a resposta é válida antes de cachear
      if (response && response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.warn(`Stale While Revalidate: Falha na rede para ${request.url}.`, error);
      return undefined; // Retorna undefined em caso de falha na rede
    }
  })();

  // Garante que a atualização do cache finalize mesmo se retornarmos cedo.
  event?.waitUntil(networkPromise);

  // Retorna a versão cachetada imediatamente se disponível.
  if (cachedResponse) {
    return cachedResponse;
  }

  // Se não houver cache, espera pela resposta da rede.
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Se tudo falhar, retorna uma resposta de erro.
  return new Response('', { status: 503, statusText: 'Service Unavailable' });
}

/**
 * Estratégia Cache First: Tenta servir o recurso do cache primeiro.
 * Se não estiver no cache, busca da rede e cacheia para futuras requisições.
 * Usado como fallback geral.
 * @param {Request} request - A requisição a ser processada.
 * @returns {Promise<Response>} A resposta do cache ou da rede.
 */

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  // Se não estiver no cache, busca da rede e adiciona ao cache de runtime
  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

/**
 * Notifica todos os clientes (páginas abertas) sobre um evento do Service Worker.
 * @param {string} type - O tipo de mensagem a ser enviada (e.g., 'SW_READY').
 */
async function notifyClients(type) {
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientsList) {
    client.postMessage({ type });
  }
}