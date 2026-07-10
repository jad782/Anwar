// =======================================================
//  keys.js — "مفاتيح يومك": شبكة اختصارات قابلة للتخصيص (إظهار/إخفاء + ترتيب)
//  تملك حاوية #keys-grid وتعيد رسمها كلياً. هوية ذهبية فخمة.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }

// منقّلات مساعدة
function athkar(cat){ if(typeof goToTab==='function') goToTab(2); setTimeout(()=>{ try{ if(window.QA&&QA.openCat) QA.openCat('athkar',cat); }catch(e){} },250); }
function duaa(){ if(typeof goToTab==='function') goToTab(2); setTimeout(()=>{ try{ if(window.QA&&QA.switchAthkarSection) QA.switchAthkarSection('duaa'); }catch(e){} },250); }
window.AnwarKeys = window.AnwarKeys || {};
AnwarKeys.athkar = athkar; AnwarKeys.duaa = duaa;

// كتالوج المفاتيح (الكل متاح، والمستخدم يختار ويرتّب)
const CATALOG = [
    { id:'prayer',   ar:'المواقيت',         en:'Prayer Times',  ico:'fa-mosque',           act:"goToTab(0)" },
    { id:'qibla',    ar:'اتجاه القبلة',     en:'Qibla',         ico:'fa-compass',          act:"openQibla()" },
    { id:'quran',    ar:'المصحف',           en:'Quran',         ico:'fa-book-quran',       act:"goToTab(1)" },
    { id:'tasbeeh',  ar:'المسبحة',          en:'Tasbeeh',       ico:'fa-ring',             act:"goToTab(2)" },
    { id:'morning',  ar:'أذكار الصباح',     en:'Morning',       ico:'fa-sun',              act:"AnwarKeys.athkar('morning')" },
    { id:'evening',  ar:'أذكار المساء',     en:'Evening',       ico:'fa-moon',             act:"AnwarKeys.athkar('evening')" },
    { id:'post',     ar:'أذكار بعد الصلاة', en:'After Prayer',  ico:'fa-person-praying',   act:"AnwarKeys.athkar('postPrayer')" },
    { id:'sleep',    ar:'أذكار النوم',      en:'Sleep',         ico:'fa-bed',              act:"AnwarKeys.athkar('sleep')" },
    { id:'wake',     ar:'أذكار الاستيقاظ',  en:'Waking',        ico:'fa-mug-hot',          act:"AnwarKeys.athkar('wake')" },
    { id:'duaa',     ar:'الأدعية',          en:'Du\'a',         ico:'fa-hands-praying',    act:"AnwarKeys.duaa()" },
    { id:'sunan',    ar:'السنن',            en:'Sunnah',        ico:'fa-star-and-crescent',act:"openSunan()" },
    { id:'hajj',     ar:'الحج والعمرة',     en:'Hajj & Umrah',  ico:'fa-kaaba',            act:"window.AnwarHajj&&AnwarHajj.open()" },
    { id:'occasions',ar:'المناسبات الإسلامية',en:'Occasions',   ico:'fa-calendar-day',     act:"window.PRO&&PRO.openCalendar()" },
    { id:'continue', ar:'أكمل الختمة',      en:'Continue Khatma',ico:'fa-book-open-reader',act:"continueKhatma()" },
    { id:'group',    ar:'ختمة جماعية',      en:'Group Khatma',  ico:'fa-users',            act:"window.PRO&&PRO.openGroupKhatma()" },
    { id:'bookmarks',ar:'المفضّلة',         en:'Bookmarks',     ico:'fa-bookmark',         act:"window.PRO&&PRO.openBookmarks()" },
    { id:'radio',    ar:'إذاعة القرآن',     en:'Quran Radio',   ico:'fa-radio',            act:"toggleRadio()" },
    { id:'reciteLib',ar:'مكتبة التلاوات',   en:'Recitations',   ico:'fa-headphones',       act:"window.AnwarRecite&&AnwarRecite.open()" },
    { id:'cards',    ar:'بطاقات وتصاميم',   en:'Ayah Cards',    ico:'fa-wand-magic-sparkles',act:"window.AnwarCards&&AnwarCards.open()" },
    { id:'points',   ar:'نقاط الأنوار',     en:'PlusPoints',    ico:'fa-star',             act:"window.AnwarPoints2&&AnwarPoints2.open()" },
    { id:'stats',    ar:'إحصائياتي',        en:'My Stats',      ico:'fa-chart-simple',     act:"window.QA&&QA.openStats&&QA.openStats()" },
    { id:'badges',   ar:'إنجازاتي',         en:'Badges',        ico:'fa-medal',            act:"window.PRO2&&PRO2.openBadges()" },
];
function findCat(id){ return CATALOG.find(c=>c.id===id); }

