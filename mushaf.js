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
let curPage = 1, tajOn = false, _scrollToSurah = null;
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
        <button class="rt-btn" id="msf-listen-btn" onclick="window.AnwarFollow&&AnwarFollow.toggle()"><i class="fa-solid fa-headphones"></i><span>${L()==='en'?'Listen':'سماع'}</span></button>
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
MUSHAF.openSurah = function(n){ window._activeKhatma=null; tajOn=false; showChrome(); curPage = pageOfSurah(n); _scrollToSurah = n; renderPage(curPage); };
MUSHAF.openPage  = function(p){ tajOn=false; showChrome(); curPage = Math.max(1,Math.min(604,p)); renderPage(curPage); };
// الختمة تفتح قارئ المصحف الأوفلاين (تجويد + تقليب + كل الميزات) بدل القارئ القديم
window.openKhatmaPage = function(id, pageNum){
    window._activeKhatma = id;
    try{ if(typeof window.setActiveKhatma==='function') window.setActiveKhatma(id); }catch(e){}
    try{ if(typeof goToTab==='function') goToTab(1); }catch(e){} // انتقل لتبويب القرآن أولاً وإلا يبقى المصحف مخفياً
    MUSHAF.openPage(parseInt(pageNum)||1);
};

// يبني محتوى صفحةٍ ما بلا أي أثر جانبي — يُستعمل للصفحة المعروضة
// وللصفحة المجاورة التي تنزلق أثناء السحب.
function buildPage(page, tajMap){
    const ayahs = QD().ayahs.filter(a=>a.p===page); if(!ayahs.length) return null;
    // السورة الغالبة على الصفحة (الأكثر آيات) لعنوانها — يتجنّب إظهار اسم السورة السابقة
    const _counts={}; ayahs.forEach(a=>_counts[a.s]=(_counts[a.s]||0)+1);
    let mainS=ayahs[0].s, _best=0;
    for(const s in _counts){ if(_counts[s]>_best){ _best=_counts[s]; mainS=+s; } }
    let html=''; let curS=0;
    ayahs.forEach(a=>{
        // البانر والبسملة يظهران فقط عند بداية السورة فعلياً (آية ١)، لا عند استكمال سورة من صفحة سابقة
        if (a.s !== curS){ curS=a.s; if (a.a===1){ html += banner(a.s); if(a.s!==1 && a.s!==9) html += `<div class="basmalah">${BAS}</div>`; } }
        let raw = (tajMap && tajMap[a.g]!==undefined) ? parseTaj(tajMap[a.g]) : a.t;
        // البسملة مضمّنة في نص أول آية بالبيانات، وهي معروضة كسطر مستقل — أزِلها من الآية لتجنّب التكرار
        if (a.a===1 && a.s!==1 && a.s!==9) raw = stripBasmalah(raw);
        html += `<div class="ayah" data-surah="${a.s}" data-ayah="${a.a}" data-global="${a.g}" onclick="onAyahTap(${a.s},${a.a},${a.g})" style="font-size:${cf()}px;">${raw} <span class="ayah-number">${toArabic(a.a)}</span></div>`;
    });
    const legend = (tajMap) ? `<div class="tajweed-legend"><span><b class="tj-madd">المدّ</b></span><span><b class="tj-ghunnah">الغنّة</b></span><span><b class="tj-qalqalah">القلقلة</b></span><span><b class="tj-ikhfa">الإخفاء</b></span><span><b class="tj-idgham">الإدغام</b></span><span><b class="tj-iqlab">الإقلاب</b></span></div>` : '';
    return {
        mainS, mainName: nameOf(mainS),
        inner: `${legend}<div class="mushaf-page">${html}</div>`
             + `<div class="mushaf-foot"><div class="mushaf-pageno">${toArabic(page)} · ${toArabic(604)}</div></div>`
    };
}

