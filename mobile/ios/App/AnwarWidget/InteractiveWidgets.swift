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

// MARK: - ٢) الأدعية والأذكار — الضغط على الودجت يبدّل الدعاء

struct Dhikr {
    let text: String
    let cat: String
    let info: String
}

enum AthkarBank {

    /// تُقرأ من duas.json المُشتَقّ آلياً من مكتبة التطبيق (mobile/gen-duas.js).
    /// النصّ الشرعي له مصدر واحد مُراجَع: لو كُتب في Swift مرّةً وفي الويب
    /// مرّةً لتفرّقا مع الوقت، وخطأٌ في دعاء أو في نسبته ضررٌ حقيقيّ.
    static let items: [Dhikr] = load()

    private static func load() -> [Dhikr] {
        guard let url = Bundle.main.url(forResource: "duas", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let arr = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]]
        else { return fallback }
        let parsed = arr.compactMap { o -> Dhikr? in
            guard let t = o["text"] as? String, !t.isEmpty else { return nil }
            return Dhikr(text: t,
                         cat:  (o["cat"]  as? String) ?? "",
                         info: (o["info"] as? String) ?? "")
        }
        return parsed.isEmpty ? fallback : parsed
    }

    /// لا يُفترض أن يُستعمل — لكن ودجت فارغة أسوأ من ودجت بذكرٍ واحد
    private static let fallback: [Dhikr] = [
        Dhikr(text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", cat: "", info: "متفق عليه")
    ]

    /// يجمع دوران الوقت (كل ساعتين) مع تبديل المستخدم اليدوي.
    /// الخلط بمضاعف أوّليّ يجعل التتابع غير متوقّع فلا يبدو دورةً مكرّرة.
    static func current(at date: Date) -> Dhikr {
        let n = items.count
        guard n > 0 else { return fallback[0] }
        let manual = UserDefaults(suiteName: APP_GROUP)?.integer(forKey: "athkarIndex") ?? 0
        let slot = Int(date.timeIntervalSince1970 / 7200)
        let i = ((slot + manual * 7) % n + n) % n
        return items[i]
    }
}

struct AthkarEntry: TimelineEntry {
    let date: Date
    let dhikr: Dhikr
}

struct AthkarProvider: TimelineProvider {
    func placeholder(in context: Context) -> AthkarEntry {
        AthkarEntry(date: Date(), dhikr: AthkarBank.current(at: Date()))
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
    @Environment(\.widgetFamily) private var family
    let entry: AthkarEntry

    private var textSize: CGFloat {
        switch family {
        case .systemSmall:  return 12
        case .systemLarge:  return 19
        default:            return 15.5
        }
    }
    private var lines: Int {
        switch family {
        case .systemSmall:  return 5
        case .systemLarge:  return 11
        default:            return 4
        }
    }

    var body: some View {
        // الودجت كلّه زرّ واحد: ضغطةٌ في أي مكان تبدّل الدعاء بلا فتح التطبيق
        Button(intent: AthkarNextIntent()) {
            VStack(alignment: .trailing, spacing: 6) {
                HStack(spacing: 5) {
                    AnwarBadge(title: entry.dhikr.cat.isEmpty ? "ذكر" : entry.dhikr.cat)
                    Spacer(minLength: 0)
                    // إشارة إلى أن الودجت قابل للضغط
                    Image(systemName: "hand.tap.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(T.soft.c(scheme).opacity(0.55))
                }

                Text(entry.dhikr.text)
                    .font(.system(size: textSize, weight: .medium, design: .serif))
                    .foregroundStyle(T.text.c(scheme))
                    .multilineTextAlignment(.trailing)
                    .lineLimit(lines)
                    .minimumScaleFactor(0.55)
                    .frame(maxWidth: .infinity, alignment: .trailing)

                Spacer(minLength: 0)

                if !entry.dhikr.info.isEmpty && family != .systemSmall {
                    Text(entry.dhikr.info)
                        .font(.system(size: 9.5))
                        .foregroundStyle(T.soft.c(scheme))
                        .multilineTextAlignment(.trailing)
                        .lineLimit(family == .systemLarge ? 3 : 1)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

struct AthkarWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AnwarAthkar", provider: AthkarProvider()) { entry in
            AthkarView(entry: entry).anwarContainer()
        }
        .configurationDisplayName("أدعية وأذكار")
        .description("اضغط الودجت ليتبدّل الدعاء — بلا فتح التطبيق.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
