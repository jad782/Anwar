// =======================================================
//  pro.js — مزايا احترافية إضافية
//  المصادر: نص المصحف العثماني المضمّن، والتفسير/الترجمة من API معتمد.
//  لا يتم تأليف أي نص ديني. التواريخ من تقويم أم القرى (قد تختلف بالرؤية).
// =======================================================
(function(){
'use strict';
const L = () => (typeof currentLang !== 'undefined' ? currentLang : 'ar');
const tr = (ar, en) => (L() === 'en' ? en : ar);
const $ = id => document.getElementById(id);
const sN = n => { try { return surahName(n); } catch(e){ return n; } };
window.PRO = window.PRO || {};

// =======================================================
// تخزين الصوت أوفلاين (IndexedDB منفصل)
// =======================================================
let audioDB = null;
(function openAudioDB(){
    try {
        const rq = indexedDB.open('AlAnwarAudio', 1);
        rq.onupgradeneeded = e => { e.target.result.createObjectStore('audio', { keyPath:'url' }); };
        rq.onsuccess = e => { audioDB = e.target.result; };
    } catch(e){}
})();
PRO.cacheAudio = function(url){
    return new Promise(async (resolve, reject) => {
        if (!audioDB) return reject('no-db');
        try {
            const exists = await PRO.getCachedAudio(url);
            if (exists) return resolve(true);
            const res = await fetch(url); const blob = await res.blob();
            const tx = audioDB.transaction('audio','readwrite');
            tx.objectStore('audio').put({ url, blob });
            tx.oncomplete = () => resolve(true); tx.onerror = () => reject('store');
        } catch(e){ reject(e); }
    });
};
PRO.getCachedAudio = function(url){
    return new Promise(resolve => {
        if (!audioDB) return resolve(null);
        try {
            const tx = audioDB.transaction('audio','readonly');
            const rq = tx.objectStore('audio').get(url);
            rq.onsuccess = () => resolve(rq.result ? URL.createObjectURL(rq.result.blob) : null);
            rq.onerror = () => resolve(null);
        } catch(e){ resolve(null); }
    });
};

// =======================================================
// (1) متابعة آخر قراءة + المفضلة
// =======================================================
const _ofr = window.openFreeReading;
window.openFreeReading = function(type, num, name){
    try { localStorage.setItem('last_read', JSON.stringify({ type, num, name, ts: Date.now() })); } catch(e){}
    const r = _ofr.apply(this, arguments);
    setTimeout(()=>{ if (PRO.renderHomeExtras) PRO.renderHomeExtras(); }, 50);
    return r;
};
PRO.resumeReading = function(){
    let lr = null; try { lr = JSON.parse(localStorage.getItem('last_read')); } catch(e){}
    if (!lr) return;
    if (typeof goToTab === 'function') goToTab(1);
    window.openFreeReading(lr.type, lr.num, lr.name);
};
PRO.openBookmarks = function(){
    ensureBookmarksModal();
    let bms = []; try { bms = JSON.parse(localStorage.getItem('bookmarks_v1')||'[]'); } catch(e){}
    const body = $('bm-body');
    if (!bms.length){ body.innerHTML = `<p class="tasks-empty">${tr('لا توجد آيات محفوظة. اضغط على أي آية ثم «حفظ».','No saved ayahs yet. Tap an ayah then “Save”.')}</p>`; }
    else body.innerHTML = bms.map((b,i) => `<div class="bm-item" onclick="PRO.openBookmark(${i})">
        <div class="bm-text">${b.text||''}</div>
        <div class="bm-ref"><span>${tr('سورة','Surah')} ${sN(b.surah)} : ${b.ayah}</span>
        <button class="bm-del" onclick="event.stopPropagation();PRO.delBookmark(${i})"><i class="fa-solid fa-trash-can"></i></button></div></div>`).join('');
    $('bookmarks-modal').classList.add('active');
};
PRO.closeBookmarks = function(){ const m=$('bookmarks-modal'); if(m) m.classList.remove('active'); };
PRO.openBookmark = function(i){
    let bms=[]; try{ bms=JSON.parse(localStorage.getItem('bookmarks_v1')||'[]'); }catch(e){}
    const b = bms[i]; if(!b) return; PRO.closeBookmarks();
    if (typeof goToTab==='function') goToTab(1);
    window.openFreeReading('surah', b.surah, sN(b.surah));
    setTimeout(()=>{ const el=document.querySelector(`.ayah[data-surah="${b.surah}"][data-ayah="${b.ayah}"]`); if(el){ el.scrollIntoView({block:'center'}); el.classList.add('reciting'); setTimeout(()=>el.classList.remove('reciting'),2500);} }, 900);
};
PRO.delBookmark = function(i){
    let bms=[]; try{ bms=JSON.parse(localStorage.getItem('bookmarks_v1')||'[]'); }catch(e){}
    bms.splice(i,1); localStorage.setItem('bookmarks_v1', JSON.stringify(bms)); PRO.openBookmarks();
};
function ensureBookmarksModal(){
    if ($('bookmarks-modal')) return;
    const d=document.createElement('div'); d.id='bookmarks-modal'; d.className='qibla-overlay';
    d.innerHTML = `<div class="qibla-modal" style="width:94%;max-width:440px;text-align:right;">
        <button class="close-qibla" onclick="PRO.closeBookmarks()"><i class="fa-solid fa-xmark"></i></button>
        <h2 style="color:var(--primary-color);margin-bottom:14px;text-align:center;"><i class="fa-solid fa-bookmark"></i> ${tr('المفضلة','Bookmarks')}</h2>
        <div id="bm-body" style="max-height:60vh;overflow-y:auto;"></div></div>`;
    document.body.appendChild(d);
}

// =======================================================
// (4) التقويم الهجري + المناسبات الإسلامية
// =======================================================
const HMONTHS = ['محرّم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوّال','ذو القعدة','ذو الحجة'];
const OCCASIONS = [
    { m:1,  d:1,  ar:'رأس السنة الهجرية', en:'Islamic New Year' },
    { m:1,  d:10, ar:'يوم عاشوراء', en:'Day of Ashura' },
    { m:9,  d:1,  ar:'بداية شهر رمضان', en:'Start of Ramadan' },
    { m:9,  d:27, ar:'ليلة القدر (تُلتمس في أوتار العشر الأواخر)', en:'Laylat al-Qadr (seek in last 10 odd nights)' },
    { m:10, d:1,  ar:'عيد الفطر', en:'Eid al-Fitr' },
    { m:12, d:1,  ar:'بداية عشر ذي الحجة', en:'First 10 days of Dhul-Hijjah' },
    { m:12, d:9,  ar:'يوم عرفة', en:'Day of Arafah' },
    { m:12, d:10, ar:'عيد الأضحى', en:'Eid al-Adha' },
];
function hijriParts(date){
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day:'numeric', month:'numeric', year:'numeric' });
    let dd, mm, yy; fmt.formatToParts(date).forEach(p => { if(p.type==='day')dd=+p.value; if(p.type==='month')mm=+p.value; if(p.type==='year')yy=+p.value; });
    return { d:dd, m:mm, y:yy };
}
function daysUntilHijri(m, d){
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day:'numeric', month:'numeric' });
    for (let i=0; i<400; i++){
        const dt = new Date(); dt.setHours(12,0,0,0); dt.setDate(dt.getDate()+i);
        let mm, dd; fmt.formatToParts(dt).forEach(p => { if(p.type==='month')mm=+p.value; if(p.type==='day')dd=+p.value; });
        if (mm===m && dd===d) return { days:i, date:dt };
    }
    return null;
}
PRO.openCalendar = function(){
    ensureCalendarModal();
    const h = hijriParts(new Date());
    $('cal-today').innerHTML = `${h.d} ${HMONTHS[h.m-1]} ${h.y} <span style="font-size:0.8rem;color:var(--text-muted)">${tr('هـ','AH')}</span>`;
    const items = OCCASIONS.map(o => { const u = daysUntilHijri(o.m,o.d); return { o, u }; })
        .filter(x => x.u).sort((a,b)=>a.u.days-b.u.days);
    $('cal-list').innerHTML = items.map(({o,u}) => {
        const greg = u.date.toLocaleDateString(L()==='en'?'en-GB':'ar-EG', { day:'numeric', month:'long' });
        const when = u.days===0 ? tr('اليوم 🌙','Today 🌙') : (u.days===1 ? tr('غداً','Tomorrow') : `${tr('بعد','In')} ${u.days} ${tr('يوم','days')}`);
        return `<div class="occ-item"><div class="occ-ico"><i class="fa-solid fa-star-and-crescent"></i></div>
            <div class="occ-info"><div class="occ-name">${L()==='en'?o.en:o.ar}</div><div class="occ-date">${greg}</div></div>
            <div class="occ-when">${when}</div></div>`;
    }).join('');
    $('calendar-modal').classList.add('active');
};
PRO.closeCalendar = function(){ const m=$('calendar-modal'); if(m) m.classList.remove('active'); };
function ensureCalendarModal(){
    if ($('calendar-modal')) return;
    const d=document.createElement('div'); d.id='calendar-modal'; d.className='qibla-overlay';
    d.innerHTML = `<div class="qibla-modal" style="width:94%;max-width:440px;">
        <button class="close-qibla" onclick="PRO.closeCalendar()"><i class="fa-solid fa-xmark"></i></button>
        <h2 style="color:var(--primary-color);margin-bottom:6px;"><i class="fa-regular fa-calendar"></i> ${tr('التقويم والمناسبات','Calendar & Events')}</h2>
        <div id="cal-today" style="font-family:'Amiri',serif;font-size:1.5rem;color:var(--accent-color);font-weight:700;margin-bottom:16px;"></div>
        <div id="cal-list" style="max-height:55vh;overflow-y:auto;text-align:right;"></div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin-top:12px;">${tr('* حسب تقويم أم القرى؛ قد يختلف اليوم الفعلي حسب رؤية الهلال.','* Per Umm al-Qura calendar; actual day may vary by moon sighting.')}</p></div>`;
    document.body.appendChild(d);
}

