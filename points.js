// =======================================================
//  points.js — نقاط الأنوار (تحفيز داخلي، كل شيء مجاني، بلا اشتراك)
//  مهام يومية تمنح نقاطاً → تُصرف النقاط لفتح ميزات (دائمة أو مؤقتة).
//  اختصار صغير في الواجهة + اختصار الأذكار حسب الوقت.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function today(){ return new Date().toISOString().slice(0,10); }
const DAY=86400000;

const PT_KEY='anwar_points', LOG_KEY='anwar_daily_log', CH_KEY='anwar_challenges';
const UNLOCK_KEY='anwar_unlocks', FONT_KEY='quran_font', THEME_KEY='anwar_theme', READBG_KEY='anwar_readbg';

function loadPts(){ try{ return JSON.parse(localStorage.getItem(PT_KEY)||'{"balance":0,"lifetime":0}'); }catch(e){ return {balance:0,lifetime:0}; } }
function savePts(p){ localStorage.setItem(PT_KEY, JSON.stringify(p)); }
function loadLog(){ try{ return JSON.parse(localStorage.getItem(LOG_KEY)||'{}'); }catch(e){ return {}; } }
function saveLog(l){ localStorage.setItem(LOG_KEY, JSON.stringify(l)); }
function loadDone(){ try{ const d=JSON.parse(localStorage.getItem(CH_KEY)||'{}'); if(d.date!==today())return {date:today(),ids:[]}; return d; }catch(e){ return {date:today(),ids:[]}; } }
function saveDone(d){ localStorage.setItem(CH_KEY, JSON.stringify(d)); }
function loadUnlocks(){ try{ return JSON.parse(localStorage.getItem(UNLOCK_KEY)||'{}'); }catch(e){ return {}; } }
function saveUnlocks(u){ localStorage.setItem(UNLOCK_KEY, JSON.stringify(u)); }
function logToday(){ const l=loadLog(); const d=today(); l[d]=(l[d]||0)+1; saveLog(l); }

function ptToast(msg){ let t=$('pt-toast'); if(!t){ t=document.createElement('div'); t.id='pt-toast'; t.className='pt-toast'; document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove('show'),2000); }

// ---------- المهام اليومية (كلها مجانية — 8 مهام = 30 نقطة) ----------
const CHALLENGES = [
    { id:'morning',  ar:'قراءة أذكار الصباح',        en:'Morning adhkar',       pts:3, ico:'fa-sun' },
    { id:'evening',  ar:'قراءة أذكار المساء',        en:'Evening adhkar',       pts:3, ico:'fa-moon' },
    { id:'page',     ar:'قراءة صفحة من المصحف',       en:'Read a Mushaf page',   pts:3, ico:'fa-book-quran' },
    { id:'tasbeeh',  ar:'مئة تسبيحة',                 en:'100 tasbeeh',          pts:3, ico:'fa-ring' },
    { id:'salah',    ar:'الصلاة على النبي ﷺ عشراً',   en:'Salah on Prophet ×10', pts:3, ico:'fa-heart' },
    { id:'nawafil',  ar:'صلاة نافلة',                 en:'Voluntary prayer',     pts:5, ico:'fa-person-praying' },
    { id:'juz',      ar:'قراءة جزء كامل',             en:'Read a full Juz',      pts:5, ico:'fa-bookmark' },
    { id:'tadabbur', ar:'دعاء وتدبّر آية',            en:'Du\'a & tadabbur',     pts:5, ico:'fa-lightbulb' },
];
function maxDaily(){ return CHALLENGES.reduce((s,c)=>s+c.pts,0); } // 30
window.AnwarChallenge = {
    toggle:function(id){
        const c=CHALLENGES.find(x=>x.id===id); if(!c) return;
        const d=loadDone(); if(d.ids.includes(id)) return; // يُحفظ، لا يُلغى
        d.ids.push(id); saveDone(d);
        const p=loadPts(); p.balance+=c.pts; p.lifetime=(p.lifetime||0)+c.pts; savePts(p);
        logToday(); ptToast('+'+c.pts+' '+tr('نقطة','pts')+' ✨'); renderAll();
    },
    // ينقل المستخدم للمكان الصحيح لأداء المهمة، ثم يرجع ويضغط «تم»
    go:function(id){
        const close=()=>{ const m=$('points-modal'); if(m) m.classList.remove('active'); };
        if(id==='morning'||id==='evening'){ close(); window.AnwarPoints.goAthkar(id); return; }
        if(id==='tasbeeh'){ close(); if(typeof goToTab==='function') goToTab(2); return; }
        if(id==='page'||id==='juz'||id==='tadabbur'){ close(); if(typeof goToTab==='function') goToTab(1); return; }
        // مهام بلا وجهة (نافلة/صلاة على النبي): علّمها مباشرة
        AnwarChallenge.toggle(id);
    }
};
window.awardPoints = function(){ return 0; }; // نظام النقاط مُلغى

