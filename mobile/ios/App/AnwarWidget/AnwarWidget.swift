import WidgetKit
import SwiftUI

// ===== App Group + قراءة البيانات =====
let APP_GROUP = "group.com.alanwar.quran.jad"

struct AnwarData {
    var nextPrayer = "—"
    var nextPrayerTime = "--:--"
    var ayah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
    var ayahRef = ""
    var hadith = ""
    var location = ""
}

func loadAnwarData() -> AnwarData {
    var data = AnwarData()
    let d = UserDefaults(suiteName: APP_GROUP)
    guard let s = d?.string(forKey: "widgetData"),
          let jd = s.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: jd) as? [String: Any] else { return data }
    data.nextPrayer     = obj["nextPrayer"] as? String ?? data.nextPrayer
    data.nextPrayerTime = obj["nextPrayerTime"] as? String ?? data.nextPrayerTime
    data.ayah           = obj["ayah"] as? String ?? data.ayah
    data.ayahRef        = obj["ayahRef"] as? String ?? data.ayahRef
    data.hadith         = obj["hadith"] as? String ?? data.hadith
    data.location       = obj["location"] as? String ?? data.location
    return data
}

// ===== Timeline =====
struct AnwarEntry: TimelineEntry { let date: Date; let data: AnwarData }

struct AnwarProvider: TimelineProvider {
    func placeholder(in context: Context) -> AnwarEntry { AnwarEntry(date: Date(), data: AnwarData()) }
    func getSnapshot(in context: Context, completion: @escaping (AnwarEntry) -> Void) {
        completion(AnwarEntry(date: Date(), data: loadAnwarData()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<AnwarEntry>) -> Void) {
        let entry = AnwarEntry(date: Date(), data: loadAnwarData())
        // حدّث كل ساعة
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// ===== ألوان الهوية (رملي ذهبي فخم على داكن) =====
let GOLD = Color(red: 0.83, green: 0.66, blue: 0.26)
let GOLD_LIGHT = Color(red: 0.95, green: 0.82, blue: 0.48)
let DARK_BG = Color(red: 0.08, green: 0.07, blue: 0.04)
let CREAM = Color(red: 0.95, green: 0.91, blue: 0.84)

// ===== الواجهات حسب الحجم =====
struct AnwarWidgetEntryView: View {
    var entry: AnwarEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red:0.14,green:0.11,blue:0.06), DARK_BG],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            switch family {
            case .systemSmall:  smallView
            default:            mediumView
            }
        }
    }

    var smallView: some View {
        VStack(alignment: .trailing, spacing: 6) {
            HStack { Spacer(); Text("الأنوار").font(.caption2).foregroundColor(GOLD) }
            Spacer()
            Text("🕌 \(entry.data.nextPrayer)").font(.subheadline).bold().foregroundColor(CREAM)
            Text(entry.data.nextPrayerTime).font(.title2).bold().foregroundColor(GOLD_LIGHT)
            Spacer()
            Text(entry.data.ayahRef).font(.caption2).foregroundColor(GOLD).lineLimit(1)
        }
        .padding(12).environment(\.layoutDirection, .rightToLeft)
    }

    var mediumView: some View {
        HStack(spacing: 12) {
            // يسار: الصلاة القادمة
            VStack(spacing: 4) {
                Text("الصلاة القادمة").font(.caption2).foregroundColor(.secondary)
                Text(entry.data.nextPrayer).font(.headline).foregroundColor(CREAM)
                Text(entry.data.nextPrayerTime).font(.title).bold().foregroundColor(GOLD_LIGHT)
                if !entry.data.location.isEmpty {
                    Text("📍 \(entry.data.location)").font(.caption2).foregroundColor(.secondary).lineLimit(1)
                }
            }.frame(maxWidth: 120)
            Rectangle().fill(GOLD.opacity(0.25)).frame(width: 1)
            // يمين: آية اليوم
            VStack(alignment: .trailing, spacing: 6) {
                Text("✦ آية اليوم").font(.caption2).foregroundColor(GOLD)
                Text(entry.data.ayah).font(.system(size: 16, weight: .medium, design: .serif))
                    .foregroundColor(CREAM).multilineTextAlignment(.trailing).lineLimit(3).minimumScaleFactor(0.7)
                Text(entry.data.ayahRef).font(.caption2).foregroundColor(GOLD)
            }.frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(14).environment(\.layoutDirection, .rightToLeft)
    }
}

struct AnwarWidget: Widget {
    let kind = "AnwarWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AnwarProvider()) { entry in
            AnwarWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("الأنوار")
        .description("أوقات الصلاة وآية اليوم")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// ===== حزمة الودجت (نقطة الدخول الوحيدة @main) =====
@main
struct AnwarWidgetBundle: WidgetBundle {
    var body: some Widget {
        AnwarWidget()
        AnwarWidgetLiveActivity()
    }
}
