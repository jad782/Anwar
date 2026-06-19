const pageTitle = document.getElementById('page-title');
const surahList = document.getElementById('surah-list');
const readingView = document.getElementById('reading-view');
const ayahsContainer = document.getElementById('ayahs-container');

let currentFontSize = 22;
let prayerTimings = {}; 
let khatmas = []; 
let activeKhatmaId = null;
let tasbeehCount = 0;
let phraseIndex = 0;
const athkarPhrases = ["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ", "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ"];

const athkarDB = {
    morning: [{ text: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ: ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...﴾", info: "من قالها حين يصبح أجير من الجن.", max: 1 }],
    evening: [{ text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ...", info: "", max: 1 }],
    postPrayer: [{ text: "أَسْتَغْفِرُ اللَّهَ.", info: "ثلاثاً بعد السلام مباشرة.", max: 3 }],
    sleep: [{ text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ...", info: "", max: 1 }]
};
let currentAthkarState = [];

let wakeLock = null;

// =====================================
// 1. نظام الأوفلاين السريع جداً (IndexedDB)
// =====================================
const dbName = 'AlAnwarDB'; let db;
const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = e => { db = e.target.result; db.createObjectStore('quran', {keyPath: 'url'}); };
request.onsuccess = e => { db = e.target.result; };

// خدمة نص القرآن من البيانات المحلّية (quran-data.js) — يعمل بدون إنترنت من أول مرة.
// الصوت والتفسير والترجمة والبحث تبقى عبر الشبكة.
let _surahMetaMap = null;
function resolveLocalQuran(url){
    if (typeof window.QURAN_DATA === 'undefined' || !url.includes('alquran.cloud')) return null;
    const QD = window.QURAN_DATA;
    if (!_surahMetaMap){ _surahMetaMap = {}; QD.surahs.forEach(s => _surahMetaMap[s.n] = { number:s.n, name:s.name }); }
    const apiName = n => (_surahMetaMap[n] ? _surahMetaMap[n].name : '');
    // قائمة السور
    if (/\/v1\/surah\/?(\?|$)/.test(url)){
        return { code:200, data: QD.surahs.map(s => ({ number:s.n, name:s.name, englishName:s.en, revelationType:(s.type==='Meccan'?'Meccan':'Medinan'), numberOfAyahs:s.count })) };
    }
    // سورة كاملة (نص عثماني فقط)
    let m = url.match(/\/v1\/surah\/(\d+)\/quran-uthmani/);
    if (m){
        const n = +m[1]; const meta = QD.surahs.find(s => s.n === n); if(!meta) return null;
        const ayahs = QD.ayahs.filter(x => x.s === n).map(x => ({ number:x.g, text:x.t, numberInSurah:x.a, page:x.p, juz:x.j }));
        return { code:200, data: { number:n, name:meta.name, englishName:meta.en, numberOfAyahs:meta.count, ayahs } };
    }
    // جزء
    m = url.match(/\/v1\/juz\/(\d+)\/quran-uthmani/);
    if (m){
        const j = +m[1];
        const ayahs = QD.ayahs.filter(x => x.j === j).map(x => ({ number:x.g, text:x.t, numberInSurah:x.a, page:x.p, juz:x.j, surah:{ number:x.s, name:apiName(x.s) } }));
        return ayahs.length ? { code:200, data:{ number:j, ayahs } } : null;
    }
    // صفحة (للختمات)
    m = url.match(/\/v1\/page\/(\d+)\/quran-uthmani/);
    if (m){
        const p = +m[1];
        const ayahs = QD.ayahs.filter(x => x.p === p).map(x => ({ number:x.g, text:x.t, numberInSurah:x.a, page:x.p, juz:x.j, surah:{ number:x.s, name:apiName(x.s) } }));
        return ayahs.length ? { code:200, data:{ number:p, ayahs } } : null;
    }
    return null;
}

async function fetchOffline(url) {
    const local = resolveLocalQuran(url);
    if (local) return local;
    return new Promise((resolve, reject) => {
        if(!db) return fetch(url).then(r=>r.json()).then(resolve).catch(reject);
        const tx = db.transaction('quran', 'readonly');
        const store = tx.objectStore('quran');
        const getReq = store.get(url);
        getReq.onsuccess = () => {
            if(getReq.result) {
                resolve(getReq.result.payload); 
            } else {
                fetch(url).then(r=>{ if(!r.ok) throw new Error("Net Err"); return r.json(); }).then(data => {
                    const tx2 = db.transaction('quran', 'readwrite');
                    tx2.objectStore('quran').put({url: url, payload: data});
                    resolve(data);
                }).catch(reject);
            }
        };
        getReq.onerror = () => fetch(url).then(r=>r.json()).then(resolve).catch(reject);
    });
}

// =====================================
// 2. التهيئة الأولى
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('lightMode') === 'true') { document.body.classList.add('light-mode'); document.getElementById('dark-mode-toggle').checked = true; }
    if (localStorage.getItem('notifications') === 'true') document.getElementById('notifications-toggle').checked = true;
    if (localStorage.getItem('gps') === 'true') document.getElementById('gps-toggle').checked = true;
    if (localStorage.getItem('wakelock') === 'true') { document.getElementById('wakelock-toggle').checked = true; requestWakeLock(); }

    tasbeehCount = parseInt(localStorage.getItem('tasbeehCount')) || 0;
    phraseIndex = parseInt(localStorage.getItem('phraseIndex')) || 0;
    document.getElementById('misbaha-count').innerText = tasbeehCount;
    
    currentFontSize = parseInt(localStorage.getItem('fontSize')) || 22;
    updateFontSize();
    loadKhatmas();
    loadAyahOfDay();
    setTimeout(updateAchievementUI, 300);
});

// =====================================
// 3. التنقل والإعدادات المتقدمة
// =====================================
const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
const tabSections = document.querySelectorAll('.tab-section');
const TAB_KEYS = ['nav_home', 'nav_quran', 'nav_athkar', 'nav_settings'];
const titles = new Proxy({}, { get: (_, i) => t(TAB_KEYS[i]) });

window.goToTab = function(index) {
    if(readingView.style.display === 'block') closeSurah();
    closeKhatma(); closeAthkarCategory(); 
    navButtons.forEach(btn => btn.classList.remove('active'));
    navButtons[index].classList.add('active');
    tabSections.forEach(section => section.style.display = 'none');
    tabSections[index].style.display = 'block';
    pageTitle.innerText = titles[index];
    window.scrollTo(0,0);
};

document.getElementById('dark-mode-toggle').addEventListener('change', (e) => { document.body.classList.toggle('light-mode', e.target.checked); localStorage.setItem('lightMode', e.target.checked); });

document.getElementById('notifications-toggle').addEventListener('change', async (e) => {
    localStorage.setItem('notifications', e.target.checked);
    if (e.target.checked && typeof Notification !== 'undefined') {
        try { const perm = await Notification.requestPermission(); if (perm !== 'granted') { alert('لم يتم السماح.'); e.target.checked = false; localStorage.setItem('notifications', false); } } catch(err) {}
    }
});

document.getElementById('gps-toggle').addEventListener('change', (e) => {
    localStorage.setItem('gps', e.target.checked);
    getPrayerTimes(); // إعادة حساب الأوقات
});

document.getElementById('wakelock-toggle').addEventListener('change', (e) => {
    localStorage.setItem('wakelock', e.target.checked);
    if(e.target.checked) requestWakeLock(); else releaseWakeLock();
});

async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
}
function releaseWakeLock() {
    if (wakeLock !== null) { wakeLock.release().then(() => wakeLock = null); }
}

document.getElementById('increase-font').addEventListener('click', () => { if (currentFontSize < 40) { currentFontSize += 2; updateFontSize(); localStorage.setItem('fontSize', currentFontSize); } });
document.getElementById('decrease-font').addEventListener('click', () => { if (currentFontSize > 16) { currentFontSize -= 2; updateFontSize(); localStorage.setItem('fontSize', currentFontSize); } });
function updateFontSize() { document.getElementById('font-size-display').innerText = currentFontSize + 'px'; document.querySelectorAll('.ayah').forEach(a => a.style.fontSize = currentFontSize + 'px'); }

window.factoryReset = function() {
    if(confirm('هل أنت متأكد من مسح جميع بيانات التطبيق والختمات؟ لا يمكن التراجع عن هذا الإجراء.')){
        localStorage.clear();
        if(db) { const tx = db.transaction('quran', 'readwrite'); tx.objectStore('quran').clear(); }
        alert('تم تصفير التطبيق بنجاح.'); window.location.reload();
    }
}

// =====================================
// 4. أوقات الصلاة وسنن التنبيهات
// =====================================
const PRAYER_LABELS = { Fajr:'الفجر', Sunrise:'الشروق', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
const NOTIFY_FOR = ['Fajr','Dhuhr','Asr','Maghrib','Isha']; 
const _firedToday = new Set(); 

function _maybeFireNotification(){
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || localStorage.getItem('notifications') !== 'true') return;
    const now = new Date(); const dayKey = now.toISOString().slice(0,10);
    NOTIFY_FOR.forEach(k => {
        if (!prayerTimings[k]) return;
        const [h, m] = prayerTimings[k].split(':').map(Number);
        if (now.getHours()===h && now.getMinutes()===m && now.getSeconds() < 30) {
            const key = `${dayKey}::${k}`;
            if (_firedToday.has(key)) return;
            _firedToday.add(key);
            try { new Notification(`حان الآن وقت ${PRAYER_LABELS[k]}`, { body: 'لا تنسَ الصلاة', icon: 'icon-192.jpg' }); } catch(e){}
        }
    });
    if(now.getDay() === 5 && now.getHours() === 10 && !localStorage.getItem('sunnah_fri_'+dayKey)) {
        showBadgeToast({emoji:'📖', name:'سنن الجمعة', desc:'تذكير: قراءة سورة الكهف والصلاة على النبي.'}); localStorage.setItem('sunnah_fri_'+dayKey, 'true');
    }
    if(now.getHours() === 2 && !localStorage.getItem('sunnah_night_'+dayKey)) {
        showBadgeToast({emoji:'🌙', name:'وقت السحر', desc:'تذكير: ركعتان في جوف الليل خير من الدنيا.'}); localStorage.setItem('sunnah_night_'+dayKey, 'true');
    }
}

// أوقات الصلاة تُحسب محلياً (أوفلاين) عبر prayers.js
async function getPrayerTimes() {
    if (window.PRAYERS) { PRAYERS.refresh(); return; }
    // احتياطي قديم (نادراً): إن لم يُحمّل prayers.js
    try {
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Istanbul&country=Turkey&method=13');
        const data = await res.json(); const t = data.data.timings;
        window.setPrayerTimings({Fajr:t.Fajr,Sunrise:t.Sunrise,Dhuhr:t.Dhuhr,Asr:t.Asr,Maghrib:t.Maghrib,Isha:t.Isha}, 'إسطنبول');
    } catch (e) {}
}

// تعبئة الأوقات + التاريخ (هجري/ميلادي أوفلاين) + بدء العدّاد
window.setPrayerTimings = function(t, label){
    prayerTimings = { Fajr:t.Fajr, Sunrise:t.Sunrise, Dhuhr:t.Dhuhr, Asr:t.Asr, Maghrib:t.Maghrib, Isha:t.Isha };
    const set = (id,v)=>{ const e=document.getElementById(id); if(e) e.innerText=v; };
    set('fajr-time',t.Fajr); set('sunrise-time',t.Sunrise); set('dhuhr-time',t.Dhuhr); set('asr-time',t.Asr); set('maghrib-time',t.Maghrib); set('isha-time',t.Isha);
    if (label){ const lt=document.getElementById('location-text'); if(lt) lt.innerHTML='<i class="fa-solid fa-location-dot"></i> '+label; }
    const now = new Date();
    const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const daysEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    set('current-day', (currentLang==='en'?daysEn:days)[now.getDay()]);
    // التاريخ الهجري (تقويم أم القرى — أوفلاين)
    try {
        const f = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day:'numeric', month:'long', year:'numeric' });
        let hd,hm,hy; f.formatToParts(now).forEach(p=>{ if(p.type==='day')hd=p.value; if(p.type==='month')hm=p.value; if(p.type==='year')hy=p.value; });
        set('hijri-month', hm); set('hijri-day', hd); set('hijri-year', hy);
    } catch(e){}
    const engM = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    set('greg-month', engM[now.getMonth()]); set('greg-day', now.getDate()); set('greg-year', now.getFullYear());
    startCountdown();
    if (window.refreshAthanSchedule) window.refreshAthanSchedule();
    if (window.AMBIENT && AMBIENT.apply) AMBIENT.apply();
};

