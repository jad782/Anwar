// =======================================================
//  i18n-ui.js — طبقة ترجمة نصوص الواجهة المكتوبة عربيةً مباشرةً في الشيفرة
//
//  الخلفية: معظم الوحدات تبني واجهتها بـ innerHTML وتكتب العربية مباشرة في ٩١٣
//  موضعاً، فلا تتأثّر بتبديل اللغة. تعديل كل موضع مخاطرة كبيرة على تطبيق منشور،
//  فبُنيت هذه الطبقة: قاموس عربي → (إنجليزي، تركي) يُطبَّق على *عُقد النص* بعد
//  الرسم، مع حفظ الأصل على العقدة لاستعادته عند العودة للعربية.
//
//  الأمان (مهم — التطبيق ديني):
//   • مطابقة تامّة للنص كاملاً فقط. لا استبدال جزئي إطلاقاً، فيستحيل تشويه آية
//     أو ذكر بقصّ كلمة منه.
//   • القاموس لا يحوي أي نصّ قرآني أو ذِكر أو دعاء — عناوين وأزرار فقط.
//   • تُستثنى حاويات المحتوى الشرعي صراحةً (المصحف، الأذكار، البطاقات...).
// =======================================================
(function(){
'use strict';

// [عربي] : [إنجليزي, تركي]
const UIT = {
  // ——— تنقّل وعناوين رئيسية ———
  'الرئيسية':['Home','Ana sayfa'], 'المصحف':['Quran','Kur’an'], 'الأذكار':['Adhkar','Zikirler'],
  'الإعدادات':['Settings','Ayarlar'], 'أوقات الصلاة':['Prayer Times','Namaz vakitleri'],
  'مهماتي اليومية':['My Daily Tasks','Günlük görevlerim'], 'مفاتيح يومك':['Your Day Keys','Günün anahtarları'],
  'ختماتي القرآنية':['My Khatmas','Hatimlerim'], 'إنجازات اليوم':['Today’s Achievements','Bugünün kazanımları'],
  'اتجاه القبلة':['Qibla Direction','Kıble yönü'], 'أوقات الكراهة':['Disliked Times','Mekruh vakitler'],
  'المسبحة':['Tasbeeh','Tesbih'], 'الفضائل':['Virtues','Faziletler'], 'الأدعية':['Duas','Dualar'],
  'القرآن':['Quran','Kur’an'], 'القراءة':['Reading','Okuma'], 'البيانات':['Data','Veriler'],
  'تنبيهات الأذان':['Athan Alerts','Ezan bildirimleri'],

  // ——— أوقات الصلاة ———
  'الفجر':['Fajr','İmsak'], 'الشروق':['Sunrise','Güneş'], 'الظهر':['Dhuhr','Öğle'],
  'العصر':['Asr','İkindi'], 'المغرب':['Maghrib','Akşam'], 'العشاء':['Isha','Yatsı'],
  'حان الآن وقت':['Time now for','Şimdi vakit:'], 'وقت السحر':['Suhoor time','Sahur vakti'],
  'يوم الجمعة':['Friday','Cuma'], 'سنن الجمعة':['Friday Sunnahs','Cuma sünnetleri'],
  'موقعك':['Your location','Konumun'],

  // ——— أيام الأسبوع ———
  'الأحد':['Sunday','Pazar'], 'الإثنين':['Monday','Pazartesi'], 'الثلاثاء':['Tuesday','Salı'],
  'الأربعاء':['Wednesday','Çarşamba'], 'الخميس':['Thursday','Perşembe'],
  'الجمعة':['Friday','Cuma'], 'السبت':['Saturday','Cumartesi'],

  // ——— أقسام الأذكار ———
  'أذكار الصباح':['Morning Adhkar','Sabah zikirleri'], 'أذكار المساء':['Evening Adhkar','Akşam zikirleri'],
  'أذكار بعد الصلاة':['After Prayer','Namaz sonrası'], 'أذكار النوم':['Before Sleep','Uyku zikirleri'],
  'أذكار الاستيقاظ':['On Waking','Uyanınca'], 'أذكار الوضوء':['Wudu Adhkar','Abdest zikirleri'],
  'أذكار الطعام':['Food Adhkar','Yemek duaları'], 'أذكار الأذان':['Adhan Adhkar','Ezan duaları'],
  'دخول وخروج المنزل':['Entering & Leaving Home','Eve giriş çıkış'],
  'دخول وخروج المسجد':['Entering & Leaving the Mosque','Camiye giriş çıkış'],
  'دخول وخروج الخلاء':['Entering & Leaving the Restroom','Tuvalete giriş çıkış'],
  'اقرأ أذكارك':['Read your adhkar','Zikirlerini oku'], 'أذكار الصغار':['Kids Adhkar','Çocuk zikirleri'],
  'عند الغضب':['When Angry','Öfkelenince'], 'الاستغفار والتوبة':['Istighfar & Repentance','İstiğfar ve tevbe'],
  'الدعاء للوالدين':['Dua for Parents','Ana baba için dua'], 'عيادة المريض':['Visiting the Sick','Hasta ziyareti'],
  'جوامع الدعاء':['Comprehensive Duas','Kapsamlı dualar'], 'طلب العلم':['Seeking Knowledge','İlim talebi'],
  'أدعية قرآنية':['Quranic Duas','Kur’anî dualar'], 'أدعية نبوية جامعة':['Prophetic Duas','Nebevî dualar'],
  'الرزق والبركة':['Provision & Barakah','Rızık ve bereket'],
  'الثبات وحسن الخاتمة':['Steadfastness & Good End','Sebat ve hüsn-i hâtime'],
  'دعاء الاستخارة':['Istikharah Dua','İstihare duası'], 'دعاء السفر':['Travel Dua','Yolculuk duası'],
  'دعاء نزول المطر':['Dua for Rain','Yağmur duası'], 'دعاء الريح':['Dua for Wind','Rüzgâr duası'],
  'دعاء دخول السوق':['Dua Entering the Market','Çarşıya girerken'],
  'دعاء رؤية الهلال':['Dua on Seeing the Crescent','Hilâli görünce'],
  'دعاء القنوت':['Qunut Dua','Kunut duası'], 'دعاء الإفطار':['Iftar Dua','İftar duası'],
  'الفزع والأرق في النوم':['Fear & Sleeplessness','Korku ve uykusuzluk'],
  'الحفظ من كل سوء':['Protection from Harm','Her kötülükten korunma'],
  'الذرية الصالحة':['Righteous Offspring','Salih evlat'],
  'الهداية والتسديد':['Guidance','Hidayet'], 'الجنة وحسن الخاتمة':['Paradise & a Good End','Cennet ve hüsn-i hâtime'],
  'الوقاية من البلاء':['Protection from Affliction','Belâdan korunma'],
  'جوامع الخير':['All Goodness','Hayrın tamamı'], 'النصر والتأييد':['Victory & Support','Zafer ve yardım'],
  'الخوف من ظالم':['Fear of an Oppressor','Zalimden korkunca'],

  // ——— الفضائل ———
  'فضل سورة الكهف':['Virtue of Al-Kahf','Kehf suresinin fazileti'],
  'فضل آية الكرسي':['Virtue of Ayat al-Kursi','Âyetü’l-Kürsî fazileti'],
  'فضل الإخلاص والمعوذتين':['Virtue of Al-Ikhlas & Al-Mu’awwidhatayn','İhlâs ve Muavvizeteyn'],
  'فضل التسبيح والتحميد':['Virtue of Tasbeeh & Tahmeed','Tesbih ve hamd'],
  'فضل الصلاة على النبي ﷺ':['Virtue of Salah upon the Prophet ﷺ','Peygamber’e salât'],
  'فضل الدعاء':['Virtue of Dua','Duanın fazileti'],
  'فضل سورة الفاتحة':['Virtue of Al-Fatihah','Fâtiha’nın fazileti'],
  'فضل سورة البقرة':['Virtue of Al-Baqarah','Bakara’nın fazileti'],
  'فضل قراءة القرآن':['Virtue of Reciting Quran','Kur’an okumanın fazileti'],
  'فضل الصلاة':['Virtue of Prayer','Namazın fazileti'],
  'فضل الفجر والعصر':['Virtue of Fajr & Asr','Sabah ve ikindi'],
  'فضل يوم الجمعة':['Virtue of Friday','Cuma gününün fazileti'],
  'فضل الصيام':['Virtue of Fasting','Orucun fazileti'],
  'فضل الصدقة':['Virtue of Charity','Sadakanın fazileti'],
  'فضل الاستغفار':['Virtue of Istighfar','İstiğfarın fazileti'],
  'فضل الحج':['Virtue of Hajj','Haccın fazileti'],
  'فضل صلة الرحم':['Virtue of Keeping Ties','Sıla-i rahim'],
  'فضل حسن الخلق':['Virtue of Good Character','Güzel ahlâk'],
  'فضل المساجد':['Virtue of Mosques','Camilerin fazileti'],
  'فضل الوضوء':['Virtue of Wudu','Abdestin fazileti'],
  'فضل قيام الليل':['Virtue of Night Prayer','Teheccüdün fazileti'],
  'فضل صلاة الضحى':['Virtue of Duha Prayer','Kuşluk namazı'],
  'فضل صلاة الجماعة':['Virtue of Congregation','Cemaatle namaz'],
  'فضل السنن الرواتب':['Virtue of Sunnah Prayers','Revâtib sünnetler'],
  'فضل الصبر':['Virtue of Patience','Sabrın fazileti'],
  'فضل التوكل':['Virtue of Trust in Allah','Tevekkülün fazileti'],
  'فضل التوبة':['Virtue of Repentance','Tevbenin fazileti'],
  'فضل طلب العلم':['Virtue of Seeking Knowledge','İlim talebinin fazileti'],
  'فضل حسن الظن بالله':['Virtue of Good Opinion of Allah','Allah’a hüsnüzan'],
  'فضل الصدق':['Virtue of Truthfulness','Doğruluğun fazileti'],
  'فضل السواك':['Virtue of Siwak','Misvakın fazileti'],
  'فضل الصحبة الصالحة':['Virtue of Good Company','Sâlih arkadaşlık'],
  'فضل إفشاء السلام':['Virtue of Spreading Salam','Selâmı yaymak'],
  'فضل التهليل والذكر':['Virtue of Tahleel & Dhikr','Tehlîl ve zikir'],
  'فضل الدعاء بظهر الغيب':['Virtue of Dua in Absence','Gıyabında dua'],
  'فضل آخر آيتين من البقرة':['Virtue of the Last Two Verses of Al-Baqarah','Bakara’nın son iki âyeti'],

  // ——— رواة الحديث ———
  'مسلم':['Muslim','Müslim'], 'البخاري':['Bukhari','Buhârî'], 'الترمذي':['Tirmidhi','Tirmizî'],
  'أبو داود':['Abu Dawud','Ebû Dâvûd'], 'ابن ماجه':['Ibn Majah','İbn Mâce'], 'النسائي':['An-Nasa’i','Nesâî'],
  'أبو داود والترمذي':['Abu Dawud & Tirmidhi','Ebû Dâvûd ve Tirmizî'],
  'الترمذي والنسائي':['Tirmidhi & An-Nasa’i','Tirmizî ve Nesâî'],
  'الترمذي وابن ماجه':['Tirmidhi & Ibn Majah','Tirmizî ve İbn Mâce'],
  'أبو داود والنسائي':['Abu Dawud & An-Nasa’i','Ebû Dâvûd ve Nesâî'],
  'الحاكم والنسائي':['Al-Hakim & An-Nasa’i','Hâkim ve Nesâî'],
  'الحاكم والبيهقي':['Al-Hakim & Al-Bayhaqi','Hâkim ve Beyhakî'],
  'النسائي وصححه الألباني':['An-Nasa’i (authenticated by Al-Albani)','Nesâî (Elbânî sahih dedi)'],
  'الطبراني':['At-Tabarani','Taberânî'], 'أهل السنن':['The Sunan compilers','Sünen sahipleri'],

  // ——— القرّاء ———
  'العفاسي':['Al-Afasy','Afâsî'], 'الحصري':['Al-Husary','Husarî'],
  'عبد الباسط':['Abdul Basit','Abdulbâsıt'], 'المنشاوي':['Al-Minshawi','Minşâvî'],
  'المعيقلي':['Al-Muaiqly','Muaykılî'], 'تلاوة':['Recitation','Tilâvet'],

  // ——— حالات وأزرار ———
  'تم':['Done','Tamam'], 'صباح':['Morning','Sabah'], 'مساء':['Evening','Akşam'],
  'صفحة':['Page','Sayfa'], 'مكية':['Meccan','Mekkî'], 'مدنية':['Medinan','Medenî'],
  'حاول مرة أخرى':['Try again','Tekrar dene'],
  'حذف هذه الختمة؟':['Delete this khatma?','Bu hatim silinsin mi?'],
  'لم يتم السماح.':['Permission denied.','İzin verilmedi.'],
  'تم تصفير التطبيق بنجاح.':['App data reset successfully.','Uygulama verileri sıfırlandı.'],
  'تأكد من اتصالك بالإنترنت لأول تحميل فقط':['Internet is needed for the first load only','Yalnızca ilk yükleme için internet gerekir'],
  'تلاوة القرآن':['Quran Recitation','Kur’an tilâveti'],
  'أنت تواجه القبلة ✓':['You are facing the Qibla ✓','Kıbleye dönüksün ✓'],
  'محاذاة ✓':['Aligned ✓','Hizalandı ✓'], 'أدر الهاتف':['Turn the phone','Telefonu çevir'],
  'يوم مثالي! 🏆':['A perfect day! 🏆','Mükemmel bir gün! 🏆'],
  'ابدأ يومك الروحي 🌿':['Start your spiritual day 🌿','Manevi gününe başla 🌿'],
  'الوضع الليلي':['Night Mode','Gece modu'],
  'أسماء الله الحسنى':['99 Names of Allah','Esmâ-i Hüsnâ'],
  'لوحات فنية للآيات':['Ayah Art Wallpapers','Âyet duvar kâğıtları'],
  'أخضر زمردي':['Emerald Green','Zümrüt yeşili'], 'أزرق ليلي':['Midnight Blue','Gece mavisi'],
  'زوايا':['Corners','Köşeler'], 'شريطان':['Two Bands','İki şerit'], 'القاهرة':['Cairo','Kahire']
};

// حاويات المحتوى الشرعي — لا تُمسّ إطلاقاً
const SKIP = '.ayah, .ayah-text, #ayahs-container, .mushaf-page, .theker-text, .theker-info,' +
             ' .story-text, .story-ref, .sp-txt, .dc-quote, .ayah-day-text, .zk-note,' +
             ' .hadith-text, .dua-text, .surah-name, .mushaf-banner, input, textarea, select, script, style';

function lang(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }

function translateNode(node, idx){
  const raw = node.nodeValue;
  if(!raw) return;
  const key = raw.trim();
  if(!key || key.length < 2) return;
  const hit = UIT[key];
  if(!hit) return;                                  // مطابقة تامّة فقط
  if(node.__arOrig === undefined) node.__arOrig = raw;
  node.nodeValue = raw.replace(key, hit[idx]);      // يحافظ على المسافات المحيطة
}

function restoreNode(node){
  if(node.__arOrig !== undefined && node.nodeValue !== node.__arOrig){
    node.nodeValue = node.__arOrig;
  }
}

function walk(root, fn){
  if(!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function(n){
      const p = n.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      if(p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const list = [];
  let n; while((n = w.nextNode())) list.push(n);
  list.forEach(fn);
}

window.applyUiLang = function(root){
  const l = lang();
  const target = root || document.body;
  if(l === 'ar'){ walk(target, restoreNode); return; }
  const idx = (l === 'tr') ? 1 : 0;
  walk(target, function(n){ translateNode(n, idx); });
};

// أعِد التطبيق بعد أي رسم جديد (الوحدات تبني واجهتها ديناميكياً)
let _t = null;
function schedule(){ clearTimeout(_t); _t = setTimeout(function(){ try{ window.applyUiLang(); }catch(e){} }, 120); }

function boot(){
  schedule();
  try{
    new MutationObserver(function(muts){
      for(let i=0;i<muts.length;i++){ if(muts[i].addedNodes && muts[i].addedNodes.length){ schedule(); return; } }
    }).observe(document.body, { childList:true, subtree:true });
  }catch(e){}
  // بعد تبديل اللغة من الإعدادات
  const _sl = window.setLang;
  if(typeof _sl === 'function'){
    window.setLang = function(){ const r = _sl.apply(this, arguments); schedule(); return r; };
  }
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
