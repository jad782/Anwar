// =======================================================
//  features.js — مميزات متقدّمة لتطبيق الأنوار
//  يعتمد على دوال app.js العامة (fetchOffline, t, currentLang, CUR_READ ...)
// =======================================================
(function(){
'use strict';
const L = () => (typeof currentLang !== 'undefined' ? currentLang : 'ar');
const tr = (ar, en) => (L() === 'en' ? en : ar);
const $ = id => document.getElementById(id);

// =======================================================
// أدوات مساعدة: حقن عناصر مرة واحدة
// =======================================================
function injectReadingToolbar(){
    if ($('reading-toolbar')) return;
    const host = $('reading-view'); if(!host) return;
    const bar = document.createElement('div');
    bar.id = 'reading-toolbar';
    bar.className = 'reading-toolbar';
    bar.innerHTML = `
      <button class="rt-btn" id="rt-play" onclick="QA.toggleRecite()"><i class="fa-solid fa-play"></i><span>${tr('تلاوة','Recite')}</span></button>
      <button class="rt-btn" id="rt-memorize" onclick="QA.toggleMemorize()"><i class="fa-solid fa-graduation-cap"></i><span>${tr('حفظ','Memorize')}</span></button>
      <button class="rt-btn" id="rt-download" onclick="QA.downloadSurahAudio()" title="${tr('تحميل للاستماع بدون نت','Download for offline')}"><i class="fa-solid fa-download"></i></button>
      <button class="rt-btn" id="rt-tajweed" onclick="PRO2&&PRO2.toggleTajweed()" title="${tr('تلوين التجويد','Tajweed colors')}"><i class="fa-solid fa-palette"></i><span>${tr('تجويد','Tajweed')}</span></button>
      <button class="rt-btn" id="rt-translate" onclick="PRO2&&PRO2.toggleTranslation()" title="${tr('ترجمة ونطق','Translation')}"><i class="fa-solid fa-language"></i><span>${tr('ترجمة','Translate')}</span></button>
      <button class="rt-btn" id="rt-record" onclick="PRO2&&PRO2.toggleRecord()" title="${tr('سجّل تلاوتك','Record your recitation')}"><i class="fa-solid fa-microphone"></i></button>
      <select class="rt-reciter" id="rt-reciter" onchange="QA.changeReciter()">
        <option value="ar.alafasy">العفاسي</option>
        <option value="ar.husary">الحصري</option>
        <option value="ar.abdulbasitmurattal">عبد الباسط</option>
        <option value="ar.minshawi">المنشاوي</option>
        <option value="ar.mahermuaiqly">المعيقلي</option>
      </select>`;
    const headerEl = host.querySelector('.reading-header');
    headerEl.insertAdjacentElement('afterend', bar);
}

// =======================================================
// (1) التلاوة الصوتية مع تظليل الآية + التمرير التلقائي
// =======================================================
let reciteAudio = new Audio();
let reciteList = [];      // [{global, surah, ayah, url}]
let reciteIdx = -1;
let reciteOn = false;
let reciteEdition = localStorage.getItem('reciter') || 'ar.alafasy';
if (reciteEdition.indexOf('mp3quran:') === 0) { reciteEdition = 'ar.alafasy'; localStorage.setItem('reciter','ar.alafasy'); } // إزالة قارئ غير مرخّص

// قرّاء بالسورة الكاملة (بدون تظليل آية-آية)
const FULL_SURAH_RECITERS = { 'mp3quran:islam': 'https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/' };
function isFullSurahReciter(ed){ return ed && ed.indexOf('mp3quran:') === 0; }

async function loadReciteData(){
    const cr = window.CUR_READ || {type:'surah', num:1};
    if (isFullSurahReciter(reciteEdition)){
        if (cr.type !== 'surah') { const e = new Error('surah-only'); e.code = 'surah-only'; throw e; }
        const base = FULL_SURAH_RECITERS[reciteEdition];
        const n = String(cr.num).padStart(3, '0');
        reciteList = [{ global:null, surah:cr.num, ayah:null, url: base + n + '.mp3', full:true }];
        return;
    }
    const data = await fetchOffline(`https://api.alquran.cloud/v1/${cr.type}/${cr.num}/${reciteEdition}`);
    const ayahs = data.data.ayahs || data.data;
    reciteList = ayahs.map(a => ({ global:a.number, surah:(a.surah?a.surah.number:(data.data.number||cr.num)), ayah:a.numberInSurah, url:a.audio }));
}
window.QA = window.QA || {};
QA.toggleRecite = async function(){
    if (reciteOn){ QA.stopRecite(); return; }
    try {
        $('rt-play').innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>...</span>`;
        if (!reciteList.length) await loadReciteData();
        reciteOn = true; reciteIdx = 0; playReciteAt(0);
        $('rt-play').innerHTML = `<i class="fa-solid fa-pause"></i><span>${tr('إيقاف','Pause')}</span>`;
    } catch(e){
        $('rt-play').innerHTML = `<i class="fa-solid fa-play"></i><span>${tr('تلاوة','Recite')}</span>`;
        if (e && e.code === 'surah-only') alert(tr('قارئ السورة الكاملة (إسلام صبحي) يعمل عند فتح سورة من قائمة "السور".','This full-surah reciter works when you open a Surah from the Surahs list.'));
        else alert(tr('تعذّر تحميل التلاوة، تأكد من الإنترنت.','Could not load recitation.'));
    }
};
function playReciteAt(i){
    if (i < 0 || i >= reciteList.length){ QA.stopRecite(); return; }
    reciteIdx = i;
    const item = reciteList[i];
    document.querySelectorAll('.ayah.reciting').forEach(el => el.classList.remove('reciting'));
    const el = document.querySelector(`.ayah[data-global="${item.global}"]`);
    if (el){ el.classList.add('reciting'); el.scrollIntoView({behavior:'smooth', block:'center'}); }
    playAudioSrc(item);
    setReciteMediaSession(item);
}
// (2) تشغيل بالخلفية: استخدم النسخة المحمّلة إن وُجدت، وإلا الشبكة
async function playAudioSrc(item){
    try {
        if (window.PRO && PRO.getCachedAudio){
            const blobUrl = await PRO.getCachedAudio(item.url);
            if (blobUrl){ reciteAudio.src = blobUrl; reciteAudio.play().catch(()=>{}); return; }
        }
    } catch(e){}
    reciteAudio.src = item.url; reciteAudio.play().catch(()=>{});
}
function reciterLabel(){ const o=$('rt-reciter'); return o ? o.options[o.selectedIndex].textContent.replace('🎧','').trim() : 'تلاوة'; }
function setReciteMediaSession(item){
    if (!('mediaSession' in navigator)) return;
    try {
        const sName = (typeof surahName==='function' && item.surah) ? surahName(item.surah) : (window.CUR_READ?window.CUR_READ.name:'');
        navigator.mediaSession.metadata = new MediaMetadata({
            title: (L()==='en'?'Surah ':'سورة ') + sName,
            artist: reciterLabel(),
            album: tr('تطبيق الأنوار','Al-Anwar'),
            artwork: [{ src:'icon-512.jpg', sizes:'512x512', type:'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', () => { reciteAudio.play(); navigator.mediaSession.playbackState='playing'; });
        navigator.mediaSession.setActionHandler('pause', () => { reciteAudio.pause(); navigator.mediaSession.playbackState='paused'; });
        navigator.mediaSession.setActionHandler('nexttrack', () => { if(reciteOn) playReciteAt(reciteIdx+1); });
        navigator.mediaSession.setActionHandler('previoustrack', () => { if(reciteOn && reciteIdx>0) playReciteAt(reciteIdx-1); });
        navigator.mediaSession.playbackState = 'playing';
    } catch(e){}
}
reciteAudio.onended = () => { if (reciteOn) playReciteAt(reciteIdx + 1); };
reciteAudio.onerror = () => { if (reciteOn && isFullSurahReciter(reciteEdition)){ QA.stopRecite(); alert(tr('هذه السورة غير متوفّرة لهذا القارئ.','This surah is not available for this reciter.')); } };
QA.stopRecite = function(){
    reciteOn = false; reciteAudio.pause();
    document.querySelectorAll('.ayah.reciting').forEach(el => el.classList.remove('reciting'));
    const b = $('rt-play'); if (b) b.innerHTML = `<i class="fa-solid fa-play"></i><span>${tr('تلاوة','Recite')}</span>`;
};
QA.changeReciter = function(){
    reciteEdition = $('rt-reciter').value; localStorage.setItem('reciter', reciteEdition);
    reciteList = []; if (reciteOn) QA.stopRecite();
};
// (3) تحميل تلاوة السورة للاستماع بدون إنترنت
QA.downloadSurahAudio = async function(){
    if (!(window.PRO && PRO.cacheAudio)) { alert(tr('التحميل غير متاح.','Download unavailable.')); return; }
    const btn = $('rt-download'); const orig = btn.innerHTML;
    try {
        if (!reciteList.length) await loadReciteData();
        let done = 0;
        for (const item of reciteList){
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            await PRO.cacheAudio(item.url);
            done++;
        }
        btn.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#22c55e"></i>`;
        if (typeof showBadgeToast==='function') showBadgeToast({emoji:'⬇️', name:tr('تم التحميل','Downloaded'), desc:tr('يمكنك الآن الاستماع بدون إنترنت','You can now listen offline')});
        setTimeout(()=>{ btn.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#22c55e"></i>`; }, 100);
    } catch(e){ btn.innerHTML = orig; alert(tr('تعذّر التحميل، تأكد من الإنترنت.','Download failed.')); }
};

// =======================================================
// (2) وضع الحفظ: تكرار الآية + إخفاء الكلمات
// =======================================================
let memorizeOn = false;
QA.toggleMemorize = function(){
    memorizeOn = !memorizeOn;
    $('ayahs-container').classList.toggle('memorize-mode', memorizeOn);
    $('rt-memorize').classList.toggle('active', memorizeOn);
    if (memorizeOn) openMemorizePanel(); else { const p=$('memorize-panel'); if(p) p.remove(); }
};
function openMemorizePanel(){
    if ($('memorize-panel')) return;
    const bar = $('reading-toolbar');
    const p = document.createElement('div');
    p.id = 'memorize-panel'; p.className = 'memorize-panel';
    p.innerHTML = `
      <span>${tr('تكرار كل آية','Repeat each ayah')}</span>
      <select id="mem-repeat">
        <option value="1">1×</option><option value="3" selected>3×</option><option value="5">5×</option><option value="7">7×</option><option value="10">10×</option>
      </select>
      <label class="mem-blur"><input type="checkbox" id="mem-hide" onchange="QA.toggleHideWords()"> ${tr('إخفاء الكلمات','Hide words')}</label>
      <button class="rt-btn" onclick="QA.startMemorize()"><i class="fa-solid fa-repeat"></i> ${tr('ابدأ','Start')}</button>`;
    bar.insertAdjacentElement('afterend', p);
}
QA.toggleHideWords = function(){ $('ayahs-container').classList.toggle('hide-words', $('mem-hide').checked); };
let memRepeatLeft = 0;
QA.startMemorize = async function(){
    try{
        if (!reciteList.length) await loadReciteData();
        const reps = parseInt($('mem-repeat').value) || 3;
        reciteOn = true; reciteIdx = 0; memRepeatLeft = reps; window._memReps = reps;
        playReciteAt(0);
    }catch(e){ alert(tr('تعذّر تحميل التلاوة.','Could not load recitation.')); }
};
// تجاوز سلوك الانتهاء عند الحفظ: كرّر الآية قبل الانتقال
reciteAudio.addEventListener('ended', () => {
    if (memorizeOn && reciteOn){
        memRepeatLeft--;
        if (memRepeatLeft > 0){ playReciteAt(reciteIdx); }
        else { memRepeatLeft = window._memReps || 3; if (reciteIdx + 1 < reciteList.length) playReciteAt(reciteIdx + 1); else QA.stopRecite(); }
    }
}, true);

// =======================================================
// (3) التفسير + ترجمة المعاني عند الضغط على آية  (4) مشاركة كصورة  + تشغيل الآية
// =======================================================
window.onAyahTap = function(surah, ayah, global){
    if (memorizeOn) return; // في وضع الحفظ النقر يكشف الكلمات فقط (عبر CSS)
    openTafsir(surah, ayah, global);
};
let _tafsirCtx = null;
let _shareTpl = 0;
window.QA = window.QA || {};
QA.shareTpl = function(n){ _shareTpl = n; QA.shareAyahImage(); };
async function openTafsir(surah, ayah, global){
    ensureTafsirModal();
    _tafsirCtx = { surah, ayah, global };
    $('tafsir-title').innerText = `${tr('سورة','Surah')} ${surahNm(surah)} • ${tr('آية','Ayah')} ${ayah}`;
    $('tafsir-arabic').innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
    $('tafsir-tafsir').innerText = ''; $('tafsir-trans').innerText = '';
    $('tafsir-modal').classList.add('active');
    try{ let bms=JSON.parse(localStorage.getItem('bookmarks_v1')||'[]'); const saved=bms.some(b=>b.key===surah+':'+ayah); const bb=$('taf-bm-btn'); if(bb) bb.innerHTML = saved?`<i class="fa-solid fa-bookmark" style="color:var(--accent-color)"></i> ${tr('محفوظة','Saved')}`:`<i class="fa-regular fa-bookmark"></i> ${tr('حفظ','Save')}`; }catch(e){}
    try{
        const data = await fetchOffline(`https://api.alquran.cloud/v1/ayah/${global}/editions/quran-uthmani,ar.muyassar,en.sahih`);
        const eds = data.data;
        const byId = {}; eds.forEach(e => byId[e.edition.identifier] = e.text);
        $('tafsir-arabic').innerText = byId['quran-uthmani'] || '';
        $('tafsir-tafsir').innerText = byId['ar.muyassar'] || tr('التفسير غير متوفر','Tafsir unavailable');
        $('tafsir-trans').innerText = byId['en.sahih'] || '';
        _tafsirCtx.text = byId['quran-uthmani'] || '';
        _tafsirCtx.trans = byId['en.sahih'] || '';
        window._lastAyah = { surah, ayah, global, text:_tafsirCtx.text };
    }catch(e){ $('tafsir-arabic').innerText = tr('تعذّر التحميل','Failed to load'); }
}
function surahNm(n){ try { return surahName(n); } catch(e){ return n; } }
function ensureTafsirModal(){
    if ($('tafsir-modal')) return;
    const d = document.createElement('div');
    d.id = 'tafsir-modal'; d.className = 'qibla-overlay';
    d.innerHTML = `<div class="qibla-modal" style="width:94%; max-width:460px; text-align:right; padding:20px;">
        <button class="close-qibla" onclick="QA.closeTafsir()"><i class="fa-solid fa-xmark"></i></button>
        <h2 id="tafsir-title" style="color:var(--primary-color); font-size:1.05rem; margin-bottom:14px; text-align:center;"></h2>
        <div id="tafsir-arabic" class="tafsir-arabic"></div>
        <div class="tafsir-sec"><h4><i class="fa-solid fa-book-open"></i> ${tr('التدبّر — التفسير الميسّر','Tadabbur — Tafsir')}</h4><p id="tafsir-tafsir"></p></div>
        <div class="tafsir-sec"><h4>${tr('ترجمة المعاني (EN) — Saheeh','Translation (EN) — Saheeh')}</h4><p id="tafsir-trans" dir="ltr" style="text-align:left;"></p></div>
        <div class="tafsir-actions">
          <button class="rt-btn" onclick="QA.playSingleAyah()"><i class="fa-solid fa-volume-high"></i> ${tr('استماع','Listen')}</button>
          <button class="rt-btn" id="taf-bm-btn" onclick="QA.bookmarkAyah()"><i class="fa-regular fa-bookmark"></i> ${tr('حفظ','Save')}</button>
          <button class="rt-btn" onclick="QA.shareAyahImage()"><i class="fa-solid fa-image"></i> ${tr('مشاركة','Share')}</button>
        </div>
        <div class="share-tpl-row"><span>${tr('قالب الصورة:','Card style:')}</span>
          <button class="tpl-dot tpl-0" onclick="QA.shareTpl(0)" title="ليلي ذهبي"></button>
          <button class="tpl-dot tpl-1" onclick="QA.shareTpl(1)" title="زمرّدي"></button>
          <button class="tpl-dot tpl-2" onclick="QA.shareTpl(2)" title="فحمي"></button>
        </div>
    </div>`;
    document.body.appendChild(d);
}
QA.closeTafsir = function(){ const m=$('tafsir-modal'); if(m) m.classList.remove('active'); };
// (1) حفظ آية في المفضلة
QA.bookmarkAyah = function(){
    if(!_tafsirCtx) return;
    let bms = []; try{ bms = JSON.parse(localStorage.getItem('bookmarks_v1')||'[]'); }catch(e){}
    const key = _tafsirCtx.surah + ':' + _tafsirCtx.ayah;
    if (bms.some(b => b.key === key)){ bms = bms.filter(b => b.key !== key); }
    else { bms.unshift({ key, surah:_tafsirCtx.surah, ayah:_tafsirCtx.ayah, global:_tafsirCtx.global, text:(_tafsirCtx.text||'').slice(0,160), ts:Date.now() }); }
    localStorage.setItem('bookmarks_v1', JSON.stringify(bms));
    const btn = $('taf-bm-btn'); const saved = bms.some(b=>b.key===key);
    if(btn) btn.innerHTML = saved ? `<i class="fa-solid fa-bookmark" style="color:var(--accent-color)"></i> ${tr('محفوظة','Saved')}` : `<i class="fa-regular fa-bookmark"></i> ${tr('حفظ','Save')}`;
    if (typeof showBadgeToast==='function') showBadgeToast({emoji:'🔖', name:saved?tr('أُضيفت للمفضلة','Bookmarked'):tr('أُزيلت','Removed'), desc:`${tr('سورة','Surah')} ${surahNm(_tafsirCtx.surah)} : ${_tafsirCtx.ayah}`});
    if (window.PRO && PRO.refreshBookmarksBadge) PRO.refreshBookmarksBadge();
};
QA.playSingleAyah = async function(){
    if(!_tafsirCtx) return;
    try{ const data = await fetchOffline(`https://api.alquran.cloud/v1/ayah/${_tafsirCtx.global}/${reciteEdition}`); const a = new Audio(data.data.audio); a.play(); }catch(e){}
};

// (4) مشاركة الآية كصورة (Canvas)
QA.shareAyahImage = async function(){
    if(!_tafsirCtx) return;
    const tpl = (typeof _shareTpl==='number') ? _shareTpl : 0;
    const TPL = [
      { stops:['#2C1810','#4A2C1A','#6B3D20'], gold:'#D4A843', text:'#FAF6EE' },   // ليلي ذهبي
      { stops:['#0E2A20','#123A2C','#0E2A20'], gold:'#C9A227', text:'#EAF3EC' },   // زمرّدي
      { stops:['#14110B','#221C12','#14110B'], gold:'#E6BE5C', text:'#F2E8D6' }    // فحمي
    ][tpl] || {};
    const W=1080, H=1080;
    const c = document.createElement('canvas'); c.width=W; c.height=H;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,TPL.stops[0]); g.addColorStop(0.6,TPL.stops[1]); g.addColorStop(1,TPL.stops[2]);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // نقش زاوية خفيف
    ctx.strokeStyle=TPL.gold+'55'; ctx.lineWidth=4; ctx.strokeRect(50,50,W-100,H-100);
    ctx.strokeStyle=TPL.gold+'22'; ctx.lineWidth=2; ctx.strokeRect(66,66,W-132,H-132);
    ctx.fillStyle=TPL.gold; ctx.font='bold 44px Amiri, serif'; ctx.textAlign='center';
    ctx.fillText('﷽', W/2, 170);
    // نص الآية (التفاف)
    ctx.fillStyle=TPL.text; ctx.direction='rtl';
    const text = _tafsirCtx.text || '';
    wrapArabic(ctx, text, W/2, 380, W-220, 78, '64px Amiri, serif');
    // المرجع
    ctx.fillStyle=TPL.gold; ctx.font='bold 44px Tajawal, Cairo, sans-serif';
    ctx.fillText(`﴿ ${tr('سورة','')} ${surahNm(_tafsirCtx.surah)} : ${_tafsirCtx.ayah} ﴾`, W/2, H-180);
    ctx.fillStyle=TPL.text+'99'; ctx.font='32px Tajawal, Cairo, sans-serif';
    ctx.fillText(tr('تطبيق الأنوار','Al-Anwar App'), W/2, H-110);
    c.toBlob(async (blob) => {
        const file = new File([blob], 'ayah.png', {type:'image/png'});
        if (navigator.canShare && navigator.canShare({files:[file]})){
            try{ await navigator.share({files:[file], text: tr('من تطبيق الأنوار','From Al-Anwar')}); return; }catch(e){}
        }
        const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ayah.png'; a.click(); URL.revokeObjectURL(url);
    }, 'image/png');
};
function wrapArabic(ctx, text, cx, startY, maxW, lh, font){
    ctx.font = font;
    const words = text.split(' '); let line=''; let y=startY; const lines=[];
    for (const w of words){ const test = line ? line+' '+w : w; if (ctx.measureText(test).width > maxW && line){ lines.push(line); line=w; } else line=test; }
    if(line) lines.push(line);
    const maxLines = 7; const shown = lines.slice(0,maxLines);
    shown.forEach((ln,i)=> ctx.fillText(ln, cx, y + i*lh));
}

// =======================================================
// (5) بحث نصّي في القرآن
// =======================================================
function injectSearchBar(){
    if ($('quran-search-wrap')) return;
    const host = $('tab-surahs'); if(!host) return;
    const tabs = host.querySelector('.quran-tabs');
    const w = document.createElement('div');
    w.id = 'quran-search-wrap'; w.className='quran-search-wrap';
    w.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>
      <input id="quran-search-input" placeholder="${tr('ابحث في القرآن... مثال: الصبر','Search the Quran...')}" onkeydown="if(event.key==='Enter')QA.searchQuran()">
      <button onclick="QA.searchQuran()">${tr('بحث','Go')}</button>`;
    tabs.insertAdjacentElement('beforebegin', w);
    const res = document.createElement('div'); res.id='quran-search-results'; res.className='quran-search-results'; res.style.display='none';
    tabs.insertAdjacentElement('afterend', res);
}
QA.searchQuran = async function(){
    const q = $('quran-search-input').value.trim(); if(!q) return;
    const res = $('quran-search-results'); res.style.display='block';
    res.innerHTML = `<div style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
    $('surah-list').style.display='none'; $('juz-list').style.display='none';
    try{
        const r = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/quran-simple-clean`);
        const j = await r.json();
        if (!j.data || !j.data.matches || !j.data.matches.length){ res.innerHTML = `<p class="tasks-empty">${tr('لا نتائج','No results')}</p>`; return; }
        res.innerHTML = `<div class="search-head">${tr('النتائج','Results')}: ${j.data.count} — <button onclick="QA.clearSearch()">${tr('إغلاق','Close')}</button></div>` +
            j.data.matches.slice(0,40).map(m => `<div class="search-item" onclick="QA.goToResult(${m.surah.number},'${(m.surah.name||'').replace(/'/g,'')}')">
                <div class="search-ayah">${m.text}</div>
                <div class="search-ref">${m.surah.name} : ${m.numberInSurah}</div></div>`).join('');
    }catch(e){ res.innerHTML = `<p class="tasks-empty">${tr('تعذّر البحث، تأكد من الإنترنت.','Search failed.')}</p>`; }
};
QA.goToResult = function(num, name){ QA.clearSearch(); openFreeReading('surah', num, surahNm(num)); };
QA.clearSearch = function(){ $('quran-search-results').style.display='none'; $('quran-search-input').value=''; $('surah-list').style.display = document.getElementById('tab-btn-surahs').classList.contains('active')?'block':'none'; $('juz-list').style.display = document.getElementById('tab-btn-juzs').classList.contains('active')?'block':'none'; };

// =======================================================
// (7) الأذان الصوتي + تنبيه ما قبل الأذان
// =======================================================
const ATHAN_URL = './athan.mp3'; // محلّي — يعمل بدون إنترنت
let athanAudio = null;
const _athanFired = new Set();
function athanTicker(){
    setInterval(() => {
        if (typeof prayerTimings === 'undefined' || !prayerTimings.Fajr) return;
        if (localStorage.getItem('athanSound') !== 'true' && localStorage.getItem('preAthan') === null) return;
        const now = new Date(); const dk = now.toISOString().slice(0,10);
        const pre = parseInt(localStorage.getItem('preAthanMin')||'0');
        ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(k => {
            if(!prayerTimings[k]) return;
            const [h,m] = prayerTimings[k].split(':').map(Number);
            const tMin = h*60+m; const nMin = now.getHours()*60+now.getMinutes();
            // الأذان
            if (now.getHours()===h && now.getMinutes()===m && now.getSeconds()<2 && localStorage.getItem('athanSound')==='true'){
                const key = dk+'A'+k; if(!_athanFired.has(key)){ _athanFired.add(key); playAthan(); }
            }
            // تنبيه قبل الأذان
            if (pre>0 && nMin === tMin-pre && now.getSeconds()<2){
                const key = dk+'P'+k; if(!_athanFired.has(key)){ _athanFired.add(key); if(typeof showBadgeToast==='function') showBadgeToast({emoji:'🕌', name:tr('اقترب وقت الصلاة','Prayer approaching'), desc:`${tr('باقي','In')} ${pre} ${tr('دقيقة على','min to')} ${PRAYER_LABELS?PRAYER_LABELS[k]:k}`}); }
            }
        });
    }, 1000);
}
function playAthan(){ try{ if(!athanAudio) athanAudio = new Audio(ATHAN_URL); athanAudio.currentTime=0; athanAudio.play().catch(()=>{}); }catch(e){} }
QA.stopAthan = function(){ if(athanAudio){ athanAudio.pause(); } };

// =======================================================
// (8) القبلة بالكاميرا (AR)
// =======================================================
let arStream = null;
QA.openQiblaAR = async function(){
    ensureAROverlay();
    try{
        arStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
        $('ar-video').srcObject = arStream;
        $('qibla-ar-overlay').classList.add('active');
        if (typeof startCompass === 'function') startCompass();
    }catch(e){ alert(tr('تعذّر فتح الكاميرا.','Camera unavailable.')); }
};
QA.closeQiblaAR = function(){ if(arStream){ arStream.getTracks().forEach(t=>t.stop()); arStream=null; } const o=$('qibla-ar-overlay'); if(o) o.classList.remove('active'); };
function ensureAROverlay(){
    if ($('qibla-ar-overlay')) return;
    const d = document.createElement('div'); d.id='qibla-ar-overlay'; d.className='qibla-ar-overlay';
    d.innerHTML = `<video id="ar-video" autoplay playsinline muted></video>
      <div class="ar-arrow" id="ar-arrow">🕋<i class="fa-solid fa-location-arrow"></i></div>
      <button class="ar-close" onclick="QA.closeQiblaAR()"><i class="fa-solid fa-xmark"></i></button>
      <div class="ar-deg" id="ar-deg"></div>`;
    document.body.appendChild(d);
}
// نربط زر AR داخل مودال القبلة
function injectARButton(){
    const modal = document.querySelector('#qibla-overlay .qibla-modal'); if(!modal || $('qibla-ar-btn')) return;
    const b = document.createElement('button'); b.id='qibla-ar-btn'; b.className='tasbeeh-pill'; b.style.marginTop='10px';
    b.innerHTML = `<i class="fa-solid fa-camera"></i> ${tr('القبلة بالكاميرا','AR Camera')}`;
    b.onclick = QA.openQiblaAR; modal.appendChild(b);
}

// =======================================================
// (9) الإحصائيات الروحية الأسبوعية
// =======================================================
function recordTodayStats(){
    const dk = new Date().toISOString().slice(0,10);
    let hist = {}; try{ hist = JSON.parse(localStorage.getItem('spiritual_history')||'{}'); }catch(e){}
    const ach = JSON.parse(localStorage.getItem('achievements')||'{}');
    const tasks = JSON.parse(localStorage.getItem('task_status_v1')||'{}');
    const doneTasks = tasks.date===dk ? Object.values(tasks.done||{}).filter(Boolean).length : 0;
    hist[dk] = { score: ach.today===dk ? Math.round(((ach.morning||0)+(ach.evening||0)+(ach.quran||0)+(ach.tasbeeh||0))/4) : 0, tasks: doneTasks, tasbeeh: parseInt(localStorage.getItem('tasbeehCount')||'0') };
    // احتفظ بآخر 30 يوم
    const keys = Object.keys(hist).sort(); while(keys.length>30){ delete hist[keys.shift()]; }
    localStorage.setItem('spiritual_history', JSON.stringify(hist));
}
QA.openStats = function(){
    ensureStatsModal(); recordTodayStats();
    let hist = {}; try{ hist = JSON.parse(localStorage.getItem('spiritual_history')||'{}'); }catch(e){}
    const days = []; for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); days.push(d.toISOString().slice(0,10)); }
    const labelsAr = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const labelsEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const bars = days.map(dk => {
        const h = hist[dk]||{score:0,tasks:0}; const d=new Date(dk); const lbl = (L()==='en'?labelsEn:labelsAr)[d.getDay()];
        return `<div class="stat-bar-col"><div class="stat-bar"><div class="stat-bar-fill" style="height:${Math.max(4,h.score)}%"></div></div><span>${lbl}</span></div>`;
    }).join('');
    const totalTasbeeh = parseInt(localStorage.getItem('tasbeehCount')||'0');
    const streak = localStorage.getItem('streak_count')||'0';
    $('stats-body').innerHTML = `
      <div class="stats-bars">${bars}</div>
      <div class="stats-cards">
        <div class="stat-card"><strong>${streak}</strong><span>${tr('أيام متتالية','Day streak')}</span></div>
        <div class="stat-card"><strong>${totalTasbeeh}</strong><span>${tr('تسبيحة','Tasbeeh')}</span></div>
        <div class="stat-card"><strong>${Object.values(hist).reduce((a,b)=>a+(b.tasks||0),0)}</strong><span>${tr('مهمة مكتملة','Tasks done')}</span></div>
      </div>`;
    $('stats-modal').classList.add('active');
};
QA.closeStats = function(){ $('stats-modal').classList.remove('active'); };
function ensureStatsModal(){
    if ($('stats-modal')) return;
    const d = document.createElement('div'); d.id='stats-modal'; d.className='qibla-overlay';
    d.innerHTML = `<div class="qibla-modal" style="width:92%; max-width:420px;">
        <button class="close-qibla" onclick="QA.closeStats()"><i class="fa-solid fa-xmark"></i></button>
        <h2 style="color:var(--primary-color); margin-bottom:16px;">${tr('إحصائياتي الروحية','My Spiritual Stats')}</h2>
        <div id="stats-body"></div></div>`;
    document.body.appendChild(d);
}

// =======================================================
// (6) خطة الختمة الذكية  +  (10) مشاركة تقدّم الختمة
// =======================================================
function injectKhatmaPlan(){
    const modal = $('new-khatma-modal'); if(!modal || $('khatma-days-input')) return;
    const inp = document.createElement('input');
    inp.id='khatma-days-input'; inp.type='number'; inp.min='1'; inp.className='modal-input';
    inp.placeholder = tr('أريد أن أختم خلال (يوم) — اختياري','Finish within (days) — optional');
    const startInp = $('new-khatma-start');
    startInp.insertAdjacentElement('afterend', inp);
}
// نلتقط إنشاء الختمة لإضافة الخطة
const _origConfirm = window.confirmNewKhatma;
window.confirmNewKhatma = function(){
    const days = parseInt(($('khatma-days-input')||{}).value)||0;
    const start = parseInt(($('new-khatma-start')||{}).value)||1;
    if (typeof _origConfirm === 'function') _origConfirm();
    if (days>0){
        const remaining = 604 - start + 1;
        const perDay = Math.ceil(remaining/days);
        // خزّن الخطة بمفتاح منفصل حتى لا يصطدم بحفظ الختمات في app.js
        try{
            const name = (($('new-khatma-name')||{}).value||'').trim();
            const plans = JSON.parse(localStorage.getItem('khatma_plans')||'{}');
            plans[name] = { perDay, days, startedOn: new Date().toISOString().slice(0,10) };
            localStorage.setItem('khatma_plans', JSON.stringify(plans));
        }catch(e){}
        if (typeof showBadgeToast==='function') showBadgeToast({emoji:'📅', name:tr('خطة الختمة','Khatma plan'), desc:`${tr('اقرأ','Read')} ${perDay} ${tr('صفحة يومياً لتختم خلال','pages/day to finish in')} ${days} ${tr('يوم','days')}`});
    }
};
QA.shareKhatma = function(){
    let kh = []; try{ kh = JSON.parse(localStorage.getItem('khatmas_list')||'[]'); }catch(e){}
    if(!kh.length){ alert(tr('لا توجد ختمات.','No khatmas.')); return; }
    const k = kh[0]; const pct = Math.round(k.page/604*100);
    const msg = `${tr('ختمتي في تطبيق الأنوار','My Quran progress in Al-Anwar')}: ${k.name}\n${tr('صفحة','Page')} ${k.page}/604 (${pct}%) 📖\n${tr('شاركني الختمة!','Join me!')}`;
    if (navigator.share) navigator.share({text:msg}).catch(()=>{}); else { navigator.clipboard?.writeText(msg); alert(tr('تم نسخ التقدّم للمشاركة.','Progress copied.')); }
};

// =======================================================
// (11) حصن المسلم — أقسام: أذكار / أدعية / فضائل
// =======================================================
const MIHRAB = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21V11a5 5 0 0 1 10 0v10"/><path d="M5.5 21h13"/><path d="M13.4 6.6a2.3 2.3 0 1 0 .2 4 3 3 0 0 1-.2-4z"/><circle cx="15.4" cy="6.2" r="0.6" fill="currentColor"/></svg>`;

const ATHKAR_LIB = {
  athkar: { name:'الأذكار', en:'Athkar', cats:{
    morning:{ ar:'أذكار الصباح', en:'Morning', items:[
      {text:'آيَةُ الْكُرْسِيِّ: اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ', info:'من قالها حين يصبح أُجير من الجن حتى يمسي.', max:1, src:'النسائي وصححه الألباني'},
      {text:'قُلْ هُوَ اللَّهُ أَحَدٌ، وقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، وقُلْ أَعُوذُ بِرَبِّ النَّاسِ', info:'ثلاث مرات؛ كفته من كل شيء.', max:3, src:'أبو داود والترمذي'},
      {text:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', info:'', max:1, src:'مسلم'},
      {text:'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', info:'', max:1, src:'الترمذي'},
      {text:'سَيِّدُ الِاسْتِغْفَارِ: اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', info:'من قالها موقناً بها فمات من يومه دخل الجنة.', max:1, src:'البخاري'},
      {text:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', info:'مئة مرة؛ حُطّت خطاياه ولو كانت مثل زبد البحر.', max:100, src:'متفق عليه'},
    ]},
    evening:{ ar:'أذكار المساء', en:'Evening', items:[
      {text:'آية الكرسي والمعوذات الثلاث', info:'ثلاثاً.', max:3, src:'أبو داود والترمذي'},
      {text:'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', info:'', max:1, src:'مسلم'},
      {text:'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ', info:'', max:1, src:'الترمذي'},
      {text:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', info:'ثلاث مرات؛ لم يضره شيء.', max:3, src:'مسلم'},
    ]},
    postPrayer:{ ar:'أذكار بعد الصلاة', en:'After Prayer', items:[
      {text:'أَسْتَغْفِرُ اللَّهَ', info:'ثلاثاً بعد السلام.', max:3, src:'مسلم'},
      {text:'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', info:'', max:1, src:'مسلم'},
      {text:'سُبْحَانَ اللَّهِ (٣٣) الْحَمْدُ لِلَّهِ (٣٣) اللَّهُ أَكْبَرُ (٣٣)', info:'ثم تمام المئة: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.', max:1, src:'مسلم'},
      {text:'آية الكرسي', info:'من قرأها دبر كل صلاة لم يمنعه من الجنة إلا الموت.', max:1, src:'النسائي'},
    ]},
    sleep:{ ar:'أذكار النوم', en:'Sleep', items:[
      {text:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', info:'', max:1, src:'البخاري'},
      {text:'قراءة الإخلاص والفلق والناس والنفث في الكفين ومسح ما أقبل من الجسد', info:'ثلاث مرات.', max:3, src:'البخاري'},
      {text:'آية الكرسي', info:'لن يزال عليك من الله حافظ ولا يقربك شيطان حتى تصبح.', max:1, src:'البخاري'},
      {text:'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', info:'', max:3, src:'الترمذي'},
    ]},
    wake:{ ar:'أذكار الاستيقاظ', en:'Waking', items:[
      {text:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', info:'', max:1, src:'البخاري'},
      {text:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، الْحَمْدُ لِلَّهِ، وَسُبْحَانَ اللَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', info:'مَن تعارَّ من الليل (استيقظ) فقالها ثم دعا استُجيب له، فإن توضأ وصلّى قُبلت صلاته.', max:1, src:'البخاري'},
    ]},
    home:{ ar:'دخول وخروج المنزل', en:'Home', items:[
      {text:'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', info:'عند الخروج.', max:1, src:'أبو داود والترمذي'},
      {text:'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا', info:'عند الدخول.', max:1, src:'أبو داود'},
    ]},
    mosque:{ ar:'دخول وخروج المسجد', en:'Mosque', items:[
      {text:'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', info:'عند الدخول، ويقدّم رجله اليمنى.', max:1, src:'مسلم'},
      {text:'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', info:'عند الخروج، ويقدّم رجله اليسرى.', max:1, src:'مسلم'},
    ]},
    wudu:{ ar:'أذكار الوضوء', en:'Wudu', items:[
      {text:'بِسْمِ اللَّهِ', info:'قبل الوضوء.', max:1, src:'أبو داود'},
      {text:'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', info:'بعد الوضوء؛ فُتحت له أبواب الجنة الثمانية.', max:1, src:'مسلم'},
    ]},
    food:{ ar:'أذكار الطعام', en:'Food', items:[
      {text:'بِسْمِ اللَّهِ', info:'عند البدء؛ وإن نسي فليقل: بسم الله أوله وآخره.', max:1, src:'أبو داود والترمذي'},
      {text:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', info:'بعد الفراغ؛ غُفر له ما تقدّم من ذنبه.', max:1, src:'أبو داود والترمذي'},
    ]},
    distress:{ ar:'الكرب والهمّ', en:'Distress', items:[
      {text:'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ', info:'دعاء الكرب.', max:3, src:'متفق عليه'},
      {text:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', info:'', max:7, src:'البخاري'},
      {text:'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ', info:'', max:1, src:'أبو داود'},
    ]},
  }},
  duaa: { name:'الأدعية', en:"Du'a", cats:{
    istikhara:{ ar:'دعاء الاستخارة', en:'Istikharah', items:[
      {text:'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ، اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي — عَاجِلِهِ وَآجِلِهِ — فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ، وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي — عَاجِلِهِ وَآجِلِهِ — فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ ثُمَّ أَرْضِنِي بِهِ.', info:'يصلي ركعتين من غير الفريضة ثم يدعو بهذا الدعاء، وعند قوله «هذا الأمر» يسمّي حاجته.', max:1, src:'رواه البخاري (١١٦٦) عن جابر بن عبد الله رضي الله عنهما'},
    ]},
    travel:{ ar:'دعاء السفر', en:'Travel', items:[
      {text:'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ', info:'عند ركوب وسيلة السفر.', max:1, src:'مسلم'},
      {text:'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى', info:'', max:1, src:'مسلم'},
    ]},
    rain:{ ar:'دعاء نزول المطر', en:'Rain', items:[
      {text:'اللَّهُمَّ صَيِّبًا نَافِعًا', info:'عند نزول المطر.', max:1, src:'البخاري'},
      {text:'مُطِرْنَا بِفَضْلِ اللَّهِ وَرَحْمَتِهِ', info:'بعد المطر.', max:1, src:'البخاري'},
    ]},
    wind:{ ar:'دعاء الريح', en:'Wind', items:[
      {text:'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا وَخَيْرَ مَا فِيهَا وَخَيْرَ مَا أُرْسِلَتْ بِهِ، وَأَعُوذُ بِكَ مِنْ شَرِّهَا وَشَرِّ مَا فِيهَا وَشَرِّ مَا أُرْسِلَتْ بِهِ', info:'عند هبوب الريح.', max:1, src:'مسلم'},
    ]},
    market:{ ar:'دعاء دخول السوق', en:'Market', items:[
      {text:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ حَيٌّ لَا يَمُوتُ، بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', info:'كتب الله له ألف ألف حسنة.', max:1, src:'الترمذي'},
    ]},
    iftar:{ ar:'دعاء الإفطار', en:'Breaking fast', items:[
      {text:'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ', info:'عند الإفطار.', max:1, src:'أبو داود'},
    ]},
    hilal:{ ar:'دعاء رؤية الهلال', en:'New moon', items:[
      {text:'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ، وَالسَّلَامَةِ وَالْإِسْلَامِ، وَالتَّوْفِيقِ لِمَا تُحِبُّ وَتَرْضَى، رَبِّي وَرَبُّكَ اللَّهُ', info:'عند رؤية هلال الشهر.', max:1, src:'الترمذي'},
    ]},
    witr:{ ar:'دعاء القنوت', en:'Witr Qunut', items:[
      {text:'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، وَلَا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ', info:'في قنوت الوتر.', max:1, src:'أبو داود والترمذي'},
    ]},
  }},
  fadail: { name:'الفضائل', en:'Virtues', cats:{
    mulk:{ ar:'فضل سورة المُلك', en:'Al-Mulk', items:[
      {text:'سورة من القرآن ثلاثون آية شفعت لرجل حتى غُفر له، وهي: (تبارك الذي بيده الملك).', info:'تُقرأ كل ليلة.', max:1, src:'أبو داود والترمذي'},
    ]},
    kahf:{ ar:'فضل سورة الكهف', en:'Al-Kahf', items:[
      {text:'من قرأ سورة الكهف يوم الجمعة أضاء له من النور ما بين الجمعتين.', info:'', max:1, src:'الحاكم والبيهقي'},
      {text:'من حفظ عشر آيات من أول سورة الكهف عُصم من الدجال.', info:'', max:1, src:'مسلم'},
    ]},
    kursi:{ ar:'فضل آية الكرسي', en:'Ayat al-Kursi', items:[
      {text:'من قرأ آية الكرسي دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت.', info:'', max:1, src:'النسائي'},
    ]},
    ikhlas:{ ar:'فضل الإخلاص والمعوذتين', en:'Al-Ikhlas', items:[
      {text:'قل هو الله أحد تعدل ثلث القرآن.', info:'', max:1, src:'البخاري'},
      {text:'المعوّذتان: ما تعوّذ متعوّذ بمثلهما.', info:'', max:1, src:'مسلم'},
    ]},
    tasbeeh:{ ar:'فضل التسبيح والتحميد', en:'Tasbeeh', items:[
      {text:'كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن: سبحان الله وبحمده، سبحان الله العظيم.', info:'', max:1, src:'متفق عليه'},
      {text:'من قال: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، في يوم مئة مرة؛ كانت له عدل عشر رقاب، وكُتبت له مئة حسنة، ومُحيت عنه مئة سيئة، وكانت له حِرزًا من الشيطان يومه ذلك حتى يمسي.', info:'', max:1, src:'متفق عليه'},
    ]},
    salah_nabi:{ ar:'فضل الصلاة على النبي ﷺ', en:'Salah on Prophet', items:[
      {text:'من صلّى عليّ صلاةً صلّى الله عليه بها عشرًا.', info:'أكثر منها يوم الجمعة.', max:1, src:'مسلم'},
    ]},
  }},
};

// ===== توسعة: مزيد من الأذكار والأدعية والفضائل (مصادر موثوقة) =====
Object.assign(ATHKAR_LIB.athkar.cats, {
  tasabeeh:{ ar:'تسابيح وأذكار عامّة', en:'General Dhikr', items:[
    {text:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ', info:'حبيبتان إلى الرحمن، ثقيلتان في الميزان.', max:33, src:'متفق عليه'},
    {text:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', info:'مئة مرة في اليوم.', max:100, src:'متفق عليه'},
    {text:'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', info:'كان ﷺ يستغفر في اليوم أكثر من سبعين مرة.', max:100, src:'البخاري'},
    {text:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', info:'كنز من كنوز الجنة.', max:10, src:'متفق عليه'},
    {text:'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ', info:'أحبّ الكلام إلى الله.', max:10, src:'مسلم'},
  ]},
  toilet:{ ar:'دخول وخروج الخلاء', en:'Toilet', items:[
    {text:'بِسْمِ اللَّهِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', info:'قبل الدخول.', max:1, src:'متفق عليه'},
    {text:'غُفْرَانَكَ', info:'عند الخروج.', max:1, src:'أبو داود والترمذي'},
  ]},
  clothing:{ ar:'لُبس الثوب', en:'Clothing', items:[
    {text:'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا الثَّوْبَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', info:'غُفر له ما تقدّم من ذنبه.', max:1, src:'أبو داود والترمذي'},
  ]},
  sneeze:{ ar:'العُطاس', en:'Sneezing', items:[
    {text:'الْحَمْدُ لِلَّهِ', info:'يقولها العاطس.', max:1, src:'البخاري'},
    {text:'يَرْحَمُكَ اللَّهُ', info:'يقولها من سمع الحمد.', max:1, src:'البخاري'},
    {text:'يَهْدِيكُمُ اللَّهُ وَيُصْلِحُ بَالَكُمْ', info:'يردّ العاطس على من شمّته.', max:1, src:'البخاري'},
  ]},
  anger:{ ar:'عند الغضب', en:'Anger', items:[
    {text:'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', info:'تذهب عنه شدّة الغضب.', max:1, src:'متفق عليه'},
  ]},
});
Object.assign(ATHKAR_LIB.duaa.cats, {
  istighfar:{ ar:'الاستغفار والتوبة', en:'Forgiveness', items:[
    {text:'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', info:'', max:1, src:'أبو داود والترمذي'},
  ]},
  parents:{ ar:'الدعاء للوالدين', en:'For Parents', items:[
    {text:'﴿رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا﴾', info:'', max:1, src:'الإسراء: 24'},
  ]},
  hamm:{ ar:'الهمّ والحزن', en:'Anxiety & Grief', items:[
    {text:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', info:'', max:1, src:'البخاري'},
    {text:'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', info:'دعوة ذي النون، ما دعا بها مكروب إلا فرّج الله عنه.', max:3, src:'الترمذي'},
  ]},
  debt:{ ar:'قضاء الدَّيْن', en:'Debt', items:[
    {text:'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', info:'', max:1, src:'الترمذي'},
  ]},
  sick:{ ar:'عيادة المريض', en:'Visiting the Sick', items:[
    {text:'لَا بَأْسَ طَهُورٌ إِنْ شَاءَ اللَّهُ', info:'', max:1, src:'البخاري'},
    {text:'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ', info:'سبع مرات؛ عُوفِيَ بإذن الله.', max:7, src:'أبو داود والترمذي'},
  ]},
  fear:{ ar:'الخوف من ظالم', en:'Fear of Oppressor', items:[
    {text:'اللَّهُمَّ إِنَّا نَجْعَلُكَ فِي نُحُورِهِمْ، وَنَعُوذُ بِكَ مِنْ شُرُورِهِمْ', info:'', max:1, src:'أبو داود'},
  ]},
  jawami:{ ar:'جوامع الدعاء', en:'Comprehensive Du\'a', items:[
    {text:'﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾', info:'كان أكثر دعائه ﷺ.', max:1, src:'البقرة: 201'},
    {text:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', info:'', max:1, src:'مسلم'},
  ]},
  knowledge:{ ar:'طلب العلم', en:'Knowledge', items:[
    {text:'﴿رَّبِّ زِدْنِي عِلْمًا﴾', info:'', max:1, src:'طه: 114'},
    {text:'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا', info:'', max:1, src:'الترمذي وابن ماجه'},
  ]},
});
// توسعة الأدعية (قرآنية ونبوية موثّقة)
Object.assign(ATHKAR_LIB.duaa.cats, {
  quraniyah:{ ar:'أدعية قرآنية', en:'Quranic Du\'as', items:[
    {text:'﴿رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا﴾', info:'', max:1, src:'البقرة: 286'},
    {text:'﴿رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً﴾', info:'', max:1, src:'آل عمران: 8'},
    {text:'﴿رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا﴾', info:'', max:1, src:'آل عمران: 147'},
    {text:'﴿رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ﴾', info:'', max:1, src:'إبراهيم: 40'},
    {text:'﴿رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ﴾', info:'', max:1, src:'إبراهيم: 41'},
    {text:'﴿رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ﴾', info:'', max:1, src:'النمل: 19'},
    {text:'﴿رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا﴾', info:'', max:1, src:'الفرقان: 74'},
    {text:'﴿رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ﴾', info:'', max:1, src:'البقرة: 250'},
    {text:'﴿رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي﴾', info:'', max:1, src:'طه: 25-27'},
    {text:'﴿رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ﴾', info:'', max:1, src:'البقرة: 127'},
    {text:'﴿رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ﴾', info:'', max:1, src:'الأنبياء: 89'},
    {text:'﴿رَبَّنَا عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ الْمَصِيرُ﴾', info:'', max:1, src:'الممتحنة: 4'},
    {text:'﴿رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا﴾', info:'', max:1, src:'الكهف: 10'},
    {text:'﴿رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ وَاجْعَل لِّي مِن لَّدُنكَ سُلْطَانًا نَّصِيرًا﴾', info:'', max:1, src:'الإسراء: 80'},
  ]},
  nabawiyah:{ ar:'أدعية نبوية جامعة', en:'Prophetic Du\'as', items:[
    {text:'اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي', info:'', max:1, src:'مسلم'},
    {text:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', info:'', max:1, src:'ابن ماجه'},
    {text:'اللَّهُمَّ اقْسِمْ لَنَا مِنْ خَشْيَتِكَ مَا تَحُولُ بِهِ بَيْنَنَا وَبَيْنَ مَعَاصِيكَ', info:'', max:1, src:'الترمذي'},
    {text:'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', info:'أوصى بها النبي ﷺ دبر كل صلاة.', max:1, src:'أبو داود والنسائي'},
    {text:'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ', info:'', max:1, src:'الترمذي'},
    {text:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ', info:'', max:1, src:'أبو داود'},
    {text:'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا', info:'', max:1, src:'ابن ماجه'},
  ]},
  rizq:{ ar:'الرزق والبركة', en:'Provision', items:[
    {text:'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ وَرَحْمَتِكَ، فَإِنَّهُ لَا يَمْلِكُهَا إِلَّا أَنْتَ', info:'', max:1, src:'الطبراني'},
    {text:'﴿رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ﴾', info:'دعاء موسى عليه السلام.', max:1, src:'القصص: 24'},
  ]},
  thabat:{ ar:'الثبات وحسن الخاتمة', en:'Steadfastness', items:[
    {text:'يَا مُقَلِّبَ الْقُلُوبِ وَالْأَبْصَارِ ثَبِّتْ قُلُوبَنَا عَلَى دِينِكَ', info:'', max:1, src:'مسلم'},
    {text:'اللَّهُمَّ اجْعَلْ خَيْرَ عُمُرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَوَاتِمَهُ، وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ', info:'', max:1, src:'صحيح الجامع'},
  ]},
  fadl_dua:{ ar:'فضل الدعاء', en:'Virtue of Du\'a', items:[
    {text:'الدُّعَاءُ هُوَ الْعِبَادَةُ.', info:'', max:1, src:'الترمذي'},
    {text:'لَيْسَ شَيْءٌ أَكْرَمَ عَلَى اللَّهِ تَعَالَى مِنَ الدُّعَاءِ.', info:'', max:1, src:'الترمذي'},
  ]},
});
Object.assign(ATHKAR_LIB.fadail.cats, {
  fatiha:{ ar:'فضل سورة الفاتحة', en:'Al-Fatihah', items:[
    {text:'فاتحة الكتاب هي أعظم سورة في القرآن، وهي السبع المثاني والقرآن العظيم.', info:'', max:1, src:'البخاري'},
  ]},
  baqarah:{ ar:'فضل سورة البقرة', en:'Al-Baqarah', items:[
    {text:'اقْرَؤُوا سُورَةَ الْبَقَرَةِ؛ فَإِنَّ أَخْذَهَا بَرَكَةٌ وَتَرْكَهَا حَسْرَةٌ، وَلَا تَسْتَطِيعُهَا الْبَطَلَةُ (السحرة).', info:'', max:1, src:'مسلم'},
    {text:'لَا تَجْعَلُوا بُيُوتَكُمْ مَقَابِرَ؛ إِنَّ الْبَيْتَ الَّذِي تُقْرَأُ فِيهِ سُورَةُ الْبَقَرَةِ لَا يَدْخُلُهُ الشَّيْطَانُ.', info:'', max:1, src:'مسلم'},
  ]},
  baqarah_end:{ ar:'فضل آخر آيتين من البقرة', en:'Last 2 of Al-Baqarah', items:[
    {text:'مَنْ قَرَأَ بِالْآيَتَيْنِ مِنْ آخِرِ سُورَةِ الْبَقَرَةِ فِي لَيْلَةٍ كَفَتَاهُ.', info:'', max:1, src:'متفق عليه'},
  ]},
  dhikr_fadl:{ ar:'فضل ذِكر الله', en:'Virtue of Dhikr', items:[
    {text:'مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لَا يَذْكُرُ رَبَّهُ مَثَلُ الْحَيِّ وَالْمَيِّتِ.', info:'', max:1, src:'البخاري'},
  ]},
});
// توسعة الفضائل (موثّقة)
Object.assign(ATHKAR_LIB.fadail.cats, {
  muawwidhat:{ ar:'فضل المعوّذتين', en:'Al-Mu\'awwidhatayn', items:[
    {text:'أَلَمْ تَرَ آيَاتٍ أُنْزِلَتِ اللَّيْلَةَ لَمْ يُرَ مِثْلُهُنَّ قَطُّ: قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، وَقُلْ أَعُوذُ بِرَبِّ النَّاسِ.', info:'', max:1, src:'مسلم'},
  ]},
  quran:{ ar:'فضل قراءة القرآن', en:'Reciting the Quran', items:[
    {text:'اقْرَؤُوا الْقُرْآنَ؛ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ.', info:'', max:1, src:'مسلم'},
    {text:'الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ، وَالَّذِي يَقْرَؤُهُ وَيَتَتَعْتَعُ فِيهِ لَهُ أَجْرَانِ.', info:'', max:1, src:'متفق عليه'},
    {text:'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا.', info:'', max:1, src:'الترمذي'},
  ]},
  salah:{ ar:'فضل الصلاة', en:'Prayer', items:[
    {text:'الصَّلَوَاتُ الْخَمْسُ، وَالْجُمُعَةُ إِلَى الْجُمُعَةِ، كَفَّارَاتٌ لِمَا بَيْنَهُنَّ مَا اجْتُنِبَتِ الْكَبَائِرُ.', info:'', max:1, src:'مسلم'},
    {text:'أَوَّلُ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ الصَّلَاةُ.', info:'', max:1, src:'الترمذي والنسائي'},
  ]},
  fajr_asr:{ ar:'فضل الفجر والعصر', en:'Fajr & Asr', items:[
    {text:'مَنْ صَلَّى الْبَرْدَيْنِ (الفجر والعصر) دَخَلَ الْجَنَّةَ.', info:'', max:1, src:'متفق عليه'},
    {text:'مَنْ صَلَّى الصُّبْحَ فِي جَمَاعَةٍ ثُمَّ قَعَدَ يَذْكُرُ اللَّهَ حَتَّى تَطْلُعَ الشَّمْسُ ثُمَّ صَلَّى رَكْعَتَيْنِ كَانَتْ لَهُ كَأَجْرِ حَجَّةٍ وَعُمْرَةٍ تَامَّةٍ.', info:'', max:1, src:'الترمذي'},
  ]},
  jumuah:{ ar:'فضل يوم الجمعة', en:'Friday', items:[
    {text:'خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ.', info:'', max:1, src:'مسلم'},
    {text:'مَنِ اغْتَسَلَ يَوْمَ الْجُمُعَةِ وَبَكَّرَ وَابْتَكَرَ، وَمَشَى وَلَمْ يَرْكَبْ، كَانَ لَهُ بِكُلِّ خُطْوَةٍ أَجْرُ سَنَةٍ.', info:'', max:1, src:'أهل السنن'},
  ]},
  siyam:{ ar:'فضل الصيام', en:'Fasting', items:[
    {text:'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ.', info:'', max:1, src:'متفق عليه'},
    {text:'الصِّيَامُ جُنَّةٌ.', info:'', max:1, src:'متفق عليه'},
  ]},
  sadaqah:{ ar:'فضل الصدقة', en:'Charity', items:[
    {text:'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ.', info:'', max:1, src:'مسلم'},
    {text:'الصَّدَقَةُ تُطْفِئُ الْخَطِيئَةَ كَمَا يُطْفِئُ الْمَاءُ النَّارَ.', info:'', max:1, src:'الترمذي'},
  ]},
  istighfar_fadl:{ ar:'فضل الاستغفار', en:'Istighfar', items:[
    {text:'مَنْ لَزِمَ الِاسْتِغْفَارَ جَعَلَ اللَّهُ لَهُ مِنْ كُلِّ ضِيقٍ مَخْرَجًا، وَمِنْ كُلِّ هَمٍّ فَرَجًا، وَرَزَقَهُ مِنْ حَيْثُ لَا يَحْتَسِبُ.', info:'', max:1, src:'أبو داود'},
  ]},
  hajj:{ ar:'فضل الحج', en:'Hajj', items:[
    {text:'مَنْ حَجَّ فَلَمْ يَرْفُثْ وَلَمْ يَفْسُقْ رَجَعَ كَيَوْمِ وَلَدَتْهُ أُمُّهُ.', info:'', max:1, src:'متفق عليه'},
  ]},
  walidayn:{ ar:'فضل برّ الوالدين', en:'Parents', items:[
    {text:'رِضَا الرَّبِّ فِي رِضَا الْوَالِدِ، وَسَخَطُ الرَّبِّ فِي سَخَطِ الْوَالِدِ.', info:'', max:1, src:'الترمذي'},
  ]},
  rahm:{ ar:'فضل صلة الرحم', en:'Kinship Ties', items:[
    {text:'مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ.', info:'', max:1, src:'متفق عليه'},
  ]},
  khuluq:{ ar:'فضل حسن الخلق', en:'Good Character', items:[
    {text:'أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا.', info:'', max:1, src:'الترمذي'},
    {text:'إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ أَحَاسِنَكُمْ أَخْلَاقًا.', info:'', max:1, src:'البخاري'},
  ]},
  masjid:{ ar:'فضل المساجد', en:'Mosques', items:[
    {text:'مَنْ غَدَا إِلَى الْمَسْجِدِ أَوْ رَاحَ أَعَدَّ اللَّهُ لَهُ نُزُلَهُ مِنَ الْجَنَّةِ كُلَّمَا غَدَا أَوْ رَاحَ.', info:'', max:1, src:'متفق عليه'},
  ]},
  wudu_fadl:{ ar:'فضل الوضوء', en:'Wudu', items:[
    {text:'إِذَا تَوَضَّأَ الْعَبْدُ الْمُسْلِمُ فَغَسَلَ وَجْهَهُ خَرَجَتْ مِنْ وَجْهِهِ كُلُّ خَطِيئَةٍ نَظَرَ إِلَيْهَا بِعَيْنَيْهِ مَعَ الْمَاءِ.', info:'', max:1, src:'مسلم'},
  ]},
});

let _athkarSection = 'athkar';
let _hisnState = [];
let _curCatTitle = '';

function rebuildAthkarCategories(){
    const list = $('athkar-categories-list'); if(!list) return;
    // شريط الأقسام (مرة واحدة)
    if (!$('athkar-sections')){
        const seg = document.createElement('div'); seg.id='athkar-sections'; seg.className='athkar-sections';
        seg.innerHTML = Object.keys(ATHKAR_LIB).map(s => `<button class="ath-seg" data-sec="${s}" onclick="QA.switchAthkarSection('${s}')">${L()==='en'?ATHKAR_LIB[s].en:ATHKAR_LIB[s].name}</button>`).join('');
        list.insertAdjacentElement('beforebegin', seg);
    } else {
        $('athkar-sections').querySelectorAll('.ath-seg').forEach(b => { b.innerText = L()==='en'?ATHKAR_LIB[b.dataset.sec].en:ATHKAR_LIB[b.dataset.sec].name; });
    }
    $('athkar-sections').querySelectorAll('.ath-seg').forEach(b => b.classList.toggle('active', b.dataset.sec === _athkarSection));
    const cats = ATHKAR_LIB[_athkarSection].cats;
    list.innerHTML = Object.keys(cats).map(k => {
        const c = cats[k];
        return `<div class="athkar-cat-card" onclick="QA.openCat('${_athkarSection}','${k}')">
            <div class="athkar-cat-icon">${MIHRAB}</div>
            <h3>${L()==='en'?c.en:c.ar}</h3>
            <i class="fa-solid fa-chevron-left ath-chevron"></i></div>`;
    }).join('');
}
QA.switchAthkarSection = function(sec){ _athkarSection = sec; rebuildAthkarCategories(); };

QA.openCat = function(sec, catKey){
    const c = ATHKAR_LIB[sec] && ATHKAR_LIB[sec].cats[catKey]; if(!c) return;
    _curCatTitle = L()==='en'?c.en:c.ar;
    $('athkar-categories-list').style.display='none';
    if ($('athkar-sections')) $('athkar-sections').style.display='none';
    $('athkar-reading-view').style.display='block';
    $('current-athkar-title').innerText = _curCatTitle;
    _hisnState = c.items.map(it => ({...it, current:0}));
    renderHisn();
};
// عند الرجوع من قارئ الأذكار، أعد إظهار شريط الأقسام
const _origCloseAth = window.closeAthkarCategory;
window.closeAthkarCategory = function(){ if(typeof _origCloseAth==='function') _origCloseAth(); if($('athkar-sections')) $('athkar-sections').style.display='flex'; };

function renderHisn(){
    const cont = $('athkar-items-container'); if(!cont) return;
    cont.innerHTML = _hisnState.map((th, i) => {
        const done = th.current >= th.max;
        return `<div class="theker-read-card theker-enter shine ${done?'completed':''}" style="animation-delay:${i*0.07}s" onclick="QA.incHisn(${i})">
            <div class="theker-count-pill">${done?'<i class="fa-solid fa-check"></i> '+tr('تم','Done'):`${th.current} ${tr('من','/')} ${th.max} ${tr('مرات','×')}`}</div>
            <div class="theker-text">${th.text}</div>
            ${th.info?`<div class="theker-info">${th.info}</div>`:''}
            <div class="theker-foot">
                ${th.src?`<span class="theker-src" onclick="event.stopPropagation();QA.showSrc(${i})"><i class="fa-solid fa-circle-check"></i> ${tr('المصدر','Source')}</span>`:'<span></span>'}
                <span class="theker-tap-hint"><i class="fa-solid fa-hand-pointer"></i> ${tr('اضغط للعدّ','Tap to count')}</span>
            </div></div>`;
    }).join('');
}
QA.incHisn = function(i){ if (_hisnState[i].current < _hisnState[i].max){ _hisnState[i].current++; renderHisn(); if(navigator.vibrate) navigator.vibrate(20); } };
QA.showSrc = function(i){ const th=_hisnState[i]; if(th&&th.src&&typeof showBadgeToast==='function') showBadgeToast({emoji:'📜', name:tr('المصدر','Source'), desc:th.src}); };

// بحث في الأذكار والأدعية (مع تطبيع التشكيل)
function normAr(s){ return (s||'').replace(/[ؗ-ًؚ-ْٰـ]/g,'').replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase(); }
function injectAthkarSearch(){
    if ($('athkar-search-wrap')) return;
    const cats = $('athkar-categories-list'); if(!cats) return;
    const w = document.createElement('div'); w.id='athkar-search-wrap'; w.className='quran-search-wrap';
    w.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i><input id="athkar-search-input" placeholder="${tr('ابحث عن ذكر أو دعاء...','Search dhikr or dua...')}" oninput="QA.searchAthkar()"><button id="athkar-search-clear" style="display:none" onclick="QA.clearAthkarSearch()">${tr('مسح','Clear')}</button>`;
    const anchor = $('athkar-sections') || cats;
    anchor.parentNode.insertBefore(w, anchor);
    const res = document.createElement('div'); res.id='athkar-search-results'; res.style.display='none';
    anchor.parentNode.insertBefore(res, anchor);
}
QA.searchAthkar = function(){
    const q = normAr($('athkar-search-input').value.trim());
    const res=$('athkar-search-results'), sec=$('athkar-sections'), cats=$('athkar-categories-list');
    $('athkar-search-clear').style.display = q?'block':'none';
    if (!q){ res.style.display='none'; res.innerHTML=''; if(sec)sec.style.display='flex'; cats.style.display='block'; return; }
    if(sec)sec.style.display='none'; cats.style.display='none'; res.style.display='block';
    const m=[];
    Object.keys(ATHKAR_LIB).forEach(s=>{ const cc=ATHKAR_LIB[s].cats; Object.keys(cc).forEach(k=>{ const c=cc[k]; (c.items||[]).forEach(it=>{ if(normAr(it.text).includes(q)||normAr(it.info).includes(q)||normAr(c.ar).includes(q)) m.push({c,it}); }); }); });
    if(!m.length){ res.innerHTML=`<p class="tasks-empty">${tr('لا نتائج مطابقة','No matches')}</p>`; return; }
    res.innerHTML = m.slice(0,50).map(({c,it})=>`<div class="theker-read-card shine theker-enter">
        <div class="theker-cat-tag">${L()==='en'?c.en:c.ar}</div>
        <div class="theker-text">${it.text}</div>
        ${it.info?`<div class="theker-info">${it.info}</div>`:''}
        ${it.src?`<div class="theker-foot"><span class="theker-src"><i class="fa-solid fa-circle-check"></i> ${it.src}</span><span></span></div>`:''}
    </div>`).join('');
};
QA.clearAthkarSearch = function(){ const i=$('athkar-search-input'); if(i)i.value=''; QA.searchAthkar(); };

// =======================================================
// لوحة الإعدادات الإضافية (صوت الأذان / تنبيه مسبق / إحصائيات)
// =======================================================
function injectExtraSettings(){
    const list = document.querySelector('#tab-settings .settings-list'); if(!list || $('athan-sound-toggle')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="set-group-title">${tr('صوت الأذان والإحصائيات','Athan Sound & Stats')}</div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-volume-high"></i></span><span class="set-label">${tr('صوت الأذان عند الوقت','Play Athan sound')}</span>
        <label class="switch"><input type="checkbox" id="athan-sound-toggle"><span class="slider round"></span></label></div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-hourglass-half"></i></span><span class="set-label">${tr('تنبيه قبل الأذان (دقائق)','Pre-Athan reminder (min)')}</span>
        <select id="pre-athan-select" class="rt-reciter">
          <option value="0">${tr('بدون','Off')}</option><option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="30">30</option></select></div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-hands-praying"></i></span><span class="set-label">${tr('تذكيرات الأذكار خلال اليوم','Daily dhikr reminders')}</span>
        <label class="switch"><input type="checkbox" id="dhikr-reminders-toggle"><span class="slider round"></span></label></div>
      <div class="setting-item" onclick="QA.openStats()"><span class="set-ico"><i class="fa-solid fa-chart-simple"></i></span><span class="set-label">${tr('إحصائياتي الروحية','My Spiritual Stats')}</span>
        <i class="fa-solid fa-chevron-left ath-chevron"></i></div>`;
    // أدخلها قبل مجموعة "البيانات"
    const dataGroup = [...list.querySelectorAll('.set-group-title')].find(el => el.dataset.i18n === 'grp_data');
    if (dataGroup) list.insertBefore(wrap, dataGroup); else list.appendChild(wrap);
    const dr = $('dhikr-reminders-toggle'); dr.checked = localStorage.getItem('dhikrReminders') !== 'false';
    dr.addEventListener('change', e => { localStorage.setItem('dhikrReminders', e.target.checked?'true':'false'); if (window.scheduleDhikrReminders) window.scheduleDhikrReminders(); });
    const at = $('athan-sound-toggle'); at.checked = localStorage.getItem('athanSound')==='true';
    at.addEventListener('change', e => { localStorage.setItem('athanSound', e.target.checked); if (window.refreshAthanSchedule) window.refreshAthanSchedule(); });
    const pa = $('pre-athan-select'); pa.value = localStorage.getItem('preAthanMin')||'0';
    pa.addEventListener('change', e => { localStorage.setItem('preAthanMin', e.target.value); if (window.refreshAthanSchedule) window.refreshAthanSchedule(); });
}

// زر مشاركة الختمة في كرت الختمات
function injectKhatmaShareBtn(){
    const card = document.querySelector('.khatma-manager-card > div'); if(!card || $('khatma-share-btn')) return;
    const b = document.createElement('button'); b.id='khatma-share-btn'; b.className='tasbeeh-pill';
    b.style.cssText='width:auto;padding:7px 14px;font-size:0.85rem;margin-inline-start:8px;';
    b.innerHTML = `<i class="fa-solid fa-share-nodes"></i>`; b.title = tr('مشاركة الختمة','Share');
    b.onclick = QA.shareKhatma; card.appendChild(b);
}

// =======================================================
// التهيئة
// =======================================================
function initFeatures(){
    injectReadingToolbar();
    injectSearchBar();
    injectARButton();
    injectExtraSettings();
    injectKhatmaPlan();
    injectKhatmaShareBtn();
    rebuildAthkarCategories();
    injectAthkarSearch();
    athanTicker();
    // reciter selection persist
    const rs = $('rt-reciter'); if(rs) rs.value = reciteEdition;
    // أعد بناء فئات الأذكار عند تبديل اللغة
    const _setLang = window.setLang;
    window.setLang = function(l){ if(typeof _setLang==='function') _setLang(l); rebuildAthkarCategories(); };
}
// callback بعد رسم القراءة
window.onReadingRendered = function(){ injectReadingToolbar(); QA.stopRecite && QA.stopRecite(); reciteList=[]; };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(initFeatures, 400));
else setTimeout(initFeatures, 400);
})();
