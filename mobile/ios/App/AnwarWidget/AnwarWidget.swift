// =======================================================
//  AnwarWidget.swift — ودجت المحتوى اليومي + حزمة الودجتات
//
//  APP_GROUP والألوان انتقلت إلى AnwarTheme.swift (تُعرَّف مرّة واحدة).
//  هذا الملف يحوي: بيانات المحتوى اليومي، وودجت الآية/الحديث،
//  ونقطة الدخول @main التي تسجّل كل الودجتات.
// =======================================================

import WidgetKit
import SwiftUI

// MARK: - المحتوى اليومي القادم من التطبيق عبر App Group

struct AnwarData {
    var ayah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
    var ayahRef = ""
    var hadith = ""
    var location = ""
}

func loadAnwarData() -> AnwarData {
    var data = AnwarData()
    guard let d = UserDefaults(suiteName: APP_GROUP),
          let s = d.string(forKey: "widgetData"),
          let jd = s.data(using: .utf8),
          let obj = (try? JSONSerialization.jsonObject(with: jd)) as? [String: Any]
    else { return data }
    if let v = obj["ayah"] as? String, !v.isEmpty { data.ayah = v }
    if let v = obj["ayahRef"] as? String { data.ayahRef = v }
    if let v = obj["hadith"] as? String { data.hadith = v }
    if let v = obj["location"] as? String { data.location = v }
    return data
}

// MARK: - ودجت الآية والحديث

struct AnwarEntry: TimelineEntry {
    let date: Date
    let data: AnwarData
}

struct AnwarProvider: TimelineProvider {
    func placeholder(in context: Context) -> AnwarEntry {
        AnwarEntry(date: Date(), data: AnwarData())
    }
    func getSnapshot(in context: Context, completion: @escaping (AnwarEntry) -> Void) {
        completion(AnwarEntry(date: Date(), data: loadAnwarData()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<AnwarEntry>) -> Void) {
        let entry = AnwarEntry(date: Date(), data: loadAnwarData())
        // المحتوى يومي: أعد البناء عند منتصف الليل بدل كل ساعة
        let cal = Calendar.current
        let next = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: Date()))
            ?? Date().addingTimeInterval(3600)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct DailyContentView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetFamily) private var family
    let entry: AnwarEntry

    var body: some View {
        VStack(alignment: .trailing, spacing: family == .systemSmall ? 5 : 8) {
            HStack {
                AnwarBadge(title: "آية اليوم")
                Spacer()
            }

            Text(entry.data.ayah)
                .font(.system(size: family == .systemSmall ? 13 : (family == .systemLarge ? 21 : 16),
                              weight: .medium, design: .serif))
                .foregroundStyle(T.text.c(scheme))
                .multilineTextAlignment(.trailing)
                .lineLimit(family == .systemSmall ? 4 : (family == .systemLarge ? 8 : 3))
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity, alignment: .trailing)

            if !entry.data.ayahRef.isEmpty {
                Text(entry.data.ayahRef)
                    .font(.system(size: family == .systemSmall ? 10 : 11, weight: .semibold))
                    .foregroundStyle(T.accent.c(scheme))
            }

            if family == .systemLarge, !entry.data.hadith.isEmpty {
                Divider().background(T.hair.c(scheme)).padding(.vertical, 2)
                Text("حديث اليوم")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(T.accent.c(scheme))
                Text(entry.data.hadith)
                    .font(.system(size: 15, design: .serif))
                    .foregroundStyle(T.soft.c(scheme))
                    .multilineTextAlignment(.trailing)
                    .lineLimit(6)
                    .minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }

            Spacer(minLength: 0)
        }
    }
}

struct AnwarWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AnwarWidget", provider: AnwarProvider()) { entry in
            DailyContentView(entry: entry).anwarContainer()
        }
        .configurationDisplayName("آية اليوم")
        .description("آية وحديث يتجدّدان كل يوم.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - نقطة الدخول الوحيدة

@main
struct AnwarWidgetBundle: WidgetBundle {
    var body: some Widget {
        PrayerRingWidget()
        PrayerTableWidget()
        PrayerTimelineWidget()
        TasbeehWidget()
        AthkarWidget()
        AnwarWidget()
        AnwarWidgetLiveActivity()
    }
}
