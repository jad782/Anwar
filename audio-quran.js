// =======================================================
//  audio-quran.js — المتابعة الصوتية بالتظليل + وضع الحفظ (تسميع)
//  صوت آية-آية من cdn.islamic.network (الشيخ مشاري العفاسي)
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang)||localStorage.getItem('lang')||'ar'; }
function tr(a,e){ return L()==='en'?e:a; }
const QD = ()=>window.QURAN_DATA;
const AUDIO = g => 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/'+g+'.mp3';
function globalOf(surah, ayah){ const a=QD()&&QD().ayahs.find(x=>x.s===surah && x.a===ayah); return a?a.g:null; }
function surahCount(n){ const c=QD()&&QD().ayahs.filter(x=>x.s===n).length; return c||7; }
function surahName(n){ const s=QD()&&QD().surahs[n-1]; return s?s.name:('سورة '+n); }
function ayahText(surah, ayah){ const a=QD()&&QD().ayahs.find(x=>x.s===surah&&x.a===ayah); return a?a.t:''; }

// ============ (1) المتابعة الصوتية بالتظليل (داخل قارئ الصفحة) ============
window.AnwarFollow = {
    _audio:null, _seq:[], _i:0, _on:false,
    toggle:function(){ if(this._on) this.stop(); else this.start(); },
    start:function(){
        const els=[].slice.call(document.querySelectorAll('#ayahs-container .ayah'));
        this._seq=els.map(el=>({el, g:el.getAttribute('data-global')})).filter(x=>x.g);
        if(!this._seq.length) return;
        this._i=0; this._on=true;
        if(!this._audio){ this._audio=new Audio();
            this._audio.onended=()=>{ if(!AnwarFollow._on) return; AnwarFollow._i++; (AnwarFollow._i<AnwarFollow._seq.length)?AnwarFollow._play():AnwarFollow.stop(); };
            this._audio.onerror=()=>{ if(!AnwarFollow._on) return; AnwarFollow._i++; (AnwarFollow._i<AnwarFollow._seq.length)?AnwarFollow._play():AnwarFollow.stop(); };
        }
        this._setBtn(true); this._play();
    },
    _play:function(){
        this._clear(); const it=this._seq[this._i]; if(!it) return;
        it.el.classList.add('ayah-playing');
        try{ it.el.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){}
        this._audio.src=AUDIO(it.g); this._audio.play().catch(()=>{});
    },
    _clear:function(){ document.querySelectorAll('.ayah-playing').forEach(e=>e.classList.remove('ayah-playing')); },
    stop:function(){ this._on=false; try{ this._audio&&this._audio.pause(); }catch(e){} this._clear(); this._setBtn(false); },
    _setBtn:function(on){ const b=$('msf-listen-btn'); if(!b) return; b.classList.toggle('active',on);
        const s=b.querySelector('span'); if(s) s.textContent = on?tr('إيقاف','Stop'):tr('سماع','Listen');
        const ic=b.querySelector('i'); if(ic) ic.className = on?'fa-solid fa-stop':'fa-solid fa-headphones'; }
};

