// =======================================================
//  guide.js — دليل الاستخدام والميزات (كيف تستخدم التطبيق)
//  يشرح كل ميزة وطريقة استخدامها — يُفتح من الإعدادات.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }

const SECTIONS = [
    { ico:'fa-book-quran', ar:'المصحف وقراءة القرآن', en:'Mushaf & Reading', tips:[
        ['اضغط على أي آية','يفتح التفسير والتدبّر والترجمة.'],
        ['اضغط مطوّلاً على الآية','قائمة سريعة: نسخ بالتشكيل، نسخ بدون تشكيل، مشاركة، تصميم بطاقة.'],
        ['اسحب يميناً/يساراً','لتقليب صفحات المصحف. وزر «تجويد» يلوّن أحكام التجويد.'],
        ['قائمة السور','اضغط اسم السورة لتفتح من أولها مباشرة، وابحث بالاسم أو بكلمة من الآية.'],
    ], tipsEn:[
        ['Tap any verse','Opens Tafsir, reflection & translation.'],
        ['Long-press a verse','Quick menu: copy (with/without diacritics), share, design a card.'],
        ['Swipe left/right','Flip Mushaf pages. The "Tajweed" button colors the rules.'],
        ['Surah list','Tap a surah name to open it from its start; search by name or a word.'],
    ]},
    { ico:'fa-mosque', ar:'الصلاة والأذان والقبلة', en:'Prayer, Athan & Qibla', tips:[
        ['شريط المواقيت','يعرض الصلاة القادمة والوقت المتبقي بعدّاد دقيق.'],
        ['من الإعدادات','فعّل صوت الأذان والتنبيه المسبق (5/10/15 دقيقة) قبل كل صلاة.'],
        ['القبلة','وجّه الهاتف مسطّحاً حتى تنطبق الكعبة على السهم، أو استخدم «القبلة بالكاميرا».'],
    ], tipsEn:[
        ['Prayer bar','Shows the next prayer and a precise countdown.'],
        ['In Settings','Enable the athan sound and a pre-prayer reminder (5/10/15 min).'],
        ['Qibla','Hold the phone flat until the Kaaba aligns, or use "Qibla by camera".'],
    ]},
    { ico:'fa-hands-praying', ar:'الأذكار والمسبحة', en:'Adhkar & Tasbeeh', tips:[
        ['التصنيفات','اختر (صباح/مساء/بعد الصلاة/النوم...) واضغط البطاقة للعدّ.'],
        ['المسبحة','تهتزّ مع كل عدّة، واهتزازة مميّزة عند اكتمال العدد.'],
    ], tipsEn:[
        ['Categories','Pick (morning/evening/after prayer/sleep…) and tap a card to count.'],
        ['Tasbeeh','Vibrates on each count, with a special buzz when complete.'],
    ]},
    { ico:'fa-gem', ar:'الميزات المميّزة', en:'Premium Features', tips:[
        ['أذكار الأحبّة','اكتب أدعية لمن تحبّ مع تذكير يومي وشاركها كبطاقة.'],
        ['أذكار الصغار','مواقف يومية بتصميم مرح لتعليم أطفالك.'],
        ['الوضع الليلي','رفيق قيام الليل: ورد، تسبيح، وعدّاد الثلث الأخير.'],
        ['استوديو البطاقات ومكتبة التلاوات','صمّم آية وشاركها، واختر قارئك وحمّل السور.'],
        ['دليل الحج والعمرة','مناسك + عدّاد طواف وسعي + أدعية بمصادرها.'],
    ], tipsEn:[
        ['Loved Ones\' Du\'a','Write du\'as for those you love with a daily reminder; share as a card.'],
        ['Kids\' Adhkar','Everyday moments in a fun design to teach your children.'],
        ['Night Mode','A Qiyam companion: wird, tasbeeh, and last-third countdown.'],
        ['Cards Studio & Recitations','Design a verse to share; pick a reciter and download surahs.'],
        ['Hajj & Umrah guide','Rituals + Tawaf/Sa\'i counter + du\'as with sources.'],
    ]},
    { ico:'fa-bell', ar:'التذكيرات الذكية', en:'Smart Reminders', tips:[
        ['يوم الجمعة','تذكير بسورة الكهف، والصلاة على النبي ﷺ، وسنن الجمعة.'],
        ['تكبيرات العيد','تُنبّهك تلقائياً في العشر من ذي الحجة والعيد.'],
        ['الثلث الأخير','تنبيه لقيام الليل وأدعية السحر — كلها من الإعدادات.'],
    ], tipsEn:[
        ['Friday','Reminders for Surah Al-Kahf, blessings on the Prophet ﷺ, and Friday sunnahs.'],
        ['Eid Takbeer','Auto reminders during the ten days of Dhul-Hijjah and Eid.'],
        ['Last third of night','A Qiyam reminder — all from Settings.'],
    ]},
    { ico:'fa-palette', ar:'المظهر والتخصيص', en:'Appearance', tips:[
        ['المظاهر','بدّل بين مظاهر فاخرة — ومنها «ليل خالص» OLED (أسود نقي يوفّر البطارية).'],
        ['القراءة','خصّص خلفية القراءة وحجم الخط ونوعه من إعدادات القارئ.'],
    ], tipsEn:[
        ['Themes','Switch luxurious themes — including "Pure Black" OLED (saves battery).'],
        ['Reading','Customize reading background, font size and style from the reader.'],
    ]},
];

