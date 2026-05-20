const pageTitle = document.getElementById('page-title');
const surahList = document.getElementById('surah-list');
const readingView = document.getElementById('reading-view');
const ayahsContainer = document.getElementById('ayahs-container');

let currentFontSize = 22;
let prayerTimings = {}; 
let khatmaData = null;
let currentKhatmaPage = 1;
let tasbeehCount = 0;
let phraseIndex = 0;
const athkarPhrases = ["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ"];

// قاعدة بيانات الأذكار
const athkarDB = {
    morning: [{ text: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ: ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...﴾", info: "من قالها حين يصبح أجير من الجن حتى يمسي.", max: 1 }, { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ: ﴿قُلْ هُوَ اللَّهُ أَحَدٌ...﴾، ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...﴾، ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ...﴾", info: "ثلاث مرات تكفيك من كل شيء.", max: 3 }],
    evening: [{ text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ...", info: "", max: 1 }],
    postPrayer: [{ text: "أَسْتَغْفِرُ اللَّهَ.", info: "ثلاثاً بعد السلام مباشرة.", max: 3 }],
    sleep: [{ text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ...", info: "", max: 1 }]
};
let currentAthkarState = [];

// =====================================
// 1. استرجاع الإعدادات المحفوظة
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); document.getElementById('dark-mode-toggle').checked = true; }
    if (localStorage.getItem('notifications') === 'true') document.getElementById('notifications-toggle').checked = true;
    tasbeehCount = parseInt(localStorage.getItem('tasbeehCount')) || 0;
    phraseIndex = parseInt(localStorage.getItem('phraseIndex')) || 0;
    document.getElementById('misbaha-count').innerText = tasbeehCount;
    document.getElementById('misbaha-text').innerText = athkarPhrases[phraseIndex] || athkarPhrases;
    
    currentFontSize = parseInt(localStorage.getItem('fontSize')) || 22;
    updateFontSize();
    updateKhatmaUI();
});

// =====================================
// 2. التنقل بين الأقسام (صحيح 100%)
// =====================================
const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
const tabSections = document.querySelectorAll('.tab-section');
const titles = ['الرئيسية', 'المصحف', 'الأذكار والمسبحة', 'الإعدادات'];

function goToTab(index) {
    if(readingView.style.display === 'block') closeSurah();
    closeKhatma(); closeAthkarCategory(); 
    navButtons.forEach(btn => btn.classList.remove('active'));
    navButtons[index].classList.add('active');
    tabSections.forEach(section => section.style.display = 'none');
    tabSections[index].style.display = 'block';
    pageTitle.innerText = titles[index];
}

navButtons.forEach((button, index) => { button.addEventListener('click', () => goToTab(index)); });

// =====================================
// 3. الإعدادات والوضع الليلي
// =====================================
document.getElementById('dark-mode-toggle').addEventListener('change', (e) => { 
    document.body.classList.toggle('dark-mode', e.target.checked); localStorage.setItem('darkMode', e.target.checked); 
});

document.getElementById('notifications-toggle').addEventListener('change', async (e) => {
    localStorage.setItem('notifications', e.target.checked);
    if (e.target.checked && typeof Notification !== 'undefined') {
        try {
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') { alert('لم يتم السماح. فعّل الإشعارات من متصفحك.'); e.target.checked = false; localStorage.setItem('notifications', false); }
        } catch(err) {}
    }
});

document.getElementById('increase-font').addEventListener('click', () => { if (currentFontSize < 40) { currentFontSize += 2; updateFontSize(); localStorage.setItem('fontSize', currentFontSize); } });
document.getElementById('decrease-font').addEventListener('click', () => { if (currentFontSize > 16) { currentFontSize -= 2; updateFontSize(); localStorage.setItem('fontSize', currentFontSize); } });
function updateFontSize() { document.getElementById('font-size-display').innerText = currentFontSize + 'px'; document.querySelectorAll('.ayah').forEach(a => a.style.fontSize = currentFontSize + 'px'); }

// =====================================
// 4. أوقات الصلاة والتنبيهات الموثوقة
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
            try { new Notification(`حان الآن وقت ${PRAYER_LABELS[k]}`, { body: 'تطبيق الأنوار — لا تنسَ الصلاة في وقتها', icon: 'icon-192.jpg' }); } catch(e){}
        }
    });
}