// =======================================================
// (5) ورد اليوم الذكي + (1) متابعة القراءة — كروت الرئيسية
// =======================================================
PRO.renderHomeExtras = function(){
    const host = $('pro-home'); if (!host) return;
    let html = '';
    // متابعة القراءة
    let lr=null; try{ lr=JSON.parse(localStorage.getItem('last_read')); }catch(e){}
    if (lr){
        html += `<div class="pro-card" onclick="PRO.resumeReading()">
            <div class="pro-card-ico"><i class="fa-solid fa-book-open-reader"></i></div>
            <div class="pro-card-info"><span class="pro-card-label">${tr('تابع القراءة','Continue reading')}</span>
            <span class="pro-card-main">${lr.name||''}</span></div>
            <i class="fa-solid fa-circle-play pro-card-go"></i></div>`;
    }
    // ورد اليوم الذكي
    try {
        const kh = JSON.parse(localStorage.getItem('khatmas_list')||'[]');
        const plans = JSON.parse(localStorage.getItem('khatma_plans')||'{}');
        if (kh.length){
            const k = kh[0]; const plan = plans[k.name];
            const per = plan ? plan.perDay : 4;
            const from = k.page || 1; const to = Math.min(604, from + per - 1);
            html += `<div class="pro-card" onclick="openKhatmaPage(${k.id||0}, ${from})">
                <div class="pro-card-ico"><i class="fa-solid fa-bookmark"></i></div>
                <div class="pro-card-info"><span class="pro-card-label">${tr('وردك اليوم','Daily wird')} · ${k.name}</span>
                <span class="pro-card-main">${tr('اقرأ صفحات','Read pages')} ${from}–${to} (${to-from+1} ${tr('صفحة','pp')})</span></div>
                <i class="fa-solid fa-circle-play pro-card-go"></i></div>`;
        }
    } catch(e){}
    host.innerHTML = html;
};

