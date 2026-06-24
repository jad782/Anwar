// =======================================================
//  points.js — نقاط الأنوار (تحفيز داخلي فقط، بلا أي تحويل مالي)
//  مهام يومية تمنح نقاطاً → تفتح مكافآت (خطوط مصحف، ثيم، شارة).
//  اختصار صغير في الواجهة + اختصار الأذكار حسب الوقت + جدار الاشتراك.
//  مستقل وآمن على الويب وداخل Capacitor.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function today(){ return new Date().toISOString().slice(0,10); }

const PT_KEY='anwar_points', LOG_KEY='anwar_daily_log', PREM_KEY='anwar_premium';
const CH_KEY='anwar_challenges';   // {date, ids:[]}
const FONT_KEY='quran_font';       // '', 'naskh', 'othmani'

function loadPts(){ try{ return JSON.parse(localStorage.getItem(PT_KEY)||'{"balance":0,"lifetime":0}'); }catch(e){ return {balance:0,lifetime:0}; } }
function savePts(p){ localStorage.setItem(PT_KEY, JSON.stringify(p)); }
function loadLog(){ try{ return JSON.parse(localStorage.getItem(LOG_KEY)||'{}'); }catch(e){ return {}; } }
function saveLog(l){ localStorage.setItem(LOG_KEY, JSON.stringify(l)); }
function isPremium(){ return localStorage.getItem(PREM_KEY)==='true'; }
window.AnwarPremium = { is:isPremium, setForTesting:(v)=>{ localStorage.setItem(PREM_KEY, v?'true':'false'); renderAll(); } };

function loadDone(){ try{ const d=JSON.parse(localStorage.getItem(CH_KEY)||'{}'); if(d.date!==today()) return {date:today(),ids:[]}; return d; }catch(e){ return {date:today(),ids:[]}; } }
function saveDone(d){ localStorage.setItem(CH_KEY, JSON.stringify(d)); }
function logToday(){ const l=loadLog(); const d=today(); l[d]=(l[d]||0)+1; saveLog(l); }

// ---------- المهام اليومية ----------
// مجاني: المهام غير المميّزة (5 مهام × 3 = 15 نقطة)
// مشترك: كل المهام (8 مهام: 5×3 + 3×5 = 30 نقطة)
const CHALLENGES = [
    { id:'morning',  ar:'قراءة أذكار الصباح',         en:'Morning adhkar',        pts:3, ico:'fa-sun' },
    { id:'evening',  ar:'قراءة أذكار المساء',         en:'Evening adhkar',        pts:3, ico:'fa-moon' },
    { id:'page',     ar:'قراءة صفحة من المصحف',        en:'Read a Mushaf page',    pts:3, ico:'fa-book-quran' },
    { id:'tasbeeh',  ar:'مئة تسبيحة',                  en:'100 tasbeeh',           pts:3, ico:'fa-ring' },
    { id:'salah',    ar:'الصلاة على النبي ﷺ عشراً',    en:'Salah on Prophet ×10',  pts:3, ico:'fa-heart' },
    { id:'nawafil',  ar:'صلاة نافلة',                  en:'Voluntary prayer',      pts:5, ico:'fa-person-praying', premium:true },
    { id:'juz',      ar:'قراءة جزء كامل',              en:'Read a full Juz',       pts:5, ico:'fa-bookmark',       premium:true },
    { id:'tadabbur', ar:'دعاء وتدبّر آية',             en:'Du\'a & tadabbur',      pts:5, ico:'fa-lightbulb',     premium:true },
];
function visibleChallenges(){ return isPremium() ? CHALLENGES : CHALLENGES.filter(c=>!c.premium); }
function maxDaily(){ return visibleChallenges().reduce((s,c)=>s+c.pts,0); } // 15 مجاني / 30 مشترك

window.AnwarChallenge = {
    toggle:function(id){
        const c=CHALLENGES.find(x=>x.id===id); if(!c) return;
        if(c.premium && !isPremium()){ window.requirePremium(c.ar, c.en); return; }
        const d=loadDone();
        if(d.ids.includes(id)) return; // لا يُلغى بعد الإنجاز (يُحفظ)
        d.ids.push(id); saveDone(d);
        const p=loadPts(); p.balance+=c.pts; p.lifetime=(p.lifetime||0)+c.pts; savePts(p);
        logToday(); ptToast('+'+c.pts+' '+tr('نقطة','pts')+' ✨'); checkRewards(); renderAll();
    }
};

