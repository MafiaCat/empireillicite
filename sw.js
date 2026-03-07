const CACHE_NAME = 'empire-illicite-v2';
const ASSETS_TO_CACHE = [
    'index.html',
    'css/variables.css',
    'css/base.css',
    'css/layout.css',
    'css/components.css',
    'css/mobile.css',
    'js/core/config.js',
    'js/core/state.js',
    'js/core/utils.js',
    'js/modules/ui.js',
    'js/modules/production.js',
    'js/modules/sales.js',
    'js/modules/finance.js',
    'js/modules/investments.js',
    'js/modules/invest-render.js',
    'js/modules/territories.js',
    'js/modules/quests.js',
    'js/modules/achievements.js',
    'js/modules/lab.js',
    'js/modules/assets.js',
    'js/modules/collection-render.js',
    'js/main.js'
];

self.addEventListener('install', (event) => {
    // Force install new worker immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Delete old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Network First strategy (Fetch from network, fallback to cache)
    event.respondWith(
        fetch(event.request).then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            // Clone the response and save it to the cache
            let responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                // Don't cache API calls or external resources if not needed, but here we cache all successful basic requests
                cache.put(event.request, responseToCache);
            });
            return response;
        }).catch(() => {
            // Offline fallback
            return caches.match(event.request);
        })
    );
});
