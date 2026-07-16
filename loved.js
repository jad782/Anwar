// =======================================================
//  loved.js — أذكار الأحبّة (Premium)
//  قسم خاص يكتب فيه المستخدم أدعية لشخص عزيز (والدين/أبناء/أزواج/
//  أخوة/مريض/متوفّى) مع أدعية مأثورة جاهزة + تذكير يومي بالإشعار +
//  مشاركة كبطاقة/صورة (صدقة جارية تنتشر). كل البيانات محليّة.
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }
function tr(a,e){ return L()==='en' ? e : a; }
function gate(ar,en){ return !(window.requirePremium) || requirePremium(ar,en); }
function uid(){ return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// أنواع العلاقات + أدعية مأثورة جاهزة لكل نوع
const TYPES = {
    parent_alive: { ar:'الوالدان (أحياء)', en:'Parents (living)', ico:'fa-hand-holding-heart', duas:[
        {t:'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', s:'القرآن الكريم — الإسراء: 24'},
        {t:'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ', s:'القرآن الكريم — نوح: 28'},
        {t:'اللَّهُمَّ أَطِلْ فِي عُمْرِهِمَا عَلَى طَاعَتِكَ، وَبَارِكْ لَهُمَا فِي صِحَّتِهِمَا وَعَافِيَتِهِمَا', s:'دعاء'},
        {t:'اللَّهُمَّ اجْعَلْنِي بَارًّا بِوَالِدَيَّ، وَاجْعَلْ رِضَاهُمَا سَبِيلًا إِلَى رِضَاكَ', s:'دعاء'},
        {t:'اللَّهُمَّ ارْزُقْهُمَا مِنَ الْخَيْرِ حَيْثُ لَا يَحْتَسِبَانِ، وَاكْفِهِمَا كُلَّ هَمٍّ وَغَمٍّ', s:'دعاء'},
    ]},
    parent_dead: { ar:'الوالدان (متوفّون)', en:'Parents (deceased)', ico:'fa-dove', duas:[
        {t:'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ', s:'القرآن الكريم — نوح: 28'},
        {t:'اللَّهُمَّ اغْفِرْ لَهُمَا وَارْحَمْهُمَا، وَعَافِهِمَا وَاعْفُ عَنْهُمَا، وَأَكْرِمْ نُزُلَهُمَا وَوَسِّعْ مُدْخَلَهُمَا', s:'من دعاء الجنازة — رواه مسلم'},
        {t:'اللَّهُمَّ اغْسِلْهُمَا بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِمَا مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ', s:'من دعاء الجنازة — رواه مسلم'},
        {t:'اللَّهُمَّ آنِسْ وَحْشَتَهُمَا، وَارْحَمْ غُرْبَتَهُمَا، وَاجْمَعْنَا بِهِمَا فِي جَنَّةِ النَّعِيمِ', s:'دعاء'},
        {t:'اللَّهُمَّ اجْعَلْ كُلَّ دُعَاءٍ أَدْعُوهُ لَهُمَا صَدَقَةً جَارِيَةً تُثْقِلُ مَوَازِينَهُمَا', s:'دعاء'},
    ]},
    child: { ar:'الأبناء', en:'Children', ico:'fa-child-reaching', duas:[
        {t:'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي، رَبَّنَا وَتَقَبَّلْ دُعَاءِ', s:'القرآن الكريم — إبراهيم: 40'},
        {t:'أُعِيذُهُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ', s:'تعويذ النبي ﷺ للحسن والحسين — رواه البخاري'},
        {t:'اللَّهُمَّ احْفَظْهُ بِحِفْظِكَ، وَاكْلَأْهُ بِرِعَايَتِكَ، وَبَارِكْ لِي فِيهِ', s:'دعاء'},
        {t:'اللَّهُمَّ اجْعَلْهُ قُرَّةَ عَيْنٍ لِي، وَبَارِكْ لِي فِي تَرْبِيَتِهِ، وَأَنْبِتْهُ نَبَاتًا حَسَنًا', s:'دعاء'},
        {t:'اللَّهُمَّ ارْزُقْهُ الْعِلْمَ النَّافِعَ وَالْعَمَلَ الصَّالِحَ، وَجَنِّبْهُ رُفَقَاءَ السُّوءِ', s:'دعاء'},
    ]},
    spouse: { ar:'الزوج / الزوجة', en:'Spouse', ico:'fa-heart', duas:[
        {t:'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', s:'القرآن الكريم — الفرقان: 74'},
        {t:'اللَّهُمَّ أَدِمْ بَيْنَنَا الْمَوَدَّةَ وَالرَّحْمَةَ، وَاجْمَعْ بَيْنَنَا فِي خَيْرٍ', s:'دعاء'},
        {t:'اللَّهُمَّ بَارِكْ لَهُ فِي دِينِهِ وَدُنْيَاهُ، وَاحْفَظْهُ مِنْ كُلِّ سُوءٍ', s:'دعاء'},
        {t:'اللَّهُمَّ اجْعَلْنَا مِنَ الْأَزْوَاجِ الَّذِينَ يَجْتَمِعُونَ فِي جَنَّتِكَ', s:'دعاء'},
    ]},
    sibling: { ar:'الأخوة والأخوات', en:'Siblings', ico:'fa-people-group', duas:[
        {t:'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ', s:'القرآن الكريم — الحشر: 10'},
        {t:'اللَّهُمَّ احْفَظْهُ وَاكْفِهِ، وَبَارِكْ لَهُ فِي رِزْقِهِ وَعُمُرِهِ', s:'دعاء'},
        {t:'اللَّهُمَّ أَصْلِحْ لَهُ شَأْنَهُ كُلَّهُ، وَفَرِّجْ عَنْهُ كُلَّ هَمٍّ', s:'دعاء'},
        {t:'اللَّهُمَّ اجْعَلْ بَيْنَنَا الْمَحَبَّةَ فِيكَ، وَاجْمَعْنَا عَلَى طَاعَتِكَ', s:'دعاء'},
    ]},
    sick: { ar:'المريض', en:'The sick', ico:'fa-heart-pulse', duas:[
        {t:'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَاسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', s:'متفق عليه'},
        {t:'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ (سبع مرات)', s:'رواه الترمذي وأبو داود'},
        {t:'لَا بَأْسَ طَهُورٌ إِنْ شَاءَ اللَّهُ', s:'رواه البخاري'},
        {t:'اللَّهُمَّ اجْعَلْ مَرَضَهُ طَهُورًا وَتَكْفِيرًا لِذُنُوبِهِ، وَارْزُقْهُ الصَّبْرَ وَالْأَجْرَ', s:'دعاء'},
    ]},
    deceased: { ar:'المتوفّى', en:'The deceased', ico:'fa-kaaba', duas:[
        {t:'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ', s:'من دعاء الجنازة — رواه مسلم'},
        {t:'اللَّهُمَّ اغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ', s:'من دعاء الجنازة — رواه مسلم'},
        {t:'اللَّهُمَّ أَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ، وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ، وَأَدْخِلْهُ الْجَنَّةَ، وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ', s:'من دعاء الجنازة — رواه مسلم'},
        {t:'اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ، وَلَا تَفْتِنَّا بَعْدَهُ، وَاغْفِرْ لَنَا وَلَهُ', s:'من أدعية الجنازة المأثورة'},
        {t:'اللَّهُمَّ اجْعَلْ قَبْرَهُ رَوْضَةً مِنْ رِيَاضِ الْجَنَّةِ، وَاجْمَعْنَا بِهِ فِي مُسْتَقَرِّ رَحْمَتِكَ', s:'دعاء'},
    ]},
};

// دعاء قد يكون نصّاً (كتبه المستخدم) أو {t,s} (مأثور جاهز)
function dTxt(d){ return (d&&typeof d==='object')? d.t : d; }
function dSrc(d){ return (d&&typeof d==='object')? (d.s||'') : ''; }

function load(){ try{ return JSON.parse(localStorage.getItem('anwar_loved')||'[]'); }catch(e){ return []; } }
function save(a){ localStorage.setItem('anwar_loved', JSON.stringify(a)); }

function esc(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

window.AnwarLoved = {
    _cur:null,

    open:function(){ if(!gate('أذكار الأحبّة','Loved ones')) return;
        let m=$('loved-modal');
        if(!m){ m=document.createElement('div'); m.id='loved-modal'; m.className='qibla-overlay';
            m.innerHTML=`<div class="qibla-modal" style="width:95%;max-width:460px;text-align:right;max-height:90vh;overflow-y:auto;">
                <button class="close-qibla" onclick="AnwarLoved.close()"><i class="fa-solid fa-xmark"></i></button>
                <div id="loved-body"></div></div>`;
            document.body.appendChild(m);
        }
        this._cur=null; this._list(); m.classList.add('active');
    },
    close:function(){ const m=$('loved-modal'); if(m) m.classList.remove('active'); },

    // ------- شاشة القائمة -------
    _list:function(){
        const people=load();
        const cards = people.map(p=>{
            const t=TYPES[p.type]||{ar:'',ico:'fa-heart'};
            const cnt=(p.duas||[]).length;
            return `<div class="loved-card" onclick="AnwarLoved.openPerson('${p.id}')">
                <span class="lv-ico"><i class="fa-solid ${t.ico}"></i></span>
                <div class="lv-txt"><b>${esc(p.name)}</b><span>${t.ar} · ${cnt} ${tr('دعاء','duas')}${p.remind?' · <i class="fa-solid fa-bell" style="color:var(--accent-color)"></i>':''}</span></div>
                <i class="fa-solid fa-chevron-left" style="color:var(--accent-color);opacity:.55"></i></div>`;
        }).join('');
        const empty = `<div class="loved-empty"><i class="fa-solid fa-hand-holding-heart"></i>
            <p>${tr('اكتب أدعية لمن تحبّ — والديك، أبنائك، أو من فقدتَهم — وذكّرك التطبيق بها كل يوم. دعاؤك لهم صدقة جارية 🤍','Write duas for those you love and be reminded daily.')}</p></div>`;
        $('loved-body').innerHTML=`
            <h2 style="color:var(--accent-color);text-align:center;margin-bottom:4px;"><i class="fa-solid fa-hand-holding-heart"></i> ${tr('أذكار الأحبّة','Loved Ones')}</h2>
            <p style="text-align:center;color:var(--text-muted);font-size:0.76rem;margin-bottom:16px;">${tr('«إذا مات الإنسان انقطع عمله إلا من ثلاث… أو ولد صالح يدعو له»','A righteous one who prays for them')}</p>
            ${people.length?`<div class="loved-list">${cards}</div>`:empty}
            <button class="tasbeeh-pill" style="width:100%;margin-top:16px;" onclick="AnwarLoved.addPerson()"><i class="fa-solid fa-plus"></i> ${tr('أضف شخصاً عزيزاً','Add a loved one')}</button>`;
    },

    // ------- إضافة شخص -------
    addPerson:function(){
        const opts = Object.keys(TYPES).map(k=>`<button class="loved-type" onclick="AnwarLoved._pick('${k}')">
            <i class="fa-solid ${TYPES[k].ico}"></i><span>${TYPES[k].ar}</span></button>`).join('');
        $('loved-body').innerHTML=`
            <h2 style="color:var(--accent-color);text-align:center;margin-bottom:6px;">${tr('من تريد أن تدعو له؟','Who do you pray for?')}</h2>
            <p style="text-align:center;color:var(--text-muted);font-size:0.78rem;margin-bottom:16px;">${tr('سيُنشئ التطبيق قسماً خاصاً بأدعية مأثورة تناسبه، وتقدر تضيف أدعيتك.','Authentic duas will be prepared; add your own too.')}</p>
            <div class="loved-types">${opts}</div>
            <button class="prem-restore" onclick="AnwarLoved._list()">${tr('رجوع','Back')}</button>`;
    },
    _pick:function(type){
        this._pendingType=type;
        const t=TYPES[type];
        $('loved-body').innerHTML=`
            <h2 style="color:var(--accent-color);text-align:center;margin-bottom:6px;"><i class="fa-solid ${t.ico}"></i> ${t.ar}</h2>
            <p style="text-align:center;color:var(--text-muted);font-size:0.78rem;margin-bottom:14px;">${tr('اكتب اسم الشخص (أو صفته)','Enter the name')}</p>
            <input id="loved-name" class="rt-reciter" style="width:100%;text-align:center;font-size:1rem;padding:12px;" placeholder="${tr('مثال: أمي رحمها الله','e.g. My mother')}" maxlength="40">
            <button class="tasbeeh-pill" style="width:100%;margin-top:16px;" onclick="AnwarLoved._create()"><i class="fa-solid fa-check"></i> ${tr('إنشاء القسم','Create')}</button>
            <button class="prem-restore" onclick="AnwarLoved.addPerson()">${tr('رجوع','Back')}</button>`;
        setTimeout(()=>{ const el=$('loved-name'); if(el) el.focus(); },100);
    },
    _create:function(){
        const name=($('loved-name').value||'').trim(); if(!name){ if(window.HAP)HAP.warn&&HAP.warn(); const el=$('loved-name'); if(el)el.focus(); return; }
        const type=this._pendingType;
        const p={ id:uid(), name:name, type:type, remind:false, duas:(TYPES[type].duas||[]).slice() };
        const arr=load(); arr.push(p); save(arr);
        if(window.HAP)HAP.success();
        this.openPerson(p.id);
    },

    // ------- شاشة شخص -------
    openPerson:function(id){
        const p=load().find(x=>x.id===id); if(!p) return; this._cur=id;
        const t=TYPES[p.type]||{ar:'',ico:'fa-heart'};
        const duas=(p.duas||[]).map((d,i)=>`<div class="loved-dua">
            <p>${esc(dTxt(d))}</p>
            ${dSrc(d)?`<div class="loved-dua-src"><i class="fa-solid fa-circle-check"></i> ${esc(dSrc(d))}</div>`:''}
            <button class="loved-dua-del" onclick="AnwarLoved.delDua(${i})" title="${tr('حذف','Delete')}"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('');
        $('loved-body').innerHTML=`
            <h2 style="color:var(--accent-color);text-align:center;margin-bottom:2px;"><i class="fa-solid ${t.ico}"></i> ${esc(p.name)}</h2>
            <p style="text-align:center;color:var(--text-muted);font-size:0.74rem;margin-bottom:14px;">${t.ar}</p>

            <div class="loved-remind" onclick="AnwarLoved.toggleRemind()">
                <span class="set-ico" style="background:linear-gradient(135deg,var(--accent-color),var(--accent-light));color:#14110B;"><i class="fa-solid fa-bell"></i></span>
                <span class="set-label">${tr('تذكير يومي بالدعاء له','Daily reminder to pray')}</span>
                <label class="switch" style="pointer-events:none"><input type="checkbox" ${p.remind?'checked':''} style="pointer-events:none"><span class="slider round"></span></label>
            </div>

            <div class="loved-duas">${duas || `<p style="text-align:center;color:var(--text-muted);font-size:.85rem">${tr('لا أدعية بعد','No duas yet')}</p>`}</div>

            <button class="tasbeeh-pill" style="width:100%;margin-top:12px;" onclick="AnwarLoved.addDua()"><i class="fa-solid fa-pen"></i> ${tr('اكتب دعاءً خاصاً','Write your own dua')}</button>
            <div class="loved-share-row">
                <button class="loved-sbtn" onclick="AnwarLoved.shareCard()"><i class="fa-solid fa-image"></i> ${tr('بطاقة','Card')}</button>
                <button class="loved-sbtn" onclick="AnwarLoved.shareText()"><i class="fa-solid fa-share-nodes"></i> ${tr('مشاركة','Share')}</button>
                <button class="loved-sbtn" onclick="AnwarLoved.exportPdf()"><i class="fa-solid fa-file-pdf"></i> PDF</button>
            </div>
            <button class="prem-restore" style="color:#c0392b" onclick="AnwarLoved.delPerson()">${tr('حذف هذا القسم','Delete section')}</button>
            <button class="prem-restore" onclick="AnwarLoved._list()">${tr('رجوع للقائمة','Back to list')}</button>`;
    },
    _p:function(){ return load().find(x=>x.id===this._cur); },
    _upd:function(fn){ const arr=load(); const i=arr.findIndex(x=>x.id===this._cur); if(i<0)return; fn(arr[i]); save(arr); },

    addDua:function(){
        const p=this._p(); if(!p) return;
        const t=TYPES[p.type]||{ar:''};
        $('loved-body').innerHTML=`
            <h2 style="color:var(--accent-color);text-align:center;margin-bottom:10px;">${tr('دعاء لـ','Dua for')} ${esc(p.name)}</h2>
            <textarea id="loved-newdua" class="rt-reciter" style="width:100%;min-height:130px;padding:12px;font-size:1rem;line-height:1.9;text-align:right;resize:vertical;" placeholder="${tr('اكتب دعاءك من قلبك…','Write your dua…')}"></textarea>
            <button class="tasbeeh-pill" style="width:100%;margin-top:14px;" onclick="AnwarLoved._saveDua()"><i class="fa-solid fa-check"></i> ${tr('حفظ الدعاء','Save dua')}</button>
            <button class="prem-restore" onclick="AnwarLoved.openPerson('${p.id}')">${tr('رجوع','Back')}</button>`;
        setTimeout(()=>{ const el=$('loved-newdua'); if(el) el.focus(); },100);
    },
    _saveDua:function(){
        const v=($('loved-newdua').value||'').trim(); if(!v){ return; }
        this._upd(p=>{ p.duas=p.duas||[]; p.duas.push(v); });
        if(window.HAP)HAP.success();
        this.openPerson(this._cur);
    },
    delDua:function(i){ this._upd(p=>{ if(p.duas) p.duas.splice(i,1); }); if(window.HAP)HAP.light(); this.openPerson(this._cur); },
    delPerson:function(){
        if(!confirm(tr('حذف هذا القسم وكل أدعيته؟','Delete this section and its duas?'))) return;
        const arr=load().filter(x=>x.id!==this._cur); save(arr);
        this._cancelRemind(this._cur);
        if(window.HAP)HAP.light(); this._list();
    },

    // ------- التذكير اليومي (إشعار محلي عبر Capacitor) -------
    toggleRemind:function(){
        const p=this._p(); if(!p) return;
        const on=!p.remind;
        this._upd(x=>{ x.remind=on; });
        if(on) this._scheduleRemind(p); else this._cancelRemind(p.id);
        if(window.HAP)HAP.light();
        this.openPerson(this._cur);
    },
    _notifId:function(id){ // معرّف ثابت 2300..2399 مشتق من id
        let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return 2300+(h%100);
    },
    _scheduleRemind:async function(p){
        try{
            if(!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;
            const LN=window.Capacitor.Plugins.LocalNotifications; if(!LN) return;
            try{ let st=await LN.checkPermissions(); if(st.display!=='granted'){ st=await LN.requestPermissions(); } if(st.display!=='granted') return; }catch(e){ return; }
            const t=TYPES[p.type]||{ar:''};
            await LN.schedule({ notifications:[{
                id:this._notifId(p.id),
                title: tr('ادعُ لـ ','Pray for ')+p.name+' 🤲',
                body: (p.duas&&p.duas[0])? dTxt(p.duas[0]).slice(0,110) : tr('لا تنسَ الدعاء له اليوم','Don\'t forget to pray today'),
                schedule:{ on:{ hour:21, minute:0 }, repeats:true, allowWhileIdle:true }
            }]});
        }catch(e){}
    },
    _cancelRemind:async function(id){
        try{
            if(!(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications)) return;
            await window.Capacitor.Plugins.LocalNotifications.cancel({ notifications:[{ id:this._notifId(id) }] });
        }catch(e){}
    },

    // ------- المشاركة النصيّة + PDF -------
    _plain:function(p){
        const t=TYPES[p.type]||{ar:''};
        return (p.name)+'\n'+t.ar+'\n\n'+(p.duas||[]).map((d,i)=>{ const s=dSrc(d); return (i+1)+'. '+dTxt(d)+(s?'\n   ('+s+')':''); }).join('\n\n')+'\n\n— '+tr('من تطبيق الأنوار','via Al-Anwar');
    },
    shareText:async function(){
        const p=this._p(); if(!p) return; const txt=this._plain(p);
        try{ if(navigator.share){ await navigator.share({ text:txt }); if(window.HAP)HAP.success(); return; } }catch(e){ if(e&&e.name==='AbortError') return; }
        try{ await navigator.clipboard.writeText(txt); if(typeof showBadgeToast==='function') showBadgeToast({emoji:'📋',name:tr('نُسخت','Copied'),desc:tr('الأدعية في الحافظة','Duas copied')}); }catch(e){}
    },
    exportPdf:function(){
        const p=this._p(); if(!p) return; const t=TYPES[p.type]||{ar:''};
        const duas=(p.duas||[]).map((d,i)=>`<div class="d"><span>${i+1}</span><div class="dt"><p>${esc(dTxt(d))}</p>${dSrc(d)?`<em>${esc(dSrc(d))}</em>`:''}</div></div>`).join('');
        const html=`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
            <title>${esc(p.name)}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;700&display=swap');
              body{font-family:'Tajawal',sans-serif;background:#0f0d08;color:#f3ecd9;margin:0;padding:40px 28px;}
              .head{text-align:center;border-bottom:2px solid #d4a843;padding-bottom:18px;margin-bottom:26px;}
              .head h1{font-family:'Amiri',serif;color:#e9c877;font-size:30px;margin:0 0 6px;}
              .head span{color:#b9ad90;font-size:15px;}
              .d{display:flex;gap:12px;margin:0 0 20px;align-items:flex-start;}
              .d span{flex:none;width:30px;height:30px;border-radius:50%;background:#d4a843;color:#14110b;display:flex;align-items:center;justify-content:center;font-weight:700;}
              .dt{flex:1;}
              .d p{font-family:'Amiri',serif;font-size:21px;line-height:2;margin:2px 0;}
              .dt em{display:block;color:#c9a24a;font-size:12.5px;font-style:normal;margin-top:4px;}
              .foot{text-align:center;margin-top:34px;color:#9c916f;font-size:13px;}
            </style></head><body>
            <div class="head"><h1>${esc(p.name)}</h1><span>${t.ar} — ${tr('أدعية من القلب','Duas from the heart')}</span></div>
            ${duas}
            <div class="foot">🤍 ${tr('دعاؤك له صدقة جارية · تطبيق الأنوار','Your dua is an ongoing charity · Al-Anwar')}</div>
            <script>setTimeout(function(){window.print();},500)<\/script>
            </body></html>`;
        const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
        else { // fallback: بلوب
            const blob=new Blob([html],{type:'text/html'}); const u=URL.createObjectURL(blob); window.open(u,'_blank'); setTimeout(()=>URL.revokeObjectURL(u),4000);
        }
    },

    // ------- مشاركة كبطاقة (يربطها باستوديو البطاقات إن وُجد، وإلا يرسم بطاقة) -------
    shareCard:async function(){
        const p=this._p(); if(!p) return;
        const dua=(p.duas&&p.duas.length)? dTxt(p.duas[0]) : '';
        // إن توفّر استوديو البطاقات مرّر النص إليه
        try{ if(window.AnwarCards && AnwarCards.openWith){ this.close(); AnwarCards.openWith(dua, p.name); return; } }catch(e){}
        // وإلا ارسم بطاقة مباشرة
        this._drawCard(p, dua);
    },
    _drawCard:async function(p, dua){
        const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
        try{ await document.fonts.load('60px Amiri'); await document.fonts.load('30px Tajawal'); }catch(e){}
        const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#123125'); g.addColorStop(1,'#05100b'); x.fillStyle=g; x.fillRect(0,0,W,H);
        const rg=x.createRadialGradient(W/2,H*0.3,0,W/2,H*0.3,W*0.75); rg.addColorStop(0,'rgba(233,200,119,0.12)'); rg.addColorStop(1,'transparent'); x.fillStyle=rg; x.fillRect(0,0,W,H);
        x.strokeStyle='rgba(233,200,119,0.5)'; x.lineWidth=4; x.strokeRect(60,60,W-120,H-120);
        x.textAlign='center'; try{x.direction='rtl';}catch(e){}
        x.fillStyle='#e9c877'; x.font='40px Tajawal, sans-serif'; x.fillText('🤍 '+p.name, W/2, 200);
        // النص
        x.fillStyle='#f7efdc'; x.font='58px Amiri, serif';
        const words=(dua||'').split(/\s+/); const lines=[]; let ln='';
        words.forEach(w=>{ const t=ln?ln+' '+w:w; if(x.measureText(t).width>W-260&&ln){lines.push(ln);ln=w;}else ln=t; }); if(ln)lines.push(ln);
        let y=H/2-(lines.length-1)*48; lines.forEach(l=>{ x.fillText(l,W/2,y); y+=96; });
        x.fillStyle='rgba(247,239,220,0.4)'; x.font='30px Tajawal, sans-serif'; x.fillText('تطبيق الأنوار', W/2, H-130);
        cv.toBlob(async b=>{ if(!b)return; const f=new File([b],'anwar-dua.png',{type:'image/png'});
            try{ if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f]}); if(window.HAP)HAP.success(); return; } }catch(e){}
            const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='anwar-dua.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(u),1500); if(window.HAP)HAP.success();
        },'image/png');
    }
};
})();
