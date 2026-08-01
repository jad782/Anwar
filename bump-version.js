#!/usr/bin/env node
// =======================================================
//  bump-version.js — يبدّل رقم الإصدار في كل مواضعه دفعةً واحدة.
//
//  الاستعمال:  node bump-version.js 1.9.1
//
//  لماذا؟ الرقم مكتوب في أربعة ملفات، ومنها codemagic.yaml الذي يُثبّت
//  CFBundleShortVersionString. نسيانُ الرابع يُنتج حزمةً برقم مستهلك
//  يرفضها App Store Connect بعد بناءٍ كامل — أي دورة ضائعة.
// =======================================================
const fs = require('fs');
const path = require('path');

const next = process.argv[2];
if (!next || !/^\d+\.\d+\.\d+$/.test(next)) {
    console.error('الاستعمال: node bump-version.js 1.9.1   (صيغة x.y.z)');
    process.exit(1);
}

const root = __dirname;
const FILES = ['update.js', 'i18n-ui.js', 'index.html', 'codemagic.yaml'];
const VER = /\b\d+\.\d+\.\d+\b/;

// اقرأ الحالي من update.js (المصدر الموثوق)
const updSrc = fs.readFileSync(path.join(root, 'update.js'), 'utf8');
const m = updSrc.match(/APP_VERSION\s*=\s*'([\d.]+)'/);
if (!m) { console.error('تعذّر قراءة APP_VERSION من update.js'); process.exit(1); }
const current = m[1];

if (current === next) { console.log('الرقم ' + next + ' مستعمل أصلاً — لا تغيير.'); process.exit(0); }

const rx = new RegExp(current.replace(/\./g, '\\.'), 'g');
let changed = [];
for (const f of FILES) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) { console.warn('⚠️  مفقود: ' + f); continue; }
    const src = fs.readFileSync(p, 'utf8');
    const n = (src.match(rx) || []).length;
    if (!n) { console.warn('⚠️  لم يُعثر على ' + current + ' في ' + f); continue; }
    fs.writeFileSync(p, src.replace(rx, next), 'utf8');
    changed.push(f + ' (' + n + ')');
}

// service-worker: أعطِ الذاكرة اسماً جديداً وإلا خدم المتصفّح الملفات القديمة
const swPath = path.join(root, 'service-worker.js');
if (fs.existsSync(swPath)) {
    const sw = fs.readFileSync(swPath, 'utf8');
    const cm = sw.match(/anwar-cache-v(\d+)/);
    if (cm) {
        const bumped = 'anwar-cache-v' + (parseInt(cm[1], 10) + 1);
        fs.writeFileSync(swPath, sw.replace(/anwar-cache-v\d+/g, bumped), 'utf8');
        changed.push('service-worker.js → ' + bumped);
    }
}

console.log('من ' + current + ' إلى ' + next + ':');
changed.forEach(c => console.log('  ✅ ' + c));
console.log('\nلا تنسَ: node mobile/copy-web.js ثم الدفع قبل تشغيل كودماجيك.');
