// =======================================================
//  premium-features.js — ميزات مميّزة إضافية (Premium)
//  أسماء الله الحسنى · رفيق رمضان · صانع الثيمات · الوضع التأمّلي · لوحات فنية
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function gate(ar,en){ return !(window.requirePremium) || requirePremium(ar,en); }
function modal(id, title, icon, bodyHtml){
    let m=$(id);
    if(!m){ m=document.createElement('div'); m.id=id; m.className='qibla-overlay';
        m.innerHTML=`<div class="qibla-modal" style="width:95%;max-width:460px;text-align:right;max-height:90vh;overflow-y:auto;">
            <button class="close-qibla" onclick="document.getElementById('${id}').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
            <h2 style="color:var(--accent-color);text-align:center;margin-bottom:12px;"><i class="fa-solid ${icon}"></i> ${title}</h2>
            <div id="${id}-body"></div></div>`;
        document.body.appendChild(m);
    }
    $(id+'-body').innerHTML = bodyHtml; m.classList.add('active'); return m;
}

// ===== (10) أسماء الله الحسنى =====
const NAMES = [
'الرحمن|الرحيم|الملك|القدوس|السلام|المؤمن|المهيمن|العزيز|الجبار|المتكبر',
'الخالق|البارئ|المصور|الغفار|القهار|الوهاب|الرزاق|الفتاح|العليم|القابض',
'الباسط|الخافض|الرافع|المعز|المذل|السميع|البصير|الحكم|العدل|اللطيف',
'الخبير|الحليم|العظيم|الغفور|الشكور|العلي|الكبير|الحفيظ|المقيت|الحسيب',
'الجليل|الكريم|الرقيب|المجيب|الواسع|الحكيم|الودود|المجيد|الباعث|الشهيد',
'الحق|الوكيل|القوي|المتين|الولي|الحميد|المحصي|المبدئ|المعيد|المحيي',
'المميت|الحي|القيوم|الواجد|الماجد|الواحد|الأحد|الصمد|القادر|المقتدر',
'المقدم|المؤخر|الأول|الآخر|الظاهر|الباطن|الوالي|المتعالي|البر|التواب',
'المنتقم|العفو|الرؤوف|مالك الملك|ذو الجلال والإكرام|المقسط|الجامع|الغني|المغني|المانع',
'الضار|النافع|النور|الهادي|البديع|الباقي|الوارث|الرشيد|الصبور'
].join('|').split('|');
window.AnwarNames = { open:function(){ if(!gate('أسماء الله الحسنى','99 Names')) return;
    const cards = NAMES.map((n,i)=>`<div class="name-card"><span class="nc-num">${i+1}</span><span class="nc-name">${n}</span></div>`).join('');
    const m = modal('names-modal', tr('أسماء الله الحسنى','99 Names of Allah'), 'fa-hands-praying',
        `<p style="text-align:center;color:var(--text-muted);font-size:0.8rem;margin-bottom:14px;">${tr('«إنّ لله تسعةً وتسعين اسماً، مَن أحصاها دخل الجنّة» (متفق عليه)','“Allah has 99 names; whoever preserves them enters Paradise.”')}</p><div class="names-grid">${cards}</div>`);
}};

