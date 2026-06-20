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