async function getPrayerTimes() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Istanbul&country=Turkey&method=13');
        const data = await res.json();
        const t = data.data.timings; const d = data.data.date;
        prayerTimings = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
        document.getElementById('fajr-time').innerText = t.Fajr; document.getElementById('sunrise-time').innerText = t.Sunrise; document.getElementById('dhuhr-time').innerText = t.Dhuhr; document.getElementById('asr-time-active').innerText = t.Asr; document.getElementById('maghrib-time').innerText = t.Maghrib; document.getElementById('isha-time').innerText = t.Isha;
        document.getElementById('current-day').innerText = d.gregorian.weekday.ar || "الأربعاء"; document.getElementById('hijri-month').innerText = d.hijri.month.ar; document.getElementById('hijri-day').innerText = d.hijri.day; document.getElementById('hijri-year').innerText = d.hijri.year;
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
        if (!nextP) { nextP = list; document.getElementById('p-Isha').classList.add('active-prayer'); }
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
// 5. الختمة (محفوظة للأبد)
// =====================================
function updateKhatmaUI() {
    const saved = localStorage.getItem('khatma_data');
    if (saved) {
        khatmaData = JSON.parse(saved);
        document.getElementById('khatma-display').innerText = `ختمة: ${khatmaData.name}`;
        document.getElementById('khatma-page-info').innerText = `واصل لصفحة ${khatmaData.page}`;
    }
}

function startNewKhatma() {
    if(khatmaData) { openKhatmaPage(khatmaData.page); return; }
    let name = prompt("اسم الختمة:");
    if(name && name.trim() !== "") {
        khatmaData = { name: name, page: 1 };
        localStorage.setItem('khatma_data', JSON.stringify(khatmaData));
        updateKhatmaUI(); openKhatmaPage(1);
    }
}

async function openKhatmaPage(pageNum) {
    currentKhatmaPage = parseInt(pageNum);
    document.querySelector('.hero-section').style.display = 'none'; document.querySelector('.prayer-grid').style.display = 'none'; document.querySelector('.apps-scroll').style.display = 'none'; document.querySelectorAll('.section-header, .card').forEach(el => el.style.display = 'none');
    document.getElementById('khatma-view').style.display = 'block';
    document.getElementById('khatma-container').innerHTML = `<div style="text-align:center; padding: 60px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--dark-green);"></i></div>`;
    document.getElementById('khatma-page-number').innerText = 'صفحة ' + currentKhatmaPage;
    document.getElementById('prev-page-btn').disabled = (currentKhatmaPage <= 1); document.getElementById('next-page-btn').disabled = (currentKhatmaPage >= 604);

    try {
        const res = await fetch(`https://api.alquran.cloud/v1/page/${currentKhatmaPage}/quran-uthmani`);
        if (!res.ok) throw new Error("error"); const data = await res.json(); const ayahs = data.data.ayahs;
        let surahName = (ayahs.surah && ayahs.surah.name) ? ayahs.surah.name.replace('سُورَةُ ', '') : 'القرآن';
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
        if(khatmaData) { khatmaData.page = currentKhatmaPage; localStorage.setItem('khatma_data', JSON.stringify(khatmaData)); updateKhatmaUI(); }
    } catch(e) { document.getElementById('khatma-container').innerHTML = `<div style="text-align:center; padding:40px;"><p>خطأ في الاتصال</p><button onclick="openKhatmaPage(${currentKhatmaPage})" class="tasbeeh-pill">حاول مرة أخرى</button></div>`; }
}
function nextKhatmaPage() { if(currentKhatmaPage < 604) openKhatmaPage(currentKhatmaPage + 1); }
function prevKhatmaPage() { if(currentKhatmaPage > 1) openKhatmaPage(currentKhatmaPage - 1); }
function closeKhatma() { document.getElementById('khatma-view').style.display = 'none'; document.querySelector('.hero-section').style.display = 'flex'; document.querySelector('.prayer-grid').style.display = 'grid'; document.querySelector('.apps-scroll').style.display = 'flex'; document.querySelectorAll('.section-header, .card').forEach(el => el.style.display = 'flex'); }

