// =======================================================
//  points.js — نقاط الأنوار (PlusPoints) + لوحة المحفظة الروحانية
//  + اختصار الأذكار حسب الوقت + جدار الاشتراك (Paywall) + التبرّع
//  مستقل عن باقي الملفات؛ آمن على الويب وداخل Capacitor.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function today(){ return new Date().toISOString().slice(0,10); }

// ---------- الحالة ----------
const PT_KEY='anwar_points', LOG_KEY='anwar_daily_log', PREM_KEY='anwar_premium', CLAIM_KEY='anwar_athkar_claim';
const RATE_PER_USD = 100;          // 100 نقطة = 1 دولار
const DONATE_MIN   = 100;          // حد التبرّع
function loadPts(){ try{ return JSON.parse(localStorage.getItem(PT_KEY)||'{"balance":0,"lifetime":0}'); }catch(e){ return {balance:0,lifetime:0}; } }
function savePts(p){ localStorage.setItem(PT_KEY, JSON.stringify(p)); }
function loadLog(){ try{ return JSON.parse(localStorage.getItem(LOG_KEY)||'{}'); }catch(e){ return {}; } }
function saveLog(l){ localStorage.setItem(LOG_KEY, JSON.stringify(l)); }
function isPremium(){ return localStorage.getItem(PREM_KEY)==='true'; }

window.AnwarPremium = { is:isPremium, setForTesting:(v)=>{ localStorage.setItem(PREM_KEY, v?'true':'false'); renderAll(); } };

function logToday(n){ const l=loadLog(); const d=today(); l[d]=(l[d]||0)+n; saveLog(l); }

// ---------- كسب النقاط ----------
// المشترك ×1، المجاني ×0.25 (حد أدنى 1) — لتحفيز الترقية مع إبقاء المجاني فعّالاً
window.awardPoints = function(base, reason){
    const gain = Math.max(1, Math.round((base||1) * (isPremium()?1:0.25)));
    const p=loadPts(); p.balance+=gain; p.lifetime=(p.lifetime||0)+gain; savePts(p);
    logToday(1);
    ptToast(tr('+'+gain+' نقطة أنوار ✨','+'+gain+' PlusPoints ✨'));
    renderAll();
    syncCloud();
    return gain;
};

