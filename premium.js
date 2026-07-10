// =======================================================
//  premium.js — صفحة "الأنوار بريميوم" (اشتراك مميّز) + نقاط الدخول
//  الشراء عبر In-App Purchase (PRO.subscribe). يُتحكّم بالحالة عبر anwar_premium.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function isPrem(){ return localStorage.getItem('anwar_premium')==='true'; }

window.AnwarPremium = window.AnwarPremium || {};
AnwarPremium.is = isPrem;
AnwarPremium.setForTesting = function(v){ localStorage.setItem('anwar_premium', v?'true':'false'); AnwarPremium.onUnlocked(); };

// الميزات المميّزة (شرح مبسّط لكل واحدة)
const FEATURES = [
    { ico:'fa-kaaba',            ar:'رفيق العمرة والحج',        d:'أدلة المناسك خطوة بخطوة + عدّاد أشواط الطواف والسعي + أدعية كل موقف.', act:"AnwarHajj&&AnwarHajj.open()" },
    { ico:'fa-calendar-star',    ar:'تقويم إسلامي كامل',        d:'رمضان والعشر وعاشوراء والأيام البيض... مع تنبيهات وأعمال كل مناسبة.', act:"PRO&&PRO.openCalendar()" },
    { ico:'fa-headphones',       ar:'مكتبة تلاوات بلا نت',       d:'تحميل سور كاملة بأصوات كبار القرّاء للاستماع أوفلاين وبالخلفية.', act:"AnwarRecite&&AnwarRecite.open()" },
    { ico:'fa-palette',          ar:'حزمة التخصيص الكاملة',      d:'كل الثيمات وخطوط المصحف والخلفيات الفاخرة — دائمة بلا نقاط.', act:"AnwarTheme2&&AnwarTheme2.open()" },
    { ico:'fa-clapperboard',     ar:'استوديو الآيات السينمائي',  d:'صمّم الآيات والأحاديث بتأثيرات متحرّكة واحفظها/انشرها بجودة عالية.', act:"AnwarCards&&AnwarCards.open()" },
    { ico:'fa-moon',             ar:'الوضع الليلي التأمّلي',      d:'شاشة قراءة غامرة للقيام والتهجّد بلا مشتّتات وأجواء هادئة.', act:"AnwarFocus&&AnwarFocus.open()" },
    { ico:'fa-image',            ar:'لوحات فنية للآيات',         d:'خلفيات جوّال فنية بالخط العربي تُحفظ في جهازك.', act:"AnwarWallpaper&&AnwarWallpaper.open()" },
    { ico:'fa-cube',             ar:'القبلة بالواقع المعزّز',    d:'كاميرا توجّهك نحو القبلة بسهم فوق الواقع + توجيه بالاهتزاز.', act:"openQibla()" },
    { ico:'fa-tower-broadcast',  ar:'ختمة جماعية مباشرة',        d:'غرفة ختمة لحظية متزامنة: كلٌّ يقرأ جزءه وشريط تقدّم مباشر للجميع.', act:"PRO&&PRO.openGroupKhatma()" },
    { ico:'fa-hands-praying',    ar:'أسماء الله الحسنى',        d:'الـ99 اسماً بتصميم فخم مع المعاني وبطاقات مشاركة.', act:"AnwarNames&&AnwarNames.open()" },
    { ico:'fa-star-and-crescent',ar:'رفيق رمضان الكامل',        d:'إمساكية وعدّاد صيام وأعمال رمضان — يعتمد على أوقات صلاتك.', act:"AnwarRamadan&&AnwarRamadan.open()" },
    { ico:'fa-wand-magic-sparkles',ar:'صانع الثيمات الشخصي',    d:'صمّم ثيمك الخاص باختيار لونين ويتناسق التطبيق كله معك.', act:"AnwarThemeMaker&&AnwarThemeMaker.open()" },
];
const PLANS = [
    { id:'com.alanwar.premium.monthly',  ar:'شهري',      en:'Monthly',  price:'$1.99',  per:'/شهر',  perEn:'/mo' },
    { id:'com.alanwar.premium.yearly',   ar:'سنوي',      en:'Yearly',   price:'$11.99', per:'/سنة',  perEn:'/yr', best:true, save:'وفّر 50%' },
    { id:'com.alanwar.premium.lifetime', ar:'مدى الحياة', en:'Lifetime', price:'$29.99', per:'',      perEn:'' },
];

