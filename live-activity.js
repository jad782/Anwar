// =======================================================
//  live-activity.js — جسر الويب لـ Live Activity / Dynamic Island
//  يعمل فقط داخل تطبيق iOS الأصلي (بعد إضافة الهدف). على الويب: no-op آمن.
// =======================================================
(function(){
'use strict';
function plugin(){ return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LiveActivity) || null; }
window.LiveActivity = {
    startPrayer: function(name, targetEpochSeconds){
        const p = plugin(); if(!p) return; try{ p.start({ kind:'prayer', prayerName:name, targetEpoch:targetEpochSeconds }); }catch(e){}
    },
    startRecite: function(surahName, ayah, reciter){
        const p = plugin(); if(!p) return; try{ p.start({ kind:'recite', surahName, ayah:ayah||1, reciter:reciter||'' }); }catch(e){}
    },
    update: function(data){ const p=plugin(); if(!p) return; try{ p.update(data||{}); }catch(e){} },
    end: function(){ const p=plugin(); if(!p) return; try{ p.end(); }catch(e){} }
};
// ربط تلقائي: عند بدء عدّاد الصلاة القادمة، أظهر النشاط الحيّ (داخل iOS فقط)
let _lastPrayer = '';
setInterval(()=>{
    if (!plugin()) return;
    try {
        if (typeof prayerTimings==='undefined' || !prayerTimings.Fajr) return;
        const order=[['Fajr','الفجر'],['Dhuhr','الظهر'],['Asr','العصر'],['Maghrib','المغرب'],['Isha','العشاء']];
        const now=new Date(); const cur=now.getHours()*60+now.getMinutes();
        let next=null; for(const [k,ar] of order){ const [h,m]=prayerTimings[k].split(':').map(Number); if(cur<h*60+m){ next=[k,ar,h,m]; break; } }
        if(!next){ const [h,m]=prayerTimings.Fajr.split(':').map(Number); next=['Fajr','الفجر',h,m]; }
        if(next[1]!==_lastPrayer){ _lastPrayer=next[1]; const t=new Date(); t.setHours(next[2],next[3],0,0); if(t<now) t.setDate(t.getDate()+1); window.LiveActivity.startPrayer(next[1], Math.floor(t.getTime()/1000)); }
    } catch(e){}
}, 30000);
})();