function ptToast(msg){
    let t=$('pt-toast'); if(!t){ t=document.createElement('div'); t.id='pt-toast'; t.className='pt-toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove('show'),2200);
}

// مزامنة اختيارية لرصيد النقاط إلى Firestore (لوحة الأدمن المستقبلية)
function clientId(){ let id=localStorage.getItem('anwar_client_id'); if(!id){ id='c_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('anwar_client_id',id);} return id; }
function syncCloud(){
    try{
        if(window.firebase && firebase.firestore){
            firebase.firestore().collection('points').doc(clientId())
                .set({ balance:loadPts().balance, lifetime:loadPts().lifetime, premium:isPremium(), updatedAt:Date.now() }, {merge:true}).catch(()=>{});
        }
    }catch(e){}
}

// =======================================================
//  لوحة المحفظة الروحانية (Dashboard) — مجانية للجميع
// =======================================================
function heatmapHTML(){
    const log=loadLog(); const cells=[]; const now=new Date();
    for(let i=83;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); const key=d.toISOString().slice(0,10);
        const v=log[key]||0; let lvl=0; if(v>=1)lvl=1; if(v>=3)lvl=2; if(v>=6)lvl=3; if(v>=10)lvl=4;
        cells.push(`<span class="hm-cell hm-l${lvl}" title="${key}: ${v}"></span>`);
    }
    return `<div class="hm-grid">${cells.join('')}</div>`;
}
window.renderPointsDashboard = function(){
    const host=$('points-dash'); if(!host) return;
    const p=loadPts(); const streak=localStorage.getItem('streak_count')||0;
    const usd=(p.balance/RATE_PER_USD).toFixed(2);
    const canDonate=p.balance>=DONATE_MIN;
    host.innerHTML = `
      <div class="sp-portfolio">
        <div class="sp-glow"></div>
        <div class="sp-top">
          <div><span class="sp-label">${tr('نقاط الأنوار','PlusPoints')}</span>
            <div class="sp-balance"><i class="fa-solid fa-star"></i> ${p.balance}</div>
            <span class="sp-usd">${tr('≈ ','≈ ')}$${usd} · ${tr('100 نقطة = 1$','100 pts = $1')}</span></div>
          <div class="sp-stats">
            <div class="sp-stat"><b>${streak}</b><span>${tr('سلسلة','Streak')}</span></div>
            <div class="sp-stat"><b>${p.lifetime||0}</b><span>${tr('الإجمالي','Lifetime')}</span></div>
            <div class="sp-stat"><b>${isPremium()?tr('مميّز','Pro'):tr('مجاني','Free')}</b><span>${tr('الخطة','Plan')}</span></div>
          </div>
        </div>
        <div class="sp-hm-title">${tr('التزامك اليومي','Daily commitment')}</div>
        ${heatmapHTML()}
        <div class="sp-actions">
          <button class="sp-btn ${canDonate?'':'dim'}" onclick="AnwarDonate.open()"><i class="fa-solid fa-hand-holding-heart"></i> ${tr('تبرّع بنقاطك','Donate points')}</button>
          ${isPremium()?'':`<button class="sp-btn gold" onclick="AnwarPremium2.openPlans()"><i class="fa-solid fa-crown"></i> ${tr('ترقية','Upgrade')}</button>`}
        </div>
      </div>`;
};

// =======================================================
//  اختصار الأذكار حسب وقت الدخول — مجاني للجميع
// =======================================================
function toMin(hhmm){ if(!hhmm||hhmm.indexOf(':')<0) return null; const [h,m]=hhmm.split(':').map(Number); return h*60+m; }
function athkarContext(){
    // يعتمد على prayerTimings العالمي إن وُجد؛ وإلا تقدير بالساعة
    let fajr=null,dhuhr=null,maghrib=null;
    try{ if(typeof prayerTimings!=='undefined'){ fajr=toMin(prayerTimings.Fajr); dhuhr=toMin(prayerTimings.Dhuhr); maghrib=toMin(prayerTimings.Maghrib); } }catch(e){}
    const now=new Date(); const cur=now.getHours()*60+now.getMinutes();
    if(fajr!=null && dhuhr!=null && maghrib!=null){
        if(cur>=fajr && cur<dhuhr)  return {key:'morning', ar:'أذكار الصباح', en:'Morning Adhkar', ico:'fa-sun'};
        if(cur>=maghrib || cur<fajr) return {key:'evening', ar:'أذكار المساء', en:'Evening Adhkar', ico:'fa-moon'};
        return {key:null, ar:'اقرأ أذكارك', en:'Read your Adhkar', ico:'fa-hands-praying'};
    }
    // تقدير بالساعة عند غياب أوقات الصلاة
    const h=now.getHours();
    if(h>=4 && h<12)  return {key:'morning', ar:'أذكار الصباح', en:'Morning Adhkar', ico:'fa-sun'};
    if(h>=17 || h<4)  return {key:'evening', ar:'أذكار المساء', en:'Evening Adhkar', ico:'fa-moon'};
    return {key:null, ar:'اقرأ أذكارك', en:'Read your Adhkar', ico:'fa-hands-praying'};
}
window.renderAthkarShortcut = function(){
    const host=$('athkar-shortcut'); if(!host) return;
    const c=athkarContext();
    host.innerHTML = `<div class="ath-shortcut-card" onclick="AnwarPoints.goAthkar('${c.key||''}')">
        <div class="asc-ico"><i class="fa-solid ${c.ico}"></i></div>
        <div class="asc-txt"><span class="asc-label">${tr('حان وقت','Time for')}</span>
          <span class="asc-main">${L()==='en'?c.en:c.ar}</span></div>
        <i class="fa-solid fa-chevron-left asc-go"></i></div>`;
};
window.AnwarPoints = {
    goAthkar:function(key){
        if(typeof goToTab==='function') goToTab(2);
        setTimeout(()=>{
            try{
                if(window.QA && QA.openCat){ if(key) QA.openCat('athkar', key); }
            }catch(e){}
        }, 250);
        // مكافأة قراءة الأذكار مرّة واحدة في اليوم لكل وقت
        const claim=localStorage.getItem(CLAIM_KEY)||''; const tag=today()+(key||'gen');
        if(claim!==tag){ localStorage.setItem(CLAIM_KEY, tag); window.awardPoints(20, 'athkar'); }
    }
};

// =======================================================
//  التبرّع بالنقاط — يرسل طلباً للأدمن عبر Firestore (لا أموال نقدية)
// =======================================================
window.AnwarDonate = {
    open:function(){
        const p=loadPts();
        ensureModal('donate-modal', tr('تبرّع بنقاطك','Donate your points'));
        const body=$('donate-modal-body');
        if(p.balance<DONATE_MIN){
            body.innerHTML=`<p class="tasks-empty">${tr('تحتاج '+DONATE_MIN+' نقطة على الأقل للتبرّع. رصيدك: '+p.balance,'You need at least '+DONATE_MIN+' points. Balance: '+p.balance)}</p>`;
        } else {
            const usd=Math.floor(p.balance/RATE_PER_USD);
            body.innerHTML=`
              <p style="text-align:center;color:var(--text-soft,#9a8f7a);font-size:0.88rem;margin-bottom:14px;">
                ${tr('عند التبرّع نخصّص باسمك مبلغ 1$ لكل 100 نقطة لمشروع خيري (إطعام محتاج / كفالة يتيم). لا تُصرف لك أموال نقدية.',
                     'When you donate, $1 per 100 points is allocated in your name to a charity (feeding the needy / sponsoring an orphan). No cash is paid to you.')}
              </p>
              <div class="donate-amount"><i class="fa-solid fa-star"></i> ${Math.floor(usd*RATE_PER_USD)} ${tr('نقطة','pts')} → $${usd}</div>
              <label class="dn-field"><span>${tr('المشروع الخيري','Charity project')}</span>
                <select id="dn-project" class="modal-input">
                  <option value="feed">${tr('إطعام محتاج','Feed the needy')}</option>
                  <option value="orphan">${tr('كفالة يتيم','Sponsor an orphan')}</option>
                  <option value="quran">${tr('طباعة مصاحف','Print Qurans')}</option>
                </select></label>
              <label class="dn-field"><span>${tr('اسمك (يظهر مع التبرّع)','Your name (shown with the donation)')}</span>
                <input id="dn-name" class="modal-input" placeholder="${tr('اختياري','optional')}"></label>
              <button class="tasbeeh-pill" style="width:100%;margin-top:12px;" onclick="AnwarDonate.submit(${usd})">
                <i class="fa-solid fa-paper-plane"></i> ${tr('إرسال طلب التبرّع','Send donation request')}</button>`;
        }
        $('donate-modal').classList.add('active');
    },
    submit:function(usd){
        const project=($('dn-project')||{}).value||'feed';
        const name=(($('dn-name')||{}).value||'').trim();
        const pts=usd*RATE_PER_USD;
        const req={ clientId:clientId(), name:name||'مجهول', points:pts, usd:usd, project:project, status:'pending', createdAt:Date.now() };
        // أرسل الطلب للأدمن
        let sent=false;
        try{ if(window.firebase && firebase.firestore){ firebase.firestore().collection('donation_requests').add(req).catch(()=>{}); sent=true; } }catch(e){}
        // اخصم النقاط محلياً
        const p=loadPts(); p.balance-=pts; if(p.balance<0)p.balance=0; savePts(p); syncCloud();
        $('donate-modal').classList.remove('active'); renderAll();
        const names={feed:tr('إطعام محتاج','feeding the needy'),orphan:tr('كفالة يتيم','sponsoring an orphan'),quran:tr('طباعة مصاحف','printing Qurans')};
        alert(tr('تم استلام طلبك. سنتبرّع بـ $'+usd+' باسمك لصالح '+names[project]+' وسنؤكّد لك ذلك قريباً. جزاك الله خيراً 🌿',
                 'Request received. We will donate $'+usd+' in your name for '+names[project]+' and confirm soon. May Allah reward you 🌿'));
    }
};

// =======================================================
//  جدار الاشتراك (Paywall) + صفحة المقارنة
// =======================================================
const PRO_FEATURES = [
    { ar:'أسرع معدّل لكسب نقاط الأنوار (×4)', en:'Fastest PlusPoints earning (×4)', free:'×1', pro:'×4' },
    { ar:'نظام التحديات والمراحل الصارمة', en:'Phase-based strict challenges', free:'—', pro:'✓' },
    { ar:'وضع السفر الذكي', en:'Smart travel mode', free:'—', pro:'✓' },
    { ar:'تحديات الوقف الخيري', en:'Charity waqf challenges', free:'—', pro:'✓' },
    { ar:'المحفظة المشتركة', en:'Shared wallet', free:'—', pro:'✓' },
    { ar:'القرآن والأذكار والصلاة والقبلة', en:'Quran, Adhkar, Prayer & Qibla', free:'✓', pro:'✓' },
    { ar:'التفاعل الحي والتدبّر الذكي', en:'Live activities & smart tadabbur', free:'✓', pro:'✓' },
];
window.AnwarPremium2 = {
    openPlans:function(){
        ensureModal('plans-modal', tr('خطة الأنوار المميّزة','Al-Anwar Premium'));
        const rows=PRO_FEATURES.map(f=>`<tr><td>${L()==='en'?f.en:f.ar}</td><td class="pc-free">${f.free}</td><td class="pc-pro">${f.pro}</td></tr>`).join('');
        $('plans-modal-body').innerHTML=`
          <p style="text-align:center;color:var(--text-soft,#9a8f7a);font-size:0.86rem;margin-bottom:14px;">
            ${tr('اشتراكك ليس رسوماً، بل استثمار في التزامك وأثرٌ خيري يتجدّد. يمكنك استبدال نقاطك بـ 1$ لكل 100 نقطة (تبرّعاً باسمك).',
                 'Your subscription is an investment in your commitment and a renewing charitable impact. Redeem points at $1 per 100 (donated in your name).')}
          </p>
          <table class="plan-compare"><thead><tr><th>${tr('الميزة','Feature')}</th><th>${tr('مجاني','Free')}</th><th class="pc-pro">${tr('مميّز','Pro')}</th></tr></thead><tbody>${rows}</tbody></table>
          <div class="plan-prices">
            <button class="plan-card" onclick="AnwarPremium2.subscribe('monthly')"><span class="pp-name">${tr('شهري','Monthly')}</span><span class="pp-price">$2.99<small>/${tr('شهر','mo')}</small></span></button>
            <button class="plan-card best" onclick="AnwarPremium2.subscribe('yearly')"><span class="pp-badge">${tr('الأوفر','Best value')}</span><span class="pp-name">${tr('سنوي','Yearly')}</span><span class="pp-price">$19.99<small>/${tr('سنة','yr')}</small></span></button>
          </div>
          <p style="text-align:center;font-size:0.72rem;color:var(--text-muted);margin-top:10px;">${tr('يُدار الاشتراك عبر App Store ويمكن إلغاؤه في أي وقت.','Billed via App Store, cancel anytime.')}</p>`;
        $('plans-modal').classList.add('active');
    },
    subscribe:function(plan){
        // ربط الشراء الفعلي يتم عبر In-App Purchase (cordova-plugin-purchase) بعد إنشاء المنتجات في App Store Connect
        if(window.PRO && PRO.purchaseSub){ PRO.purchaseSub(plan); return; }
        alert(tr('سيتم تفعيل الدفع عبر App Store بعد اعتماد منتجات الاشتراك. (للتجربة: فعّل من الإعدادات)',
                 'App Store billing activates after subscription products are approved. (For testing: enable in Settings)'));
    }
};
// جدار الحماية: استدعِها قبل أي ميزة مدفوعة
window.requirePremium = function(featureAr, featureEn){
    if(isPremium()) return true;
    ensureModal('paywall-modal', tr('ميزة للمشتركين','Premium feature'));
    $('paywall-modal-body').innerHTML=`
        <div style="text-align:center;padding:6px 0 12px;">
          <div class="pw-crown"><i class="fa-solid fa-crown"></i></div>
          <p style="font-size:0.95rem;margin:12px 0;">${tr('ميزة «'+featureAr+'» متاحة لمشتركي الأنوار المميّز.','“'+(featureEn||featureAr)+'” is available for Al-Anwar Premium members.')}</p>
          <button class="tasbeeh-pill" style="width:100%;" onclick="document.getElementById('paywall-modal').classList.remove('active');AnwarPremium2.openPlans();">
            <i class="fa-solid fa-crown"></i> ${tr('اشترك الآن','Subscribe now')}</button>
        </div>`;
    $('paywall-modal').classList.add('active');
    return false;
};

// ---------- مودال عام ----------
function ensureModal(id, title){
    let m=$(id);
    if(!m){ m=document.createElement('div'); m.id=id; m.className='qibla-overlay';
        m.innerHTML=`<div class="qibla-modal" style="width:94%;max-width:440px;text-align:right;max-height:86vh;overflow-y:auto;">
            <button class="close-qibla" onclick="document.getElementById('${id}').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
            <h2 id="${id}-title" style="color:var(--accent-color);margin-bottom:14px;text-align:center;"></h2>
            <div id="${id}-body"></div></div>`;
        document.body.appendChild(m);
    }
    $(id+'-title').textContent=title;
    return m;
}

function renderAll(){ window.renderPointsDashboard&&renderPointsDashboard(); window.renderAthkarShortcut&&renderAthkarShortcut(); }

// ---------- الحقن في الواجهة ----------
function inject(){
    const home=$('tab-home'); if(!home) return;
    const hero=home.querySelector('.hero-section');
    if(hero && !$('points-dash')){
        const d=document.createElement('div'); d.id='points-dash'; hero.insertAdjacentElement('afterend', d);
        const a=document.createElement('div'); a.id='athkar-shortcut'; d.insertAdjacentElement('afterend', a);
    }
    renderAll();
    // إعداد اختبار في الإعدادات (تفعيل المميّز مؤقتاً)
    try{
        const list=document.querySelector('#tab-settings .settings-list');
        if(list && !$('premium-test-row')){
            const row=document.createElement('div'); row.className='setting-item'; row.id='premium-test-row';
            row.innerHTML=`<span class="set-ico"><i class="fa-solid fa-crown"></i></span><span class="set-label">${tr('خطة الأنوار المميّزة','Al-Anwar Premium')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i>`;
            row.onclick=()=>AnwarPremium2.openPlans();
            list.appendChild(row);
        }
    }catch(e){}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject,800));
else setTimeout(inject,800);
// أعد الرسم عند ضبط أوقات الصلاة (لتحديث اختصار الأذكار)
const _sp=window.setPrayerTimings;
if(typeof _sp==='function'){ window.setPrayerTimings=function(){ const r=_sp.apply(this,arguments); try{renderAthkarShortcut();}catch(e){} return r; }; }
})();
