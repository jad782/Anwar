// =======================================================
//  haptics.js — تفاعل لمسي فخم (Capacitor Haptics على iOS، اهتزاز على غيره)
//  window.HAP.light() / medium() / heavy() / success() / warning()
//  يُتحكّم به عبر localStorage 'haptics' (افتراضي مفعّل).
// =======================================================
(function(){
'use strict';
function plugin(){ return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) || null; }
function on(){ return localStorage.getItem('haptics') !== '0'; }
var _last = 0;
function throttle(ms){ var n=Date.now(); if(n-_last<ms) return false; _last=n; return true; }
function vib(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

window.HAP = {
    light:   function(){ if(!on()||!throttle(28)) return; var h=plugin(); if(h&&h.impact){ h.impact({style:'LIGHT'}); } else vib(8); },
    medium:  function(){ if(!on()) return; var h=plugin(); if(h&&h.impact){ h.impact({style:'MEDIUM'}); } else vib(16); },
    heavy:   function(){ if(!on()) return; var h=plugin(); if(h&&h.impact){ h.impact({style:'HEAVY'}); } else vib(30); },
    success: function(){ if(!on()) return; var h=plugin(); if(h&&h.notification){ h.notification({type:'SUCCESS'}); } else vib([25,40,25]); },
    warning: function(){ if(!on()) return; var h=plugin(); if(h&&h.notification){ h.notification({type:'WARNING'}); } else vib([15,60,15]); },
    set:     function(v){ localStorage.setItem('haptics', v?'1':'0'); }
};
})();