// ---------- المكافآت (تُصرف بالنقاط) ----------
// perm = دائمة بسعر واحد | rent = مؤقتة (شهر/3 أشهر) وتتقفل عند انتهاء المدة
const REWARDS = [
    { id:'badge',         type:'perm', cost:50,  ar:'شارة «عضو الأنوار»',  en:'“Anwar Member” badge', ico:'fa-medal' },
    { id:'naskh',         type:'rent', ar:'خط مصحف: نسخ',         en:'Naskh Mushaf font',   ico:'fa-font',    kind:'font' },
    { id:'othmani',       type:'rent', ar:'خط مصحف: عثماني فخم',  en:'Othmani Mushaf font', ico:'fa-pen-nib', kind:'font' },
    { id:'theme_royal',   type:'rent', ar:'ثيم ذهبي ملكي',        en:'Royal gold theme',    ico:'fa-crown',   kind:'theme' },
    { id:'theme_emerald', type:'rent', ar:'ثيم أخضر زمردي',       en:'Emerald theme',       ico:'fa-palette', kind:'theme' },
    { id:'theme_night',   type:'rent', ar:'ثيم أزرق ليلي',        en:'Night blue theme',    ico:'fa-moon',    kind:'theme' },
    { id:'theme_rose',    type:'rent', ar:'ثيم وردي هادئ',        en:'Soft rose theme',     ico:'fa-spa',     kind:'theme' },
    { id:'readbg_royal',  type:'rent', ar:'خلفية قراءة: ورق ملكي', en:'Royal reading bg',   ico:'fa-scroll',  kind:'readbg' },
    { id:'readbg_night',  type:'rent', ar:'خلفية قراءة: ليل مرصّع',en:'Starry reading bg',  ico:'fa-star',    kind:'readbg' },
];
const RENT_OPTS = [ {days:30, cost:200, ar:'شهر', en:'1 month'}, {days:90, cost:350, ar:'3 أشهر', en:'3 months'} ];
function isActive(id){ const r=REWARDS.find(x=>x.id===id); if(!r) return false;
    // عضو بريميوم: حزمة التخصيص الكاملة مفتوحة دائماً (خطوط + ثيمات + خلفيات)
    if(localStorage.getItem('anwar_premium')==='true') return true;
    const u=loadUnlocks();
    if(r.type==='perm') return u[id]===true;
    return (u[id]||0) > Date.now();
}
function daysLeft(id){ const u=loadUnlocks(); const exp=u[id]||0; return Math.max(0, Math.ceil((exp-Date.now())/DAY)); }

