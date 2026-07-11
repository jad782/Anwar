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

// تنسيق الأرقام (هندي ١٢٣ أو عربي 123) — عام لكل التطبيق
function fmtDigits(s){ if(localStorage.getItem('num_hindi')==='1'){ return String(s).replace(/[0-9]/g, d=>'٠١٢٣٤٥٦٧٨٩'[+d]); } return String(s); }
window.fmtDigits = fmtDigits;

PRAYERS.compute = function(lat, lng, tz, date, methodKey, asrHanafi, offsets){
    date = date || new Date();
    const M = METHODS[methodKey] || METHODS.MWL;
    const jd = julian(date.getFullYear(), date.getMonth()+1, date.getDate()) - lng/(15*24);
    const base = 12 - lng/15 + tz; // ظهر تقريبي بالساعة المحلية
    const T = h => (h - lng/15 + tz);
    let fajr    = T(sunAngleTime(jd, base/24, M.fajr, lat, true));
    let sunrise = T(sunAngleTime(jd, base/24, 0.833, lat, true));
    let dhuhr   = T(midDay(jd, base/24)) + 2/60; // + احتياط دخول الوقت دقيقتين
    let asr     = T(asrTime(jd, base/24, asrHanafi?2:1, lat));
    let maghrib = T(sunAngleTime(jd, base/24, 0.833, lat, false)) + 1/60;
    let isha;
    if (typeof M.isha === 'string'){ isha = maghrib + parseInt(M.isha)/60; }
    else { isha = T(sunAngleTime(jd, base/24, M.isha, lat, false)); }
    // فروقات يدوية بالدقائق تُطبّق دائماً
    const o = offsets || {}; const off = k => (o[k]||0)/60;
    return {
        Fajr:    fmtDigits(toHHMM(fajr    + off('Fajr'))),
        Sunrise: fmtDigits(toHHMM(sunrise + off('Sunrise'))),
        Dhuhr:   fmtDigits(toHHMM(dhuhr   + off('Dhuhr'))),
        Asr:     fmtDigits(toHHMM(asr     + off('Asr'))),
        Maghrib: fmtDigits(toHHMM(maghrib + off('Maghrib'))),
        Isha:    fmtDigits(toHHMM(isha    + off('Isha')))
    };
};

// الإعدادات المحفوظة
PRAYERS.getConfig = function(){
    let c = {}; try{ c = JSON.parse(localStorage.getItem('prayer_cfg')||'{}'); }catch(e){}
    return { mode: c.mode||'auto', cityIdx: (c.cityIdx!=null?c.cityIdx:0), method: c.method||'Turkey', hanafi: !!c.hanafi, lat:c.lat, lng:c.lng, tz:c.tz, offsets: c.offsets||{}, travel: c.travel!==false, country: c.country||'' };
};

