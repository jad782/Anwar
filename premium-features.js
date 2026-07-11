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

// ===== (11) رفيق رمضان =====
function pt(){ try{ return (typeof prayerTimings!=='undefined')?prayerTimings:null; }catch(e){ return null; } }
window.AnwarRamadan = { open:function(){ if(!gate('رفيق رمضان','Ramadan companion')) return;
    const p=pt(); const suhoor = p?p.Fajr:'--:--', iftar = p?p.Maghrib:'--:--';
    const fasted = +(localStorage.getItem('ramadan_fasted')||0);
    const body = `
        <div class="ram-times">
            <div class="ram-t"><span>${tr('الإمساك (السحور)','Suhoor ends')}</span><b>${suhoor}</b></div>
            <div class="ram-t iftar"><span>${tr('الإفطار (المغرب)','Iftar')}</span><b>${iftar}</b></div>
        </div>
        <div class="pts-sec-title">${tr('عدّاد الصيام','Fasting counter')}</div>
        <div class="ram-counter"><button class="off-btn" onclick="AnwarRamadan.fast(-1)">−</button>
            <div class="ram-count"><b id="ram-count">${fasted}</b><span>${tr('يوم صيام','days fasted')}</span></div>
            <button class="off-btn" onclick="AnwarRamadan.fast(1)">+</button></div>
        <div class="pts-sec-title">${tr('أعمال رمضان','Ramadan deeds')}</div>
        ${['صلاة التراويح','ورد القرآن اليومي','صدقة اليوم','قيام ليل','دعاء الإفطار'].map((d,i)=>{
            const done=(localStorage.getItem('ram_deed_'+i)==='1');
            return `<div class="ch-task ${done?'done':''}" onclick="AnwarRamadan.deed(${i})"><span class="ch-ico"><i class="fa-solid fa-star"></i></span><span class="ch-name">${d}</span><span class="ch-pts">${done?'<i class="fa-solid fa-check"></i>':'✓'}</span></div>`;
        }).join('')}
        <p style="text-align:center;color:var(--text-muted);font-size:0.72rem;margin-top:12px;">${tr('الإمساك والإفطار محسوبان من أوقات صلاتك تلقائياً.','Times computed from your prayer settings.')}</p>`;
    modal('ramadan-modal', tr('رفيق رمضان','Ramadan Companion'), 'fa-star-and-crescent', body);
},
fast:function(d){ let v=+(localStorage.getItem('ramadan_fasted')||0)+d; v=Math.max(0,Math.min(30,v)); localStorage.setItem('ramadan_fasted',v); const e=$('ram-count'); if(e)e.textContent=v; if(window.HAP)HAP.light(); },
deed:function(i){ const k='ram_deed_'+i; localStorage.setItem(k, localStorage.getItem(k)==='1'?'0':'1'); if(window.HAP)HAP.light(); AnwarRamadan.open(); } };

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