window.AnwarReward = {
    buy:function(id, days, cost){
        const p=loadPts();
        const r=REWARDS.find(x=>x.id===id); if(!r) return;
        if(r.type==='perm'){ days=0; cost=r.cost; }
        if(p.balance < cost){ alert(tr('رصيدك '+p.balance+' نقطة، تحتاج '+cost+' نقطة.','You have '+p.balance+' pts, need '+cost+'.')); return; }
        if(!confirm(tr('سيتم خصم '+cost+' نقطة. متابعة؟','Spend '+cost+' points?'))) return;
        p.balance-=cost; savePts(p);
        const u=loadUnlocks();
        if(r.type==='perm'){ u[id]=true; }
        else { const base=Math.max(Date.now(), u[id]||0); u[id]=base + days*DAY; }
        saveUnlocks(u);
        // فعّلها تلقائياً
        if(r.kind==='font') localStorage.setItem(FONT_KEY, id);
        if(r.kind==='theme') localStorage.setItem(THEME_KEY, id);
        if(r.kind==='readbg') localStorage.setItem(READBG_KEY, id);
        applyVisual(); renderAll();
        ptToast(tr('تم الفتح 🎁','Unlocked 🎁'));
    },
    use:function(id){
        if(!isActive(id)) return;
        const r=REWARDS.find(x=>x.id===id);
        if(r.kind==='font'){ const cur=localStorage.getItem(FONT_KEY)||''; localStorage.setItem(FONT_KEY, cur===id?'':id); }
        if(r.kind==='theme'){ const cur=localStorage.getItem(THEME_KEY)||''; localStorage.setItem(THEME_KEY, cur===id?'':id); }
        if(r.kind==='readbg'){ const cur=localStorage.getItem(READBG_KEY)||''; localStorage.setItem(READBG_KEY, cur===id?'':id); }
        applyVisual(); renderPointsPage();
    }
};
const APP_THEMES = [
    { id:'',             ar:'ليل ذهبي',   en:'Golden Night', dot:'linear-gradient(135deg,#D4A843,#14110B)' },
    { id:'oled',         ar:'ليل خالص',   en:'Pure Black',   dot:'linear-gradient(135deg,#F2D27A,#000)' },
    { id:'light',        ar:'نهاري فاتح', en:'Daylight',     dot:'linear-gradient(135deg,#FAF6EE,#D4A843)' },
    { id:'emerald-deep', ar:'أخضر زمردي', en:'Emerald',      dot:'linear-gradient(135deg,#3FB984,#08160F)' },
    { id:'navy',         ar:'أزرق ليلي',  en:'Night Blue',   dot:'linear-gradient(135deg,#5B8DEF,#070C18)' },
    { id:'purple',       ar:'بنفسجي ملكي',en:'Royal Purple', dot:'linear-gradient(135deg,#B266E0,#120818)' },
    { id:'rosewood',     ar:'خشب وردي',   en:'Rosewood',     dot:'linear-gradient(135deg,#D98E78,#1A0C0A)' },
];
function applyAppTheme(){
    // الافتراضي عند أول تنزيل: الثيم النهاري الفاتح
    if(localStorage.getItem('app_theme')===null){ localStorage.setItem('app_theme','light'); if(localStorage.getItem('lightMode')===null) localStorage.setItem('lightMode','true'); }
    const t = localStorage.getItem('app_theme')||'';
    document.body.classList.remove('light-mode','theme-oled','theme-emerald-deep','theme-navy','theme-purple','theme-rosewood');
    if(t==='light') document.body.classList.add('light-mode');
    else if(t==='oled') document.body.classList.add('theme-oled');
    else if(t==='emerald-deep') document.body.classList.add('theme-emerald-deep');
    else if(t==='navy') document.body.classList.add('theme-navy');
    else if(t==='purple') document.body.classList.add('theme-purple');
    else if(t==='rosewood') document.body.classList.add('theme-rosewood');
}
window.applyAppTheme = applyAppTheme;
window.AnwarTheme2 = {
    open:function(){
        ensureModal('apptheme-modal', tr('المظهر والخلفية','Theme & background'));
        AnwarTheme2._render();
        $('apptheme-modal').classList.add('active');
    },
    _render:function(){
        const cur=localStorage.getItem('app_theme')||'';
        $('apptheme-modal-body').innerHTML = `<p style="text-align:center;color:var(--text-muted);font-size:0.82rem;margin-bottom:14px;">${tr('اختر مظهراً فخماً — تبقى الكتابات واضحة في كل ثيم.','Pick a luxurious theme — text stays clear in all.')}</p>
            <div class="theme-swatches2">${APP_THEMES.map(t=>`<div class="theme-sw2 ${t.id===cur?'on':''}" onclick="AnwarTheme2.set('${t.id}')"><div class="ts-dot" style="background:${t.dot}"></div><div class="ts-name">${L()==='en'?t.en:t.ar}</div></div>`).join('')}</div>`;
    },
    set:function(id){ localStorage.setItem('app_theme', id); applyAppTheme(); AnwarTheme2._render(); }
};
function applyVisual(){
    applyAppTheme();
    // الخط
    let f=localStorage.getItem(FONT_KEY)||''; if(f && !isActive(f)){ f=''; localStorage.setItem(FONT_KEY,''); }
    document.body.classList.remove('qfont-naskh','qfont-othmani');
    if(f==='naskh') document.body.classList.add('qfont-naskh');
    if(f==='othmani') document.body.classList.add('qfont-othmani');
    // الثيم
    let t=localStorage.getItem(THEME_KEY)||''; if(t && !isActive(t)){ t=''; localStorage.setItem(THEME_KEY,''); }
    document.body.classList.remove('theme-royal','theme-emerald','theme-night','theme-rose');
    if(t==='theme_royal') document.body.classList.add('theme-royal');
    if(t==='theme_emerald') document.body.classList.add('theme-emerald');
    if(t==='theme_night') document.body.classList.add('theme-night');
    if(t==='theme_rose') document.body.classList.add('theme-rose');
    // خلفية القراءة
    let rb=localStorage.getItem(READBG_KEY)||''; if(rb && !isActive(rb)){ rb=''; localStorage.setItem(READBG_KEY,''); }
    document.body.classList.remove('readbg-royal','readbg-night');
    if(rb==='readbg_royal') document.body.classList.add('readbg-royal');
    if(rb==='readbg_night') document.body.classList.add('readbg-night');
}
window.applyAnwarVisual = applyVisual;

