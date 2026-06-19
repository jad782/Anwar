import ActivityKit
import WidgetKit
import SwiftUI

// واجهة النشاط الحيّ + Dynamic Island
// يُضاف ضمن Widget Extension في Xcode (انظر README).
@main
struct AnwarWidgetBundle: WidgetBundle {
    var body: some Widget { AnwarLiveActivity() }
}

struct AnwarLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AnwarAttributes.self) { context in
            // واجهة شاشة القفل (Lock Screen / Banner)
            HStack(spacing: 12) {
                Text(context.state.kind == "prayer" ? "🕌" : "📖").font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    if context.state.kind == "prayer" {
                        Text("الصلاة القادمة: \(context.state.prayerName)").font(.caption).foregroundColor(.secondary)
                        Text(Date(timeIntervalSince1970: context.state.targetEpoch), style: .timer)
                            .font(.title3).bold().foregroundColor(Color(red: 0.83, green: 0.66, blue: 0.26))
                    } else {
                        Text(context.state.surahName).font(.subheadline).bold()
                        Text("آية \(context.state.ayah) · \(context.state.reciter)").font(.caption).foregroundColor(.secondary)
                    }
                }
                Spacer()
            }
            .padding(14)
            .activityBackgroundTint(Color(red: 0.08, green: 0.07, blue: 0.04))
            .activitySystemActionForegroundColor(Color(red: 0.83, green: 0.66, blue: 0.26))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.kind == "prayer" ? "🕌" : "📖").font(.title2)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.kind == "prayer" {
                        Text(Date(timeIntervalSince1970: context.state.targetEpoch), style: .timer)
                            .font(.headline).foregroundColor(Color(red: 0.83, green: 0.66, blue: 0.26))
                    } else {
                        Text("آية \(context.state.ayah)").font(.headline)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.kind == "prayer" ? context.state.prayerName : context.state.surahName)
                        .font(.subheadline).bold()
                }
            } compactLeading: {
                Text(context.state.kind == "prayer" ? "🕌" : "📖")
            } compactTrailing: {
                if context.state.kind == "prayer" {
                    Text(Date(timeIntervalSince1970: context.state.targetEpoch), style: .timer)
                        .font(.caption2).frame(maxWidth: 44)
                } else {
                    Text("\(context.state.ayah)").font(.caption2)
                }
            } minimal: {
                Text(context.state.kind == "prayer" ? "🕌" : "📖")
            }
            .widgetURL(URL(string: "alanwar://open"))
        }
    }
}