AnwarPremium.openPlans = function(){
    let m=$('premium-modal');
    if(!m){ m=document.createElement('div'); m.id='premium-modal'; m.className='qibla-overlay';
        m.innerHTML=`<div class="qibla-modal prem-modal" style="width:95%;max-width:460px;text-align:right;max-height:90vh;overflow-y:auto;">
            <button class="close-qibla" onclick="document.getElementById('premium-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
            <div id="premium-body"></div></div>`;
        document.body.appendChild(m);
    }
    AnwarPremium._render();
    m.classList.add('active');
};
AnwarPremium._render = function(){
    const body=$('premium-body'); if(!body) return;
    if(isPrem()){
        const launch = FEATURES.map(f=>`<div class="prem-feat prem-launch" onclick="try{${f.act}}catch(e){}">
            <span class="pf-ico"><i class="fa-solid ${f.ico}"></i></span>
            <div class="pf-txt"><b>${f.ar}</b><span>${f.d}</span></div>
            <i class="fa-solid fa-chevron-left" style="color:var(--accent-color);opacity:.6"></i></div>`).join('');
        body.innerHTML=`<div class="prem-hero"><div class="prem-crown"><i class="fa-solid fa-crown"></i></div>
            <h2>${tr('عضو مميّز 🤍','Premium 🤍')}</h2>
            <p>${tr('كل الميزات مفتوحة — اضغط أيّها لتفتحه.','All features unlocked — tap any to open.')}</p></div>
            <div class="prem-feats">${launch}</div>`;
        return;
    }
    const feats = FEATURES.map(f=>`<div class="prem-feat"><span class="pf-ico"><i class="fa-solid ${f.ico}"></i></span>
        <div class="pf-txt"><b>${f.ar}</b><span>${f.d}</span></div></div>`).join('');
    const plans = PLANS.map(p=>{
        const price = (window.PRO&&PRO.premiumPrice&&PRO.premiumPrice(p.id)) || p.price;
        return `<button class="prem-plan ${p.best?'best':''}" onclick="AnwarPremium.buy('${p.id}')">
            ${p.best?`<span class="pp-flag">${tr('الأوفر','Best')}</span>`:''}
            <span class="pp-name">${L()==='en'?p.en:p.ar}</span>
            <span class="pp-price">${price}<small>${L()==='en'?p.perEn:p.per}</small></span>
            ${p.save?`<span class="pp-save">${tr(p.save,'Save 50%')}</span>`:''}</button>`;
    }).join('');
    body.innerHTML=`
        <div class="prem-hero"><div class="prem-crown"><i class="fa-solid fa-crown"></i></div>
            <h2>${tr('الأنوار بريميوم','Al-Anwar Premium')}</h2>
            <p>${tr('جوهر التطبيق مجاني دائماً. الاشتراك يفتح لك ميزات فاخرة تُثري رحلتك مع القرآن.','The core is always free. Premium unlocks luxurious features for your journey.')}</p></div>
        <div class="prem-feats">${feats}</div>
        <div class="prem-trial"><i class="fa-solid fa-gift"></i> ${tr('جرّب 7 أيام مجاناً — ألغِ في أي وقت','7-day free trial — cancel anytime')}</div>
        <div class="prem-plans">${plans}</div>
        <button class="prem-restore" onclick="window.PRO&&PRO.restorePurchases()">${tr('استعادة المشتريات','Restore purchases')}</button>
        <p class="prem-terms">${tr('يُدار الاشتراك عبر حسابك في App Store ويتجدّد تلقائياً ما لم يُلغَ قبل 24 ساعة من نهاية المدة.','Billed via your App Store account; auto-renews unless canceled 24h before the period ends.')}</p>`;
};
AnwarPremium.buy = function(id){ if(window.PRO&&PRO.subscribe) PRO.subscribe(id); };
// جدار الحماية: تُستدعى قبل أي ميزة مميّزة
window.requirePremium = function(featAr, featEn){
    if(isPrem()) return true;
    AnwarPremium.openPlans();
    return false;
};
AnwarPremium.refreshPrices = function(){ if($('premium-modal') && $('premium-modal').classList.contains('active')) AnwarPremium._render(); };
AnwarPremium.onUnlocked = function(){ try{ AnwarPremium._render(); updateBanner(); if(typeof showBadgeToast==='function') showBadgeToast({emoji:'👑', name:tr('أهلاً بك في بريميوم','Welcome to Premium'), desc:tr('كل الميزات مفتوحة','All features unlocked')}); }catch(e){} };