// كسب نقاط من أفعال أخرى (يُستخدم داخلياً)
window.awardPoints = function(base){ const p=loadPts(); const g=Math.max(1, base||1); p.balance+=g; p.lifetime=(p.lifetime||0)+g; savePts(p); logToday(); ptToast('+'+g+' '+tr('نقطة','pts')); checkRewards(); renderAll(); return g; };

function ptToast(msg){ let t=$('pt-toast'); if(!t){ t=document.createElement('div'); t.id='pt-toast'; t.className='pt-toast'; document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove('show'),2000); }

// ---------- المكافآت (تُفتح بالنقاط — تحفيز فقط) ----------
const REWARDS = [
    { id:'badge',   need:50,  ar:'شارة «عضو مواظب»',     en:'“Committed” badge',  ico:'fa-medal' },
    { id:'naskh',   need:100, ar:'خط مصحف: نسخ',         en:'Mushaf font: Naskh', ico:'fa-font' },
    { id:'othmani', need:180, ar:'خط مصحف: عثماني فخم',  en:'Mushaf font: Othmani',ico:'fa-pen-nib' },
    { id:'theme',   need:300, ar:'ثيم ذهبي ملكي',        en:'Royal gold theme',   ico:'fa-palette' },
];
function unlocked(id){ const r=REWARDS.find(x=>x.id===id); return r && loadPts().lifetime>=r.need; }
function checkRewards(){
    const life=loadPts().lifetime;
    REWARDS.forEach(r=>{ const k='reward_seen_'+r.id; if(life>=r.need && !localStorage.getItem(k)){ localStorage.setItem(k,'1'); setTimeout(()=>ptToast('🎁 '+tr('فتحت: ','Unlocked: ')+ (L()==='en'?r.en:r.ar)),600); } });
}
window.AnwarReward = {
    applyFont:function(f){ if(!unlocked(f) && f) { window.requirePremiumPoints && window.requirePremiumPoints(); return; } localStorage.setItem(FONT_KEY, f); applyFont(); renderPointsPage(); },
};
function applyFont(){ const f=localStorage.getItem(FONT_KEY)||''; document.body.classList.remove('qfont-naskh','qfont-othmani'); if(f==='naskh')document.body.classList.add('qfont-naskh'); if(f==='othmani')document.body.classList.add('qfont-othmani'); if(unlocked('theme')&&localStorage.getItem('theme_royal')==='1') document.body.classList.add('theme-royal'); }
window.AnwarTheme = { toggleRoyal:function(){ if(!unlocked('theme')) return; const on=localStorage.getItem('theme_royal')==='1'; localStorage.setItem('theme_royal', on?'0':'1'); applyFont(); renderPointsPage(); } };

// =======================================================
//  صفحة النقاط (تُفتح من الاختصار الصغير) — مجانية للجميع
// =======================================================
function heatmapHTML(){ const log=loadLog(); const now=new Date(); const cells=[]; for(let i=83;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); const key=d.toISOString().slice(0,10); const v=log[key]||0; let lvl=0; if(v>=1)lvl=1; if(v>=2)lvl=2; if(v>=4)lvl=3; if(v>=6)lvl=4; cells.push(`<span class="hm-cell hm-l${lvl}"></span>`);} return `<div class="hm-grid">${cells.join('')}</div>`; }