// ===== حزمة التخصيص الكاملة (حصري للمشترك — خطوط/ثيمات/خلفيات لا توجد مجاناً) =====
window.AnwarLuxe = {
    open:function(){ if(!gate('حزمة التخصيص','Customization pack')) return; AnwarLuxe._render(); },
    _render:function(){
        var font=localStorage.getItem('quran_font')||'', theme=localStorage.getItem('anwar_theme')||'', rbg=localStorage.getItem('anwar_readbg')||'';
        var fonts=[['','افتراضي','Default'],['naskh','نسخ','Naskh'],['othmani','عثماني فخم','Othmani']];
        var themes=[['','بلا','None'],['theme_royal','ذهبي ملكي','Royal'],['theme_emerald','أخضر زمردي','Emerald'],['theme_night','أزرق ليلي','Night'],['theme_rose','وردي هادئ','Rose']];
        var rbgs=[['','بلا','None'],['readbg_royal','ورق ملكي','Royal paper'],['readbg_night','ليل مرصّع','Starry']];
        function chip(cur,row,fn){ return '<button class="luxe-chip '+(cur===row[0]?'on':'')+'" onclick="AnwarLuxe.'+fn+'(\''+row[0]+'\')">'+(L()==='en'?row[2]:row[1])+'</button>'; }
        var body='<p class="luxe-sub"><i class="fa-solid fa-crown"></i> '+tr('حصري للمشتركين — مفتوح بالكامل بلا نقاط','Exclusive to members — fully unlocked')+'</p>'
            +'<div class="luxe-sec"><h4>'+tr('خط المصحف','Mushaf font')+'</h4><div class="luxe-row">'+fonts.map(function(f){return chip(font,f,'setFont');}).join('')+'</div></div>'
            +'<div class="luxe-sec"><h4>'+tr('ثيم التطبيق الفاخر','Luxury app theme')+'</h4><div class="luxe-row">'+themes.map(function(t){return chip(theme,t,'setTheme');}).join('')+'</div></div>'
            +'<div class="luxe-sec"><h4>'+tr('خلفية القراءة','Reading background')+'</h4><div class="luxe-row">'+rbgs.map(function(r){return chip(rbg,r,'setRbg');}).join('')+'</div></div>';
        modal('luxe-modal', tr('حزمة التخصيص الكاملة','Full Customization'), 'fa-palette', body);
    },
    setFont:function(v){ localStorage.setItem('quran_font',v); AnwarLuxe._apply(); },
    setTheme:function(v){ localStorage.setItem('anwar_theme',v); AnwarLuxe._apply(); },
    setRbg:function(v){ localStorage.setItem('anwar_readbg',v); AnwarLuxe._apply(); },
    _apply:function(){ try{ window.applyAnwarVisual&&applyAnwarVisual(); }catch(e){} if(window.HAP)HAP.light(); AnwarLuxe._render(); }
};