// =======================================================
// (9) ختمة جماعية (منظّم — تقسيم الأجزاء على المشاركين)
// =======================================================
PRO.openGroupKhatma = function(){
    ensureGroupModal();
    PRO.renderGroups();
    $('group-modal').classList.add('active');
};
PRO.closeGroupKhatma = function(){ const m=$('group-modal'); if(m) m.classList.remove('active'); };
PRO.renderGroups = function(){
    let groups=[]; try{ groups=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); }catch(e){}
    const body = $('group-body');
    let html = `<button class="tasbeeh-pill" style="margin-bottom:14px;" onclick="PRO.createGroup()"><i class="fa-solid fa-plus"></i> ${tr('ختمة جماعية جديدة','New group khatma')}</button>`;
    if (!groups.length) html += `<p class="tasks-empty">${tr('وزّع أجزاء القرآن على أفراد العائلة أو الأصدقاء لختمة جماعية.','Split the 30 Juz among family/friends for a shared khatma.')}</p>`;
    groups.forEach((g, gi) => {
        const doneCount = g.members.filter(m=>m.done).length;
        html += `<div class="group-card"><div class="group-head"><b>${g.name}</b>
            <span>${doneCount}/${g.members.length} ✓</span>
            <button class="bm-del" onclick="PRO.delGroup(${gi})"><i class="fa-solid fa-trash-can"></i></button></div>`;
        g.members.forEach((m, mi) => {
            html += `<div class="group-mem ${m.done?'done':''}" onclick="PRO.toggleMember(${gi},${mi})">
                <i class="fa-${m.done?'solid fa-circle-check':'regular fa-circle'}"></i>
                <span class="gm-name">${m.name}</span>
                <span class="gm-juz">${tr('أجزاء','Juz')} ${m.from}–${m.to}</span></div>`;
        });
        const pct = Math.round(doneCount/g.members.length*100);
        html += `<div class="group-progress"><div class="group-progress-fill" style="width:${pct}%"></div></div>
            <div class="group-pct">${tr('التقدّم','Progress')}: ${pct}%</div>
            <div class="group-btns">
              <button class="group-share" onclick="PRO.shareGroup(${gi})"><i class="fa-solid fa-share-nodes"></i> ${tr('مشاركة','Share')}</button>
              <button class="group-share" onclick="PRO.copyRoomLink(${gi})"><i class="fa-solid fa-link"></i> ${tr('رابط الغرفة','Room link')}</button>
            </div></div>`;
    });
    body.innerHTML = html;
};
PRO.copyRoomLink = function(gi){
    let g=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); const k=g[gi]; if(!k)return;
    try{
        const code = btoa(unescape(encodeURIComponent(JSON.stringify({n:k.name,m:k.members}))));
        const link = location.origin + location.pathname + '#room=' + code;
        if(navigator.clipboard) navigator.clipboard.writeText(link);
        alert(tr('تم نسخ رابط الغرفة! أرسله لمن يشاركك الختمة.','Room link copied! Send it to your group.'));
    }catch(e){}
};
// استيراد غرفة من الرابط (#room=...)
PRO.importRoomFromHash = function(){
    try{
        const m = (location.hash||'').match(/room=([^&]+)/); if(!m) return;
        const obj = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
        if(!obj || !obj.m) return;
        let groups=[]; try{ groups=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); }catch(e){}
        if(!groups.some(x=>x.name===obj.n)){ groups.unshift({ id:Date.now(), name:obj.n, members:obj.m }); localStorage.setItem('group_khatmas', JSON.stringify(groups)); }
        history.replaceState(null,'',location.pathname);
        setTimeout(()=>{ if(typeof showBadgeToast==='function') showBadgeToast({emoji:'👥', name:tr('انضممت لغرفة ختمة','Joined a khatma room'), desc:obj.n}); }, 800);
    }catch(e){}
};
PRO.createGroup = function(){
    const name = prompt(tr('اسم الختمة الجماعية:','Group khatma name:')); if(!name) return;
    const membersStr = prompt(tr('أسماء المشاركين (افصل بفاصلة):','Member names (comma separated):')); if(!membersStr) return;
    const names = membersStr.split(',').map(s=>s.trim()).filter(Boolean); if(!names.length) return;
    const per = Math.floor(30/names.length); let extra = 30 - per*names.length; let cur = 1;
    const members = names.map(nm => { let cnt = per + (extra>0?1:0); if(extra>0)extra--; const from=cur; const to=cur+cnt-1; cur=to+1; return { name:nm, from, to, done:false }; });
    let groups=[]; try{ groups=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); }catch(e){}
    groups.unshift({ id:Date.now(), name, members }); localStorage.setItem('group_khatmas', JSON.stringify(groups)); PRO.renderGroups();
};
PRO.toggleMember = function(gi,mi){ let g=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); g[gi].members[mi].done=!g[gi].members[mi].done; localStorage.setItem('group_khatmas',JSON.stringify(g)); PRO.renderGroups(); };
PRO.delGroup = function(gi){ if(!confirm(tr('حذف هذه الختمة الجماعية؟','Delete this group khatma?')))return; let g=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); g.splice(gi,1); localStorage.setItem('group_khatmas',JSON.stringify(g)); PRO.renderGroups(); };
PRO.shareGroup = function(gi){
    let g=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); const k=g[gi]; if(!k)return;
    const lines = k.members.map(m=>`${m.name}: ${tr('الأجزاء','Juz')} ${m.from}–${m.to}`).join('\n');
    const msg = `📖 ${tr('ختمة جماعية','Group Khatma')}: ${k.name}\n${lines}\n${tr('عبر تطبيق الأنوار','via Al-Anwar app')}`;
    if (navigator.share) navigator.share({text:msg}).catch(()=>{}); else { try{navigator.clipboard.writeText(msg);}catch(e){} alert(tr('تم نسخ التوزيع.','Split copied.')); }
};
function ensureGroupModal(){
    if ($('group-modal')) return;
    const d=document.createElement('div'); d.id='group-modal'; d.className='qibla-overlay';
    d.innerHTML = `<div class="qibla-modal" style="width:94%;max-width:440px;text-align:right;">
        <button class="close-qibla" onclick="PRO.closeGroupKhatma()"><i class="fa-solid fa-xmark"></i></button>
        <h2 style="color:var(--primary-color);margin-bottom:14px;text-align:center;"><i class="fa-solid fa-users"></i> ${tr('ختمة جماعية','Group Khatma')}</h2>
        <div id="group-body" style="max-height:60vh;overflow-y:auto;"></div></div>`;
    document.body.appendChild(d);
}

