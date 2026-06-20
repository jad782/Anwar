// Update Version 5
const CACHE_NAME = 'anwar-cache-v25';

const urlsToCache = [
  './',
  './index.html',
  './style.css?v=17',
  './quran-data.js?v=1',
  './firebase.js?v=1',
  './prayers.js?v=4',
  './app.js?v=15',
  './features.js?v=13',
  './pro.js?v=8',
  './pro2.js?v=5',
  './mushaf.js?v=3',
  './ambient.js?v=1',
  './live-activity.js?v=1',
  './notifications.js?v=2',
  './athan.mp3',
  './manifest.json',
  './icon-192.png?v=2',
  './icon-512.png?v=2',
  './apple-icon.jpg'
];

// تثبيت التحديث الجديد فوراً وإجبار التطبيق على قبوله
self.addEventListener('install', event => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// مسح الذاكرة القديمة (Cache) عند تفعيل النسخة الجديدة
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// استراتيجية (الشبكة أولاً): جلب الأكواد الجديدة من الإنترنت، وإذا لم يوجد إنترنت يعرض النسخة المخزنة
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});