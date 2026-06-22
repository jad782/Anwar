import Foundation
import Capacitor
import WidgetKit

// جسر Capacitor: يكتب بيانات الودجت في App Group ويعيد تحميل الودجت.
// يُضاف لهدف التطبيق الرئيسي (App). استدعِه من JS عبر window.WidgetBridge.
@objc(WidgetBridge)
public class WidgetBridge: CAPPlugin {
    let appGroup = "group.com.alanwar.quran.jad.jad"

    @objc func setData(_ call: CAPPluginCall) {
        let json = call.getString("json") ?? "{}"
        UserDefaults(suiteName: appGroup)?.set(json, forKey: "widgetData")
        if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
        call.resolve(["ok": true])
    }
}
