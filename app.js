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

// =====================================
// قاعدة بيانات الأذكار الاحترافية
// =====================================
const athkarDB = {
    morning: [
        { text: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ: ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...﴾ [آية الكرسي]", info: "من قالها حين يصبح أجير من الجن حتى يمسي.", max: 1 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ: ﴿قُلْ هُوَ اللَّهُ أَحَدٌ...﴾، ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...﴾، ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ...﴾", info: "من قالها ثلاث مرات تكفيه من كل شيء.", max: 3 },
        { text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ، وَحْدَهُ لَا شَرِيكَ لَهُ...", info: "", max: 1 },
        { text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ...", info: "سيد الاستغفار.", max: 1 }
    ],
    evening: [
        { text: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ: ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...﴾ [آية الكرسي]", info: "من قالها حين يمسي أجير من الجن.", max: 1 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ: ﴿قُلْ هُوَ اللَّهُ أَحَدٌ...﴾، ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...﴾، ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ...﴾", info: "ثلاث مرات تكفيك من كل شيء.", max: 3 },
        { text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ...", info: "", max: 1 }
    ],
    postPrayer: [
        { text: "أَسْتَغْفِرُ اللَّهَ.", info: "ثلاثاً بعد السلام مباشرة.", max: 3 },
        { text: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ ذَا الْجَلَالِ وَالْإِكْرَامِ.", info: "", max: 1 },
        { text: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَاللَّهُ أَكْبَرُ.", info: "تُقال دبر كل صلاة.", max: 33 }
    ],
    sleep: [
        { text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا...", info: "", max: 1 },
        { text: "اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا...", info: "", max: 1 }
    ]
};
let currentAthkarState = [];

// =====================================
// استرجاع الإعدادات عند الفتح
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); document.getElementById('dark-mode-toggle').checked = true; }
    if (localStorage.getItem('notifications') === 'true') document.getElementById('notifications-toggle').checked = true;
    tasbeehCount = parseInt(localStorage.getItem('tasbeehCount')) || 0;
    phraseIndex = parseInt(localStorage.getItem('phraseIndex')) || 0;
    document.getElementById('misbaha-count').innerText = tasbeehCount;
    document.getElementById('misbaha-text').innerText = athkarPhrases[phraseIndex];
    updateKhatmaUI();
    loadBookmarkShortcut();
});

// =====================================
// التنقل بين الصفحات
// =====================================
const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
const tabSections = document.querySelectorAll('.tab-section');
const titles = ['الرئيسية', 'المصحف', 'الأذكار', 'الإعدادات'];

navButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        if(readingView.style.display === 'block') closeSurah();
        closeKhatma(); closeAthkarCategory(); 
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        tabSections.forEach(section => section.style.display = 'none');
        tabSections[index].style.display = 'block';
        pageTitle.innerText = titles[index];
    });
});

function openAthkarTab() { navButtons.click(); }

// =====================================
// منطق شاشة الأذكار التفاعلية
// =====================================
function openAthkarCategory(catId) {
    const listNames = { morning: 'أذكار الصباح', evening: 'أذكار المساء', postPrayer: 'أذكار بعد الصلاة', sleep: 'أذكار النوم' };
    document.getElementById('athkar-categories-list').style.display = 'none';
    document.getElementById('athkar-reading-view').style.display = 'block';
    document.getElementById('current-athkar-title').innerText = listNames[catId];
    currentAthkarState = athkarDB[catId].map(item => ({...item, current: 0}));
    renderAthkarCards();
}

function closeAthkarCategory() {
    document.getElementById('athkar-reading-view').style.display = 'none';
    document.getElementById('athkar-categories-list').style.display = 'block';
}

function renderAthkarCards() {
    const container = document.getElementById('athkar-items-container');
    container.innerHTML = '';
    currentAthkarState.forEach((theker, index) => {
        const isCompleted = theker.current >= theker.max;
        container.innerHTML += `
            <div class="theker-read-card ${isCompleted ? 'completed' : ''}" onclick="incrementTheker(${index})">
                <div class="theker-text">${theker.text}</div>
                ${theker.info ? `<div class="theker-info">${theker.info}</div>` : ''}
                <div class="theker-counter-box">
                    <span style="font-size:0.9rem; color:var(--text-muted);">التكرار المطلوب: ${theker.max}</span>
                    <button class="theker-count-btn">
                        ${isCompleted ? '<i class="fa-solid fa-check"></i> اكتمل' : `${theker.current} / ${theker.max}`}
                    </button>
                </div>
            </div>
        `;
    });
}

