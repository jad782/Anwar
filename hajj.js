// =======================================================
//  hajj.js — رفيق العمرة والحج (Premium)
//  عدّاد طواف/سعي بالاهتزاز + دليل المناسك خطوة بخطوة + أدعية.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }

const UMRAH = [
    { t:'الإحرام من الميقات', d:'الاغتسال والتطيّب، لبس الإحرام، ونيّة العمرة مع التلبية: «لبّيك اللهم عمرة».' },
    { t:'التلبية', d:'«لبّيك اللهم لبّيك، لبّيك لا شريك لك لبّيك، إنّ الحمد والنعمة لك والملك، لا شريك لك».' },
    { t:'الطواف سبعة أشواط', d:'يبدأ من الحجر الأسود ويستلمه أو يشير إليه، مع الاضطباع والرمَل في الثلاثة الأولى للرجال.' },
    { t:'ركعتان خلف المقام', d:'صلاة ركعتين خلف مقام إبراهيم إن تيسّر، ثم الشرب من ماء زمزم.' },
    { t:'السعي سبعة أشواط', d:'بين الصفا والمروة، يبدأ بالصفا وينتهي بالمروة، ويسعى بين العلمين الأخضرين.' },
    { t:'الحلق أو التقصير', d:'يحلق الرجل رأسه أو يقصّر، والمرأة تقصّر قدر أنملة، وبها تمّت العمرة.' },
];
const HAJJ = [
    { t:'يوم التروية (8 ذو الحجة)', d:'الإحرام بالحج والتوجّه إلى مِنى، وصلاة الظهر والعصر والمغرب والعشاء والفجر قصراً.' },
    { t:'يوم عرفة (9 ذو الحجة)', d:'الوقوف بعرفة بعد الزوال حتى الغروب، والإكثار من الدعاء والتلبية والذكر.' },
    { t:'المزدلفة', d:'المبيت بمزدلفة، وجمع الحصى، وصلاة الفجر ثم الدعاء عند المشعر الحرام.' },
    { t:'رمي جمرة العقبة', d:'يوم النحر: رمي جمرة العقبة بسبع حصيات، ثم النحر، ثم الحلق أو التقصير.' },
    { t:'طواف الإفاضة والسعي', d:'التوجّه لمكة لطواف الإفاضة والسعي (لمن عليه سعي).' },
    { t:'أيام التشريق ورمي الجمرات', d:'المبيت بمنى ورمي الجمرات الثلاث كل يوم بعد الزوال.' },
    { t:'طواف الوداع', d:'آخر ما يفعله الحاجّ عند مغادرة مكة.' },
];
// أدعية مصنّفة حسب الموقف
const DUA_GROUPS = [
    { t:'التلبية', src:'متفق عليه', items:[
        'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    ]},
    { t:'عند الطواف', src:'«رَبَّنَا آتِنَا…» من القرآن — البقرة: 201، ولم يثبت دعاء مخصوص لكل شوط', items:[
        'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ (عند محاذاة الحجر الأسود واستلامه أو الإشارة إليه)',
        'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ (بين الركن اليماني والحجر الأسود)',
        'ويدعو بما شاء في بقية الطواف، فليس فيه ذكر مخصوص واجب',
    ]},
    { t:'على الصفا والمروة', src:'رواه مسلم — من حديث جابر في صفة حجّه ﷺ', items:[
        'يقرأ عند الصعود على الصفا: ﴿إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ﴾، ويقول: أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ',
        'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ (ثلاثاً، يدعو بينها)',
    ]},
    { t:'يوم عرفة (أفضل الدعاء)', src:'«خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ…» رواه الترمذي', items:[
        'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ',
        'ويُكثر من الدعاء والذكر بما يشاء إلى غروب الشمس',
    ]},
    { t:'دعاء جامع', src:'«رَبَّنَا تَقَبَّلْ مِنَّا» من القرآن — البقرة: 127', items:[
        'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ',
        'اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا، وَسَعْيًا مَشْكُورًا، وَذَنْبًا مَغْفُورًا',
    ]},
];

// معلومات إرشادية (شروط/مواقيت/محظورات/أنواع)
const GUIDE = [
    { t:'شروط وجوب الحج', items:[
        'الإسلام','العقل','البلوغ','الحرّية','الاستطاعة (المالية والبدنية والأمن في الطريق)','وللمرأة: وجود مَحرم يرافقها',
    ]},
    { t:'المواقيت المكانية (من أين تُحرم؟)', items:[
        'ذو الحُليفة (أبيار علي) — لأهل المدينة ومن يمرّ بها','الجُحفة (رابغ) — لأهل الشام ومصر والمغرب','قَرن المنازل (السيل الكبير) — لأهل نجد والطائف','يَلَمْلَم (السعدية) — لأهل اليمن','ذات عِرق — لأهل العراق','من كان دون المواقيت فمن حيث أنشأ، وأهل مكة يُحرمون من مكة للحج',
    ]},
    { t:'محظورات الإحرام', items:[
        'حلق الشعر أو تقليم الأظافر','التطيّب بعد الإحرام','لبس المخيط للرجال وتغطية الرأس','عقد النكاح','الجماع ومقدّماته','قتل الصيد البرّي','وللمرأة: تغطية الوجه بالنقاب ولبس القفازين',
    ]},
    { t:'أنواع النُّسُك', items:[
        'التمتّع: يُحرم بالعمرة في أشهر الحج، فإذا فرغ منها تحلّل، ثم يُحرم بالحج يوم التروية (وعليه هَدْي) — وهو الأفضل',
        'القِران: يُحرم بالعمرة والحج معاً ولا يتحلّل حتى يوم النحر (وعليه هَدْي)',
        'الإفراد: يُحرم بالحج وحده (ولا هَدْي عليه)',
    ]},
];

function getC(){ try{ return JSON.parse(localStorage.getItem('hajj_counters')||'{"tawaf":0,"saai":0}'); }catch(e){ return {tawaf:0,saai:0}; } }
function setC(c){ localStorage.setItem('hajj_counters', JSON.stringify(c)); }

window.AnwarHajj = {
    open:function(){
        if(window.requirePremium && !requirePremium('رفيق الحج والعمرة','Hajj & Umrah companion')) return;
        let m=$('hajj-modal');
        if(!m){ m=document.createElement('div'); m.id='hajj-modal'; m.className='qibla-overlay';
            m.innerHTML=`<div class="qibla-modal" style="width:95%;max-width:460px;text-align:right;max-height:90vh;overflow-y:auto;">
                <button class="close-qibla" onclick="document.getElementById('hajj-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                <h2 style="color:var(--accent-color);text-align:center;margin-bottom:4px;"><i class="fa-solid fa-kaaba"></i> ${tr('رفيق العمرة والحج','Hajj & Umrah')}</h2>
                <div class="hajj-tabs"><button class="hajj-tab active" data-t="count" onclick="AnwarHajj.tab('count')">${tr('العدّادات','Counters')}</button>
                    <button class="hajj-tab" data-t="umrah" onclick="AnwarHajj.tab('umrah')">${tr('العمرة','Umrah')}</button>
                    <button class="hajj-tab" data-t="hajj" onclick="AnwarHajj.tab('hajj')">${tr('الحج','Hajj')}</button>
                    <button class="hajj-tab" data-t="guide" onclick="AnwarHajj.tab('guide')">${tr('دليل','Guide')}</button>
                    <button class="hajj-tab" data-t="dua" onclick="AnwarHajj.tab('dua')">${tr('أدعية','Dua')}</button></div>
                <div id="hajj-body"></div></div>`;
            document.body.appendChild(m);
        }
        AnwarHajj.tab('count'); m.classList.add('active');
    },
    tab:function(t){
        document.querySelectorAll('#hajj-modal .hajj-tab').forEach(b=>b.classList.toggle('active', b.dataset.t===t));
        const body=$('hajj-body'); if(!body) return;
        if(t==='count'){
            const c=getC();
            body.innerHTML=`<p class="hajj-hint">${tr('اضغط الدائرة مع كل شوط. تهتزّ عند كل شوط، واهتزازة قوية عند إتمام السبعة.','Tap for each round. Vibrates each round, strong at seven.')}</p>
                <div class="hajj-counters">
                    ${counterCard('tawaf', tr('الطواف','Tawaf'), c.tawaf)}
                    ${counterCard('saai', tr('السعي','Saai'), c.saai)}
                </div>`;
        } else if(t==='umrah' || t==='hajj'){
            const list = t==='umrah'?UMRAH:HAJJ;
            body.innerHTML = `<div class="manasik">` + list.map((s,i)=>`<div class="manasik-step"><span class="ms-num">${i+1}</span>
                <div class="ms-txt"><b>${s.t}</b><span>${s.d}</span></div></div>`).join('') + `</div>`;
        } else if(t==='guide'){
            body.innerHTML = GUIDE.map(g=>`<div class="hajj-group">
                <div class="hajj-group-t">${g.t}</div>
                <ul class="hajj-group-list">${g.items.map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('');
        } else {
            body.innerHTML = DUA_GROUPS.map(g=>`<div class="hajj-group">
                <div class="hajj-group-t">${g.t}</div>
                ${g.items.map(d=>`<div class="hajj-dua">${d}</div>`).join('')}
                ${g.src?`<div class="hajj-group-src"><i class="fa-solid fa-circle-check"></i> ${g.src}</div>`:''}</div>`).join('');
        }
    },
    tap:function(key){
        const c=getC(); c[key]=(c[key]||0);
        if(c[key]>=7){ c[key]=0; }
        c[key]++;
        setC(c);
        const el=$('hc-'+key); if(el) el.textContent = c[key];
        const ring=$('hcr-'+key); if(ring) ring.style.setProperty('--p', (c[key]/7*100)+'%');
        if(window.HAP){ if(c[key]===7) HAP.success(); else HAP.light(); }
        if(c[key]===7){ const done=$('hcd-'+key); if(done) done.style.opacity='1'; }
        else { const done=$('hcd-'+key); if(done) done.style.opacity='0'; }
    },
    reset:function(key){ const c=getC(); c[key]=0; setC(c); AnwarHajj.tab('count'); }
};
function counterCard(key, name, val){
    return `<div class="hajj-cc">
        <div class="hcc-name">${name}</div>
        <div class="hcc-ring" id="hcr-${key}" style="--p:${val/7*100}%" onclick="AnwarHajj.tap('${key}')">
            <span class="hcc-val" id="hc-${key}">${val}</span><span class="hcc-of">/ 7</span>
            <span class="hcc-done" id="hcd-${key}" style="opacity:${val===7?1:0}">✓</span>
        </div>
        <button class="hcc-reset" onclick="AnwarHajj.reset('${key}')"><i class="fa-solid fa-rotate-left"></i> ${tr('تصفير','Reset')}</button>
    </div>`;
}
})();
