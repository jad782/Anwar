# بناء تطبيق الأنوار لـ iOS (App Store) عبر Capacitor

> ⚠️ بناء iOS يتطلّب **جهاز Mac** + **Xcode** + حساب **Apple Developer (99$/سنة)**.
> لا يمكن بناء iOS على ويندوز. الخطوات التالية تُنفّذ على الماك.

تطبيق الويب (المصدر) في المجلد الأب. مجلد `mobile/` يحوي إعداد Capacitor لـ iOS.

---

## أول مرّة (على الماك)
```bash
cd mobile
npm install
npm run icons          # يولّد الأيقونات من ../icon-source.png
npm run add:ios        # ينشئ مشروع ios/
npx @capacitor/assets generate --ios   # أيقونة + سبلاش iOS
npx cap open ios       # يفتح Xcode
```

في Xcode:
1. اختر فريق التوقيع (Signing & Capabilities ▸ Team).
2. عدّل **Bundle Identifier** ليطابق `com.alanwar.quran` (أو معرّفك).
3. فعّل القدرات (Capabilities):
   - **Push Notifications** (غير مطلوب لكن لا يضر) و**Background Modes ▸ Remote notifications** إن رغبت.
   - **In-App Purchase** (مطلوب لقسم «ادعم المطوّر»).
4. شغّل على جهاز حقيقي ▸ ثم **Product ▸ Archive** ▸ ارفع إلى App Store Connect.

## التنبيهات وهي مغلقة (الأذان + التذكير اليومي)
- تعمل عبر `@capacitor/local-notifications` (إشعارات محلّية مجدولة) — تظهر **والتطبيق مغلق** على iOS بعد منح الإذن.
- عند أول فتح يطلب التطبيق إذن الإشعارات؛ لا حاجة لخادم.
- صوت الأذان كنغمة إشعار على iOS: أضف ملف `athan.caf` إلى مشروع Xcode، وغيّر `sound:'athan.mp3'` إلى `'athan.caf'` في `notifications.js` (داخل الويب).

## الدفع داخل التطبيق (ادعم المطوّر)
- يستخدم `cordova-plugin-purchase`. أنشئ في **App Store Connect** منتجات **Consumable** بالمعرّفات:
  - `com.alanwar.quran.tip1`  (0.99$)
  - `com.alanwar.quran.tip5`  (4.99$)
  - `com.alanwar.quran.tip10` (9.99$)
- راجع `../store/IAP-PRODUCTS.md`.

## الودجت / Live Activity (آية اليوم على iPhone)
- يتطلّب **Widget Extension بلغة Swift** يُضاف من داخل Xcode (File ▸ New ▸ Target ▸ Widget Extension).
- غير ممكن توليده من طبقة الويب — يُبرمَج على الماك. راجع `../store/IOS-WIDGET-GUIDE.md`.

## تحديث الويب لاحقاً
```bash
cd mobile && npm run sync   # ينسخ ملفات الويب ويحدّث مشروع iOS
```
