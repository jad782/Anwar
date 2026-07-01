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
    // الختمة الجماعية — بطاقة مزخرفة لامعة
    try {
        const groups = _loadGroups();
        groups.slice(0,2).forEach((g, gi) => {
            const total = g.members.reduce((s,m)=> s+(m.done||[]).length, 0);
            const pct = Math.round(total/30*100);
            const names = g.members.slice(0,4).map(m=>m.name).join(' · ');
            html += `<div class="group-home-card" onclick="PRO.openGroupKhatma()">
                <div class="ghc-glow"></div>
                <div class="ghc-head"><span class="ghc-badge"><i class="fa-solid fa-users"></i> ${tr('ختمة جماعية','Group Khatma')}</span>
                    ${g.code?`<span class="ghc-live"><i class="fa-solid fa-tower-broadcast"></i> ${tr('مباشر','Live')}</span>`:''}</div>
                <div class="ghc-title">${g.name}</div>
                <div class="ghc-names">${names}${g.members.length>4?' …':''}</div>
                <div class="ghc-bar"><div class="ghc-fill" style="width:${pct}%"></div></div>
                <div class="ghc-foot"><span>${total}/30 ${tr('جزء','juz')}</span><span class="ghc-pct">${pct}%</span></div>
            </div>`;
        });
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
function _migrateMember(m){
    // الصيغة القديمة: {name, from, to, done:bool} → الجديدة: {name, juz:[..], done:[..]}
    if (Array.isArray(m.juz)) { if(!Array.isArray(m.done)) m.done = []; return m; }
    const juz = [];
    if (typeof m.from === 'number' && typeof m.to === 'number'){ for(let j=m.from;j<=m.to;j++) juz.push(j); }
    const done = (m.done === true) ? juz.slice() : [];
    return { name:m.name, juz, done };
}
function _loadGroups(){
    try{
        const g = JSON.parse(localStorage.getItem('group_khatmas')||'[]');
        g.forEach(grp => { if(Array.isArray(grp.members)) grp.members = grp.members.map(_migrateMember); });
        return g;
    }catch(e){ return []; }
}
// أجزاء مأخوذة من قِبل أعضاء آخرين (للاختيار اليدوي)
function _takenJuz(group, exceptMi){
    const taken = {};
    group.members.forEach((m, i) => { if(i===exceptMi) return; (m.juz||[]).forEach(j => taken[j] = m.name); });
    return taken;
}
function _saveGroups(g){ localStorage.setItem('group_khatmas', JSON.stringify(g)); }
const _roomSubs = {};
PRO.renderGroups = function(){
    const groups=_loadGroups();
    const body = $('group-body'); if(!body) return;
    const synced = (window.FB && FB.ready);
    let html = `<button class="tasbeeh-pill" style="margin-bottom:14px;" onclick="PRO.openCreateGroup()"><i class="fa-solid fa-plus"></i> ${tr('ختمة جماعية جديدة','New group khatma')}</button>`;
    html += `<p class="group-net"><i class="fa-solid fa-circle" style="color:${synced?'#22c55e':'#9aa0a6'};font-size:0.6rem"></i> ${synced?tr('متّصل — تحديث لحظي','Live sync on'):tr('غير متّصل — محلّي','Offline — local')}</p>`;
    if (!groups.length) html += `<p class="tasks-empty">${tr('وزّع أجزاء القرآن على أفراد العائلة أو الأصدقاء لختمة جماعية.','Split the 30 Juz among family/friends for a shared khatma.')}</p>`;
    groups.forEach((g, gi) => {
        const totalDone = g.members.reduce((s,m)=> s + (m.done||[]).length, 0);
        html += `<div class="group-card"><div class="group-head"><b>${g.name}</b>
            ${g.code?`<span class="group-live"><i class="fa-solid fa-tower-broadcast"></i> ${tr('متزامنة','Live')}</span>`:''}
            <span>${totalDone}/30 ${tr('جزء','juz')}</span>
            <button class="bm-del" onclick="PRO.delGroup(${gi})"><i class="fa-solid fa-trash-can"></i></button></div>`;
        g.members.forEach((m, mi) => {
            const assigned = m.juz || [], done = m.done || [];
            const allDone = assigned.length>0 && assigned.every(j=>done.includes(j));
            html += `<div class="group-mem-block ${allDone?'done':''}">
                <div class="gm-top"><span class="gm-name">${allDone?'<i class="fa-solid fa-circle-check" style="color:#22c55e;margin-left:5px"></i>':''}${m.name}</span>
                    <span class="gm-count">${done.length}/${assigned.length||0}</span></div>`;
            if (assigned.length){
                html += `<div class="gm-juz-chips">` + assigned.slice().sort((a,b)=>a-b).map(j =>
                    `<button class="juz-chip ${done.includes(j)?'read':''}" onclick="PRO.toggleJuz(${gi},${mi},${j})">${done.includes(j)?'<i class=\'fa-solid fa-check\'></i> ':''}${j}</button>`
                ).join('') + `</div>`;
                if (g.manual) html += `<button class="gm-editjuz" onclick="PRO.pickJuz(${gi},${mi})"><i class="fa-solid fa-pen"></i> ${tr('تعديل أجزائي','Edit my juz')}</button>`;
            } else {
                html += `<button class="gm-pickbtn" onclick="PRO.pickJuz(${gi},${mi})"><i class="fa-solid fa-hand-pointer"></i> ${tr('اختر أجزاءك','Choose your juz')}</button>`;
            }
            html += `</div>`;
        });
        const pct = Math.round(totalDone/30*100);
        html += `<div class="group-progress"><div class="group-progress-fill" style="width:${pct}%"></div></div>
            <div class="group-pct">${tr('تقدّم الختمة','Khatma progress')}: ${pct}%</div>
            <div class="group-btns">
              <button class="group-share" onclick="PRO.shareGroup(${gi})"><i class="fa-solid fa-share-nodes"></i> ${tr('مشاركة','Share')}</button>
              <button class="group-share" onclick="PRO.copyRoomLink(${gi})"><i class="fa-solid fa-link"></i> ${tr('رابط الغرفة','Room link')}</button>
            </div></div>`;
    });
    body.innerHTML = html;
};
PRO.copyRoomLink = function(gi){
    const g=_loadGroups(); const k=g[gi]; if(!k)return;
    let code;
    if (k.code) code = k.code;                                   // غرفة Firestore متزامنة
    else code = btoa(unescape(encodeURIComponent(JSON.stringify({n:k.name,m:k.members})))); // احتياطي محلّي
    const link = location.origin + location.pathname + '#room=' + code;
    try{ if(navigator.clipboard) navigator.clipboard.writeText(link); }catch(e){}
    if (navigator.share) navigator.share({ text: tr('انضم لختمتنا الجماعية: ','Join our group khatma: ')+link }).catch(()=>{});
    else alert(tr('تم نسخ رابط الغرفة! أرسله لمن يشاركك الختمة.','Room link copied! Send it to your group.'));
};
// تطبيق لقطة Firestore على النسخة المحلّية + إعادة الرسم
function _applyRoomSnap(code, data){
    const g=_loadGroups(); const i=g.findIndex(x=>x.code===code);
    if (i===-1) g.unshift({ id:Date.now(), code, name:data.name, members:data.members });
    else { g[i].name=data.name; g[i].members=data.members; }
    _saveGroups(g);
    if ($('group-modal') && $('group-modal').classList.contains('active')) PRO.renderGroups();
}
function _subscribeRoom(code){
    if (!(window.FB && FB.ready) || _roomSubs[code]) return;
    _roomSubs[code] = FB.subscribe(code, data => _applyRoomSnap(code, data));
}
PRO._subscribeAll = function(){ _loadGroups().forEach(g=>{ if(g.code) _subscribeRoom(g.code); }); };
// استيراد/انضمام لغرفة من الرابط (#room=...)
PRO.importRoomFromHash = function(){
    const m = (location.hash||'').match(/room=([^&]+)/); if(!m) return;
    const code = m[1]; history.replaceState(null,'',location.pathname);
    // 1) غرفة Firestore (كود قصير)
    if (window.FB && FB.ready && !/[{}]/.test(code) && code.length < 40){
        FB.getRoom(code).then(data=>{
            if(!data){ return; }
            _applyRoomSnap(code, data); _subscribeRoom(code);
            if(typeof showBadgeToast==='function') showBadgeToast({emoji:'👥', name:tr('انضممت لغرفة ختمة','Joined a khatma room'), desc:data.name});
        }).catch(()=>{});
        return;
    }
    // 2) احتياطي: رابط مُرمّز محلّياً
    try{
        const obj = JSON.parse(decodeURIComponent(escape(atob(code)))); if(!obj||!obj.m) return;
        const g=_loadGroups(); if(!g.some(x=>x.name===obj.n)){ g.unshift({ id:Date.now(), name:obj.n, members:obj.m }); _saveGroups(g); }
        setTimeout(()=>{ if(typeof showBadgeToast==='function') showBadgeToast({emoji:'👥', name:tr('انضممت لغرفة ختمة','Joined a khatma room'), desc:obj.n}); }, 800);
    }catch(e){}
};
// نموذج إنشاء سهل: حقل لكل مشارك + زر إضافة (بدل الفصل بفاصلة)
PRO.openCreateGroup = function(){
    ensureGroupModal();
    $('group-body').innerHTML = `
      <input id="gk-name" class="modal-input" placeholder="${tr('اسم الختمة (مثل: ختمة العائلة)','Khatma name (e.g. Family)')}" />
      <div class="gk-mode">
        <label class="gk-mode-opt"><input type="radio" name="gkmode" value="auto" checked> ${tr('توزيع تلقائي للأجزاء','Auto-split juz')}</label>
        <label class="gk-mode-opt"><input type="radio" name="gkmode" value="manual"> ${tr('كل مشارك يختار أجزاءه','Each picks own juz')}</label>
      </div>
      <p style="color:var(--text-muted);font-size:0.82rem;margin:8px 2px 12px;">${tr('اكتب اسم كل مشارك في خانة. في الوضع التلقائي نوزّع الأجزاء الثلاثين، وفي اليدوي يختار كلٌّ أجزاءه.','Add each participant. Auto splits the 30 Juz; manual lets each pick their own.')}</p>
      <div id="gk-names"></div>
      <button class="group-share" style="width:100%;margin-top:6px;justify-content:center;" onclick="PRO.addGroupNameRow()"><i class="fa-solid fa-user-plus"></i> ${tr('إضافة مشارك','Add participant')}</button>
      <button class="tasbeeh-pill" style="width:100%;margin-top:14px;" onclick="PRO.submitCreateGroup()"><i class="fa-solid fa-check"></i> ${tr('إنشاء الختمة','Create khatma')}</button>`;
    PRO.addGroupNameRow(); PRO.addGroupNameRow(); PRO.addGroupNameRow();
    $('group-modal').classList.add('active');
};
PRO.addGroupNameRow = function(){
    const wrap=$('gk-names'); if(!wrap) return;
    const row=document.createElement('div'); row.className='gk-row';
    row.innerHTML = `<input class="modal-input gk-name-input" style="margin:0;flex:1;" placeholder="${tr('اسم المشارك','Participant name')}" />
        <button class="gk-del" onclick="this.closest('.gk-row').remove()"><i class="fa-solid fa-xmark"></i></button>`;
    wrap.appendChild(row);
    const inp=row.querySelector('input');
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); PRO.addGroupNameRow(); } });
    inp.focus();
};
PRO.submitCreateGroup = function(){
    const name = (($('gk-name')||{}).value||'').trim() || tr('ختمة جماعية','Group Khatma');
    const names = [...document.querySelectorAll('.gk-name-input')].map(i=>i.value.trim()).filter(Boolean);
    if(!names.length){ alert(tr('أضف مشاركاً واحداً على الأقل.','Add at least one participant.')); return; }
    const modeEl = document.querySelector('input[name="gkmode"]:checked');
    const manual = modeEl && modeEl.value === 'manual';
    PRO.createGroup(name, names, manual);
    PRO.openGroupKhatma();
};
PRO.createGroup = function(name, names, manual){
    let members;
    if (manual){
        // يدوي: لا أجزاء بعد، يختار كل مشارك أجزاءه
        members = names.map(nm => ({ name:nm, juz:[], done:[] }));
    } else {
        const per = Math.floor(30/names.length); let extra = 30 - per*names.length; let cur = 1;
        members = names.map(nm => { let cnt = per + (extra>0?1:0); if(extra>0)extra--; const juz=[]; for(let j=0;j<cnt;j++) juz.push(cur++); return { name:nm, juz, done:[] }; });
    }
    const groups=_loadGroups();
    const entry = { id:Date.now(), name, manual:!!manual, members };
    groups.unshift(entry); _saveGroups(groups); PRO.renderGroups();
    // أنشئ غرفة Firestore متزامنة إن توفّر اتصال
    if (window.FB && FB.ready){
        FB.createRoom(name, members).then(code=>{
            const g=_loadGroups(); const i=g.findIndex(x=>x.id===entry.id); if(i!==-1){ g[i].code=code; _saveGroups(g); }
            _subscribeRoom(code); PRO.renderGroups();
        }).catch(()=>{});
    }
};
// علّم جزءاً واحداً مقروءاً/غير مقروء
PRO.toggleJuz = function(gi,mi,j){
    const g=_loadGroups(); if(!g[gi]||!g[gi].members[mi]) return;
    const m=g[gi].members[mi]; if(!Array.isArray(m.done)) m.done=[];
    const k=m.done.indexOf(j); if(k>=0) m.done.splice(k,1); else m.done.push(j);
    _saveGroups(g); PRO.renderGroups(); PRO.renderHomeExtras && PRO.renderHomeExtras();
    if (g[gi].code && window.FB && FB.ready) FB.updateMembers(g[gi].code, g[gi].members);
};
// اختيار/تعديل أجزاء مشارك (شبكة 1..30، المأخوذ من غيره معطّل)
PRO.pickJuz = function(gi,mi){
    const g=_loadGroups(); if(!g[gi]||!g[gi].members[mi]) return;
    const m=g[gi].members[mi]; const taken=_takenJuz(g[gi], mi); const mine=new Set(m.juz||[]);
    let grid='';
    for(let j=1;j<=30;j++){
        if(taken[j]) grid += `<button class="jp-cell taken" disabled>${j}<span>${taken[j]}</span></button>`;
        else grid += `<button class="jp-cell ${mine.has(j)?'sel':''}" data-j="${j}" onclick="this.classList.toggle('sel')">${j}</button>`;
    }
    $('group-body').innerHTML = `
      <button class="group-share" style="margin-bottom:12px;" onclick="PRO.openGroupKhatma()"><i class="fa-solid fa-arrow-right"></i> ${tr('رجوع','Back')}</button>
      <h3 style="text-align:center;color:var(--accent-color);margin-bottom:4px;">${m.name}</h3>
      <p style="text-align:center;color:var(--text-muted);font-size:0.82rem;margin-bottom:12px;">${tr('اضغط الأجزاء التي ستقرؤها','Tap the juz you will read')}</p>
      <div class="jp-grid">${grid}</div>
      <button class="tasbeeh-pill" style="width:100%;margin-top:16px;" onclick="PRO.saveJuzPick(${gi},${mi})"><i class="fa-solid fa-check"></i> ${tr('حفظ','Save')}</button>`;
};
PRO.saveJuzPick = function(gi,mi){
    const sel=[...document.querySelectorAll('.jp-cell.sel')].map(b=>+b.dataset.j).sort((a,b)=>a-b);
    const g=_loadGroups(); if(!g[gi]||!g[gi].members[mi]) return;
    const m=g[gi].members[mi]; m.juz=sel; m.done=(m.done||[]).filter(j=>sel.includes(j));
    _saveGroups(g); PRO.openGroupKhatma(); PRO.renderHomeExtras && PRO.renderHomeExtras();
    if (g[gi].code && window.FB && FB.ready) FB.updateMembers(g[gi].code, g[gi].members);
};
PRO.delGroup = function(gi){ if(!confirm(tr('حذف هذه الختمة الجماعية؟','Delete this group khatma?')))return; let g=JSON.parse(localStorage.getItem('group_khatmas')||'[]'); g.splice(gi,1); localStorage.setItem('group_khatmas',JSON.stringify(g)); PRO.renderGroups(); };
PRO.shareGroup = function(gi){
    const g=_loadGroups(); const k=g[gi]; if(!k)return;
    const fmtJuz = a => (a&&a.length)? a.slice().sort((x,y)=>x-y).join('، ') : tr('لم تُختر بعد','not set');
    const lines = k.members.map(m=>`${m.name}: ${tr('الأجزاء','Juz')} ${fmtJuz(m.juz)} (${(m.done||[]).length}/${(m.juz||[]).length} ✓)`).join('\n');
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
    { id:'com.alanwar.quran.jad.tip1',  emoji:'☕', ar:'دعم بسيط',  en:'Small support',  price:'$0.99' },
    { id:'com.alanwar.quran.jad.tip5',  emoji:'🌿', ar:'دعم كريم',  en:'Generous',       price:'$4.99' },
    { id:'com.alanwar.quran.jad.tip10', emoji:'🌟', ar:'دعم سخيّ',  en:'Big support',    price:'$9.99' }
];
let _iapReady = false;
let _iapState = { plugin:false, initialized:false, err:'' };
function initIAP(){
    try {
        const CdvPurchase = window.CdvPurchase;
        _iapState.plugin = !!CdvPurchase;
        if (!CdvPurchase || _iapReady) return;
        const { store, ProductType, Platform } = CdvPurchase;
        SUPPORT_TIERS.forEach(t => store.register({ id:t.id, type:ProductType.CONSUMABLE, platform:Platform.APPLE_APPSTORE }));
        store.when().approved(tr2 => tr2.verify());
        store.when().verified(rc => { rc.finish(); if(typeof showBadgeToast==='function') showBadgeToast({emoji:'🤍', name:tr('جزاك الله خيراً','JazakAllah khayr'), desc:tr('شكراً لدعمك التطبيق','Thank you for your support')}); });
        store.when().productUpdated(()=>{ try{ PRO._refreshDonatePrices && PRO._refreshDonatePrices(); }catch(e){} });
        if (typeof store.error === 'function') store.error(e => { _iapState.err = (e && ((e.code||'')+' '+(e.message||''))) || String(e); try{ PRO._refreshDonatePrices && PRO._refreshDonatePrices(); }catch(x){} });
        store.initialize([Platform.APPLE_APPSTORE]);
        _iapState.initialized = true;
        _iapReady = true;
    } catch(e){ _iapState.err = 'init: ' + (e && e.message || e); }
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
                <span class="st-price" id="st-price-${t.id}">${t.price}</span></button>`).join('')}
        </div>
        <p class="support-status" id="support-status"></p>
        <p class="support-note">${tr('الدفع يتم بأمان عبر حسابك في آبل (App Store).','Payment is processed securely via your Apple account.')}</p>`;
    $('donate-modal').classList.add('active');
    PRO._refreshDonatePrices();
};
// يعرض السعر الحقيقي من آبل + مؤشّر اتصال المتجر (أداة تحقّق)
PRO._refreshDonatePrices = function(){
    const st = $('support-status'); let loaded = 0;
    try {
        const CdvPurchase = window.CdvPurchase;
        if (CdvPurchase && _iapReady){
            SUPPORT_TIERS.forEach(t=>{
                const p = CdvPurchase.store.get(t.id, CdvPurchase.Platform.APPLE_APPSTORE);
                const price = p && (p.pricing && p.pricing.price);
                if (price){ loaded++; const el = $('st-price-'+t.id); if(el) el.textContent = price; }
            });
        }
    } catch(e){}
    if (st){
        if (loaded > 0){
            st.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#22c55e"></i> ${tr('متّصل بمنتجات آبل ('+loaded+'/'+SUPPORT_TIERS.length+')','Connected ('+loaded+'/'+SUPPORT_TIERS.length+')')}`;
        } else {
            // تشخيص: يظهر سبب عدم عمل الدفع (صوّره وأرسله للمطوّر)
            const ok='<span style="color:#22c55e">نعم</span>', no='<span style="color:#e0524d">لا</span>';
            st.innerHTML = `<div style="text-align:right;font-size:0.72rem;line-height:1.9;background:rgba(0,0,0,0.2);border:1px solid var(--border-color);border-radius:10px;padding:8px 10px;">
                <b style="color:var(--accent-color)">${tr('تشخيص الدفع','Payment diagnostics')}</b><br>
                ${tr('إضافة آبل محمّلة','Plugin loaded')}: ${_iapState.plugin?ok:no}<br>
                ${tr('تمّت التهيئة','Initialized')}: ${_iapState.initialized?ok:no}<br>
                ${tr('منتجات محمّلة','Products loaded')}: ${loaded}/${SUPPORT_TIERS.length}<br>
                ${_iapState.err?(tr('خطأ','Error')+': '+_iapState.err):''}</div>`;
        }
    }
};
window.closeDonate = function(){ const m=$('donate-modal'); if(m) m.classList.remove('active'); };

// إضافة آبل (CdvPurchase) تجهز بعد deviceready؛ نحاول مرّات حتى تتوفّر
function tryInitIAP(n){
    if (window.CdvPurchase && !_iapReady){ initIAP(); PRO._refreshDonatePrices && PRO._refreshDonatePrices(); return; }
    if (_iapReady){ PRO._refreshDonatePrices && PRO._refreshDonatePrices(); return; }
    if (n > 0) setTimeout(() => tryInitIAP(n-1), 1200);
}
document.addEventListener('deviceready', () => tryInitIAP(12));
function initPro(){ injectHomeEntries(); tryInitIAP(12); PRO.importRoomFromHash(); if(PRO._subscribeAll) PRO._subscribeAll(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(initPro, 500));
else setTimeout(initPro, 500);
})();
