// Service Worker per a Ambulàncies CCOO
const CACHE_NAME = 'ambulancies-ccoo-v2';

// Recursos críticos a precachear inicialmente
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './calculadora.html',
  './ced.html',
  './documentos.html',
  './manifest.webmanifest',
  './favicon.ico',
  './ccoo.png',
  './icons/android/launchericon-192x192.png',
  './icons/android/launchericon-512x512.png',
  './icons/android/launchericon-192x192-maskable.png',
  './icons/android/launchericon-512x512-maskable.png',
  './icons/ios/180.png'
];

// Instalación: forzar activación inmediata y precachear
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] No se pudo precachear ${url}:`, err);
          })
        )
      );
    })
  );
});

// Activación: reclamar clientes inmediatamente y purgar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Mensajes desde la aplicación (por ejemplo para forzar actualización)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Intercepción de peticiones (Fetch)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Solo gestionar peticiones HTTP/HTTPS con método GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Excluir scripts de analítica externos (como Umami) y APIs ajenas
  if (url.hostname.includes('umami.is')) {
    return;
  }

  // ESTRATEGIA 1: Para navegación (páginas HTML) -> NETWORK-FIRST
  // Esto garantiza que si el usuario tiene conexión, SIEMPRE descargue los cambios más recientes de la web.
  // Si está offline, se le entrega la versión en caché.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Si la ruta solicitada no está en caché, devolver index.html como fallback
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // ESTRATEGIA 2: Recursos estáticos (JS, CSS, imágenes, fuentes) -> STALE-WHILE-REVALIDATE
  // Devuelve la copia en caché rápidamente mientras actualiza en segundo plano desde la red.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
