// =======================================================
//  qibla-ar.js — القبلة بالواقع المعزّز (كاميرا حقيقية)
//  الكعبة تطفو فوق بثّ الكاميرا المباشر وتتوسّط عند مواجهة القبلة
//  ميزة بريميوم — تُستدعى عبر AnwarQiblaAR.open()
// =======================================================
(function(){
'use strict';
function $(id){ return document.getElementById(id); }
function L(){ return (window.currentLang)||localStorage.getItem('lang')||'ar'; }
function tr(a,e){ return L()==='en'?e:a; }

var stream=null, listening=false, bearing=null, distKm=null;
var smooth=null, vel=0, wasAligned=false, lastPulse=0;
var FOV_HALF = 32; // نصف مجال الرؤية الأفقي للكاميرا بالدرجات (تقريبي)

function bearingOf(lat,lng){
    if(typeof window.computeQiblaBearing==='function') return window.computeQiblaBearing(lat,lng);
    // احتياطي: دائرة عظمى نحو الكعبة
    var K=21.4224779, Kl=39.8251832, d2r=Math.PI/180;
    var p1=lat*d2r, p2=K*d2r, dl=(Kl-lng)*d2r;
    var y=Math.sin(dl)*Math.cos(p2);
    var x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
    return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
function distOf(lat,lng){
    if(typeof window.distanceToKaaba==='function') return window.distanceToKaaba(lat,lng);
    var K=21.4224779, Kl=39.8251832, R=6371, d2r=Math.PI/180;
    var dp=(K-lat)*d2r, dl=(Kl-lng)*d2r;
    var a=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(lat*d2r)*Math.cos(K*d2r)*Math.sin(dl/2)*Math.sin(dl/2);
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

window.AnwarQiblaAR = {
    open:function(){
        if(window.requirePremium && !requirePremium('القبلة بالواقع المعزّز','AR Qibla')) return;
        build(); $('qar').classList.add('active');
        resolveBearing(); startCamera(); startOrientation();
    },
    close:function(){
        stopCamera(); stopOrientation();
        var o=$('qar'); if(o) o.classList.remove('active');
    }
};

function build(){
    if($('qar')) return;
    var o=document.createElement('div'); o.id='qar'; o.className='qar-overlay';
    o.innerHTML =
        '<video id="qar-video" playsinline autoplay muted></video>'
      + '<div class="qar-scrim"></div>'
      + '<button class="qar-close" onclick="AnwarQiblaAR.close()"><i class="fa-solid fa-xmark"></i></button>'
      + '<div class="qar-top"><div id="qar-status" class="qar-status"></div><div id="qar-sub" class="qar-sub"></div></div>'
      + '<div id="qar-edgeL" class="qar-edge left"><i class="fa-solid fa-angles-left"></i><span>'+tr('التفت لليسار','Turn left')+'</span></div>'
      + '<div id="qar-edgeR" class="qar-edge right"><span>'+tr('التفت لليمين','Turn right')+'</span><i class="fa-solid fa-angles-right"></i></div>'
      + '<div class="qar-center"><div id="qar-cross" class="qar-cross"></div>'
      +   '<div id="qar-kaaba" class="qar-kaaba"><i class="fa-solid fa-kaaba"></i><span id="qar-kaaba-lbl">'+tr('القبلة','Qibla')+'</span></div></div>'
      + '<div id="qar-hint" class="qar-hint"></div>';
    document.body.appendChild(o);
}

function resolveBearing(){
    setStatus();
    if(typeof window.qiblaBearing==='number' && window.qiblaBearing!==null){ bearing=window.qiblaBearing; }
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(p){
            bearing=bearingOf(p.coords.latitude,p.coords.longitude);
            distKm=distOf(p.coords.latitude,p.coords.longitude); setStatus();
        }, function(){ if(bearing===null){ bearing=bearingOf(41.0082,28.9784); } setStatus(); }, {enableHighAccuracy:true, timeout:8000});
    } else if(bearing===null){ bearing=bearingOf(41.0082,28.9784); setStatus(); }
}

function startCamera(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ hint(tr('الكاميرا غير متاحة على هذا الجهاز — استخدم البوصلة العادية.','Camera unavailable — use the standard compass.')); return; }
    navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:'environment' } }, audio:false })
        .then(function(s){ stream=s; var v=$('qar-video'); if(v){ v.srcObject=s; v.play&&v.play(); } })
        .catch(function(){ hint(tr('لم يُسمح بالوصول للكاميرا. فعّل الإذن من الإعدادات.','Camera permission denied. Enable it in Settings.')); });
}
function stopCamera(){ try{ if(stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream=null; } }catch(e){} }