function incrementTheker(index) {
    if (currentAthkarState[index].current < currentAthkarState[index].max) {
        if(navigator.vibrate) navigator.vibrate(50);
        currentAthkarState[index].current++;
        renderAthkarCards();
    }
}

// =====================================
// نظام الختمة الاحترافي (المحمي كلياً من الأخطاء)
// =====================================
function updateKhatmaUI() {
    try {
        const saved = localStorage.getItem('khatma_data');
        const actionsDiv = document.getElementById('khatma-actions');
        if (saved) {
            khatmaData = JSON.parse(saved);
            document.getElementById('khatma-name').innerText = khatmaData.name;
            document.getElementById('khatma-page').innerText = `واصل إلى الصفحة ${khatmaData.page}`;
            actionsDiv.innerHTML = `<button onclick="continueKhatma()" class="khatma-btn">متابعة</button> <button onclick="startNewKhatma()" class="khatma-btn-alt">جديدة</button>`;
        } else {
            document.getElementById('khatma-name').innerText = "لا توجد ختمة حالية";
            document.getElementById('khatma-page').innerText = "اضغط للبدء";
            actionsDiv.innerHTML = `<button onclick="startNewKhatma()" class="khatma-btn">بدء ختمة</button>`;
        }
    } catch(e) { console.error("Error reading Khatma:", e); }
}

function startNewKhatma() {
    let name = prompt("قم بتسمية هذه الختمة (مثال: ختمة رمضان):");
    if(name && name.trim() !== "") {
        khatmaData = { name: name, page: 1 };
        localStorage.setItem('khatma_data', JSON.stringify(khatmaData));
        updateKhatmaUI();
        openKhatmaPage(1);
    }
}

function continueKhatma() { if(khatmaData) openKhatmaPage(khatmaData.page); }

async function openKhatmaPage(pageNum) {
    currentKhatmaPage = parseInt(pageNum);
    
    // إخفاء الرئيسية وإظهار شاشة القراءة مع دوار التحميل
    document.getElementById('home-main-content').style.display = 'none'; 
    document.getElementById('khatma-view').style.display = 'block';
    
    document.getElementById('khatma-container').innerHTML = `
        <div style="text-align:center; padding: 60px 20px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--primary-color); margin-bottom:15px;"></i>
            <h3 style="color:var(--text-main);">جاري تحميل الصفحة ${currentKhatmaPage}...</h3>
        </div>
    `;
    document.getElementById('khatma-surah-name').innerText = "القرآن الكريم";
    document.getElementById('khatma-page-number').innerText = 'صفحة ' + currentKhatmaPage;
    
    document.getElementById('prev-page-btn').disabled = (currentKhatmaPage <= 1); 
    document.getElementById('next-page-btn').disabled = (currentKhatmaPage >= 604);

    try {
        // الاتصال بالسيرفر
        const res = await fetch(`https://api.alquran.cloud/v1/page/${currentKhatmaPage}/quran-uthmani`);
        if (!res.ok) throw new Error(`السيرفر رفض الطلب (الرمز: ${res.status})`);
        
        const data = await res.json();
        if (!data || !data.data || !data.data.ayahs) throw new Error("السيرفر لم يرسل الآيات بشكل صحيح");

        const ayahs = data.data.ayahs;
        
        // استخراج اسم السورة بشكل آمن
        let surahName = (ayahs.surah && ayahs.surah.name) ? ayahs.surah.name.replace('سُورَةُ ', '') : 'القرآن الكريم';
        document.getElementById('khatma-surah-name').innerText = 'سورة ' + surahName;

        // تجميع الآيات
        let html = ''; 
        let currentSurahNumber = 0;
        
        ayahs.forEach(a => {
            let sNum = (a.surah && a.surah.number) ? a.surah.number : 0;
            
            if (sNum !== currentSurahNumber) {
                if (currentSurahNumber !== 0) {
                    let sName = (a.surah && a.surah.name) ? a.surah.name.replace('سُورَةُ ', '') : '';
                    html += `<div class="surah-separator">سورة ${sName}</div>`;
                }
                currentSurahNumber = sNum;
                if (sNum !== 1 && sNum !== 9) html += '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>';
            }
            
            let txt = a.text || '';
            if (a.numberInSurah === 1 && sNum !== 1 && sNum !== 9) {
                txt = txt.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
            }
            html += `<div class="ayah" style="font-size: ${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`;
        });
        
        document.getElementById('khatma-container').innerHTML = html; 
        window.scrollTo(0, 0);
        
        // حفظ التقدم بشكل آمن كلياً
        try {
            let saved = localStorage.getItem('khatma_data');
            if (saved) khatmaData = JSON.parse(saved);
        } catch(err) { khatmaData = null; }

        if (!khatmaData) khatmaData = { name: 'الختمة الحالية', page: currentKhatmaPage };
        khatmaData.page = currentKhatmaPage; 
        localStorage.setItem('khatma_data', JSON.stringify(khatmaData)); 
        updateKhatmaUI();
        
    } catch(e) { 
        // عرض الخطأ الفعلي على الشاشة لسهولة الإصلاح
        document.getElementById('khatma-container').innerHTML = `
            <div style="text-align:center; padding: 40px 20px; background:var(--surface-color); border-radius:12px; border:1px solid var(--border-color); margin-top:20px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="color:#ef4444; margin-bottom:10px;">حدث خطأ في التحميل</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px; direction:ltr;">Error: ${e.message}</p>
                <button onclick="openKhatmaPage(${currentKhatmaPage})" style="background:var(--primary-color); color:white; border:none; padding:10px 25px; border-radius:8px; font-family:'Cairo'; font-weight:bold; cursor:pointer;">حاول مرة أخرى <i class="fa-solid fa-rotate-right"></i></button>
            </div>
        `;
    }
}