let _countdownStarted = false;
function startCountdown() {
    if (_countdownStarted) return; // لا تشغّل أكثر من مؤقّت
    _countdownStarted = true;
    const pad = n => String(n).padStart(2, '0');
    setInterval(() => {
        if (!prayerTimings.Fajr) return;
        const now = new Date(); const cur = (now.getHours() * 60) + now.getMinutes();
        const list = [
            { name:'الفجر', time:prayerTimings.Fajr, id:'Fajr' },
            { name:'الشروق', time:prayerTimings.Sunrise, id:'Sunrise' },
            { name:'الظهر', time:prayerTimings.Dhuhr, id:'Dhuhr' },
            { name:'العصر', time:prayerTimings.Asr, id:'Asr' },
            { name:'المغرب', time:prayerTimings.Maghrib, id:'Maghrib' },
            { name:'العشاء', time:prayerTimings.Isha, id:'Isha' }
        ];
        // صفّر كل البطاقات
        list.forEach(p => { const c = document.getElementById('p-'+p.id); if(c) c.classList.remove('active-prayer'); const r = document.getElementById('remain-'+p.id); if(r) r.innerText=''; });
        // الصلاة القادمة (نتجاهل الشروق كأذان)
        const order = list.filter(p => p.id !== 'Sunrise');
        let next = null;
        for (const p of order) { const [h,m] = p.time.split(':').map(Number); if (cur < h*60+m) { next = p; break; } }
        if (!next) next = order[0]; // بعد العشاء → فجر الغد
        // العدّاد
        let [nH,nM] = next.time.split(':').map(Number);
        const target = new Date(); target.setHours(nH, nM, 0, 0);
        if (cur >= nH*60+nM) target.setDate(target.getDate()+1);
        const diff = target - now;
        const h = Math.floor(diff/3600000), m = Math.floor(diff%3600000/60000), s = Math.floor(diff%60000/1000);
        const card = document.getElementById('p-'+next.id); if(card) card.classList.add('active-prayer');
        const rem = document.getElementById('remain-'+next.id); if(rem) rem.innerText = `${pad(h)}:${pad(m)}:${pad(s)}`;
        const pill = document.getElementById('pill-countdown'); if(pill) pill.innerText = `${next.name} بعد ${pad(h)}:${pad(m)}`;
        _maybeFireNotification();
    }, 1000);
}