window.renderPointsPage = function(){
    const body=$('points-modal-body'); if(!body) return;
    const p=loadPts(); const d=loadDone(); const earnedToday=visibleChallenges().filter(c=>d.ids.includes(c.id)).reduce((s,c)=>s+c.pts,0);
    const chRows=CHALLENGES.map(c=>{
        const locked=c.premium && !isPremium();
        const done=d.ids.includes(c.id);
        return `<div class="ch-task ${done?'done':''} ${locked?'locked':''}" onclick="AnwarChallenge.toggle('${c.id}')">
            <span class="ch-ico"><i class="fa-solid ${locked?'fa-lock':c.ico}"></i></span>
            <span class="ch-name">${L()==='en'?c.en:c.ar}</span>
            <span class="ch-pts">${done?'<i class=\'fa-solid fa-check\'></i>':'+'+c.pts}</span></div>`;
    }).join('');
    const rwRows=REWARDS.map(r=>{
        const ok=unlocked(r.id);
        let action='';
        if(ok){
            if(r.id==='naskh'||r.id==='othmani'){ const active=(localStorage.getItem(FONT_KEY)||'')===r.id; action=`<button class="rw-btn ${active?'on':''}" onclick="event.stopPropagation();AnwarReward.applyFont('${active?'':r.id}')">${active?tr('مُفعّل','On'):tr('تفعيل','Use')}</button>`; }
            else if(r.id==='theme'){ const active=localStorage.getItem('theme_royal')==='1'; action=`<button class="rw-btn ${active?'on':''}" onclick="event.stopPropagation();AnwarTheme.toggleRoyal()">${active?tr('مُفعّل','On'):tr('تفعيل','Use')}</button>`; }
            else action=`<span class="rw-done"><i class="fa-solid fa-check"></i></span>`;
        } else action=`<span class="rw-need">${r.need} ${tr('نقطة','pts')}</span>`;
        return `<div class="rw-item ${ok?'ok':''}"><span class="rw-ico"><i class="fa-solid ${r.ico}"></i></span><span class="rw-name">${L()==='en'?r.en:r.ar}</span>${action}</div>`;
    }).join('');
    body.innerHTML=`
      <div class="pts-hero"><div class="pts-glow"></div>
        <span class="pts-bal"><i class="fa-solid fa-star"></i> ${p.balance}</span>
        <span class="pts-sub">${tr('إجمالي ما جمعته: ','Lifetime: ')}${p.lifetime||0} · ${isPremium()?tr('عضو مميّز','Premium'):tr('عضو مجاني','Free')}</span>
      </div>
      <p class="pts-explain">${tr('أنجز مهامك اليومية لتكسب النقاط، والنقاط تفتح لك خطوط مصحف وثيمات وشارات. (للتحفيز فقط — لا تحويل مالي).',
            'Complete daily tasks to earn points; points unlock Mushaf fonts, themes & badges. (Motivation only — no money).')}</p>
      <div class="pts-sec-title">${tr('مهام اليوم','Today tasks')} <span>${earnedToday}/${maxDaily()} ${tr('نقطة','pts')}</span></div>
      ${chRows}
      ${isPremium()?'':`<div class="pts-upsell" onclick="AnwarPremium2.openPlans()"><i class="fa-solid fa-crown"></i> ${tr('المشترك يفتح 8 مهام ويكسب 30 نقطة/يوم بدل 15','Premium unlocks 8 tasks & 30 pts/day instead of 15')}</div>`}
      <div class="pts-sec-title">${tr('مكافآت تُفتح بالنقاط','Rewards')}</div>
      ${rwRows}
      <div class="pts-sec-title">${tr('التزامك','Your commitment')}</div>
      ${heatmapHTML()}`;
};
window.AnwarPoints2 = { open:function(){ ensureModal('points-modal', tr('نقاط الأنوار','PlusPoints')); renderPointsPage(); $('points-modal').classList.add('active'); } };

// ---------- اختصار صغير في الواجهة ----------
window.renderPointsEntry = function(){
    const host=$('points-entry'); if(!host) return;
    const p=loadPts(); const d=loadDone(); const earned=visibleChallenges().filter(c=>d.ids.includes(c.id)).reduce((s,c)=>s+c.pts,0);
    host.innerHTML=`<div class="pts-entry" onclick="AnwarPoints2.open()">
        <span class="pe-ico"><i class="fa-solid fa-star"></i></span>
        <span class="pe-txt"><b>${p.balance}</b> ${tr('نقطة','pts')} · ${tr('مهام اليوم','today')} ${earned}/${maxDaily()}</span>
        <i class="fa-solid fa-chevron-left pe-go"></i></div>`;
};

