// =======================================================
//  PrayerEngine.swift — حساب أوقات الصلاة داخل الودجت
//
//  منقول حرفياً عن prayers.js (خوارزمية PrayTimes.org، المجال العام)
//  كي تُطابق أرقامُ الودجت أرقامَ التطبيق دقيقةً بدقيقة.
//
//  لماذا نحسب هنا بدل قراءة ما يدفعه التطبيق؟
//  لأن الجسر لا يدفع إلا والتطبيق مفتوح. فلو لم يفتحه المستخدم يومين
//  لعرض الودجت مواقيت أول أمس. الحساب محليّاً يجعل الودجت مكتفياً ذاتياً:
//  صحيح دائماً، بلا شبكة، وبلا أن يفتح المستخدم التطبيق أصلاً.
// =======================================================

import Foundation

// MARK: - طرق الحساب (زوايا الفجر/العشاء) — مطابقة لـMETHODS في prayers.js

struct CalcMethod {
    let fajr: Double
    /// العشاء إمّا زاوية، وإمّا دقائق بعد المغرب (أم القرى: ٩٠ دقيقة)
    let ishaAngle: Double?
    let ishaMinutes: Double?

    init(fajr: Double, isha: Double) {
        self.fajr = fajr; self.ishaAngle = isha; self.ishaMinutes = nil
    }
    init(fajr: Double, ishaMinutes: Double) {
        self.fajr = fajr; self.ishaAngle = nil; self.ishaMinutes = ishaMinutes
    }

    static let all: [String: CalcMethod] = [
        "MWL":     CalcMethod(fajr: 18,   isha: 17),
        "Egypt":   CalcMethod(fajr: 19.5, isha: 17.5),
        "Makkah":  CalcMethod(fajr: 18.5, ishaMinutes: 90),
        "Karachi": CalcMethod(fajr: 18,   isha: 18),
        "Turkey":  CalcMethod(fajr: 18,   isha: 17),
        "ISNA":    CalcMethod(fajr: 15,   isha: 15)
    ]
}

// MARK: - إعدادات المستخدم كما يدفعها التطبيق إلى App Group

struct PrayerConfig {
    var lat: Double = 33.5138          // دمشق افتراضاً (نفس أول مدينة في prayers.js)
    var lng: Double = 36.2765
    var tz: Double = 3
    var method: String = "Turkey"
    var hanafi: Bool = false
    var offsets: [String: Double] = [:]
    var city: String = ""

    /// يقرأ ما كتبه الجسر. عند غياب أي مفتاح نُبقي الافتراضي بدل الانهيار.
    static func load() -> PrayerConfig {
        var c = PrayerConfig()
        guard let d = UserDefaults(suiteName: APP_GROUP),
              let s = d.string(forKey: "prayerConfig"),
              let jd = s.data(using: .utf8),
              let o = (try? JSONSerialization.jsonObject(with: jd)) as? [String: Any]
        else { return c }

        if let v = o["lat"] as? Double { c.lat = v }
        if let v = o["lng"] as? Double { c.lng = v }
        if let v = o["tz"]  as? Double { c.tz  = v }
        if let v = o["method"] as? String, CalcMethod.all[v] != nil { c.method = v }
        if let v = o["hanafi"] as? Bool { c.hanafi = v }
        if let v = o["city"] as? String { c.city = v }
        if let v = o["offsets"] as? [String: Any] {
            var m: [String: Double] = [:]
            for (k, raw) in v {
                if let n = raw as? Double { m[k] = n }
                else if let n = raw as? Int { m[k] = Double(n) }
            }
            c.offsets = m
        }
        return c
    }
}

// MARK: - رياضيات فلكية (بالدرجات، كما في الأصل)

private func dtr(_ d: Double) -> Double { d * .pi / 180 }
private func rtd(_ r: Double) -> Double { r * 180 / .pi }
private func sinD(_ d: Double) -> Double { sin(dtr(d)) }
private func cosD(_ d: Double) -> Double { cos(dtr(d)) }
private func tanD(_ d: Double) -> Double { tan(dtr(d)) }
private func arcsinD(_ x: Double) -> Double { rtd(asin(x)) }
private func arccosD(_ x: Double) -> Double { rtd(acos(x)) }
private func arctan2D(_ y: Double, _ x: Double) -> Double { rtd(atan2(y, x)) }
private func arccotD(_ x: Double) -> Double { rtd(atan(1 / x)) }

private func fixA(_ a: Double) -> Double { let v = a - 360 * floor(a / 360); return v < 0 ? v + 360 : v }
private func fixH(_ a: Double) -> Double { let v = a - 24 * floor(a / 24);  return v < 0 ? v + 24 : v }