// ===== (11) رفيق رمضان الكامل =====
function pt(){ try{ return (typeof prayerTimings!=='undefined')?prayerTimings:null; }catch(e){ return null; } }
function hm2min(s){ if(!s||(''+s).indexOf(':')<0) return null; var p=(''+s).split(':'); return (+p[0])*60+(+p[1]); }
function pad2(n){ return (n<10?'0':'')+n; }
const RAM_DUAS = [
    {t:'نية الصيام', d:'وَبِصَوْمِ غَدٍ نَوَيْتُ مِنْ شَهْرِ رَمَضَان'},
    {t:'دعاء الإفطار', d:'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّه'},
    {t:'دعاء ليلة القدر', d:'اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي'}
];
const RAM_DEEDS = ['صلاة التراويح','ورد القرآن اليومي','صدقة اليوم','قيام الليل','إفطار صائم'];
function ramDays(){ try{ return JSON.parse(localStorage.getItem('ram_days')||'[]'); }catch(e){ return []; } }
window.AnwarRamadan = {
    _iv:null,
    open:function(){ if(!gate('رفيق رمضان','Ramadan companion')) return;
        modal('ramadan-modal', tr('رفيق رمضان','Ramadan Companion'), 'fa-star-and-crescent', this._body());
        this._startCountdown();
    },
    _body:function(){
        const p=pt(); const fajr=p?p.Fajr:'--:--', maghrib=p?p.Maghrib:'--:--';
        let imsak='--:--'; const fm=hm2min(fajr); if(fm!=null){ const im=fm-10; imsak=pad2(Math.floor(im/60))+':'+pad2(im%60); }
        const days=ramDays(); const grid=Array.from({length:30},(_,i)=>{ const n=i+1; const on=days.indexOf(n)>=0;
            return `<button class="ram-day ${on?'on':''}" onclick="AnwarRamadan.toggleDay(${n})">${n}</button>`; }).join('');
        const duas=RAM_DUAS.map(x=>`<div class="ram-dua"><span class="ram-dua-t">${x.t}</span><p>${x.d}</p></div>`).join('');
        const deeds=RAM_DEEDS.map((d,i)=>{ const done=localStorage.getItem('ram_deed_'+i)==='1';
            return `<div class="ch-task ${done?'done':''}" onclick="AnwarRamadan.deed(${i})"><span class="ch-ico"><i class="fa-solid fa-star"></i></span><span class="ch-name">${d}</span><span class="ch-pts">${done?'<i class="fa-solid fa-check"></i>':'✓'}</span></div>`; }).join('');
        return `
        <div class="ram-count-card"><span class="ram-next" id="ram-next">${tr('جارٍ الحساب…','Calculating…')}</span>
            <b class="ram-timer" id="ram-timer">--:--:--</b></div>
        <div class="ram-times">
            <div class="ram-t"><span>${tr('الإمساك','Imsak')}</span><b>${imsak}</b></div>
            <div class="ram-t"><span>${tr('السحور (الفجر)','Suhoor')}</span><b>${fajr}</b></div>
            <div class="ram-t iftar"><span>${tr('الإفطار','Iftar')}</span><b>${maghrib}</b></div>
        </div>
        <div class="pts-sec-title">${tr('صيامك هذا الشهر','Your fasting this month')} <span id="ram-dcount" style="color:var(--accent-color)">(${days.length}/30)</span></div>
        <div class="ram-grid">${grid}</div>
        <div class="pts-sec-title">${tr('أعمال اليوم','Daily deeds')}</div>
        ${deeds}
        <div class="pts-sec-title">${tr('أدعية رمضان','Ramadan duas')}</div>
        ${duas}
        <p style="text-align:center;color:var(--text-muted);font-size:0.72rem;margin-top:12px;">${tr('الأوقات محسوبة من إعدادات صلاتك · العشر الأواخر: أكثِر من دعاء ليلة القدر 🤍','Times from your prayer settings · Last 10 nights: recite the Laylat al-Qadr dua 🤍')}</p>`;
    },
    _startCountdown:function(){
        clearInterval(this._iv);
        const upd=()=>{
            const m=$('ramadan-modal'); if(!m||!m.classList.contains('active')){ clearInterval(AnwarRamadan._iv); return; }
            const p=pt(); const nx=$('ram-next'), tm=$('ram-timer'); if(!nx||!tm) return;
            const fm=hm2min(p?p.Fajr:null), mm=hm2min(p?p.Maghrib:null);
            if(fm==null||mm==null){ nx.textContent=tr('فعّل أوقات الصلاة','Enable prayer times'); tm.textContent='--:--:--'; return; }
            const now=new Date(); const cur=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
            let label, target;
            if(cur < fm){ label=tr('باقٍ على الإمساك','Until Imsak'); target=fm; }
            else if(cur < mm){ label=tr('باقٍ على الإفطار','Until Iftar'); target=mm; }
            else { label=tr('باقٍ على السحور','Until Suhoor'); target=fm+1440; }
            let rem=Math.max(0,(target-cur)*60); // ثوانٍ
            const h=Math.floor(rem/3600), mn=Math.floor((rem%3600)/60), s=Math.floor(rem%60);
            nx.textContent=label; tm.textContent=pad2(h)+':'+pad2(mn)+':'+pad2(s);
        };
        upd(); this._iv=setInterval(upd,1000);
    },
    toggleDay:function(n){ let d=ramDays(); const i=d.indexOf(n); if(i>=0)d.splice(i,1); else d.push(n);
        localStorage.setItem('ram_days',JSON.stringify(d)); if(window.HAP)HAP.light();
        const btn=event&&event.target; if(btn)btn.classList.toggle('on');
        const c=$('ram-dcount'); if(c)c.textContent='('+d.length+'/30)'; },
    deed:function(i){ const k='ram_deed_'+i; localStorage.setItem(k, localStorage.getItem(k)==='1'?'0':'1'); if(window.HAP)HAP.light(); AnwarRamadan.open(); }
};