function startOrientation(){
    function attach(){ if(listening) return; listening=true;
        if('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', onOri, true);
        else window.addEventListener('deviceorientation', onOri, true);
    }
    if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
        DeviceOrientationEvent.requestPermission().then(function(st){ if(st==='granted') attach(); else hint(tr('يلزم إذن حسّاس الاتجاه لتعمل البوصلة.','Motion sensor permission is required.')); }).catch(function(){ attach(); });
    } else attach();
}
function stopOrientation(){ if(!listening) return; listening=false;
    window.removeEventListener('deviceorientationabsolute', onOri, true);
    window.removeEventListener('deviceorientation', onOri, true);
}

function onOri(e){
    var heading;
    if(typeof e.webkitCompassHeading==='number') heading=e.webkitCompassHeading;
    else if(typeof e.alpha==='number'){
        var so=(screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(window.orientation||0);
        heading=(360-e.alpha+so)%360;
    } else return;
    if(bearing===null) return;

    if(smooth===null){ smooth=heading; vel=0; }
    else { var diff=((heading-smooth+540)%360)-180; vel=vel*0.62+diff*0.22; if(Math.abs(diff)<0.25&&Math.abs(vel)<0.05)vel=0; smooth=(smooth+vel+360)%360; }
    var h=smooth;
    var signed=((bearing - h + 540)%360)-180; // -180..180 ، 0 = القبلة أمامك تماماً
    var aligned=Math.abs(signed)<5;
    place(signed, aligned);
    pulse(signed, aligned);
    setStatus(signed, aligned);
    wasAligned=aligned;
}

function place(signed, aligned){
    var k=$('qar-kaaba'), eL=$('qar-edgeL'), eR=$('qar-edgeR'); if(!k) return;
    if(signed>=-FOV_HALF && signed<=FOV_HALF){
        var half=window.innerWidth/2;
        var x=(signed/FOV_HALF)*half*0.82;
        // ارتفاع بسيط للأعلى ليبدو "واقفاً" في الأفق
        k.style.display='flex';
        k.style.transform='translate(-50%,-50%) translateX('+x.toFixed(1)+'px) scale('+(aligned?1.15:1)+')';
        k.classList.toggle('aligned', aligned);
        eL.classList.remove('show'); eR.classList.remove('show');
    } else {
        k.style.display='none';
        if(signed>0){ eR.classList.add('show'); eL.classList.remove('show'); }
        else { eL.classList.add('show'); eR.classList.remove('show'); }
    }
}

function pulse(signed, aligned){
    if(!window.HAP) return;
    var ang=Math.abs(signed);
    if(aligned && !wasAligned){ HAP.success(); return; }
    if(!aligned && ang<50){
        var now=Date.now(); var interval=60+ang*22;
        if(now-lastPulse>interval){ lastPulse=now; HAP.light(); }
    }
}

function setStatus(signed, aligned){
    var st=$('qar-status'), sub=$('qar-sub'); if(!st) return;
    if(bearing===null){ st.textContent=tr('جارٍ تحديد القبلة…','Locating Qibla…'); if(sub) sub.textContent=''; return; }
    var deg=Math.round(bearing);
    if(aligned){ st.innerHTML='<i class="fa-solid fa-check"></i> '+tr('أنت تواجه القبلة','You face the Qibla'); st.classList.add('ok'); }
    else { st.classList.remove('ok'); st.textContent = (signed===undefined) ? tr('حرّك الهاتف أمامك','Hold phone up') : (signed>0?tr('التفت قليلاً لليمين','Turn slightly right'):tr('التفت قليلاً لليسار','Turn slightly left')); }
    if(sub) sub.textContent = deg+'° '+tr('من الشمال','from N') + (distKm?(' • '+Math.round(distKm).toLocaleString()+' '+tr('كم للكعبة','km to Kaaba')):'');
}
function hint(t){ var e=$('qar-hint'); if(e){ e.textContent=t; e.classList.add('show'); } }

})();
