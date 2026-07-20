// Update Version 5
const CACHE_NAME = 'anwar-cache-v121';

const urlsToCache = [
  './',
  './index.html',
  './style.css?v=77',
  './persist.js?v=1',
  './quran-data.js?v=1',
  './firebase.js?v=3',
  './prayers.js?v=8',
  './haptics.js?v=1',
  './app.js?v=26',
  './features.js?v=23',
  './pro.js?v=26',
  './pro2.js?v=19',
  './points.js?v=16',
  './keys.js?v=6',
  './premium.js?v=16',
  './hajj.js?v=3',
  './loved.js?v=4',
  './kids.js?v=3',
  './recitations.js?v=1',
  './premium-features.js?v=6',
  './qibla-ar.js?v=1',
  './audio-quran.js?v=1',
  './salah-track.js?v=1',
  './onboarding.js?v=1',
  './backup-rate.js?v=1',
  './update.js?v=7',
  './sunan.js?v=1',
  './mushaf.js?v=14',
  './daily.js?v=2',
  './ambient.js?v=1',
  './live-activity.js?v=1',
  './widget-bridge.js?v=1',
  './notifications.js?v=6',
  './athan.mp3',
  './athan.caf',
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