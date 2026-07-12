// =======================================================
//  backup-rate.js — نسخ احتياطي (تصدير/استيراد) + طلب تقييم App Store
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang)||localStorage.getItem('lang')||'ar'; }
function tr(a,e){ return L()==='en'?e:a; }
const STORE_REVIEW = 'https://apps.apple.com/app/id6782741099?action=write-review';

window.AnwarBackup = {
    export:function(){
        try{
            const data={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k==='ls_full_backup_v1') continue; data[k]=localStorage.getItem(k); }
            const payload=JSON.stringify({app:'AlAnwar', v:1, ts:Date.now(), data:data});
            const blob=new Blob([payload],{type:'application/json'});
            const f=new File([blob],'anwar-backup.json',{type:'application/json'});
            try{ if(navigator.canShare&&navigator.canShare({files:[f]})){ navigator.share({files:[f], title:tr('نسخة الأنوار الاحتياطية','Al-Anwar backup')}); if(window.HAP)HAP.success(); return; } }catch(e){}
            const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download='anwar-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(u),1500); if(window.HAP)HAP.success();
        }catch(e){ alert(tr('تعذّر التصدير.','Export failed.')); }
    },
    import:function(){
        const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json,.json';
        inp.onchange=function(){ const file=inp.files&&inp.files[0]; if(!file) return;
            const rd=new FileReader();
            rd.onload=function(){ try{ const obj=JSON.parse(rd.result); const data=(obj&&obj.data)?obj.data:obj;
                if(!data||typeof data!=='object'){ alert(tr('ملف غير صالح.','Invalid file.')); return; }
                if(!confirm(tr('سيُستبدل محتوى التطبيق بالنسخة الاحتياطية. متابعة؟','This will replace app data with the backup. Continue?'))) return;
                Object.keys(data).forEach(k=>{ try{ localStorage.setItem(k, data[k]); }catch(e){} });
                if(window.HAP)HAP.success(); alert(tr('تم الاستيراد بنجاح. سيُعاد تشغيل التطبيق.','Imported. The app will reload.'));
                setTimeout(()=>location.reload(),600);
            }catch(e){ alert(tr('تعذّر قراءة الملف.','Could not read file.')); } };
            rd.readAsText(file); };
        inp.click();
    }
};

// طلب تقييم لطيف بعد استخدام إيجابي (لا يظهر إلا مرة)
window.AnwarRate = {
    open:function(){ window.open(STORE_REVIEW,'_blank'); },
    maybePrompt:function(){
        if(localStorage.getItem('rated')==='1' || localStorage.getItem('rate_asked')==='1') return;
        let n=parseInt(localStorage.getItem('launch_count')||'0'); // يُزاد في app boot أدناه
        if(n < 5) return;
        localStorage.setItem('rate_asked','1');
        const m=document.createElement('div'); m.id='rate-modal'; m.className='qibla-overlay active'; m.style.zIndex='4100';
        m.innerHTML=`<div class="qibla-modal" style="width:90%;max-width:360px;text-align:center;">
            <div class="upd-ico"><i class="fa-solid fa-star"></i></div>
            <h2 style="color:var(--accent-color);margin:12px 0 6px;">${tr('تستمتع بالأنوار؟','Enjoying Al-Anwar?')}</h2>
            <p style="color:var(--text-soft,#cbbfa6);font-size:0.92rem;line-height:1.8;margin-bottom:18px;">${tr('تقييمك يساعدنا على الاستمرار وإسعاد المزيد من المسلمين 🤍','Your rating helps us reach more Muslims 🤍')}</p>
            <button class="tasbeeh-pill" style="width:100%;" onclick="localStorage.setItem('rated','1');AnwarRate.open();this.closest('#rate-modal').remove();"><i class="fa-solid fa-star"></i> ${tr('قيّم على App Store','Rate on App Store')}</button>
            <button onclick="this.closest('#rate-modal').remove()" style="background:none;border:none;color:var(--text-muted);margin-top:12px;cursor:pointer;font-family:inherit;font-size:0.9rem;">${tr('لاحقاً','Later')}</button>
        </div>`;
        document.body.appendChild(m);
    }
};

function injectSettings(){
    const list=document.querySelector('#tab-settings .settings-list'); if(!list || $('anwar-backup-row')) return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`
      <div class="set-group-title">${tr('النسخ الاحتياطي والتقييم','Backup & Rating')}</div>
      <div class="setting-item" id="anwar-backup-row" onclick="AnwarBackup.export()"><span class="set-ico"><i class="fa-solid fa-cloud-arrow-down"></i></span><span class="set-label">${tr('تصدير نسخة احتياطية','Export backup')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i></div>
      <div class="setting-item" onclick="AnwarBackup.import()"><span class="set-ico"><i class="fa-solid fa-cloud-arrow-up"></i></span><span class="set-label">${tr('استيراد نسخة احتياطية','Import backup')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i></div>
      <div class="setting-item" onclick="AnwarRate.open()"><span class="set-ico" style="background:linear-gradient(135deg,var(--accent-color),var(--accent-light));color:#14110B;"><i class="fa-solid fa-star"></i></span><span class="set-label">${tr('قيّم التطبيق','Rate the app')}</span><i class="fa-solid fa-chevron-left ath-chevron"></i></div>`;
    const dataGroup=[...list.querySelectorAll('.set-group-title')].find(el=>el.dataset.i18n==='grp_data');
    if(dataGroup) list.insertBefore(wrap, dataGroup); else list.appendChild(wrap);
}

function boot(){
    // عدّاد مرات الفتح
    let n=parseInt(localStorage.getItem('launch_count')||'0')+1; localStorage.setItem('launch_count', n);
    setTimeout(injectSettings, 1300);
    setTimeout(()=>{ try{ AnwarRate.maybePrompt(); }catch(e){} }, 6000);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