// =====================================
// 5. إدارة الختمات (أوفلاين صاروخي)
// =====================================
function loadKhatmas() {
    try { const saved = localStorage.getItem('khatmas_list'); if (saved) khatmas = JSON.parse(saved); renderKhatmas(); } catch(e){}
}
function saveKhatmas() { localStorage.setItem('khatmas_list', JSON.stringify(khatmas)); }

window.renderKhatmas = function() {
    const container = document.getElementById('khatma-list-preview');
    if (!container) return;
    if (khatmas.length === 0) { container.innerHTML = '<p style="font-size:0.9rem; color:var(--text-muted); text-align:center; width:100%;">لا توجد ختمات حالية، ابدأ الآن.</p>'; return; }
    let html = '';
    khatmas.forEach(k => {
        const pct = Math.round((k.page / 604) * 100);
        html += `
        <div class="khatma-item" onclick="openKhatmaPage(${k.id}, ${k.page})">
            <div class="khatma-item-icon"><i class="fa-solid fa-book-quran"></i></div>
            <div class="khatma-item-info">
                <div class="khatma-item-name">${k.name}</div>
                <div class="khatma-item-page">صفحة ${k.page} من 604 · ${pct}%</div>
                <div class="khatma-item-progress"><div class="khatma-item-progress-fill" style="width:${pct}%"></div></div>
            </div>
            <button class="khatma-delete-btn" onclick="deleteKhatma(event, ${k.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>`;
    });
    container.innerHTML = html;
}

window.openNewKhatmaModal = function() { document.getElementById('new-khatma-modal').classList.add('active'); }
window.closeNewKhatmaModal = function() { document.getElementById('new-khatma-modal').classList.remove('active'); }
window.confirmNewKhatma = function() {
    const name = document.getElementById('new-khatma-name').value.trim();
    const startPage = parseInt(document.getElementById('new-khatma-start').value) || 1;
    if (!name) return;
    const newK = { id: Date.now(), name, page: Math.min(604, Math.max(1, startPage)) };
    khatmas.push(newK); saveKhatmas(); closeNewKhatmaModal(); renderKhatmas(); openKhatmaPage(newK.id, newK.page);
}
window.deleteKhatma = function(e, id) { e.stopPropagation(); if (confirm('حذف هذه الختمة؟')) { khatmas = khatmas.filter(k => k.id !== id); saveKhatmas(); renderKhatmas(); } }
window.continueKhatma = function() { if (khatmas.length > 0) openKhatmaPage(khatmas[0].id, khatmas[0].page); else openNewKhatmaModal(); }

window.openKhatmaPage = async function(id, pageNum) {
    activeKhatmaId = id; let currentPage = parseInt(pageNum);
    const khatmaObj = khatmas.find(k => k.id === id);
    document.querySelector('.hero-section').style.display = 'none'; document.querySelector('.prayer-grid').style.display = 'none'; document.querySelector('.apps-scroll').style.display = 'none'; document.querySelectorAll('.section-header, .vip-card, .donate-card, .achievement-rings-card, #ayah-of-day-card').forEach(el => el.style.display = 'none');
    
    document.getElementById('khatma-view').style.display = 'block';
    document.getElementById('khatma-container').innerHTML = `<div style="text-align:center; padding: 60px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--primary-color);"></i></div>`;
    document.getElementById('khatma-page-number').innerText = 'صفحة ' + currentPage;
    if(khatmaObj) document.getElementById('khatma-active-name').innerText = '📖 ' + khatmaObj.name;
    document.getElementById('prev-page-btn').disabled = (currentPage <= 1); document.getElementById('next-page-btn').disabled = (currentPage >= 604);

    try {
        const data = await fetchOffline(`https://api.alquran.cloud/v1/page/${currentPage}/quran-uthmani`);
        const ayahs = data.data.ayahs; 
        
        let surahName = (ayahs[0].surah && ayahs[0].surah.name) ? ayahs[0].surah.name.replace('سُورَةُ ', '') : 'القرآن';
        document.getElementById('khatma-surah-name').innerText = 'سورة ' + surahName;

        let html = ''; let currentSurahNumber = 0;
        ayahs.forEach(a => {
            let sNum = (a.surah && a.surah.number) ? a.surah.number : 0;
            if (sNum !== currentSurahNumber) {
                if (currentSurahNumber !== 0) html += `<div class="surah-separator">سورة ${(a.surah.name || '').replace('سُورَةُ ', '')}</div>`;
                currentSurahNumber = sNum;
                if (sNum !== 1 && sNum !== 9) html += '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>';
            }
            let txt = a.text || '';
            if (a.numberInSurah === 1 && sNum !== 1 && sNum !== 9) txt = txt.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
            html += `<div class="ayah" style="font-size: ${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`;
        });
        document.getElementById('khatma-container').innerHTML = html; applyReadingBg(); window.scrollTo(0, 0);
        
        const idx = khatmas.findIndex(k => k.id === activeKhatmaId);
        if(idx !== -1) { khatmas[idx].page = currentPage; saveKhatmas(); renderKhatmas(); }
        updateAchievementState('quran');
        
    } catch(e) { document.getElementById('khatma-container').innerHTML = `<div style="text-align:center; padding:40px;"><p style="color:red; font-weight:bold;">تأكد من اتصالك بالإنترنت لأول تحميل فقط</p><button onclick="openKhatmaPage(${activeKhatmaId}, ${currentPage})" class="tasbeeh-pill" style="margin-top:15px;">حاول مرة أخرى</button></div>`; }
}
window.nextKhatmaPage = function() { const idx = khatmas.findIndex(k => k.id === activeKhatmaId); if(idx !== -1 && khatmas[idx].page < 604) openKhatmaPage(activeKhatmaId, khatmas[idx].page + 1); }
window.prevKhatmaPage = function() { const idx = khatmas.findIndex(k => k.id === activeKhatmaId); if(idx !== -1 && khatmas[idx].page > 1) openKhatmaPage(activeKhatmaId, khatmas[idx].page - 1); }
window.closeKhatma = function() { 
    activeKhatmaId = null; document.getElementById('khatma-view').style.display = 'none'; 
    document.querySelector('.hero-section').style.display = 'flex'; document.querySelector('.prayer-grid').style.display = 'grid'; document.querySelector('.apps-scroll').style.display = 'flex'; document.querySelectorAll('.section-header, .vip-card, .donate-card, .achievement-rings-card, #ayah-of-day-card').forEach(el => el.style.display = ''); 
}

