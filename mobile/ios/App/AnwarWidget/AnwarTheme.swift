// =======================================================
//  AnwarTheme.swift — هوية بصرية واحدة لكل الودجتات
//
//  الأسماء GOLD / GOLD_LIGHT / DARK_BG / CREAM و APP_GROUP كانت معرّفة
//  في AnwarWidget.swift ويستعملها النشاط الحيّ. نُقلت هنا كي تُعرَّف مرّة
//  واحدة ويشترك فيها الجميع (تعريفها مرّتين خطأ تصريف).
// =======================================================

import SwiftUI
import WidgetKit

// MARK: - App Group (مطابق لـcodemagic.yaml والاستحقاقات)

let APP_GROUP = "group.com.alanwar.quran.jad"

// MARK: - ألوان الهوية

let GOLD       = Color(red: 0.83, green: 0.66, blue: 0.26)
let GOLD_LIGHT = Color(red: 0.95, green: 0.82, blue: 0.48)
let DARK_BG    = Color(red: 0.08, green: 0.07, blue: 0.04)
let CREAM      = Color(red: 0.95, green: 0.91, blue: 0.84)

/// لون يتبدّل مع نمط النظام. الودجت يُرسم بنمط الجهاز لا بنمط التطبيق،
/// فلا بدّ من نسختين وإلا صار النهاري نصّاً كريمياً على أبيض.
struct Adaptive {
    let light: Color
    let dark: Color
    func c(_ s: ColorScheme) -> Color { s == .dark ? dark : light }
}

enum T {
    /// النص الأساسي
    static let text = Adaptive(
        light: Color(red: 0.14, green: 0.10, blue: 0.05),
        dark:  CREAM
    )
    /// النص الثانوي
    static let soft = Adaptive(
        light: Color(red: 0.42, green: 0.36, blue: 0.28),
        dark:  Color(red: 0.80, green: 0.75, blue: 0.65)
    )
    /// اللون المميّز (الذهبي) — أغمق في النهاري ليقرأ على خلفية فاتحة
    static let accent = Adaptive(
        light: Color(red: 0.60, green: 0.45, blue: 0.05),
        dark:  GOLD_LIGHT
    )
    /// لون الحلقات والحدود الخافتة
    static let hair = Adaptive(
        light: Color(red: 0.60, green: 0.45, blue: 0.05).opacity(0.22),
        dark:  GOLD.opacity(0.28)
    )

    /// خلفية الحاوية. من iOS 17 صار لا بدّ من containerBackground وإلا
    /// رسم النظام خلفيته الافتراضية وضاع التدرّج.
    static func background(_ s: ColorScheme) -> LinearGradient {
        s == .dark
        ? LinearGradient(colors: [Color(red: 0.14, green: 0.11, blue: 0.06), DARK_BG],
                         startPoint: .topLeading, endPoint: .bottomTrailing)
        : LinearGradient(colors: [Color(red: 1.0, green: 0.99, blue: 0.96),
                                  Color(red: 0.96, green: 0.93, blue: 0.87)],
                         startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

// MARK: - الأرقام (هندية/لاتينية) تبعاً لإعداد التطبيق

enum Num {
    /// يقرأ إعداد num_hindi الذي يدفعه الجسر. الافتراضي هندي كما في التطبيق.
    static var useHindi: Bool {
        guard let d = UserDefaults(suiteName: APP_GROUP),
              let v = d.string(forKey: "numHindi") else { return true }
        return v != "0"
    }

    static func fmt(_ s: String) -> String {
        guard useHindi else { return s }
        let map: [Character: Character] = ["0":"٠","1":"١","2":"٢","3":"٣","4":"٤",
                                           "5":"٥","6":"٦","7":"٧","8":"٨","9":"٩"]
        return String(s.map { map[$0] ?? $0 })
    }

    static func fmt(_ n: Int) -> String { fmt(String(n)) }
}

// MARK: - لبنات مشتركة

/// خلفية الودجت + الاتجاه من اليمين لليسار، بسطر واحد في كل واجهة.
struct AnwarContainer: ViewModifier {
    @Environment(\.colorScheme) private var scheme
    func body(content: Content) -> some View {
        content
            .environment(\.layoutDirection, .rightToLeft)
            .containerBackground(for: .widget) { T.background(scheme) }
    }
}

extension View {
    func anwarContainer() -> some View { modifier(AnwarContainer()) }
}

/// شارة صغيرة بهوية التطبيق تُستعمل في أعلى الودجتات
struct AnwarBadge: View {
    @Environment(\.colorScheme) private var scheme
    var title: String = "الأنوار"
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "moon.stars.fill")
                .font(.system(size: 9))
            Text(title).font(.system(size: 10, weight: .semibold))
                .lineLimit(1).minimumScaleFactor(0.8)   // أسماء التصنيفات قد تطول
        }
        .foregroundStyle(T.accent.c(scheme))
    }
}