function nextKhatmaPage() { if(currentKhatmaPage < 604) openKhatmaPage(currentKhatmaPage + 1); }
function prevKhatmaPage() { if(currentKhatmaPage > 1) openKhatmaPage(currentKhatmaPage - 1); }
function closeKhatma() { document.getElementById('khatma-view').style.display = 'none'; document.getElementById('home-main-content').style.display = 'block'; }

// =====================================
// أوقات الصلاة والبوصلة
// =====================================
async function getPrayerTimes() {
    try {
        const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Istanbul&country=Turkey&method=13');
        const data = await response.json();
        const timings = data.data.timings; const dateInfo = data.data.date;
        prayerTimings = { Fajr: timings.Fajr, Sunrise: timings.Sunrise, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha };
        document.getElementById('fajr-time').innerText = timings.Fajr; document.getElementById('sunrise-time').innerText = timings.Sunrise; document.getElementById('dhuhr-time').innerText = timings.Dhuhr; document.getElementById('asr-time').innerText = timings.Asr; document.getElementById('maghrib-time').innerText = timings.Maghrib; document.getElementById('isha-time').innerText = timings.Isha;
        document.getElementById('current-day').innerText = dateInfo.gregorian.weekday.ar || "الأربعاء"; document.getElementById('hijri-date').innerText = `${dateInfo.hijri.day} ${dateInfo.hijri.month.ar} ${dateInfo.hijri.year} هـ`; document.getElementById('gregorian-date').innerText = dateInfo.gregorian.date;
        startCountdown();
    } catch (error) { console.error(error); }
}
function startCountdown() {
    setInterval(() => {
        const now = new Date(); const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();
        const list = [{ name: 'الفجر', time: prayerTimings.Fajr, id: 'Fajr' }, { name: 'الشروق', time: prayerTimings.Sunrise, id: 'Sunrise' }, { name: 'الظهر', time: prayerTimings.Dhuhr, id: 'Dhuhr' }, { name: 'العصر', time: prayerTimings.Asr, id: 'Asr' }, { name: 'المغرب', time: prayerTimings.Maghrib, id: 'Maghrib' }, { name: 'العشاء', time: prayerTimings.Isha, id: 'Isha' }];
        list.forEach(p => document.getElementById(`p-${p.id}`).classList.remove('active-prayer'));
        let nextPrayer = null;
        for (let i = 0; i < list.length; i++) {
            let [h, m] = list[i].time.split(':');
            if (currentTimeInMinutes < (parseInt(h) * 60) + parseInt(m)) {
                nextPrayer = list[i]; if(i > 0) document.getElementById(`p-${list[i-1].id}`).classList.add('active-prayer'); else document.getElementById(`p-Isha`).classList.add('active-prayer'); break;
            }
        }
        if (!nextPrayer) { nextPrayer = list; document.getElementById('p-Isha').classList.add('active-prayer'); }
        document.getElementById('next-prayer-name').innerText = `متبقي على ${nextPrayer.name}`;
        let [nextH, nextM] = nextPrayer.time.split(':'); let target = new Date(); target.setHours(parseInt(nextH), parseInt(nextM), 0);
        if (currentTimeInMinutes >= ((parseInt(nextH)*60)+parseInt(nextM))) target.setDate(target.getDate() + 1);
        let diff = target - now; let h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdown').innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);
}

function openQibla() {
    document.getElementById('qibla-overlay').style.display = 'flex';
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(res => { if (res === 'granted') window.addEventListener('deviceorientation', (e) => { document.getElementById('compass-arrow').style.transform = `rotate(${153 - (e.webkitCompassHeading || Math.abs(e.alpha - 360))}deg)`; }); });
    } else { window.addEventListener('deviceorientationabsolute', (e) => { document.getElementById('compass-arrow').style.transform = `rotate(${153 - (e.webkitCompassHeading || Math.abs(e.alpha - 360))}deg)`; }); }
}

// =====================================
// التسبيح والمصحف الحر
// =====================================
function countTasbeeh() { tasbeehCount++; document.getElementById('misbaha-count').innerText = tasbeehCount; if (tasbeehCount % 33 === 0) { phraseIndex = (phraseIndex + 1) % athkarPhrases.length; document.getElementById('misbaha-text').innerText = athkarPhrases[phraseIndex]; } localStorage.setItem('tasbeehCount', tasbeehCount); localStorage.setItem('phraseIndex', phraseIndex); }
function resetTasbeeh() { tasbeehCount = 0; phraseIndex = 0; document.getElementById('misbaha-count').innerText = 0; document.getElementById('misbaha-text').innerText = athkarPhrases; localStorage.setItem('tasbeehCount', 0); localStorage.setItem('phraseIndex', 0); }

async function getSurahs() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah'); const data = await res.json();
        document.getElementById('surah-list').innerHTML = '';
        data.data.forEach(s => { document.getElementById('surah-list').innerHTML += `<div class="surah-card" onclick="openSurah(${s.number}, '${s.name.replace('سُورَةُ ', '')}')"><div class="surah-info"><div class="surah-number">${s.number}</div><div class="surah-details"><h2>${s.name.replace('سُورَةُ ', '')}</h2><p>${s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${s.numberOfAyahs} آيات</p></div></div><div class="surah-name-arabic">${s.name}</div></div>`; });
    } catch(e) {}
}

