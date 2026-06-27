// ينسخ ملفات تطبيق الويب من المجلد الأب إلى mobile/www قبل البناء.
// شغّله عبر: npm run copy:web  (أو ضمن npm run sync)
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..');     // مجلد تطبيق الويب
const DEST = path.resolve(__dirname, 'www');   // وجهة Capacitor

// الملفات/المجلدات المطلوبة فقط (نتجنّب نسخ node_modules وملفات PDF الكبيرة)
const INCLUDE = [
  'index.html',
  'persist.js',
  'quran-data.js',
  'firebase.js',
  'prayers.js',
  'ambient.js',
  'app.js',
  'features.js',
  'pro.js',
  'pro2.js',
  'points.js',
  'keys.js',
  'sunan.js',
  'mushaf.js',
  'live-activity.js',
  'widget-bridge.js',
  'notifications.js',
  'style.css',
  'manifest.json',
  'service-worker.js',
  'athan.mp3',
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