// ---------- خريطة الالتزام بأرقام الأيام ----------
function heatmapHTML(){
    const log=loadLog();
    const active=Object.keys(log).filter(k=>log[k]>0).sort();
    const idx={}; active.forEach((d,i)=>idx[d]=i+1);
    const now=new Date(); const cells=[];
    for(let i=41;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); const key=d.toISOString().slice(0,10); const n=idx[key];
        cells.push(`<span class="hm-cell ${n?'on':''}">${n||''}</span>`); }
    return `<div class="hm-grid">${cells.join('')}</div>`;
}

// ---------- صفحة النقاط ----------
window.renderPointsPage = function(){
    const body=$('points-modal-body'); if(!body) return;
    const p=loadPts(); const d=loadDone();
    const earned=CHALLENGES.filter(c=>d.ids.includes(c.id)).reduce((s,c)=>s+c.pts,0);
    const hasBadge=isActive('badge');
    const chRows=CHALLENGES.map(c=>{ const done=d.ids.includes(c.id);
        const btn = done ? `<span class="ch-pts done"><i class="fa-solid fa-check"></i></span>`
                         : `<button class="ch-claim" onclick="event.stopPropagation();AnwarChallenge.toggle('${c.id}')">${tr('تم','Done')} +${c.pts}</button>`;
        return `<div class="ch-task ${done?'done':''}" onclick="AnwarChallenge.go('${c.id}')">
            <span class="ch-ico"><i class="fa-solid ${c.ico}"></i></span>
            <span class="ch-name">${L()==='en'?c.en:c.ar}</span>
            ${btn}</div>`; }).join('');
    const rwRows=REWARDS.map(r=>{
        const active=isActive(r.id);
        let right='';
        if(r.type==='perm'){
            right = active ? `<span class="rw-done"><i class="fa-solid fa-check"></i> ${tr('مملوكة','Owned')}</span>`
                           : `<button class="rw-btn" onclick="event.stopPropagation();AnwarReward.buy('${r.id}')">${r.cost} ${tr('نقطة','pts')}</button>`;
        } else if(active){
            const curKey=r.kind==='font'?FONT_KEY:(r.kind==='readbg'?READBG_KEY:THEME_KEY);
            const cur=localStorage.getItem(curKey)===r.id;
            right = `<div class="rw-active"><span class="rw-left">${daysLeft(r.id)} ${tr('يوم','d')}</span>
                <button class="rw-btn ${cur?'on':''}" onclick="event.stopPropagation();AnwarReward.use('${r.id}')">${cur?tr('مُفعّل','On'):tr('تفعيل','Use')}</button></div>`;
        } else {
            right = `<div class="rw-rent">` + RENT_OPTS.map(o=>`<button class="rw-btn sm" onclick="event.stopPropagation();AnwarReward.buy('${r.id}',${o.days},${o.cost})">${L()==='en'?o.en:o.ar}<small>${o.cost}</small></button>`).join('') + `</div>`;
        }
        return `<div class="rw-item ${active?'ok':''}"><span class="rw-ico"><i class="fa-solid ${r.ico}"></i></span><span class="rw-name">${L()==='en'?r.en:r.ar}</span>${right}</div>`;
    }).join('');
    body.innerHTML=`
      <div class="pts-hero"><div class="pts-glow"></div>
        <span class="pts-bal"><i class="fa-solid fa-star"></i> ${p.balance}</span>
        <span class="pts-sub">${tr('مجموع ما جمعته: ','Lifetime: ')}${p.lifetime||0} ${tr('نقطة','pts')}</span>
        ${hasBadge?`<div class="member-badge"><i class="fa-solid fa-medal"></i> ${tr('عضو الأنوار','Anwar Member')}</div>`:''}
      </div>
      <p class="pts-explain">${tr('أنجز مهامك اليومية لتجمع النقاط، ثم اصرفها لفتح خطوط مصحف وثيمات وشارات.','Complete daily tasks to collect points, then spend them to unlock Mushaf fonts, themes & badges.')}</p>
      <div class="pts-sec-title">${tr('مهام اليوم','Today tasks')} <span>${earned}/${maxDaily()} ${tr('نقطة','pts')}</span></div>
      ${chRows}
      <div class="pts-sec-title">${tr('المتجر — افتح بالنقاط','Store — unlock with points')}</div>
      ${rwRows}
      <div class="pts-sec-title">${tr('التزامك (رقم اليوم)','Commitment (day #)')}</div>
      ${heatmapHTML()}`;
};
window.AnwarPoints2 = { open:function(){ ensureModal('points-modal', tr('نقاط الأنوار','PlusPoints')); renderPointsPage(); $('points-modal').classList.add('active'); } };

