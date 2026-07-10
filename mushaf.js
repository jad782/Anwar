// =======================================================
//  mushaf.js — مصحف احترافي: قائمة سور أنيقة + قراءة صفحة-صفحة بالسحب
//  النص من البيانات المحلّية (quran-uthmani). التجويد من المصدر الرسمي.
// =======================================================
(function(){
'use strict';
const $ = id => document.getElementById(id);
const L = () => (typeof currentLang !== 'undefined' ? currentLang : 'ar');
const QD = () => window.QURAN_DATA;
const cf = () => (typeof currentFontSize !== 'undefined' ? currentFontSize : 22);
window.MUSHAF = window.MUSHAF || {};
const BAS = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
// تُزيل البسملة من بداية النص (نص أول آية يتضمّنها في البيانات).
// تقارن الحروف الأساسية فقط وتتجاهل التشكيل/المسافات (لأن ترتيب التشكيل قد يختلف بين المصادر).
const _BAS_BASE = 'بسماللهالرحمنالرحيم'; // حروف البسملة الأساسية (الألف واللام موحّدة)
function _isDiac(ch){ return /[ً-ْٰـ﻿]/.test(ch); }
function stripBasmalah(t){
    t = t.replace(/^[﻿﻿\s]+/, '');
    let count=0, i=0; const need=_BAS_BASE.length;
    while(i<t.length && count<need){
        const ch=t[i];
        if(_isDiac(ch) || /\s/.test(ch)){ i++; continue; }
        const norm = /[اٱأإآ]/.test(ch) ? 'ا' : ch;
        if(_BAS_BASE[count]===norm){ count++; i++; }
        else break;
    }
    return count===need ? t.slice(i).replace(/^[ً-ْٰـ﻿\s]+/, '') : t;
}

function toArabic(n){ if(localStorage.getItem('num_hindi')==='0') return String(n); return String(n).replace(/[0-9]/g, d=>'٠١٢٣٤٥٦٧٨٩'[d]); }
MUSHAF.rerender = function(){ try{ renderPage(curPage); }catch(e){} };
let _countsReady = false;
function ensureCounts(){
    if (_countsReady || !QD()) return;
    const c = {}; QD().ayahs.forEach(a => { c[a.s] = (c[a.s]||0) + 1; });
    QD().surahs.forEach(s => { if (s.count==null) s.count = c[s.n] || 0; });
    _countsReady = true;
}
function surahMeta(n){ ensureCounts(); return QD().surahs[n-1]; }
function nameOf(n){ return (surahMeta(n).name||'').replace('سُورَةُ ','').replace('سورة ',''); }
function pageOfSurah(n){ const a = QD().ayahs.find(x=>x.s===n); return a?a.p:1; }
function pageOfJuz(j){ const a = QD().ayahs.find(x=>x.j===j); return a?a.p:1; }

// محلّل التجويد (نفس خريطة pro2)
function tjClass(code){ const c=code[0];
    if(c==='n'||c==='p'||c==='m'||c==='o') return 'tj-madd';
    if(c==='g') return 'tj-ghunnah'; if(c==='q') return 'tj-qalqalah';
    if(c==='f'||c==='c') return 'tj-ikhfa'; if(c==='a'||c==='u'||c==='w'||c==='d') return 'tj-idgham';
    if(c==='i') return 'tj-iqlab'; if(c==='h'||c==='s'||c==='l') return 'tj-silent'; return 'tj-other'; }
function parseTaj(t){ return (t||'').replace(/\[([a-z]+)(?::\d+)?\[(.*?)\]/g, (m,code,inner)=>`<span class="${tjClass(code)}">${inner}</span>`); }

// =======================================================
// قائمة السور الأنيقة + الأجزاء
// =======================================================
MUSHAF.renderSurahList = function(){
    const el = $('surah-list'); if(!el || !QD()) return;
    ensureCounts();
    el.innerHTML = QD().surahs.map(s => {
        const page = pageOfSurah(s.n);
        const type = s.type==='Meccan' ? 'مكية' : 'مدنية';
        const ayahWord = s.count>10 ? 'آية' : 'آيات';
        return `<div class="msf-card" onclick="MUSHAF.openSurah(${s.n})">
            <div class="msf-star"><span>${toArabic(s.n)}</span></div>
            <div class="msf-mid">
                <div class="msf-name">${s.name}</div>
                <div class="msf-meta"><span>${type}</span><span class="msf-dot">•</span><span>صفحة ${toArabic(page)}</span></div>
            </div>
            <div class="msf-count">${toArabic(s.count)} ${ayahWord}</div>
        </div>`;
    }).join('');
};
MUSHAF.renderJuzList = function(){
    const el = $('juz-list'); if(!el || !QD()) return;
    let h='';
    for(let i=1;i<=30;i++){ const p=pageOfJuz(i); h += `<div class="msf-card" onclick="MUSHAF.openPage(${p})">
        <div class="msf-star"><span>${toArabic(i)}</span></div>
        <div class="msf-mid"><div class="msf-name">الجزء ${toArabic(i)}</div><div class="msf-meta"><span>صفحة ${toArabic(p)}</span></div></div>
        <div class="msf-count">جُزْء</div></div>`; }
    el.innerHTML = h;
};

// =======================================================
// قارئ الصفحة (سحب صفحة-صفحة)
// =======================================================
let curPage = 1, tajOn = false, _turnDir = 0;
const _origScroll = window.openFreeReading;     // القارئ التفصيلي القديم (للمزايا)
window.openFreeReadingScroll = _origScroll;

function showChrome(){
    $('surah-list').style.display='none'; $('juz-list').style.display='none';
    const qt=document.querySelector('.quran-tabs'); if(qt) qt.style.display='none';
    const qs=$('quran-search-wrap'); if(qs) qs.style.display='none';
    const qr=$('quran-search-results'); if(qr) qr.style.display='none';
    $('reading-view').style.display='block';
    document.body.classList.add('reading-fullscreen');
    const pt=$('page-title'); if(pt) pt.innerText = L()==='en'?'Quran':'المصحف';
    // أخفِ شريط مزايا القارئ التفصيلي في وضع الصفحة
    const tb=$('reading-toolbar'); if(tb) tb.style.display='none';
    const tp=$('trans-picker-row'); if(tp) tp.style.display='none';
    ensureBar();
}
function ensureBar(){
    if ($('msf-bar')) { $('msf-bar').style.display='flex'; return; }
    const host=$('reading-view'); const hdr=host.querySelector('.reading-header');
    const bar=document.createElement('div'); bar.id='msf-bar'; bar.className='msf-bar';
    bar.innerHTML = `<button class="rt-btn" id="msf-taj" onclick="MUSHAF.toggleTajweed()"><i class="fa-solid fa-palette"></i><span>${L()==='en'?'Tajweed':'تجويد'}</span></button>
        <button class="rt-btn" onclick="MUSHAF.detailed()"><i class="fa-solid fa-headphones"></i><span>${L()==='en'?'Listen':'سماع'}</span></button>
        <button class="rt-btn" onclick="MUSHAF.font(-2)"><i class="fa-solid fa-minus"></i><span>${L()==='en'?'A-':'تصغير'}</span></button>
        <button class="rt-btn" onclick="MUSHAF.font(2)"><i class="fa-solid fa-plus"></i><span>${L()==='en'?'A+':'تكبير'}</span></button>
        <button class="rt-btn" onclick="MUSHAF.detailed()"><i class="fa-solid fa-sliders"></i><span>${L()==='en'?'Tools':'أدوات'}</span></button>`;
    hdr.insertAdjacentElement('afterend', bar);
}
MUSHAF.font = function(d){
    try{ if(typeof currentFontSize==='undefined') return; }catch(e){ return; }
    currentFontSize = Math.max(16, Math.min(44, currentFontSize + d));
    try{ localStorage.setItem('fontSize', currentFontSize); }catch(e){}
    document.querySelectorAll('#ayahs-container .ayah').forEach(a=>a.style.fontSize = currentFontSize+'px');
};
MUSHAF.openSurah = function(n){ tajOn=false; showChrome(); curPage = pageOfSurah(n); renderPage(curPage); };
MUSHAF.openPage  = function(p){ tajOn=false; showChrome(); curPage = Math.max(1,Math.min(604,p)); renderPage(curPage); };

async function renderPage(page){
    const cont = $('ayahs-container'); if(!cont) return;
    const ayahs = QD().ayahs.filter(a=>a.p===page); if(!ayahs.length) return;
    let tajMap = null;
    if (tajOn){
        cont.innerHTML = `<div style="text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2.5rem;color:var(--primary-color)"></i></div>`;
        try { const d = await fetchOffline(`https://api.alquran.cloud/v1/page/${page}/quran-tajweed`); tajMap={}; (d.data.ayahs||[]).forEach(a=>tajMap[a.number]=a.text); }
        catch(e){ tajOn=false; const tb=$('msf-taj'); if(tb)tb.classList.remove('active'); }
    }
    // السورة الغالبة على الصفحة (الأكثر آيات) لعنوان الصفحة — يتجنّب إظهار اسم السورة السابقة
    const _counts={}; ayahs.forEach(a=>_counts[a.s]=(_counts[a.s]||0)+1);
    let mainS=ayahs[0].s, _best=0;
    for(const s in _counts){ if(_counts[s]>_best){ _best=_counts[s]; mainS=+s; } }
    const mainName = nameOf(mainS);
    document.getElementById('current-surah-name').innerText = 'سورة ' + mainName;
    let html=''; let curS=0;
    ayahs.forEach(a=>{
        // البانر والبسملة يظهران فقط عند بداية السورة فعلياً (آية ١)، لا عند استكمال سورة من صفحة سابقة
        if (a.s !== curS){ curS=a.s; if (a.a===1){ html += banner(a.s); if(a.s!==1 && a.s!==9) html += `<div class="basmalah">${BAS}</div>`; } }
        let raw = (tajMap && tajMap[a.g]!==undefined) ? parseTaj(tajMap[a.g]) : a.t;
        // البسملة مضمّنة في نص أول آية بالبيانات، وهي معروضة كسطر مستقل — أزِلها من الآية لتجنّب التكرار
        if (a.a===1 && a.s!==1 && a.s!==9) raw = stripBasmalah(raw);
        html += `<div class="ayah" data-surah="${a.s}" data-ayah="${a.a}" data-global="${a.g}" onclick="onAyahTap(${a.s},${a.a},${a.g})" style="font-size:${cf()}px;">${raw} <span class="ayah-number">${toArabic(a.a)}</span></div>`;
    });
    const legend = tajOn ? `<div class="tajweed-legend"><span><b class="tj-madd">المدّ</b></span><span><b class="tj-ghunnah">الغنّة</b></span><span><b class="tj-qalqalah">القلقلة</b></span><span><b class="tj-ikhfa">الإخفاء</b></span><span><b class="tj-idgham">الإدغام</b></span><span><b class="tj-iqlab">الإقلاب</b></span></div>` : '';
    cont.innerHTML = `${legend}<div class="mushaf-page">${html}</div>
        <div class="mushaf-foot">
            <button class="msf-nav-btn" onclick="MUSHAF.prev()" ${page>=604?'disabled':''}><i class="fa-solid fa-chevron-right"></i></button>
            <div class="mushaf-pageno">${toArabic(page)}</div>
            <button class="msf-nav-btn" onclick="MUSHAF.next()" ${page<=1?'disabled':''}><i class="fa-solid fa-chevron-left"></i></button>
        </div>`;
    if (typeof applyReadingBg==='function') applyReadingBg();
    document.querySelector('.content-area').scrollTop = 0;
    const _pg = cont.querySelector('.mushaf-page');
    if (_pg && _turnDir){ _pg.classList.add(_turnDir>0?'pg-turn-next':'pg-turn-prev'); _turnDir=0; }
    window.CUR_READ = { type:'surah', num: mainS, name: mainName, page };
    bindSwipe(cont);
    try{ localStorage.setItem('last_read', JSON.stringify({type:'page', num:page, name:'سورة '+mainName, ts:Date.now()})); }catch(e){}
    if (window.PRO2 && PRO2.checkBadges) setTimeout(()=>PRO2.checkBadges(), 50);
}
// في المصحف: الصفحة التالية على اليسار (سحب لليسار)، والسابقة على اليمين
MUSHAF.next = function(){ if(curPage<604){ _turnDir=1; curPage++; renderPage(curPage); if(window.HAP)HAP.light(); } };
MUSHAF.prev = function(){ if(curPage>1){ _turnDir=-1; curPage--; renderPage(curPage); if(window.HAP)HAP.light(); } };
MUSHAF.toggleTajweed = function(){ tajOn=!tajOn; const b=$('msf-taj'); if(b)b.classList.toggle('active',tajOn); renderPage(curPage); };
MUSHAF.detailed = function(){ // افتح القارئ التفصيلي (صوت/ترجمة/تسجيل) للسورة الحالية
    const n = (window.CUR_READ&&window.CUR_READ.num)||1;
    const mb=$('msf-bar'); if(mb) mb.style.display='none';
    if (typeof _origScroll==='function') _origScroll('surah', n, nameOf(n));
    const tb=$('reading-toolbar'); if(tb) tb.style.display='flex';
};

function banner(n){
    const m = surahMeta(n);
    const type = m.type==='Meccan'?'مكية':'مدنية';
    return `<div class="mushaf-banner"><span class="mb-orn">۞</span><div class="mb-mid"><h2>${m.name}</h2><span class="mb-sub">${type} · ${toArabic(m.count)} آية</span></div><span class="mb-orn">۞</span></div>`;
}

// السحب الأفقي
let _sx=0, _sy=0, _bound=null;
function bindSwipe(el){
    if (_bound===el) return; _bound=el;
    el.addEventListener('touchstart', e=>{ _sx=e.changedTouches[0].clientX; _sy=e.changedTouches[0].clientY; }, {passive:true});
    el.addEventListener('touchend', e=>{ const dx=e.changedTouches[0].clientX-_sx, dy=e.changedTouches[0].clientY-_sy;
        if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)*1.5){ if(dx<0) MUSHAF.next(); else MUSHAF.prev(); } }, {passive:true});
}

// استبدال فتح القراءة: السور والأجزاء تفتح وضع الصفحة
window.openFreeReading = function(type, num, name){
    if (!QD()) { if(typeof _origScroll==='function') return _origScroll(type,num,name); return; }
    if (type==='juz'){ MUSHAF.openPage(pageOfJuz(num)); return; }
    MUSHAF.openSurah(num);
};
// عند الرجوع: أعد إظهار القائمة والبحث وأخفِ شريط المصحف
const _origClose = window.closeSurah;
window.closeSurah = function(){
    document.body.classList.remove('reading-fullscreen');
    if (typeof _origClose==='function') _origClose();
    const qs=$('quran-search-wrap'); if(qs) qs.style.display='flex';
    const bar=$('msf-bar'); if(bar) bar.style.display='none';
};

function init(){ MUSHAF.renderSurahList(); MUSHAF.renderJuzList(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(init, 650));
else setTimeout(init, 650);
})();