// ===== (12) صانع الثيمات الشخصي =====
window.AnwarThemeMaker = { open:function(){ if(!gate('صانع الثيمات','Theme maker')) return;
    const c1=localStorage.getItem('custom_c1')||'#D4A843', c2=localStorage.getItem('custom_c2')||'#F2D27A';
    const body = `<p style="text-align:center;color:var(--text-muted);font-size:0.82rem;margin-bottom:16px;">${tr('اختر لونين ويتناسق التطبيق كله معك.','Pick two colors; the whole app adapts.')}</p>
        <div class="tm-row"><span>${tr('اللون الأساسي','Primary')}</span><input type="color" id="tm-c1" value="${c1}"></div>
        <div class="tm-row"><span>${tr('اللون الفاتح','Highlight')}</span><input type="color" id="tm-c2" value="${c2}"></div>
        <div class="tm-preview" id="tm-preview"></div>
        <button class="tasbeeh-pill" style="width:100%;margin-top:14px;" onclick="AnwarThemeMaker.apply()"><i class="fa-solid fa-check"></i> ${tr('تطبيق الثيم','Apply theme')}</button>
        <button class="prem-restore" onclick="AnwarThemeMaker.reset()">${tr('إلغاء الثيم المخصّص','Remove custom theme')}</button>`;
    modal('thememaker-modal', tr('صانع الثيمات','Theme Maker'), 'fa-wand-magic-sparkles', body);
    const upd=()=>{ const pv=$('tm-preview'); if(pv) pv.style.background=`linear-gradient(135deg, ${$('tm-c1').value}, ${$('tm-c2').value})`; };
    $('tm-c1').oninput=upd; $('tm-c2').oninput=upd; upd();
},
apply:function(){ const a=$('tm-c1').value, b=$('tm-c2').value; localStorage.setItem('custom_c1',a); localStorage.setItem('custom_c2',b); localStorage.setItem('custom_theme','1'); AnwarThemeMaker._apply(); if(window.HAP)HAP.success(); },
_apply:function(){ if(localStorage.getItem('custom_theme')==='1'){ const a=localStorage.getItem('custom_c1'), b=localStorage.getItem('custom_c2'); document.documentElement.style.setProperty('--accent-color',a); document.documentElement.style.setProperty('--accent-light',b); document.documentElement.style.setProperty('--primary-color',b); } },
reset:function(){ localStorage.setItem('custom_theme','0'); document.documentElement.style.removeProperty('--accent-color'); document.documentElement.style.removeProperty('--accent-light'); document.documentElement.style.removeProperty('--primary-color'); if(window.applyAppTheme)applyAppTheme(); const m=$('thememaker-modal'); if(m)m.classList.remove('active'); } };

// ===== (6) الوضع الليلي — رفيق قيام الليل الكامل =====
function pt2(){ try{ return (typeof prayerTimings!=='undefined')?prayerTimings:null; }catch(e){ return null; } }
function n2m(s){ if(!s||(''+s).indexOf(':')<0) return null; var w=(''+s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)); var p=w.split(':'); return (+p[0])*60+(+p[1]); }
function p2(n){ return (n<10?'0':'')+n; }
const NIGHT_WIRD=[ {n:'المُلك',s:67}, {n:'السجدة',s:32}, {n:'يس',s:36}, {n:'الواقعة',s:56}, {n:'الكهف',s:18} ];
const QIYAM_DUAS=[
    {t:'اللَّهُمَّ رَبَّ جِبْرِيلَ وَمِيكَائِيلَ وَإِسْرَافِيلَ، فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، أَنْتَ تَحْكُمُ بَيْنَ عِبَادِكَ فِيمَا كَانُوا فِيهِ يَخْتَلِفُونَ، اهْدِنِي لِمَا اخْتُلِفَ فِيهِ مِنَ الْحَقِّ بِإِذْنِكَ، إِنَّكَ تَهْدِي مَنْ تَشَاءُ إِلَى صِرَاطٍ مُسْتَقِيمٍ', r:'رواه مسلم — استفتاح قيام الليل'},
    {t:'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالْأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الْحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالْأَرْضِ وَمَنْ فِيهِنَّ، أَنْتَ الْحَقُّ، وَوَعْدُكَ الْحَقُّ، وَلِقَاؤُكَ حَقٌّ', r:'متفق عليه'},
    {t:'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ، إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', r:'أبو داود والترمذي'},
    {t:'اللَّهُمَّ إِنِّي أَعُوذُ بِرِضَاكَ مِنْ سَخَطِكَ، وَبِمُعَافَاتِكَ مِنْ عُقُوبَتِكَ، وَأَعُوذُ بِكَ مِنْكَ، لَا أُحْصِي ثَنَاءً عَلَيْكَ أَنْتَ كَمَا أَثْنَيْتَ عَلَى نَفْسِكَ', r:'رواه مسلم — بعد الوتر'},
    {t:'سُبْحَانَ الْمَلِكِ الْقُدُّوسِ (ثلاثاً، ويمدّ بالثالثة ويرفع بها صوته)', r:'أبو داود والنسائي — بعد الوتر'},
    {t:'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ — أكثِر منه في السحر', r:'﴿وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ﴾'}
];
const NIGHT_DHIKR=[ {t:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', max:100}, {t:'أَسْتَغْفِرُ اللَّهَ', max:100}, {t:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّد', max:100}, {t:'لَا إِلَهَ إِلَّا اللَّهُ', max:100} ];
function qiyamNights(){ try{ return JSON.parse(localStorage.getItem('qiyam_nights')||'[]'); }catch(e){ return []; } }
function qiyamStreak(){ const days=qiyamNights(); let s=0; const dt=new Date(); if(days.indexOf(dt.toISOString().slice(0,10))<0) dt.setDate(dt.getDate()-1);
    for(;;){ const k=dt.toISOString().slice(0,10); if(days.indexOf(k)>=0){ s++; dt.setDate(dt.getDate()-1); } else break; } return s; }

