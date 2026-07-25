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
        const saved = loadInputs();
        const rows = FIELDS.map(f=>`<div class="zk-row">
            <label for="zk-${f.id}">${L()==='en'?f.en:f.ar}</label>
            <input id="zk-${f.id}" type="number" inputmode="decimal" min="0" step="any"
                   placeholder="0" value="${saved[f.id]?saved[f.id]:''}" oninput="AnwarZakat.calc()">
        </div>`).join('');
        const o=document.createElement('div');
        o.id='zakat-overlay'; o.className='qibla-overlay';
        o.innerHTML=`<div class="qibla-modal zk-modal">
            <button class="close-qibla" onclick="AnwarZakat.close()"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="zk-title"><i class="fa-solid fa-hand-holding-heart"></i> ${tr('حاسبة الزكاة','Zakat Calculator')}</h2>
            <p class="zk-sub">${tr('زكاة المال: ربع العشر (٢.٥٪) عند بلوغ النصاب ومرور الحول.','Zakat on wealth: 2.5% once the nisab is reached and a lunar year has passed.')}</p>

            <div class="zk-fields">${rows}</div>

            <div class="zk-row zk-sel">
                <label for="zk-basis">${tr('النصاب محسوب بـ','Nisab based on')}</label>
                <select id="zk-basis" onchange="AnwarZakat.calc()">
                    <option value="silver" ${saved.basis!=='gold'?'selected':''}>${tr('الفضة (٥٩٥غ) — الأحوط','Silver (595g) — safer')}</option>
                    <option value="gold" ${saved.basis==='gold'?'selected':''}>${tr('الذهب (٨٥غ)','Gold (85g)')}</option>
                </select>
            </div>
            <div class="zk-check" onclick="AnwarZakat.toggleDeduct()">
                <input id="zk-deduct" type="checkbox" ${saved.deduct?'checked':''} onclick="event.stopPropagation();AnwarZakat.calc()">
                <span>${tr('خصم الديون الحالّة عليّ','Deduct my immediate debts')}</span>
            </div>

            <div class="zk-result" id="zk-result"></div>

            <div class="zk-note">
                <b>${tr('المصادر','Sources')}</b>
                <span>${tr('• المقدار ربع العشر: «وفي الرِّقَةِ رُبعُ العُشْرِ» — البخاري (١٤٥٤).','• The rate: "On silver, a quarter of a tenth" — Bukhari (1454).')}</span>
                <span>${tr('• نصاب الفضة مئتا درهم = ٥٩٥غ: «ليس فيما دون خمسِ أواقٍ صدقة» — مسلم.','• Silver nisab = 595g: "No zakat on less than five awaq" — Muslim.')}</span>
                <span>${tr('• نصاب الذهب عشرون ديناراً = ٨٥غ على الراجح.','• Gold nisab = 20 dinars ≈ 85g (predominant view).')}</span>
                <span>${tr('• الحول: «لا زكاة في مالٍ حتى يحول عليه الحول» — أبو داود والترمذي.','• The lunar year: "No zakat on wealth until a year passes over it" — Abu Dawud & Tirmidhi.')}</span>
                <span>${tr('• خصم الديون الحالّة قال به جمهور الفقهاء وخالف فيه غيرهم، فاجعله بحسب ما تُفتى به.','• Deducting immediate debts is the majority view; others differ — follow the ruling you are given.')}</span>
                <em>${tr('النتيجة تقديرية إرشادية. راجع أهل العلم في الحالات الخاصة (الأسهم، الشركات، الديون المتعذّرة).','This is an estimate for guidance. Consult a scholar for special cases (shares, companies, bad debts).')}</em>
            </div>
        </div>`;
        document.body.appendChild(o);
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

        if(needPrice){
            box.className='zk-result warn';
            box.innerHTML=`<i class="fa-solid fa-circle-info"></i> <span>${tr(
                'أدخل سعر غرام '+(basis==='gold'?'الذهب':'الفضة')+' لتحديد قيمة النصاب.',
                'Enter the '+(basis==='gold'?'gold':'silver')+' price per gram to determine the nisab.')}</span>`;
            saveInputs(); return;
        }

        const due = total * RATE;
        const reached = total >= nisab;
        box.className = 'zk-result ' + (reached ? 'due' : 'below');
        box.innerHTML = `
            <div class="zk-line"><span>${tr('إجمالي المال الزكوي','Total zakatable wealth')}</span><b>${fmt(total)}</b></div>
            <div class="zk-line"><span>${tr('قيمة النصاب','Nisab value')}</span><b>${fmt(nisab)}</b></div>
            ${reached ? `<div class="zk-due">
                    <span>${tr('الزكاة الواجبة (٢.٥٪)','Zakat due (2.5%)')}</span>
                    <strong>${fmt(due)}</strong>
                 </div>
                 <p class="zk-hint">${tr('بلغ مالك النصاب — تجب الزكاة إن حال عليه الحول.','Your wealth reached the nisab — zakat is due if a lunar year has passed.')}</p>`
              : `<p class="zk-hint">${tr('مالك أقلّ من النصاب، فلا تجب الزكاة — والصدقة خير.','Your wealth is below the nisab, so zakat is not due — voluntary charity is still good.')}</p>`}`;
        saveInputs();
    }
};
})();
