//
//  AnwarWidgetLiveActivity.swift
//  AnwarWidget
//
//  Created by Malaz Bitar on 20.06.2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct AnwarWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct AnwarWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AnwarWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension AnwarWidgetAttributes {
    fileprivate static var preview: AnwarWidgetAttributes {
        AnwarWidgetAttributes(name: "World")
    }
}

extension AnwarWidgetAttributes.ContentState {
    fileprivate static var smiley: AnwarWidgetAttributes.ContentState {
        AnwarWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: AnwarWidgetAttributes.ContentState {
         AnwarWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: AnwarWidgetAttributes.preview) {
   AnwarWidgetLiveActivity()
} contentStates: {
    AnwarWidgetAttributes.ContentState.smiley
    AnwarWidgetAttributes.ContentState.starEyes
}
