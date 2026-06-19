# منتجات الشراء داخل التطبيق (ادعم المطوّر)

أنشئها في **App Store Connect ▸ تطبيقك ▸ In-App Purchases** كنوع **Consumable**:

| Product ID (Reference Name) | النوع | السعر التقريبي |
|---|---|---|
| `com.alanwar.quran.tip1`  | Consumable | Tier 1 (~0.99$) |
| `com.alanwar.quran.tip5`  | Consumable | Tier 5 (~4.99$) |
| `com.alanwar.quran.tip10` | Consumable | Tier 10 (~9.99$) |

لكل منتج:
- **Display Name**: مثلاً «دعم بسيط / دعم كريم / دعم سخيّ».
- **Description**: «دعم تطوّعي لمطوّر التطبيق، دون أي ميزة مدفوعة».
- أضف **لقطة مراجعة (screenshot)** لشاشة «ادعم المطوّر».

## مهم لقبول آبل
- هذه «إكراميات» (Tips) دون مقابل/ميزات — مسموحة كـ Consumable IAP.
- **لا** تضع رقم حساب بنكي أو IBAN أو رابط دفع خارجي داخل التطبيق (سبب رفض مؤكّد). تم حذف ذلك.
- اسم القسم «ادعم المطوّر» (Support the Developer) وليس «تبرّع».

المعرّفات مُسجّلة في الكود: `pro.js ▸ SUPPORT_TIERS`.
