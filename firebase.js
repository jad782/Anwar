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