// ---------- حسابي (ملف محلي — بلا تسجيل) ----------
function amRow(ico, ar, en, onclick, isNew){
    return `<div class="am-row" onclick="${onclick}">
        <span class="am-ico"><i class="fa-solid ${ico}"></i></span>
        <span class="am-label">${L()==='en'?en:ar}${isNew?` <span class="am-new">${tr('جديد','NEW')}</span>`:''}</span>
        <i class="fa-solid fa-chevron-left am-go"></i></div>`;
}
window.AnwarProfile = {
    _toSettings:function(){ const m=$('profile-modal'); if(m) m.classList.remove('active'); if(typeof goToTab==='function') goToTab(3); },
    open:function(){
        ensureModal('profile-modal', tr('حسابي','My Account'));
        const p=loadPts(); const name=localStorage.getItem('anwar_name')||'';
        const badge=isActive('badge');
        const activeRewards=REWARDS.filter(r=>r.type==='rent'&&isActive(r.id)).map(r=>`<span class="prof-chip">${L()==='en'?r.en:r.ar} · ${daysLeft(r.id)}${tr('ي','d')}</span>`).join('') || `<span style="color:var(--text-muted);font-size:0.82rem;">${tr('لا مكافآت مؤقتة مفعّلة','No active rewards')}</span>`;
        $('profile-modal-body').innerHTML=`
          <div class="prof-head">
            <div class="prof-avatar"><i class="fa-solid fa-user"></i></div>
            <input id="prof-name" class="modal-input" style="text-align:center;margin:10px 0 4px;" placeholder="${tr('اكتب اسمك (اختياري)','Your name (optional)')}" value="${name.replace(/"/g,'&quot;')}" onchange="AnwarProfile.save()">
            ${badge?`<div class="member-badge"><i class="fa-solid fa-medal"></i> ${tr('عضو الأنوار','Anwar Member')}</div>`:''}
          </div>
          <div class="pts-sec-title">${tr('حسابي والإعدادات','Account & settings')}</div>
          ${amRow('fa-chart-simple','إحصائياتي الروحية','My spiritual stats',"window.QA&&QA.openStats&&QA.openStats()",true)}
          ${amRow('fa-palette','المظهر والخلفية','Theme & background',"AnwarTheme2.open()",true)}
          ${amRow('fa-table-cells-large','تخصيص الصفحة الرئيسية','Customize home',"window.PRO2&&PRO2.openCustomizeHome()")}
          ${amRow('fa-mosque','إعدادات مواقيت الصلاة','Prayer time settings',"AnwarProfile._toSettings()")}
          ${amRow('fa-bell','إعدادات التنبيهات','Notification settings',"AnwarProfile._toSettings()")}
          ${amRow('fa-globe','الواجهة واللغة','Interface & language',"AnwarProfile._toSettings()")}
          ${amRow('fa-circle-info','عن التطبيق','About',"window.PRO2&&PRO2.openAbout()")}
          ${amRow('fa-shield-halved','سياسة الخصوصية','Privacy policy',"window.PRO2&&PRO2.openPrivacy()")}
          ${amRow('fa-share-nodes','تابعنا على إنستغرام','Follow us',"window.PRO2&&PRO2.openSocial()")}
          ${amRow('fa-triangle-exclamation','الإبلاغ عن خلل / اقتراح','Report a problem',"window.PRO2&&PRO2.reportProblem()")}
          <div class="prof-actions">
            <button class="prof-act" onclick="window.PRO2&&PRO2.shareApp()"><i class="fa-solid fa-share-from-square"></i> ${tr('شارك التطبيق','Share')}</button>
            <button class="prof-act gold" onclick="window.PRO2&&PRO2.rateApp()"><i class="fa-solid fa-star"></i> ${tr('قيّم التطبيق','Rate')}</button>
          </div>`;
        $('profile-modal').classList.add('active');
    },
    save:function(){ const v=($('prof-name')||{}).value||''; localStorage.setItem('anwar_name', v.trim()); }
};