// =====================================
// 6. المصحف الحر (سور وأجزاء + أوفلاين)
// =====================================
window.switchQuranTab = function(tab) {
    document.getElementById('tab-btn-surahs').classList.toggle('active', tab === 'surahs');
    document.getElementById('tab-btn-juzs').classList.toggle('active', tab === 'juzs');
    document.getElementById('surah-list').style.display = tab === 'surahs' ? 'block' : 'none';
    document.getElementById('juz-list').style.display = tab === 'juzs' ? 'block' : 'none';
}

async function getSurahs() {
    try { 
        const data = await fetchOffline('https://api.alquran.cloud/v1/surah');
        document.getElementById('surah-list').innerHTML = data.data.map(s => `<div class="surah-card" onclick="openFreeReading('surah', ${s.number}, '${s.name.replace('سُورَةُ ', '')}')"><div class="surah-info"><div class="surah-number">${s.number}</div><div class="surah-details"><h2>${s.name.replace('سُورَةُ ', '')}</h2><p>${s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${s.numberOfAyahs} آيات</p></div></div><div class="surah-name-arabic">${s.name}</div></div>`).join('');
        
        let juzHtml = '';
        for(let i=1; i<=30; i++) juzHtml += `<div class="surah-card" onclick="openFreeReading('juz', ${i}, 'الجزء ${i}')"><div class="surah-info"><div class="surah-number">${i}</div><div class="surah-details"><h2>الجزء ${i}</h2></div></div><div class="surah-name-arabic">جُزْءٌ</div></div>`;
        document.getElementById('juz-list').innerHTML = juzHtml;
    } catch(e) {}
}

window.CUR_READ = { type:'surah', num:1, name:'' };
window.openFreeReading = async function(type, num, name) {
    window.CUR_READ = { type, num, name };
    document.getElementById('surah-list').style.display = 'none'; document.getElementById('juz-list').style.display = 'none'; document.querySelector('.quran-tabs').style.display = 'none';
    readingView.style.display = 'block'; pageTitle.innerText = 'تلاوة القرآن'; document.getElementById('current-surah-name').innerText = name;
    ayahsContainer.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--primary-color);"></i></div>';
    try { 
        const data = await fetchOffline(`https://api.alquran.cloud/v1/${type}/${num}/quran-uthmani`);
        const ayahs = data.data.ayahs || data.data; // لمعالجة اختلاف استجابة الأجزاء عن السور
        let html = ''; let currentSurahNumber = 0;
        ayahs.forEach(a => { 
            const aSurah = a.surah || ((type === 'surah') ? { number: data.data.number, name: data.data.name } : { number: num, name: name || '' });
            let sNum = aSurah.number;
            if (sNum !== currentSurahNumber) {
                if (currentSurahNumber !== 0 || type === 'juz') html += `<div class="surah-separator">سورة ${(aSurah.name || '').replace('سُورَةُ ', '')}</div>`;
                currentSurahNumber = sNum;
                if (sNum !== 1 && sNum !== 9) html += '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>';
            }
            let txt = a.text; if (a.numberInSurah === 1 && sNum !== 1 && sNum !== 9) txt = txt.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', ''); 
            html += `<div class="ayah" data-surah="${sNum}" data-ayah="${a.numberInSurah}" data-global="${a.number}" onclick="onAyahTap(${sNum},${a.numberInSurah},${a.number})" style="font-size: ${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`;
        });
        ayahsContainer.innerHTML = html; applyReadingBg(); document.querySelector('.content-area').scrollTop = 0;
        if (typeof onReadingRendered === 'function') onReadingRendered();
    } catch(e) { ayahsContainer.innerHTML = `<div style="text-align:center; padding:40px;"><p style="color:#c0392b; font-weight:bold;">${currentLang==='en'?'Connect to the internet for the first load.':'تأكد من اتصالك بالإنترنت لأول تحميل فقط'}</p></div>`; }
}
window.closeSurah = function() { readingView.style.display = 'none'; document.querySelector('.quran-tabs').style.display = 'flex'; switchQuranTab(document.getElementById('tab-btn-juzs').classList.contains('active') ? 'juzs' : 'surahs'); pageTitle.innerText = 'المصحف'; }


// =====================================
// 7. الأذكار والقبلة والمسبحة
// =====================================
window.countTasbeeh = function() { 
    tasbeehCount++; document.getElementById('misbaha-count').innerText = tasbeehCount; 
    if(tasbeehCount % 33 === 0 && navigator.vibrate) navigator.vibrate([100]); // هزاز ذكي
    if(tasbeehCount === 100 && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    localStorage.setItem('tasbeehCount', tasbeehCount); 
    updateAchievementState('tasbeeh');
}
window.resetTasbeeh = function() { tasbeehCount = 0; document.getElementById('misbaha-count').innerText = 0; localStorage.setItem('tasbeehCount', 0); }

window.openAthkarCategory = function(catId) {
    const listNames = { morning: 'أذكار الصباح', evening: 'أذكار المساء', postPrayer: 'أذكار بعد الصلاة', sleep: 'أذكار النوم' };
    document.getElementById('athkar-categories-list').style.display = 'none'; document.getElementById('athkar-reading-view').style.display = 'block'; document.getElementById('current-athkar-title').innerText = listNames[catId];
    currentAthkarState = athkarDB[catId].map(item => ({...item, current: 0})); renderAthkarCards();
}
window.closeAthkarCategory = function() { document.getElementById('athkar-reading-view').style.display = 'none'; document.getElementById('athkar-categories-list').style.display = 'block'; }
function renderAthkarCards() {
    const container = document.getElementById('athkar-items-container'); container.innerHTML = '';
    currentAthkarState.forEach((theker, index) => {
        const isCompleted = theker.current >= theker.max;
        container.innerHTML += `<div class="theker-read-card ${isCompleted ? 'completed' : ''}" onclick="incrementTheker(${index})"><div class="theker-text">${theker.text}</div>${theker.info ? `<div class="theker-info">${theker.info}</div>` : ''}<div class="theker-counter-box"><span style="font-weight:bold; color:var(--text-muted);">المطلوب: ${theker.max}</span><button class="theker-count-btn">${isCompleted ? '<i class="fa-solid fa-check"></i>' : `${theker.current} / ${theker.max}`}</button></div></div>`;
    });
}
window.incrementTheker = function(index) { 
    if (currentAthkarState[index].current < currentAthkarState[index].max) { 
        currentAthkarState[index].current++; renderAthkarCards(); 
        if(currentAthkarState.every(t => t.current >= t.max)) {
            let title = document.getElementById('current-athkar-title').innerText;
            if(title.includes('صباح')) updateAchievementState('morning');
            if(title.includes('مساء')) updateAchievementState('evening');
        }
    } 
}

// ===== القبلة (حساب دقيق + دعم iOS/Android) =====
const KAABA_LAT = 21.422487, KAABA_LNG = 39.826206;
let qiblaBearing = null;       // اتجاه القبلة من الشمال (ثابت حسب الموقع)
let _orientationBound = false;

function computeQiblaBearing(lat, lng) {
    const toRad = d => d * Math.PI / 180, toDeg = r => r * 180 / Math.PI;
    const dLng = toRad(KAABA_LNG - lng);
    const y = Math.sin(dLng) * Math.cos(toRad(KAABA_LAT));
    const x = Math.cos(toRad(lat)) * Math.sin(toRad(KAABA_LAT)) - Math.sin(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

window.openQibla = function() {
    document.getElementById('qibla-overlay').classList.add('active');
    const hint = document.getElementById('qibla-hint');
    const permBtn = document.getElementById('qibla-permission-btn');
    // 1) احسب اتجاه القبلة من الموقع
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            qiblaBearing = computeQiblaBearing(pos.coords.latitude, pos.coords.longitude);
            document.getElementById('qibla-degree').innerText = Math.round(qiblaBearing) + '°';
            startCompass();
        }, () => {
            // بدون موقع: استخدم إسطنبول كافتراضي
            qiblaBearing = computeQiblaBearing(41.0082, 28.9784);
            document.getElementById('qibla-degree').innerText = Math.round(qiblaBearing) + (currentLang==='en'?'° (approx)':'° (تقريبي)');
            startCompass();
        }, { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false });
    } else { qiblaBearing = computeQiblaBearing(41.0082, 28.9784); document.getElementById('qibla-degree').innerText = Math.round(qiblaBearing) + '°'; }

    // 2) إذن البوصلة على iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        permBtn.style.display = 'block';
    } else { startCompass(); }
}