async function renderPage(page){
    const cont = $('ayahs-container'); if(!cont) return;
    try{ if(window.AnwarFollow) AnwarFollow.stop(); }catch(e){}
    const ayahs = QD().ayahs.filter(a=>a.p===page); if(!ayahs.length) return;
    let tajMap = null;
    if (tajOn){
        cont.innerHTML = `<div style="text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2.5rem;color:var(--primary-color)"></i></div>`;
        try { const d = await fetchOffline(`https://api.alquran.cloud/v1/page/${page}/quran-tajweed`); tajMap={}; (d.data.ayahs||[]).forEach(a=>tajMap[a.number]=a.text); }
        catch(e){ tajOn=false; const tb=$('msf-taj'); if(tb)tb.classList.remove('active'); }
    }
    const built = buildPage(page, tajMap);
    if (!built) return;
    const mainS = built.mainS, mainName = built.mainName;
    document.getElementById('current-surah-name').innerText = 'سورة ' + mainName;
    // الصفحة داخل مسار قابل للإزاحة كي تنزلق مع الإصبع (انظر initPager)
    cont.innerHTML = `<div class="msf-track"><div class="msf-slide msf-cur">${built.inner}</div></div>`;
    if (typeof applyReadingBg==='function') applyReadingBg();
    // المُمرِّر في وضع القراءة هو ‎#reading-view‎؛ تصفير ‎.content-area‎ وحدها
    // كان بلا أثر، فتُقلَب الصفحة ويبقى القارئ نازلاً في وسطها.
    try{ const rv=$('reading-view'); if(rv) rv.scrollTop = 0; }catch(e){}
    const _ca=document.querySelector('.content-area'); if(_ca) _ca.scrollTop = 0;
    // عند فتح سورة تبدأ في وسط الصفحة (بعد نهاية السورة السابقة): انزل لبداية السورة المطلوبة وثبّت عنوانها
    if (_scrollToSurah){ const _ts=_scrollToSurah; _scrollToSurah=null;
        try{ const tEl=$('current-surah-name'); if(tEl) tEl.innerText='سورة '+nameOf(_ts); }catch(e){}
        setTimeout(()=>{ try{
            const b=cont.querySelector('.mushaf-banner[data-s="'+_ts+'"]');
            const rv=$('reading-view'); if(!b||!rv) return;
            const hdr=rv.querySelector('.reading-header'); const bar=$('msf-bar');
            const off=(hdr?hdr.offsetHeight:0) + ((bar&&getComputedStyle(bar).position!=='static')?bar.offsetHeight:0) + 6;
            const br=b.getBoundingClientRect(), rr=rv.getBoundingClientRect();
            rv.scrollTop += (br.top - rr.top) - off;
        }catch(e){} }, 60);
    }
    // لا حركة إضافية هنا: الانزلاق نفسه هو الانتقال (كان pg-turn يتضاعف معه)
    window.CUR_READ = { type:'surah', num: mainS, name: mainName, page };
    initPager(cont);
    // تقدّم حلقة "إنجازات اليوم" عند القراءة
    try{ if(typeof updateAchievementState==='function') updateAchievementState('quran'); }catch(e){}
    // حفظ تقدّم الختمة النشطة عند تغيير الصفحة
    try{ if(window._activeKhatma!=null && typeof setKhatmaPage==='function') setKhatmaPage(window._activeKhatma, page); }catch(e){}
    try{ localStorage.setItem('last_read', JSON.stringify({type:'page', num:page, name:'سورة '+mainName, ts:Date.now()})); }catch(e){}
    try{ if(window.AnwarDaily && AnwarDaily.markRead) AnwarDaily.markRead(); }catch(e){}
    if (window.PRO2 && PRO2.checkBadges) setTimeout(()=>PRO2.checkBadges(), 50);
}
// ترتيب المصحف عربيّ: الصفحة التالية تقع يسار الحالية، والسابقة يمينها.
// فسحب الإصبع من اليسار إلى اليمين يجرّ التالية إلى الشاشة، والعكس بالعكس.
MUSHAF.next = function(){ if(curPage<604) slideTo(curPage+1, +1); };
MUSHAF.prev = function(){ if(curPage>1)   slideTo(curPage-1, -1); };
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
    return `<div class="mushaf-banner" data-s="${n}"><span class="mb-orn">۞</span><div class="mb-mid"><h2>${m.name}</h2><span class="mb-sub">${type} · ${toArabic(m.count)} آية</span></div><span class="mb-orn">۞</span></div>`;
}