window.AnwarFocus = {
    _iv:null, _di:0, _dc:0, _audio:null,
    open:function(){ if(!gate('الوضع الليلي','Night mode')) return;
        let f=$('focus-mode');
        if(!f){ f=document.createElement('div'); f.id='focus-mode'; f.className='focus-overlay night';
            f.innerHTML=`<div class="focus-stars"></div><div class="focus-moon"></div>
                <button class="focus-close" onclick="AnwarFocus.close()"><i class="fa-solid fa-xmark"></i></button>
                <button class="focus-dockbtn night-sound" id="focus-sound" onclick="AnwarFocus.toggleSound()"><i class="fa-solid fa-volume-xmark"></i></button>
                <div class="night-scroll" id="night-scroll"></div>`;
            document.body.appendChild(f);
        }
        this._di=0; this._dc=0;
        f.classList.add('active');
        this._render(); this._startClock();
    },
    close:function(){ clearInterval(this._iv); this.stopSound(); const f=$('focus-mode'); if(f) f.classList.remove('active'); },
    _render:function(){
        const done=qiyamNights().indexOf(new Date().toISOString().slice(0,10))>=0;
        const wird=NIGHT_WIRD.map(w=>`<button class="night-wird" onclick="AnwarFocus.openSurah(${w.s})">${w.n}</button>`).join('');
        const duas=QIYAM_DUAS.map(d=>`<div class="night-dua"><p>${d.t}</p><span>${d.r}</span></div>`).join('');
        $('night-scroll').innerHTML=`
            <h2 class="night-title"><i class="fa-solid fa-moon"></i> ${tr('الوضع الليلي','Night Mode')}</h2>
            <div class="night-third" id="night-third"><span class="nt-label">${tr('جارٍ حساب الثلث الأخير…','Calculating…')}</span><b class="nt-timer" id="nt-timer">--:--:--</b><span class="nt-start" id="nt-start"></span></div>

            <div class="night-sec">${tr('وردك الليلي','Night Wird')}</div>
            <div class="night-wirds">${wird}</div>

            <div class="night-sec">${tr('مسبحة الليل','Night Tasbih')}</div>
            <div class="night-tasbeeh" onclick="AnwarFocus.tick()">
                <span id="focus-dhikr" class="nt-dhikr"></span>
                <span class="nt-count" id="focus-count">0</span>
                <span class="nt-hint">${tr('اضغط للعدّ','Tap to count')}</span>
            </div>

            <div class="night-actions">
                <button class="night-act" onclick="AnwarFocus.sleepAthkar()"><i class="fa-solid fa-bed"></i> ${tr('أذكار النوم','Sleep adhkar')}</button>
                <button class="night-act ${done?'on':''}" id="night-qiyam" onclick="AnwarFocus.toggleQiyam()"><i class="fa-solid fa-check"></i> ${done?tr('قمتَ الليلة ✓','Prayed tonight ✓'):tr('سجّل قيامك','Log qiyam')} · ${qiyamStreak()}${tr('ل','n')}</button>
            </div>

            <div class="night-sec">${tr('أدعية القيام والسحر','Qiyam & Suhoor Duas')}</div>
            ${duas}
            <p class="night-foot">${tr('﴿ وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ ﴾ · الإسراء 79','﴿ And rise at night and pray... ﴾')}</p>`;
        this.showDhikr();
    },
    _startClock:function(){ clearInterval(this._iv);
        const upd=()=>{ const f=$('focus-mode'); if(!f||!f.classList.contains('active')){ clearInterval(AnwarFocus._iv); return; }
            const lbl=$('nt-label')?null:document.querySelector('.nt-label'), tm=$('nt-timer'), st=$('nt-start'); if(!tm) return;
            const p=pt2(); const mg=n2m(p&&p.Maghrib), fj=n2m(p&&p.Fajr);
            if(mg==null||fj==null){ if(lbl)lbl.textContent=tr('فعّل أوقات الصلاة','Enable prayer times'); tm.textContent='--:--:--'; return; }
            const nightLen=(fj+1440)-mg, ltAbs=mg+nightLen*2/3, fjAbs=fj+1440;
            const now=new Date(); let pos=now.getHours()*60+now.getMinutes()+now.getSeconds()/60; if(pos<mg) pos+=1440;
            const ltM=((ltAbs%1440)+1440)%1440; const disp=p2(Math.floor(ltM/60))+':'+p2(Math.round(ltM%60)%60);
            if(st) st.textContent=tr('يبدأ ','starts ')+disp;
            let rem, txt;
            if(pos<ltAbs){ txt=tr('باقٍ على الثلث الأخير','Until last third'); rem=(ltAbs-pos)*60; }
            else if(pos<fjAbs){ txt=tr('أنت في الثلث الأخير — أكثِر من الدعاء','You are in the last third'); rem=(fjAbs-pos)*60; f.querySelector('#night-third').classList.add('active'); }
            else { txt=tr('استعدّ لقيام الليلة','Prepare for tonight'); rem=0; }
            if(lbl)lbl.textContent=txt;
            if(rem>0){ const h=Math.floor(rem/3600), m=Math.floor((rem%3600)/60), s=Math.floor(rem%60); tm.textContent=p2(h)+':'+p2(m)+':'+p2(s); } else tm.textContent=disp;
        };
        upd(); this._iv=setInterval(upd,1000);
    },
    openSurah:function(n){ this.close(); try{ if(window.MUSHAF&&MUSHAF.openSurah){ if(typeof goToTab==='function')goToTab(1); MUSHAF.openSurah(n); } else if(typeof openFreeReading==='function'){ openFreeReading('surah',n,''); } }catch(e){} },
    sleepAthkar:function(){ this.close(); try{ if(typeof goToTab==='function') goToTab(2); }catch(e){} },
    toggleQiyam:function(){ const d=new Date().toISOString().slice(0,10); let days=qiyamNights(); const i=days.indexOf(d); if(i>=0)days.splice(i,1); else{ days.push(d); if(window.HAP)HAP.success(); } localStorage.setItem('qiyam_nights',JSON.stringify(days)); this._render(); },
    showDhikr:function(){ const d=NIGHT_DHIKR[this._di]; const de=$('focus-dhikr'), ce=$('focus-count'); if(de)de.textContent=d.t; if(ce)ce.textContent=this._dc; },
    tick:function(){ const d=NIGHT_DHIKR[this._di]; this._dc++; if(window.HAP)HAP.light(); if(this._dc>=d.max){ this._di=(this._di+1)%NIGHT_DHIKR.length; this._dc=0; if(window.HAP)HAP.success(); } this.showDhikr(); },
    toggleSound:function(){ if(this._audio){ this.stopSound(); } else { this.startSound(); } },
    startSound:function(){ try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
        const ctx=new AC(); const g=ctx.createGain(); g.gain.value=0.05; g.connect(ctx.destination);
        const o1=ctx.createOscillator(); o1.type='sine'; o1.frequency.value=110; const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=110.5;
        const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=400; o1.connect(lp); o2.connect(lp); lp.connect(g); o1.start(); o2.start();
        this._audio={ctx:ctx,osc:[o1,o2]}; const b=$('focus-sound'); if(b){ b.innerHTML='<i class="fa-solid fa-volume-high"></i>'; b.classList.add('on'); }
    }catch(e){} },
    stopSound:function(){ try{ if(this._audio){ this._audio.osc.forEach(function(o){ try{o.stop();}catch(e){} }); this._audio.ctx.close(); this._audio=null; const b=$('focus-sound'); if(b){ b.innerHTML='<i class="fa-solid fa-volume-xmark"></i>'; b.classList.remove('on'); } } }catch(e){} }
};