window.requestCompassPermission = function() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') { document.getElementById('qibla-permission-btn').style.display = 'none'; startCompass(); }
            else { document.getElementById('qibla-hint').innerText = t('qibla_denied'); }
        }).catch(() => {});
    }
}

function startCompass() {
    if (_orientationBound) return;
    if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    else window.addEventListener('deviceorientation', handleOrientation, true);
    _orientationBound = true;
}

window.closeQibla = function() {
    document.getElementById('qibla-overlay').classList.remove('active');
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);
    _orientationBound = false;
}

function handleOrientation(e) {
    // اتجاه الجهاز بالنسبة للشمال
    let heading;
    if (typeof e.webkitCompassHeading === 'number') heading = e.webkitCompassHeading; // iOS: درجات من الشمال (عقارب الساعة)
    else if (e.absolute && typeof e.alpha === 'number') heading = 360 - e.alpha;        // Android absolute
    else if (typeof e.alpha === 'number') heading = 360 - e.alpha;
    else return;
    if (qiblaBearing === null) return;
    // زاوية السهم = اتجاه القبلة - اتجاه الجهاز
    const rotation = (qiblaBearing - heading + 360) % 360;
    const arrow = document.getElementById('compass-arrow');
    const kaaba = document.getElementById('compass-kaaba');
    if (arrow) arrow.style.transform = `rotate(${rotation}deg)`;
    if (kaaba) kaaba.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    // عند المحاذاة (ضمن 5 درجات) لون أخضر
    const aligned = (rotation < 6 || rotation > 354);
    if (arrow) arrow.style.color = aligned ? '#22c55e' : 'var(--primary-color)';
    // بوصلة الكاميرا (AR)
    const arArrow = document.getElementById('ar-arrow');
    if (arArrow){ arArrow.style.transform = `rotate(${rotation}deg)`; arArrow.style.filter = aligned ? 'drop-shadow(0 0 12px #22c55e)' : 'none'; }
    const arDeg = document.getElementById('ar-deg');
    if (arDeg) arDeg.innerText = Math.round(qiblaBearing) + '° • ' + (aligned ? (currentLang==='en'?'Aligned ✓':'محاذاة ✓') : (currentLang==='en'?'Turn the phone':'أدر الهاتف'));
}