// ---------- قسم البريميوم المستقل على الرئيسية ----------
// نقرة على ميزة: إن كان مشتركاً تُفتح مباشرة، وإلا تُعرض خطط الاشتراك
AnwarPremium.tapFeature = function(i){
    const f=FEATURES[i]; if(!f) return;
    if(isPrem()){ try{ eval(f.act); }catch(e){} }
    else AnwarPremium.openPlans();
};
function renderSection(){
    const sec=$('premium-section'); if(!sec) return;
    const chips = FEATURES.map((f,i)=>`<div class="ps-chip" onclick="AnwarPremium.tapFeature(${i})">
        <div class="ps-chip-ico"><i class="fa-solid ${f.ico}"></i></div>
        <span class="ps-chip-lbl">${f.ar}</span></div>`).join('');
    const prem=isPrem();
    sec.innerHTML=`
        <div class="ps-head" onclick="AnwarPremium.openPlans()">
            <div class="ps-crown"><i class="fa-solid fa-crown"></i></div>
            <div class="ps-titles">
                <b>${tr('الأنوار بريميوم','Al-Anwar Premium')} ${prem?'🤍':''}</b>
                <span>${prem?tr('عضو مميّز — كل الميزات مفتوحة','Premium — all unlocked'):tr('ميزات فاخرة تُثري رحلتك مع القرآن','Luxurious features for your journey')}</span>
            </div>
            <i class="fa-solid fa-chevron-left ps-go"></i>
        </div>
        <div class="ps-scroll" id="ps-scroll">${chips}</div>
        ${prem?'':`<button class="ps-cta" onclick="AnwarPremium.openPlans()"><i class="fa-solid fa-gift"></i> ${tr('افتح كل الميزات — جرّب 7 أيام مجاناً','Unlock all — 7-day free trial')}</button>`}`;
    // سكرول أفقي بعجلة الماوس/السحب لصف الميزات
    const sc=$('ps-scroll');
    if(sc && !sc._b){ sc._b=1;
        sc.addEventListener('wheel',e=>{ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ sc.scrollLeft+=e.deltaY; e.preventDefault(); } },{passive:false});
        let d=false,sx=0,sl=0,mv=false;
        sc.addEventListener('mousedown',e=>{ d=true;mv=false;sx=e.pageX;sl=sc.scrollLeft; });
        window.addEventListener('mousemove',e=>{ if(!d)return; const dx=e.pageX-sx; if(Math.abs(dx)>3)mv=true; sc.scrollLeft=sl-dx; });
        window.addEventListener('mouseup',()=>{ d=false; });
        sc.addEventListener('click',e=>{ if(mv){ e.stopPropagation(); e.preventDefault(); mv=false; } },true);
    }
}
function updateBanner(){ renderSection(); }
function inject(){
    // قسم بريميوم مستقل على الرئيسية (بعد آية اليوم — مكان واضح قرب الأعلى)
    const anchor = $('ayah-of-day-card') || document.querySelector('#tab-home .prayer-grid') || $('keys-grid');
    if(anchor && anchor.parentNode && !$('premium-section')){
        const sec=document.createElement('div'); sec.id='premium-section'; sec.className='premium-section';
        anchor.parentNode.insertBefore(sec, anchor.nextSibling);
        renderSection();
    }
    // صف في الإعدادات (بأعلى مجموعة الحساب)
    const list=document.querySelector('#tab-settings .settings-list');
    if(list && !$('premium-row')){
        const r=document.createElement('div'); r.className='setting-item premium-row-item'; r.id='premium-row';
        r.innerHTML=`<span class="set-ico" style="background:linear-gradient(135deg,var(--accent-color),var(--accent-light));color:#14110B;"><i class="fa-solid fa-crown"></i></span><span class="set-label">${tr('الأنوار بريميوم','Al-Anwar Premium')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i>`;
        r.onclick=AnwarPremium.openPlans; list.insertBefore(r, list.firstChild);
    }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject,1200));
else setTimeout(inject,1200);
})();
