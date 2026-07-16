// =======================================================
//  firebase.js — ربط Firestore لميزة الختمة الجماعية (تحديث لحظي)
//  ميزة أونلاين فقط؛ يتعطّل بأمان بدون إنترنت.
// =======================================================
(function(){
'use strict';
const firebaseConfig = {
  apiKey: "AIzaSyCpVpqnzUOP3tAH2F5mpyfOh3-aToUgHXY",
  authDomain: "anwar-app-d1a4a.firebaseapp.com",
  projectId: "anwar-app-d1a4a",
  storageBucket: "anwar-app-d1a4a.firebasestorage.app",
  messagingSenderId: "217457034014",
  appId: "1:217457034014:web:a284c68f7cc85c39953f0f",
  measurementId: "G-QT4TNYRR3G"
};
window.FB = { ready: false };
try {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        FB.ready = true;
        FB.createRoom   = (name, members) => db.collection('rooms').add({ name, members, createdAt: Date.now() }).then(r => r.id);
        FB.subscribe    = (code, cb) => db.collection('rooms').doc(code).onSnapshot(d => { if (d.exists) cb(d.data()); }, ()=>{});
        FB.updateMembers= (code, members) => db.collection('rooms').doc(code).update({ members }).catch(()=>{});
        FB.getRoom      = (code) => db.collection('rooms').doc(code).get().then(d => d.exists ? d.data() : null);
    }
} catch(e) { FB.ready = false; }
})();

// =======================================================
//  تحليلات + تسجيل ضيف مجهول (خلفية تماماً — لا واجهة، لا تأثير على الفتح)
//  يُحمّل بعد أن يصبح التطبيق تفاعلياً، وبشكل غير متزامن، ويتعطّل بأمان بلا إنترنت.
// =======================================================
(function(){
    if (!window.FB || !FB.ready) return;
    function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
    function boot(){
        var V='https://www.gstatic.com/firebasejs/10.12.5/';
        // 1) التحليلات: أول فتح + الجلسات + المستخدمون النشطون (تلقائي)
        loadScript(V+'firebase-analytics-compat.js').then(function(){ try{ firebase.analytics(); }catch(e){} }).catch(function(){});
        // 2) تسجيل ضيف مجهول: يولّد ID ثابتاً بالخلفية بلا أي شاشة
        loadScript(V+'firebase-auth-compat.js').then(function(){
            try{ if(firebase.auth){ firebase.auth().signInAnonymously().catch(function(){}); } }catch(e){}
        }).catch(function(){});
    }
    // بعد الخمول (بلا تأثير على سرعة الفتح إطلاقاً)
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 5000 });
    else setTimeout(boot, 3000);
})();

// =======================================================
//  عدّاد التحميلات اللحظي — يزيد بالثانية عند أول فتح للتطبيق على أي جهاز.
//  تراه فوراً في Firestore: مستند stats/installs (total + يومي + حسب المنصّة)،
//  ومجموعة installs (سطر لكل تحميل بطابع زمني للعدّ الدقيق واللحظي).
//  خلفية تماماً، مرة واحدة لكل جهاز، ويتعطّل بأمان بلا إنترنت.
// =======================================================
(function(){
    try{
        if(!window.FB || !FB.ready) return;
        if(localStorage.getItem('anwar_installed')==='1') return; // مرة واحدة لكل جهاز
        function logInstall(){
            try{
                var db=firebase.firestore();
                var FV=firebase.firestore.FieldValue;
                var today=new Date().toISOString().slice(0,10);
                var plat='web'; try{ if(window.Capacitor && Capacitor.getPlatform) plat=Capacitor.getPlatform(); }catch(e){}
                var lang=(localStorage.getItem('lang')||'ar');
                var doc={ total:FV.increment(1), lastAt:Date.now() };
                doc['day_'+today]=FV.increment(1);
                doc['plat_'+plat]=FV.increment(1);
                db.collection('stats').doc('installs').set(doc, {merge:true})
                    .then(function(){ localStorage.setItem('anwar_installed','1'); })
                    .catch(function(){});
                // سطر لكل تحميل (للعدّ الدقيق ومعرفة توقيت كل تحميل لحظياً)
                db.collection('installs').add({ ts:FV.serverTimestamp(), plat:plat, lang:lang, at:Date.now() }).catch(function(){});
            }catch(e){}
        }
        if('requestIdleCallback' in window) requestIdleCallback(logInstall, { timeout:6000 });
        else setTimeout(logInstall, 3500);
    }catch(e){}
})();
