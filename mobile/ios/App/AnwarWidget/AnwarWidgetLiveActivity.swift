import ActivityKit
import WidgetKit
import SwiftUI


struct AnwarAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var kind: String
        var prayerName: String
        var targetEpoch: Double
        var surahName: String
        var ayah: String
        var reciter: String
    }
}

// النشاط الحيّ + Dynamic Island (بدون @main — موجود في AnwarWidget.swift)
struct AnwarWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AnwarAttributes.self) { context in
            // واجهة شاشة القفل / البانر
            HStack(spacing: 12) {
                Text(context.state.kind == "prayer" ? "🕌" : "📖").font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    if context.state.kind == "prayer" {
                        Text("الصلاة القادمة: \(context.state.prayerName)").font(.caption).foregroundColor(.secondary)
                        Text(Date(timeIntervalSince1970: context.state.targetEpoch), style: .timer)
                            .font(.title3).bold().foregroundColor(GOLD).frame(maxWidth: 120)
                    } else {
                        Text(context.state.surahName).font(.subheadline).bold().foregroundColor(CREAM)
                        Text("آية \(context.state.ayah) · \(context.state.reciter)").font(.caption).foregroundColor(.secondary)
                    }
                }
                Spacer()
            }
            .padding(14)
            .activityBackgroundTint(DARK_BG)
            .activitySystemActionForegroundColor(GOLD)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label { Text(context.state.kind == "prayer" ? context.state.prayerName : context.state.surahName).font(.caption).bold() }
                          icon: { Text(context.state.kind == "prayer" ? "🕌" : "📖") }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.kind == "prayer" {
                        Text(Date(timeIntervalSince1970: context.state.targetEpoch), style: .timer)
                            .font(.headline).foregroundColor(GOLD).frame(maxWidth: 90).multilineTextAlignment(.trailing)
                    } else {
                        Text("آية \(context.state.ayah)").font(.headline).foregroundColor(GOLD)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.kind == "prayer" ? "وجّه قلبك للصلاة 🤍" : "تلاوة مباركة 🌿")
                        .font(.caption2).foregroundColor(.secondary)
                }
            } compactLeading: {
                Text(context.state.kind == "prayer" ? "🕌" : "📖")
            } compactTrailing: {
                if context.state.kind == "prayer" {
                    Text(Date(timeIntervalSince1970: context.state.targetEpoch), style: .timer)
                        .font(.caption2).foregroundColor(GOLD).frame(maxWidth: 48)
                } else {
                    Text("\(context.state.ayah)").font(.caption2).foregroundColor(GOLD)
                }
            } minimal: {
                Text(context.state.kind == "prayer" ? "🕌" : "📖")
            }
            .keylineTint(GOLD)
            .widgetURL(URL(string: "alanwar://open"))
        }
    }
}