// ===== (7) استوديو اللوحات الفنية للآيات =====
const WP_BG=[
    ['#0D3B2E','#04120C'],['#1B2A4A','#05080F'],['#3A2140','#0E0714'],['#4A2C1A','#100B06'],
    ['#14294A','#04070E'],['#2E2A12','#0B0A04'],['#0E3A44','#03110F'],['#43213A','#12060F'],
    ['#2B3A1C','#080C04'],['#3A1E1E','#100505'],['#1A2540','#05070E'],['#2A2438','#0A0812']
];
const WP_AYAHS=[
    {text:'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',ref:'الرعد: 28'},
    {text:'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',ref:'الشرح: 5'},
    {text:'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',ref:'الحديد: 4'},
    {text:'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',ref:'الطلاق: 3'},
    {text:'إِنَّ رَبِّي قَرِيبٌ مُّجِيبٌ',ref:'هود: 61'},
    {text:'وَاللَّهُ خَيْرٌ حَافِظًا وَهُوَ أَرْحَمُ الرَّاحِمِينَ',ref:'يوسف: 64'},
    {text:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً',ref:'البقرة: 201'},
    {text:'وَبَشِّرِ الصَّابِرِينَ',ref:'البقرة: 155'}
];
const WP_ORN=['بلا','إطار مزدوج','زوايا','شريطان']; // 0..3
window.AnwarWallpaper = {
    _bg:0, _ay:0, _orn:1,
    open:function(){ if(!gate('لوحات فنية للآيات','Ayah wallpapers')) return; this._render(); },
    _render:function(){
        const bgs=WP_BG.map((g,i)=>`<button class="wp-sw ${i===this._bg?'on':''}" style="background:linear-gradient(160deg,${g[0]},${g[1]})" onclick="AnwarWallpaper.set('bg',${i})"></button>`).join('');
        const ays=WP_AYAHS.map((a,i)=>`<button class="wp-chip ${i===this._ay?'on':''}" onclick="AnwarWallpaper.set('ay',${i})">${a.text.slice(0,14)}…</button>`).join('');
        const orns=WP_ORN.map((o,i)=>`<button class="wp-chip ${i===this._orn?'on':''}" onclick="AnwarWallpaper.set('orn',${i})">${o}</button>`).join('');
        const body=`<div class="wp-studio"><canvas id="wp-preview" class="wp-preview-cv" width="288" height="512"></canvas></div>
            <div class="wp-sec">${tr('الآية','Verse')}</div><div class="wp-chips">${ays}</div>
            <div class="wp-sec">${tr('الخلفية','Background')}</div><div class="wp-swatches">${bgs}</div>
            <div class="wp-sec">${tr('الزخرفة','Ornament')}</div><div class="wp-chips">${orns}</div>
            <button class="tasbeeh-pill" style="width:100%;margin-top:16px;" onclick="AnwarWallpaper.save()"><i class="fa-solid fa-download"></i> ${tr('حفظ بجودة عالية','Save in HD')}</button>`;
        modal('wallpaper-modal', tr('استوديو اللوحات الفنية','Art Studio'), 'fa-image', body);
        this._paint($('wp-preview'));
    },
    set:function(k,i){ if(k==='bg')this._bg=i; else if(k==='ay')this._ay=i; else this._orn=i; if(window.HAP)HAP.light(); this._render(); },
    _paint:async function(cv){ if(!cv) return; const W=cv.width,H=cv.height,x=cv.getContext('2d');
        try{ await document.fonts.load('40px Amiri'); }catch(e){}
        this._draw(x,W,H); },
    _draw:function(x,W,H){
        const S=W/1080; const [c1,c2]=WP_BG[this._bg]; const a=WP_AYAHS[this._ay]; const orn=this._orn;
        const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,c1); g.addColorStop(1,c2); x.fillStyle=g; x.fillRect(0,0,W,H);
        // توهّج ناعم علوي
        const rg=x.createRadialGradient(W/2,H*0.32,0,W/2,H*0.32,W*0.7); rg.addColorStop(0,'rgba(242,210,122,0.10)'); rg.addColorStop(1,'transparent'); x.fillStyle=rg; x.fillRect(0,0,W,H);
        x.strokeStyle='rgba(242,210,122,0.5)'; x.fillStyle='rgba(242,210,122,0.5)';
        const m=70*S;
        if(orn===1){ x.lineWidth=4*S; x.strokeRect(m,m,W-2*m,H-2*m); x.lineWidth=1.5*S; x.strokeRect(m+14*S,m+14*S,W-2*m-28*S,H-2*m-28*S); }
        else if(orn===2){ const c=90*S,L=70*S; x.lineWidth=4*S;
            [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(p=>{ x.beginPath(); x.moveTo(p[0],p[1]+p[3]*L); x.lineTo(p[0],p[1]); x.lineTo(p[0]+p[2]*L,p[1]); x.stroke(); x.beginPath(); x.arc(p[0]+p[2]*c,p[1]+p[3]*c,10*S,0,7); x.fill(); }); }
        else if(orn===3){ x.lineWidth=3*S; x.beginPath(); x.moveTo(m,H*0.2); x.lineTo(W-m,H*0.2); x.moveTo(m,H*0.8); x.lineTo(W-m,H*0.8); x.stroke();
            [[W/2,H*0.2],[W/2,H*0.8]].forEach(p=>{ x.beginPath(); x.arc(p[0],p[1],9*S,0,7); x.fill(); }); }
        // النص
        x.textAlign='center'; try{x.direction='rtl';}catch(e){}
        x.fillStyle='#F7EFDC'; x.font=(70*S)+'px Amiri, serif';
        const words=(a.text||'').split(/\s+/); const lines=[]; let ln='';
        words.forEach(w=>{ const t=ln?ln+' '+w:w; if(x.measureText(t).width>W-300*S&&ln){lines.push(ln);ln=w;}else ln=t; }); if(ln)lines.push(ln);
        let y=H/2-(lines.length-1)*64*S; lines.forEach(l=>{ x.fillText(l,W/2,y); y+=128*S; });
        x.fillStyle='#E9C877'; x.font=(40*S)+'px Amiri, serif'; x.fillText('﴿ '+(a.ref||'')+' ﴾',W/2,y+10*S);
        x.fillStyle='rgba(247,239,220,0.38)'; x.font=(28*S)+'px Tajawal, sans-serif'; x.fillText('anwar',W/2,H-90*S);
    },
    save:async function(){
        const W=1080,H=1920,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
        try{ await document.fonts.load('70px Amiri'); await document.fonts.load('30px Tajawal'); }catch(e){}
        this._draw(x,W,H);
        cv.toBlob(async b=>{ if(!b)return; const f=new File([b],'anwar-wallpaper.png',{type:'image/png'});
            try{ if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f]}); if(window.HAP)HAP.success(); return; } }catch(e){}
            const u=URL.createObjectURL(b); const link=document.createElement('a'); link.href=u; link.download='anwar-wallpaper.png'; link.click(); setTimeout(()=>URL.revokeObjectURL(u),1500); if(window.HAP)HAP.success();
        },'image/png');
    }
};

// طبّق الثيم المخصّص عند الإقلاع
setTimeout(()=>{ try{ AnwarThemeMaker._apply(); }catch(e){} }, 300);
})();
