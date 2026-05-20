const CACHE_NAME = 'quran-app-v1';
const urlsToCache = [
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// تثبيت ملفات التطبيق في الذاكرة
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// جلب الملفات من الذاكرة إذا انقطع الإنترنت
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا وجد الملف في الكاش يرجعه، وإلا يجلبه من الإنترنت
                return response || fetch(event.request);
            })
    );
});