// قاعدة جغرافية مصغّرة (صناديق إحداثية) لاكتشاف البلد أوفلاين → طريقة الحساب المناسبة
const COUNTRY_BOX = [
    { code:'TR', ar:'تركيا',        method:'Turkey',  latMin:36, latMax:42.5, lngMin:26,  lngMax:45 },
    { code:'SA', ar:'السعودية',     method:'Makkah',  latMin:16, latMax:32,   lngMin:34,  lngMax:56 },
    { code:'AE', ar:'الإمارات',     method:'Makkah',  latMin:22, latMax:26.5, lngMin:51,  lngMax:57 },
    { code:'QA', ar:'قطر',          method:'Makkah',  latMin:24.4,latMax:26.2, lngMin:50.6,lngMax:51.7 },
    { code:'KW', ar:'الكويت',       method:'Makkah',  latMin:28.5,latMax:30.1, lngMin:46.5,lngMax:48.5 },
    { code:'EG', ar:'مصر',          method:'Egypt',   latMin:22, latMax:32,   lngMin:24,  lngMax:37 },
    { code:'SY', ar:'سوريا',        method:'Turkey',  latMin:32, latMax:37.5, lngMin:35.5,lngMax:42.5 },
    { code:'JO', ar:'الأردن',       method:'MWL',     latMin:29, latMax:33.5, lngMin:34.5,lngMax:39.5 },
    { code:'PS', ar:'فلسطين',       method:'MWL',     latMin:31, latMax:33.4, lngMin:34,  lngMax:35.6 },
    { code:'LB', ar:'لبنان',        method:'MWL',     latMin:33, latMax:34.7, lngMin:35,  lngMax:36.7 },
    { code:'IQ', ar:'العراق',       method:'Makkah',  latMin:29, latMax:37.4, lngMin:38.8,lngMax:48.6 },
    { code:'PK', ar:'باكستان',      method:'Karachi', latMin:23, latMax:37,   lngMin:60,  lngMax:78 },
    { code:'IN', ar:'الهند',        method:'Karachi', latMin:8,  latMax:35,   lngMin:68,  lngMax:97 },
    { code:'ID', ar:'إندونيسيا',    method:'MWL',     latMin:-11,latMax:6,    lngMin:95,  lngMax:141 },
    { code:'US', ar:'أمريكا',       method:'ISNA',    latMin:24, latMax:49.5, lngMin:-125,lngMax:-66 },
    { code:'CA', ar:'كندا',         method:'ISNA',    latMin:43, latMax:70,   lngMin:-141,lngMax:-52 },
    { code:'GB', ar:'بريطانيا',     method:'MWL',     latMin:49.8,latMax:59,   lngMin:-8,  lngMax:2 },
    { code:'FR', ar:'فرنسا',        method:'MWL',     latMin:41, latMax:51.5, lngMin:-5,  lngMax:9 },
    { code:'DE', ar:'ألمانيا',      method:'MWL',     latMin:47, latMax:55.5, lngMin:5.5, lngMax:15.5 }
];
function detectCountry(lat, lng){ return COUNTRY_BOX.find(c => lat>=c.latMin && lat<=c.latMax && lng>=c.lngMin && lng<=c.lngMax) || null; }
PRAYERS.detectCountry = detectCountry;
PRAYERS.saveConfig = function(c){ localStorage.setItem('prayer_cfg', JSON.stringify(c)); };

// نقطة الدخول: تحسب وتعبّي القيم العامة + الواجهة (أوفلاين)
PRAYERS.refresh = function(){
    const cfg = PRAYERS.getConfig();
    const apply = (lat,lng,tz,label) => {
        const t = PRAYERS.compute(lat,lng,tz,new Date(),cfg.method,cfg.hanafi,cfg.offsets);
        if (typeof window.setPrayerTimings === 'function') window.setPrayerTimings(t, label);
    };
    // وضع السفر: اكتشف تغيّر البلد (أوفلاين) وحدّث طريقة الحساب تلقائياً
    const maybeTravel = (lat,lng) => {
        if (!cfg.travel) return;
        const co = detectCountry(lat,lng); if(!co) return;
        if (cfg.country !== co.code){
            const c = PRAYERS.getConfig(); c.country = co.code; c.method = co.method; PRAYERS.saveConfig(c); cfg.country=co.code; cfg.method=co.method;
            if (cfg.country && localStorage.getItem('travel_last') && localStorage.getItem('travel_last')!==co.code){
                const msg = (L()==='en'? ('Location changed to '+co.ar+' — calculation method updated automatically.') : ('تغيّر موقعك إلى '+co.ar+' — تم تحديث طريقة حساب المواقيت تلقائياً.'));
                setTimeout(()=>{ if(window.PRO2&&PRO2.toast) PRO2.toast(msg); else alert(msg); }, 900);
            }
            localStorage.setItem('travel_last', co.code);
        }
    };
    if (cfg.mode==='manual'){
        const c = CITIES[cfg.cityIdx]||CITIES[0]; apply(c.lat,c.lng,c.tz, (L()==='en'?c.en:c.ar));
    } else if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(p=>{
            const tz = -new Date().getTimezoneOffset()/60;
            maybeTravel(p.coords.latitude, p.coords.longitude);
            const c = {...PRAYERS.getConfig(), lat:p.coords.latitude, lng:p.coords.longitude, tz}; PRAYERS.saveConfig(c);
            apply(p.coords.latitude, p.coords.longitude, tz, L()==='en'?'Your location':'موقعك');
        }, ()=>{ if(cfg.lat!=null){ apply(cfg.lat,cfg.lng,cfg.tz,L()==='en'?'Your location':'موقعك'); } else { const c=CITIES[cfg.cityIdx]||CITIES[0]; apply(c.lat,c.lng,c.tz,(L()==='en'?c.en:c.ar)); } }, {timeout:8000, maximumAge:6e5});
    } else if (cfg.lat!=null){
        apply(cfg.lat, cfg.lng, cfg.tz, L()==='en'?'Your location':'موقعك');
    } else { const c=CITIES[cfg.cityIdx]||CITIES[0]; apply(c.lat,c.lng,c.tz,(L()==='en'?c.en:c.ar)); }
};

