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
// اختر صيغة تسجيل مدعومة (mp4/aac على iOS، webm على غيره)
function pickRecMime(){
    const cands = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
    if (window.MediaRecorder && MediaRecorder.isTypeSupported){
        for (const c of cands){ try{ if (MediaRecorder.isTypeSupported(c)) return c; }catch(e){} }
    }
    return '';
}
PRO2.toggleRecord = async function(){
    if (recOn){ stopRec(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder){ alert(tr('التسجيل غير مدعوم على هذا الجهاز/المتصفّح.','Recording not supported here.')); return; }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        recChunks=[]; recSurah=(window.CUR_READ||{}).num;
        const mime = pickRecMime();
        mediaRec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        mediaRec.ondataavailable = e => { if(e.data && e.data.size) recChunks.push(e.data); };
        mediaRec.onstop = async () => {
            stream.getTracks().forEach(t=>t.stop());
            const type = (mediaRec && mediaRec.mimeType) || mime || 'audio/mp4';
            const blob = new Blob(recChunks, { type });
            saveRecBlob('rec_'+recSurah, blob);
            try{ localStorage.setItem('has_recorded','1'); }catch(e){}
            showRecBar(recSurah);
            if (typeof showBadgeToast==='function') showBadgeToast({emoji:'🎙️', name:tr('حُفظت تلاوتك','Recitation saved'), desc:sN(recSurah)});
            PRO2.checkBadges && PRO2.checkBadges();
        };
        mediaRec.start(500); recOn=true;  // timeslice يضمن تدفّق البيانات على iOS
        const b=$('rt-record'); if(b){ b.classList.add('rec-active'); b.innerHTML='<i class="fa-solid fa-stop"></i>'; }
    } catch(e){ alert(tr('لم يُسمح باستخدام المايكروفون.','Microphone permission denied.')); }
};
function stopRec(){ try{ mediaRec && mediaRec.stop(); }catch(e){} recOn=false; const b=$('rt-record'); if(b){ b.classList.remove('rec-active'); b.innerHTML='<i class="fa-solid fa-microphone"></i>'; } }
// تخزين تسجيل في IndexedDB المخصّص للصوت
function saveRecBlob(key, blob){ try{ const rq=indexedDB.open('AlAnwarAudio',1); rq.onsuccess=e=>{ const db=e.target.result; try{ db.transaction('audio','readwrite').objectStore('audio').put({url:key, blob}); }catch(x){} }; }catch(e){} }
PRO2.playRec = async function(surah){
    let url = null;
    try { url = await (window.PRO && PRO.getCachedAudio ? PRO.getCachedAudio('rec_'+surah) : null); } catch(e){}
    if (!url){ alert(tr('لا يوجد تسجيل محفوظ.','No saved recording.')); return; }
    const a = new Audio(url);
    a.play().catch(()=> alert(tr('تعذّر تشغيل التسجيل على هذا الجهاز.','Cannot play the recording on this device.')));
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
    $('story-ref').innerText = a.refText ? a.refText : `﴿ ${tr('سورة','')} ${sN(a.surah)} : ${a.ayah} ﴾`;
    const m=$('story-modal'); m.classList.add('active');
    // أعد تشغيل الأنيميشن
    const card=$('story-card'); card.style.animation='none'; void card.offsetWidth; card.style.animation='';
};
PRO2.closeStory = function(){ const m=$('story-modal'); if(m) m.classList.remove('active'); };

