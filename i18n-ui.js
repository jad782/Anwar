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
  'زوايا':['Corners','Köşeler'], 'شريطان':['Two Bands','İki şerit'], 'القاهرة':['Cairo','Kahire'],

  // ——— مصطلحات المصحف ———
  'سورة':['Surah','Sure'], 'آية':['Ayah','Âyet'], 'آيات':['ayahs','âyet'], 'الجزء':['Juz','Cüz'],
  'السور':['Surahs','Sureler'], 'الأجزاء':['Juz’','Cüzler'], 'آية الكرسي':['Ayat al-Kursi','Âyetü’l-Kürsî'],
  'وضع الحفظ':['Memorization Mode','Ezber modu'], 'وضع الحفظ (تسميع)':['Memorization Mode','Ezber modu'],
  'المصحف وقراءة القرآن':['Quran & Reading','Kur’an ve okuma'], 'قائمة السور':['Surah List','Sure listesi'],
  'اضغط على أي آية':['Tap any ayah','Herhangi bir âyete dokun'],
  'نسخ بالتشكيل':['Copy with diacritics','Harekeli kopyala'],
  'نسخ بدون تشكيل':['Copy without diacritics','Harekesiz kopyala'],
  'تصميم بطاقة':['Design a card','Kart tasarla'], 'تابع القراءة':['Continue reading','Okumaya devam et'],
  'أكمل الختمة':['Continue Khatma','Hatme devam'], 'إذاعة القرآن':['Quran Radio','Kur’an radyosu'],
  'إحصائياتي':['My Stats','İstatistiklerim'], 'إنجازاتي':['My Badges','Rozetlerim'],
  'الاختصارات':['Shortcuts','Kısayollar'], 'التصنيفات':['Categories','Kategoriler'],
  'آية اليوم':['Ayah of the Day','Günün âyeti'],
  'حديث ودعاء اليوم':['Hadith & Dua of the Day','Günün hadisi ve duası'],
  'متابعة القراءة والورد':['Reading & Wird','Okuma ve vird'],

  // ——— التجويد ———
  'القلقلة':['Qalqalah','Kalkale'], 'الإخفاء':['Ikhfa','İhfâ'], 'الإدغام':['Idgham','İdgâm'],
  'الإقلاب':['Iqlab','İklâb'], 'همزة وصل/ساكن':['Hamzat wasl / silent','Vasıl hemzesi / sâkin'],

  // ——— ملاحظات الأذكار ———
  'ثلاث مرات.':['Three times.','Üç kez.'], 'سبع مرات.':['Seven times.','Yedi kez.'],
  'مئة مرة في اليوم.':['A hundred times a day.','Günde yüz kez.'],
  'عشر مرات (أو مئة مرة).':['Ten times (or a hundred).','On kez (veya yüz kez).'],
  'ثلاث مرات؛ كفته من كل شيء.':['Three times; it suffices him against everything.','Üç kez; her şeye karşı ona yeter.'],
  'عند الدخول.':['When entering.','Girerken.'], 'عند الخروج.':['When leaving.','Çıkarken.'],
  'قبل الدخول.':['Before entering.','Girmeden önce.'], 'قبل الوضوء.':['Before wudu.','Abdestten önce.'],
  'عند الإفطار.':['When breaking the fast.','İftar ederken.'],
  'عند نزول المطر.':['When rain falls.','Yağmur yağarken.'], 'بعد المطر.':['After the rain.','Yağmurdan sonra.'],
  'عند هبوب الريح.':['When the wind blows.','Rüzgâr eserken.'],
  'عند ركوب وسيلة السفر.':['When boarding a vehicle.','Bineğe binerken.'],
  'عند رؤية هلال الشهر.':['On seeing the new crescent.','Hilâli görünce.'],
  'في قنوت الوتر.':['In the Witr qunut.','Vitir kunutunda.'], 'دعاء الكرب.':['Dua of distress.','Sıkıntı duası.'],
  'يقولها العاطس.':['Said by the one who sneezes.','Hapşıran söyler.'],
  'يقولها من سمع الحمد.':['Said by whoever hears the praise.','Hamdi duyan söyler.'],
  'إذا رأى ما يكره.':['When he sees what he dislikes.','Hoşlanmadığını görünce.'],
  'عند الفزع أو الخوف في النوم.':['On fright or fear during sleep.','Uykuda korkunca.'],
  'يمسح المريض بيده اليمنى ويدعو.':['Wipe the sick with the right hand and supplicate.','Hastayı sağ elle sıvazlayıp dua eder.'],
  'يضع يده على موضع الألم ويقولها سبع مرات.':['Place the hand on the pain and say it seven times.','Elini ağrıyan yere koyup yedi kez söyler.'],
  'عند البدء؛ وإن نسي فليقل: بسم الله أوله وآخره.':['At the start; if forgotten say: Bismillahi awwalahu wa akhirahu.','Başlarken; unutursa: Bismillâhi evvelehû ve âhirehû.'],
  'دعاء موسى عليه السلام.':['Dua of Musa (peace be upon him).','Hz. Mûsâ’nın duası.'],
  'دعاء زكريا عليه السلام.':['Dua of Zakariyya (peace be upon him).','Hz. Zekeriyyâ’nın duası.'],
  'دعاء إبراهيم عليه السلام.':['Dua of Ibrahim (peace be upon him).','Hz. İbrâhim’in duası.'],
  'دعاء نوح عليه السلام.':['Dua of Nuh (peace be upon him).','Hz. Nûh’un duası.'],
  'أدعية قرآنية (٢)':['Quranic Duas (2)','Kur’anî dualar (2)'],
  'من قالها حين يصبح أجير من الجن.':['Whoever says it in the morning is protected from the jinn.','Sabah söyleyen cinlerden korunur.'],
  'من قرأها دبر كل صلاة لم يمنعه من الجنة إلا الموت.':['Whoever recites it after every prayer, only death bars him from Paradise.','Her namaz ardından okuyanı cennetten yalnız ölüm alıkoyar.'],
  'لن يزال عليك من الله حافظ ولا يقربك شيطان حتى تصبح.':['A guardian from Allah stays with you and no devil comes near until morning.','Sabaha dek Allah’tan bir koruyucu seninledir, şeytan yaklaşamaz.'],
  'كتب الله له ألف ألف حسنة.':['Allah records for him a million good deeds.','Allah ona bir milyon sevap yazar.'],
  'قل هو الله أحد تعدل ثلث القرآن.':['Al-Ikhlas equals a third of the Quran.','İhlâs sûresi Kur’an’ın üçte birine denktir.'],
  'أكثر منها يوم الجمعة.':['Increase it on Friday.','Cuma günü çoğalt.'],
  'حبيبتان إلى الرحمن، ثقيلتان في الميزان.':['Beloved to the Most Merciful, heavy on the scale.','Rahmân’a sevimli, mizanda ağır.'],
  'كنز من كنوز الجنة.':['A treasure from the treasures of Paradise.','Cennet hazinelerinden bir hazine.'],
  'من قرأ سورة الكهف يوم الجمعة أضاء له من النور ما بين الجمعتين.':['Whoever recites Al-Kahf on Friday is lit with light between the two Fridays.','Cuma günü Kehf’i okuyana iki cuma arası nur olur.'],
  'من قرأ آية الكرسي دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت.':['Whoever recites Ayat al-Kursi after each obligatory prayer, only death bars him from Paradise.','Her farz namaz ardından Âyetü’l-Kürsî okuyanı cennetten yalnız ölüm alıkoyar.'],
  'فاتحة الكتاب هي أعظم سورة في القرآن، وهي السبع المثاني والقرآن العظيم.':['Al-Fatihah is the greatest surah in the Quran — the seven oft-repeated verses.','Fâtiha Kur’an’ın en büyük sûresidir; seb’u’l-mesânîdir.'],
  'الدعاء بين الأذان والإقامة مستجاب — أبو داود والترمذي':['Dua between the adhan and iqamah is answered — Abu Dawud & Tirmidhi','Ezan ile kamet arası dua kabul olur — Ebû Dâvûd ve Tirmizî'],
  'قراءة الإخلاص والفلق والناس والنفث في الكفين ومسح ما أقبل من الجسد':['Recite Al-Ikhlas, Al-Falaq and An-Nas, blow into the palms and wipe the body','İhlâs, Felak ve Nâs okunup avuçlara üflenir ve vücuda sürülür'],

  // ——— السنن الرواتب (نصوص التنبيهات) ———
  'ركعتا الفجر قبل الفريضة، وأذكار الصباح.':['Two rak’ahs before Fajr, then the morning adhkar.','Sabah farzından önce iki rekât, sonra sabah zikirleri.'],
  'أربع ركعات قبل الظهر وأربع بعدها.':['Four rak’ahs before Dhuhr and four after.','Öğleden önce dört, sonra dört rekât.'],
  'أربع ركعات قبل العصر — وهي الصلاة الوسطى.':['Four rak’ahs before Asr — the middle prayer.','İkindiden önce dört rekât — orta namaz.'],
  'ركعتان بعد المغرب، وابدأ أذكار المساء.':['Two rak’ahs after Maghrib, then the evening adhkar.','Akşamdan sonra iki rekât, sonra akşam zikirleri.'],
  'من السنن الرواتب — مسلم والترمذي':['Among the regular sunnah prayers — Muslim & Tirmidhi','Revâtib sünnetlerden — Müslim ve Tirmizî'],
  'أبو داود والنسائي — بعد الوتر':['Abu Dawud & An-Nasa’i — after Witr','Ebû Dâvûd ve Nesâî — vitirden sonra'],

  // ——— التنبيهات ———
  'حان وقت':['Time for','Vakit:'], 'اقترب وقت':['Approaching','Yaklaşıyor:'],
  'دقيقة على الأذان':['min to adhan','dk ezana'],
  'صوت الأذان عند دخول الوقت':['Athan sound at prayer time','Vakit girince ezan sesi'],
  'لا تدع يومك يمضي بلا ذكر لله.':['Do not let your day pass without remembering Allah.','Gününü Allah’ı anmadan geçirme.'],
  'يوم الجمعة المبارك 🕌':['Blessed Friday 🕌','Mübarek Cuma 🕌'],
  'ساعة الإجابة 🤲':['The hour of answered dua 🤲','İcabet saati 🤲'],
  'عيد الأضحى المبارك 🕌':['Eid al-Adha Mubarak 🕌','Kurban Bayramınız mübarek 🕌'],
  'عيد الفطر المبارك 🕌':['Eid al-Fitr Mubarak 🕌','Ramazan Bayramınız mübarek 🕌'],
  'تذكير: قراءة سورة الكهف والصلاة على النبي.':['Reminder: recite Al-Kahf and send salah upon the Prophet.','Hatırlatma: Kehf’i oku ve Peygamber’e salât getir.'],
  'تذكير: ركعتان في جوف الليل خير من الدنيا.':['Reminder: two rak’ahs in the depth of night are better than the world.','Hatırlatma: gecenin derinliğinde iki rekât dünyadan hayırlıdır.'],
  'كل ليلة قبل النوم':['Every night before sleep','Her gece uyumadan önce'],
  'كل ليلة':['Every night','Her gece'], 'فجر الجمعة':['Friday Fajr','Cuma sabahı'],
  'سورة الكهف':['Surah Al-Kahf','Kehf sûresi'], 'سورة السجدة':['Surah As-Sajdah','Secde sûresi'],
  'سورة الواقعة':['Surah Al-Waqi’ah','Vâkıa sûresi'],

  // ——— أوقات الكراهة ———
  'بعد الشروق':['After sunrise','Güneş doğduktan sonra'], 'الزوال':['Zenith','Zeval'],
  'قبيل الغروب':['Before sunset','Güneş batmadan önce'],

  // ——— طرق الحساب ———
  'رابطة العالم الإسلامي':['Muslim World League','İslâm Dünyası Birliği'],
  'الهيئة المصرية':['Egyptian Authority','Mısır Genel Otoritesi'],
  'أم القرى (مكة)':['Umm al-Qura (Makkah)','Ümmü’l-Kurâ (Mekke)'],
  'كراتشي':['Karachi','Karaçi'], 'ديانت (تركيا)':['Diyanet (Turkey)','Diyanet (Türkiye)'],
  'أمريكا الشمالية (ISNA)':['North America (ISNA)','Kuzey Amerika (ISNA)'],

  // ——— المدن ———
  'دمشق':['Damascus','Şam'], 'حلب':['Aleppo','Halep'], 'حمص':['Homs','Humus'], 'حماة':['Hama','Hama'],
  'اللاذقية':['Latakia','Lazkiye'], 'دير الزور':['Deir ez-Zor','Deyrizor'], 'الحسكة':['Al-Hasakah','Haseke'],
  'درعا':['Daraa','Dera'], 'إدلب':['Idlib','İdlib'], 'الرقة':['Raqqa','Rakka'], 'القامشلي':['Qamishli','Kamışlı'],
  'إسطنبول':['Istanbul','İstanbul'], 'أنقرة':['Ankara','Ankara'], 'مكة المكرمة':['Makkah','Mekke'],
  'المدينة المنورة':['Madinah','Medine'], 'الرياض':['Riyadh','Riyad'], 'القدس':['Jerusalem','Kudüs'],
  'بيروت':['Beirut','Beyrut'], 'بغداد':['Baghdad','Bağdat'], 'دبي':['Dubai','Dubai'],
  'لندن':['London','Londra'], 'باريس':['Paris','Paris'], 'برلين':['Berlin','Berlin'],

  // ——— الدول ———
  'تركيا':['Turkey','Türkiye'], 'السعودية':['Saudi Arabia','Suudi Arabistan'], 'الإمارات':['UAE','BAE'],
  'قطر':['Qatar','Katar'], 'الكويت':['Kuwait','Kuveyt'], 'مصر':['Egypt','Mısır'], 'سوريا':['Syria','Suriye'],
  'الأردن':['Jordan','Ürdün'], 'فلسطين':['Palestine','Filistin'], 'لبنان':['Lebanon','Lübnan'],
  'العراق':['Iraq','Irak'], 'باكستان':['Pakistan','Pakistan'], 'الهند':['India','Hindistan'],
  'إندونيسيا':['Indonesia','Endonezya'], 'أمريكا':['USA','ABD'], 'كندا':['Canada','Kanada'],
  'بريطانيا':['UK','İngiltere'], 'فرنسا':['France','Fransa'], 'ألمانيا':['Germany','Almanya'],

  // ——— الأشهر الهجرية والمناسبات ———
  'صفر':['Safar','Safer'], 'ربيع الأول':['Rabi’ al-Awwal','Rebîülevvel'], 'ربيع الآخر':['Rabi’ al-Thani','Rebîülâhir'],
  'جمادى الأولى':['Jumada al-Ula','Cemâziyelevvel'], 'جمادى الآخرة':['Jumada al-Akhirah','Cemâziyelâhir'],
  'رجب':['Rajab','Recep'], 'شعبان':['Sha’ban','Şaban'], 'رمضان':['Ramadan','Ramazan'],
  'ذو القعدة':['Dhul-Qi’dah','Zilkade'], 'ذو الحجة':['Dhul-Hijjah','Zilhicce'],
  'رأس السنة الهجرية':['Hijri New Year','Hicrî yılbaşı'], 'يوم عاشوراء':['Day of Ashura','Aşure günü'],
  'بداية شهر رمضان':['Start of Ramadan','Ramazan’ın başlangıcı'], 'عيد الفطر':['Eid al-Fitr','Ramazan Bayramı'],
  'بداية عشر ذي الحجة':['First ten of Dhul-Hijjah','Zilhiccenin ilk on günü'],
  'يوم عرفة':['Day of Arafah','Arefe günü'], 'عيد الأضحى':['Eid al-Adha','Kurban Bayramı'],
  'تنبيهات المناسبات':['Occasion Reminders','Özel gün hatırlatmaları'],
  'تكبيرات العيد':['Eid Takbeer','Bayram tekbirleri'], 'الثلث الأخير':['Last third of the night','Gecenin son üçte biri'],

  // ——— الثيمات والمظهر ———
  'ليل ذهبي':['Golden Night','Altın gece'], 'ليل خالص':['Pure Black','Saf siyah'],
  'نهاري فاتح':['Light Day','Aydınlık'], 'بنفسجي ملكي':['Royal Purple','Kraliyet moru'],
  'خشب وردي':['Rosewood','Gül ağacı'], 'ذهبي ملكي':['Royal Gold','Kraliyet altını'],
  'وردي هادئ':['Soft Rose','Yumuşak gül'], 'ورق ملكي':['Royal Paper','Kraliyet kâğıdı'],
  'المظاهر':['Themes','Temalar'], 'المظهر والتخصيص':['Appearance','Görünüm'],
  'حزمة التخصيص':['Customization Pack','Özelleştirme paketi'],
  'افتراضي':['Default','Varsayılan'], 'نسخ':['Naskh','Nesih'], 'عثماني فخم':['Uthmani','Osmânî'],
  'صانع الثيمات':['Theme Maker','Tema yapıcı'], 'صانع الثيمات الشخصي':['Personal Theme Maker','Kişisel tema yapıcı'],
  'بسيط':['Simple','Sade'], 'مزدوج':['Double','Çift'], 'سميك':['Thick','Kalın'],
  'خطوط':['Lines','Çizgiler'], 'نجوم':['Stars','Yıldızlar'], 'أركان':['Corners','Köşeler'],
  'إطار مزدوج':['Double Frame','Çift çerçeve'], 'أميري':['Amiri','Amiri'], 'تجوال':['Tajawal','Tajawal'],

  // ——— البريميوم ———
  'الأنوار بريميوم':['Al-Anwar Premium','El-Envar Premium'],
  'رفيق العمرة والحج':['Umrah & Hajj Companion','Umre ve hac rehberi'],
  'تنبيهات المناسبات الإسلامية':['Islamic Occasion Alerts','İslâmî özel gün bildirimleri'],
  'مكتبة تلاوات بلا نت':['Offline Recitations','Çevrimdışı tilâvetler'],
  'مكتبة التلاوات بلا نت':['Offline Recitations Library','Çevrimdışı tilâvet kütüphanesi'],
  'حزمة التخصيص الكاملة':['Full Customization Pack','Tam özelleştirme paketi'],
  'استوديو الآيات السينمائي':['Cinematic Ayah Studio','Sinematik âyet stüdyosu'],
  'رفيق رمضان الكامل':['Full Ramadan Companion','Tam Ramazan rehberi'],
  'رفيق رمضان':['Ramadan Companion','Ramazan rehberi'],
  'حاسبة الزكاة':['Zakat Calculator','Zekât hesaplayıcı'], 'السنن':['Sunnahs','Sünnetler'],
  'شهري':['Monthly','Aylık'], 'سنوي':['Yearly','Yıllık'], 'سنة':['year','yıl'],
  'مدى الحياة':['Lifetime','Ömür boyu'], 'استعادة المشتريات':['Restore Purchases','Satın alımları geri yükle'],
  'استعادة':['Restore','Geri yükle'], 'دعم بسيط':['Small Support','Küçük destek'],
  'دعم كريم':['Generous Support','Cömert destek'], 'شارة «عضو الأنوار»':['“Anwar Member” badge','“Envar üyesi” rozeti'],

  // ——— رمضان ———
  'نية الصيام':['Fasting Intention','Oruç niyeti'], 'دعاء ليلة القدر':['Laylat al-Qadr Dua','Kadir gecesi duası'],
  'صلاة التراويح':['Taraweeh Prayer','Teravih namazı'], 'ورد القرآن اليومي':['Daily Quran Wird','Günlük Kur’an virdi'],
  'صدقة اليوم':['Today’s Charity','Bugünün sadakası'], 'قيام الليل':['Night Prayer','Teheccüd'],
  'إفطار صائم':['Feeding a Fasting Person','Oruçluya iftar'],

  // ——— القرّاء ———
  'مشاري العفاسي':['Mishary Al-Afasy','Mishary Alafasy'],
  'عبد الرحمن السديس':['Abdurrahman As-Sudais','Abdurrahman Sudeys'],
  'ماهر المعيقلي':['Maher Al-Muaiqly','Mâhir el-Muaykılî'],
  'سعد الغامدي':['Saad Al-Ghamdi','Sa’d el-Gâmidî'],
  'سعود الشريم':['Saud Ash-Shuraim','Suûd eş-Şüreym'],
  'إسلام صبحي':['Islam Sobhi','İslam Subhi'],

  // ——— الشارات ———
  'أول تلاوة':['First Recitation','İlk tilâvet'], '٣ أيام متتالية':['3 days in a row','Üst üste 3 gün'],
  'أسبوع متواصل':['A full week','Kesintisiz bir hafta'], '١٠٠ تسبيحة':['100 tasbeeh','100 tesbih'],
  '١٠٠٠ تسبيحة':['1000 tasbeeh','1000 tesbih'], '١٠ صفحات ختمة':['10 khatma pages','10 hatim sayfası'],
  '١٠٠ صفحة':['100 pages','100 sayfa'], 'ختمة كاملة':['A full khatma','Tam bir hatim'],
  'حفظت آية':['Saved an ayah','Bir âyet kaydettin'], 'قارئ الليل':['Night Reader','Gece okuyucusu'],
  'أتممت ورد يوم':['Completed a day’s wird','Bir günlük virdi tamamladın'],

  // ——— الدليل ———
  'الصلاة والأذان والقبلة':['Prayer, Adhan & Qibla','Namaz, ezan ve kıble'],
  'شريط المواقيت':['Prayer times bar','Vakitler şeridi'], 'من الإعدادات':['From Settings','Ayarlardan'],
  'القبلة':['Qibla','Kıble'], 'الأذكار والمسبحة':['Adhkar & Tasbeeh','Zikirler ve tesbih'],
  'المواقيت':['Prayer Times','Namaz vakitleri'],
  'التذكيرات الذكية':['Smart Reminders','Akıllı hatırlatmalar'],
  'استوديو البطاقات ومكتبة التلاوات':['Card Studio & Recitations','Kart stüdyosu ve tilâvetler'],
  'دليل الحج والعمرة':['Hajj & Umrah Guide','Hac ve umre rehberi'],
  'مواقف يومية بتصميم مرح لتعليم أطفالك.':['Everyday situations designed playfully to teach your children.','Çocuklarına öğretmek için eğlenceli günlük durumlar.'],
  'قائمة سريعة: نسخ بالتشكيل، نسخ بدون تشكيل، مشاركة، تصميم بطاقة.':['Quick menu: copy with/without diacritics, share, design a card.','Hızlı menü: harekeli/harekesiz kopyala, paylaş, kart tasarla.'],
  'اضغط اسم السورة لتفتح من أولها مباشرة، وابحث بالاسم أو بكلمة من الآية.':['Tap a surah name to open it from the start, or search by name or a word from the ayah.','Sûre adına dokun baştan açılsın; adla veya âyetten bir kelimeyle ara.'],
  'تنبيه لقيام الليل وأدعية السحر — كلها من الإعدادات.':['Night-prayer alert and pre-dawn duas — all from Settings.','Teheccüd bildirimi ve seher duaları — hepsi Ayarlardan.'],
  'أوقات صلاة دقيقة':['Accurate prayer times','Hassas namaz vakitleri'],
  'التزام يرافقك':['Commitment that stays with you','Seninle kalan bir istikrar'],

  // ——— عن التطبيق ———
  'عن التطبيق':['About','Hakkında'], 'الأنوار':['Al-Anwar','El-Envar'],
  'لا نجمع أي بيانات شخصية ولا نشاركها مع أي طرف.':['We collect no personal data and share nothing with anyone.','Hiçbir kişisel veri toplamıyor ve kimseyle paylaşmıyoruz.'],
  'لا حاجة لإنشاء حساب أو تسجيل دخول.':['No account or sign-in needed.','Hesap veya giriş gerekmez.'],
  'نصوص القرآن والتفسير من مصادر معتمدة (مجمع الملك فهد / alquran.cloud).':['Quran and tafsir texts from trusted sources (King Fahd Complex / alquran.cloud).','Kur’an ve tefsir metinleri güvenilir kaynaklardan (Kral Fahd Külliyesi / alquran.cloud).'],

  // ——— متفرّقات ———
  'الذهب':['Gold','Altın'], 'الفضة':['Silver','Gümüş'], 'تفاصيل إضافية':['More details','Ek detaylar'],
  'شهر':['month','ay'], '3 أشهر':['3 months','3 ay'], 'المطلوب':['Required','Gerekli'],
  'بلا':['None','Yok'], 'وميض':['Flash','Yanıp sönme'], 'اردو':['Urdu','Urduca'],
  'صباح':['Morning','Sabah'], 'مساء':['Evening','Akşam'],
  'اكتب اسم المهمة':['Enter the task name','Görev adını yaz'],
  'لا تفتح ولا شي':['Nothing opens','Hiçbir şey açılmıyor'],

  // ——— الدفعة الأخيرة: نقاط ومتجر ومهام ورسائل ———
  'قراءة أذكار الصباح':['Read the morning adhkar','Sabah zikirlerini oku'],
  'قراءة أذكار المساء':['Read the evening adhkar','Akşam zikirlerini oku'],
  'قراءة صفحة من المصحف':['Read a page of the Quran','Kur’an’dan bir sayfa oku'],
  'قراءة جزء كامل':['Read a full juz','Tam bir cüz oku'],
  'مئة تسبيحة':['A hundred tasbeeh','Yüz tesbih'], 'صلاة نافلة':['A voluntary prayer','Nafile namaz'],
  'خط مصحف: نسخ':['Mushaf font: Naskh','Mushaf yazı tipi: Nesih'],
  'خط مصحف: عثماني فخم':['Mushaf font: Uthmani','Mushaf yazı tipi: Osmânî'],
  'ثيم ذهبي ملكي':['Royal Gold theme','Kraliyet altını teması'],
  'ثيم أخضر زمردي':['Emerald Green theme','Zümrüt yeşili teması'],
  'ثيم أزرق ليلي':['Midnight Blue theme','Gece mavisi teması'],
  'ثيم وردي هادئ':['Soft Rose theme','Yumuşak gül teması'],
  'خلفية قراءة: ورق ملكي':['Reading background: Royal Paper','Okuma arka planı: Kraliyet kâğıdı'],
  'نقطة، تحتاج':['points, you need','puan, gerekli'], 'نقطة.':['points.','puan.'],
  'نقطة. متابعة؟':['points. Continue?','puan. Devam edilsin mi?'],
  'ريفريش':['Refresh','Yenile'], 'صحيح':['Authentic','Sahih'],
  'كم':['km','km'], 'من 604 ·':['of 604 ·','/ 604 ·'],
  '° (تقريبي)':['° (approx.)','° (yaklaşık)'],
  '«من قرأ سورة الكهف يوم الجمعة أضاء له من النور ما بين الجمعتين»':['“Whoever recites Al-Kahf on Friday is lit with light between the two Fridays”','“Cuma günü Kehf’i okuyana iki cuma arası nur olur”'],
  'للمتابعة.':['to continue.','devam etmek için.'],
  ') بمزايا وتحسينات.':[') with new features and improvements.',') yeni özellikler ve iyileştirmelerle.'],
  'نص اختياري':['Optional text','İsteğe bağlı metin'], 'نص للإجباري':['Text for forced update','Zorunlu güncelleme metni'],
  'تنبيهات المناسبات الإسلامية':['Islamic Occasion Alerts','İslâmî özel gün bildirimleri'],

  // ——— أوصاف ميزات البريميوم ———
  'اكتب أدعية لمن تحبّ (والديك/أبنائك/من فقدت) + تذكير يومي + شاركها كبطاقة أو PDF. دعاؤك لهم صدقة جارية.':['Write duas for those you love (parents, children, the departed) + a daily reminder + share as a card or PDF. Your dua for them is an ongoing charity.','Sevdiklerin için dua yaz (anne baban, çocukların, kaybettiklerin) + günlük hatırlatma + kart veya PDF olarak paylaş. Onlara duan sadaka-i câriyedir.'],
  'أذكار المواقف اليومية لطفلك بتصميم ملوّن مرح وبلغة يفهمها — علّمه ذكر كل موقف بمتعة.':['Everyday adhkar for your child in a colorful, playful design and language they understand.','Çocuğun için günlük durumların zikirleri; renkli, eğlenceli ve anlayacağı bir dille.'],
  'أدلة المناسك خطوة بخطوة + عدّاد أشواط + شروط ومواقيت ومحظورات + أدعية كل موقف.':['Step-by-step rites guide + circuit counter + conditions, meeqats and prohibitions + duas for each stage.','Adım adım menâsik rehberi + şavt sayacı + şartlar, mîkatlar ve yasaklar + her durum için dualar.'],
  'تنبيهات تلقائية قبل كل مناسبة (رمضان/العشر/عاشوراء/الأيام البيض) لئلّا تفوتك.':['Automatic alerts before every occasion (Ramadan, the ten days, Ashura, the white days) so you never miss one.','Her özel günden önce otomatik bildirim (Ramazan, on gün, Aşure, eyyâm-ı bîd) — kaçırma.'],
  'تحميل سور كاملة بأصوات كبار القرّاء للاستماع أوفلاين وبالخلفية.':['Download full surahs by leading reciters for offline and background listening.','Büyük kârîlerin sesiyle tam sûreleri indir; çevrimdışı ve arka planda dinle.'],
  'خطوط مصحف وثيمات فاخرة وخلفيات قراءة حصرية — لا تتوفّر مجاناً.':['Mushaf fonts, luxurious themes and exclusive reading backgrounds — not available for free.','Mushaf yazı tipleri, lüks temalar ve özel okuma arka planları — ücretsiz sürümde yok.'],
  'صمّم الآيات والأحاديث بتأثيرات متحرّكة واحفظها/انشرها بجودة عالية.':['Design ayahs and hadiths with animated effects and save or share them in high quality.','Âyet ve hadisleri hareketli efektlerle tasarla, yüksek kalitede kaydet veya paylaş.'],
  'أجواء ليلية هادئة للقيام والتهجّد: تنفّس، أذكار، ورد ليلي، وعدّاد صلاة.':['A calm night atmosphere for night prayer: breathing, adhkar, a night wird and a prayer counter.','Teheccüd için sakin gece ortamı: nefes, zikirler, gece virdi ve namaz sayacı.'],
  'خلفيات جوّال فنية بالخط العربي تُحفظ في جهازك.':['Artistic phone wallpapers in Arabic calligraphy, saved to your device.','Arap hattıyla sanatsal telefon duvar kâğıtları, cihazına kaydedilir.'],
  'كاميرا حيّة: الكعبة تطفو فوق الواقع وتتوسّط عند مواجهة القبلة + توجيه بالاهتزاز.':['Live camera: the Kaaba floats over reality and centers when you face the Qibla + haptic guidance.','Canlı kamera: Kâbe gerçekliğin üzerinde belirir ve kıbleye dönünce ortalanır + titreşimli yönlendirme.'],
  'الـ99 اسماً بتصميم فخم مع المعاني وبطاقات مشاركة.':['All 99 names in a luxurious design with meanings and shareable cards.','99 ismin tamamı; lüks tasarım, anlamlar ve paylaşılabilir kartlar.'],
  'إمساكية وعدّاد صيام وأعمال رمضان — يعتمد على أوقات صلاتك.':['Imsakiyah, a fasting counter and Ramadan deeds — based on your prayer times.','İmsakiye, oruç sayacı ve Ramazan amelleri — namaz vakitlerine göre.'],
  'صمّم ثيمك الخاص باختيار لونين ويتناسق التطبيق كله معك.':['Design your own theme by picking two colors and the whole app matches you.','İki renk seçerek kendi temanı tasarla; tüm uygulama sana uyum sağlar.'],
  'كرّر الآية صوتياً بعدد تحدّده وأخفِ النص للتسميع — للحُفّاظ وطلبة القرآن.':['Repeat an ayah aloud as many times as you choose and hide the text to test yourself — for memorizers and students of the Quran.','Âyeti istediğin sayıda sesli tekrarla ve metni gizleyip kendini sına — hâfızlar ve Kur’an talebeleri için.'],

  // ——— كلمات وعبارات شائعة ———
  'يوم':['day','gün'], 'اليوم':['today','bugün'], 'مرات':['×','kez'],
  'الصباح':['Morning','Sabah'], 'المساء':['Evening','Akşam'], 'التسبيح':['Tasbeeh','Tesbih'],
  'رجوع':['Back','Geri'], 'إغلاق':['Close','Kapat'], 'حفظ':['Save','Kaydet'],
  'مشاركة':['Share','Paylaş'], 'نسخ':['Copy','Kopyala'], 'بحث':['Search','Ara'],
  'لا توجد ختمة حالية':['No active khatma','Etkin hatim yok'],
  'ابدأ ختمة وتابع وردك اليومي صفحةً صفحة.':['Start a khatma and track your daily wird page by page.','Bir hatme başla ve günlük virdini sayfa sayfa takip et.'],
  'التزامي بالصلاة':['My prayer commitment','Namaz istikrarım'],
  'نُسخت الآية':['Ayah copied','Âyet kopyalandı'], 'نُسخت للمشاركة':['Copied to share','Paylaşmak için kopyalandı'],
  'صفحة من':['page of','/ sayfa'], 'المصحف':['Quran','Kur’an'],
  'ختمة جديدة':['New Khatma','Yeni hatim'], 'ابدأ الختمة':['Start the khatma','Hatme başla'],
  'تنبيه!':['Notice!','Uyarı!'], 'قائمة السنن':['Sunnah List','Sünnet listesi'],
  'سنن المصطفى ﷺ — اغتنمها لرفع الدرجات':['The Sunnahs of the Prophet ﷺ — seize them to raise your ranks','Peygamber ﷺ sünnetleri — dereceleri yükseltmek için değerlendir'],
  'إضافة':['Add','Ekle'], 'تخصيص':['Customize','Özelleştir'],
  'اختر سورة':['Choose a Surah','Bir sûre seç'], 'فتح كاملة':['Open full','Tamamını aç'],
  'إضافة مهمة':['Add a task','Görev ekle'],
  'إضافة سورة للقراءة اليومية':['Add a surah to daily reading','Günlük okumaya sûre ekle'],
  'لا توجد مهام، أضف وردك اليومي.':['No tasks yet — add your daily wird.','Henüz görev yok — günlük virdini ekle.'],
  'أتممت ورد اليوم 🌿':['Today’s wird complete 🌿','Bugünün virdi tamam 🌿'],
  'مهمة':['task','görev'], 'وقت مبارك':['A Blessed Time','Mübarek bir vakit'],
  'اللغة':['Language','Dil'], 'خلفية القراءة':['Reading background','Okuma arka planı'],
  'إبقاء الشاشة مضاءة':['Keep screen on','Ekranı açık tut'],
  'الوضع النهاري (فاتح)':['Day mode (light)','Gündüz modu (açık)'],
  'حجم خط القراءة':['Reading font size','Okuma yazı boyutu'],
  'تصفير بيانات التطبيق':['Reset app data','Uygulama verilerini sıfırla'],
  'التخصيص':['Customization','Özelleştirme'], 'التنبيهات والموقع':['Alerts & location','Bildirimler ve konum'],
  'صوت الأذان عند الوقت':['Athan sound at prayer time','Vakit girince ezan sesi'],
  'تنبيه قبل الأذان (دقائق)':['Pre-athan reminder (min)','Ezandan önce hatırlatma (dk)'],
  'إحصائياتي الروحية':['My Spiritual Stats','Manevi istatistiklerim'],
  'تفعيل البوصلة':['Enable compass','Pusulayı etkinleştir'],
  'لم يتم السماح باستخدام البوصلة.':['Compass permission was denied.','Pusula izni verilmedi.'],
  'درجة من الشمال':['degrees from North','derece (kuzeyden)'],
  'الصلاة القادمة':['Next prayer','Sonraki namaz'],
  'الدليل':['Guide','Rehber'], 'استقبال القبلة':['Facing the Qibla','Kıbleye dönüksün'], 'انعطف يميناً':['Turn right','Sağa dön'], 'انعطف يساراً':['Turn left','Sola dön'], 'اتجاه القبلة':['Qibla Direction','Kıble yönü'], 'موقعك الحالي':['Your current location','Mevcut konumun'], 'أقرب مدينة':['Nearest city','En yakın şehir'], 'الحساب':['Account','Hesap'], 'المزيد':['More','Daha fazla'],
  'إعدادات':['Settings','Ayarlar'], 'تم النسخ':['Copied','Kopyalandı'],
  'جاري التحميل...':['Loading…','Yükleniyor…'], 'جاري الحساب...':['Calculating…','Hesaplanıyor…'],

  // ——— الدفعة الختامية ———
  'المسبحة الإلكترونية':['Digital Tasbeeh','Dijital tesbih'],
  'تغيير الذكر':['Change dhikr','Zikri değiştir'], 'تسبيح':['tasbeeh','tesbih'],
  'تخصيص عرض الواجهة':['Customize the layout','Arayüz düzenini özelleştir'],
  'عربي':['Arabic','Arapça'],
  'أوقات الصلاة والموقع':['Prayer times & location','Namaz vakitleri ve konum'],
  'تحديد الموقع':['Location','Konum belirleme'],
  'تلقائي':['Automatic','Otomatik'], 'يدوي':['Manual','Manuel'],
  'طريقة الحساب':['Calculation method','Hesaplama yöntemi'],
  'وضع السفر (تلقائي)':['Travel mode (automatic)','Yolculuk modu (otomatik)'],
  'شكل الأرقام':['Numeral style','Rakam biçimi'],
  'الاهتزاز اللمسي':['Haptic feedback','Dokunsal titreşim'],
  'تعديل يدوي للأوقات (دقائق)':['Manual time adjustment (minutes)','Vakitleri elle ayarla (dakika)'],
  'استعادة الإعدادات الافتراضية':['Restore default settings','Varsayılan ayarları geri yükle'],
  'تطبيق الأنوار · الإصدار 1.9.1':['Al-Anwar · Version 1.9.1','El-Envar · Sürüm 1.9.1'],
  'تذكير بسورة الكهف، والصلاة على النبي ﷺ، وسنن الجمعة.':['A reminder for Surah Al-Kahf, salah upon the Prophet ﷺ, and the Friday sunnahs.','Kehf sûresi, Peygamber’e ﷺ salât ve cuma sünnetleri için hatırlatma.'],

  // ——— قائمة السنن ———
  'السنن الرواتب':['The Regular Sunnah Prayers','Revâtib sünnetler'],
  'الرواتب المؤكدة اثنتا عشرة ركعة في اليوم والليلة':['The confirmed sunnah prayers are twelve rak’ahs a day and night','Müekked revâtib günde ve gecede on iki rekâttır'],
  'سنن مستحبة (غير الرواتب)':['Recommended Sunnahs (beyond the regular ones)','Müstehap sünnetler (revâtib dışı)'],
  'نوافل عظيمة الأجر':['Voluntary acts of great reward','Sevabı büyük nafileler'],
  'سنن الصلاة (الهيئات)':['Sunnahs of the Prayer (its forms)','Namazın sünnetleri (heyetler)'],
  'هيئات تكمل بها الصلاة':['Forms by which the prayer is perfected','Namazı tamamlayan heyetler'],
  'سنن الطريق والخروج':['Sunnahs of Going Out & the Road','Yol ve dışarı çıkma sünnetleri'],
  'آداب وسنن عند الخروج والمشي':['Etiquette and sunnahs when going out and walking','Çıkarken ve yürürken âdâb ve sünnetler'],
  'سنن الفطرة':['Sunnahs of the Fitrah','Fıtrat sünnetleri'],
  'خصال النظافة والطهارة':['Traits of cleanliness and purity','Temizlik ve tahâret hasletleri'],
  'سنن النوم والاستيقاظ':['Sunnahs of Sleeping & Waking','Uyku ve uyanma sünnetleri'],
  'آداب قبل النوم وعند القيام':['Etiquette before sleeping and on waking','Uyumadan önce ve kalkınca âdâb'],
  'سنن الطعام والشراب':['Sunnahs of Food & Drink','Yeme içme sünnetleri'],
  'آداب الأكل والشرب':['Etiquette of eating and drinking','Yeme ve içme âdâbı'],
  'سنن يوم الجمعة':['Sunnahs of Friday','Cuma günü sünnetleri'],
  'خير يوم طلعت فيه الشمس':['The best day upon which the sun has risen','Güneşin doğduğu en hayırlı gün'],
  '/شهر':['/month','/ay'], '/سنة':['/year','/yıl']
};

