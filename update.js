// =======================================================
//  update.js — تحقّق التحديث (إجباري/اختياري) عند فتح التطبيق
//  الأدمن يتحكّم عبر Firestore: مستند config/app
//    { latest:"1.4", min:"1.3", ios:"https://apps.apple.com/app/id6782741099",
//      note:"نص اختياري", forceNote:"نص للإجباري" }
//  - إذا نسخة التطبيق < min  => تحديث إجباري (لا يُغلق)
//  - إذا نسخة التطبيق < latest => تحديث اختياري (يمكن إغلاقه)
//  حدّث APP_VERSION مع كل إصدار.
// =======================================================
(function(){
'use strict';
var APP_VERSION = '1.8.5';
var STORE_URL   = 'https://apps.apple.com/app/id6782741099';
function L(){ return (window.currentLang)||localStorage.getItem('lang')||'ar'; }
function tr(a,e){ return L()==='en'?e:a; }
function cmp(a,b){ a=(''+ (a||'0')).split('.').map(function(n){return parseInt(n)||0;}); b=(''+ (b||'0')).split('.').map(function(n){return parseInt(n)||0;}); for(var i=0;i<Math.max(a.length,b.length);i++){ var x=a[i]||0,y=b[i]||0; if(x>y)return 1; if(x<y)return -1; } return 0; }

function dialog(force, latest, url, note){
    if(document.getElementById('upd-modal')) return;
    var d=document.createElement('div'); d.id='upd-modal'; d.className='qibla-overlay active'; d.style.zIndex='4000';
    var title = force ? tr('تحديث مطلوب','Update required') : tr('يتوفّر تحديث جديد','Update available');
    var body  = note || (force ? tr('يجب تحديث التطبيق للإصدار '+latest+' للمتابعة.','Please update to '+latest+' to continue.')
                               : tr('يتوفّر إصدار جديد ('+latest+') بمزايا وتحسينات.','A new version ('+latest+') is available with improvements.'));
    d.innerHTML = '<div class="qibla-modal" style="width:90%;max-width:380px;text-align:center;">'
        + (force?'':'<button class="close-qibla" onclick="this.closest(\'#upd-modal\').remove()"><i class="fa-solid fa-xmark"></i></button>')
        + '<div class="upd-ico"><i class="fa-solid fa-cloud-arrow-down"></i></div>'
        + '<h2 style="color:var(--accent-color);margin:12px 0 6px;">'+title+'</h2>'
        + '<p style="color:var(--text-soft,#cbbfa6);font-size:0.92rem;line-height:1.8;margin-bottom:18px;">'+body+'</p>'
        + '<button class="tasbeeh-pill" style="width:100%;" onclick="window.open(\''+url+'\',\'_blank\')"><i class="fa-solid fa-arrow-up-right-from-square"></i> '+tr('تحديث الآن','Update now')+'</button>'
        + (force?'':'<button onclick="this.closest(\'#upd-modal\').remove()" style="background:none;border:none;color:var(--text-muted);margin-top:12px;cursor:pointer;font-family:inherit;font-size:0.9rem;">'+tr('لاحقاً','Later')+'</button>')
        + '</div>';
    document.body.appendChild(d);
}
function check(){
    try{
        if(!(window.firebase && firebase.firestore)) return;
        firebase.firestore().collection('config').doc('app').get().then(function(s){
            if(!s || !s.exists) return; var c=s.data()||{};
            var url = c.ios || STORE_URL;
            if(c.min && cmp(APP_VERSION, c.min) < 0){ dialog(true, c.latest||c.min, url, c.forceNote); return; }
            if(c.latest && cmp(APP_VERSION, c.latest) < 0){
                if(sessionStorage.getItem('upd_seen')) return; // مرة واحدة كل جلسة للاختياري
                sessionStorage.setItem('upd_seen','1');
                dialog(false, c.latest, url, c.note);
            }
        }).catch(function(){});
    }catch(e){}
}
setTimeout(check, 2500);
})();
