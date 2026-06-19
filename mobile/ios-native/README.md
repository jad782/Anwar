# Live Activities & Dynamic Island — دليل الإضافة (Xcode على ماك)

هذه ملفات Swift **جاهزة**، لكن iOS يتطلّب إضافة **هدف Widget Extension** من Xcode (لا يمكن من ويندوز/CI تلقائياً). نفّذها مرّة واحدة على الماك بعد `npx cap add ios`:

## الخطوات
1. افتح `mobile/ios/App/App.xcworkspace` في Xcode.
2. **File ▸ New ▸ Target ▸ Widget Extension** ▸ الاسم `AnwarWidget` ▸ فعّل **Include Live Activity** ▸ Finish.
3. احذف ملفات القالب المولّدة، وأضِف لهدف الودجت:
   - `AnwarAttributes.swift`
   - `AnwarLiveActivity.swift`
4. أضِف `AnwarAttributes.swift` **أيضاً** لهدف التطبيق الرئيسي (App) — ليُشاركه الجسر.
5. أضِف لهدف التطبيق الرئيسي (App):
   - `LiveActivityPlugin.swift`
   - `LiveActivityPlugin.m`
6. في `Info.plist` للتطبيق: `NSSupportsLiveActivities = YES` (يحقنها Codemagic تلقائياً).
7. (اختياري) App Group `group.com.alanwar.quran` لمشاركة البيانات.

## الاستدعاء من الويب (JavaScript)
الملف `live-activity.js` (في تطبيق الويب) يستدعي الجسر تلقائياً عند توفّره:
```js
// بدء عدّاد صلاة على الـDynamic Island وشاشة القفل:
LiveActivity.startPrayer('العصر', targetEpochSeconds);
// أو أثناء التلاوة:
LiveActivity.startRecite('سورة الكهف', 5, 'العفاسي');
LiveActivity.end();
```
على الويب أو أندرويد يتجاهلها بأمان (no-op).

> ملاحظة: هذه الميزة لا تؤثّر على بناء Codemagic الأساسي؛ التطبيق يعمل بدونها، وتُفعّل بعد إضافة الهدف.
