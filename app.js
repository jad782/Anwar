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

async function fetchOffline(url) {
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
    if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); document.getElementById('dark-mode-toggle').checked = true; }
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
const titles = ['الرئيسية', 'المصحف', 'الأذكار', 'الإعدادات'];

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

document.getElementById('dark-mode-toggle').addEventListener('change', (e) => { document.body.classList.toggle('dark-mode', e.target.checked); localStorage.setItem('darkMode', e.target.checked); });

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

async function getPrayerTimes() {
    let url = 'https://api.aladhan.com/v1/timingsByCity?city=Istanbul&country=Turkey&method=13';
    if(localStorage.getItem('gps') === 'true' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            url = `https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=13`;
            document.getElementById('location-text').innerHTML = '<i class="fa-solid fa-location-dot"></i> موقعك الحالي';
            await fetchAndSetPrayers(url);
        }, async () => { await fetchAndSetPrayers(url); }); // Fallback
    } else { await fetchAndSetPrayers(url); }
}

async function fetchAndSetPrayers(url) {
    try {
        const res = await fetch(url);
        const data = await res.json(); const t = data.data.timings; const d = data.data.date;
        prayerTimings = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
        document.getElementById('fajr-time').innerText = t.Fajr; document.getElementById('sunrise-time').innerText = t.Sunrise; document.getElementById('dhuhr-time').innerText = t.Dhuhr; document.getElementById('asr-time-active').innerText = t.Asr; document.getElementById('maghrib-time').innerText = t.Maghrib; document.getElementById('isha-time').innerText = t.Isha;
        
        const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
        document.getElementById('current-day').innerText = days[new Date().getDay()]; 
        
        document.getElementById('hijri-month').innerText = d.hijri.month.ar; document.getElementById('hijri-day').innerText = d.hijri.day; document.getElementById('hijri-year').innerText = d.hijri.year;
        const engM = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        document.getElementById('greg-month').innerText = engM[parseInt(d.gregorian.month.number)-1]; document.getElementById('greg-day').innerText = d.gregorian.day; document.getElementById('greg-year').innerText = d.gregorian.year;
        startCountdown();
    } catch (error) {}
}

function startCountdown() {
    setInterval(() => {
        const now = new Date(); const currentMins = (now.getHours() * 60) + now.getMinutes();
        const list = [{ name: 'الفجر', time: prayerTimings.Fajr, id: 'Fajr' }, { name: 'الشروق', time: prayerTimings.Sunrise, id: 'Sunrise' }, { name: 'الظهر', time: prayerTimings.Dhuhr, id: 'Dhuhr' }, { name: 'العصر', time: prayerTimings.Asr, id: 'Asr' }, { name: 'المغرب', time: prayerTimings.Maghrib, id: 'Maghrib' }, { name: 'العشاء', time: prayerTimings.Isha, id: 'Isha' }];
        list.forEach(p => document.getElementById(`p-${p.id}`).classList.remove('active-prayer'));
        let nextP = null;
        for (let i = 0; i < list.length; i++) {
            let [h, m] = list[i].time.split(':');
            if (currentMins < (parseInt(h) * 60) + parseInt(m)) {
                nextP = list[i]; if(i > 0) document.getElementById(`p-${list[i-1].id}`).classList.add('active-prayer'); else document.getElementById(`p-Isha`).classList.add('active-prayer'); break;
            }
        }
        if (!nextP) { nextP = list[0]; document.getElementById('p-Isha').classList.add('active-prayer'); }
        document.getElementById('next-prayer-name-card').innerText = nextP.name;
        let [nH, nM] = nextP.time.split(':'); let target = new Date(); target.setHours(parseInt(nH), parseInt(nM), 0);
        if (currentMins >= ((parseInt(nH)*60)+parseInt(nM))) target.setDate(target.getDate() + 1);
        let diff = target - now; let h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdown-card').innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        document.getElementById('pill-countdown').innerText = `${nextP.name} بعد: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
        document.getElementById('khatma-container').innerHTML = html; window.scrollTo(0, 0);
        
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

window.openFreeReading = async function(type, num, name) {
    document.getElementById('surah-list').style.display = 'none'; document.getElementById('juz-list').style.display = 'none'; document.querySelector('.quran-tabs').style.display = 'none';
    readingView.style.display = 'block'; pageTitle.innerText = 'تلاوة القرآن'; document.getElementById('current-surah-name').innerText = name; 
    ayahsContainer.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--primary-color);"></i></div>';
    try { 
        const data = await fetchOffline(`https://api.alquran.cloud/v1/${type}/${num}/quran-uthmani`);
        const ayahs = data.data.ayahs || data.data; // لمعالجة اختلاف استجابة الأجزاء عن السور
        let html = ''; let currentSurahNumber = 0;
        ayahs.forEach(a => { 
            let sNum = a.surah.number;
            if (sNum !== currentSurahNumber) {
                if (currentSurahNumber !== 0 || type === 'juz') html += `<div class="surah-separator">سورة ${a.surah.name.replace('سُورَةُ ', '')}</div>`;
                currentSurahNumber = sNum;
                if (sNum !== 1 && sNum !== 9) html += '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>';
            }
            let txt = a.text; if (a.numberInSurah === 1 && sNum !== 1 && sNum !== 9) txt = txt.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', ''); 
            html += `<div class="ayah" style="font-size: ${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`; 
        }); 
        ayahsContainer.innerHTML = html; document.querySelector('.content-area').scrollTop = 0; 
    } catch(e) { ayahsContainer.innerHTML = 'خطأ'; }
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

window.openQibla = function() { document.getElementById('qibla-overlay').classList.add('active'); window.addEventListener('deviceorientationabsolute', handleOrientation); }
window.closeQibla = function() { document.getElementById('qibla-overlay').classList.remove('active'); window.removeEventListener('deviceorientationabsolute', handleOrientation); }
function handleOrientation(e) { document.getElementById('compass-arrow').style.transform = `rotate(${153 - (e.webkitCompassHeading || Math.abs(e.alpha - 360))}deg)`; }

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

getPrayerTimes(); getSurahs();