const PRAYER_KEYS = [['Fajr','الفجر'],['Dhuhr','الظهر'],['Asr','العصر'],['Maghrib','المغرب'],['Isha','العشاء']];
function previewTimes(){
    const cfg = PRAYERS.getConfig(); let lat,lng,tz;
    if (cfg.mode==='manual' || cfg.lat==null){ const c=CITIES[cfg.cityIdx]||CITIES[0]; lat=c.lat; lng=c.lng; tz=c.tz; }
    else { lat=cfg.lat; lng=cfg.lng; tz=cfg.tz; }
    return PRAYERS.compute(lat,lng,tz,new Date(),cfg.method,cfg.hanafi,cfg.offsets);
}
PRAYERS.updatePreview = function(){ const box=$('pl-preview'); if(!box) return; const t=previewTimes();
    box.innerHTML = PRAYER_KEYS.map(k=>`<div class="pv-cell"><span>${L()==='en'?k[0]:k[1]}</span><b>${t[k[0]]}</b></div>`).join(''); };
PRAYERS.setOffset = function(key, delta){ const c=PRAYERS.getConfig(); c.offsets=c.offsets||{}; c.offsets[key]=Math.max(-60,Math.min(60,(c.offsets[key]||0)+delta));
    PRAYERS.saveConfig(c); const el=$('off-'+key); if(el) el.textContent=fmtDigits((c.offsets[key]>0?'+':'')+c.offsets[key]); PRAYERS.updatePreview(); PRAYERS.refresh(); };
PRAYERS.restoreDefaults = function(){ const c=PRAYERS.getConfig(); c.offsets={}; c.method='Turkey'; PRAYERS.saveConfig(c);
    PRAYER_KEYS.forEach(k=>{ const el=$('off-'+k[0]); if(el) el.textContent=fmtDigits('0'); }); const m=$('pl-method'); if(m) m.value='Turkey';
    PRAYERS.updatePreview(); PRAYERS.refresh(); };
PRAYERS.setDigits = function(hindi){ localStorage.setItem('num_hindi', hindi?'1':'0');
    $('num-ar')&&$('num-ar').classList.toggle('active',!hindi); $('num-hi')&&$('num-hi').classList.toggle('active',hindi);
    PRAYERS.updatePreview(); PRAYERS.refresh(); try{ if(window.MUSHAF && MUSHAF.rerender) MUSHAF.rerender(); }catch(e){} };

