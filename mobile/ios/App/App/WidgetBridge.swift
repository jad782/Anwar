import Foundation
import Capacitor
import WidgetKit

// جسر Capacitor بين طبقة الويب وودجتات الشاشة الرئيسية.
// يُضاف لهدف التطبيق الرئيسي (App). يُستدعى من JS عبر window.WidgetBridge.
//
// ثلاث مهامّ:
//  setData   — المحتوى اليومي (آية/حديث/موقع) كما كان.
//  setConfig — إعدادات المواقيت (موقع وطريقة ومذهب وفروقات). تُكتب مرّة
//              وتكفي الودجت ليحسب بنفسه أبداً، فلا يتجمّد إن لم يُفتح التطبيق.
//  getState  — يقرأ ما كتبته الودجت (عدّاد التسبيح) ليوفّق التطبيق حالته.
@objc(WidgetBridge)
public class WidgetBridge: CAPPlugin {
    let appGroup = "group.com.alanwar.quran.jad"

    private var store: UserDefaults? { UserDefaults(suiteName: appGroup) }

    private func reload() {
        if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
    }

    @objc func setData(_ call: CAPPluginCall) {
        let json = call.getString("json") ?? "{}"
        store?.set(json, forKey: "widgetData")
        if let hindi = call.getString("numHindi") {
            store?.set(hindi, forKey: "numHindi")
        }
        reload()
        call.resolve(["ok": true])
    }

    @objc func setConfig(_ call: CAPPluginCall) {
        if let json = call.getString("json") {
            store?.set(json, forKey: "prayerConfig")
        }
        reload()
        call.resolve(["ok": true])
    }

    // التسبيح: التطبيق والودجت يكتبان في المفتاح نفسه.
    // الطابع الزمني يتيح للتطبيق معرفة أيّهما أحدث قبل الكتابة فوقه.
    @objc func setTasbeeh(_ call: CAPPluginCall) {
        guard let d = store else { call.resolve(["ok": false]); return }
        if let count = call.getInt("count") {
            d.set(max(0, count), forKey: "tasbeehCount")
            d.set(Date().timeIntervalSince1970, forKey: "tasbeehUpdatedAt")
        }
        if let target = call.getInt("target"), target > 0 {
            d.set(target, forKey: "tasbeehTarget")
        }
        if let phrase = call.getString("phrase"), !phrase.isEmpty {
            d.set(phrase, forKey: "tasbeehPhrase")
        }
        reload()
        call.resolve(["ok": true])
    }

    @objc func getState(_ call: CAPPluginCall) {
        guard let d = store else { call.resolve([:]); return }
        call.resolve([
            "tasbeehCount": d.integer(forKey: "tasbeehCount"),
            "tasbeehTarget": d.integer(forKey: "tasbeehTarget"),
            "tasbeehUpdatedAt": d.double(forKey: "tasbeehUpdatedAt")
        ])
    }
}