window.AnwarGuide = {
    open:function(){
        let m=$('guide-modal');
        if(!m){ m=document.createElement('div'); m.id='guide-modal'; m.className='qibla-overlay';
            m.innerHTML=`<div class="qibla-modal" style="width:95%;max-width:480px;text-align:right;max-height:90vh;overflow-y:auto;">
                <button class="close-qibla" onclick="document.getElementById('guide-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                <div id="guide-body"></div></div>`;
            document.body.appendChild(m);
        }
        const en=L()==='en';
        const html = SECTIONS.map(s=>{
            const tips=(en?s.tipsEn:s.tips).map(t=>`<div class="gd-tip"><b>${t[0]}</b><span>${t[1]}</span></div>`).join('');
            return `<div class="gd-sec"><div class="gd-head"><span class="gd-ico"><i class="fa-solid ${s.ico}"></i></span><h3>${en?s.en:s.ar}</h3></div>${tips}</div>`;
        }).join('');
        $('guide-body').innerHTML = `
            <h2 style="color:var(--accent-color);text-align:center;margin-bottom:4px;"><i class="fa-solid fa-circle-question"></i> ${tr('دليل الاستخدام','How to use')}</h2>
            <p style="text-align:center;color:var(--text-muted);font-size:0.8rem;margin-bottom:16px;">${tr('كل ميزة وطريقة استخدامها — استمتع برحلتك 🤍','Every feature and how to use it 🤍')}</p>
            ${html}`;
        m.classList.add('active');
    }
};

// صف في الإعدادات + بطاقة اختصار على الرئيسية (للمستخدم الجديد)
function inject(){
    try{ const list=document.querySelector('#tab-settings .settings-list');
        if(list && !$('guide-row')){ const r=document.createElement('div'); r.className='setting-item'; r.id='guide-row';
            r.innerHTML=`<span class="set-ico"><i class="fa-solid fa-circle-question"></i></span><span class="set-label">${tr('دليل الاستخدام والميزات','How to use & features')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i>`;
            r.onclick=()=>AnwarGuide.open(); const grp=list.querySelector('.set-group-title'); if(grp) list.insertBefore(r, grp.nextSibling); else list.appendChild(r); }
    }catch(e){}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject,1400));
else setTimeout(inject,1400);
})();
