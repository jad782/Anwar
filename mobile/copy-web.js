// ينسخ ملفات تطبيق الويب من المجلد الأب إلى mobile/www قبل البناء.
// شغّله عبر: npm run copy:web  (أو ضمن npm run sync)
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..');     // مجلد تطبيق الويب
const DEST = path.resolve(__dirname, 'www');   // وجهة Capacitor

// الملفات/المجلدات المطلوبة فقط (نتجنّب نسخ node_modules وملفات PDF الكبيرة)
const INCLUDE = [
  'index.html',
  'i18n-tr.js',
  'i18n-auto.js',
  'i18n-ui.js',
  'persist.js',
  'quran-data.js',
  'firebase.js',
  'prayers.js',
  'ambient.js',
  'haptics.js',
  'app.js',
  'features.js',
  'pro.js',
  'pro2.js',
  'points.js',
  'keys.js',
  'premium.js',
  'hajj.js',
  'loved.js',
  'kids.js',
  'recitations.js',
  'premium-features.js',
  'audio-quran.js',
  'qibla-ar.js',
  'salah-track.js',
  'onboarding.js',
  'backup-rate.js',
  'update.js',
  'sunan.js',
  'zakat.js',
  'mushaf.js',
  'daily.js',
  'guide.js',
  'live-activity.js',
  'widget-bridge.js',
  'notifications.js',
  'fa.css',
  'fonts.css',
  'f-amiri-arabic-400.woff2',
  'f-amiri-arabic-700.woff2',
  'f-cairo-arabic-400900.woff2',
  'f-cairo-latin-400900.woff2',
  'f-fa-brands-400.woff2',
  'f-fa-regular-400.woff2',
  'f-fa-solid-900.woff2',
  'f-tajawal-arabic-400.woff2',
  'f-tajawal-arabic-500.woff2',
  'f-tajawal-arabic-700.woff2',
  'f-tajawal-arabic-800.woff2',
  'f-tajawal-latin-400.woff2',
  'f-tajawal-latin-500.woff2',
  'f-tajawal-latin-700.woff2',
  'f-tajawal-latin-800.woff2',
  'style.css',
  'manifest.json',
  'service-worker.js',
  'athan.mp3',
  'athan.caf',
  'icon-192.png',
  'icon-512.png',
  'apple-icon.jpg'
];

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

let copied = 0;
for (const name of INCLUDE) {
  const from = path.join(SRC, name);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(DEST, name));
    copied++;
  } else {
    console.warn('⚠️  مفقود (تخطّي):', name);
  }
}
console.log(`✅ تم نسخ ${copied} ملف إلى mobile/www`);
