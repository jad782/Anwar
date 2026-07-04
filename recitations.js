// =======================================================
//  recitations.js — مكتبة تلاوات كاملة بلا نت (Premium)
//  تحميل سور كاملة بأصوات القرّاء للاستماع أوفلاين (تخزين IndexedDB).
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function sN(n){ try{ return surahName(n); }catch(e){ return 'سورة '+n; } }

// قرّاء (ملفات سور كاملة من mp3quran)
const RECITERS = [
    { id:'afs',   ar:'مشاري العفاسي',   base:'https://server8.mp3quran.net/afs/' },
    { id:'sds',   ar:'عبد الرحمن السديس',base:'https://server11.mp3quran.net/sds/' },
    { id:'maher', ar:'ماهر المعيقلي',    base:'https://server12.mp3quran.net/maher/' },
    { id:'s_gmd', ar:'سعد الغامدي',      base:'https://server7.mp3quran.net/s_gmd/' },
    { id:'shur',  ar:'سعود الشريم',      base:'https://server7.mp3quran.net/shur/' },
    { id:'islam', ar:'إسلام صبحي',       base:'https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/' },
];
let curRec = localStorage.getItem('recite_lib_reciter') || 'afs';
const audio = new Audio(); let playingKey = null;

function pad3(n){ return String(n).padStart(3,'0'); }
function urlOf(recId, surah){ const r=RECITERS.find(x=>x.id===recId); return r ? r.base+pad3(surah)+'.mp3' : ''; }
function dlKey(){ return 'recite_dl_'+curRec; }
function loadDl(){ try{ return JSON.parse(localStorage.getItem(dlKey())||'[]'); }catch(e){ return []; } }
function saveDl(a){ localStorage.setItem(dlKey(), JSON.stringify(a)); }

window.AnwarRecite = {
    open:function(){
        if(window.requirePremium && !requirePremium('مكتبة التلاوات بلا نت','Offline recitations library')) return;
        let m=$('recite-modal');
        if(!m){ m=document.createElement('div'); m.id='recite-modal'; m.className='qibla-overlay';
            m.innerHTML=`<div class="qibla-modal" style="width:95%;max-width:460px;text-align:right;max-height:90vh;overflow-y:auto;">
                <button class="close-qibla" onclick="AnwarRecite.stop();document.getElementById('recite-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                <h2 style="color:var(--accent-color);text-align:center;margin-bottom:6px;"><i class="fa-solid fa-headphones"></i> ${tr('مكتبة التلاوات','Recitations')}</h2>
                <p style="text-align:center;color:var(--text-muted);font-size:0.78rem;margin-bottom:12px;">${tr('حمّل السور للاستماع بدون إنترنت','Download surahs for offline listening')}</p>
                <select id="rec-reciter" class="modal-input" onchange="AnwarRecite.changeReciter()"></select>
                <div id="rec-list" class="rec-list"></div></div>`;
            document.body.appendChild(m);
        }
        AnwarRecite.render(); m.classList.add('active');
    },
    changeReciter:function(){ curRec=$('rec-reciter').value; localStorage.setItem('recite_lib_reciter',curRec); AnwarRecite.stop(); AnwarRecite.render(); },
    render:function(){
        const sel=$('rec-reciter'); if(sel) sel.innerHTML = RECITERS.map(r=>`<option value="${r.id}" ${r.id===curRec?'selected':''}>${r.ar}</option>`).join('');
        const dl=loadDl(); const list=$('rec-list'); if(!list) return;
        let html='';
        for(let s=1;s<=114;s++){
            const done = dl.includes(s);
            const playing = playingKey===(curRec+'_'+s);
            html+=`<div class="rec-item">
                <span class="rec-num">${s}</span>
                <span class="rec-name">${sN(s)}</span>
                <button class="rec-btn play" onclick="AnwarRecite.play(${s})">${playing?'<i class="fa-solid fa-pause"></i>':'<i class="fa-solid fa-play"></i>'}</button>
                <button class="rec-btn dl ${done?'done':''}" id="rdl-${s}" onclick="AnwarRecite.download(${s})">${done?'<i class="fa-solid fa-check"></i>':'<i class="fa-solid fa-download"></i>'}</button>
            </div>`;
        }
        list.innerHTML=html;
    },
    download:async function(s){
        const btn=$('rdl-'+s); if(btn) btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';
        const url=urlOf(curRec,s);
        try{
            if(window.PRO && PRO.cacheAudio){ await PRO.cacheAudio(url); const dl=loadDl(); if(!dl.includes(s)){ dl.push(s); saveDl(dl); } if(window.HAP)HAP.success(); }
            else throw new Error('no cache');
        }catch(e){ alert(tr('تعذّر التحميل، تأكد من الإنترنت.','Download failed, check internet.')); }
        AnwarRecite.render();
    },
    play:async function(s){
        const key=curRec+'_'+s;
        if(playingKey===key && !audio.paused){ audio.pause(); playingKey=null; AnwarRecite.render(); return; }
        const url=urlOf(curRec,s); let src=url;
        try{ if(window.PRO && PRO.getCachedAudio){ const b=await PRO.getCachedAudio(url); if(b) src=b; } }catch(e){}
        audio.src=src; playingKey=key;
        audio.play().catch(()=>{ alert(tr('تعذّر التشغيل. حمّل السورة أو تأكد من الإنترنت.','Playback failed. Download it or check internet.')); playingKey=null; AnwarRecite.render(); });
        audio.onended=()=>{ playingKey=null; AnwarRecite.render(); };
        AnwarRecite.render();
    },
    stop:function(){ try{ audio.pause(); }catch(e){} playingKey=null; }
};
})();
