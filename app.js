const pageTitle = document.getElementById('page-title');
const surahList = document.getElementById('surah-list');
const readingView = document.getElementById('reading-view');
const ayahsContainer = document.getElementById('ayahs-container');
const currentSurahName = document.getElementById('current-surah-name');

let currentFontSize = 22;
let currentReadingData = null;
let prayerTimings = {}; 

const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
const tabSections = document.querySelectorAll('.tab-section');
const titles = ['الرئيسية', 'المصحف', 'الأذكار', 'الإعدادات'];

navButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        if(readingView.style.display === 'block') closeSurah();
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        tabSections.forEach(section => section.style.display = 'none');
        tabSections[index].style.display = 'block';
        pageTitle.innerText = titles[index];
        if (index === 3) loadBookmarkShortcut(); 
    });
});

document.getElementById('quick-bookmark-btn').addEventListener('click', () => navButtons.click());

async function getPrayerTimes() {
    try {
        const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Istanbul&country=Turkey&method=13');
        const data = await response.json();
        const timings = data.data.timings;
        const dateInfo = data.data.date;
        prayerTimings = { Fajr: timings.Fajr, Sunrise: timings.Sunrise, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha };
        document.getElementById('fajr-time').innerText = timings.Fajr;
        document.getElementById('sunrise-time').innerText = timings.Sunrise;
        document.getElementById('dhuhr-time').innerText = timings.Dhuhr;
        document.getElementById('asr-time').innerText = timings.Asr;
        document.getElementById('maghrib-time').innerText = timings.Maghrib;
        document.getElementById('isha-time').innerText = timings.Isha;
        document.getElementById('current-day').innerText = dateInfo.gregorian.weekday.ar || "الأربعاء";
        document.getElementById('hijri-date').innerText = `${dateInfo.hijri.day} ${dateInfo.hijri.month.ar} ${dateInfo.hijri.year} هـ`;
        document.getElementById('gregorian-date').innerText = dateInfo.gregorian.date;
        startCountdown();
    } catch (error) { console.error(error); }
}

function startCountdown() {
    setInterval(() => {
        const now = new Date();
        const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();
        const list = [
            { name: 'الفجر', time: prayerTimings.Fajr, id: 'Fajr' },
            { name: 'الشروق', time: prayerTimings.Sunrise, id: 'Sunrise' },
            { name: 'الظهر', time: prayerTimings.Dhuhr, id: 'Dhuhr' },
            { name: 'العصر', time: prayerTimings.Asr, id: 'Asr' },
            { name: 'المغرب', time: prayerTimings.Maghrib, id: 'Maghrib' },
            { name: 'العشاء', time: prayerTimings.Isha, id: 'Isha' }
        ];
        list.forEach(p => document.getElementById(`p-${p.id}`).classList.remove('active-prayer'));
        let nextPrayer = null;
        for (let i = 0; i < list.length; i++) {
            let [h, m] = list[i].time.split(':');
            if (currentTimeInMinutes < (parseInt(h) * 60) + parseInt(m)) {
                nextPrayer = list[i];
                if(i > 0) document.getElementById(`p-${list[i-1].id}`).classList.add('active-prayer');
                else document.getElementById(`p-Isha`).classList.add('active-prayer');
                break;
            }
        }
        if (!nextPrayer) { nextPrayer = list; document.getElementById('p-Isha').classList.add('active-prayer'); }
        document.getElementById('next-prayer-name').innerText = `متبقي على ${nextPrayer.name}`;
        let [nextH, nextM] = nextPrayer.time.split(':');
        let target = new Date();
        target.setHours(parseInt(nextH), parseInt(nextM), 0);
        if (currentTimeInMinutes >= ((parseInt(nextH)*60)+parseInt(nextM))) target.setDate(target.getDate() + 1);
        let diff = target - now;
        let h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdown').innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);
}

function openQibla() {
    document.getElementById('qibla-overlay').style.display = 'flex';
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(res => {
            if (res === 'granted') window.addEventListener('deviceorientation', (e) => {
                document.getElementById('compass-arrow').style.transform = `rotate(${153 - (e.webkitCompassHeading || Math.abs(e.alpha - 360))}deg)`;
            });
        });
    } else {
        window.addEventListener('deviceorientationabsolute', (e) => {
            document.getElementById('compass-arrow').style.transform = `rotate(${153 - (e.webkitCompassHeading || Math.abs(e.alpha - 360))}deg)`;
        });
    }
}

let tasbeehCount = 0;
const athkarPhrases = ["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ"];
let phraseIndex = 0;
function countTasbeeh() {
    tasbeehCount++;
    document.getElementById('misbaha-count').innerText = tasbeehCount;
    if (tasbeehCount % 33 === 0) { phraseIndex = (phraseIndex + 1) % athkarPhrases.length; document.getElementById('misbaha-text').innerText = athkarPhrases[phraseIndex]; }
}
function resetTasbeeh() { tasbeehCount = 0; phraseIndex = 0; document.getElementById('misbaha-count').innerText = 0; document.getElementById('misbaha-text').innerText = athkarPhrases; }

function toggleTheker(card) {
    const content = card.querySelector('.theker-content');
    const icon = card.querySelector('.theker-title i');
    content.style.display = (content.style.display === 'block') ? 'none' : 'block';
    icon.className = (content.style.display === 'block') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
}

async function getSurahs() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        surahList.innerHTML = '';
        data.data.forEach(s => surahList.innerHTML += `<div class="surah-card" onclick="openSurah(${s.number}, '${s.name.replace('سُورَةُ ', '')}')"><div class="surah-info"><div class="surah-number">${s.number}</div><div class="surah-details"><h2>${s.name.replace('سُورَةُ ', '')}</h2><p>${s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${s.numberOfAyahs} آيات</p></div></div><div class="surah-name-arabic">${s.name}</div></div>`);
    } catch(e) { surahList.innerHTML = 'خطأ'; }
}

