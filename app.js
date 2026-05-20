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

// =====================================
// أوقات الصلاة والعد التنازلي المطور
// =====================================
async function getPrayerTimes() {
    try {
        const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Istanbul&country=Turkey&method=13');
        const data = await response.json();
        const timings = data.data.timings;
        const dateInfo = data.data.date;
        
        prayerTimings = {
            Fajr: timings.Fajr, Sunrise: timings.Sunrise, Dhuhr: timings.Dhuhr,
            Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha
        };

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
    } catch (error) { console.error('Error:', error); }
}

function startCountdown() {
    setInterval(() => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentSeconds = now.getSeconds();
        const currentTimeInMinutes = (currentHours * 60) + currentMinutes;

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
        let activePrayer = null;

        for (let i = 0; i < list.length; i++) {
            let [h, m] = list[i].time.split(':');
            let prayerTimeInMinutes = (parseInt(h) * 60) + parseInt(m);
            
            if (currentTimeInMinutes < prayerTimeInMinutes) {
                nextPrayer = list[i];
                activePrayer = i > 0 ? list[i-1] : list;
                break;
            }
        }

        if (!nextPrayer) {
            nextPrayer = list; 
            activePrayer = list; 
        }

        document.getElementById(`p-${activePrayer.id}`).classList.add('active-prayer');
        document.getElementById('next-prayer-name').innerText = `متبقي على ${nextPrayer.name}`;

        let [nextH, nextM] = nextPrayer.time.split(':');
        let targetDate = new Date();
        targetDate.setHours(parseInt(nextH), parseInt(nextM), 0);
        
        if (currentTimeInMinutes >= ((parseInt(nextH)*60)+parseInt(nextM))) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        let diff = targetDate - now;
        let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdown').innerText = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// =====================================
// القبلة والمسبحة والإشعارات
// =====================================
function openQibla() {
    document.getElementById('qibla-overlay').style.display = 'flex';
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientationabsolute', (event) => {
            let compass = event.webkitCompassHeading || Math.abs(event.alpha - 360);
            // زاوية القبلة في اسطنبول تقريباً 153 درجة
            let qiblaDegree = 153 - compass;
            document.getElementById('compass-arrow').style.transform = `rotate(${qiblaDegree}deg)`;
        });
    } else {
        alert("عذراً، حساس البوصلة غير مدعوم في جهازك أو متصفحك.");
    }
}

let tasbeehCount = 0;
const athkarPhrases = ["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ"];
let phraseIndex = 0;

function countTasbeeh() {
    tasbeehCount++;
    document.getElementById('misbaha-count').innerText = tasbeehCount;
    if (tasbeehCount % 33 === 0) {
        phraseIndex = (phraseIndex + 1) % athkarPhrases.length;
        document.getElementById('misbaha-text').innerText = athkarPhrases[phraseIndex];
    }
}
function resetTasbeeh() {
    tasbeehCount = 0; phraseIndex = 0;
    document.getElementById('misbaha-count').innerText = 0;
    document.getElementById('misbaha-text').innerText = athkarPhrases;
}

function toggleTheker(card) {
    const content = card.querySelector('.theker-content');
    const icon = card.querySelector('.theker-title i');
    if (content.style.display === 'block') {
        content.style.display = 'none'; icon.className = 'fa-solid fa-chevron-down';
    } else {
        content.style.display = 'block'; icon.className = 'fa-solid fa-chevron-up';
    }
}

// الإشعارات
const notifToggle = document.getElementById('notifications-toggle');
notifToggle.addEventListener('change', () => {
    if (notifToggle.checked) {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                new Notification('تطبيق الأنوار', { body: 'تم تفعيل إشعارات الصلاة بنجاح!' });
            } else {
                alert('يرجى السماح بالإشعارات من إعدادات المتصفح.');
                notifToggle.checked = false;
            }
        });
    }
});

// =====================================
// المصحف والإعدادات
// =====================================
async function getSurahs() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        surahList.innerHTML = '';
        data.data.forEach(surah => {
            const revType = surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';
            const cleanName = surah.name.replace('سُورَةُ ', '');
            surahList.innerHTML += `
                <div class="surah-card" onclick="openSurah(${surah.number}, '${cleanName}')">
                    <div class="surah-info"><div class="surah-number">${surah.number}</div><div class="surah-details"><h2>${cleanName}</h2><p>${revType} • ${surah.numberOfAyahs} آيات</p></div></div>
                    <div class="surah-name-arabic">${surah.name}</div>
                </div>`;
        });
    } catch (error) { surahList.innerHTML = '<div style="color:red; text-align:center;">خطأ بالتحميل</div>'; }
}

async function openSurah(num, name) {
    currentReadingData = { number: num, name: name };
    surahList.style.display = 'none'; readingView.style.display = 'block';
    pageTitle.innerText = 'تلاوة القرآن'; currentSurahName.innerText = 'سورة ' + name;
    ayahsContainer.innerHTML = '<div style="text-align:center; padding: 20px;">جاري جلب الآيات...</div>';
    document.querySelector('#save-bookmark-btn i').className = 'fa-regular fa-bookmark';

    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/quran-uthmani`);
        const data = await res.json();
        let html = (num !== 1 && num !== 9) ? '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>' : '';
        data.data.ayahs.forEach(ayah => {
            let text = (num !== 1 && ayah.numberInSurah === 1) ? ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '') : ayah.text;
            html += `<div class="ayah" style="font-size: ${currentFontSize}px;">${text} <span class="ayah-number">${ayah.numberInSurah}</span></div>`;
        });
        ayahsContainer.innerHTML = html; document.querySelector('.content-area').scrollTop = 0;
    } catch (error) { ayahsContainer.innerHTML = '<div style="color:red;">خطأ بالتحميل</div>'; }
}

function closeSurah() { readingView.style.display = 'none'; surahList.style.display = 'block'; pageTitle.innerText = 'المصحف'; ayahsContainer.innerHTML = ''; }

function saveBookmark() {
    if(currentReadingData) {
        localStorage.setItem('quran_bookmark', JSON.stringify(currentReadingData));
        document.querySelector('#save-bookmark-btn i').className = 'fa-solid fa-bookmark';
    }
}

function loadBookmarkShortcut() {
    const container = document.getElementById('saved-bookmark-shortcut');
    const saved = localStorage.getItem('quran_bookmark');
    if (saved) {
        const data = JSON.parse(saved);
        container.innerHTML = `
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">آخر قراءة محفوظة:</p>
            <div class="surah-card" onclick="navButtons.click(); openSurah(${data.number}, '${data.name}');">
                <div class="surah-info"><div class="surah-number"><i class="fa-solid fa-bookmark" style="color:var(--accent-color);"></i></div><div class="surah-details"><h2>سورة ${data.name}</h2><p>اضغط للمتابعة الفورية</p></div></div>
            </div>`;
    } else { container.innerHTML = ''; }
}

const darkModeToggle = document.getElementById('dark-mode-toggle');
darkModeToggle.addEventListener('change', () => document.body.classList.toggle('dark-mode', darkModeToggle.checked));
document.getElementById('increase-font').addEventListener('click', () => { if (currentFontSize < 40) { currentFontSize += 2; updateFontSize(); } });
document.getElementById('decrease-font').addEventListener('click', () => { if (currentFontSize > 16) { currentFontSize -= 2; updateFontSize(); } });
function updateFontSize() { document.getElementById('font-size-display').innerText = currentFontSize + 'px'; document.querySelectorAll('.ayah').forEach(a => a.style.fontSize = currentFontSize + 'px'); }

getPrayerTimes(); getSurahs();