// =======================================================
// بطاقات وتصاميم — معرض آيات وأحاديث → صمّمها (لون/خلفية) واحفظها/انشرها
// =======================================================
const CARDS = [
    // آيات قصيرة (مع مرجع سورة:آية)
    {t:'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', s:94, a:5},
    {t:'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ', s:53, a:39},
    {t:'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', s:13, a:28},
    {t:'وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ', s:3, a:134},
    {t:'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', s:2, a:153},
    {t:'وَقُل رَّبِّ زِدْنِي عِلْمًا', s:20, a:114},
    {t:'فَاذْكُرُونِي أَذْكُرْكُمْ', s:2, a:152},
    {t:'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', s:65, a:2},
    {t:'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ', s:57, a:4},
    {t:'إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ الْمُحْسِنِينَ', s:7, a:56},
    {t:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', s:3, a:173},
    {t:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً', s:2, a:201},
    // أحاديث قصيرة (مرجع نصّي)
    {t:'الدِّينُ النَّصِيحَةُ', r:'رواه مسلم'},
    {t:'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', r:'متفق عليه'},
    {t:'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', r:'متفق عليه'},
    {t:'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', r:'متفق عليه'},
    {t:'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ', r:'رواه الترمذي'},
    {t:'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ', r:'رواه الترمذي'},
    {t:'الطُّهُورُ شَطْرُ الْإِيمَانِ', r:'رواه مسلم'},
    {t:'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ', r:'متفق عليه'},
    {t:'مَنْ لَا يَرْحَمُ النَّاسَ لَا يَرْحَمُهُ اللَّهُ', r:'متفق عليه'},
    {t:'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ', r:'متفق عليه'},
    {t:'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', r:'رواه البخاري'},
    {t:'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ', r:'رواه مسلم'},
];
window.AnwarCards = {
    open:function(){
        let m=$('cards-modal');
        if(!m){ m=document.createElement('div'); m.id='cards-modal'; m.className='qibla-overlay';
            m.innerHTML=`<div class="qibla-modal" style="width:94%;max-width:460px;text-align:right;max-height:86vh;overflow-y:auto;">
                <button class="close-qibla" onclick="document.getElementById('cards-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                <h2 style="color:var(--accent-color);margin-bottom:4px;text-align:center;"><i class="fa-solid fa-wand-magic-sparkles"></i> ${tr('بطاقات وتصاميم','Cards & Designs')}</h2>
                <p style="color:var(--text-muted);font-size:0.82rem;text-align:center;margin-bottom:14px;">${tr('اختر آية أو حديثاً، صمّم لونه وخلفيته، ثم احفظه أو انشره.','Pick an ayah or hadith, design its color, then save or share.')}</p>
                <div id="cards-grid" class="cards-grid"></div></div>`;
            document.body.appendChild(m);
            $('cards-grid').innerHTML = CARDS.map((c,i)=>`<div class="design-card" onclick="AnwarCards.design(${i})">
                <span class="dc-quote">${c.t}</span>
                <span class="dc-ref">${c.r ? c.r : ('﴿ '+sN(c.s)+' : '+c.a+' ﴾')}</span></div>`).join('');
        }
        m.classList.add('active');
    },
    design:function(i){
        const c=CARDS[i]; if(!c) return;
        window._lastAyah = c.r ? { text:c.t, refText:c.r } : { surah:c.s, ayah:c.a, text:c.t };
        const m=$('cards-modal'); if(m) m.classList.remove('active');
        PRO2.openStory();
    }
};
function ensureStory(){
    if ($('story-modal')) return;
    const d=document.createElement('div'); d.id='story-modal'; d.className='story-overlay';
    const bgs = [
        'radial-gradient(circle at 50% 30%, #4A2C1A, #14110B 75%)',
        'radial-gradient(circle at 50% 30%, #0D3B2E, #07160F 75%)',
        'radial-gradient(circle at 50% 25%, #1B2A4A, #070C16 75%)',
        'radial-gradient(circle at 50% 30%, #3A2140, #140A18 75%)',
        'radial-gradient(circle at 50% 30%, #5A4410, #14110B 75%)',
        'linear-gradient(160deg, #1A1A1A, #000)',
        'radial-gradient(circle at 50% 30%, #0B3B3B, #06181A 75%)',
        'radial-gradient(circle at 50% 30%, #4A1420, #16090C 75%)',
        'radial-gradient(circle at 50% 30%, #14294A, #05080F 75%)',
        'radial-gradient(circle at 50% 30%, #2E2A12, #100E06 75%)'
    ];
    const swatches = bgs.map((b,i)=>`<button class="story-sw" style="background:${b}" onclick="PRO2.setStoryBg(${i})"></button>`).join('');
    const ornNames=['بسيط','مزدوج','سميك','خطوط','نجوم'];
    const ornEn=['Simple','Double','Thick','Lines','Stars'];
    const orns = ornNames.map((n,i)=>`<button class="story-orn-btn" onclick="PRO2.setStoryOrn(${i})">${L()==='en'?ornEn[i]:n}</button>`).join('');
    d.innerHTML = `<button class="story-close" onclick="PRO2.closeStory()"><i class="fa-solid fa-xmark"></i></button>
        <div id="story-card" class="story-card">
            <div class="story-bismillah">﷽</div>
            <div id="story-text" class="story-text"></div>
            <div id="story-ref" class="story-ref"></div>
            <div class="story-brand">anwar</div>
        </div>
        <div class="story-swatches">${swatches}</div>
        <div class="story-orns">${orns}</div>
        <button class="story-save" onclick="PRO2.saveStoryImage()"><i class="fa-solid fa-download"></i> ${tr('حفظ الصورة بدقة عالية','Save HD image')}</button>
        <p class="story-hint">${tr('اختر اللون والزخرفة ثم احفظ الصورة','Pick color & frame then save')}</p>`;
    document.body.appendChild(d);
    d._bgs = bgs;
    const sb = localStorage.getItem('story_bg'); PRO2.setStoryBg(sb!=null?+sb:0);
    const so = localStorage.getItem('story_orn'); PRO2.setStoryOrn(so!=null?+so:0);
}
PRO2.setStoryBg = function(i){
    const d=$('story-modal'); const card=$('story-card'); if(!d||!card||!d._bgs[i]) return;
    card.style.background = d._bgs[i]; localStorage.setItem('story_bg', i);
    d.querySelectorAll('.story-sw').forEach((b,bi)=>b.classList.toggle('on', bi===i));
};
PRO2.setStoryOrn = function(i){
    const card=$('story-card'); const d=$('story-modal'); if(!card) return;
    card.classList.remove('orn-0','orn-1','orn-2','orn-3','orn-4');
    card.classList.add('orn-'+i); localStorage.setItem('story_orn', i);
    if(d) d.querySelectorAll('.story-orn-btn').forEach((b,bi)=>b.classList.toggle('on', bi===i));
};
// لفّ نص عربي على أسطر بعرض محدّد
function _wrapText(ctx, text, maxW){
    const words=(text||'').split(/\s+/); const lines=[]; let line='';
    words.forEach(w=>{ const test=line?line+' '+w:w; if(ctx.measureText(test).width>maxW && line){ lines.push(line); line=w; } else line=test; });
    if(line) lines.push(line); return lines;
}
// حفظ القصة كصورة PNG بدقة عالية (1080×1920) — ليست لقطة شاشة
PRO2.saveStoryImage = async function(){
    const a=window._lastAyah; if(!a){ return; }
    const idx=+(localStorage.getItem('story_bg')||0);
    const orn=+(localStorage.getItem('story_orn')||0);
    const pairs=[['#4A2C1A','#14110B'],['#0D3B2E','#07160F'],['#1B2A4A','#070C16'],['#3A2140','#140A18'],['#5A4410','#14110B'],['#262626','#000000'],['#0B3B3B','#06181A'],['#4A1420','#16090C'],['#14294A','#05080F'],['#2E2A12','#100E06']];
    const [c1,c2]=pairs[idx]||pairs[0];
    const W=1080,H=1920; const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const ctx=cv.getContext('2d');
    try{ await document.fonts.load('64px Amiri'); await document.fonts.load('120px Amiri'); }catch(e){}
    const g=ctx.createRadialGradient(W/2,H*0.30,60,W/2,H*0.30,H); g.addColorStop(0,c1); g.addColorStop(1,c2);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // الزخرفة (الإطار)
    const GD='rgba(242,210,122,0.75)', GD2='rgba(212,168,67,0.4)';
    if(orn===0){ ctx.strokeStyle=GD2; ctx.lineWidth=5; ctx.strokeRect(46,46,W-92,H-92); }
    else if(orn===1){ ctx.strokeStyle=GD; ctx.lineWidth=6; ctx.strokeRect(40,40,W-80,H-80); ctx.strokeStyle=GD2; ctx.lineWidth=3; ctx.strokeRect(64,64,W-128,H-128); }
    else if(orn===2){ ctx.strokeStyle=GD; ctx.lineWidth=16; ctx.strokeRect(56,56,W-112,H-112); }
    else if(orn===3){ ctx.strokeStyle=GD; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(120,150); ctx.lineTo(W-120,150); ctx.moveTo(120,H-150); ctx.lineTo(W-120,H-150); ctx.stroke(); }
    else if(orn===4){ ctx.strokeStyle=GD2; ctx.lineWidth=4; ctx.strokeRect(50,50,W-100,H-100); ctx.fillStyle=GD; ctx.font='70px Amiri, serif'; ctx.textAlign='center'; ['۞'].forEach(()=>{}); ctx.fillText('۞',110,130); ctx.fillText('۞',W-110,130); ctx.fillText('۞',110,H-90); ctx.fillText('۞',W-110,H-90); }
    ctx.textAlign='center'; try{ctx.direction='rtl';}catch(e){}
    ctx.fillStyle='rgba(212,168,67,0.6)'; ctx.font='150px Amiri, serif'; ctx.fillText('﷽', W/2, 360);
    ctx.fillStyle='#FAF6EE'; ctx.font='66px Amiri, serif';
    const lines=_wrapText(ctx, a.text, W-300);
    let y=H/2 - (lines.length-1)*62; lines.forEach(l=>{ ctx.fillText(l, W/2, y); y+=124; });
    ctx.fillStyle='#D4A843'; ctx.font='46px Amiri, serif';
    ctx.fillText(a.refText ? a.refText : ('﴿ '+tr('سورة','')+' '+sN(a.surah)+' : '+a.ayah+' ﴾'), W/2, y+30);
    ctx.fillStyle='rgba(250,246,238,0.5)'; ctx.font='32px Tajawal, sans-serif';
    ctx.fillText('anwar', W/2, H-110);
    cv.toBlob(async (blob)=>{
        if(!blob){ return; }
        const file=new File([blob], 'anwar-ayah.png', {type:'image/png'});
        try{
            if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:tr('آية','Ayah')}); return; }
        }catch(e){}
        // احتياطي: تنزيل مباشر
        const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='anwar-ayah.png'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
    }, 'image/png');
};

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
PRO2.rateApp = function(){ try{ window.open('https://apps.apple.com/app/id6782741099?action=write-review','_blank'); }catch(e){} };
PRO2.openSocial = function(){ try{ window.open('https://www.instagram.com/jad.s.a.y','_blank'); }catch(e){} };
// مودال عام أنيق
function infoModal(id, title, icon, html){
    let m=$(id);
    if(!m){ m=document.createElement('div'); m.id=id; m.className='qibla-overlay';
        m.innerHTML=`<div class="qibla-modal" style="width:94%;max-width:440px;text-align:right;max-height:86vh;overflow-y:auto;">
            <button class="close-qibla" onclick="document.getElementById('${id}').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
            <div class="info-hero"><div class="info-ico"><i class="fa-solid ${icon}"></i></div><h2 id="${id}-t"></h2></div>
            <div id="${id}-b"></div></div>`;
        document.body.appendChild(m);
    }
    $(id+'-t').textContent=title; $(id+'-b').innerHTML=html; m.classList.add('active');
}
PRO2.openAbout = function(){
    infoModal('about-modal', tr('عن التطبيق','About'), 'fa-circle-info',
        `<p class="info-p">${tr('تطبيق الأنوار الإسلامي — رفيقك الإيماني المتكامل.','Al-Anwar — your complete faith companion.')}</p>
         <div class="info-feats">
           ${['fa-book-quran|مصحف كامل أوفلاين|Full offline Quran','fa-person-praying|أذكار وأدعية بمصادرها|Sourced adhkar & du\'a','fa-mosque|أوقات صلاة دقيقة + قبلة|Accurate prayer times & qibla','fa-bell|تنبيهات أذان تعمل والهاتف مقفل|Athan alerts when locked','fa-users|ختمة جماعية متزامنة|Live group khatma','fa-star|نقاط ومكافآت للتحفيز|Points & rewards'].map(f=>{const[i,a,e]=f.split('|');return `<div class="info-feat"><i class="fa-solid ${i}"></i><span>${L()==='en'?e:a}</span></div>`;}).join('')}
         </div>
         <p class="info-ver">${tr('تطبيق الأنوار · الإصدار 1.5','Al-Anwar · Version 1.5')}</p>`);
};
PRO2.openPrivacy = function(){
    const items = L()==='en'
      ? ['We collect NO personal data and share nothing with anyone.','All your data (khatmas, tasks, bookmarks, points) stays locally on your device.','Location is used only to compute prayer times & qibla — never sent to any server.','Notifications & microphone are used only with your permission, for app features.','No account or login is required.','Quran & tafsir texts are from trusted sources (KFGQPC / alquran.cloud).']
      : ['لا نجمع أي بيانات شخصية ولا نشاركها مع أي طرف.','كل بياناتك (الختمات، المهام، المفضّلة، النقاط) تُحفظ محلياً على جهازك فقط.','يُطلب الموقع فقط لحساب أوقات الصلاة والقبلة، ولا يُرسل لأي خادم.','الإشعارات والمايكروفون تُستخدم فقط بإذنك ولأغراض التطبيق.','لا حاجة لإنشاء حساب أو تسجيل دخول.','نصوص القرآن والتفسير من مصادر معتمدة (مجمع الملك فهد / alquran.cloud).'];
    infoModal('privacy-modal', tr('سياسة الخصوصية','Privacy Policy'), 'fa-shield-halved',
        `<div class="info-list">${items.map(t=>`<div class="info-li"><i class="fa-solid fa-check"></i><span>${t}</span></div>`).join('')}</div>
         <p class="info-ver">${tr('آخر تحديث 2026 · بياناتك ملكك وحدك 🤍','Updated 2026 · Your data is yours only 🤍')}</p>`);
};
PRO2.reportProblem = function(){
    infoModal('report-modal', tr('الإبلاغ عن مشكلة / اقتراح','Report a problem'), 'fa-bug',
        `<p class="info-p">${tr('اكتب المشكلة أو الاقتراح وسيصلني مباشرة عبر واتساب 🤍','Write your issue or idea; it reaches me directly via WhatsApp 🤍')}</p>
         <textarea id="report-text" class="modal-input" style="min-height:120px;resize:vertical;" placeholder="${tr('اكتب هنا...','Write here...')}"></textarea>
         <button class="tasbeeh-pill" style="width:100%;margin-top:12px;" onclick="PRO2.sendReport()"><i class="fa-brands fa-whatsapp"></i> ${tr('إرسال','Send')}</button>`);
};
PRO2.sendReport = function(){
    const t=($('report-text')||{}).value||''; if(!t.trim()){ alert(tr('اكتب رسالتك أولاً.','Write your message first.')); return; }
    const head=tr('ملاحظة على تطبيق الأنوار:','Al-Anwar feedback:');
    const u='https://wa.me/905551517264?text='+encodeURIComponent(head+'\n'+t.trim());
    const m=$('report-modal'); if(m) m.classList.remove('active');
    window.open(u,'_blank');
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

// =======================================================
// حديث اليوم + دعاء اليوم (تتحدّث يومياً، أوفلاين، مصادر موثّقة)
// =======================================================
const HADITHS = [
 {t:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى.', s:'متفق عليه'},
 {t:'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ.', s:'متفق عليه'},
 {t:'الدِّينُ النَّصِيحَةُ.', s:'مسلم'},
 {t:'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ.', s:'متفق عليه'},
 {t:'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ.', s:'متفق عليه'},
 {t:'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ.', s:'الترمذي'},
 {t:'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ.', s:'متفق عليه'},
 {t:'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ.', s:'الترمذي'},
 {t:'مَنْ لَا يَرْحَمُ النَّاسَ لَا يَرْحَمُهُ اللَّهُ.', s:'متفق عليه'},
 {t:'مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ.', s:'الترمذي'},
 {t:'احْرِصْ عَلَى مَا يَنْفَعُكَ وَاسْتَعِنْ بِاللَّهِ وَلَا تَعْجِزْ.', s:'مسلم'},
 {t:'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ.', s:'مسلم'},
 {t:'الطُّهُورُ شَطْرُ الإِيمَانِ.', s:'مسلم'},
 {t:'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ.', s:'مسلم'},
 {t:'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ.', s:'البخاري'},
 {t:'لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا وَلَوْ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلْقٍ.', s:'مسلم'},
 {t:'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ، وَفِي كُلٍّ خَيْرٌ.', s:'مسلم'},
 {t:'إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ.', s:'مسلم'},
 {t:'الْحَيَاءُ لَا يَأْتِي إِلَّا بِخَيْرٍ.', s:'متفق عليه'},
 {t:'مَنْ صَلَّى الْفَجْرَ فِي جَمَاعَةٍ فَهُوَ فِي ذِمَّةِ اللَّهِ.', s:'مسلم'}
];
const DUAS = [
 {t:'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ.', s:'أبو داود'},
 {t:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ.', s:'ابن ماجه'},
 {t:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي.', s:'طه: 25-26'},
 {t:'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي.', s:'مسلم'},
 {t:'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ.', s:'الحاكم'},
 {t:'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي.', s:'الترمذي'},
 {t:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً.', s:'آل عمران: 8'},
 {t:'اللَّهُمَّ أَصْلِحْ لِي دِينِي وَدُنْيَايَ وَآخِرَتِي.', s:'مسلم'},
 {t:'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.', s:'أبو داود'},
 {t:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.', s:'البقرة: 201'},
 {t:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى.', s:'مسلم'},
 {t:'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ.', s:'صحيح'},
 {t:'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ.', s:'الترمذي'},
 {t:'اللَّهُمَّ اخْتِمْ لَنَا بِخَيْرٍ، وَاجْعَلْ خَيْرَ أَعْمَالِنَا خَوَاتِيمَهَا.', s:'صحيح الجامع'}
];
function dayIndex(){ const d=new Date(); return Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000); }
function injectDailyCards(){
    const anchor = $('ayah-of-day-card'); if(!anchor || $('daily-extra')) return;
    const di = dayIndex();
    const h = HADITHS[di % HADITHS.length], du = DUAS[di % DUAS.length];
    const wrap = document.createElement('div'); wrap.id='daily-extra';
    wrap.innerHTML = `
      <div class="daily-card" id="hadith-day-card">
        <div class="daily-head"><span class="daily-label"><i class="fa-solid fa-comment-dots"></i> ${tr('حديث اليوم','Hadith of the Day')}</span>
        <button class="daily-share" onclick="PRO2.shareDaily('hadith')"><i class="fa-solid fa-share-nodes"></i></button></div>
        <p class="daily-text" id="hadith-day-text">${h.t}</p><span class="daily-ref">${h.s}</span></div>
      <div class="daily-card" id="dua-day-card">
        <div class="daily-head"><span class="daily-label"><i class="fa-solid fa-hands-praying"></i> ${tr('دعاء اليوم','Dua of the Day')}</span>
        <button class="daily-share" onclick="PRO2.shareDaily('dua')"><i class="fa-solid fa-share-nodes"></i></button></div>
        <p class="daily-text" id="dua-day-text">${du.t}</p><span class="daily-ref">${du.s}</span></div>`;
    anchor.insertAdjacentElement('afterend', wrap);
}
PRO2.shareDaily = function(kind){
    const di=dayIndex(); const item = kind==='hadith'?HADITHS[di%HADITHS.length]:DUAS[di%DUAS.length];
    const label = kind==='hadith'?tr('حديث اليوم','Hadith of the Day'):tr('دعاء اليوم','Dua of the Day');
    const msg = `${item.t}\n— ${item.s}\n\n📿 ${tr('تطبيق الأنوار','Al-Anwar App')}`;
    if(navigator.share) navigator.share({text:msg}).catch(()=>{}); else { try{navigator.clipboard.writeText(msg);}catch(e){} alert(tr('تم النسخ','Copied')); }
};

// =======================================================
// تخصيص عرض الواجهة الرئيسية (اختر ما يظهر)
// =======================================================
const HOME_SECTIONS = [
    { key:'prayer',   ar:'أوقات الصلاة', en:'Prayer times', sel:['#tab-home .section-header:has(h3[data-i18n="prayer_times"])', '#tab-home .prayer-grid'] },
    { key:'ayah',     ar:'آية اليوم', en:'Ayah of the day', sel:['#ayah-of-day-card'] },
    { key:'daily',    ar:'حديث ودعاء اليوم', en:'Hadith & Du’a', sel:['#daily-extra'] },
    { key:'continue', ar:'متابعة القراءة والورد', en:'Continue & Wird', sel:['#pro-home'] },
    { key:'khatma',   ar:'ختماتي القرآنية', en:'My Khatmas', sel:['#tab-home .khatma-manager-card'] },
    { key:'achieve',  ar:'إنجازات اليوم', en:'Today’s goals', sel:['#tab-home .section-header:has(h3[data-i18n="today_achievements"])', '#tab-home .achievement-rings-card'] },
    { key:'tasks',    ar:'مهماتي اليومية', en:'Daily tasks', sel:['#tab-home .section-header:has(h3[data-i18n="daily_tasks"])', '#tab-home .daily-tasks-card'] },
    { key:'apps',     ar:'الاختصارات', en:'Shortcuts', sel:['#tab-home .section-header:has(h3[data-i18n="your_apps"])', '#tab-home .apps-scroll'] }
];
function homePrefs(){ try{ return JSON.parse(localStorage.getItem('home_sections')||'{}'); }catch(e){ return {}; } }
function homeOrder(){
    let saved=[]; try{ saved = JSON.parse(localStorage.getItem('home_order')||'[]'); }catch(e){ saved=[]; }
    const valid = saved.filter(k => HOME_SECTIONS.some(s=>s.key===k));
    // أضف أي أقسام جديدة لم تكن محفوظة بنهاية الترتيب
    HOME_SECTIONS.forEach(s => { if(!valid.includes(s.key)) valid.push(s.key); });
    return valid;
}
PRO2.applyHomeSections = function(){
    const pref = homePrefs();
    // إظهار/إخفاء
    HOME_SECTIONS.forEach(s => {
        const show = pref[s.key] !== false; // افتراضياً ظاهر
        s.sel.forEach(q => { document.querySelectorAll(q).forEach(el => { el.style.display = show ? '' : 'none'; }); });
    });
    // إعادة الترتيب: ننقل عناصر كل قسم لتسبق بطاقة التبرّع (تبقى في الأسفل والهيرو في الأعلى)
    const home = document.getElementById('tab-home'); if(!home) return;
    const anchor = home.querySelector('.donate-card') || home.querySelector('#khatma-view');
    if(!anchor) return;
    homeOrder().forEach(key => {
        const s = HOME_SECTIONS.find(x=>x.key===key); if(!s) return;
        s.sel.forEach(q => { home.querySelectorAll(q).forEach(el => { if(el!==anchor) anchor.parentNode.insertBefore(el, anchor); }); });
    });
};
PRO2.openCustomizeHome = function(){
    ensureCustomizeModal();
    const pref = homePrefs();
    const order = homeOrder();
    $('ch-body').innerHTML = order.map((key,i) => {
        const s = HOME_SECTIONS.find(x=>x.key===key); if(!s) return '';
        const on = pref[s.key] !== false;
        const upDis = i===0 ? 'disabled' : '';
        const dnDis = i===order.length-1 ? 'disabled' : '';
        return `<div class="ch-row">
            <div class="ch-move">
                <button class="ch-arrow" ${upDis} onclick="PRO2.moveHomeSection('${s.key}',-1)"><i class="fa-solid fa-chevron-up"></i></button>
                <button class="ch-arrow" ${dnDis} onclick="PRO2.moveHomeSection('${s.key}',1)"><i class="fa-solid fa-chevron-down"></i></button>
            </div>
            <span class="ch-name">${L()==='en'?s.en:s.ar}</span>
            <label class="switch"><input type="checkbox" data-key="${s.key}" ${on?'checked':''} onchange="PRO2.toggleHomeSection('${s.key}',this.checked)"><span class="slider round"></span></label></div>`;
    }).join('');
    $('customize-home-modal').classList.add('active');
};
PRO2.closeCustomizeHome = function(){ const m=$('customize-home-modal'); if(m) m.classList.remove('active'); };
PRO2.toggleHomeSection = function(key, on){
    const pref = homePrefs();
    // حدّ أدنى 3 أقسام ظاهرة
    if (!on){ const visible = HOME_SECTIONS.filter(s => (pref[s.key]!==false)).length; if (visible <= 3){ alert(tr('يجب إبقاء 3 أقسام على الأقل.','Keep at least 3 sections.')); PRO2.openCustomizeHome(); return; } }
    pref[key] = on; localStorage.setItem('home_sections', JSON.stringify(pref)); PRO2.applyHomeSections();
};
PRO2.moveHomeSection = function(key, dir){
    const order = homeOrder();
    const i = order.indexOf(key); if(i<0) return;
    const j = i + dir; if(j<0 || j>=order.length) return;
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    localStorage.setItem('home_order', JSON.stringify(order));
    PRO2.applyHomeSections();
    PRO2.openCustomizeHome(); // أعد رسم القائمة بالترتيب الجديد
};
function ensureCustomizeModal(){
    if ($('customize-home-modal')) return;
    const d=document.createElement('div'); d.id='customize-home-modal'; d.className='qibla-overlay';
    d.innerHTML = `<div class="qibla-modal" style="width:94%;max-width:420px;text-align:right;">
        <button class="close-qibla" onclick="PRO2.closeCustomizeHome()"><i class="fa-solid fa-xmark"></i></button>
        <h2 style="color:var(--primary-color);margin-bottom:6px;"><i class="fa-solid fa-sliders"></i> ${tr('تخصيص الواجهة','Customize Home')}</h2>
        <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:14px;">${tr('اختر ما يظهر (3 على الأقل) ورتّب الأقسام بالأسهم: مثلاً اجعل أوقات الصلاة أولاً ثم آية وحديث اليوم.','Choose what shows (min 3) and reorder with the arrows: e.g. put prayer times first, then ayah & hadith.')}</p>
        <div id="ch-body"></div></div>`;
    document.body.appendChild(d);
}

// احقن زر القصة بعد فتح التفسير
const _oat = window.onAyahTap;
window.onAyahTap = function(){ const r = (typeof _oat==='function') ? _oat.apply(this, arguments) : undefined; setTimeout(injectExtras, 150); return r; };

// (4ج) صانع الاقتباسات: ضغط مطوّل على الآية → بطاقة تصميم (Story)
let _lpTimer=null;
function lpStart(e){
    const ay = e.target.closest && e.target.closest('.ayah'); if(!ay) return;
    const s=+ay.dataset.surah, a=+ay.dataset.ayah, g=+ay.dataset.global; if(!s) return;
    _lpTimer = setTimeout(()=>{ window._lastAyah = { surah:s, ayah:a, global:g, text: ay.textContent.replace(/[٠-٩]+\s*$/,'').trim() }; if(window.PRO2&&PRO2.openStory) PRO2.openStory(); if(navigator.vibrate) navigator.vibrate(30); }, 550);
}
function lpCancel(){ if(_lpTimer){ clearTimeout(_lpTimer); _lpTimer=null; } }
document.addEventListener('touchstart', lpStart, {passive:true});
document.addEventListener('touchend', lpCancel); document.addEventListener('touchmove', lpCancel, {passive:true});
document.addEventListener('mousedown', lpStart); document.addEventListener('mouseup', lpCancel); document.addEventListener('mouseleave', lpCancel);

function injectCustomizeHomeSetting(){
    const list = document.querySelector('#tab-settings .settings-list'); if(!list || $('customize-home-row')) return;
    const gen = [...list.querySelectorAll('.set-group-title')].find(el=>el.dataset.i18n==='grp_general');
    const row=document.createElement('div'); row.className='setting-item'; row.id='customize-home-row';
    row.setAttribute('onclick','PRO2.openCustomizeHome()');
    row.innerHTML = `<span class="set-ico"><i class="fa-solid fa-table-cells-large"></i></span><span class="set-label">${L()==='en'?'Customize home':'تخصيص عرض الواجهة'}</span><i class="fa-solid fa-chevron-left ath-chevron"></i>`;
    if (gen && gen.nextSibling) list.insertBefore(row, gen.nextSibling); else list.appendChild(row);
}
function initPro2(){ injectExtras(); injectCustomizeHomeSetting(); injectDailyCards(); PRO2.applyHomeSections(); PRO2.checkBadges(true); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(initPro2, 700));
else setTimeout(initPro2, 700);
})();
