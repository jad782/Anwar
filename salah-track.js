// =======================================================
//  salah-track.js — تتبّع الصلوات الخمس + سلسلة الالتزام (streak)
//  بطاقة على الرئيسية: علّم كل صلاة صليتها، مع سلسلة الأيام الكاملة.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang)||localStorage.getItem('lang')||'ar'; }
function tr(a,e){ return L()==='en'?e:a; }
const PRAYERS = [
    {k:'Fajr',   ar:'الفجر',  en:'Fajr',   ico:'fa-cloud-moon'},
    {k:'Dhuhr',  ar:'الظهر',  en:'Dhuhr',  ico:'fa-sun'},
    {k:'Asr',    ar:'العصر',  en:'Asr',    ico:'fa-cloud-sun'},
    {k:'Maghrib',ar:'المغرب', en:'Maghrib',ico:'fa-cloud-sun-rain'},
    {k:'Isha',   ar:'العشاء', en:'Isha',   ico:'fa-moon'}
];
function today(){ return new Date().toISOString().slice(0,10); }
function loadLog(){ try{ return JSON.parse(localStorage.getItem('salah_log')||'{}'); }catch(e){ return {}; } }
function saveLog(l){ localStorage.setItem('salah_log', JSON.stringify(l)); }
function dayDone(d){ return d && PRAYERS.every(p=>d[p.k]); }
function streak(){
    const log=loadLog(); let s=0; const dt=new Date();
    // إذا لم تكتمل صلوات اليوم بعد، لا نكسر السلسلة — نبدأ العدّ من الأمس
    if(!dayDone(log[today()])) dt.setDate(dt.getDate()-1);
    for(;;){ const key=dt.toISOString().slice(0,10); if(dayDone(log[key])){ s++; dt.setDate(dt.getDate()-1); } else break; }
    return s;
}

window.SalahTrack = {
    toggle:function(k){
        const log=loadLog(); const t=today(); log[t]=log[t]||{};
        log[t][k]=!log[t][k]; saveLog(log);
        if(window.HAP){ if(log[t][k]) HAP.light(); }
        const wasComplete = dayDone(log[t]);
        SalahTrack.render();
        if(wasComplete && window.HAP) HAP.success();
    },
    render:function(){
        const card=$('salah-track-card'); if(!card) return;
        const log=loadLog(); const t=today(); const d=log[t]||{};
        const done=PRAYERS.filter(p=>d[p.k]).length;
        const cells=PRAYERS.map(p=>`<button class="st-cell ${d[p.k]?'on':''}" onclick="SalahTrack.toggle('${p.k}')">
            <span class="st-ico"><i class="fa-solid ${p.ico}"></i></span>
            <span class="st-name">${L()==='en'?p.en:p.ar}</span>
            <span class="st-check">${d[p.k]?'<i class="fa-solid fa-check"></i>':''}</span></button>`).join('');
        const s=streak();
        card.innerHTML=`<div class="st-head">
                <h3><i class="fa-solid fa-list-check"></i> ${tr('التزامي بالصلاة','My Prayers')}</h3>
                <span class="st-streak"><i class="fa-solid fa-fire"></i> ${s} ${tr('يوم','d')}</span>
            </div>
            <div class="st-grid">${cells}</div>
            <div class="st-bar"><div class="st-fill" style="width:${done/5*100}%"></div></div>
            <div class="st-foot">${done===5?tr('اكتملت صلوات اليوم — تقبّل الله 🤍','All prayers complete — may Allah accept 🤍'):tr(`${done} من 5 اليوم`,`${done} of 5 today`)}</div>`;
    }
};

function inject(){
    if($('salah-track-card')) return;
    const grid=document.querySelector('#tab-home .prayer-grid');
    const anchor = $('makruh-card') || grid;
    if(!anchor || !anchor.parentNode) return;
    const c=document.createElement('div'); c.id='salah-track-card'; c.className='salah-track-card';
    // بعد بطاقة الكراهة (أو شبكة الصلاة)
    anchor.parentNode.insertBefore(c, anchor.nextSibling);
    SalahTrack.render();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject,900));
else setTimeout(inject,900);
})();
