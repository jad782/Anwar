// =======================================================
//  zakat.js — حاسبة زكاة المال (ذهب/فضة/نقد/عروض تجارة/ديون)
//
//  الأدلّة والضوابط الفقهية المعتمدة:
//  • المقدار: ربع العشر (2.5%) — «وفي الرِّقَةِ رُبعُ العُشْرِ» رواه البخاري (1454).
//  • نصاب الفضة: مئتا درهم = 595 غراماً — «ليس فيما دون خمسِ أواقٍ صدقة» رواه مسلم،
//    والأوقية أربعون درهماً فخمسها مئتا درهم.
//  • نصاب الذهب: عشرون ديناراً (مثقالاً) = 85 غراماً على الراجح.
//  • الحول: «لا زكاة في مالٍ حتى يحول عليه الحول» رواه أبو داود والترمذي.
//  • النقود وعروض التجارة تُقوَّم بأحد النصابين، والأحوط وأنفع للفقراء نصاب الفضة
//    لأنه أقلّ قيمةً فتجب الزكاة في مالٍ أقل (وهو اختيار كثير من أهل العلم).
//  • خصم الديون الحالّة: قال به جمهور الفقهاء، وخالف فيه آخرون — فجُعل اختيارياً
//    وبُيّن الخلاف للمستخدم، ولا يُفتى في التطبيق بترجيحٍ مُلزم.
//
//  تنبيه معروض للمستخدم: النتيجة تقديرية إرشادية، وتُراجَع مع أهل العلم في
//  الحالات الخاصة (زكاة الأسهم، الشركات، الديون المتعذّرة، الذهب المستعمل...).
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ var l=L(); if(l==='ar') return a; if(l==='tr' && window.TR && TR[e]) return TR[e]; return e; }

const RATE = 0.025;            // ربع العشر
const NISAB_GOLD_G = 85;       // غرام
const NISAB_SILVER_G = 595;    // غرام
const KEY = 'zakat_inputs';

const FIELDS = [
    { id:'gold_g',    ar:'وزن الذهب (غرام)',        en:'Gold weight (g)' },
    { id:'gold_p',    ar:'سعر غرام الذهب',          en:'Gold price / gram' },
    { id:'silver_g',  ar:'وزن الفضة (غرام)',        en:'Silver weight (g)' },
    { id:'silver_p',  ar:'سعر غرام الفضة',          en:'Silver price / gram' },
    { id:'cash',      ar:'النقد والحسابات البنكية', en:'Cash & bank balances' },
    { id:'trade',     ar:'عروض التجارة (قيمة البيع)', en:'Trade goods (sale value)' },
    { id:'lent',      ar:'ديون لك مرجوّة السداد',   en:'Debts owed to you (expected)' },
    { id:'owed',      ar:'ديون حالّة عليك',          en:'Your immediate debts' }
];
// حقل واحد: تسمية + تلميح قصير أسفلها (يشرح المقصود بلا حشو)
function fld(id, labAr, labEn, hintAr, hintEn, saved, ph){
    const lab = L()==='en'?labEn:labAr, hint = L()==='en'?hintEn:hintAr;
    return `<div class="zk-f">
        <label for="zk-${id}">${lab}</label>
        <input id="zk-${id}" type="number" inputmode="decimal" min="0" step="any"
               placeholder="${ph||'0'}" value="${saved[id]?saved[id]:''}" oninput="AnwarZakat.calc()">
        ${hint?`<small>${hint}</small>`:''}
    </div>`;
}

function num(id){ const el=$('zk-'+id); if(!el) return 0; const v=parseFloat(String(el.value).replace(/,/g,'')); return isFinite(v)&&v>0 ? v : 0; }
function fmt(n){
    const s = (Math.round(n*100)/100).toLocaleString('en-US', {maximumFractionDigits:2});
    return window.fmtDigits ? fmtDigits(s) : s;
}
function saveInputs(){
    const o={}; FIELDS.forEach(f=>{ o[f.id]=num(f.id); });
    o.basis = ($('zk-basis')||{}).value || 'silver';
    o.deduct = !!($('zk-deduct')||{}).checked;
    try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){}
}
function loadInputs(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ return {}; } }

