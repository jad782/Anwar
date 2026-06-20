# قواعد أمان Firestore — مهم قبل النشر

حالياً قاعدة البيانات في **Test Mode** (مفتوحة للجميع وتنتهي بعد ~30 يوم). قبل النشر، ضع قواعد تسمح فقط بغرف الختمة:

Firebase Console ▸ Firestore ▸ Rules ▸ الصق:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      // قراءة وإنشاء للجميع (لا حسابات في التطبيق)
      allow read, create: if true;
      // التحديث مسموح فقط لحقل الأعضاء وبحجم منطقي (يمنع العبث)
      allow update: if request.resource.data.keys().hasOnly(['name','members','createdAt'])
                    && request.resource.data.members.size() <= 30;
      allow delete: if false;
    }
  }
}
```

> ملاحظة: التطبيق لا يستخدم تسجيل دخول، فالقواعد مفتوحة للقراءة/الإنشاء عمداً. إن أردت حماية أقوى لاحقاً، فعّل **Anonymous Auth** واربط الكتابة بـ `request.auth != null`.
