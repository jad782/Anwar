// =======================================================
//  prayers.js — حساب أوقات الصلاة محلياً (أوفلاين بالكامل)
//  مبني على خوارزمية PrayTimes.org (المجال العام) — مبسّطة.
//  يدعم: موقع تلقائي (GPS) أو يدوي (قائمة مدن)، وعدّة طرق حساب.
// =======================================================
(function(){
'use strict';
const $ = id => document.getElementById(id);
const L = () => (typeof currentLang !== 'undefined' ? currentLang : 'ar');
window.PRAYERS = window.PRAYERS || {};

// طرق الحساب (زوايا الفجر/العشاء)
const METHODS = {
    MWL:      { fajr:18,   isha:17,   ar:'رابطة العالم الإسلامي' },
    Egypt:    { fajr:19.5, isha:17.5, ar:'الهيئة المصرية' },
    Makkah:   { fajr:18.5, isha:'90 min', ar:'أم القرى (مكة)' },
    Karachi:  { fajr:18,   isha:18,   ar:'كراتشي' },
    Turkey:   { fajr:18,   isha:17,   ar:'ديانت (تركيا)' },
    ISNA:     { fajr:15,   isha:15,   ar:'أمريكا الشمالية (ISNA)' }
};
// مدن جاهزة (lat, lng, tz بالساعات) — تشمل سوريا
const CITIES = [
    { ar:'دمشق', en:'Damascus', lat:33.5138, lng:36.2765, tz:3 },
    { ar:'حلب', en:'Aleppo', lat:36.2021, lng:37.1343, tz:3 },
    { ar:'حمص', en:'Homs', lat:34.7308, lng:36.7090, tz:3 },
    { ar:'حماة', en:'Hama', lat:35.1318, lng:36.7578, tz:3 },
    { ar:'اللاذقية', en:'Latakia', lat:35.5196, lng:35.7915, tz:3 },
    { ar:'دير الزور', en:'Deir ez-Zor', lat:35.3359, lng:40.1408, tz:3 },
    { ar:'الحسكة', en:'Al-Hasakah', lat:36.5024, lng:40.7479, tz:3 },
    { ar:'درعا', en:'Daraa', lat:32.6189, lng:36.1021, tz:3 },
    { ar:'إدلب', en:'Idlib', lat:35.9306, lng:36.6339, tz:3 },
    { ar:'الرقة', en:'Raqqa', lat:35.9594, lng:39.0497, tz:3 },
    { ar:'القامشلي', en:'Qamishli', lat:37.0521, lng:41.2314, tz:3 },
    { ar:'إسطنبول', en:'Istanbul', lat:41.0082, lng:28.9784, tz:3 },
    { ar:'أنقرة', en:'Ankara', lat:39.9334, lng:32.8597, tz:3 },
    { ar:'مكة المكرمة', en:'Makkah', lat:21.3891, lng:39.8579, tz:3 },
    { ar:'المدينة المنورة', en:'Madinah', lat:24.5247, lng:39.5692, tz:3 },
    { ar:'الرياض', en:'Riyadh', lat:24.7136, lng:46.6753, tz:3 },
    { ar:'القاهرة', en:'Cairo', lat:30.0444, lng:31.2357, tz:2 },
    { ar:'القدس', en:'Jerusalem', lat:31.7683, lng:35.2137, tz:2 },
    { ar:'عمّان', en:'Amman', lat:31.9454, lng:35.9284, tz:3 },
    { ar:'بيروت', en:'Beirut', lat:33.8938, lng:35.5018, tz:3 },
    { ar:'بغداد', en:'Baghdad', lat:33.3152, lng:44.3661, tz:3 },
    { ar:'دبي', en:'Dubai', lat:25.2048, lng:55.2708, tz:4 },
    { ar:'لندن', en:'London', lat:51.5074, lng:-0.1278, tz:0 },
    { ar:'باريس', en:'Paris', lat:48.8566, lng:2.3522, tz:1 },
    { ar:'برلين', en:'Berlin', lat:52.52, lng:13.405, tz:1 }
];
PRAYERS.CITIES = CITIES; PRAYERS.METHODS = METHODS;

// ---- رياضيات فلكية ----
const dtr = d => d*Math.PI/180, rtd = r => r*180/Math.PI;
const sin = d => Math.sin(dtr(d)), cos = d => Math.cos(dtr(d)), tan = d => Math.tan(dtr(d));
const arcsin = x => rtd(Math.asin(x)), arccos = x => rtd(Math.acos(x)), arctan2 = (y,x) => rtd(Math.atan2(y,x)), arccot = x => rtd(Math.atan(1/x));
const fixA = a => { a = a - 360*Math.floor(a/360); return a<0?a+360:a; };
const fixH = a => { a = a - 24*Math.floor(a/24); return a<0?a+24:a; };

function julian(y,m,d){ if(m<=2){ y-=1; m+=12; } const A=Math.floor(y/100), B=2-A+Math.floor(A/4); return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5; }
function sunPosition(jd){
    const D = jd - 2451545.0;
    const g = fixA(357.529 + 0.98560028*D);
    const q = fixA(280.459 + 0.98564736*D);
    const Ls = fixA(q + 1.915*sin(g) + 0.020*sin(2*g));
    const e = 23.439 - 0.00000036*D;
    const decl = arcsin(sin(e)*sin(Ls));
    const eqt = (q/15) - fixH(arctan2(cos(e)*sin(Ls), cos(Ls))/15);
    return { decl, eqt };
}
function midDay(jd, t){ const eqt = sunPosition(jd + t).eqt; return fixH(12 - eqt); }
function sunAngleTime(jd, t, angle, lat, ccw){
    const decl = sunPosition(jd + t).decl;
    const noon = midDay(jd, t);
    const x = (-sin(angle) - sin(lat)*sin(decl)) / (cos(lat)*cos(decl));
    if (x < -1 || x > 1) return NaN;
    const T = arccos(x)/15;
    return noon + (ccw ? -T : T);
}
function asrTime(jd, t, factor, lat){
    const decl = sunPosition(jd + t).decl;
    const angle = -arccot(factor + tan(Math.abs(lat - decl)));
    return sunAngleTime(jd, t, angle, lat, false);
}
function toHHMM(h){
    if (isNaN(h)) return '--:--';
    h = fixH(h + 0.5/60); // تقريب لأقرب دقيقة
    const hh = Math.floor(h), mm = Math.floor((h-hh)*60);
    return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
}

PRAYERS.compute = function(lat, lng, tz, date, methodKey, asrHanafi){
    date = date || new Date();
    const M = METHODS[methodKey] || METHODS.MWL;
    const jd = julian(date.getFullYear(), date.getMonth()+1, date.getDate()) - lng/(15*24);
    const base = 12 - lng/15 + tz; // ظهر تقريبي بالساعة المحلية
    const T = h => (h - lng/15 + tz);
    let fajr    = T(sunAngleTime(jd, base/24, M.fajr, lat, true));
    let sunrise = T(sunAngleTime(jd, base/24, 0.833, lat, true));
    let dhuhr   = T(midDay(jd, base/24)) + 2/60; // + احتياط دخول الوقت دقيقتين
    let asr     = T(asrTime(jd, base/24, asrHanafi?2:1, lat));
    let maghrib = T(sunAngleTime(jd, base/24, 0.833, lat, false));
    let isha;
    if (typeof M.isha === 'string'){ isha = maghrib + parseInt(M.isha)/60; }
    else { isha = T(sunAngleTime(jd, base/24, M.isha, lat, false)); }
    return { Fajr:toHHMM(fajr), Sunrise:toHHMM(sunrise), Dhuhr:toHHMM(dhuhr), Asr:toHHMM(asr), Maghrib:toHHMM(maghrib+1/60), Isha:toHHMM(isha) };
};

// الإعدادات المحفوظة
PRAYERS.getConfig = function(){
    let c = {}; try{ c = JSON.parse(localStorage.getItem('prayer_cfg')||'{}'); }catch(e){}
    return { mode: c.mode||'auto', cityIdx: (c.cityIdx!=null?c.cityIdx:0), method: c.method||'Turkey', hanafi: !!c.hanafi, lat:c.lat, lng:c.lng, tz:c.tz };
};
PRAYERS.saveConfig = function(c){ localStorage.setItem('prayer_cfg', JSON.stringify(c)); };

// نقطة الدخول: تحسب وتعبّي القيم العامة + الواجهة (أوفلاين)
PRAYERS.refresh = function(){
    const cfg = PRAYERS.getConfig();
    const apply = (lat,lng,tz,label) => {
        const t = PRAYERS.compute(lat,lng,tz,new Date(),cfg.method,cfg.hanafi);
        if (typeof window.setPrayerTimings === 'function') window.setPrayerTimings(t, label);
    };
    if (cfg.mode==='manual'){
        const c = CITIES[cfg.cityIdx]||CITIES[0]; apply(c.lat,c.lng,c.tz, (L()==='en'?c.en:c.ar));
    } else if (cfg.lat!=null){
        apply(cfg.lat, cfg.lng, cfg.tz, L()==='en'?'Your location':'موقعك');
    } else if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(p=>{
            const tz = -new Date().getTimezoneOffset()/60;
            const c = {...cfg, lat:p.coords.latitude, lng:p.coords.longitude, tz}; PRAYERS.saveConfig(c);
            apply(p.coords.latitude, p.coords.longitude, tz, L()==='en'?'Your location':'موقعك');
        }, ()=>{ const c=CITIES[cfg.cityIdx]||CITIES[0]; apply(c.lat,c.lng,c.tz,(L()==='en'?c.en:c.ar)); }, {timeout:8000, maximumAge:6e5});
    } else { const c=CITIES[cfg.cityIdx]||CITIES[0]; apply(c.lat,c.lng,c.tz,(L()==='en'?c.en:c.ar)); }
};

// واجهة إعدادات الموقع وطريقة الحساب
function injectSettings(){
    const list = document.querySelector('#tab-settings .settings-list'); if(!list || $('pl-mode')) return;
    const cfg = PRAYERS.getConfig();
    const w = document.createElement('div');
    const cityOpts = CITIES.map((c,i)=>`<option value="${i}" ${i===cfg.cityIdx?'selected':''}>${L()==='en'?c.en:c.ar}</option>`).join('');
    const methOpts = Object.keys(METHODS).map(k=>`<option value="${k}" ${k===cfg.method?'selected':''}>${METHODS[k].ar}</option>`).join('');
    w.innerHTML = `<div class="set-group-title">${L()==='en'?'Prayer times & location':'أوقات الصلاة والموقع'}</div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-location-crosshairs"></i></span><span class="set-label">${L()==='en'?'Location':'تحديد الموقع'}</span>
        <div class="lang-switch"><button class="lang-btn ${cfg.mode==='auto'?'active':''}" id="pl-mode-auto">${L()==='en'?'Auto':'تلقائي'}</button><button class="lang-btn ${cfg.mode==='manual'?'active':''}" id="pl-mode-manual">${L()==='en'?'Manual':'يدوي'}</button></div></div>
      <div class="setting-item" id="pl-city-row" style="${cfg.mode==='manual'?'':'display:none'}"><span class="set-ico"><i class="fa-solid fa-city"></i></span><span class="set-label">${L()==='en'?'City':'المدينة'}</span><select id="pl-city" class="rt-reciter">${cityOpts}</select></div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-calculator"></i></span><span class="set-label">${L()==='en'?'Method':'طريقة الحساب'}</span><select id="pl-method" class="rt-reciter">${methOpts}</select></div>`;
    const anchor = [...list.querySelectorAll('.set-group-title')].find(el=>el.dataset.i18n==='grp_alerts') || list.firstChild;
    list.insertBefore(w, anchor);
    const save = ()=>{ const c=PRAYERS.getConfig(); c.cityIdx=+$('pl-city').value; c.method=$('pl-method').value; PRAYERS.saveConfig(c); PRAYERS.refresh(); };
    $('pl-mode-auto').onclick = ()=>{ const c=PRAYERS.getConfig(); c.mode='auto'; c.lat=null; PRAYERS.saveConfig(c); $('pl-mode-auto').classList.add('active'); $('pl-mode-manual').classList.remove('active'); $('pl-city-row').style.display='none'; PRAYERS.refresh(); };
    $('pl-mode-manual').onclick = ()=>{ const c=PRAYERS.getConfig(); c.mode='manual'; PRAYERS.saveConfig(c); $('pl-mode-manual').classList.add('active'); $('pl-mode-auto').classList.remove('active'); $('pl-city-row').style.display='flex'; PRAYERS.refresh(); };
    $('pl-city').onchange = save; $('pl-method').onchange = save;
    const pid=document.createElement('span'); pid.id='pl-mode'; pid.style.display='none'; w.appendChild(pid);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(injectSettings, 800));
else setTimeout(injectSettings, 800);
})();