// =======================================================
// حقن نقاط الدخول في الرئيسية + شريط التطبيقات
// =======================================================
function injectHomeEntries(){
    // كروت متابعة القراءة + الورد
    if (!$('pro-home')){
        const anchor = document.querySelector('#tab-home .section-header h3[data-i18n="daily_tasks"]');
        if (anchor){ const wrap=document.createElement('div'); wrap.id='pro-home'; anchor.closest('.section-header').insertAdjacentElement('beforebegin', wrap); }
    }
    PRO.renderHomeExtras();
    // أيقونات شريط التطبيقات
    const scroll = document.querySelector('.apps-scroll');
    if (scroll && !$('pro-apps-added')){
        const mk = (onclick, color, bg, icon, label) => `<div class="app-item" onclick="${onclick}"><div class="app-icon" style="background:${bg};color:${color};">${icon}</div><span>${label}</span></div>`;
        scroll.insertAdjacentHTML('beforeend',
            mk("PRO.openCalendar()", 'var(--accent-color)', 'rgba(212,168,67,0.12)', '<i class="fa-regular fa-calendar"></i>', tr('التقويم','Calendar')) +
            mk("PRO.openBookmarks()", 'var(--primary-color)', 'rgba(212,168,67,0.08)', '<i class="fa-solid fa-bookmark"></i>', tr('المفضلة','Bookmarks')) +
            mk("PRO.openGroupKhatma()", 'var(--accent-color)', 'rgba(212,168,67,0.12)', '<i class="fa-solid fa-users"></i>', tr('ختمة جماعية','Group'))
        );
        const flag=document.createElement('span'); flag.id='pro-apps-added'; flag.style.display='none'; scroll.appendChild(flag);
    }
}
PRO.refreshBookmarksBadge = function(){};