// =======================================================
//  اختصار الأذكار حسب وقت الدخول — مجاني
// =======================================================
function toMin(s){ if(!s||s.indexOf(':')<0)return null; const [h,m]=s.split(':').map(Number); return h*60+m; }
function athkarContext(){
    let fajr=null,dhuhr=null,maghrib=null;
    try{ if(typeof prayerTimings!=='undefined'){ fajr=toMin(prayerTimings.Fajr); dhuhr=toMin(prayerTimings.Dhuhr); maghrib=toMin(prayerTimings.Maghrib);} }catch(e){}
    const now=new Date(); const cur=now.getHours()*60+now.getMinutes();
    if(fajr!=null&&dhuhr!=null&&maghrib!=null){
        if(cur>=fajr&&cur<dhuhr) return {key:'morning',ar:'أذكار الصباح',en:'Morning Adhkar',ico:'fa-sun'};
        if(cur>=maghrib||cur<fajr) return {key:'evening',ar:'أذكار المساء',en:'Evening Adhkar',ico:'fa-moon'};
        return {key:null,ar:'اقرأ أذكارك',en:'Read your Adhkar',ico:'fa-hands-praying'};
    }
    const h=now.getHours();
    if(h>=4&&h<12) return {key:'morning',ar:'أذكار الصباح',en:'Morning Adhkar',ico:'fa-sun'};
    if(h>=17||h<4) return {key:'evening',ar:'أذكار المساء',en:'Evening Adhkar',ico:'fa-moon'};
    return {key:null,ar:'اقرأ أذكارك',en:'Read your Adhkar',ico:'fa-hands-praying'};
}
window.renderAthkarShortcut = function(){
    const host=$('athkar-shortcut'); if(!host) return; const c=athkarContext();
    host.innerHTML=`<div class="ath-shortcut-card" onclick="AnwarPoints.goAthkar('${c.key||''}')">
        <div class="asc-ico"><i class="fa-solid ${c.ico}"></i></div>
        <div class="asc-txt"><span class="asc-label">${tr('حان وقت','Time for')}</span><span class="asc-main">${L()==='en'?c.en:c.ar}</span></div>
        <i class="fa-solid fa-chevron-left asc-go"></i></div>`;
};
window.AnwarPoints = { goAthkar:function(key){
    if(typeof goToTab==='function') goToTab(2);
    setTimeout(()=>{ try{ if(window.QA&&QA.openCat&&key) QA.openCat('athkar',key); }catch(e){} },250);
    // علّم مهمة الأذكار المقابلة (مرة باليوم)
    if(key==='morning'||key==='evening'){ const d=loadDone(); if(!d.ids.includes(key)) window.AnwarChallenge.toggle(key); }
}};

