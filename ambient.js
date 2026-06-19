// =======================================================
//  ambient.js — (4أ) الواجهة الحيّة حسب وقت الصلاة + (4د) سلسلة القراءة
// =======================================================
(function(){
'use strict';
const $ = id => document.getElementById(id);
const L = () => (typeof currentLang !== 'undefined' ? currentLang : 'ar');
window.AMBIENT = window.AMBIENT || {};

// ---------- (4أ) Dynamic Ambient UI ----------
// يغيّر لون توهّج الواجهة حسب الوقت: فجر/نهار/مغرب/ليل
function currentPhase(){
    const now = new Date(); const cur = now.getHours()*60+now.getMinutes();
    const P = (typeof prayerTimings!=='undefined') ? prayerTimings : null;
    const toM = s => { if(!s) return null; const [h,m]=s.split(':').map(Number); return h*60+m; };
    if (P && P.Fajr){
        const fajr=toM(P.Fajr), sun=toM(P.Sunrise), maghrib=toM(P.Maghrib), isha=toM(P.Isha);
        if (cur>=fajr && cur<sun) return 'fajr';
        if (cur>=sun && cur<maghrib) return 'day';
        if (cur>=maghrib && cur<isha) return 'maghrib';
        return 'night';
    }
    const h=now.getHours();
    if (h>=4 && h<6) return 'fajr'; if (h>=6 && h<17) return 'day'; if (h>=17 && h<20) return 'maghrib'; return 'night';
}
AMBIENT.apply = function(){
    const on = localStorage.getItem('ambient') !== 'false'; // مفعّل افتراضياً
    if (!on){ document.documentElement.removeAttribute('data-phase'); return; }
    document.documentElement.setAttribute('data-phase', currentPhase());
};
AMBIENT.toggle = function(v){ localStorage.setItem('ambient', v?'true':'false'); AMBIENT.apply(); };

// ---------- (4د) سلسلة القراءة (Streak) ----------
function todayKey(){ return new Date().toISOString().slice(0,10); }
function yesterdayKey(){ const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); }
AMBIENT.markReadToday = function(){
    const today = todayKey();
    let last = localStorage.getItem('streak_last');
    let count = parseInt(localStorage.getItem('streak_count')||'0');
    if (last === today) { /* مسجّل اليوم */ }
    else if (last === yesterdayKey()) { count += 1; }
    else { count = 1; }
    localStorage.setItem('streak_count', String(count));
    localStorage.setItem('streak_last', today);
    AMBIENT.renderStreak();
    if (window.PRO2 && PRO2.checkBadges) PRO2.checkBadges();
};
AMBIENT.renderStreak = function(){
    // تصفير العرض إن انقطعت السلسلة (آخر قراءة ليست اليوم ولا أمس)
    let last = localStorage.getItem('streak_last');
    let count = parseInt(localStorage.getItem('streak_count')||'0');
    if (last && last!==todayKey() && last!==yesterdayKey()) count = 0;
    const el = $('streak-count'); if (el) el.innerText = count;
};

// تتبّع القراءة: راقب read_count (يزيده القارئ) وسجّل اليوم
let _lastRead = parseInt(localStorage.getItem('read_count')||'0');
setInterval(()=>{ const rc=parseInt(localStorage.getItem('read_count')||'0'); if(rc>_lastRead){ _lastRead=rc; AMBIENT.markReadToday(); } }, 1500);

function init(){
    AMBIENT.apply(); AMBIENT.renderStreak();
    // أعد تطبيق التدرّج اللوني كل دقيقة
    setInterval(AMBIENT.apply, 60000);
    // مفتاح التفعيل في الإعدادات
    const list = document.querySelector('#tab-settings .settings-list');
    if (list && !$('ambient-toggle')){
        const grp = [...list.querySelectorAll('.set-group-title')].find(el=>el.dataset.i18n==='grp_reading') || list.firstChild;
        const row=document.createElement('div'); row.className='setting-item';
        row.innerHTML = `<span class="set-ico"><i class="fa-solid fa-wand-sparkles"></i></span><span class="set-label">${L()==='en'?'Ambient theme (by prayer time)':'الواجهة الحيّة (حسب وقت الصلاة)'}</span>
            <label class="switch"><input type="checkbox" id="ambient-toggle"><span class="slider round"></span></label>`;
        if (grp && grp.parentNode===list) list.insertBefore(row, grp.nextSibling); else list.appendChild(row);
        const cb=$('ambient-toggle'); cb.checked = localStorage.getItem('ambient')!=='false';
        cb.addEventListener('change', e=>AMBIENT.toggle(e.target.checked));
    }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(init, 750));
else setTimeout(init, 750);
})();