// =====================================
// 8. الإذاعة العائمة
// =====================================
const audioEl = document.getElementById('radio-audio');
window.toggleRadio = function() { document.getElementById('floating-radio').classList.toggle('show'); }
window.togglePlayRadio = function() {
    const btn = document.getElementById('radio-play-btn');
    if(audioEl.paused) {
        if(!audioEl.src) changeStation();
        audioEl.play(); btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else { audioEl.pause(); btn.innerHTML = '<i class="fa-solid fa-play"></i>'; }
}
window.changeStation = function() {
    const sel = document.getElementById('radio-station');
    audioEl.src = sel.value;
    if(!audioEl.paused || document.getElementById('radio-play-btn').innerHTML.includes('pause')) audioEl.play();
}

// =====================================
// 9. آية اليوم
// =====================================
const FEATURED_AYAHS = [
    { text: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ", ref: "النحل: 127" }, { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", ref: "الشرح: 5" }, { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", ref: "الرعد: 28" }, { text: "وَاللَّهُ يَعْصِمُكَ مِنَ النَّاسِ", ref: "المائدة: 67" }
];
function loadAyahOfDay() {
    const day = new Date().getDay();
    const ayah = FEATURED_AYAHS[day % FEATURED_AYAHS.length];
    document.getElementById('ayah-day-text').innerText = ayah.text;
    document.getElementById('ayah-day-ref').innerText = '﴿ ' + ayah.ref + ' ﴾';
}
window.shareAyahOfDay = function() {
    const text = document.getElementById('ayah-day-text').innerText;
    const msg = `${text}\n— الأنوار`;
    if (navigator.share) navigator.share({ text: msg }).catch(()=>{});
}

// =====================================
// 10. الإنجاز اليومي (UI)
// =====================================
function updateAchievementState(type) {
    let s = JSON.parse(localStorage.getItem('achievements')) || { morning:0, evening:0, quran:0, tasbeeh:0, today: new Date().toISOString().slice(0,10) };
    if(s.today !== new Date().toISOString().slice(0,10)) s = { morning:0, evening:0, quran:0, tasbeeh:0, today: new Date().toISOString().slice(0,10) };
    if(type==='morning') s.morning = 100;
    if(type==='evening') s.evening = 100;
    if(type==='quran') s.quran = Math.min(100, s.quran + 10); 
    if(type==='tasbeeh') s.tasbeeh = Math.min(100, (tasbeehCount / 100) * 100);
    localStorage.setItem('achievements', JSON.stringify(s));
    updateAchievementUI();
}
function updateAchievementUI() {
    let s = JSON.parse(localStorage.getItem('achievements'));
    if(!s || s.today !== new Date().toISOString().slice(0,10)) return;
    const upd = (id, val) => {
        let r = document.getElementById(`ring-${id}`); let p = document.getElementById(`pct-${id}`);
        if(r) { r.style.setProperty('--pct', val); p.innerText = Math.round(val)+'%'; if(val>=100) r.classList.add('complete'); }
    };
    upd('morning', s.morning); upd('evening', s.evening); upd('quran', s.quran); upd('tasbeeh', s.tasbeeh);
    let total = (s.morning + s.evening + s.quran + s.tasbeeh) / 4;
    document.getElementById('total-bar').style.width = total + '%';
    if(total === 100) document.getElementById('total-label').innerText = 'يوم مثالي! 🏆';
}

function showBadgeToast(badge) {
    const t = document.getElementById('badge-toast');
    document.getElementById('badge-toast-icon').innerText = badge.emoji;
    document.getElementById('badge-toast-title').innerText = badge.name;
    document.getElementById('badge-toast-desc').innerText = badge.desc;
    t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 5000);
}

// دالة تغيير الذكر
window.changeTasbeehPhrase = function() {
    phraseIndex = (phraseIndex + 1) % athkarPhrases.length;
    document.getElementById('misbaha-text').innerText = athkarPhrases[phraseIndex];
    localStorage.setItem('phraseIndex', phraseIndex);
}

// =====================================
// 11. قائمة السور (أوفلاين للمنتقي)
// =====================================
const SURAH_NAMES = [
 ["الفاتحة","Al-Fatihah"],["البقرة","Al-Baqarah"],["آل عمران","Aal-E-Imran"],["النساء","An-Nisa"],["المائدة","Al-Ma'idah"],["الأنعام","Al-An'am"],["الأعراف","Al-A'raf"],["الأنفال","Al-Anfal"],["التوبة","At-Tawbah"],["يونس","Yunus"],["هود","Hud"],["يوسف","Yusuf"],["الرعد","Ar-Ra'd"],["إبراهيم","Ibrahim"],["الحجر","Al-Hijr"],["النحل","An-Nahl"],["الإسراء","Al-Isra"],["الكهف","Al-Kahf"],["مريم","Maryam"],["طه","Ta-Ha"],["الأنبياء","Al-Anbiya"],["الحج","Al-Hajj"],["المؤمنون","Al-Mu'minun"],["النور","An-Nur"],["الفرقان","Al-Furqan"],["الشعراء","Ash-Shu'ara"],["النمل","An-Naml"],["القصص","Al-Qasas"],["العنكبوت","Al-Ankabut"],["الروم","Ar-Rum"],["لقمان","Luqman"],["السجدة","As-Sajdah"],["الأحزاب","Al-Ahzab"],["سبأ","Saba"],["فاطر","Fatir"],["يس","Ya-Sin"],["الصافات","As-Saffat"],["ص","Sad"],["الزمر","Az-Zumar"],["غافر","Ghafir"],["فصلت","Fussilat"],["الشورى","Ash-Shura"],["الزخرف","Az-Zukhruf"],["الدخان","Ad-Dukhan"],["الجاثية","Al-Jathiyah"],["الأحقاف","Al-Ahqaf"],["محمد","Muhammad"],["الفتح","Al-Fath"],["الحجرات","Al-Hujurat"],["ق","Qaf"],["الذاريات","Adh-Dhariyat"],["الطور","At-Tur"],["النجم","An-Najm"],["القمر","Al-Qamar"],["الرحمن","Ar-Rahman"],["الواقعة","Al-Waqi'ah"],["الحديد","Al-Hadid"],["المجادلة","Al-Mujadilah"],["الحشر","Al-Hashr"],["الممتحنة","Al-Mumtahanah"],["الصف","As-Saff"],["الجمعة","Al-Jumu'ah"],["المنافقون","Al-Munafiqun"],["التغابن","At-Taghabun"],["الطلاق","At-Talaq"],["التحريم","At-Tahrim"],["الملك","Al-Mulk"],["القلم","Al-Qalam"],["الحاقة","Al-Haqqah"],["المعارج","Al-Ma'arij"],["نوح","Nuh"],["الجن","Al-Jinn"],["المزمل","Al-Muzzammil"],["المدثر","Al-Muddaththir"],["القيامة","Al-Qiyamah"],["الإنسان","Al-Insan"],["المرسلات","Al-Mursalat"],["النبأ","An-Naba"],["النازعات","An-Nazi'at"],["عبس","Abasa"],["التكوير","At-Takwir"],["الانفطار","Al-Infitar"],["المطففين","Al-Mutaffifin"],["الانشقاق","Al-Inshiqaq"],["البروج","Al-Buruj"],["الطارق","At-Tariq"],["الأعلى","Al-A'la"],["الغاشية","Al-Ghashiyah"],["الفجر","Al-Fajr"],["البلد","Al-Balad"],["الشمس","Ash-Shams"],["الليل","Al-Layl"],["الضحى","Ad-Duha"],["الشرح","Ash-Sharh"],["التين","At-Tin"],["العلق","Al-Alaq"],["القدر","Al-Qadr"],["البينة","Al-Bayyinah"],["الزلزلة","Az-Zalzalah"],["العاديات","Al-Adiyat"],["القارعة","Al-Qari'ah"],["التكاثر","At-Takathur"],["العصر","Al-Asr"],["الهمزة","Al-Humazah"],["الفيل","Al-Fil"],["قريش","Quraysh"],["الماعون","Al-Ma'un"],["الكوثر","Al-Kawthar"],["الكافرون","Al-Kafirun"],["النصر","An-Nasr"],["المسد","Al-Masad"],["الإخلاص","Al-Ikhlas"],["الفلق","Al-Falaq"],["الناس","An-Nas"]
];
function surahName(num){ const s = SURAH_NAMES[num-1]; if(!s) return ''; return currentLang==='en' ? s[1] : s[0]; }

// =====================================
// 12. نظام الترجمة (عربي/إنجليزي)
// =====================================
const I18N = {
 ar:{ nav_home:"الرئيسية",nav_quran:"المصحف",nav_athkar:"الأذكار",nav_settings:"الإعدادات",nav_donate:"ادعم المطوّر",donate_title:"ادعم المطوّر",
  daily_tasks:"مهماتي اليومية",add_task:"إضافة",your_apps:"تطبيقاتك اليومية",prayer_times:"أوقات الصلاة",today_achievements:"إنجازات اليوم",my_khatmas:"ختماتي القرآنية",new_khatma:"ختمة جديدة",
  surahs:"السور",juzs:"الأجزاء",athkar_morning:"أذكار الصباح",athkar_evening:"أذكار المساء",athkar_post:"أذكار بعد الصلاة",athkar_sleep:"أذكار النوم",
  language:"اللغة",reading_bg:"خلفية القراءة",notif_athan:"تنبيهات الأذان",gps_auto:"تحديد الموقع تلقائياً (GPS)",keep_awake:"إبقاء الشاشة مضاءة",night_mode:"الوضع النهاري (فاتح)",font_size:"حجم خط القراءة",factory_reset:"تصفير بيانات التطبيق",
  grp_general:"التخصيص",grp_reading:"القراءة",grp_alerts:"التنبيهات والموقع",grp_data:"البيانات",athan_sound:"صوت الأذان عند الوقت",pre_athan:"تنبيه قبل الأذان (دقائق)",my_stats:"إحصائياتي الروحية",
  qibla_dir:"اتجاه القبلة",qibla_hint:"امسك الهاتف بشكل مسطح ووجّهه حتى تنطبق الكعبة على السهم.",qibla_enable:"تفعيل البوصلة",qibla_denied:"لم يتم السماح باستخدام البوصلة.",
  add_task_title:"إضافة مهمة",add_surah_task:"إضافة سورة للقراءة اليومية",add_custom_task:"مهمة مخصّصة (ذكر/عبادة)",add_munjiyat:"المنجّيات السبع",pick_surah:"اختر سورة",open_full:"فتح كاملة",mark_done:"تمّت القراءة",
  greeting:"وقت مبارك",tasbeeh_cta:"لِنُسبّح الله",tasks_empty:"لا توجد مهام، أضف وردك اليومي.",all_done:"أتممت ورد اليوم 🌿",of:"من",done_count:"مهمة",custom_prompt:"اكتب اسم المهمة:",munjiyat_note:"السجدة، يس، الدخان، الواقعة، الحشر، المُلك، الإنسان — (صيغة شائعة، عدّلها حسب مصدرك الموثّق)" },
 en:{ nav_home:"Home",nav_quran:"Quran",nav_athkar:"Athkar",nav_settings:"Settings",nav_donate:"Support",donate_title:"Support the Developer",
  daily_tasks:"My Daily Tasks",add_task:"Add",your_apps:"Your Daily Apps",prayer_times:"Prayer Times",today_achievements:"Today's Goals",my_khatmas:"My Khatmas",new_khatma:"New Khatma",
  surahs:"Surahs",juzs:"Juz",athkar_morning:"Morning Athkar",athkar_evening:"Evening Athkar",athkar_post:"After-Prayer Athkar",athkar_sleep:"Sleep Athkar",
  language:"Language",reading_bg:"Reading Background",notif_athan:"Athan Notifications",gps_auto:"Auto Location (GPS)",keep_awake:"Keep Screen On",night_mode:"Day Mode (light)",font_size:"Reading Font Size",factory_reset:"Reset App Data",
  grp_general:"General",grp_reading:"Reading",grp_alerts:"Alerts & Location",grp_data:"Data",athan_sound:"Play Athan sound",pre_athan:"Pre-Athan reminder (min)",my_stats:"My Spiritual Stats",
  qibla_dir:"Qibla Direction",qibla_hint:"Hold the phone flat and turn it until the Kaaba aligns with the arrow.",qibla_enable:"Enable Compass",qibla_denied:"Compass permission was denied.",
  add_task_title:"Add Task",add_surah_task:"Add a Surah to daily reading",add_custom_task:"Custom task (dhikr/worship)",add_munjiyat:"The Seven Protective Surahs",pick_surah:"Choose a Surah",open_full:"Open full",mark_done:"Mark as read",
  greeting:"A Blessed Time",tasbeeh_cta:"Let's glorify Allah",tasks_empty:"No tasks yet, add your daily wird.",all_done:"Daily wird complete 🌿",of:"of",done_count:"tasks",custom_prompt:"Enter task name:",munjiyat_note:"As-Sajdah, Ya-Sin, Ad-Dukhan, Al-Waqi'ah, Al-Hashr, Al-Mulk, Al-Insan — (common set, edit per your verified source)" }
};
let currentLang = localStorage.getItem('lang') || 'ar';
function t(key){ return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.ar[key]) || key; }

