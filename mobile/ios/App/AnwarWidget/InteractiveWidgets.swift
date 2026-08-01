// =======================================================
//  InteractiveWidgets.swift — الودجتان التفاعليتان (iOS 17+)
//
//  ١) عدّاد التسبيح: زر مدمج يزيد العدّ من الشاشة الرئيسية مباشرة.
//  ٢) الأذكار: ذكر يتبدّل تلقائياً، وزرّ لتبديله يدوياً.
//
//  الآلية: AppIntent يُنفَّذ داخل امتداد الودجت (بلا فتح التطبيق)، يكتب
//  الحالة في App Group، ثم يعيد النظام بناء الودجت فوراً. التطبيق يقرأ
//  الحالة نفسها عند فتحه فيبقى الرقمان متطابقين.
// =======================================================

import WidgetKit
import SwiftUI
import AppIntents

// MARK: - الحالة المشتركة

enum TasbeehStore {
    static let countKey = "tasbeehCount"
    static let targetKey = "tasbeehTarget"
    static let phraseKey = "tasbeehPhrase"
    /// نضع علامةً ليعرف التطبيق أن الودجت زاد العدّ فيوفّق حالته
    static let stampKey = "tasbeehUpdatedAt"

    static var defaults: UserDefaults? { UserDefaults(suiteName: APP_GROUP) }

    static var count: Int { defaults?.integer(forKey: countKey) ?? 0 }

    static var target: Int {
        let t = defaults?.integer(forKey: targetKey) ?? 0
        return t > 0 ? t : 33
    }

    static var phrase: String {
        let p = defaults?.string(forKey: phraseKey) ?? ""
        return p.isEmpty ? "سُبْحَانَ اللَّه" : p
    }

    static func set(_ v: Int) {
        guard let d = defaults else { return }
        d.set(max(0, v), forKey: countKey)
        d.set(Date().timeIntervalSince1970, forKey: stampKey)
    }
}

// MARK: - النوايا (Intents)

struct TasbeehIncrementIntent: AppIntent {
    static var title: LocalizedStringResource = "تسبيح"
    static var description = IntentDescription("زيادة عدّاد التسبيح")
    /// لا نفتح التطبيق: التنفيذ داخل الودجت
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        TasbeehStore.set(TasbeehStore.count + 1)
        WidgetCenter.shared.reloadTimelines(ofKind: "AnwarTasbeeh")
        return .result()
    }
}

struct TasbeehResetIntent: AppIntent {
    static var title: LocalizedStringResource = "تصفير العدّاد"
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        TasbeehStore.set(0)
        WidgetCenter.shared.reloadTimelines(ofKind: "AnwarTasbeeh")
        return .result()
    }
}

struct AthkarNextIntent: AppIntent {
    static var title: LocalizedStringResource = "ذكر آخر"
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        guard let d = UserDefaults(suiteName: APP_GROUP) else { return .result() }
        d.set(d.integer(forKey: "athkarIndex") + 1, forKey: "athkarIndex")
        WidgetCenter.shared.reloadTimelines(ofKind: "AnwarAthkar")
        return .result()
    }
}

// MARK: - ١) عدّاد التسبيح

struct TasbeehEntry: TimelineEntry {
    let date: Date
    let count: Int
    let target: Int
    let phrase: String
}

struct TasbeehProvider: TimelineProvider {
    private func now() -> TasbeehEntry {
        TasbeehEntry(date: Date(), count: TasbeehStore.count,
                     target: TasbeehStore.target, phrase: TasbeehStore.phrase)
    }
    func placeholder(in context: Context) -> TasbeehEntry {
        TasbeehEntry(date: Date(), count: 0, target: 33, phrase: "سُبْحَانَ اللَّه")
    }
    func getSnapshot(in context: Context, completion: @escaping (TasbeehEntry) -> Void) {
        completion(now())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<TasbeehEntry>) -> Void) {
        // لا حاجة لجدولة: النية تعيد البناء عند كل ضغطة
        completion(Timeline(entries: [now()], policy: .never))
    }
}