private func julian(_ y0: Int, _ m0: Int, _ d: Int) -> Double {
    var y = y0, m = m0
    if m <= 2 { y -= 1; m += 12 }
    let A = floor(Double(y) / 100)
    let B = 2 - A + floor(A / 4)
    return floor(365.25 * (Double(y) + 4716)) + floor(30.6001 * (Double(m) + 1)) + Double(d) + B - 1524.5
}

private struct SunPos { let decl: Double; let eqt: Double }

private func sunPosition(_ jd: Double) -> SunPos {
    let D = jd - 2451545.0
    let g = fixA(357.529 + 0.98560028 * D)
    let q = fixA(280.459 + 0.98564736 * D)
    let Ls = fixA(q + 1.915 * sinD(g) + 0.020 * sinD(2 * g))
    let e = 23.439 - 0.00000036 * D
    let decl = arcsinD(sinD(e) * sinD(Ls))
    let eqt = (q / 15) - fixH(arctan2D(cosD(e) * sinD(Ls), cosD(Ls)) / 15)
    return SunPos(decl: decl, eqt: eqt)
}

private func midDay(_ jd: Double, _ t: Double) -> Double {
    fixH(12 - sunPosition(jd + t).eqt)
}

/// يرجع NaN عند خطوط العرض العليا حين لا تبلغ الشمس الزاوية أصلاً.
private func sunAngleTime(_ jd: Double, _ t: Double, _ angle: Double, _ lat: Double, _ ccw: Bool) -> Double {
    let decl = sunPosition(jd + t).decl
    let noon = midDay(jd, t)
    let x = (-sinD(angle) - sinD(lat) * sinD(decl)) / (cosD(lat) * cosD(decl))
    if x < -1 || x > 1 { return Double.nan }
    let T = arccosD(x) / 15
    return noon + (ccw ? -T : T)
}

private func asrTime(_ jd: Double, _ t: Double, _ factor: Double, _ lat: Double) -> Double {
    let decl = sunPosition(jd + t).decl
    let angle = -arccotD(factor + tanD(abs(lat - decl)))
    return sunAngleTime(jd, t, angle, lat, false)
}

// MARK: - المخرجات

/// وقت صلاة بالساعات الكسرية منذ منتصف الليل المحلي.
struct PrayerTime {
    let key: String       // Fajr / Sunrise / ...
    let nameAr: String
    let hours: Double     // قد تكون NaN في المناطق القطبية

    var isValid: Bool { !hours.isNaN }

    /// "HH:mm" بأرقام لاتينية — التنسيق الهندي يُترك للعرض
    var hhmm: String {
        guard isValid else { return "--:--" }
        let h = fixH(hours + 0.5 / 60)          // تقريب لأقرب دقيقة كما في الأصل
        let hh = Int(floor(h))
        let mm = Int(floor((h - floor(h)) * 60))
        return String(format: "%02d:%02d", hh, mm)
    }

    /// تاريخ فعلي في اليوم المعطى (بالتقويم المحلي للجهاز)
    func date(on day: Date, calendar: Calendar) -> Date? {
        guard isValid else { return nil }
        let h = fixH(hours + 0.5 / 60)
        let start = calendar.startOfDay(for: day)
        return calendar.date(byAdding: .second, value: Int((h * 3600).rounded()), to: start)
    }
}

struct DayPrayers {
    let fajr: PrayerTime
    let sunrise: PrayerTime
    let dhuhr: PrayerTime
    let asr: PrayerTime
    let maghrib: PrayerTime
    let isha: PrayerTime

    /// الصلوات الخمس فقط (بلا الشروق) — للعرض والتنقّل
    var five: [PrayerTime] { [fajr, dhuhr, asr, maghrib, isha] }
    /// الستة بما فيها الشروق — للجدول الكامل
    var all: [PrayerTime] { [fajr, sunrise, dhuhr, asr, maghrib, isha] }
}

// MARK: - المحرّك

enum PrayerEngine {