window.setLang = function(lang){
    currentLang = lang; localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    applyTranslations();
    renderDailyTasks();
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    pageTitle.innerText = titles[[...tabSections].findIndex(s => s.style.display === 'block')] || t('nav_home');
};
function applyTranslations(){
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerText = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
}

// =====================================
// 13. المهمات اليومية
// =====================================
const DEFAULT_TASK_DEFS = [
 { id:'mulk', surah:67, titleAr:'سورة المُلك', titleEn:'Surah Al-Mulk', noteAr:'كل ليلة قبل النوم', noteEn:'Every night before sleep', proofAr:'كان النبي ﷺ لا ينام حتى يقرأ "تبارك الذي بيده المُلك" (رواه الترمذي والنسائي).', proofEn:'The Prophet ﷺ would not sleep until he recited Surah Al-Mulk (Tirmidhi, Nasa\'i).' },
 { id:'kahf', surah:18, titleAr:'سورة الكهف', titleEn:'Surah Al-Kahf', noteAr:'يوم الجمعة', noteEn:'On Friday', proofAr:'مَن قرأ سورة الكهف يوم الجمعة أضاء له من النور ما بين الجمعتين (رواه الحاكم والبيهقي).', proofEn:'Whoever recites Al-Kahf on Friday will have light between the two Fridays (Hakim, Bayhaqi).' },
 { id:'sajdah', surah:32, titleAr:'سورة السجدة', titleEn:'Surah As-Sajdah', noteAr:'فجر الجمعة', noteEn:'Friday Fajr', proofAr:'كان النبي ﷺ يقرأ في فجر الجمعة "الم تنزيل" السجدة و"هل أتى" (متفق عليه).', proofEn:'The Prophet ﷺ recited As-Sajdah and Al-Insan in Friday Fajr (Bukhari & Muslim).' },
 { id:'waqiah', surah:56, titleAr:'سورة الواقعة', titleEn:'Surah Al-Waqi\'ah', noteAr:'كل ليلة', noteEn:'Every night', proofAr:'"مَن قرأ سورة الواقعة كل ليلة لم تُصبه فاقة" (رواه البيهقي، وفي سنده مقال).', proofEn:'"Whoever recites Al-Waqi\'ah every night will not be afflicted by poverty" (Bayhaqi, weak chain).' },
 { id:'ikhlas', surah:112, titleAr:'الإخلاص والمعوّذتان', titleEn:'Al-Ikhlas & Al-Mu\'awwidhatayn', noteAr:'صباحاً ومساءً ثلاثاً، وبعد كل صلاة', noteEn:'3x morning & evening, and after each prayer', proofAr:'كان ﷺ يقرؤها ثلاثاً حين يُصبح وحين يُمسي (رواه أبو داود والترمذي).', proofEn:'He ﷺ recited them 3 times in the morning and evening (Abu Dawud, Tirmidhi).' }
];
let taskDefs = [];
let taskStatus = { date:'', done:{} };
let _activeTaskId = null, _activeReaderSurah = null, _activeReaderName = '';

function todayKey(){ return new Date().toISOString().slice(0,10); }
function loadTasks(){
    try { taskDefs = JSON.parse(localStorage.getItem('task_defs_v1')); } catch(e){ taskDefs = null; }
    if (!taskDefs) { taskDefs = JSON.parse(JSON.stringify(DEFAULT_TASK_DEFS)); saveDefs(); }
    // ترحيل: إزالة "المنجّيات السبع" نهائياً لمن أضافها سابقاً
    if (taskDefs.some(d => d.id === 'munjiyat')) { taskDefs = taskDefs.filter(d => d.id !== 'munjiyat'); saveDefs(); }
    try { taskStatus = JSON.parse(localStorage.getItem('task_status_v1')) || {date:'',done:{}}; } catch(e){ taskStatus = {date:'',done:{}}; }
    if (taskStatus.date !== todayKey()) { taskStatus = { date: todayKey(), done:{} }; saveStatus(); }
    renderDailyTasks();
}
function saveDefs(){ localStorage.setItem('task_defs_v1', JSON.stringify(taskDefs)); }
function saveStatus(){ localStorage.setItem('task_status_v1', JSON.stringify(taskStatus)); }

