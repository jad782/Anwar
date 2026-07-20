// =======================================================
//  notifications.js — جدولة تنبيهات الأذان
//  • يستخدم Capacitor LocalNotifications عند التشغيل كتطبيق أصلي
//    (تعمل حتى لو كان التطبيق مغلقاً)
//  • وإلا يرجع لإشعارات الويب (تعمل أثناء فتح التطبيق فقط)
// =======================================================
(function(){
'use strict';

const LABELS = { Fajr:'الفجر', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
const LABELS_EN = { Fajr:'Fajr', Dhuhr:'Dhuhr', Asr:'Asr', Maghrib:'Maghrib', Isha:'Isha' };
const ORDER = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

function isNative(){
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function'
        && window.Capacitor.isNativePlatform()
        && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications);
}
function lang(){ return (typeof currentLang !== 'undefined') ? currentLang : 'ar'; }
// اسم ملف صوت الأذان بحسب المنصّة: iOS يطلب .caf (≤30ث) مضمّناً بالحزمة، وأندرويد raw .mp3
function athanSoundFile(){
    try{ if (window.Capacitor && Capacitor.getPlatform && Capacitor.getPlatform() === 'ios') return 'athan.caf'; }catch(e){}
    return 'athan.mp3';
}
function lbl(k){ return lang()==='en' ? LABELS_EN[k] : LABELS[k]; }

async function ensurePermission(LN){
    try{
        let st = await LN.checkPermissions();
        if (st.display !== 'granted'){ st = await LN.requestPermissions(); }
        return st.display === 'granted';
    }catch(e){ return false; }
}

// الجدولة الأصلية (Capacitor) — تتكرّر يومياً وتُحدَّث كلما فُتح التطبيق
window.scheduleNativeAthan = async function(){
    if (!isNative()) return false;
    if (typeof prayerTimings === 'undefined' || !prayerTimings.Fajr) return false;
    const LN = window.Capacitor.Plugins.LocalNotifications;
    if (!(await ensurePermission(LN))) return false;

    // قناة بصوت الأذان (مطلوبة لأندرويد 8+ ليعمل الصوت المخصّص)
    try {
        if (LN.createChannel) await LN.createChannel({
            id: 'athan', name: 'تنبيهات الأذان', description: 'صوت الأذان عند دخول الوقت',
            importance: 5, sound: athanSoundFile(), visibility: 1, vibration: true
        });
    } catch(e){}

    // ألغِ التنبيهات السابقة (معرّفات ثابتة 1000..1099)
    const old = []; for (let i = 1000; i < 1100; i++) old.push({ id: i });
    try { await LN.cancel({ notifications: old }); } catch(e){}

    const athanOn = localStorage.getItem('athanSound') === 'true' || localStorage.getItem('notifications') === 'true';
    const pre = parseInt(localStorage.getItem('preAthanMin') || '0');
    const notifs = []; let i = 0;

    ORDER.forEach(k => {
        if (!prayerTimings[k]) return;
        const [h, m] = prayerTimings[k].split(':').map(Number);
        if (athanOn) {
            notifs.push({
                id: 1000 + i,
                title: (lang()==='en' ? 'Time for ' : 'حان وقت ') + lbl(k),
                body: lang()==='en' ? "Don't forget your prayer" : 'لا تنسَ الصلاة',
                schedule: { on: { hour: h, minute: m }, allowWhileIdle: true, repeats: true },
                sound: athanSoundFile(),
                channelId: 'athan'
            });
        }
        if (pre > 0) {
            let pm = m - pre, ph = h;
            while (pm < 0) { pm += 60; ph = (ph + 23) % 24; }
            notifs.push({
                id: 1050 + i,
                title: (lang()==='en' ? lbl(k)+' is near' : 'اقترب وقت ' + lbl(k)),
                body: lang()==='en' ? `In ${pre} minutes` : `باقٍ ${pre} دقيقة على الأذان`,
                schedule: { on: { hour: ph, minute: pm }, allowWhileIdle: true, repeats: true }
            });
        }
        i++;
    });

    if (notifs.length){ try { await LN.schedule({ notifications: notifs }); return true; } catch(e){ return false; } }
    return false;
};

// تذكيرات الأذكار خلال اليوم (تعمل والتطبيق مغلق) — 3 أوقات ثابتة
const DHIKR_REMINDERS = [
    { h:9,  m:0,  ar:'سبّحان الله وبحمده 🌿', body_ar:'لا تدع يومك يمضي بلا ذكر لله.', en:'SubhanAllah 🌿', body_en:"Don't let your day pass without dhikr." },
    { h:15, m:0,  ar:'أكثِر من الاستغفار 🤲', body_ar:'«مَن لزم الاستغفار جعل الله له من كل همٍّ فرجاً».', en:'Seek forgiveness 🤲', body_en:'Istighfar brings relief from every worry.' },
    { h:20, m:30, ar:'صلِّ على النبي ﷺ', body_ar:'صلاة واحدة عليه ﷺ تعدل عشر صلوات من الله عليك.', en:'Send blessings on the Prophet ﷺ', body_en:'One salah brings tenfold from Allah.' }
];
window.scheduleDhikrReminders = async function(){
    if (!isNative()) return false;
    if (localStorage.getItem('dhikrReminders') === 'false') {
        try { await window.Capacitor.Plugins.LocalNotifications.cancel({ notifications: DHIKR_REMINDERS.map((_,i)=>({id:2100+i})) }); } catch(e){}
        return false;
    }
    const LN = window.Capacitor.Plugins.LocalNotifications;
    if (!(await ensurePermission(LN))) return false;
    const notifs = DHIKR_REMINDERS.map((d,i)=>({
        id: 2100+i,
        title: lang()==='en' ? d.en : d.ar,
        body:  lang()==='en' ? d.body_en : d.body_ar,
        schedule: { on:{ hour:d.h, minute:d.m }, repeats:true, allowWhileIdle:true }
    }));
    try { await LN.schedule({ notifications: notifs }); return true; } catch(e){ return false; }
};

// تذكيرات يوم الجمعة (سنن الجمعة) — أسبوعياً، تعمل والتطبيق مغلق
const FRIDAY_IDS = [2200,2201,2202,2203];
window.scheduleFridayReminders = async function(){
    if (!isNative()) return false;
    const LN = window.Capacitor.Plugins.LocalNotifications;
    if (localStorage.getItem('fridayReminders') === 'false'){
        try { await LN.cancel({ notifications: FRIDAY_IDS.map(id=>({id})) }); } catch(e){}
        return false;
    }
    if (!(await ensurePermission(LN))) return false;
    const en = lang()==='en';
    const items = [
        { id:2200, h:7,  m:30, t: en?'Blessed Friday 🕌':'يوم الجمعة المبارك 🕌',
          b: en?'Sunnahs of Friday: ghusl (bathing), best clothes, perfume, and heading early to the mosque.'
               :'من سُنن الجمعة: الاغتسال، ولبس أحسن الثياب، والتطيّب، والتبكير إلى المسجد.' },
        { id:2201, h:9,  m:0,  t: en?'Send blessings on the Prophet ﷺ':'أكثِر من الصلاة على النبي ﷺ',
          b: en?'“Increase your prayers upon me on Friday, for your prayers are presented to me.”'
               :'«أكثِروا الصلاة عليَّ يوم الجمعة، فإنَّ صلاتكم معروضةٌ عليَّ»' },
        { id:2202, h:10, m:30, t: en?'Read Surah Al-Kahf ✨':'لا تنسَ سورة الكهف ✨',
          b: en?'“Whoever reads Surah Al-Kahf on Friday, light shines for him between the two Fridays.”'
               :'«من قرأ سورة الكهف يوم الجمعة أضاء له من النور ما بين الجمعتين»' },
    ];
    // ساعة الإجابة: قبل المغرب بساعة (تُحسب من أوقات صلاتك، وإلا 16:30)
    let sh=16, sm=30;
    try{ if(typeof prayerTimings!=='undefined' && prayerTimings.Maghrib){ const [H,M]=prayerTimings.Maghrib.split(':').map(Number); let t=H*60+M-60; if(t<0)t+=1440; sh=Math.floor(t/60); sm=t%60; } }catch(e){}
    items.push({ id:2203, h:sh, m:sm, t: en?'The hour of response 🤲':'ساعة الإجابة 🤲',
        b: en?'In the last hour of Friday there is a time when du\'a is answered — pray much.'
             :'في آخر ساعة من يوم الجمعة ساعةُ إجابة لا يُوافقها عبدٌ يسأل الله خيراً إلا أعطاه — أكثِر من الدعاء.' });
    const notifs = items.map(n=>({ id:n.id, title:n.t, body:n.b,
        schedule:{ on:{ weekday:6, hour:n.h, minute:n.m }, repeats:true, allowWhileIdle:true } })); // weekday 6 = الجمعة
    try { await LN.schedule({ notifications: notifs }); return true; } catch(e){ return false; }
};

// تكبيرات العيد — تُجدول في أيام العشر من ذي الحجة (خاصةً عرفة والعيد) وعيد الفطر، عبر التقويم الهجري (أم القرى)
const EID_IDS = []; for(let i=2210;i<2260;i++) EID_IDS.push(i);
const TAKBIR_TEXT = 'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ';
window.scheduleEidTakbeer = async function(){
    if (!isNative()) return false;
    const LN = window.Capacitor.Plugins.LocalNotifications;
    if (localStorage.getItem('dhikrReminders') === 'false'){ try{ await LN.cancel({ notifications: EID_IDS.map(id=>({id})) }); }catch(e){} return false; }
    if (!(await ensurePermission(LN))) return false;
    let mF, dF;
    try{ mF=new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura',{month:'numeric'}); dF=new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura',{day:'numeric'}); }catch(e){ return false; }
    try{ await LN.cancel({ notifications: EID_IDS.map(id=>({id})) }); }catch(e){}
    const now=new Date(); const notifs=[]; let id=2210; const en=lang()==='en';
    for(let d=0; d<70 && id<2258; d++){
        const day=new Date(now.getFullYear(), now.getMonth(), now.getDate()+d, 8, 0, 0); // 8 صباحاً
        if(day<=now) continue;
        let hm,hd; try{ hm=parseInt(mF.format(day)); hd=parseInt(dF.format(day)); }catch(e){ continue; }
        let title=null;
        if(hm===12 && hd>=1 && hd<=13){ // ذو الحجة: العشر + التشريق
            title = hd===10 ? (en?'Eid al-Adha Mubarak 🕌':'عيد الأضحى المبارك 🕌')
                  : hd===9 ? (en?'Day of Arafah 🤍':'يوم عرفة — أكثِر من التكبير والدعاء 🤍')
                  : (en?'The ten days — Takbeer 🕌':'العشر من ذي الحجة — كبّر 🕌');
        } else if(hm===10 && hd===1){ title = en?'Eid al-Fitr Mubarak 🕌':'عيد الفطر المبارك 🕌'; }
        if(title){ notifs.push({ id:id++, title:title, body:TAKBIR_TEXT, schedule:{ at:day, allowWhileIdle:true } }); }
    }
    if(notifs.length){ try{ await LN.schedule({ notifications: notifs }); return true; }catch(e){ return false; } }
    return false;
};

// نقطة دخول موحّدة — يستدعيها التطبيق بعد تحميل أوقات الصلاة وعند تغيير الإعدادات
window.refreshAthanSchedule = function(){
    if (isNative()) { window.scheduleNativeAthan(); window.scheduleDhikrReminders(); window.scheduleFridayReminders(); window.scheduleEidTakbeer(); }
    // على الويب: لا حاجة لشيء؛ app.js/features.js يطلقان الإشعارات أثناء التشغيل
};

// جدولة أولية: انتظر تحميل أوقات الصلاة
let _tries = 0;
const _waiter = setInterval(() => {
    _tries++;
    if (typeof prayerTimings !== 'undefined' && prayerTimings.Fajr) {
        clearInterval(_waiter);
        window.refreshAthanSchedule();
    }
    if (_tries > 60) clearInterval(_waiter);
}, 1000);

// أعد الجدولة عند العودة للتطبيق (تحديث الأوقات لليوم الجديد)
document.addEventListener('visibilitychange', () => { if (!document.hidden) window.refreshAthanSchedule(); });
})();
