// =======================================================
//  widget-bridge.js — يدفع بيانات الودجت إلى App Group (iOS فقط)
//  يجمع: الصلاة القادمة، آية اليوم، حديث اليوم، الموقع — ويرسلها للودجت.
//  على الويب/أندرويد: no-op آمن.
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
        try{ p.setData({ json: JSON.stringify(data) }); }catch(e){}
    }
};
// ادفع عند الإقلاع وكل 5 دقائق وعند العودة للتطبيق
setTimeout(()=>window.WidgetBridge.push(), 3000);
setInterval(()=>window.WidgetBridge.push(), 300000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) window.WidgetBridge.push(); });
})();
