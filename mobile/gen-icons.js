// يولّد أيقونات التطبيق من ملف المصدر.
// ضع صورة الأيقونة الجديدة (مربّعة، يفضّل 1024×1024) باسم: quran.app/icon-source.png
// ثم شغّل:  node gen-icons.js   (من داخل مجلد mobile)
// بعدها للأندرويد:  npx @capacitor/assets generate --android
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');           // مجلد تطبيق الويب
const SRC = fs.existsSync(path.join(ROOT,'icon-source.png'))
    ? path.join(ROOT,'icon-source.png')
    : path.join(ROOT,'iconn-192.png');                 // احتياطي

(async () => {
    // أيقونات الويب/الـPWA
    await sharp(SRC).resize(192,192).png().toFile(path.join(ROOT,'icon-192.png'));
    await sharp(SRC).resize(512,512).png().toFile(path.join(ROOT,'icon-512.png'));
    await sharp(SRC).resize(180,180).jpeg({quality:92}).toFile(path.join(ROOT,'apple-icon.jpg'));

    // مصدر مولّد أيقونات Capacitor (للأندرويد/iOS)
    fs.mkdirSync(path.join(__dirname,'assets'), {recursive:true});
    await sharp(SRC).resize(1024,1024).png().toFile(path.join(__dirname,'assets','icon-only.png'));
    await sharp(SRC).resize(1024,1024).png().toFile(path.join(__dirname,'assets','icon-foreground.png'));

    console.log('✅ تم توليد الأيقونات من:', path.basename(SRC));
    console.log('   للأندرويد شغّل بعدها: npx @capacitor/assets generate --android');
})();
