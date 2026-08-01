// =======================================================
//  widget-bridge.js — يصل التطبيق بودجتات الشاشة الرئيسية (iOS فقط)
//  على الويب/أندرويد: لا يفعل شيئاً بأمان.
//
//  ثلاث قنوات:
//   ١) المحتوى اليومي (آية/حديث/موقع) — يُدفع من عناصر الصفحة.
//   ٢) إعدادات المواقيت — تُدفع مرّةً ليحسب الودجت الأوقات بنفسه، فيبقى
//      صحيحاً ولو لم يُفتح التطبيق أياماً (كان يعرض أوقاتاً بائتة سابقاً).
//   ٣) التسبيح — مزامنة باتجاهين: الودجت يزيد العدّ ونحن نتبنّاه عند الفتح.
// =======================================================
(function(){
'use strict';
function plugin(){ return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.WidgetBridge) || null; }
function txt(id){ const e=document.getElementById(id); return e ? (e.innerText||'').trim() : ''; }

function nextPrayer(){
    try{
        if (typeof prayerTimings==='undefined' || !prayerTimings.Fajr) return { name:'—', time:'--:--' };
        const order=[['Fajr','الفجر'],['Dhuhr','الظهر'],['Asr','العصر'],['Maghrib','المغرب'],['Isha','العشاء']];
        const now=new Date(); const cur=now.getHours()*60+now.getMinutes();
        for(const [k,ar] of order){ const [h,m]=prayerTimings[k].split(':').map(Number); if(cur<h*60+m) return { name:ar, time:prayerTimings[k] }; }
        return { name:'الفجر', time:prayerTimings.Fajr };
    }catch(e){ return { name:'—', time:'--:--' }; }
}

// يحلّ الموقع الفعلي بنفس ترتيب PRAYERS.refresh: يدوي ← إحداثيات محفوظة ← مدينة افتراضية
function resolvedPrayerConfig(){
    if (!window.PRAYERS || !PRAYERS.getConfig) return null;
    const cfg = PRAYERS.getConfig();
    const cities = PRAYERS.CITIES || [];
    let lat, lng, tz, city;
    if (cfg.mode === 'manual' || cfg.lat == null){
        const c = cities[cfg.cityIdx] || cities[0];
        if (!c) return null;
        lat = c.lat; lng = c.lng; tz = c.tz; city = c.ar;
    } else {
        lat = cfg.lat; lng = cfg.lng;
        tz = (cfg.tz != null) ? cfg.tz : -new Date().getTimezoneOffset()/60;
        city = (txt('location-text') || 'موقعك').replace(/^\s*/,'');
    }
    return {
        lat: lat, lng: lng, tz: tz,
        method: cfg.method || 'Turkey',
        hanafi: !!cfg.hanafi,
        offsets: cfg.offsets || {},
        city: city || ''
    };
}

window.WidgetBridge = {
    push: function(){
        const p = plugin(); if(!p) return;
        const np = nextPrayer();
        const data = {
            nextPrayer: np.name,
            nextPrayerTime: np.time,
            ayah: txt('ayah-day-text'),
            ayahRef: txt('ayah-day-ref').replace(/[()﴿﴾]/g,'').trim(),
            hadith: txt('hadith-day-text'),
            location: txt('location-text')
        };
        try{ p.setData({ json: JSON.stringify(data), numHindi: localStorage.getItem('num_hindi')==='0' ? '0' : '1' }); }catch(e){}

        // إعدادات المواقيت: تتغيّر نادراً لكن دفعها رخيص ويضمن عدم تجمّد الودجت
        const cfg = resolvedPrayerConfig();
        if (cfg){ try{ p.setConfig({ json: JSON.stringify(cfg) }); }catch(e){} }
    },

    // يدفع حالة التسبيح إلى الودجت (يُستدعى بعد كل تسبيحة داخل التطبيق)
    pushTasbeeh: function(){
        const p = plugin(); if(!p) return;
        const n = parseInt(localStorage.getItem('tasbeehCount')||'0') || 0;
        try{
            p.setTasbeeh({ count: n, target: 33, phrase: 'سُبْحَانَ اللَّه' });
            localStorage.setItem('tasbeehSyncAt', String(Date.now()/1000));
        }catch(e){}
    },

    // يتبنّى ما زادته الودجت إن كان أحدث من آخر كتابة للتطبيق
    pullTasbeeh: async function(){
        const p = plugin(); if(!p || !p.getState) return;
        try{
            const s = await p.getState();
            if (!s) return;
            const widgetAt = Number(s.tasbeehUpdatedAt||0);
            const localAt  = Number(localStorage.getItem('tasbeehSyncAt')||0);
            if (widgetAt > localAt && s.tasbeehCount != null){
                const n = parseInt(s.tasbeehCount)||0;
                localStorage.setItem('tasbeehCount', String(n));
                localStorage.setItem('tasbeehSyncAt', String(widgetAt));
                if (typeof window.tasbeehCount !== 'undefined') window.tasbeehCount = n;
                const el = document.getElementById('misbaha-count');
                if (el) el.innerText = (typeof fmtDigits==='function') ? fmtDigits(n) : n;
            } else {
                this.pushTasbeeh();
            }
        }catch(e){}
    }
};

// اربط تسبيح التطبيق بالودجت كي يتطابق الرقمان فوراً
try{
    const _ct = window.countTasbeeh;
    if (typeof _ct === 'function'){
        window.countTasbeeh = function(){ const r=_ct.apply(this,arguments); try{ WidgetBridge.pushTasbeeh(); }catch(e){} return r; };
    }
    const _rt = window.resetTasbeeh;
    if (typeof _rt === 'function'){
        window.resetTasbeeh = function(){ const r=_rt.apply(this,arguments); try{ WidgetBridge.pushTasbeeh(); }catch(e){} return r; };
    }
}catch(e){}

// ادفع عند الإقلاع وكل 5 دقائق وعند العودة للتطبيق
setTimeout(()=>{ window.WidgetBridge.push(); window.WidgetBridge.pullTasbeeh(); }, 3000);
setInterval(()=>window.WidgetBridge.push(), 300000);
document.addEventListener('visibilitychange', ()=>{
    if(!document.hidden){ window.WidgetBridge.push(); window.WidgetBridge.pullTasbeeh(); }
});
})();
