// Update Version 5
const CACHE_NAME = 'anwar-cache-v150';

const urlsToCache = [
  './',
  './index.html',
  './fa.css?v=1',
  './fonts.css?v=1',
  './f-amiri-arabic-400.woff2',
  './f-amiri-arabic-700.woff2',
  './f-cairo-arabic-400900.woff2',
  './f-cairo-latin-400900.woff2',
  './f-fa-brands-400.woff2',
  './f-fa-regular-400.woff2',
  './f-fa-solid-900.woff2',
  './f-tajawal-arabic-400.woff2',
  './f-tajawal-arabic-500.woff2',
  './f-tajawal-arabic-700.woff2',
  './f-tajawal-arabic-800.woff2',
  './f-tajawal-latin-400.woff2',
  './f-tajawal-latin-500.woff2',
  './f-tajawal-latin-700.woff2',
  './f-tajawal-latin-800.woff2',
  './style.css?v=93',
  './i18n-tr.js?v=1',
  './i18n-ui.js?v=1',
  './persist.js?v=4',
  './quran-data.js?v=1',
  './firebase.js?v=3',
  './prayers.js?v=14',
  './haptics.js?v=1',
  './app.js?v=32',
  './features.js?v=26',
  './pro.js?v=33',
  './pro2.js?v=23',
  './points.js?v=16',
  './keys.js?v=8',
  './premium.js?v=20',
  './hajj.js?v=3',
  './loved.js?v=5',
  './kids.js?v=3',
  './recitations.js?v=1',
  './premium-features.js?v=6',
  './qibla-ar.js?v=1',
  './audio-quran.js?v=1',
  './salah-track.js?v=1',
  './onboarding.js?v=1',
  './backup-rate.js?v=3',
  './update.js?v=9',
  './sunan.js?v=1',
  './zakat.js?v=3',
  './mushaf.js?v=14',
  './daily.js?v=2',
  './guide.js?v=2',
  './ambient.js?v=1',
  './live-activity.js?v=1',
  './widget-bridge.js?v=1',
  './notifications.js?v=7',
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