// ============ (2) وضع الحفظ (تسميع) — بريميوم ============
window.AnwarHifz = {
    _audio:null, _surah:1, _from:1, _to:1, _rep:3, _curRep:0, _cur:1, _playing:false, _hide:false,
    open:function(){
        if(window.requirePremium && !requirePremium('وضع الحفظ','Memorization mode')) return;
        this._surah=1; this._from=1; this._to=Math.min(5,surahCount(1)); this._cur=this._from; this._curRep=0; this._playing=false;
        this._build(); $('hifz-overlay').classList.add('active'); this._render();
    },
    _build:function(){
        if($('hifz-overlay')) return;
        const o=document.createElement('div'); o.id='hifz-overlay'; o.className='hifz-overlay';
        o.innerHTML=`<div class="hifz-inner">
            <button class="hifz-close" onclick="AnwarHifz.close()"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="hifz-title"><i class="fa-solid fa-brain"></i> ${tr('وضع الحفظ','Memorization')}</h2>
            <div class="hifz-controls" id="hifz-controls"></div>
            <div class="hifz-stage" id="hifz-stage"></div>
            <div class="hifz-transport" id="hifz-transport"></div>
        </div>`;
        document.body.appendChild(o);
        if(!this._audio){ this._audio=new Audio();
            this._audio.onended=()=>AnwarHifz._onEnded();
            this._audio.onerror=()=>AnwarHifz._onEnded();
        }
    },
    _render:function(){
        const cnt=surahCount(this._surah);
        if(this._to>cnt) this._to=cnt; if(this._from>this._to) this._from=this._to;
        const surahOpts=Array.from({length:114},(_,i)=>`<option value="${i+1}" ${this._surah===i+1?'selected':''}>${surahName(i+1)}</option>`).join('');
        const fromOpts=Array.from({length:cnt},(_,i)=>`<option value="${i+1}" ${this._from===i+1?'selected':''}>${i+1}</option>`).join('');
        const toOpts=Array.from({length:cnt},(_,i)=>`<option value="${i+1}" ${this._to===i+1?'selected':''}>${i+1}</option>`).join('');
        const reps=[3,5,7,10,0];
        const repBtns=reps.map(r=>`<button class="hifz-rep ${this._rep===r?'on':''}" onclick="AnwarHifz.setRep(${r})">${r===0?'∞':r}</button>`).join('');
        $('hifz-controls').innerHTML=`
            <div class="hifz-row"><label>${tr('السورة','Surah')}</label><select onchange="AnwarHifz.setSurah(this.value)">${surahOpts}</select></div>
            <div class="hifz-row2">
                <div><label>${tr('من آية','From')}</label><select onchange="AnwarHifz.setFrom(this.value)">${fromOpts}</select></div>
                <div><label>${tr('إلى آية','To')}</label><select onchange="AnwarHifz.setTo(this.value)">${toOpts}</select></div>
            </div>
            <div class="hifz-row"><label>${tr('التكرار لكل آية','Repeat each')}</label><div class="hifz-reps">${repBtns}</div></div>
            <div class="hifz-row hifz-toggle" onclick="AnwarHifz.toggleHide()"><label>${tr('إخفاء النص (تسميع)','Hide text (test)')}</label><span class="hifz-sw ${this._hide?'on':''}"></span></div>`;
        this._renderStage();
        $('hifz-transport').innerHTML=`
            <button class="hifz-tbtn" onclick="AnwarHifz.prev()"><i class="fa-solid fa-backward-step"></i></button>
            <button class="hifz-play" onclick="AnwarHifz.playPause()"><i class="fa-solid ${this._playing?'fa-pause':'fa-play'}"></i></button>
            <button class="hifz-tbtn" onclick="AnwarHifz.next()"><i class="fa-solid fa-forward-step"></i></button>`;
    },
    _renderStage:function(){
        const t=ayahText(this._surah,this._cur);
        $('hifz-stage').innerHTML=`<div class="hifz-ayah ${this._hide?'blurred':''}">${t}</div>
            <div class="hifz-meta">${surahName(this._surah)} · ${tr('آية','Ayah')} ${this._cur} ${this._rep?`· ${tr('تكرار','rep')} ${this._curRep+1}/${this._rep}`:''}</div>`;
    },
    setSurah:function(v){ this._surah=+v; this._from=1; this._to=Math.min(5,surahCount(this._surah)); this._cur=1; this._curRep=0; this._render(); },
    setFrom:function(v){ this._from=+v; if(this._to<this._from)this._to=this._from; this._cur=this._from; this._curRep=0; this._render(); },
    setTo:function(v){ this._to=+v; if(this._from>this._to)this._from=this._to; this._render(); },
    setRep:function(r){ this._rep=r; this._curRep=0; this._render(); if(window.HAP)HAP.light(); },
    toggleHide:function(){ this._hide=!this._hide; this._render(); if(window.HAP)HAP.light(); },
    playPause:function(){ if(this._playing){ this._pause(); } else { this._play(); } },
    _play:function(){ this._playing=true; const g=globalOf(this._surah,this._cur); if(!g){ this._playing=false; return; }
        this._audio.src=AUDIO(g); this._audio.play().catch(()=>{}); this._render(); },
    _pause:function(){ this._playing=false; try{ this._audio.pause(); }catch(e){} this._render(); },
    _onEnded:function(){
        if(!this._playing) return;
        // كرّر الآية حسب العدد ثم انتقل
        if(this._rep===0 || this._curRep < this._rep-1){ this._curRep++; this._play(); return; }
        this._curRep=0;
        if(this._cur < this._to){ this._cur++; this._play(); }
        else { this._cur=this._from; this._play(); } // أعد المقطع كاملاً
    },
    prev:function(){ this._curRep=0; if(this._cur>this._from)this._cur--; if(this._playing)this._play(); else this._render(); },
    next:function(){ this._curRep=0; if(this._cur<this._to)this._cur++; if(this._playing)this._play(); else this._render(); },
    close:function(){ this._pause(); const o=$('hifz-overlay'); if(o)o.classList.remove('active'); }
};
})();