async function openSurah(num, name) {
    currentReadingData = { number: num, name: name };
    surahList.style.display = 'none'; readingView.style.display = 'block';
    pageTitle.innerText = 'تلاوة القرآن'; currentSurahName.innerText = 'سورة ' + name;
    ayahsContainer.innerHTML = 'جاري التحميل...';
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/quran-uthmani`);
        const data = await res.json();
        let html = (num !== 1 && num !== 9) ? '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>' : '';
        data.data.ayahs.forEach(a => {
            let txt = (num !== 1 && a.numberInSurah === 1) ? a.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '') : a.text;
            html += `<div class="ayah" style="font-size: ${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`;
        });
        ayahsContainer.innerHTML = html; document.querySelector('.content-area').scrollTop = 0;
    } catch(e) { ayahsContainer.innerHTML = 'خطأ'; }
}

function closeSurah() { readingView.style.display = 'none'; surahList.style.display = 'block'; pageTitle.innerText = 'المصحف'; }

function saveBookmark() {
    if(currentReadingData) { localStorage.setItem('quran_bookmark', JSON.stringify(currentReadingData)); document.querySelector('#save-bookmark-btn i').className = 'fa-solid fa-bookmark'; }
}

function loadBookmarkShortcut() {
    const saved = localStorage.getItem('quran_bookmark');
    if (saved) {
        const d = JSON.parse(saved);
        document.getElementById('saved-bookmark-shortcut').innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">آخر قراءة:</p><div class="surah-card" onclick="navButtons.click(); openSurah(${d.number}, '${d.name}');"><div class="surah-info"><div class="surah-number"><i class="fa-solid fa-bookmark" style="color:var(--accent-color);"></i></div><div class="surah-details"><h2>سورة ${d.name}</h2><p>متابعة القراءة</p></div></div></div>`;
    }
}

document.getElementById('dark-mode-toggle').addEventListener('change', (e) => document.body.classList.toggle('dark-mode', e.target.checked));
document.getElementById('increase-font').addEventListener('click', () => { if (currentFontSize < 40) { currentFontSize += 2; updateFontSize(); } });
document.getElementById('decrease-font').addEventListener('click', () => { if (currentFontSize > 16) { currentFontSize -= 2; updateFontSize(); } });
function updateFontSize() { document.getElementById('font-size-display').innerText = currentFontSize + 'px'; document.querySelectorAll('.ayah').forEach(a => a.style.fontSize = currentFontSize + 'px'); }

document.getElementById('notifications-toggle').addEventListener('change', (e) => {
    if (e.target.checked) Notification.requestPermission();
});

getPrayerTimes(); getSurahs();