# دليل MacinCloud + إضافة هدف الودجت (خطوة واحدة بالعمر)

> الهدف: على ماك سحابي (ساعة واحدة فقط)، نضيف **هدف الودجت (Widget Extension)** للمشروع ونعمل commit.
> بعدها **Codemagic يبني كل شي تلقائياً من الويندوز للأبد** (بما فيه الودجت والـDynamic Island).

ملاحظة: لا أقدر أضع لقطات حقيقية، فكتبت كل خطوة بوصف الشاشة والزر بدقّة.

---

## أولاً: قبل ما تفتح الماك (من الويندوز)
1. تأكّد إنك رفعت آخر نسخة: `git push`.
2. جهّز جاهزاً:
   - **Apple ID** (حساب مطوّر Apple Developer مدفوع 99$/سنة).
   - اسم الحزمة: `com.alanwar.quran`.

---

## ثانياً: استئجار MacinCloud
1. ادخل **macincloud.com** ▸ اختر خطة **Pay-As-You-Go** (بالساعة، الأرخص).
2. أنشئ حساب وادفع (≈1$/ساعة). رح يعطوك **اسم سيرفر + مستخدم + كلمة سر**.
3. من ويندوز افتح **Remote Desktop Connection** (موجود بويندوز) ▸ الصق اسم السيرفر ▸ Connect ▸ أدخل المستخدم/كلمة السر. رح يطلع لك سطح مكتب ماك.

---

## ثالثاً: تجهيز المشروع على الماك (Terminal)
افتح **Terminal** (من Launchpad) ونفّذ سطراً سطراً:
```bash
# 1) ثبّت أدوات أساسية (إن لم تكن موجودة)
xcode-select --install        # إن طلب، اضغط Install
sudo gem install cocoapods    # كلمة سر الماك إن طُلبت

# 2) اسحب مشروعك
cd ~/Desktop
git clone https://github.com/jad782/Anwar.git
cd Anwar/mobile

# 3) جهّز iOS
npm install
node gen-icons.js
node copy-web.js
npx cap add ios
npx cap sync ios
cd ios/App && pod install && cd ../..

# 4) افتح المشروع في Xcode
npx cap open ios
```
رح يفتح **Xcode** على مشروع `App`.

---

## رابعاً: إضافة هدف الودجت في Xcode
1. من القائمة العلوية: **File ▸ New ▸ Target…**
2. ابحث عن **Widget Extension** ▸ Next.
3. **Product Name:** اكتب `AnwarWidget`.
4. ✅ فعّل خانة **Include Live Activity**. (ألغِ "Include Configuration Intent" إن وُجدت).
5. Finish ▸ إذا سأل **Activate scheme?** اضغط **Activate**.

### استبدال ملفات القالب بكودك الجاهز
6. في الشريط الجانبي اليسار، افتح مجلد **AnwarWidget**. احذف الملف `AnwarWidget.swift` المولّد (Right-click ▸ Delete ▸ Move to Trash).
7. اسحب من Finder الملفات من `Anwar/mobile/ios-native/` إلى مجلد **AnwarWidget** داخل Xcode:
   - `AnwarAttributes.swift`
   - `AnwarLiveActivity.swift`
   عند الإفلات: ✅ فعّل **Copy items if needed**، وحدّد **Target: AnwarWidget**.
8. أضِف `AnwarAttributes.swift` **أيضاً لهدف App**: اختر الملف ▸ في اللوحة اليمنى (File Inspector) ▸ تحت **Target Membership** ✅ علّم **App** و**AnwarWidget** الاثنين.
9. أضِف جسر الإضافة لهدف **App** فقط: اسحب `LiveActivityPlugin.swift` و`LiveActivityPlugin.m` إلى مجلد **App** ▸ Target: **App**. (إذا ظهر سؤال Bridging Header اضغط **Don't Create** — Capacitor عنده واحد).

### تفعيل القدرات (Capabilities)
10. اختر هدف **App** (الأزرق فوق) ▸ تبويب **Signing & Capabilities**:
    - **Team:** اختر فريقك.
    - تأكّد **Automatically manage signing** ✅.
11. اختر هدف **AnwarWidget** ▸ Signing & Capabilities ▸ نفس **Team** ▸ تأكّد bundle id صار `com.alanwar.quran.AnwarWidget`.

### تثبيت التغييرات
12. تأكّد إنه يبني: اختر جهاز **Any iOS Device** فوق ▸ **Product ▸ Build** (⌘B). لازم ينجح.

---

## خامساً: ارفع التغييرات (Terminal على الماك)
```bash
cd ~/Desktop/Anwar
git add -A
git commit -m "إضافة هدف الودجت Widget + Live Activity"
git push
```
> إذا طلب تسجيل دخول GitHub، استخدم اسمك + **Personal Access Token** ككلمة سر.

**خلص!** صرت ما تحتاج الماك بعد هلأ. أوقف اشتراك MacinCloud.

---

## سادساً: من الويندوز فقط — كل بناء قادم عبر Codemagic
1. اربط المستودع `github.com/jad782/Anwar` بـ**Codemagic**.
2. أنشئ تكامل **App Store Connect API key** باسم `codemagic`.
3. أنشئ مجموعة متغيّرات **appstore**: `APP_STORE_APP_ID`، `BUNDLE_ID=com.alanwar.quran`، `APPLE_TEAM_ID`.
4. شغّل Workflow **Al-Anwar iOS → TestFlight** ▸ يبني ويرفع تلقائياً (الودجت محفوظ في مشروع ios المرفوع، فـCodemagic يبنيه معه).

> ⚠️ في App Store Connect: أنشئ أيضاً معرّف الودجت `com.alanwar.quran.AnwarWidget` (Identifiers) ومنتجات الدعم IAP (راجع IAP-PRODUCTS.md) قبل أول رفع.

---

## ملخّص الوقت/التكلفة
- MacinCloud: **ساعة واحدة (~1–2$) مرّة بالعمر** — فقط لإضافة الودجت.
- بعدها: كل التطوير على ويندوز، وكل بناء/رفع عبر Codemagic بدون ماك.
