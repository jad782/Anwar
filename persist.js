// =======================================================
//  persist.js — حماية بيانات المستخدم من الضياع عند تحديث التطبيق
//  يحفظ نسخة من localStorage في الذاكرة الأصلية للنظام (Capacitor Preferences
//  = UserDefaults) التي لا تُمسح مع تحديثات التطبيق، ويستعيدها عند الإقلاع.
//  على الويب: no-op آمن (localStorage في المتصفح ثابت أصلاً).
//  يجب تحميله أولاً قبل بقية السكربتات.
// =======================================================
(function(){
'use strict';
var KEY = 'ls_full_backup_v1';
function prefs(){ return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) || null; }

// اجمع كامل localStorage ككائن
function dumpLS(){
    var o = {};
    try { for (var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } } catch(e){}
    return o;
}

// احفظ نسخة احتياطية (مؤجّلة لتقليل الكتابة)
var saveTimer = null;
function backup(){
    var p = prefs(); if(!p) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
        try { p.set({ key: KEY, value: JSON.stringify(dumpLS()) }); } catch(e){}
    }, 700);
}

// استعد المفاتيح المفقودة من النسخة الاحتياطية
function restore(){
    var p = prefs(); if(!p) return Promise.resolve(0);
    return p.get({ key: KEY }).then(function(res){
        if(!res || !res.value) return 0;
        var obj; try { obj = JSON.parse(res.value); } catch(e){ return 0; }
        var restored = 0;
        Object.keys(obj).forEach(function(k){
            // لا نطمس قيمة موجودة (الأحدث أولى) — نملأ المفقود فقط
            if (localStorage.getItem(k) === null) { try { localStorage.setItem(k, obj[k]); restored++; } catch(e){} }
        });
        return restored;
    }).catch(function(){ return 0; });
}

// اعترض الكتابة/الحذف لتحديث النسخة الاحتياطية تلقائياً
try {
    var _set = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(k,v){ _set(k,v); backup(); };
    var _rm = localStorage.removeItem.bind(localStorage);
    localStorage.removeItem = function(k){ _rm(k); backup(); };
    var _clear = localStorage.clear.bind(localStorage);
    localStorage.clear = function(){ _clear(); backup(); };
} catch(e){}

window.addEventListener('pagehide', backup);
document.addEventListener('visibilitychange', function(){ if(document.hidden) backup(); });

// عند الإقلاع على iOS: استعد فوراً، وإن استُعيدت بيانات أعد تحميل الصفحة مرة واحدة
// كي يقرأ بقية التطبيق البيانات المستعادة (حارس جلسة يمنع التكرار).
function boot(){
    if(!prefs()) return; // ويب: لا شيء
    restore().then(function(n){
        if (n > 0 && !sessionStorage.getItem('ls_restored_once')) {
            sessionStorage.setItem('ls_restored_once','1');
            location.reload();
        } else {
            backup(); // تأكد من وجود نسخة محدّثة
        }
    });
}
// شغّل في أبكر وقت ممكن
if (prefs()) boot();
else document.addEventListener('DOMContentLoaded', boot);
})();