// ---------- اختصار صغير ----------
window.renderPointsEntry = function(){ const host=$('points-entry'); if(host) host.innerHTML=''; }; // نظام النقاط مُلغى

// ---------- اختصار الأذكار حسب الوقت ----------
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
}};

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
    // ضع اختصار الأذكار وبطاقة النقاط بعد آية اليوم (أوقات الصلاة تبقى بالأعلى)
    const anchor = home.querySelector('#ayah-of-day-card') || home.querySelector('.prayer-grid') || home.querySelector('.hero-section');
    if(anchor && !$('athkar-shortcut')){
        const a=document.createElement('div'); a.id='athkar-shortcut'; anchor.insertAdjacentElement('afterend', a);
    }
    applyVisual(); renderAll();
    try{ const list=document.querySelector('#tab-settings .settings-list');
        if(list && !$('theme-row')){ const th=document.createElement('div'); th.className='setting-item'; th.id='theme-row';
            th.innerHTML=`<span class="set-ico"><i class="fa-solid fa-palette"></i></span><span class="set-label">${tr('المظهر والخلفية','Theme & background')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i>`;
            th.onclick=()=>AnwarTheme2.open(); list.insertBefore(th, list.firstChild); }
        if(list && !$('account-row')){ const ar=document.createElement('div'); ar.className='setting-item'; ar.id='account-row';
            ar.innerHTML=`<span class="set-ico"><i class="fa-solid fa-circle-user"></i></span><span class="set-label">${tr('حسابي','My Account')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i>`;
            ar.onclick=()=>AnwarProfile.open(); list.insertBefore(ar, list.firstChild); }
        if(list && !$('acct-grp')){ const g=document.createElement('div'); g.className='set-group-title'; g.id='acct-grp'; g.textContent=tr('حسابي والمظهر','Account & appearance'); list.insertBefore(g, list.firstChild); }
    }catch(e){}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject,800));
else setTimeout(inject,800);

// ألوان أيقونات الإعدادات (بطاقات ملوّنة فخمة بدل الذهبي الموحّد) — باقة دوّارة، آمنة ومرة واحدة لكل أيقونة
const _SET_PAL=[['#2f80ff','#4f9bff'],['#e5484d','#f56b70'],['#f5901e','#ffab48'],['#1e8a5a','#25b374'],
    ['#9b5de5','#b47cf0'],['#00a3a3','#22c7c7'],['#e5479e','#f26bb4'],['#6a5cff','#8a7dff'],
    ['#22a55a','#31c46f'],['#c98b1a','#e0a52f'],['#3aa0ff','#5cb3ff'],['#d4569e','#ef7ab8']];
function colorizeSettings(){
    try{
        document.querySelectorAll('.settings-list .set-ico').forEach(function(el,i){
            if(el.dataset.clr || el.classList.contains('set-ico-danger')) return; // مرة واحدة، وتجاهل الأحمر (الخطر)
            var c=_SET_PAL[i % _SET_PAL.length];
            el.style.background='linear-gradient(135deg,'+c[0]+','+c[1]+')';
            el.style.color='#fff'; el.style.border='none'; el.style.boxShadow='0 4px 12px rgba(0,0,0,0.32)';
            el.dataset.clr='1';
        });
    }catch(e){}
}
window.colorizeSettings=colorizeSettings;
[1500,2600,4200,6500].forEach(function(ms){ setTimeout(colorizeSettings, ms); });
// لوّن عند فتح تبويب الإعدادات (يلتقط أي أيقونات مُضافة لاحقاً)
try{ var _gt=window.goToTab; if(typeof _gt==='function'){ window.goToTab=function(){ var r=_gt.apply(this,arguments); setTimeout(colorizeSettings,120); return r; }; } }catch(e){}

const _sp=window.setPrayerTimings;
if(typeof _sp==='function'){ window.setPrayerTimings=function(){ const r=_sp.apply(this,arguments); try{renderAthkarShortcut();}catch(e){} return r; }; }
})();
