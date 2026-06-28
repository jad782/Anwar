// Update Version 5
const CACHE_NAME = 'anwar-cache-v53';

const urlsToCache = [
  './',
  './index.html',
  './style.css?v=39',
  './persist.js?v=1',
  './quran-data.js?v=1',
  './firebase.js?v=1',
  './prayers.js?v=4',
  './app.js?v=22',
  './features.js?v=17',
  './pro.js?v=12',
  './pro2.js?v=13',
  './points.js?v=8',
  './keys.js?v=2',
  './sunan.js?v=1',
  './mushaf.js?v=4',
  './ambient.js?v=1',
  './live-activity.js?v=1',
  './widget-bridge.js?v=1',
  './notifications.js?v=3',
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