let currentFreeReadingData = null;
async function openSurah(num, name) {
    currentFreeReadingData = { number: num, name: name }; document.getElementById('surah-list').style.display = 'none'; readingView.style.display = 'block'; pageTitle.innerText = 'تلاوة القرآن'; document.getElementById('current-surah-name').innerText = 'سورة ' + name; ayahsContainer.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--primary-color);"></i></div>';
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/quran-uthmani`); const data = await res.json();
        let html = (num !== 1 && num !== 9) ? '<div class="basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>' : '';
        data.data.ayahs.forEach(a => { let txt = (num !== 1 && a.numberInSurah === 1) ? a.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '') : a.text; html += `<div class="ayah" style="font-size: ${currentFontSize}px;">${txt} <span class="ayah-number">${a.numberInSurah}</span></div>`; });
        ayahsContainer.innerHTML = html; document.querySelector('.content-area').scrollTop = 0;
    } catch(e) { ayahsContainer.innerHTML = 'خطأ بالتحميل'; }
}
function closeSurah() { readingView.style.display = 'none'; document.getElementById('surah-list').style.display = 'block'; pageTitle.innerText = 'المصحف'; }

function saveBookmark() { if(currentFreeReadingData) { localStorage.setItem('quran_bookmark', JSON.stringify(currentFreeReadingData)); loadBookmarkShortcut(); alert("تم حفظ موضع القراءة الحرة!");} }
function loadBookmarkShortcut() { const saved = localStorage.getItem('quran_bookmark'); if (saved) { const d = JSON.parse(saved); document.getElementById('saved-bookmark-shortcut').innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">آخر قراءة محفوظة:</p><div class="surah-card" onclick="navButtons.click(); openSurah(${d.number}, '${d.name}');"><div class="surah-info"><div class="surah-number"><i class="fa-solid fa-bookmark" style="color:var(--accent-color);"></i></div><div class="surah-details"><h2>سورة ${d.name}</h2><p>متابعة</p></div></div></div>`; } }

document.getElementById('dark-mode-toggle').addEventListener('change', (e) => { document.body.classList.toggle('dark-mode', e.target.checked); localStorage.setItem('darkMode', e.target.checked); });
document.getElementById('notifications-toggle').addEventListener('change', (e) => { localStorage.setItem('notifications', e.target.checked); if(e.target.checked) Notification.requestPermission(); });
document.getElementById('increase-font').addEventListener('click', () => { if (currentFontSize < 40) { currentFontSize += 2; updateFontSize(); } });
document.getElementById('decrease-font').addEventListener('click', () => { if (currentFontSize > 16) { currentFontSize -= 2; updateFontSize(); } });
function updateFontSize() { document.getElementById('font-size-display').innerText = currentFontSize + 'px'; document.querySelectorAll('.ayah').forEach(a => a.style.fontSize = currentFontSize + 'px'); }

getPrayerTimes(); getSurahs();