// =====================================
// 6. الأذكار والقبلة والمسبحة
// =====================================
function openAthkarCategory(catId) {
    const listNames = { morning: 'أذكار الصباح', evening: 'أذكار المساء', postPrayer: 'أذكار بعد الصلاة', sleep: 'أذكار النوم' };
    document.getElementById('athkar-categories-list').style.display = 'none'; document.getElementById('athkar-reading-view').style.display = 'block'; document.getElementById('current-athkar-title').innerText = listNames[catId];
    currentAthkarState = athkarDB[catId].map(item => ({...item, current: 0})); renderAthkarCards();
}
function closeAthkarCategory() { document.getElementById('athkar-reading-view').style.display = 'none'; document.getElementById('athkar-categories-list').style.display = 'block'; }
function renderAthkarCards() {
    const container = document.getElementById('athkar-items-container'); container.innerHTML = '';
    currentAthkarState.forEach((theker, index) => {
        const isCompleted = theker.current >= theker.max;
        container.innerHTML += `<div class="theker-read-card ${isCompleted ? 'completed' : ''}" onclick="incrementTheker(${index})"><div class="theker-text">${theker.text}</div>${theker.info ? `<div class="theker-info">${theker.info}</div>` : ''}<div class="theker-counter-box"><span>المطلوب: ${theker.max}</span><button class="theker-count-btn">${isCompleted ? '<i class="fa-solid fa-check"></i>' : `${theker.current} / ${theker.max}`}</button></div></div>`;
    });
}
function incrementTheker(index) { if (currentAthkarState[index].current < currentAthkarState[index].max) { currentAthkarState[index].current++; renderAthkarCards(); } }

function openQibla() { document.getElementById('qibla-overlay').classList.add('active'); window.addEventListener('deviceorientationabsolute', handleOrientation); }
function closeQibla() { document.getElementById('qibla-overlay').classList.remove('active'); window.removeEventListener('deviceorientationabsolute', handleOrientation); }
function handleOrientation(e) { document.getElementById('compass-arrow').style.transform = `rotate(${153 - (e.webkitCompassHeading || Math.abs(e.alpha - 360))}deg)`; }

function countTasbeeh() { tasbeehCount++; document.getElementById('misbaha-count').innerText = tasbeehCount; if (tasbeehCount % 33 === 0) { phraseIndex = (phraseIndex + 1) % athkarPhrases.length; document.getElementById('misbaha-text').innerText = athkarPhrases[phraseIndex]; } localStorage.setItem('tasbeehCount', tasbeehCount); localStorage.setItem('phraseIndex', phraseIndex); }
function resetTasbeeh() { tasbeehCount = 0; phraseIndex = 0; document.getElementById('misbaha-count').innerText = 0; document.getElementById('misbaha-text').innerText = athkarPhrases; localStorage.setItem('tasbeehCount', 0); localStorage.setItem('phraseIndex', 0); }

async function getSurahs() {
    try { const res = await fetch('https://api.alquran.cloud/v1/surah'); const data = await res.json(); document.getElementById('surah-list').innerHTML = ''; data.data.forEach(s => { document.getElementById('surah-list').innerHTML += `<div class="surah-card" onclick="openSurah(${s.number}, '${s.name.replace('سُورَةُ ', '')}')"><div class="surah-info"><div class="surah-number">${s.number}</div><div class="surah-details"><h2>${s.name.replace('سُورَةُ ', '')}</h2><p>${s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${s.numberOfAyahs} آيات</p></div></div><div class="surah-name-arabic">${s.name}</div></div>`; }); } catch(e) {}
}
async function openSurah(num, name) {
    document.getElementById('surah-list').style.display = 'none'; readingView.style.display = 'block'; pageTitle.innerText = 'تلاوة القرآن'; document.getElementById('current-surah-name').innerText = 'سورة ' + name; ayahsContainer.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--dark-green);"></i></div>';
    try { const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/quran-uthmani`); const data = await res.json(); let html = (num !== 1 && num !== 9) ? '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>' : ''; data.data.ayahs.forEach(a => { let txt = (num !== 1 && a.numberInSurah === 1) ? a.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '') : a.text; html += `<div class="ayah" style="font-size: ${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`; }); ayahsContainer.innerHTML = html; document.querySelector('.content-area').scrollTop = 0; } catch(e) { ayahsContainer.innerHTML = 'خطأ'; }
}
function closeSurah() { readingView.style.display = 'none'; document.getElementById('surah-list').style.display = 'block'; pageTitle.innerText = 'المصحف'; }

getPrayerTimes(); getSurahs();