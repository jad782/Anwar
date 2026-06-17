package com.alanwar.quran;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import java.util.Calendar;

/**
 * ودجت "آية اليوم" — يعرض آية قصيرة موثّقة (نص قرآني) مع مرجعها،
 * تتغيّر يومياً، وبالضغط يفتح التطبيق. لا يتم تأليف أي نص.
 */
public class AyahWidget extends AppWidgetProvider {

    // آيات قصيرة بنصّها ومراجعها (مأخوذة من المصحف)
    private static final String[] AYAT = {
        "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ",
        "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
        "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
        "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
        "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        "وَبَشِّرِ الصَّابِرِينَ"
    };
    private static final String[] REFS = {
        "النحل: 127", "الشرح: 5", "الرعد: 28", "الحديد: 4",
        "البقرة: 153", "طه: 114", "البقرة: 155"
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateWidget(context, manager, id);
    }

    private void updateWidget(Context context, AppWidgetManager manager, int id) {
        int idx = 0;
        try {
            int day = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
            idx = day % AYAT.length;
        } catch (Exception e) { idx = 0; }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.ayah_widget);
        views.setTextViewText(R.id.widget_ayah, AYAT[idx]);
        views.setTextViewText(R.id.widget_ref, "﴿ " + REFS[idx] + " ﴾");

        // فتح التطبيق عند الضغط
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getActivity(context, 0, launch, flags);
            views.setOnClickPendingIntent(R.id.widget_root, pi);
        }

        manager.updateAppWidget(id, views);
    }
}
