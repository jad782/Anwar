// =======================================================
//  pro2.js — مزايا احترافية عالمية
//  المصادر: alquran.cloud (تجويد/ترجمات/نطق) — لا تأليف لأي نص.
// =======================================================
(function(){
'use strict';
const L = () => (typeof currentLang !== 'undefined' ? currentLang : 'ar');
const tr = (ar, en) => (L() === 'en' ? en : ar);
const $ = id => document.getElementById(id);
const sN = n => { try { return surahName(n); } catch(e){ return n; } };
window.PRO2 = window.PRO2 || {};

// =======================================================
// (1) المصحف الملوّن بأحكام التجويد
// =======================================================
let tajweedOn = false;
// ألوان الأحكام (حسب المصحف الملوّن)
// خريطة رموز مصدر quran-tajweed الرسمية إلى الأحكام
function tajweedClass(code){
    const c = code[0];
    if (c==='n'||c==='p'||c==='m'||c==='o') return 'tj-madd';   // المدود
    if (c==='g') return 'tj-ghunnah';                            // الغنّة
    if (c==='q') return 'tj-qalqalah';                           // القلقلة
    if (c==='f'||c==='c') return 'tj-ikhfa';                     // الإخفاء (وإخفاء شفوي)
    if (c==='a'||c==='u'||c==='w'||c==='d') return 'tj-idgham';  // الإدغام
    if (c==='i') return 'tj-iqlab';                              // الإقلاب
    if (c==='h'||c==='s'||c==='l') return 'tj-silent';           // همزة وصل/ساكن/لام شمسية
    return 'tj-other';
}
function parseTajweed(text){
    // الصيغة: [code:n[نص]  أو  [code[نص]
    return (text||'').replace(/\[([a-z]+)(?::\d+)?\[(.*?)\]/g,
        (m, code, inner) => `<span class="${tajweedClass(code)}">${inner}</span>`);
}
PRO2.toggleTajweed = async function(){
    const cr = window.CUR_READ; if(!cr){ return; }
    tajweedOn = !tajweedOn;
    const btn = $('rt-tajweed'); if(btn) btn.classList.toggle('active', tajweedOn);
    if (!tajweedOn){ if (typeof openFreeReading==='function') openFreeReading(cr.type, cr.num, cr.name); return; }
    const cont = $('ayahs-container'); if(!cont) return;
    const prev = cont.innerHTML;
    cont.innerHTML = `<div style="text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2.5rem;color:var(--primary-color)"></i></div>`;
    try {
        const data = await fetchOffline(`https://api.alquran.cloud/v1/${cr.type}/${cr.num}/quran-tajweed`);
        const ayahs = data.data.ayahs || data.data;
        const meta = (cr.type==='surah') ? { number:data.data.number, name:data.data.name } : null;
        let html = `<div class="tajweed-legend">
            <span><b class="tj-madd">المدّ</b></span><span><b class="tj-ghunnah">الغنّة</b></span>
            <span><b class="tj-qalqalah">القلقلة</b></span><span><b class="tj-ikhfa">الإخفاء</b></span>
            <span><b class="tj-idgham">الإدغام</b></span><span><b class="tj-iqlab">الإقلاب</b></span>
            <span><b class="tj-silent">همزة وصل/ساكن</b></span></div>`;
        let curS = 0;
        ayahs.forEach(a => {
            const aS = a.surah || meta || { number:cr.num, name:'' };
            if (aS.number !== curS){ if(curS!==0||cr.type==='juz') html += `<div class="surah-separator">سورة ${(aS.name||'').replace('سُورَةُ ','')}</div>`; curS=aS.number; if(aS.number!==1&&aS.number!==9) html += '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>'; }
            const txt = parseTajweed(a.text);
            html += `<div class="ayah" data-surah="${aS.number}" data-ayah="${a.numberInSurah}" data-global="${a.number}" onclick="onAyahTap(${aS.number},${a.numberInSurah},${a.number})" style="font-size:${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`;
        });
        cont.innerHTML = html;
        if (typeof applyReadingBg==='function') applyReadingBg();
    } catch(e){ cont.innerHTML = prev; tajweedOn=false; if(btn)btn.classList.remove('active'); alert(tr('تعذّر تحميل التجويد، تأكد من الإنترنت لأول مرة.','Could not load tajweed.')); }
};

// =======================================================
// (2) الترجمة + النطق اللاتيني (متعدد اللغات)
// =======================================================
const TRANS_LANGS = [
    { code:'en.sahih', label:'English' }, { code:'fr.hamidullah', label:'Français' },
    { code:'ur.jalandhry', label:'اردو' }, { code:'id.indonesian', label:'Indonesia' },
    { code:'tr.diyanet', label:'Türkçe' }, { code:'de.aburida', label:'Deutsch' },
    { code:'es.cortes', label:'Español' }, { code:'ru.kuliev', label:'Русский' },
    { code:'hi.farooq', label:'हिन्दी' }, { code:'bn.bengali', label:'বাংলা' }
];
let transOn = false;
let transEd = localStorage.getItem('transEd') || 'en.sahih';
PRO2.toggleTranslation = function(){
    transOn = !transOn;
    const btn = $('rt-translate'); if(btn) btn.classList.toggle('active', transOn);
    ensureTransPicker();
    $('trans-picker-row').style.display = transOn ? 'flex' : 'none';
    if (transOn) applyTranslation(); else clearTranslation();
};
function ensureTransPicker(){
    if ($('trans-picker-row')) return;
    const bar = $('reading-toolbar'); if(!bar) return;
    const row = document.createElement('div'); row.id='trans-picker-row'; row.className='trans-picker-row'; row.style.display='none';
    row.innerHTML = `<span><i class="fa-solid fa-language"></i> ${tr('اللغة','Language')}:</span>
        <select id="trans-lang" onchange="PRO2.changeTransLang()">${TRANS_LANGS.map(l=>`<option value="${l.code}" ${l.code===transEd?'selected':''}>${l.label}</option>`).join('')}</select>
        <label class="trans-translit"><input type="checkbox" id="trans-translit-cb" onchange="PRO2.applyTranslationPublic()"> ${tr('النطق اللاتيني','Transliteration')}</label>`;
    bar.insertAdjacentElement('afterend', row);
}
PRO2.changeTransLang = function(){ transEd = $('trans-lang').value; localStorage.setItem('transEd', transEd); applyTranslation(); };
PRO2.applyTranslationPublic = function(){ applyTranslation(); };
function clearTranslation(){ document.querySelectorAll('.ayah-trans, .ayah-translit').forEach(e=>e.remove()); }
async function applyTranslation(){
    const cr = window.CUR_READ; if(!cr) return;
    clearTranslation();
    const wantTranslit = $('trans-translit-cb') && $('trans-translit-cb').checked;
    try {
        const [trd, trl] = await Promise.all([
            fetchOffline(`https://api.alquran.cloud/v1/${cr.type}/${cr.num}/${transEd}`),
            wantTranslit ? fetchOffline(`https://api.alquran.cloud/v1/${cr.type}/${cr.num}/en.transliteration`) : Promise.resolve(null)
        ]);
        const tA = trd.data.ayahs || trd.data;
        const lMap = {}; if(trl){ (trl.data.ayahs||trl.data).forEach(a=>lMap[a.number]=a.text); }
        const rtl = ['ur.jalandhry'].includes(transEd) || transEd.startsWith('ur') || transEd.startsWith('fa');
        tA.forEach(a => {
            const el = document.querySelector(`.ayah[data-global="${a.number}"]`); if(!el) return;
            if (wantTranslit && lMap[a.number]){ const tl=document.createElement('div'); tl.className='ayah-translit'; tl.dir='ltr'; tl.innerText=lMap[a.number]; el.insertAdjacentElement('afterend', tl); }
            const d=document.createElement('div'); d.className='ayah-trans'; d.dir = rtl?'rtl':'ltr'; d.style.textAlign = rtl?'right':'left'; d.innerText = a.text;
            el.insertAdjacentElement('afterend', d);
        });
    } catch(e){ alert(tr('تعذّر تحميل الترجمة، تأكد من الإنترنت.','Could not load translation.')); }
}

// =======================================================
// (5) تسجيل تلاوتك
// =======================================================
let mediaRec=null, recChunks=[], recOn=false, recSurah=null;
PRO2.toggleRecord = async function(){
    if (recOn){ stopRec(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder){ alert(tr('التسجيل غير مدعوم على هذا الجهاز/المتصفّح.','Recording not supported here.')); return; }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        recChunks=[]; mediaRec=new MediaRecorder(stream); recSurah=(window.CUR_READ||{}).num;
        mediaRec.ondataavailable = e => { if(e.data.size) recChunks.push(e.data); };
        mediaRec.onstop = async () => {
            stream.getTracks().forEach(t=>t.stop());
            const blob = new Blob(recChunks, {type:'audio/webm'});
            saveRecBlob('rec_'+recSurah, blob);
            try{ localStorage.setItem('has_recorded','1'); }catch(e){}
            showRecBar(recSurah);
            if (typeof showBadgeToast==='function') showBadgeToast({emoji:'🎙️', name:tr('حُفظت تلاوتك','Recitation saved'), desc:sN(recSurah)});
            PRO2.checkBadges && PRO2.checkBadges();
        };
        mediaRec.start(); recOn=true;
        const b=$('rt-record'); if(b){ b.classList.add('rec-active'); b.innerHTML='<i class="fa-solid fa-stop"></i>'; }
    } catch(e){ alert(tr('لم يُسمح باستخدام المايكروفون.','Microphone permission denied.')); }
};
function stopRec(){ try{ mediaRec && mediaRec.stop(); }catch(e){} recOn=false; const b=$('rt-record'); if(b){ b.classList.remove('rec-active'); b.innerHTML='<i class="fa-solid fa-microphone"></i>'; } }
// تخزين تسجيل في IndexedDB المخصّص للصوت
function saveRecBlob(key, blob){ try{ const rq=indexedDB.open('AlAnwarAudio',1); rq.onsuccess=e=>{ const db=e.target.result; try{ db.transaction('audio','readwrite').objectStore('audio').put({url:key, blob}); }catch(x){} }; }catch(e){} }
PRO2.playRec = async function(surah){
    const url = await (window.PRO && PRO.getCachedAudio ? PRO.getCachedAudio('rec_'+surah) : null);
    if (url){ const a=new Audio(url); a.play(); } else alert(tr('لا يوجد تسجيل.','No recording.'));
};
function showRecBar(surah){
    let bar=$('rec-bar'); const host=$('reading-view'); if(!host) return;
    if(!bar){ bar=document.createElement('div'); bar.id='rec-bar'; bar.className='rec-bar'; const tb=$('reading-toolbar'); (tb||host).insertAdjacentElement('afterend', bar); }
    bar.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#22c55e"></i> ${tr('تلاوتك لـ','Your recitation of')} ${sN(surah)}
        <button onclick="PRO2.playRec(${surah})"><i class="fa-solid fa-play"></i> ${tr('استماع','Play')}</button>`;
}

// =======================================================
// (4) الأوسمة والإنجازات
// =======================================================
const BADGES = [
    { id:'first_read', emoji:'📖', ar:'أول تلاوة', en:'First Read', cond:s=>s.read>0 },
    { id:'streak3', emoji:'🔥', ar:'٣ أيام متتالية', en:'3-Day Streak', cond:s=>s.streak>=3 },
    { id:'streak7', emoji:'🌟', ar:'أسبوع متواصل', en:'7-Day Streak', cond:s=>s.streak>=7 },
    { id:'tasbeeh100', emoji:'📿', ar:'١٠٠ تسبيحة', en:'100 Tasbeeh', cond:s=>s.tasbeeh>=100 },
    { id:'tasbeeh1000', emoji:'💎', ar:'١٠٠٠ تسبيحة', en:'1000 Tasbeeh', cond:s=>s.tasbeeh>=1000 },
    { id:'khatma10', emoji:'🏅', ar:'١٠ صفحات ختمة', en:'10 Khatma Pages', cond:s=>s.maxPage>=10 },
    { id:'khatma100', emoji:'🏆', ar:'١٠٠ صفحة', en:'100 Pages', cond:s=>s.maxPage>=100 },
    { id:'khatma_done', emoji:'👑', ar:'ختمة كاملة', en:'Full Khatma', cond:s=>s.maxPage>=604 },
    { id:'tasks_day', emoji:'✅', ar:'أتممت ورد يوم', en:'Daily Wird Done', cond:s=>s.tasksDone },
    { id:'recorder', emoji:'🎙️', ar:'سجّلت تلاوتك', en:'Recorded Recitation', cond:s=>s.recorded },
    { id:'bookmarker', emoji:'🔖', ar:'حفظت آية', en:'Saved an Ayah', cond:s=>s.bookmarks>0 },
    { id:'night', emoji:'🌙', ar:'قارئ الليل', en:'Night Reader', cond:s=>new Date().getHours()>=1&&new Date().getHours()<5&&s.read>0 },
];
function gatherStats(){
    const g = (k,d)=>{ try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;} };
    let ach = g('achievements',{}); let kh = g('khatmas_list',[]); let bms = g('bookmarks_v1',[]);
    let maxPage = kh.reduce((m,k)=>Math.max(m,k.page||0),0);
    let ts = g('task_status_v1',{done:{}}); let defs = g('task_defs_v1',[]);
    const tasksDone = defs.length>0 && defs.every(d=>ts.done&&ts.done[d.id]);
    return {
        read: parseInt(localStorage.getItem('read_count')||(maxPage>0?'1':'0'))||(maxPage>0?1:0),
        streak: parseInt(localStorage.getItem('streak_count')||'0'),
        tasbeeh: parseInt(localStorage.getItem('tasbeehCount')||'0'),
        maxPage, tasksDone, bookmarks: bms.length,
        recorded: !!localStorage.getItem('has_recorded')
    };
}
PRO2.checkBadges = function(silent){
    const stats = gatherStats();
    let earned = []; try{ earned = JSON.parse(localStorage.getItem('badges_earned')||'[]'); }catch(e){}
    let isNew=false;
    BADGES.forEach(b => { try{ if(b.cond(stats) && !earned.includes(b.id)){ earned.push(b.id); isNew=true; if(!silent && typeof showBadgeToast==='function') showBadgeToast({emoji:b.emoji, name:tr('وسام جديد!','New Badge!'), desc:(L()==='en'?b.en:b.ar)}); } }catch(e){} });
    if(isNew) localStorage.setItem('badges_earned', JSON.stringify(earned));
    return earned;
};
PRO2.openBadges = function(){
    ensureBadgesModal();
    const earned = PRO2.checkBadges(true);
    $('badges-grid').innerHTML = BADGES.map(b => {
        const has = earned.includes(b.id);
        return `<div class="badge-cell ${has?'earned':''}"><div class="badge-emoji">${b.emoji}</div><div class="badge-name">${L()==='en'?b.en:b.ar}</div>${has?'<i class="fa-solid fa-circle-check badge-tick"></i>':'<i class="fa-solid fa-lock badge-lock"></i>'}</div>`;
    }).join('');
    const done = earned.length, total = BADGES.length;
    $('badges-progress').innerText = `${done} / ${total}`;
    $('badges-bar-fill').style.width = Math.round(done/total*100)+'%';
    $('badges-modal').classList.add('active');
};
PRO2.closeBadges = function(){ const m=$('badges-modal'); if(m) m.classList.remove('active'); };
function ensureBadgesModal(){
    if ($('badges-modal')) return;
    const d=document.createElement('div'); d.id='badges-modal'; d.className='qibla-overlay';
    d.innerHTML = `<div class="qibla-modal" style="width:94%;max-width:440px;">
        <button class="close-qibla" onclick="PRO2.closeBadges()"><i class="fa-solid fa-xmark"></i></button>
        <h2 style="color:var(--primary-color);margin-bottom:6px;"><i class="fa-solid fa-medal"></i> ${tr('إنجازاتي','My Achievements')}</h2>
        <div class="badges-prog-wrap"><div class="badges-bar"><div id="badges-bar-fill"></div></div><span id="badges-progress"></span></div>
        <div id="badges-grid" class="badges-grid"></div></div>`;
    document.body.appendChild(d);
}

// =======================================================
// (6) تذكير الورد اليومي الذكي
// =======================================================
PRO2.scheduleWirdReminder = async function(time){
    localStorage.setItem('wird_time', time);
    if (!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;
    try {
        const LN = Capacitor.Plugins.LocalNotifications;
        await LN.requestPermissions();
        const [h,m] = time.split(':').map(Number);
        await LN.cancel({ notifications:[{id:2000}] });
        await LN.schedule({ notifications:[{ id:2000, title:tr('وردك اليومي 🌿','Your daily wird 🌿'), body:tr('وقت وردك من القرآن، لا تنسَ نصيبك اليوم.','Time for your Quran wird today.'), schedule:{ on:{hour:h,minute:m}, repeats:true, allowWhileIdle:true } }] });
    } catch(e){}
};

// =======================================================
// (8) قصة الآية (بطاقة متحركة للمشاركة)
// =======================================================
PRO2.openStory = function(){
    const a = window._lastAyah; if(!a){ return; }
    ensureStory();
    $('story-text').innerText = a.text || '';
    $('story-ref').innerText = `﴿ ${tr('سورة','')} ${sN(a.surah)} : ${a.ayah} ﴾`;
    const m=$('story-modal'); m.classList.add('active');
    // أعد تشغيل الأنيميشن
    const card=$('story-card'); card.style.animation='none'; void card.offsetWidth; card.style.animation='';
};
PRO2.closeStory = function(){ const m=$('story-modal'); if(m) m.classList.remove('active'); };
function ensureStory(){
    if ($('story-modal')) return;
    const d=document.createElement('div'); d.id='story-modal'; d.className='story-overlay';
    d.innerHTML = `<button class="story-close" onclick="PRO2.closeStory()"><i class="fa-solid fa-xmark"></i></button>
        <div id="story-card" class="story-card">
            <div class="story-bismillah">﷽</div>
            <div id="story-text" class="story-text"></div>
            <div id="story-ref" class="story-ref"></div>
            <div class="story-brand">تطبيق الأنوار</div>
        </div>
        <p class="story-hint">${tr('التقط صورة للشاشة وشاركها 📸','Screenshot and share 📸')}</p>`;
    document.body.appendChild(d);
}

// =======================================================
// حقن: زر القصة في التفسير + عناصر الرئيسية + إعادة تطبيق عند تغيّر القراءة
// =======================================================
function injectExtras(){
    // زر القصة في مودال التفسير
    const acts = document.querySelector('#tafsir-modal .tafsir-actions');
    if (acts && !$('taf-story-btn')){ const b=document.createElement('button'); b.id='taf-story-btn'; b.className='rt-btn'; b.innerHTML=`<i class="fa-solid fa-wand-magic-sparkles"></i> ${tr('قصة','Story')}`; b.onclick=PRO2.openStory; acts.appendChild(b); }
    // أيقونة الإنجازات في شريط التطبيقات
    const scroll = document.querySelector('.apps-scroll');
    if (scroll && !$('pro2-apps')){ scroll.insertAdjacentHTML('beforeend', `<div class="app-item" onclick="PRO2.openBadges()"><div class="app-icon" style="background:rgba(212,168,67,0.12);color:var(--accent-color);"><i class="fa-solid fa-medal"></i></div><span>${tr('إنجازاتي','Badges')}</span></div>`); const f=document.createElement('span'); f.id='pro2-apps'; f.style.display='none'; scroll.appendChild(f); }
    // إعداد تذكير الورد
    const list = document.querySelector('#tab-settings .settings-list');
    if (list && !$('wird-time-input')){
        const grp = [...list.querySelectorAll('.set-group-title')].find(el=>el.dataset.i18n==='grp_data');
        const row=document.createElement('div'); row.className='setting-item';
        row.innerHTML = `<span class="set-ico"><i class="fa-solid fa-bell-concierge"></i></span><span class="set-label">${tr('تذكير الورد اليومي','Daily wird reminder')}</span><input type="time" id="wird-time-input" class="rt-reciter" style="width:auto;">`;
        if(grp) list.insertBefore(row, grp); else list.appendChild(row);
        const inp=$('wird-time-input'); inp.value = localStorage.getItem('wird_time')||'';
        inp.addEventListener('change', e=>{ if(e.target.value) PRO2.scheduleWirdReminder(e.target.value); });
    }
    // مجموعة "عن التطبيق" (تُضاف مرة واحدة قبل البيانات)
    if (list && !$('about-group-added')){
        const grp = [...list.querySelectorAll('.set-group-title')].find(el=>el.dataset.i18n==='grp_data');
        const w=document.createElement('div'); w.id='about-group-added';
        const row=(ico,label,onclick)=>`<div class="setting-item" onclick="${onclick}"><span class="set-ico"><i class="fa-solid ${ico}"></i></span><span class="set-label">${label}</span><i class="fa-solid fa-chevron-left ath-chevron"></i></div>`;
        w.innerHTML = `<div class="set-group-title">${tr('عن التطبيق','About')}</div>`
            + row('fa-share-nodes', tr('شارك التطبيق','Share App'), 'PRO2.shareApp()')
            + row('fa-star', tr('قيّم التطبيق','Rate App'), 'PRO2.rateApp()')
            + row('fa-shield-halved', tr('سياسة الخصوصية','Privacy Policy'), 'PRO2.openPrivacy()')
            + row('fa-circle-info', tr('عن التطبيق','About'), 'PRO2.openAbout()')
            + row('fa-bug', tr('الإبلاغ عن مشكلة','Report a Problem'), 'PRO2.reportProblem()');
        if(grp) list.insertBefore(w, grp); else list.appendChild(w);
    }
}
PRO2.shareApp = function(){ const msg=tr('حمّل تطبيق الأنوار الإسلامي 🌙','Get Al-Anwar Islamic app 🌙'); if(navigator.share) navigator.share({title:'الأنوار',text:msg}).catch(()=>{}); else { try{navigator.clipboard.writeText(msg);}catch(e){} alert(tr('تم نسخ رسالة المشاركة.','Share text copied.')); } };
PRO2.rateApp = function(){ alert(tr('شكراً لك! سيتوفّر التقييم بعد نشر التطبيق على المتجر.','Thank you! Rating opens after the app is published.')); };
PRO2.reportProblem = function(){ const u='https://wa.me/905551517264?text='+encodeURIComponent(tr('السلام عليكم، لديّ ملاحظة على تطبيق الأنوار:','Feedback on Al-Anwar app:')); window.open(u,'_blank'); };
PRO2.openAbout = function(){ alert(tr('تطبيق الأنوار الإسلامي\nمصحف أوفلاين + أذكار وأدعية + ختمات + قبلة + تنبيهات أذان.\nالإصدار 1.0','Al-Anwar Islamic App\nOffline Quran + Athkar + Khatmas + Qibla + Athan.\nVersion 1.0')); };
PRO2.openPrivacy = function(){
    alert(tr(
'سياسة الخصوصية — تطبيق الأنوار\n\n• لا نجمع أي بيانات شخصية ولا نشاركها مع أي طرف.\n• كل بياناتك (الختمات، المهام، المفضّلة) تُحفظ محلياً على جهازك فقط.\n• يُطلب الموقع فقط لحساب أوقات الصلاة والقبلة، ولا يُرسل لأي خادم.\n• الإشعارات والمايكروفون تُستخدم فقط بإذنك ولأغراض التطبيق.\n• نصوص القرآن والتفسير من مصادر معتمدة (مجمع الملك فهد / alquran.cloud).',
'Privacy Policy — Al-Anwar\n\n• We collect NO personal data and share nothing.\n• All your data (khatmas, tasks, bookmarks) stays locally on your device.\n• Location is used only for prayer times & qibla, never sent to a server.\n• Notifications & microphone are used only with your permission.\n• Quran & tafsir texts are from trusted sources (KFGQPC / alquran.cloud).'));
};
// إعادة تطبيق التجويد/الترجمة بعد إعادة رسم القراءة + رصد الإنجازات
const _orr = window.onReadingRendered;
window.onReadingRendered = function(){
    if (typeof _orr==='function') _orr();
    tajweedOn=false; transOn=false;
    const tb=$('rt-tajweed'); if(tb)tb.classList.remove('active');
    const tt=$('rt-translate'); if(tt)tt.classList.remove('active');
    const tp=$('trans-picker-row'); if(tp)tp.style.display='none';
    const rb=$('rec-bar'); if(rb) rb.remove();
    try{ localStorage.setItem('read_count', String((parseInt(localStorage.getItem('read_count')||'0'))+1)); }catch(e){}
    setTimeout(()=>{ injectExtras(); PRO2.checkBadges && PRO2.checkBadges(); }, 100);
};

// احقن زر القصة بعد فتح التفسير
const _oat = window.onAyahTap;
window.onAyahTap = function(){ const r = (typeof _oat==='function') ? _oat.apply(this, arguments) : undefined; setTimeout(injectExtras, 150); return r; };

function initPro2(){ injectExtras(); PRO2.checkBadges(true); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(initPro2, 700));
else setTimeout(initPro2, 700);
})();
