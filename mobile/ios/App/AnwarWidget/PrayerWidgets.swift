// =======================================================
//  PrayerWidgets.swift — ودجتات أوقات الصلاة (٣)
//
//  ١) حلقة العدّ التنازلي للصلاة القادمة
//  ٢) الخط الزمني الأفقي للصلوات
//  ٣) جدول الصلوات الخمس مع إبراز القادمة
//
//  مفتاح الأداء: ProgressView(timerInterval:) و Text(_:style:.timer)
//  يرسمهما النظام ويحرّكهما بنفسه ثانيةً بثانية بلا أي إعادة بناء
//  للـTimeline. فالحلقة "حيّة" وتكلفة البطارية صفر.
//  ولذلك نُجدول الإدخالات عند بدايات الصلوات فقط لا كل ساعة.
// =======================================================

import WidgetKit
import SwiftUI

// MARK: - مزوّد مشترك

struct PrayerEntry: TimelineEntry {
    let date: Date
    let config: PrayerConfig
    let day: DayPrayers
    let next: PrayerEngine.NextPrayer?
}

struct PrayerProvider: TimelineProvider {

    private func build(at date: Date) -> PrayerEntry {
        let cfg = PrayerConfig.load()
        let cal = Calendar.current
        return PrayerEntry(
            date: date,
            config: cfg,
            day: PrayerEngine.compute(config: cfg, date: date, calendar: cal),
            next: PrayerEngine.next(config: cfg, now: date, calendar: cal)
        )
    }

