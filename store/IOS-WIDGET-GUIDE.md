# ودجت iPhone + Live Activity — دليل الإضافة (Xcode على ماك)

الأكواد جاهزة في `mobile/ios-native/`. iOS يتطلّب إضافة **هدف Widget Extension** من Xcode مرّة واحدة.

## 1) أنشئ App Group (مرّة واحدة)
- في Xcode، هدف **App** ▸ Signing & Capabilities ▸ **+ Capability ▸ App Groups** ▸ أضِف `group.com.alanwar.quran`.
- كرّر نفس الـApp Group لهدف **AnwarWidget** بعد إنشائه.

## 2) أنشئ هدف الودجت
- File ▸ New ▸ Target ▸ **Widget Extension** ▸ الاسم `AnwarWidget` ▸ ✅ Include Live Activity ▸ Finish ▸ Activate.
- احذف ملفات القالب المولّدة داخل مجلد AnwarWidget.

## 3) أضِف الملفات للأهداف الصحيحة
| الملف | الهدف (Target Membership) |
|---|---|
| `AnwarWidget.swift` | AnwarWidget |
| `AnwarWidgetLiveActivity.swift` | AnwarWidget |
| `AnwarAttributes.swift` | **App + AnwarWidget** (الاثنين) |
| `WidgetBridge.swift` + `WidgetBridge.m` | App |
| `LiveActivityPlugin.swift` + `LiveActivityPlugin.m` | App |
> تجاهل/احذف `AnwarLiveActivity.swift` القديم (لم يعد مستخدماً).

## 4) Info.plist
`NSSupportsLiveActivities = YES` (يحقنها Codemagic تلقائياً).

---

## 5) هيكلية البيانات — كيف يقرأ الودجت؟
التطبيق (JavaScript) يكتب JSON في **App Group UserDefaults** بالمفتاح `widgetData`، عبر `window.WidgetBridge.push()` (ملف `widget-bridge.js`) الذي ينادي `WidgetBridge.setData`.

### مثال الـ JSON المُرسَل:
```json
{
  "nextPrayer": "العصر",
  "nextPrayerTime": "16:20",
  "ayah": "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
  "ayahRef": "الرعد: 28",
  "hadith": "الكلمة الطيبة صدقة",
  "location": "دمشق"
}
```

الودجت (`AnwarWidget.swift`) يقرأها هكذا:
```swift
let d = UserDefaults(suiteName: "group.com.alanwar.quran")
let json = d?.string(forKey: "widgetData")  // ثم JSONSerialization
```
ويُعاد تحميله تلقائياً بـ `WidgetCenter.shared.reloadAllTimelines()` بعد كل كتابة.

### إرسال يدوي من JS (إن أردت):
```js
window.WidgetBridge.push();   // يجمع البيانات الحالية ويرسلها
```

## 6) Live Activity (Dynamic Island) من JS
```js
LiveActivity.startPrayer('العصر', targetEpochSeconds); // عدّاد على الجزيرة الديناميكية
LiveActivity.startRecite('سورة الكهف', 5, 'العفاسي');   // أثناء التلاوة
LiveActivity.end();
```
(مدعوم في `live-activity.js` ويتعطّل بأمان على الويب).
