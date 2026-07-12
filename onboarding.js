// =======================================================
//  onboarding.js — شاشة ترحيب وإعداد أوّلي (تظهر مرة واحدة)
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang)||localStorage.getItem('lang')||'ar'; }
function tr(a,e){ return L()==='en'?e:a; }
if(localStorage.getItem('onboarded')==='1') return;

const SLIDES = [
    { ico:'fa-book-quran', ar:'أهلاً بك في الأنوار', en:'Welcome to Al-Anwar',
      ard:'رفيقك اليومي مع القرآن الكريم، أوقات الصلاة، والأذكار — بتصميم فخم وخصوصية كاملة.', end:'Your daily companion for Quran, prayer times, and adhkar — beautifully private.' },
    { ico:'fa-mosque', ar:'أوقات صلاة دقيقة', en:'Accurate Prayer Times',
      ard:'مواقيت محسوبة لموقعك مع أذان حقيقي وتنبيهات تعمل والهاتف مقفل، واتجاه القبلة بدقّة.', end:'Times for your location with real athan alerts and precise qibla.' },
    { ico:'fa-star', ar:'التزام يرافقك', en:'Grow Every Day',
      ard:'تتبّع صلواتك، اجمع نقاط الإنجاز، وأكمل ختماتك — كل بياناتك تبقى على جهازك وحده.', end:'Track prayers, earn points, finish khatmas — all data stays on your device.' }
];
let _i = 0;

function render(){
    const s = SLIDES[_i];
    const dots = SLIDES.map((_,i)=>`<span class="ob-dot ${i===_i?'on':''}"></span>`).join('');
    $('ob-body').innerHTML = `
        <div class="ob-ico"><i class="fa-solid ${s.ico}"></i></div>
        <h2 class="ob-title">${L()==='en'?s.en:s.ar}</h2>
        <p class="ob-desc">${L()==='en'?s.end:s.ard}</p>
        <div class="ob-dots">${dots}</div>
        <button class="ob-next" onclick="AnwarOnboard.next()">${_i<SLIDES.length-1?tr('التالي','Next'):tr('ابدأ الآن','Get Started')}</button>
        ${_i<SLIDES.length-1?`<button class="ob-skip" onclick="AnwarOnboard.finish()">${tr('تخطّي','Skip')}</button>`:''}`;
}
window.AnwarOnboard = {
    next:function(){ if(_i<SLIDES.length-1){ _i++; if(window.HAP)HAP.light(); render(); } else AnwarOnboard.finish(); },
    finish:function(){
        localStorage.setItem('onboarded','1');
        const o=$('onboard-overlay'); if(o){ o.classList.add('closing'); setTimeout(()=>o.remove(),350); }
        // اطلب أذونات الموقع/الإشعارات بلطف بعد الترحيب
        try{ if(navigator.geolocation) navigator.geolocation.getCurrentPosition(function(){},function(){},{timeout:8000}); }catch(e){}
        try{ if(window.refreshAthanSchedule) window.refreshAthanSchedule(); }catch(e){}
        if(window.HAP)HAP.success();
    }
};
function show(){
    if($('onboard-overlay')) return;
    const o=document.createElement('div'); o.id='onboard-overlay'; o.className='ob-overlay';
    o.innerHTML = `<div class="ob-stars"></div><div class="ob-card" id="ob-body"></div>`;
    document.body.appendChild(o);
    render();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(show,700));
else setTimeout(show,700);
})();
