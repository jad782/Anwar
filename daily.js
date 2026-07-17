// =======================================================
//  daily.js — متابعة القراءة + وردك اليومي (بطاقة على الرئيسية)
//  • تابع القراءة من آخر موضع (last_read).
//  • ورد يومي بلطف: يسجّل الأيام التي قرأت فيها ويعرض سلسلة متتالية (بلا نقاط).
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function today(){ return new Date().toISOString().slice(0,10); }
function toAr(n){ try{ if(window.fmtDigits) return fmtDigits(n); }catch(e){} return (localStorage.getItem('num_hindi')==='0')?String(n):String(n).replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]); }

function lastRead(){ try{ return JSON.parse(localStorage.getItem('last_read')||'null'); }catch(e){ return null; } }
function wirdDays(){ try{ return JSON.parse(localStorage.getItem('wird_days')||'[]'); }catch(e){ return []; } }
function saveWird(a){ localStorage.setItem('wird_days', JSON.stringify(a.slice(-400))); }

function streak(){ const d=wirdDays(); if(!d.length) return 0;
    const set={}; d.forEach(x=>set[x]=1); let s=0; const dt=new Date();
    if(!set[dt.toISOString().slice(0,10)]) dt.setDate(dt.getDate()-1); // اليوم أو أمس بداية السلسلة
    for(;;){ const k=dt.toISOString().slice(0,10); if(set[k]){ s++; dt.setDate(dt.getDate()-1); } else break; }
    return s;
}

window.AnwarDaily = {
    // تُستدعى عند قراءة صفحة من المصحف
    markRead:function(){ const d=wirdDays(); const t=today(); if(d.indexOf(t)<0){ d.push(t); saveWird(d); this.render(); } },
    resume:function(){
        const lr=lastRead();
        try{ if(typeof goToTab==='function') goToTab(1); }catch(e){}
        try{
            if(lr && window.MUSHAF){
                if(lr.type==='page' && MUSHAF.openPage) MUSHAF.openPage(parseInt(lr.num)||1);
                else if(lr.type==='surah' && MUSHAF.openSurah) MUSHAF.openSurah(parseInt(lr.num)||1);
                else if(MUSHAF.openPage) MUSHAF.openPage(1);
            } else if(window.MUSHAF && MUSHAF.openPage){ MUSHAF.openPage(1); }
        }catch(e){}
        if(window.HAP)HAP.light();
    },
    render:function(){
        const host=$('daily-card-host'); if(!host) return;
        const lr=lastRead(); const st=streak(); const doneToday = wirdDays().indexOf(today())>=0;
        const title = lr ? tr('تابع القراءة','Continue reading') : tr('ابدأ وردك اليوم','Start today\'s reading');
        const sub = lr ? (lr.name||('صفحة '+toAr(lr.num||1))) + (lr.type==='page'?(' · '+tr('صفحة','p.')+' '+toAr(lr.num)):'')
                       : tr('افتح المصحف واقرأ ما تيسّر','Open the Mushaf and read');
        const streakChip = st>0
            ? `<div class="dc-streak ${doneToday?'done':''}"><span class="dc-fire">🔥</span><b>${toAr(st)}</b><small>${tr('ورد','wird')}</small></div>`
            : `<div class="dc-streak"><i class="fa-solid fa-book-quran"></i></div>`;
        host.innerHTML = `<div class="daily-card" onclick="AnwarDaily.resume()">
            <div class="dc-ico"><i class="fa-solid fa-book-open-reader"></i></div>
            <div class="dc-body"><b>${title}</b><span>${sub}</span>
                ${doneToday?`<span class="dc-today"><i class="fa-solid fa-circle-check"></i> ${tr('قرأت وردك اليوم — أحسنت 🤍','Today\'s wird done 🤍')}</span>`
                           :`<span class="dc-today off">${tr('لم تقرأ وردك اليوم بعد','Today\'s wird not read yet')}</span>`}
            </div>
            ${streakChip}
            <i class="fa-solid fa-chevron-left dc-go"></i></div>`;
    }
};

function inject(){
    const home=$('tab-home'); if(!home || $('daily-card-host')) return;
    // بعد اختصار الأذكار إن وُجد، وإلا بعد آية اليوم/شبكة الصلاة
    const anchor = $('athkar-shortcut') || home.querySelector('#ayah-of-day-card') || home.querySelector('.prayer-grid') || home.querySelector('.hero-section');
    if(!anchor) return;
    const h=document.createElement('div'); h.id='daily-card-host'; anchor.insertAdjacentElement('afterend', h);
    AnwarDaily.render();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject,1000));
else setTimeout(inject,1000);
})();