// ——— إسناد الحديث: يُترجَم بقاعدة لا بقائمة (رواه فلان عن فلان / متفق عليه) ———
const NARR = {
  'البخاري':['Bukhari','Buhârî'], 'مسلم':['Muslim','Müslim'], 'الترمذي':['Tirmidhi','Tirmizî'],
  'أبو داود':['Abu Dawud','Ebû Dâvûd'], 'ابن ماجه':['Ibn Majah','İbn Mâce'], 'النسائي':['An-Nasa’i','Nesâî'],
  'الحاكم':['Al-Hakim','Hâkim'], 'البيهقي':['Al-Bayhaqi','Beyhakî'], 'أحمد':['Ahmad','Ahmed'],
  'الطبراني':['At-Tabarani','Taberânî'], 'الدارمي':['Ad-Darimi','Dârimî'],
  'أبي هريرة':['Abu Hurayrah','Ebû Hüreyre'], 'عائشة':['Aisha','Âişe'],
  'أنس بن مالك':['Anas ibn Malik','Enes b. Mâlik'], 'جابر بن عبد الله':['Jabir ibn Abdullah','Câbir b. Abdullah'],
  'عبد الله بن عمرو':['Abdullah ibn Amr','Abdullah b. Amr'], 'عثمان بن عفان':['Uthman ibn Affan','Osman b. Affân'],
  'عثمان بن أبي العاص':['Uthman ibn Abi al-As','Osman b. Ebi’l-Âs'], 'ثوبان':['Thawban','Sevbân'],
  'خولة بنت حكيم':['Khawlah bint Hakim','Havle bnt. Hakîm'], 'سعد بن أبي وقاص':['Sa’d ibn Abi Waqqas','Sa’d b. Ebî Vakkâs'],
  'عبادة بن الصامت':['Ubadah ibn as-Samit','Ubâde b. Sâmit'], 'أبي سعيد الخدري':['Abu Sa’id al-Khudri','Ebû Saîd el-Hudrî'],
  'علي بن أبي طالب':['Ali ibn Abi Talib','Ali b. Ebî Tâlib'], 'أبي مالك الأشعري':['Abu Malik al-Ash’ari','Ebû Mâlik el-Eş’arî'],
  'ابن عباس':['Ibn Abbas','İbn Abbâs'], 'ابن عمر':['Ibn Umar','İbn Ömer'], 'أبي بكرة':['Abu Bakrah','Ebû Bekre'],
  'معاذ بن جبل':['Mu’adh ibn Jabal','Muâz b. Cebel'], 'أبي ذر':['Abu Dharr','Ebû Zer'],
  'أم حبيبة':['Umm Habibah','Ümmü Habîbe'], 'عمر بن الخطاب':['Umar ibn al-Khattab','Ömer b. Hattâb'],
  'أبي الدرداء':['Abu ad-Darda','Ebü’d-Derdâ'], 'ابن مسعود':['Ibn Mas’ud','İbn Mes’ûd'],
  'عبد الله بن أبي أوفى':['Abdullah ibn Abi Awfa','Abdullah b. Ebî Evfâ'],
  'عبد الله بن عمر':['Abdullah ibn Umar','Abdullah b. Ömer'],
  'جابر بن عبد الله رضي الله عنهما':['Jabir ibn Abdullah','Câbir b. Abdullah'],
  'أبي مالك الأشعري':['Abu Malik al-Ash’ari','Ebû Mâlik el-Eş’arî'],
  'أبي سعيد الخدري':['Abu Sa’id al-Khudri','Ebû Saîd el-Hudrî']
};
// لواحق شائعة بعد الإسناد (— استفتاح قيام الليل)
const ISNAD_SUFFIX = {
  'استفتاح قيام الليل':['opening of the night prayer','teheccüdün açılışı'],
  'بعد الوتر':['after Witr','vitirden sonra']
};
const ISNAD_FIXED = {
  'متفق عليه':['Agreed upon (Bukhari & Muslim)','Müttefekun aleyh (Buhârî ve Müslim)'],
  'صحيح الجامع':['Sahih al-Jami','Sahîhu’l-Câmi’'],
  'أهل السنن':['The Sunan compilers','Sünen sahipleri']
};
function trIsnad(s, idx){
  let t = s.trim();
  if(ISNAD_FIXED[t]) return ISNAD_FIXED[t][idx];
  // لاحقة بعد شرطة: «رواه مسلم — بعد الوتر»
  let suffix = '';
  const sm = t.match(/^(.+?)\s*—\s*(.+)$/);
  if(sm){
    const sfx = ISNAD_SUFFIX[sm[2].trim()];
    if(!sfx) return null;                       // لاحقة غير معروفة => اتركه عربياً (أمان)
    t = sm[1].trim(); suffix = ' — ' + sfx[idx];
  }
  // رقم الحديث بين قوسين: «رواه البخاري (١١٦٦) عن جابر»
  let num = '';
  const nm = t.match(/^(.+?)\s*\(([٠-٩0-9]+)\)\s*(.*)$/);
  if(nm){
    // حوّل الأرقام الهندية إلى عربية غربية في اللغات غير العربية
    const digits = nm[2].replace(/[٠-٩]/g, function(d){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
    num = ' (' + digits + ')';
    t = (nm[1] + ' ' + nm[3]).replace(/\s+/g,' ').trim();
  }

  // متفق عليه عن فلان
  let m = t.match(/^متفق عليه عن (.+)$/);
  if(m){
    const w = NARR[m[1].trim()];
    if(!w) return null;
    return (idx===0 ? ('Agreed upon — from ' + w[0]) : ('Müttefekun aleyh — ' + w[1] + "'den")) + num + suffix;
  }
  // رواه/أخرجه [مصادر] [عن فلان]
  m = t.match(/^(?:رواه|أخرجه)\s+(.+?)(?:\s+عن\s+(.+?))?\.?$/);
  if(!m) return null;
  const srcs = m[1].split(/\s+و\s*|\s+و/).map(x=>x.trim()).filter(Boolean);
  const outSrc = [];
  for(const sname of srcs){
    const w = NARR[sname];
    if(!w) return null;                       // مصدر غير معروف => لا تُترجم (أمان)
    outSrc.push(w[idx]);
  }
  const joined = idx===0 ? outSrc.join(' & ') : outSrc.join(' ve ');
  const who = m[2] ? NARR[m[2].trim()] : null;
  if(m[2] && !who) return null;
  if(idx===0) return 'Narrated by ' + joined + (who ? (' — from ' + who[0]) : '') + num + suffix;
  return joined + (who ? (' — ' + who[1] + "'den") : '') + ' rivayet etti' + num + suffix;
}

// ——— أنماط مركّبة (نصّ + رقم) لا تصلح فيها المطابقة التامّة ———
//  آمنة: تشترط رقماً وكلمة واجهة محدّدة، ولا تطابق نصّاً قرآنياً أبداً.
const D = '[٠-٩0-9]+';
const PATTERNS = [
  { re: new RegExp('^صفحة\\s+(' + D + ')\\s+من\\s+(' + D + ')$'), en:'Page $1 of $2', tr:'Sayfa $1 / $2' },
  { re: new RegExp('^صفحة\\s+(' + D + ')$'),                       en:'Page $1',        tr:'Sayfa $1' },
  { re: new RegExp('^(' + D + ')\\s+(?:آيات|آية)$'),               en:'$1 ayahs',       tr:'$1 âyet' },
  { re: new RegExp('^(' + D + ')\\s+يوم$'),                        en:'$1 days',        tr:'$1 gün' },
  { re: new RegExp('^(' + D + ')\\s+من\\s+(' + D + ')\\s+اليوم$'), en:'$1 of $2 today', tr:'Bugün $1 / $2' },
  { re: new RegExp('^(' + D + ')\\s+من\\s+(' + D + ')\\s+مرات$'),  en:'$1 of $2 ×',     tr:'$1 / $2 kez' },
  { re: new RegExp('^الجزء\\s+(' + D + ')$'),                      en:'Juz $1',         tr:'Cüz $1' },
  { re: new RegExp('^(' + D + ')\\s+مرات?$'),                      en:'$1 ×',           tr:'$1 kez' },
  { re: new RegExp('^باقٍ\\s+(' + D + ')\\s+دقيقة على الأذان$'),   en:'$1 min to adhan', tr:'Ezana $1 dk' },
  { re: new RegExp('^(' + D + ')°\\s*\\(تقريبي\\)$'),              en:'$1° (approx.)',  tr:'$1° (yaklaşık)' },
  { re: new RegExp('^(' + D + ')°\\s*✓$'),                          en:'$1° ✓',          tr:'$1° ✓' }
];
function trPattern(key, idx){
  for(let i=0;i<PATTERNS.length;i++){
    const p = PATTERNS[i];
    if(p.re.test(key)) return key.replace(p.re, idx===0 ? p.en : p.tr);
  }
  return null;
}

// حاويات المحتوى الشرعي — لا تُمسّ إطلاقاً
const SKIP = '.ayah, .ayah-text, #ayahs-container, .mushaf-page, .theker-text, .theker-info,' +
             ' .story-text, .story-ref, .sp-txt, .dc-quote, .ayah-day-text, .zk-note,' +
             ' .hadith-text, .dua-text, .surah-name, .mushaf-banner, input, textarea, select, script, style';

function lang(){ return (window.currentLang) || localStorage.getItem('lang') || 'ar'; }

function translateNode(node, idx){
  // ترجم دائماً من الأصل العربي لا من القيمة الحالية، وإلا فشل التبديل
  // بين لغتين غير عربيتين (إنجليزي → تركي) لأن النص صار إنجليزياً ولا يطابق المفتاح.
  const raw = (node.__arOrig !== undefined) ? node.__arOrig : node.nodeValue;
  if(!raw) return;
  // حماية إضافية وقت التشغيل: أي نصّ فيه حركات أو علامات مصحفية = محتوى شرعي، لا يُمسّ
  if(/[ً-ْٰ]|[﴿﴾ۖۗۘۙۚۛۜ۝]/.test(raw)) return;
  const key = raw.trim();
  if(!key || key.length < 2) return;
  let out = null;
  const hit = UIT[key] || (window.UIT_AUTO && UIT_AUTO[key]);  // اليدوي أولاً ثم المُولَّد
  if(hit) out = hit[idx];                                     // مطابقة تامّة
  else if(/^(رواه|أخرجه|متفق عليه|صحيح الجامع|أهل السنن)/.test(key)) out = trIsnad(key, idx);
  else out = trPattern(key, idx);                             // نمط مركّب (نصّ + رقم)
  if(!out) return;
  // الأرقام الهندية (٠-٩) تُعرض غربية في الإنجليزية والتركية
  out = out.replace(/[٠-٩]/g, function(d){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
  if(node.__arOrig === undefined) node.__arOrig = raw;
  node.nodeValue = raw.replace(key, out);                     // يحافظ على المسافات المحيطة
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