// =======================================================
// ادعم المطوّر — عبر In-App Purchase (متوافق مع سياسة آبل)
// مُعرّفات المنتجات تُنشأ في App Store Connect (Consumable)
// =======================================================
const SUPPORT_TIERS = [
    { id:'com.alanwar.quran.tip1',  emoji:'☕', ar:'دعم بسيط',  en:'Small support',  price:'$0.99' },
    { id:'com.alanwar.quran.tip5',  emoji:'🌿', ar:'دعم كريم',  en:'Generous',       price:'$4.99' },
    { id:'com.alanwar.quran.tip10', emoji:'🌟', ar:'دعم سخيّ',  en:'Big support',    price:'$9.99' }
];
let _iapReady = false;
function initIAP(){
    try {
        const CdvPurchase = window.CdvPurchase;
        if (!CdvPurchase || _iapReady) return;
        const { store, ProductType, Platform } = CdvPurchase;
        SUPPORT_TIERS.forEach(t => store.register({ id:t.id, type:ProductType.CONSUMABLE, platform:Platform.APPLE_APPSTORE }));
        store.when().approved(tr2 => tr2.verify());
        store.when().verified(rc => { rc.finish(); if(typeof showBadgeToast==='function') showBadgeToast({emoji:'🤍', name:tr('جزاك الله خيراً','JazakAllah khayr'), desc:tr('شكراً لدعمك التطبيق','Thank you for your support')}); });
        store.initialize([Platform.APPLE_APPSTORE]);
        _iapReady = true;
    } catch(e){}
}
PRO.support = function(id){
    try {
        const CdvPurchase = window.CdvPurchase;
        if (CdvPurchase && _iapReady){
            const p = CdvPurchase.store.get(id, CdvPurchase.Platform.APPLE_APPSTORE);
            if (p && p.getOffer){ CdvPurchase.store.order(p.getOffer()); return; }
        }
    } catch(e){}
    alert(tr('الدعم متاح داخل التطبيق على App Store عبر حسابك في آبل.','Support is available in the App Store version via your Apple account.'));
};
window.openDonate = function(){
    const body = $('donate-bank-body'); if (!body) return;
    body.innerHTML = `
        <p class="support-intro">${tr('تطبيق الأنوار مجّاني بالكامل. دعمك يساعدنا على الاستمرار والتطوير 🤍','Al-Anwar is completely free. Your support helps us keep improving 🤍')}</p>
        <div class="support-tiers">
            ${SUPPORT_TIERS.map(t=>`<button class="support-tier" onclick="PRO.support('${t.id}')">
                <span class="st-emoji">${t.emoji}</span>
                <span class="st-name">${L()==='en'?t.en:t.ar}</span>
                <span class="st-price">${t.price}</span></button>`).join('')}
        </div>
        <p class="support-note">${tr('الدفع يتم بأمان عبر حسابك في آبل (App Store).','Payment is processed securely via your Apple account.')}</p>`;
    $('donate-modal').classList.add('active');
};
window.closeDonate = function(){ const m=$('donate-modal'); if(m) m.classList.remove('active'); };

function initPro(){ injectHomeEntries(); initIAP(); PRO.importRoomFromHash(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(initPro, 500));
else setTimeout(initPro, 500);
})();
