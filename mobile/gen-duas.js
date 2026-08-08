#!/usr/bin/env node
// =======================================================
//  gen-duas.js — يستخرج مكتبة الأذكار والأدعية من features.js
//  إلى ملف JSON يقرأه ودجت iOS.
//
//  الاستعمال:  node mobile/gen-duas.js
//
//  لماذا استخراج بدل كتابة النصوص في Swift؟ لأن النصّ الشرعي يجب أن يكون
//  له مصدر واحد مُراجَع. لو كُتب مرّتين لتفرّقا مع الوقت، وأي خطأ في
//  دعاء أو في نسبته إلى مصدره ضررٌ حقيقيّ. المكتبة في features.js هي
//  المرجع، وهذا الملف مُشتَقّ منها آلياً.
// =======================================================
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'features.js');
const OUT = path.join(ROOT, 'mobile/ios/App/AnwarWidget/duas.json');

const src = fs.readFileSync(SRC, 'utf8');
const i = src.indexOf('const ATHKAR_LIB');
if (i < 0) { console.error('لم أجد ATHKAR_LIB في features.js'); process.exit(1); }

// اقتطع الكائن بعدّ الأقواس المتوازنة
let depth = 0, start = src.indexOf('{', i), end = start;
for (; end < src.length; end++) {
    if (src[end] === '{') depth++;
    else if (src[end] === '}') { depth--; if (depth === 0) break; }
}
const lib = eval('(' + src.slice(start, end + 1) + ')');

// النصوص الطويلة جداً لا تُقرأ في ودجت صغير — نتجاوزها
const MAX = 240;
const out = [];
const seen = new Set();

for (const secKey of Object.keys(lib)) {
    const sec = lib[secKey];
    const cats = sec.cats || {};
    for (const catKey of Object.keys(cats)) {
        const cat = cats[catKey];
        for (const item of (cat.items || [])) {
            const text = (item.text || '').trim();
            if (!text || text.length > MAX) continue;
            if (seen.has(text)) continue;           // الصباح والمساء يتشاركان نصوصاً
            seen.add(text);
            out.push({
                text,
                cat: cat.ar || '',
                // info في المكتبة يحمل الفضل أو التخريج — نمرّره كما هو
                info: (item.info || '').trim()
            });
        }
    }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');

const skipped = [...(function*(){ for (const secKey of Object.keys(lib)){ const cats=lib[secKey].cats||{};
    for (const c of Object.keys(cats)) for (const it of (cats[c].items||[])) if ((it.text||'').trim().length > MAX) yield it; } })()];

console.log('✅ ' + out.length + ' نصّاً إلى ' + path.relative(ROOT, OUT));
console.log('   تُجوهِزت ' + skipped.length + ' نصوص أطول من ' + MAX + ' حرفاً (لا تُقرأ في ودجت).');
const byCat = {};
out.forEach(o => { byCat[o.cat] = (byCat[o.cat] || 0) + 1; });
console.log('   ' + Object.entries(byCat).map(([k, v]) => k + ':' + v).join(' · '));