// =======================================================
//  المُقلِّب: انزلاق أفقي مسطّح يتبع الإصبع ثم ينجذب للصفحة
//
//  المسار (.msf-track) هو ما يُزاح بـtranslate3d، والصفحة المجاورة
//  توضع مطلقةً على يساره أو يمينه فتدخل معه. ارتفاع المسار يبقى ارتفاع
//  الصفحة الحالية (المجاورة مطلقة) فلا يقفز الطول أثناء السحب.
//
//  الاتجاه عربيّ: التالية يسار الحالية. فسحبٌ من اليسار لليمين (dx>0)
//  يزيح المحتوى يميناً فتدخل التالية من اليسار.
//
//  التمرير العمودي يبقى للـ.content-area: لا نعترض إلا بعد أن يتبيّن
//  أن الإيماءة أفقية، وtouch-action:pan-y يترك العمودي للنظام.
// =======================================================
const SNAP_MS = 260, SNAP_EASE = 'cubic-bezier(0.22,0.61,0.36,1)';
let _pagerEl=null, _track=null, _inc=null;
let _px=0, _py=0, _pt=0, _dx=0, _axis=null, _dragging=false, _panned=false, _animating=false;

function _vw(){ return (_pagerEl && _pagerEl.clientWidth) || window.innerWidth || 360; }
function _canGo(dir){ return dir>0 ? curPage<604 : curPage>1; }

function _setX(x, ms){
    if(!_track) return;
    _track.style.transition = ms ? `transform ${ms}ms ${SNAP_EASE}` : 'none';
    _track.style.transform  = `translate3d(${x}px,0,0)`;
}

// يجهّز الصفحة المجاورة في الاتجاه المطلوب (تُبنى مرّة واحدة لكل إيماءة)
function _mountIncoming(dir){
    if(_inc && _inc._dir===dir) return;
    if(_inc){ _inc.remove(); _inc=null; }
    const p = curPage + (dir>0 ? 1 : -1);
    const built = buildPage(p, null);           // بلا تجويد: يُطبَّق عند الاستقرار
    if(!built) return;
    _inc = document.createElement('div');
    _inc.className = 'msf-slide msf-inc';
    _inc.style.left = (dir>0 ? '-100%' : '100%');
    // حاذِ رأس الجارة مع أعلى الشاشة لا مع أعلى المسار: لو كان القارئ
    // نازلاً في وسط الصفحة لظهرت الجارة من وسطها أيضاً، وهي تبدأ من أوّلها
    // بعد الاستقرار (renderPage يعيد التمرير للأعلى) فيحدث قفز.
    // المُمرِّر في وضع القراءة هو ‎#reading-view‎ لا ‎.content-area‎
    try{
        const sc = $('reading-view');
        if(sc){
            const off = sc.getBoundingClientRect().top - _track.getBoundingClientRect().top;
            _inc.style.top = Math.max(0, off) + 'px';
        }
    }catch(e){}
    _inc._dir = dir; _inc._page = p;
    _inc.innerHTML = built.inner;
    _track.appendChild(_inc);
}

function _release(){
    _dragging=false; _axis=null;
    if(!_track) return;
    const w=_vw(), dir=_dx>0?1:-1, dist=Math.abs(_dx), dt=Math.max(1, Date.now()-_pt);
    const speed = dist/dt;                       // بكسل/مللي ثانية
    const commit = _canGo(dir) && _dx!==0 && (dist > w*0.25 || (speed > 0.45 && dist > 36));
    if(commit){
        _animating = true;
        _setX(dir*w, SNAP_MS);
        const target = curPage + dir;
        setTimeout(()=>{ _animating=false; curPage=target; renderPage(target); if(window.HAP)HAP.light(); }, SNAP_MS);
    } else {
        _setX(0, SNAP_MS);
        setTimeout(()=>{ if(_inc){ _inc.remove(); _inc=null; } }, SNAP_MS);
    }
    _dx=0;
}

function _move(cx, cy, ev){
    if(!_dragging) return;
    const dx=cx-_px, dy=cy-_py;
    if(!_axis){
        if(Math.abs(dx)<6 && Math.abs(dy)<6) return;       // لم تتبيّن الإيماءة بعد
        _axis = Math.abs(dx) > Math.abs(dy)*1.2 ? 'x' : 'y';
        if(_axis==='y'){ _dragging=false; return; }        // عمودي: اتركه للتمرير
    }
    if(ev && ev.cancelable) ev.preventDefault();           // أفقي: نحن نتولّاه
    _panned = true;
    const dir = dx>0 ? 1 : -1;
    // مقاومة مطاطية عند الطرفين بدل التوقّف الميّت
    _dx = _canGo(dir) ? dx : dx*0.28;
    if(_canGo(dir)) _mountIncoming(dir);
    _setX(_dx, 0);
}