// واجهة إعدادات الموقع وطريقة الحساب
function injectSettings(){
    const list = document.querySelector('#tab-settings .settings-list'); if(!list || $('pl-mode')) return;
    const cfg = PRAYERS.getConfig();
    const w = document.createElement('div');
    const cityOpts = CITIES.map((c,i)=>`<option value="${i}" ${i===cfg.cityIdx?'selected':''}>${L()==='en'?c.en:c.ar}</option>`).join('');
    const methOpts = Object.keys(METHODS).map(k=>`<option value="${k}" ${k===cfg.method?'selected':''}>${METHODS[k].ar}</option>`).join('');
    const hindi = localStorage.getItem('num_hindi')==='1';
    const offRows = PRAYER_KEYS.map(k=>{ const v=(cfg.offsets&&cfg.offsets[k[0]])||0; return `<div class="off-row"><span class="off-name">${L()==='en'?k[0]:k[1]}</span>
        <div class="off-ctrl"><button class="off-btn" onclick="PRAYERS.setOffset('${k[0]}',-1)">−</button><span class="off-val" id="off-${k[0]}">${fmtDigits((v>0?'+':'')+v)}</span><button class="off-btn" onclick="PRAYERS.setOffset('${k[0]}',1)">+</button></div></div>`; }).join('');
    w.innerHTML = `<div class="set-group-title">${L()==='en'?'Prayer times & location':'أوقات الصلاة والموقع'}</div>
      <div id="pl-preview" class="pl-preview"></div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-location-crosshairs"></i></span><span class="set-label">${L()==='en'?'Location':'تحديد الموقع'}</span>
        <div class="lang-switch"><button class="lang-btn ${cfg.mode==='auto'?'active':''}" id="pl-mode-auto">${L()==='en'?'Auto':'تلقائي'}</button><button class="lang-btn ${cfg.mode==='manual'?'active':''}" id="pl-mode-manual">${L()==='en'?'Manual':'يدوي'}</button></div></div>
      <div class="setting-item" id="pl-city-row" style="${cfg.mode==='manual'?'':'display:none'}"><span class="set-ico"><i class="fa-solid fa-city"></i></span><span class="set-label">${L()==='en'?'City':'المدينة'}</span><select id="pl-city" class="rt-reciter">${cityOpts}</select></div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-calculator"></i></span><span class="set-label">${L()==='en'?'Method':'طريقة الحساب'}</span><select id="pl-method" class="rt-reciter">${methOpts}</select></div>
      <div class="setting-item" style="justify-content:space-between;"><span class="set-ico"><i class="fa-solid fa-plane"></i></span><span class="set-label">${L()==='en'?'Travel mode':'وضع السفر (تلقائي)'}</span>
        <label class="switch"><input type="checkbox" id="pl-travel" ${cfg.travel?'checked':''}><span class="slider round"></span></label></div>
      <div class="setting-item"><span class="set-ico"><i class="fa-solid fa-hashtag"></i></span><span class="set-label">${L()==='en'?'Numerals':'شكل الأرقام'}</span>
        <div class="lang-switch"><button class="lang-btn ${!hindi?'active':''}" id="num-ar">123</button><button class="lang-btn ${hindi?'active':''}" id="num-hi">١٢٣</button></div></div>
      <div class="setting-item" style="justify-content:space-between;"><span class="set-ico"><i class="fa-solid fa-mobile-screen-button"></i></span><span class="set-label">${L()==='en'?'Haptic feedback':'الاهتزاز اللمسي'}</span>
        <label class="switch"><input type="checkbox" id="pl-haptics" ${localStorage.getItem('haptics')!=='0'?'checked':''}><span class="slider round"></span></label></div>
      <div class="off-title">${L()==='en'?'Manual offsets (minutes)':'تعديل يدوي للأوقات (دقائق)'}</div>
      ${offRows}
      <button class="off-restore" onclick="PRAYERS.restoreDefaults()"><i class="fa-solid fa-rotate-left"></i> ${L()==='en'?'Restore defaults':'استعادة الإعدادات الافتراضية'}</button>`;
    const anchor = [...list.querySelectorAll('.set-group-title')].find(el=>el.dataset.i18n==='grp_alerts') || list.firstChild;
    list.insertBefore(w, anchor);
    const save = ()=>{ const c=PRAYERS.getConfig(); c.cityIdx=+$('pl-city').value; c.method=$('pl-method').value; PRAYERS.saveConfig(c); PRAYERS.updatePreview(); PRAYERS.refresh(); };
    $('pl-mode-auto').onclick = ()=>{ const c=PRAYERS.getConfig(); c.mode='auto'; c.lat=null; PRAYERS.saveConfig(c); $('pl-mode-auto').classList.add('active'); $('pl-mode-manual').classList.remove('active'); $('pl-city-row').style.display='none'; PRAYERS.updatePreview(); PRAYERS.refresh(); };
    $('pl-mode-manual').onclick = ()=>{ const c=PRAYERS.getConfig(); c.mode='manual'; PRAYERS.saveConfig(c); $('pl-mode-manual').classList.add('active'); $('pl-mode-auto').classList.remove('active'); $('pl-city-row').style.display='flex'; PRAYERS.updatePreview(); PRAYERS.refresh(); };
    $('pl-city').onchange = save; $('pl-method').onchange = save;
    $('pl-travel').onchange = (e)=>{ const c=PRAYERS.getConfig(); c.travel=e.target.checked; PRAYERS.saveConfig(c); };
    $('num-ar').onclick = ()=>PRAYERS.setDigits(false); $('num-hi').onclick = ()=>PRAYERS.setDigits(true);
    $('pl-haptics').onchange = (e)=>{ localStorage.setItem('haptics', e.target.checked?'1':'0'); if(e.target.checked && window.HAP) HAP.medium(); };
    const pid=document.createElement('span'); pid.id='pl-mode'; pid.style.display='none'; w.appendChild(pid);
    PRAYERS.updatePreview();
}