window.AnwarZakat = {
    open:function(){
        this._build();
        const o=$('zakat-overlay'); if(o) o.classList.add('active');
        this.calc();
    },
    close:function(){ const o=$('zakat-overlay'); if(o) o.classList.remove('active'); },
    _build:function(){
        if($('zakat-overlay')) return;
        const s = loadInputs();
        const o=document.createElement('div');
        o.id='zakat-overlay'; o.className='qibla-overlay';
        o.innerHTML=`<div class="qibla-modal zk-modal">
            <button class="close-qibla" onclick="AnwarZakat.close()"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="zk-title"><i class="fa-solid fa-hand-holding-heart"></i> ${tr('حاسبة الزكاة','Zakat Calculator')}</h2>
            <p class="zk-lead">${tr('الزكاة <b>٢.٥٪</b> ممّا تملك، إذا بلغ مالك حدّاً معيّناً (النصاب) ومرّ عليه <b>عام هجري</b>.','Zakat is <b>2.5%</b> of what you own, once your wealth reaches the nisab and a <b>lunar year</b> passes.')}</p>

            <!-- ١ -->
            <div class="zk-step">
                <div class="zk-step-h"><span class="zk-num">١</span> ${tr('كم تملك الآن؟','What do you own?')}</div>
                ${fld('cash', tr('النقد والحسابات البنكية','Cash & bank'), 'Cash & bank',
                      tr('كل ما معك نقداً وفي حساباتك','All your cash and bank balances'), 'All your cash and bank balances', s)}

                <div class="zk-pairwrap">
                    <span class="zk-pair-t"><i class="fa-solid fa-coins"></i> ${tr('الذهب','Gold')}</span>
                    <div class="zk-pair">
                        ${fld('gold_g', tr('الوزن (غرام)','Weight (g)'), 'Weight (g)', '', '', s)}
                        ${fld('gold_p', tr('سعر الغرام','Price / gram'), 'Price / gram', '', '', s)}
                    </div>
                    <small class="zk-skip">${tr('اتركهما فارغين إن لم يكن لديك ذهب','Leave empty if you have no gold')}</small>
                </div>

                <div class="zk-pairwrap">
                    <span class="zk-pair-t"><i class="fa-solid fa-ring"></i> ${tr('الفضة','Silver')}</span>
                    <div class="zk-pair">
                        ${fld('silver_g', tr('الوزن (غرام)','Weight (g)'), 'Weight (g)', '', '', s)}
                        ${fld('silver_p', tr('سعر الغرام','Price / gram'), 'Price / gram', '', '', s)}
                    </div>
                    <small class="zk-skip">${tr('سعر غرام الفضة مطلوب لتحديد النصاب — حتى لو لا تملك فضة','The silver price per gram is needed for the nisab — even if you own no silver')}</small>
                </div>
            </div>

            <!-- ٢ اختياري -->
            <button class="zk-more" id="zk-more-btn" onclick="AnwarZakat.toggleMore()">
                <span><i class="fa-solid fa-plus"></i> ${tr('تفاصيل إضافية (تجارة وديون)','More (trade & debts)')}</span>
                <i class="fa-solid fa-chevron-down zk-more-ch"></i>
            </button>
            <div class="zk-morebox" id="zk-morebox">
                ${fld('trade', tr('عروض التجارة','Trade goods'), 'Trade goods',
                      tr('بضاعة تنوي بيعها — بقيمتها اليوم','Goods you intend to sell — at current value'), 'Goods for sale at current value', s)}
                ${fld('lent', tr('ديون لك','Money owed to you'), 'Money owed to you',
                      tr('مال أقرضته وتتوقّع رجوعه','Money you lent and expect back'), 'Money you lent and expect back', s)}
                ${fld('owed', tr('ديون عليك','Debts you owe'), 'Debts you owe',
                      tr('ديون حالّة مستحقّة الآن','Debts due now'), 'Debts due now', s)}
                <div class="zk-check" onclick="AnwarZakat.toggleDeduct()">
                    <input id="zk-deduct" type="checkbox" ${s.deduct?'checked':''} onclick="event.stopPropagation();AnwarZakat.calc()">
                    <span>${tr('اخصم ديوني من المال الزكوي','Deduct my debts from zakatable wealth')}</span>
                </div>
                <div class="zk-f zk-sel">
                    <label for="zk-basis">${tr('احسب النصاب بـ','Base the nisab on')}</label>
                    <select id="zk-basis" onchange="AnwarZakat.calc()">
                        <option value="silver" ${s.basis!=='gold'?'selected':''}>${tr('الفضة ٥٩٥غ — الأحوط','Silver 595g — safer')}</option>
                        <option value="gold" ${s.basis==='gold'?'selected':''}>${tr('الذهب ٨٥غ','Gold 85g')}</option>
                    </select>
                    <small>${tr('الفضة أقلّ قيمة فتجب الزكاة في مالٍ أقل — وهو أنفع للفقراء','Silver is lower, so zakat becomes due on less — better for the poor')}</small>
                </div>
            </div>

            <!-- ٣ النتيجة -->
            <div class="zk-result" id="zk-result"></div>

            <button class="zk-srcbtn" onclick="AnwarZakat.toggleSrc()">
                <span><i class="fa-solid fa-book"></i> ${tr('المصادر والضوابط الفقهية','Sources & fiqh basis')}</span>
                <i class="fa-solid fa-chevron-down zk-src-ch"></i>
            </button>
            <div class="zk-note" id="zk-note">
                <span>${tr('• المقدار ربع العشر: «وفي الرِّقَةِ رُبعُ العُشْرِ» — البخاري (١٤٥٤).','• The rate: "On silver, a quarter of a tenth" — Bukhari (1454).')}</span>
                <span>${tr('• نصاب الفضة مئتا درهم = ٥٩٥غ: «ليس فيما دون خمسِ أواقٍ صدقة» — مسلم.','• Silver nisab = 595g: "No zakat on less than five awaq" — Muslim.')}</span>
                <span>${tr('• نصاب الذهب عشرون ديناراً = ٨٥غ على الراجح.','• Gold nisab = 20 dinars ≈ 85g (predominant view).')}</span>
                <span>${tr('• الحول: «لا زكاة في مالٍ حتى يحول عليه الحول» — أبو داود والترمذي.','• The lunar year: "No zakat on wealth until a year passes over it" — Abu Dawud & Tirmidhi.')}</span>
                <span>${tr('• خصم الديون الحالّة قال به جمهور الفقهاء وخالف فيه غيرهم، فاجعله بحسب ما تُفتى به.','• Deducting immediate debts is the majority view; others differ — follow the ruling you are given.')}</span>
                <em>${tr('النتيجة تقديرية إرشادية. راجع أهل العلم في الحالات الخاصة (الأسهم، الشركات، الديون المتعذّرة).','This is an estimate for guidance. Consult a scholar for special cases (shares, companies, bad debts).')}</em>
            </div>
        </div>`;
        document.body.appendChild(o);
        // افتح "تفاصيل إضافية" تلقائياً إن كان المستخدم قد أدخل فيها شيئاً سابقاً
        if(s.trade||s.lent||s.owed||s.deduct) AnwarZakat.toggleMore();
    },
    toggleMore:function(){
        const b=$('zk-morebox'), t=$('zk-more-btn'); if(!b||!t) return;
        const open=b.classList.toggle('open'); t.classList.toggle('open', open);
    },
    toggleSrc:function(){
        const n=$('zk-note'); if(!n) return;
        const open=n.classList.toggle('open');
        const c=document.querySelector('.zk-src-ch'); if(c) c.style.transform = open?'rotate(180deg)':'';
    },
    toggleDeduct:function(){ const c=$('zk-deduct'); if(c){ c.checked=!c.checked; this.calc(); } },
    calc:function(){
        const box=$('zk-result'); if(!box) return;
        const goldVal   = num('gold_g')   * num('gold_p');
        const silverVal = num('silver_g') * num('silver_p');
        const basis = ($('zk-basis')||{}).value || 'silver';
        const deduct = !!($('zk-deduct')||{}).checked;

        let total = goldVal + silverVal + num('cash') + num('trade') + num('lent');
        if(deduct) total -= num('owed');
        if(total < 0) total = 0;

        // قيمة النصاب: بسعر الغرام المُدخل للمعدن المختار (لا يمكن جلب الأسعار بلا إنترنت)
        const gram = basis==='gold' ? num('gold_p') : num('silver_p');
        const nisabG = basis==='gold' ? NISAB_GOLD_G : NISAB_SILVER_G;
        const nisab = gram * nisabG;
        const needPrice = gram <= 0;

        const metalAr = basis==='gold' ? 'الذهب' : 'الفضة';
        if(needPrice){
            box.className='zk-result guide';
            box.innerHTML=`<div class="zk-guide">
                <span class="zk-guide-ic"><i class="fa-solid fa-circle-info"></i></span>
                <div>
                    <b>${tr('ناقص خطوة واحدة','One step left')}</b>
                    <p>${tr('اكتب سعر غرام '+metalAr+' اليوم بعملتك في الأعلى — نحتاجه لنعرف هل بلغ مالك النصاب.',
                            'Enter today\'s '+(basis==='gold'?'gold':'silver')+' price per gram above — we need it to know if you reached the nisab.')}</p>
                </div></div>`;
            saveInputs(); return;
        }

        const due = total * RATE;
        const reached = total >= nisab;
        const remain = nisab - total;
        box.className = 'zk-result ' + (reached ? 'due' : 'below');
        box.innerHTML = `
            ${reached ? `<div class="zk-due">
                    <span>${tr('زكاتك الواجبة','Your zakat')}</span>
                    <strong>${fmt(due)}</strong>
                    <em>${tr('٢.٥٪ من مالك','2.5% of your wealth')}</em>
                 </div>` : `<div class="zk-nodue">
                    <span class="zk-nodue-ic"><i class="fa-solid fa-circle-check"></i></span>
                    <b>${tr('لا زكاة عليك الآن','No zakat due right now')}</b>
                    <p>${tr('مالك لم يبلغ النصاب بعد — يبقى '+fmt(remain)+' للوصول إليه. والصدقة خيرٌ على كل حال.',
                            'You have not reached the nisab yet — '+fmt(remain)+' remaining. Voluntary charity is always good.')}</p>
                 </div>`}
            <div class="zk-lines">
                <div class="zk-line"><span>${tr('مجموع مالك','Your total wealth')}</span><b>${fmt(total)}</b></div>
                <div class="zk-line"><span>${tr('النصاب (أقلّ مبلغ تجب فيه الزكاة)','Nisab (minimum for zakat)')}</span><b>${fmt(nisab)}</b></div>
            </div>
            ${reached ? `<p class="zk-hint"><i class="fa-solid fa-circle-exclamation"></i> ${tr('تجب إن مرّ على هذا المال عامٌ هجري كامل.','Due if a full lunar year has passed over this wealth.')}</p>` : ''}`;
        saveInputs();
    }
};
})();