// =======================================================
//  جدار الاشتراك (Paywall) + صفحة المقارنة
// =======================================================
const PRO_FEATURES = [
    { ar:'مهام يومية أكثر (8 بدل 5)', en:'More daily tasks (8 vs 5)', free:'5', pro:'8' },
    { ar:'نقاط أكثر يومياً (30 بدل 15)', en:'More points/day (30 vs 15)', free:'15', pro:'30' },
    { ar:'نظام التحديات والمراحل', en:'Phase challenges', free:'—', pro:'✓' },
    { ar:'وضع السفر الذكي', en:'Smart travel mode', free:'—', pro:'✓' },
    { ar:'المحفظة المشتركة', en:'Shared wallet', free:'—', pro:'✓' },
    { ar:'القرآن والأذكار والصلاة والقبلة', en:'Quran, Adhkar, Prayer & Qibla', free:'✓', pro:'✓' },
];
window.AnwarPremium2 = {
    openPlans:function(){
        ensureModal('plans-modal', tr('خطة الأنوار المميّزة','Al-Anwar Premium'));
        const rows=PRO_FEATURES.map(f=>`<tr><td>${L()==='en'?f.en:f.ar}</td><td class="pc-free">${f.free}</td><td class="pc-pro">${f.pro}</td></tr>`).join('');
        $('plans-modal-body').innerHTML=`
          <p style="text-align:center;color:var(--text-soft,#9a8f7a);font-size:0.86rem;margin-bottom:14px;">${tr('اشتراكك استثمار في التزامك ويفتح لك تحديات وميزات أعمق.','An investment in your commitment that unlocks deeper challenges & features.')}</p>
          <table class="plan-compare"><thead><tr><th>${tr('الميزة','Feature')}</th><th>${tr('مجاني','Free')}</th><th class="pc-pro">${tr('مميّز','Pro')}</th></tr></thead><tbody>${rows}</tbody></table>
          <div class="plan-prices">
            <button class="plan-card" onclick="AnwarPremium2.subscribe('monthly')"><span class="pp-name">${tr('شهري','Monthly')}</span><span class="pp-price">$2.99<small>/${tr('شهر','mo')}</small></span></button>
            <button class="plan-card best" onclick="AnwarPremium2.subscribe('yearly')"><span class="pp-badge">${tr('الأوفر','Best')}</span><span class="pp-name">${tr('سنوي','Yearly')}</span><span class="pp-price">$19.99<small>/${tr('سنة','yr')}</small></span></button>
          </div>
          <p style="text-align:center;font-size:0.72rem;color:var(--text-muted);margin-top:10px;">${tr('يُدار عبر App Store ويُلغى في أي وقت.','Billed via App Store, cancel anytime.')}</p>`;
        $('plans-modal').classList.add('active');
    },
    subscribe:function(plan){ if(window.PRO&&PRO.purchaseSub){ PRO.purchaseSub(plan); return; } alert(tr('يُفعّل الدفع عبر App Store بعد اعتماد منتجات الاشتراك.','App Store billing activates after subscription products are approved.')); }
};
window.requirePremium = function(ar,en){ if(isPremium())return true; ensureModal('paywall-modal', tr('ميزة للمشتركين','Premium feature'));
    $('paywall-modal-body').innerHTML=`<div style="text-align:center;padding:6px 0 12px;"><div class="pw-crown"><i class="fa-solid fa-crown"></i></div>
        <p style="font-size:0.95rem;margin:12px 0;">${tr('«'+ar+'» متاحة لمشتركي الأنوار المميّز.','“'+(en||ar)+'” is for Al-Anwar Premium members.')}</p>
        <button class="tasbeeh-pill" style="width:100%;" onclick="document.getElementById('paywall-modal').classList.remove('active');AnwarPremium2.openPlans();"><i class="fa-solid fa-crown"></i> ${tr('اشترك الآن','Subscribe now')}</button></div>`;
    $('paywall-modal').classList.add('active'); return false; };

// ---------- مودال عام ----------
function ensureModal(id,title){ let m=$(id); if(!m){ m=document.createElement('div'); m.id=id; m.className='qibla-overlay';
    m.innerHTML=`<div class="qibla-modal" style="width:94%;max-width:440px;text-align:right;max-height:88vh;overflow-y:auto;">
        <button class="close-qibla" onclick="document.getElementById('${id}').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
        <h2 id="${id}-title" style="color:var(--accent-color);margin-bottom:14px;text-align:center;"></h2>
        <div id="${id}-body"></div></div>`; document.body.appendChild(m);} $(id+'-title').textContent=title; return m; }

function renderAll(){ window.renderPointsEntry&&renderPointsEntry(); window.renderAthkarShortcut&&renderAthkarShortcut(); if($('points-modal')&&$('points-modal').classList.contains('active')) renderPointsPage(); }

// ---------- الحقن ----------
function inject(){
    const home=$('tab-home'); if(!home) return;
    const hero=home.querySelector('.hero-section');
    if(hero && !$('athkar-shortcut')){
        const a=document.createElement('div'); a.id='athkar-shortcut'; hero.insertAdjacentElement('afterend', a);
        const e=document.createElement('div'); e.id='points-entry'; a.insertAdjacentElement('afterend', e);
    }
    applyFont(); renderAll();
    try{ const list=document.querySelector('#tab-settings .settings-list');
        if(list && !$('premium-row')){ const row=document.createElement('div'); row.className='setting-item'; row.id='premium-row';
            row.innerHTML=`<span class="set-ico"><i class="fa-solid fa-crown"></i></span><span class="set-label">${tr('خطة الأنوار المميّزة','Al-Anwar Premium')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i>`;
            row.onclick=()=>AnwarPremium2.openPlans(); list.appendChild(row); }
    }catch(e){}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject,800));
else setTimeout(inject,800);
const _sp=window.setPrayerTimings;
if(typeof _sp==='function'){ window.setPrayerTimings=function(){ const r=_sp.apply(this,arguments); try{renderAthkarShortcut();}catch(e){} return r; }; }
})();
