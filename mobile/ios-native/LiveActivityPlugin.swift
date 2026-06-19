import Foundation
import Capacitor
import ActivityKit

// جسر Capacitor: يسمح لـ JavaScript ببدء/تحديث/إنهاء النشاط الحيّ.
// يُضاف هذا الملف إلى هدف التطبيق الرئيسي (App target) في Xcode.
@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin {

    private var activity: Any?  // Activity<AnwarAttributes> (متاح iOS 16.1+)

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else { call.resolve(["ok": false, "reason": "ios<16.1"]); return }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { call.resolve(["ok": false, "reason": "disabled"]); return }
        let state = stateFrom(call)
        do {
            let act = try Activity<AnwarAttributes>.request(
                attributes: AnwarAttributes(title: "الأنوار"),
                contentState: state,
                pushType: nil)
            self.activity = act
            call.resolve(["ok": true])
        } catch { call.resolve(["ok": false, "reason": error.localizedDescription]) }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *), let act = activity as? Activity<AnwarAttributes> else { call.resolve(["ok": false]); return }
        Task { await act.update(using: stateFrom(call)); call.resolve(["ok": true]) }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *), let act = activity as? Activity<AnwarAttributes> else { call.resolve(["ok": false]); return }
        Task { await act.end(dismissalPolicy: .immediate); self.activity = nil; call.resolve(["ok": true]) }
    }

    @available(iOS 16.1, *)
    private func stateFrom(_ call: CAPPluginCall) -> AnwarAttributes.ContentState {
        return AnwarAttributes.ContentState(
            kind: call.getString("kind") ?? "prayer",
            prayerName: call.getString("prayerName") ?? "",
            targetEpoch: call.getDouble("targetEpoch") ?? Date().timeIntervalSince1970,
            surahName: call.getString("surahName") ?? "",
            ayah: call.getInt("ayah") ?? 1,
            reciter: call.getString("reciter") ?? "")
    }
}