// ===== أوقات الكراهة (شروق، زوال، غروب) =====
function timeAdd(hhmm, mins){
    const w = String(hhmm).replace(/[٠-٩]/g, d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const p = w.split(':'); const h=+p[0], m=+p[1]; if(isNaN(h)) return hhmm;
    let t=((h*60+m+mins)%1440+1440)%1440; const H=Math.floor(t/60),M=t%60;
    return fmtDigits(String(H).padStart(2,'0')+':'+String(M).padStart(2,'0'));
}
// دقائق من نصف الليل لسلسلة وقت (يدعم الأرقام الهندية)
function toMins(hhmm){
    const w=String(hhmm||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const p=w.split(':'); const h=+p[0], m=+p[1]; return isNaN(h)?null:(h*60+m);
}
PRAYERS.renderMakruh = function(){
    const box=$('makruh-body'); if(!box) return;
    let pt; try{ pt=(typeof prayerTimings!=='undefined')?prayerTimings:null; }catch(e){ pt=null; }
    if(!pt||!pt.Sunrise){ box.innerHTML=''; return; }
    const rows=[
        [L()==='en'?'After sunrise':'بعد الشروق', pt.Sunrise, timeAdd(pt.Sunrise,15), 'fa-sun', toMins(pt.Sunrise), toMins(pt.Sunrise)+15],
        [L()==='en'?'Zenith':'الزوال', timeAdd(pt.Dhuhr,-6), pt.Dhuhr, 'fa-circle-half-stroke', toMins(pt.Dhuhr)-6, toMins(pt.Dhuhr)],
        [L()==='en'?'Before sunset':'قبيل الغروب', timeAdd(pt.Maghrib,-15), pt.Maghrib, 'fa-cloud-sun', toMins(pt.Maghrib)-15, toMins(pt.Maghrib)]
    ];
    const now=new Date(); const cur=now.getHours()*60+now.getMinutes();
    let activeIdx=-1;
    rows.forEach((r,i)=>{ if(r[4]!=null && cur>=r[4] && cur<r[5]) activeIdx=i; });
    const banner = activeIdx>=0
        ? `<div class="mk-now"><i class="fa-solid fa-triangle-exclamation"></i> ${L()==='en'?'Now is a disliked time — avoid voluntary prayer':'الوقت الحالي وقت كراهة — تُكره النافلة الآن'}</div>`
        : '';
    box.innerHTML = banner + `<div class="mk-grid">` + rows.map((r,i)=>`<div class="mk-item${i===activeIdx?' active':''}">
        <span class="mk-ic"><i class="fa-solid ${r[3]}"></i></span>
        <span class="mk-name">${r[0]}</span>
        <span class="mk-time">${r[1]} - ${r[2]}</span></div>`).join('') + `</div>`;
};
function initMakruh(){
    const grid=document.querySelector('#tab-home .prayer-grid'); if(!grid || $('makruh-card')) return;
    const c=document.createElement('div'); c.id='makruh-card'; c.className='makruh-card';
    c.innerHTML=`<div class="mk-title"><i class="fa-solid fa-ban"></i> ${L()==='en'?'Disliked prayer times':'أوقات الكراهة'}</div><div id="makruh-body"></div>`;
    grid.insertAdjacentElement('afterend', c);
    const _sp=window.setPrayerTimings;
    window.setPrayerTimings=function(){ const r=(typeof _sp==='function')?_sp.apply(this,arguments):undefined; try{PRAYERS.renderMakruh();}catch(e){} return r; };
    setTimeout(()=>{ try{PRAYERS.renderMakruh();}catch(e){} }, 600);
    setInterval(()=>{ try{PRAYERS.renderMakruh();}catch(e){} }, 60000); // تحديث المؤشّر الحالي كل دقيقة
}
function boot(){ injectSettings(); initMakruh(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot, 800));
else setTimeout(boot, 800);
})();