function loadPref(){ try{ const p=JSON.parse(localStorage.getItem('keys_pref')||'{}'); return { order:Array.isArray(p.order)?p.order:[], hidden:Array.isArray(p.hidden)?p.hidden:[] }; }catch(e){ return {order:[],hidden:[]}; } }
function savePref(p){ localStorage.setItem('keys_pref', JSON.stringify(p)); }
function orderedAll(){
    const p=loadPref(); const seen={}; const out=[];
    p.order.forEach(id=>{ const c=findCat(id); if(c&&!seen[id]){ seen[id]=1; out.push(c);} });
    CATALOG.forEach(c=>{ if(!seen[c.id]){ seen[c.id]=1; out.push(c);} });
    return out;
}

AnwarKeys.render = function(){
    const host=$('keys-grid'); if(!host) return;
    const p=loadPref();
    const visible=orderedAll().filter(c=>!p.hidden.includes(c.id));
    host.innerHTML = visible.map(c=>`
        <div class="key-tile" onclick="${c.act}">
            <div class="key-circle"><i class="fa-solid ${c.ico}"></i></div>
            <span class="key-label">${L()==='en'?c.en:c.ar}</span>
        </div>`).join('');
    enableDragScroll(host);
};
// تمكين السكرول الأفقي بعجلة الماوس + السحب (باللمس يعمل أصلاً)
function enableDragScroll(el){
    if(el._dragBound) return; el._dragBound=true;
    // عجلة الماوس العمودية → تمرير أفقي
    el.addEventListener('wheel', e=>{
        if(Math.abs(e.deltaY) > Math.abs(e.deltaX)){ el.scrollLeft += e.deltaY; e.preventDefault(); }
    }, {passive:false});
    // السحب بالماوس (سطح المكتب)
    let down=false, sx=0, sl=0, moved=false;
    el.addEventListener('mousedown', e=>{ down=true; moved=false; sx=e.pageX; sl=el.scrollLeft; });
    window.addEventListener('mousemove', e=>{ if(!down) return; const dx=e.pageX-sx; if(Math.abs(dx)>3) moved=true; el.scrollLeft=sl-dx; });
    window.addEventListener('mouseup', ()=>{ down=false; });
    // امنع فتح المفتاح إذا كان سحباً وليس نقرة
    el.addEventListener('click', e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } }, true);
}

// نافذة التخصيص: إظهار/إخفاء + ترتيب بالأسهم
AnwarKeys.openCustomize = function(){
    ensureModal();
    renderCustomizeBody();
    $('keys-modal').classList.add('active');
};
function renderCustomizeBody(){
    if(!$('keys-modal-body')) return;
    const p=loadPref();
    const list=orderedAll();
    $('keys-modal-body').innerHTML = list.map((c,i)=>{
        const on=!p.hidden.includes(c.id);
        const upDis=i===0?'disabled':''; const dnDis=i===list.length-1?'disabled':'';
        return `<div class="kc-row">
            <div class="kc-move">
                <button class="ch-arrow" ${upDis} onclick="AnwarKeys.move('${c.id}',-1)"><i class="fa-solid fa-chevron-up"></i></button>
                <button class="ch-arrow" ${dnDis} onclick="AnwarKeys.move('${c.id}',1)"><i class="fa-solid fa-chevron-down"></i></button>
            </div>
            <span class="kc-ico"><i class="fa-solid ${c.ico}"></i></span>
            <span class="kc-name">${L()==='en'?c.en:c.ar}</span>
            <label class="switch"><input type="checkbox" ${on?'checked':''} onchange="AnwarKeys.toggle('${c.id}',this.checked)"><span class="slider round"></span></label>
        </div>`;
    }).join('');
}
AnwarKeys.toggle = function(id, on){
    const p=loadPref();
    if(on) p.hidden=p.hidden.filter(x=>x!==id);
    else if(!p.hidden.includes(id)) p.hidden.push(id);
    savePref(p); AnwarKeys.render();
};
AnwarKeys.move = function(id, dir){
    const order=orderedAll().map(c=>c.id);
    const i=order.indexOf(id); const j=i+dir; if(i<0||j<0||j>=order.length) return;
    const t=order[i]; order[i]=order[j]; order[j]=t;
    const p=loadPref(); p.order=order; savePref(p);
    AnwarKeys.render(); renderCustomizeBody();
};
function ensureModal(){
    if($('keys-modal')) return;
    const d=document.createElement('div'); d.id='keys-modal'; d.className='qibla-overlay';
    d.innerHTML=`<div class="qibla-modal" style="width:94%;max-width:440px;text-align:right;max-height:86vh;overflow-y:auto;">
        <button class="close-qibla" onclick="document.getElementById('keys-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
        <h2 style="color:var(--accent-color);margin-bottom:6px;text-align:center;"><i class="fa-solid fa-sliders"></i> ${tr('تخصيص مفاتيح يومك','Customize your keys')}</h2>
        <p style="color:var(--text-muted);font-size:0.82rem;text-align:center;margin-bottom:14px;">${tr('اختر ما يظهر ورتّبه بالأسهم.','Choose what shows and reorder.')}</p>
        <div id="keys-modal-body"></div></div>`;
    document.body.appendChild(d);
}

function boot(){ if($('keys-grid')) AnwarKeys.render(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,1100));
else setTimeout(boot,1100);
})();
