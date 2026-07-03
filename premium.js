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
    { ico:'fa-kaaba',            ar:'رفيق العمرة والحج',        d:'أدلة المناسك خطوة بخطوة + عدّاد أشواط الطواف والسعي + أدعية كل موقف.' },
    { ico:'fa-calendar-star',    ar:'تقويم إسلامي كامل',        d:'رمضان والعشر وعاشوراء والأيام البيض... مع تنبيهات وأعمال كل مناسبة.' },
    { ico:'fa-headphones',       ar:'مكتبة تلاوات بلا نت',       d:'تحميل سور كاملة بأصوات كبار القرّاء للاستماع أوفلاين وبالخلفية.' },
    { ico:'fa-palette',          ar:'حزمة التخصيص الكاملة',      d:'كل الثيمات وخطوط المصحف والخلفيات الفاخرة — دائمة بلا نقاط.' },
    { ico:'fa-clapperboard',     ar:'استوديو الآيات السينمائي',  d:'حوّل الآية لفيديو متحرّك بخلفية وتلاوة، جاهز للنشر على السوشال.' },
    { ico:'fa-moon',             ar:'الوضع الليلي التأمّلي',      d:'شاشة قراءة غامرة للقيام والتهجّد بلا مشتّتات وأجواء هادئة.' },
    { ico:'fa-image',            ar:'لوحات فنية للآيات',         d:'خلفيات جوّال فنية 4K بالخط العربي تتجدّد يومياً.' },
    { ico:'fa-cube',             ar:'القبلة بالواقع المعزّز 3D',  d:'كعبة ثلاثية الأبعاد تطفو بالكاميرا وتوجّهك بدقّة.' },
    { ico:'fa-tower-broadcast',  ar:'ختمة جماعية مباشرة',        d:'غرفة ختمة لحظية: كلٌّ يقرأ جزءه وشريط تقدّم مباشر ودعاء ختم جماعي.' },
    { ico:'fa-hands-praying',    ar:'أسماء الله الحسنى التفاعلية',d:'الـ99 اسماً بتصميم فخم مع المعاني وطريقة الدعاء وبطاقات مشاركة.' },
    { ico:'fa-star-and-crescent',ar:'رفيق رمضان الكامل',        d:'إمساكية وعدّاد صيام وورد تراويح وأهداف ختمة — يتفعّل تلقائياً برمضان.' },
    { ico:'fa-wand-magic-sparkles',ar:'صانع الثيمات الشخصي',    d:'صمّم ثيمك الخاص باختيار لونين ويتناسق التطبيق كله معك.' },
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
        body.innerHTML=`<div class="prem-hero"><div class="prem-crown"><i class="fa-solid fa-crown"></i></div>
            <h2>${tr('أنت عضو مميّز 🤍','You are Premium 🤍')}</h2>
            <p>${tr('شكراً لدعمك — كل الميزات مفتوحة لك.','Thank you — all features unlocked.')}</p></div>`;
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
AnwarPremium.refreshPrices = function(){ if($('premium-modal') && $('premium-modal').classList.contains('active')) AnwarPremium._render(); };
AnwarPremium.onUnlocked = function(){ try{ AnwarPremium._render(); updateBanner(); if(typeof showBadgeToast==='function') showBadgeToast({emoji:'👑', name:tr('أهلاً بك في بريميوم','Welcome to Premium'), desc:tr('كل الميزات مفتوحة','All features unlocked')}); }catch(e){} };

// ---------- نقاط الدخول ----------
function updateBanner(){ const b=$('premium-banner'); if(b) b.style.display = isPrem() ? 'none' : 'flex'; }
function inject(){
    // بانر بارز على الرئيسية (بعد مفاتيح يومك)
    const keys=$('keys-grid');
    if(keys && !$('premium-banner')){
        const b=document.createElement('div'); b.id='premium-banner'; b.className='premium-banner'; b.onclick=AnwarPremium.openPlans;
        b.innerHTML=`<div class="pb-left"><div class="pb-ico"><i class="fa-solid fa-crown"></i></div>
            <div class="pb-txt"><b>${tr('الأنوار بريميوم','Al-Anwar Premium')}</b><span>${tr('افتح كل الميزات الفاخرة','Unlock all premium features')}</span></div></div>
            <i class="fa-solid fa-chevron-left pb-go"></i>`;
        keys.parentNode.insertBefore(b, keys.nextSibling);
        updateBanner();
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
