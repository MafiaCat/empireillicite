const CACHE_NAME = 'empire-illicite-v1';
const ASSETS_TO_CACHE = [
    'Empire Illicite.html',
    'css/variables.css',
    'css/base.css',
    'css/layout.css',
    'css/components.css',
    'css/mobile.css',
    'js/main.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