    func placeholder(in context: Context) -> PrayerEntry { build(at: Date()) }

    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
        completion(build(at: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let now = Date()
        let cfg = PrayerConfig.load()
        // إدخال لكل بداية صلاة قادمة: اللحظة التي يتغيّر فيها المعروض فعلاً
        var entries = [build(at: now)]
        for d in PrayerEngine.refreshDates(config: cfg, from: now) {
            entries.append(build(at: d))
        }
        // شبكة أمان: لو تعذّر الحساب (قطبياً مثلاً) أعد المحاولة بعد ساعة
        let policy: TimelineReloadPolicy = entries.count > 1
            ? .after(entries[1].date)
            : .after(now.addingTimeInterval(3600))
        completion(Timeline(entries: entries, policy: policy))
    }
}

// MARK: - ١) حلقة العدّ التنازلي

struct PrayerRingView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetFamily) private var family
    let entry: PrayerEntry

    var body: some View {
        if let n = entry.next {
            switch family {
            case .systemSmall: small(n)
            default:           medium(n)
            }
        } else {
            UnavailableView()
        }
    }

    private func ring(_ n: PrayerEngine.NextPrayer, size: CGFloat, line: CGFloat) -> some View {
        // ClosedRange ينهار إن كان lowerBound > upperBound، وانهيار الامتداد
        // يعني ودجت فارغة لا يمكن تشخيصها بلا ماك. نضمن الترتيب هنا.
        let start = min(n.previousAt, n.at.addingTimeInterval(-60))
        let span = start...n.at
        return ZStack {
            Circle()
                .stroke(T.hair.c(scheme), lineWidth: line)
            // الحلقة تتقدّم مع الوقت بنفسها — لا مؤقّت ولا إعادة رسم
            ProgressView(timerInterval: span, countsDown: false)
                .progressViewStyle(.circular)
                .tint(T.accent.c(scheme))
                .labelsHidden()
            VStack(spacing: 1) {
                Text(n.name)
                    .font(.system(size: size * 0.14, weight: .bold))
                    .foregroundStyle(T.text.c(scheme))
                // العدّ التنازلي يرسمه النظام ثانيةً بثانية
                Text(n.at, style: .timer)
                    .font(.system(size: size * 0.16, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(T.accent.c(scheme))
                    .multilineTextAlignment(.center)
                    .environment(\.layoutDirection, .leftToRight)   // العدّاد يُقرأ لاتينياً
            }
            .padding(size * 0.16)
        }
        .frame(width: size, height: size)
    }

    private func small(_ n: PrayerEngine.NextPrayer) -> some View {
        VStack(spacing: 6) {
            AnwarBadge()
            ring(n, size: 82, line: 5)
            Text(Num.fmt(n.timeString))
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(T.soft.c(scheme))
                .environment(\.layoutDirection, .leftToRight)
        }
        .padding(.vertical, 6)
    }

    private func medium(_ n: PrayerEngine.NextPrayer) -> some View {
        HStack(spacing: 16) {
            ring(n, size: 96, line: 6)
            VStack(alignment: .trailing, spacing: 5) {
                AnwarBadge()
                Text("الصلاة القادمة")
                    .font(.system(size: 11))
                    .foregroundStyle(T.soft.c(scheme))
                Text(n.name)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(T.text.c(scheme))
                Text(Num.fmt(n.timeString))
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                    .foregroundStyle(T.accent.c(scheme))
                    .environment(\.layoutDirection, .leftToRight)
                if !entry.config.city.isEmpty {
                    Label(entry.config.city, systemImage: "location.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(T.soft.c(scheme))
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.horizontal, 4)
    }
}

struct PrayerRingWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AnwarPrayerRing", provider: PrayerProvider()) { entry in
            PrayerRingView(entry: entry).anwarContainer()
        }
        .configurationDisplayName("الصلاة القادمة")
        .description("حلقة تتقدّم مع الوقت وعدّاد تنازلي للصلاة القادمة.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - ٢) الخط الزمني الأفقي

struct PrayerTimelineView: View {
    @Environment(\.colorScheme) private var scheme
    let entry: PrayerEntry

    /// موضع الآن بين أول الصلوات وآخرها (0…1) لرسم المؤشّر
    private var progress: Double {
        let cal = Calendar.current
        let pts = entry.day.five.compactMap { $0.date(on: entry.date, calendar: cal) }
        guard let first = pts.first, let last = pts.last, last > first else { return 0 }
        let v = entry.date.timeIntervalSince(first) / last.timeIntervalSince(first)
        return min(max(v, 0), 1)
    }

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            HStack {
                AnwarBadge()
                Spacer()
                if let n = entry.next {
                    Text(n.at, style: .timer)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(T.accent.c(scheme))
                        .frame(maxWidth: 62, alignment: .leading)
                        .environment(\.layoutDirection, .leftToRight)
                }
            }

            GeometryReader { geo in
                let pts = entry.day.five
                let step = pts.count > 1 ? geo.size.width / CGFloat(pts.count - 1) : 0
                ZStack(alignment: .topLeading) {
                    // الخط
                    Capsule()
                        .fill(T.hair.c(scheme))
                        .frame(height: 3)
                        .offset(y: 5)
                    // الجزء المنقضي (من اليمين لأن الاتجاه معكوس)
                    Capsule()
                        .fill(T.accent.c(scheme).opacity(0.55))
                        .frame(width: geo.size.width * progress, height: 3)
                        .offset(y: 5)
                    // النقاط
                    ForEach(Array(pts.enumerated()), id: \.offset) { i, p in
                        let isNext = entry.next?.key == p.key
                        let passed = isPassed(p)
                        Circle()
                            .fill(isNext ? T.accent.c(scheme)
                                         : (passed ? T.accent.c(scheme).opacity(0.45) : T.hair.c(scheme)))
                            .frame(width: isNext ? 13 : 9, height: isNext ? 13 : 9)
                            .overlay(
                                Circle()
                                    .stroke(T.accent.c(scheme), lineWidth: isNext ? 2 : 0)
                                    .padding(-2.5)
                            )
                            .position(x: CGFloat(i) * step, y: 6.5)
                    }
                }
            }
            .frame(height: 16)

            // الأسماء والأوقات تحت النقاط
            HStack(spacing: 0) {
                ForEach(Array(entry.day.five.enumerated()), id: \.offset) { _, p in
                    let isNext = entry.next?.key == p.key
                    VStack(spacing: 2) {
                        Text(p.nameAr)
                            .font(.system(size: 10, weight: isNext ? .bold : .regular))
                            .foregroundStyle(isNext ? T.accent.c(scheme) : T.soft.c(scheme))
                        Text(Num.fmt(p.hhmm))
                            .font(.system(size: 11, weight: isNext ? .bold : .medium, design: .rounded))
                            .foregroundStyle(isNext ? T.text.c(scheme) : T.soft.c(scheme))
                            .environment(\.layoutDirection, .leftToRight)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    private func isPassed(_ p: PrayerTime) -> Bool {
        guard let d = p.date(on: entry.date, calendar: .current) else { return false }
        return d <= entry.date
    }
}

struct PrayerTimelineWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AnwarPrayerTimeline", provider: PrayerProvider()) { entry in
            PrayerTimelineView(entry: entry).anwarContainer()
        }
        .configurationDisplayName("خطّ الصلوات")
        .description("الصلوات الخمس على خطّ زمني يوضّح ما مضى وما بقي.")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - ٣) جدول الصلوات الخمس

struct PrayerTableView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetFamily) private var family
    let entry: PrayerEntry

    private var rows: [PrayerTime] {
        family == .systemLarge ? entry.day.all : entry.day.five
    }

    var body: some View {
        VStack(alignment: .trailing, spacing: family == .systemLarge ? 9 : 6) {
            HStack {
                AnwarBadge()
                Spacer()
                if !entry.config.city.isEmpty {
                    Label(entry.config.city, systemImage: "location.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(T.soft.c(scheme))
                        .lineLimit(1)
                }
            }
            .padding(.bottom, 1)

            ForEach(Array(rows.enumerated()), id: \.offset) { _, p in
                let isNext = entry.next?.key == p.key
                HStack {
                    Text(p.nameAr)
                        .font(.system(size: family == .systemLarge ? 16 : 13,
                                      weight: isNext ? .bold : .medium))
                        .foregroundStyle(isNext ? T.accent.c(scheme) : T.text.c(scheme))
                    Spacer()
                    Text(Num.fmt(p.hhmm))
                        .font(.system(size: family == .systemLarge ? 17 : 14,
                                      weight: isNext ? .bold : .regular, design: .rounded))
                        .foregroundStyle(isNext ? T.accent.c(scheme) : T.soft.c(scheme))
                        .environment(\.layoutDirection, .leftToRight)
                }
                .padding(.horizontal, 9)
                .padding(.vertical, family == .systemLarge ? 7 : 4)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(isNext ? T.accent.c(scheme).opacity(0.14) : Color.clear)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(isNext ? T.accent.c(scheme).opacity(0.45) : Color.clear, lineWidth: 1)
                )
            }

            if family == .systemLarge, let n = entry.next {
                Divider().background(T.hair.c(scheme))
                HStack {
                    Text("بقي على \(n.name)")
                        .font(.system(size: 12))
                        .foregroundStyle(T.soft.c(scheme))
                    Spacer()
                    Text(n.at, style: .timer)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(T.accent.c(scheme))
                        .frame(maxWidth: 78, alignment: .leading)
                        .environment(\.layoutDirection, .leftToRight)
                }
            }
        }
    }
}

struct PrayerTableWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AnwarPrayerTable", provider: PrayerProvider()) { entry in
            PrayerTableView(entry: entry).anwarContainer()
        }
        .configurationDisplayName("جدول الصلوات")
        .description("أوقات اليوم كاملة مع إبراز الصلاة القادمة.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - حالة تعذّر الحساب (خطوط العرض القطبية)

struct UnavailableView: View {
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "location.slash")
                .font(.title3)
                .foregroundStyle(T.soft.c(scheme))
            Text("افتح التطبيق لضبط موقعك")
                .font(.system(size: 11))
                .multilineTextAlignment(.center)
                .foregroundStyle(T.soft.c(scheme))
        }
        .padding(8)
    }
}