// ===== (6) الوضع الليلي التأمّلي (Focus Mode) =====
// آيات تأمّل مهدّئة للوضع الليلي
const FOCUS_AYAHS = [
    {t:'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', r:'الرعد: 28'},
    {t:'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', r:'الشرح: 5'},
    {t:'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ', r:'الحديد: 4'},
    {t:'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ', r:'النحل: 127'},
    {t:'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', r:'الطلاق: 3'},
    {t:'إِنَّ رَبِّي قَرِيبٌ مُّجِيبٌ', r:'هود: 61'},
    {t:'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ', r:'ق: 16'},
    {t:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', r:'طه: 25-26'}
];
const DHIKRS = [ {t:'سُبْحَانَ اللَّه', max:33}, {t:'الْحَمْدُ لِلَّه', max:33}, {t:'اللَّهُ أَكْبَر', max:34} ];
window.AnwarFocus = {
    _timers:[], _ai:0, _di:0, _dc:0, _audio:null,
    open:function(){ if(!gate('الوضع التأمّلي','Focus mode')) return;
        let f=$('focus-mode');
        if(!f){ f=document.createElement('div'); f.id='focus-mode'; f.className='focus-overlay';
            f.innerHTML=`<div class="focus-stars"></div><div class="focus-moon"></div>
                <button class="focus-close" onclick="AnwarFocus.close()"><i class="fa-solid fa-xmark"></i></button>
                <div class="focus-stage">
                    <div class="focus-breath" id="focus-breath"><span id="focus-breath-txt"></span></div>
                    <div class="focus-ayah" id="focus-ayah"></div>
                    <div class="focus-ref" id="focus-ref"></div>
                </div>
                <div class="focus-dock">
                    <button class="focus-dockbtn" id="focus-sound" onclick="AnwarFocus.toggleSound()" title="${tr('صوت هادئ','Ambient')}"><i class="fa-solid fa-volume-xmark"></i></button>
                    <div class="focus-tasbeeh" onclick="AnwarFocus.tick()"><span id="focus-dhikr"></span><span class="focus-count" id="focus-count">0</span></div>
                    <button class="focus-dockbtn" onclick="AnwarFocus.nextAyah()" title="${tr('آية أخرى','Next verse')}"><i class="fa-solid fa-arrows-rotate"></i></button>
                </div>`;
            document.body.appendChild(f);
        }
        this._ai=new Date().getDate()%FOCUS_AYAHS.length; this._di=0; this._dc=0;
        this.showAyah(); this.showDhikr();
        f.classList.add('active');
        this.breathe();
    },
    close:function(){ this._timers.forEach(clearTimeout); this._timers=[]; this.stopSound(); const f=$('focus-mode'); if(f) f.classList.remove('active'); },
    breathe:function(){ // دورة 4-7-8: استنشق/احبس/ازفر
        const orb=$('focus-breath'), txt=$('focus-breath-txt'); if(!orb) return;
        const self=this;
        function phase(name, cls, secs, next){
            if(txt) txt.textContent=name; orb.className='focus-breath '+cls;
            self._timers.push(setTimeout(next, secs*1000));
        }
        function cycle(){
            phase(tr('استنشق','Inhale'),'inhale',4,function(){
                phase(tr('احبس','Hold'),'hold',7,function(){
                    phase(tr('ازفر','Exhale'),'exhale',8,cycle);
                });
            });
        }
        cycle();
    },
    showAyah:function(){ const a=FOCUS_AYAHS[this._ai%FOCUS_AYAHS.length]; const ae=$('focus-ayah'), re=$('focus-ref');
        if(ae){ ae.style.animation='none'; void ae.offsetWidth; ae.style.animation=''; ae.textContent=a.t; } if(re) re.textContent='﴿ '+a.r+' ﴾'; },
    nextAyah:function(){ this._ai=(this._ai+1)%FOCUS_AYAHS.length; this.showAyah(); if(window.HAP)HAP.light(); },
    showDhikr:function(){ const d=DHIKRS[this._di]; const de=$('focus-dhikr'), ce=$('focus-count'); if(de)de.textContent=d.t; if(ce)ce.textContent=this._dc; },
    tick:function(){ const d=DHIKRS[this._di]; this._dc++; if(window.HAP)HAP.light();
        if(this._dc>=d.max){ this._di=(this._di+1)%DHIKRS.length; this._dc=0; if(window.HAP)HAP.success(); }
        this.showDhikr(); },
    toggleSound:function(){ if(this._audio){ this.stopSound(); } else { this.startSound(); } },
    startSound:function(){ try{
        const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
        const ctx=new AC(); const g=ctx.createGain(); g.gain.value=0.05; g.connect(ctx.destination);
        // نغمة رياح هادئة: مذبذبان مخفوتان + مرشّح
        const o1=ctx.createOscillator(); o1.type='sine'; o1.frequency.value=110;
        const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=110.5;
        const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=400;
        o1.connect(lp); o2.connect(lp); lp.connect(g); o1.start(); o2.start();
        this._audio={ctx:ctx,osc:[o1,o2]};
        const b=$('focus-sound'); if(b) b.innerHTML='<i class="fa-solid fa-volume-high"></i>'; b&&b.classList.add('on');
    }catch(e){} },
    stopSound:function(){ try{ if(this._audio){ this._audio.osc.forEach(function(o){ try{o.stop();}catch(e){} }); this._audio.ctx.close(); this._audio=null; const b=$('focus-sound'); if(b){ b.innerHTML='<i class="fa-solid fa-volume-xmark"></i>'; b.classList.remove('on'); } } }catch(e){} }
};

// ===== (7) لوحات فنية للآيات (Wallpapers) =====
const WP_BG=[['#0D3B2E','#04120C'],['#1B2A4A','#05080F'],['#3A2140','#0E0714'],['#4A2C1A','#100B06'],['#14294A','#04070E'],['#2E2A12','#0B0A04']];
window.AnwarWallpaper = { open:function(){ if(!gate('لوحات فنية للآيات','Ayah wallpapers')) return;
    const ayahs=(window.FEATURED_AYAHS)||[{text:'وَاللَّهُ خَيْرٌ حَافِظًا',ref:''}];
    const body = `<p style="text-align:center;color:var(--text-muted);font-size:0.82rem;margin-bottom:12px;">${tr('خلفية جوّال فنية بالآية — اختر واحدة واحفظها.','Artistic phone wallpaper — pick one and save.')}</p>
        <div class="wp-grid">${WP_BG.map((g,i)=>`<div class="wp-thumb" style="background:linear-gradient(160deg,${g[0]},${g[1]})" onclick="AnwarWallpaper.save(${i})"><span>${ayahs[i%ayahs.length].text.slice(0,22)}…</span></div>`).join('')}</div>`;
    modal('wallpaper-modal', tr('لوحات فنية للآيات','Ayah Wallpapers'), 'fa-image', body);
},
save:async function(i){
    const ayahs=(window.FEATURED_AYAHS)||[{text:'وَاللَّهُ خَيْرٌ حَافِظًا',ref:''}];
    const a=ayahs[i%ayahs.length]; const [c1,c2]=WP_BG[i];
    const W=1080,H=1920,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
    try{ await document.fonts.load('70px Amiri'); }catch(e){}
    const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,c1); g.addColorStop(1,c2); x.fillStyle=g; x.fillRect(0,0,W,H);
    x.strokeStyle='rgba(242,210,122,0.35)'; x.lineWidth=4; x.strokeRect(60,60,W-120,H-120);
    x.textAlign='center'; try{x.direction='rtl';}catch(e){}
    x.fillStyle='#F7EFDC'; x.font='72px Amiri, serif';
    const words=(a.text||'').split(/\s+/); const lines=[]; let ln='';
    words.forEach(w=>{ const t=ln?ln+' '+w:w; if(x.measureText(t).width>W-280&&ln){lines.push(ln);ln=w;}else ln=t; }); if(ln)lines.push(ln);
    let y=H/2-(lines.length-1)*66; lines.forEach(l=>{ x.fillText(l,W/2,y); y+=132; });
    x.fillStyle='#D4A843'; x.font='40px Amiri, serif'; x.fillText('﴿ '+(a.ref||'')+' ﴾',W/2,y+20);
    x.fillStyle='rgba(247,239,220,0.4)'; x.font='30px Tajawal, sans-serif'; x.fillText('anwar',W/2,H-100);
    cv.toBlob(async b=>{ if(!b)return; const f=new File([b],'anwar-wallpaper.png',{type:'image/png'});
        try{ if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f]}); return; } }catch(e){}
        const u=URL.createObjectURL(b); const link=document.createElement('a'); link.href=u; link.download='anwar-wallpaper.png'; link.click(); setTimeout(()=>URL.revokeObjectURL(u),1500);
    },'image/png');
}};

// طبّق الثيم المخصّص عند الإقلاع
setTimeout(()=>{ try{ AnwarThemeMaker._apply(); }catch(e){} }, 300);
})();
