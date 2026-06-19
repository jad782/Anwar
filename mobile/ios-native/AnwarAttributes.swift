import ActivityKit
import Foundation

// سمات النشاط الحيّ (Live Activity) لتطبيق الأنوار
// تُستخدم لعرض: العدّ التنازلي للصلاة، أو حالة التلاوة، في Dynamic Island وشاشة القفل.
struct AnwarAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // عام
        var kind: String          // "prayer" أو "recite"
        // وضع الصلاة
        var prayerName: String    // مثال: "العصر"
        var targetEpoch: Double    // وقت الأذان (ثوانٍ منذ 1970) للعدّ التنازلي
        // وضع التلاوة
        var surahName: String     // مثال: "سورة الكهف"
        var ayah: Int             // رقم الآية الحالية
        var reciter: String
    }
    var title: String             // ثابت: "الأنوار"
}