struct TasbeehView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetFamily) private var family
    let entry: TasbeehEntry

    private var progress: Double {
        guard entry.target > 0 else { return 0 }
        return min(Double(entry.count % entry.target) / Double(entry.target), 1)
    }
    private var rounds: Int {
        guard entry.target > 0 else { return 0 }
        return entry.count / entry.target
    }

    var body: some View {
        switch family {
        case .systemSmall: small
        default:           medium
        }
    }

    /// الزرّ الدائري: كامل مساحة الحلقة قابل للضغط
    private func counterButton(size: CGFloat) -> some View {
        Button(intent: TasbeehIncrementIntent()) {
            ZStack {
                Circle().stroke(T.hair.c(scheme), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(T.accent.c(scheme), style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text(Num.fmt(entry.count % max(entry.target, 1)))
                        .font(.system(size: size * 0.30, weight: .bold, design: .rounded))
                        .foregroundStyle(T.text.c(scheme))
                    Text("/ \(Num.fmt(entry.target))")
                        .font(.system(size: size * 0.12, weight: .medium))
                        .foregroundStyle(T.soft.c(scheme))
                }
            }
            .frame(width: size, height: size)
            .contentShape(Circle())
        }
        .buttonStyle(.plain)
    }

    private var small: some View {
        VStack(spacing: 5) {
            Text(entry.phrase)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(T.accent.c(scheme))
                .lineLimit(1).minimumScaleFactor(0.7)
            counterButton(size: 78)
            if rounds > 0 {
                Text("أتممت \(Num.fmt(rounds)) دورة")
                    .font(.system(size: 9))
                    .foregroundStyle(T.soft.c(scheme))
            }
        }
        .padding(.vertical, 4)
    }

    private var medium: some View {
        HStack(spacing: 16) {
            counterButton(size: 92)
            VStack(alignment: .trailing, spacing: 6) {
                AnwarBadge(title: "التسبيح")
                Text(entry.phrase)
                    .font(.system(size: 19, weight: .bold))
                    .foregroundStyle(T.text.c(scheme))
                    .lineLimit(2).minimumScaleFactor(0.7)
                    .multilineTextAlignment(.trailing)
                Text(rounds > 0 ? "أتممت \(Num.fmt(rounds)) دورة" : "اضغط الحلقة لتسبّح")
                    .font(.system(size: 11))
                    .foregroundStyle(T.soft.c(scheme))
                Button(intent: TasbeehResetIntent()) {
                    Label("تصفير", systemImage: "arrow.counterclockwise")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(T.accent.c(scheme))
                        .padding(.horizontal, 10).padding(.vertical, 5)
                        .background(
                            Capsule().fill(T.accent.c(scheme).opacity(0.14))
                        )
                }
                .buttonStyle(.plain)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }
}

struct TasbeehWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AnwarTasbeeh", provider: TasbeehProvider()) { entry in
            TasbeehView(entry: entry).anwarContainer()
        }
        .configurationDisplayName("عدّاد التسبيح")
        .description("سبّح من الشاشة الرئيسية مباشرةً بلا فتح التطبيق.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - ٢) الأذكار المتبدّلة

struct Dhikr {
    let text: String
    let source: String
}

enum AthkarBank {
    /// أذكار مختصرة ثابتة داخل الودجت كي يعمل بلا التطبيق وبلا شبكة
    static let items: [Dhikr] = [
        Dhikr(text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", source: "متفق عليه"),
        Dhikr(text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", source: "متفق عليه"),
        Dhikr(text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", source: "من السنّة"),
        Dhikr(text: "أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ", source: "أبو داود"),
        Dhikr(text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", source: "أبو داود"),
        Dhikr(text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", source: "متفق عليه"),
        Dhikr(text: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", source: "أبو داود"),
        Dhikr(text: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", source: "أبو داود"),
        Dhikr(text: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", source: "مسلم"),
        Dhikr(text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ", source: "ابن ماجه"),
        Dhikr(text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ", source: "الترمذي"),
        Dhikr(text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا", source: "أبو داود")
    ]

    /// يجمع دوران الوقت (كل ساعتين) مع تبديل المستخدم اليدوي
    static func current(at date: Date) -> Dhikr {
        let manual = UserDefaults(suiteName: APP_GROUP)?.integer(forKey: "athkarIndex") ?? 0
        let slot = Int(date.timeIntervalSince1970 / 7200)
        let i = ((slot + manual) % items.count + items.count) % items.count
        return items[i]
    }
}

struct AthkarEntry: TimelineEntry {
    let date: Date
    let dhikr: Dhikr
}

struct AthkarProvider: TimelineProvider {
    func placeholder(in context: Context) -> AthkarEntry {
        AthkarEntry(date: Date(), dhikr: AthkarBank.items[0])
    }
    func getSnapshot(in context: Context, completion: @escaping (AthkarEntry) -> Void) {
        completion(AthkarEntry(date: Date(), dhikr: AthkarBank.current(at: Date())))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<AthkarEntry>) -> Void) {
        // إدخالات مسبقة كل ساعتين: يتبدّل الذكر بلا أي إيقاظ للامتداد
        var entries: [AthkarEntry] = []
        let now = Date()
        for i in 0..<12 {
            let d = now.addingTimeInterval(Double(i) * 7200)
            entries.append(AthkarEntry(date: d, dhikr: AthkarBank.current(at: d)))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct AthkarView: View {
    @Environment(\.colorScheme) private var scheme
    let entry: AthkarEntry

    var body: some View {
        VStack(alignment: .trailing, spacing: 8) {
            HStack {
                AnwarBadge(title: "ذكر")
                Spacer()
                Button(intent: AthkarNextIntent()) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(T.accent.c(scheme))
                        .padding(7)
                        .background(Circle().fill(T.accent.c(scheme).opacity(0.14)))
                }
                .buttonStyle(.plain)
            }

            Text(entry.dhikr.text)
                .font(.system(size: 16, weight: .medium, design: .serif))
                .foregroundStyle(T.text.c(scheme))
                .multilineTextAlignment(.trailing)
                .lineLimit(4)
                .minimumScaleFactor(0.65)
                .frame(maxWidth: .infinity, alignment: .trailing)

            Spacer(minLength: 0)

            Text(entry.dhikr.source)
                .font(.system(size: 10))
                .foregroundStyle(T.soft.c(scheme))
        }
    }
}

struct AthkarWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AnwarAthkar", provider: AthkarProvider()) { entry in
            AthkarView(entry: entry).anwarContainer()
        }
        .configurationDisplayName("أذكار")
        .description("ذكر يتبدّل تلقائياً، وزرّ لتبديله متى شئت.")
        .supportedFamilies([.systemMedium])
    }
}