    static func compute(config c: PrayerConfig, date: Date, calendar: Calendar) -> DayPrayers {
        let comp = calendar.dateComponents([.year, .month, .day], from: date)
        let y = comp.year ?? 2026, mo = comp.month ?? 1, d = comp.day ?? 1

        let M = CalcMethod.all[c.method] ?? CalcMethod.all["MWL"]!
        let jd = julian(y, mo, d) - c.lng / (15 * 24)
        let base = 12 - c.lng / 15 + c.tz
        let t = base / 24
        // تحويل الساعة الشمسية إلى ساعة محلية.
        // الاسم toLocal لا T كي لا يحجب النوع العام T في AnwarTheme.swift.
        func toLocal(_ h: Double) -> Double { h - c.lng / 15 + c.tz }
        func off(_ k: String) -> Double { (c.offsets[k] ?? 0) / 60 }

        let fajr    = toLocal(sunAngleTime(jd, t, M.fajr, c.lat, true))  + off("Fajr")
        let sunrise = toLocal(sunAngleTime(jd, t, 0.833,  c.lat, true))  + off("Sunrise")
        let dhuhr   = toLocal(midDay(jd, t)) + 2.0 / 60                  + off("Dhuhr")   // احتياط دخول الوقت دقيقتان
        let asr     = toLocal(asrTime(jd, t, c.hanafi ? 2 : 1, c.lat))   + off("Asr")
        let maghrib = toLocal(sunAngleTime(jd, t, 0.833,  c.lat, false)) + 1.0 / 60 + off("Maghrib")

        let ishaRaw: Double
        if let mins = M.ishaMinutes {
            // أم القرى: ٩٠ دقيقة بعد المغرب — محسوبة من المغرب قبل تطبيق فرقه
            let maghribBase = toLocal(sunAngleTime(jd, t, 0.833, c.lat, false)) + 1.0 / 60
            ishaRaw = maghribBase + mins / 60
        } else {
            ishaRaw = toLocal(sunAngleTime(jd, t, M.ishaAngle ?? 17, c.lat, false))
        }
        let isha = ishaRaw + off("Isha")

        return DayPrayers(
            fajr:    PrayerTime(key: "Fajr",    nameAr: "الفجر",   hours: fajr),
            sunrise: PrayerTime(key: "Sunrise", nameAr: "الشروق",  hours: sunrise),
            dhuhr:   PrayerTime(key: "Dhuhr",   nameAr: "الظهر",   hours: dhuhr),
            asr:     PrayerTime(key: "Asr",     nameAr: "العصر",   hours: asr),
            maghrib: PrayerTime(key: "Maghrib", nameAr: "المغرب",  hours: maghrib),
            isha:    PrayerTime(key: "Isha",    nameAr: "العشاء",  hours: isha)
        )
    }

    /// الصلاة القادمة مع لحظتَي بدايتها وبداية ما قبلها — أساس الحلقة والعدّاد.
    /// يعبر إلى فجر الغد تلقائياً بعد العشاء، ويتخطّى الأوقات غير الصالحة قطبياً.
    struct NextPrayer {
        let name: String
        let key: String
        let at: Date
        let previousAt: Date      // بداية الصلاة السابقة (لحساب نسبة التقدّم)
        let timeString: String
    }

    static func next(config c: PrayerConfig, now: Date = Date(), calendar cal: Calendar = .current) -> NextPrayer? {
        let today = compute(config: c, date: now, calendar: cal)

        // مرشّحون: صلوات اليوم الصالحة، مرتّبة زمنياً
        var slots: [(PrayerTime, Date)] = []
        for p in today.five {
            if let dt = p.date(on: now, calendar: cal) { slots.append((p, dt)) }
        }
        slots.sort { $0.1 < $1.1 }

        if let idx = slots.firstIndex(where: { $0.1 > now }) {
            let (p, dt) = slots[idx]
            let prev: Date
            if idx > 0 {
                prev = slots[idx - 1].1
            } else if let yesterday = cal.date(byAdding: .day, value: -1, to: now) {
                // ما قبل فجر اليوم هو عشاء أمس
                let y = compute(config: c, date: yesterday, calendar: cal)
                prev = y.isha.date(on: yesterday, calendar: cal) ?? dt.addingTimeInterval(-6 * 3600)
            } else {
                prev = dt.addingTimeInterval(-6 * 3600)
            }
            return NextPrayer(name: p.nameAr, key: p.key, at: dt, previousAt: prev, timeString: p.hhmm)
        }

        // مضى العشاء → فجر الغد
        guard let tomorrow = cal.date(byAdding: .day, value: 1, to: now) else { return nil }
        let t = compute(config: c, date: tomorrow, calendar: cal)
        guard let fajrDate = t.fajr.date(on: tomorrow, calendar: cal) else { return nil }
        let prev = slots.last?.1 ?? fajrDate.addingTimeInterval(-6 * 3600)
        return NextPrayer(name: t.fajr.nameAr, key: "Fajr", at: fajrDate, previousAt: prev, timeString: t.fajr.hhmm)
    }

    /// لحظات إعادة بناء الـTimeline: كل بداية صلاة قادمة خلال ٤٨ ساعة.
    /// أدقّ من التحديث كل ساعة وأقلّ استهلاكاً في آن واحد.
    static func refreshDates(config c: PrayerConfig, from now: Date = Date(), calendar cal: Calendar = .current) -> [Date] {
        var out: [Date] = []
        for dayOffset in 0...2 {
            guard let day = cal.date(byAdding: .day, value: dayOffset, to: now) else { continue }
            let p = compute(config: c, date: day, calendar: cal)
            for t in p.five {
                if let dt = t.date(on: day, calendar: cal), dt > now {
                    out.append(dt)
                }
            }
        }
        return Array(out.sorted().prefix(12))
    }
}