window.renderDailyTasks = function(){
    const c = document.getElementById('daily-tasks-list'); if(!c) return;
    if (taskDefs.length === 0){ c.innerHTML = `<p class="tasks-empty">${t('tasks_empty')}</p>`; updateTasksProgress(); return; }
    c.innerHTML = taskDefs.map(d => {
        const done = !!taskStatus.done[d.id];
        const title = currentLang==='en' ? (d.titleEn||d.titleAr) : d.titleAr;
        const note = currentLang==='en' ? (d.noteEn||d.noteAr||'') : (d.noteAr||'');
        const proof = currentLang==='en' ? (d.proofEn||d.proofAr||'') : (d.proofAr||'');
        const surahTag = d.surah ? `<i class="fa-solid fa-book-quran" style="color:var(--accent-color); font-size:0.8rem; margin-inline-start:6px;"></i>` : '';
        const proofChip = proof ? `<span class="proof-chip" onclick="showTaskProof(event,'${d.id}')"><i class="fa-solid fa-book"></i> ${currentLang==='en'?'source':'الدليل'}</span>` : '';
        return `<div class="task-item ${done?'done':''}" data-id="${d.id}">
            <div class="task-check" onclick="toggleTask('${d.id}')"><i class="fa-solid fa-check"></i></div>
            <div class="task-body" onclick="openTask('${d.id}')">
                <div class="task-title">${title}${surahTag}</div>
                ${(note||proof)?`<div class="task-note">${note?`<span><i class="fa-regular fa-clock"></i> ${note}</span>`:''} ${proofChip}</div>`:''}
            </div>
            <button class="task-del" onclick="deleteTask(event,'${d.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </div>`;
    }).join('');
    updateTasksProgress();
};
function updateTasksProgress(){
    const total = taskDefs.length;
    const done = taskDefs.filter(d => taskStatus.done[d.id]).length;
    const pct = total ? Math.round(done/total*100) : 0;
    const fill = document.getElementById('tasks-progress-fill'); const lbl = document.getElementById('tasks-progress-label');
    if(fill) fill.style.width = pct + '%';
    if(lbl) lbl.innerText = (done===total && total>0) ? t('all_done') : `${done} ${t('of')} ${total} ${t('done_count')}`;
}
window.toggleTask = function(id){
    taskStatus.done[id] = !taskStatus.done[id]; saveStatus(); renderDailyTasks();
};
window.openTask = function(id){
    const d = taskDefs.find(x => x.id === id); if(!d) return;
    if (d.surah){ openMiniReader(d); }
    else { toggleTask(id); }
};
window.showTaskProof = function(e, id){
    e.stopPropagation();
    const d = taskDefs.find(x => x.id === id); if(!d) return;
    const title = currentLang==='en' ? (d.titleEn||d.titleAr) : d.titleAr;
    const proof = currentLang==='en' ? (d.proofEn||d.proofAr) : (d.proofAr||'');
    showBadgeToast({ emoji:'📜', name:title, desc:proof });
};
window.deleteTask = function(e, id){
    e.stopPropagation();
    taskDefs = taskDefs.filter(d => d.id !== id); saveDefs();
    delete taskStatus.done[id]; saveStatus(); renderDailyTasks();
};

// --- إضافة مهام ---
window.openAddTaskMenu = function(){ document.getElementById('add-task-modal').classList.add('active'); };
window.closeAddTaskMenu = function(){ document.getElementById('add-task-modal').classList.remove('active'); };
window.addCustomTaskPrompt = function(){
    closeAddTaskMenu();
    const name = prompt(t('custom_prompt'));
    if(!name) return;
    taskDefs.push({ id:'c'+Date.now(), surah:null, titleAr:name, titleEn:name, noteAr:'', noteEn:'' });
    saveDefs(); renderDailyTasks();
};
// --- منتقي السور ---
window.openSurahPicker = function(){
    closeAddTaskMenu();
    document.getElementById('task-note-input').value = '';
    document.getElementById('surah-search').value = '';
    buildSurahPicker('');
    document.getElementById('surah-picker-modal').classList.add('active');
};
window.closeSurahPicker = function(){ document.getElementById('surah-picker-modal').classList.remove('active'); };
function buildSurahPicker(filter){
    const list = document.getElementById('surah-picker-list');
    const f = (filter||'').trim().toLowerCase();
    let html = '';
    SURAH_NAMES.forEach((s, i) => {
        const num = i+1;
        if (f && !(s[0].includes(filter) || s[1].toLowerCase().includes(f) || String(num)===f)) return;
        html += `<div class="surah-pick-item" onclick="pickSurahTask(${num})">
            <div class="spi-left"><span class="spi-num">${num}</span><span class="spi-en">${s[1]}</span></div>
            <span class="spi-ar">${s[0]}</span></div>`;
    });
    list.innerHTML = html;
}
window.filterSurahPicker = function(){ buildSurahPicker(document.getElementById('surah-search').value); };
window.pickSurahTask = function(num){
    const note = document.getElementById('task-note-input').value.trim();
    taskDefs.push({ id:'s'+num+'_'+Date.now(), surah:num, titleAr:'سورة '+SURAH_NAMES[num-1][0], titleEn:'Surah '+SURAH_NAMES[num-1][1], noteAr:note, noteEn:note });
    saveDefs(); closeSurahPicker(); renderDailyTasks();
};

// --- القارئ المصغّر ---
async function openMiniReader(def){
    _activeTaskId = def.id; _activeReaderSurah = def.surah; _activeReaderName = surahName(def.surah);
    document.getElementById('mini-reader-title').innerText = (currentLang==='en'?(def.titleEn||def.titleAr):def.titleAr);
    const note = currentLang==='en' ? (def.noteEn||'') : (def.noteAr||'');
    document.getElementById('mini-reader-note').innerText = note;
    const body = document.getElementById('mini-reader-body');
    body.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2.5rem; color:var(--primary-color);"></i></div>`;
    document.getElementById('mini-reader-modal').classList.add('active');
    try {
        const data = await fetchOffline(`https://api.alquran.cloud/v1/surah/${def.surah}/quran-uthmani`);
        const ayahs = data.data.ayahs;
        let html = '';
        if (def.surah !== 1 && def.surah !== 9) html += '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>';
        ayahs.forEach(a => {
            let txt = a.text;
            if (a.numberInSurah === 1 && def.surah !== 1 && def.surah !== 9) txt = txt.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
            html += `<div class="ayah" style="font-size:${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`;
        });
        body.innerHTML = html; applyReadingBg(); body.scrollTop = 0;
    } catch(e){ body.innerHTML = `<p style="text-align:center; color:#c0392b; padding:20px;">${currentLang==='en'?'Connect to the internet for first load.':'تأكد من الاتصال بالإنترنت لأول تحميل.'}</p>`; }
}
window.closeMiniReader = function(){ document.getElementById('mini-reader-modal').classList.remove('active'); };
window.markTaskDoneFromReader = function(){ if(_activeTaskId){ taskStatus.done[_activeTaskId] = true; saveStatus(); renderDailyTasks(); } closeMiniReader(); };
window.openFullSurahFromTask = function(){
    const num = _activeReaderSurah, name = _activeReaderName;
    closeMiniReader();
    goToTab(1);
    if (num) openFreeReading('surah', num, name);
};

// =====================================
// 14. خلفية القراءة
// =====================================
let READING_BG = localStorage.getItem('readingBg') || 'dark';
window.setReadingBg = function(bg){
    READING_BG = bg; localStorage.setItem('readingBg', bg);
    applyReadingBg();
    document.querySelectorAll('.bg-swatch').forEach(s => s.classList.toggle('active', s.dataset.bg === bg));
};
function applyReadingBg(){
    document.querySelectorAll('#ayahs-container, #khatma-container, #mini-reader-body').forEach(el => { el.dataset.bg = READING_BG; });
    document.querySelectorAll('.bg-swatch').forEach(s => s.classList.toggle('active', s.dataset.bg === READING_BG));
}

// =====================================
// 15. التهيئة النهائية
// =====================================
document.documentElement.lang = currentLang;
document.documentElement.dir = (currentLang === 'ar') ? 'rtl' : 'ltr';
applyTranslations();
document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
loadTasks();
applyReadingBg();

getPrayerTimes(); getSurahs();