function _tap(cx, cy, dt){
    // نقرة خفيفة على فراغ الصفحة → إظهار/إخفاء القوائم للقراءة الغامرة
    if(dt>=300) return;
    const t=document.elementFromPoint(cx,cy);
    if(t && !t.closest('.ayah') && !t.closest('button') && !t.closest('.mushaf-banner')){
        document.body.classList.toggle('reading-immersive'); if(window.HAP)HAP.light();
    }
}

// انتقال مبرمَج (أزرار الشريط) بنفس حركة السحب.
// لا نستعمل requestAnimationFrame هنا: قد لا تُطلَق في تبويب خامل أو
// وضع توفير الطاقة، فيعلق _animating ويتوقّف التقليب نهائياً. قراءة
// offsetWidth تفرض إعادة تخطيط فوريّة وهي كافية لتسجيل الجارة قبل الحركة.
function slideTo(page, dir){
    if(_animating || !_track) return;
    _mountIncoming(dir);
    if(!_inc) return;                 // لا صفحة في ذلك الاتجاه
    _animating = true;
    void _track.offsetWidth;
    _setX(dir*_vw(), SNAP_MS);
    setTimeout(()=>{ _animating=false; curPage=page; renderPage(page); if(window.HAP)HAP.light(); }, SNAP_MS);
}

function initPager(el){
    _pagerEl = el;
    _track = el.querySelector('.msf-track');
    _inc = null; _dx=0; _axis=null; _dragging=false; _animating=false;
    if(_track){ _track.style.transition='none'; _track.style.transform='translate3d(0,0,0)'; }
    if(el._pagerBound) return; el._pagerBound = true;

    el.addEventListener('touchstart', e=>{
        if(_animating) return;
        const t=e.changedTouches[0];
        _px=t.clientX; _py=t.clientY; _pt=Date.now(); _dx=0; _axis=null; _dragging=true; _panned=false;
    }, {passive:true});
    el.addEventListener('touchmove', e=>{
        const t=e.changedTouches[0]; _move(t.clientX, t.clientY, e);
    }, {passive:false});
    el.addEventListener('touchend', e=>{
        const t=e.changedTouches[0], dt=Date.now()-_pt;
        if(_axis==='x'){
            // اعتمد موضع الإفلات نفسه: لو رجع الإصبع أدراجه قبل الرفع
            // لكان آخر touchmove مضلّلاً فينتقل رغم عدوله.
            const dx=t.clientX-_px, dir=dx>0?1:-1;
            _dx = _canGo(dir) ? dx : dx*0.28;
            _release();
        }
        else if(!_panned){ _tap(t.clientX, t.clientY, dt); }
        _dragging=false; _axis=null;
    }, {passive:true});
    el.addEventListener('touchcancel', ()=>{ if(_axis==='x') _release(); _dragging=false; _axis=null; }, {passive:true});

    // دعم الماوس (للتجربة على سطح المكتب)
    let md=false;
    el.addEventListener('mousedown', e=>{
        if(_animating) return;
        md=true; _px=e.clientX; _py=e.clientY; _pt=Date.now(); _dx=0; _axis=null; _dragging=true; _panned=false;
    });
    window.addEventListener('mousemove', e=>{ if(md) _move(e.clientX, e.clientY, null); });
    window.addEventListener('mouseup', e=>{
        if(!md) return; md=false;
        const dt=Date.now()-_pt;
        if(_axis==='x'){ _release(); } else if(!_panned){ _tap(e.clientX, e.clientY, dt); }
        _dragging=false; _axis=null;
    });

    // امنع فتح تفسير الآية إذا كانت الإيماءة سحباً لا نقرة
    el.addEventListener('click', e=>{
        if(_panned){ e.stopPropagation(); e.preventDefault(); _panned=false; }
    }, true);
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
    try{ if(window.AnwarFollow) AnwarFollow.stop(); }catch(e){}
    window._activeKhatma = null;
    document.body.classList.remove('reading-fullscreen');
    document.body.classList.remove('reading-immersive');
    if (typeof _origClose==='function') _origClose();
    const qs=$('quran-search-wrap'); if(qs) qs.style.display='flex';
    const bar=$('msf-bar'); if(bar) bar.style.display='none';
};

function init(){ MUSHAF.renderSurahList(); MUSHAF.renderJuzList(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(init, 650));
else setTimeout(init, 650);
})();
