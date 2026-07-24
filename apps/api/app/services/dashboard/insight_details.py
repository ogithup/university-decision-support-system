from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas.academic import (
    AlertItem,
    InsightChangeItem,
    InsightDetailResponse,
    InsightSourceContext,
    InsightTrendPoint,
)
from app.services.dashboard.academic_performance import get_academic_performance_center
from app.services.mock_university import get_dashboard_summary, get_finance_summary


def _slug(value: str) -> str:
    return (
        value.lower()
        .replace("%", "pct")
        .replace(" ", "-")
        .replace("_", "-")
        .replace("/", "-")
    )


def _source_context(source_mode: str) -> InsightSourceContext:
    active_channel = "warehouse_live" if source_mode == "warehouse_live" else "mock_connector"
    return InsightSourceContext(
        active_channel=active_channel,
        available_channels=["yoksis_api", "excel_json_upload", "warehouse_live", "mock_connector"],
        refresh_policy="YOKSIS, Excel/JSON ve mock akislar once staging, sonra warehouse uzerinden normalize edilir.",
        provenance_note="Detay sayfasi tek bir dashboard veri modeline baglidir; kaynak kanali degisse bile ayni combo chart ve degisim analizi korunur.",
    )


def get_dashboard_insight_detail(insight_id: str, db: Session) -> InsightDetailResponse:
    summary = get_dashboard_summary()
    finance = get_finance_summary()
    center = get_academic_performance_center(db)

    metric_map: dict[str, InsightDetailResponse] = {}
    for metric in center.metrics:
        trend = []
        previous = metric.sparkline[0].value if metric.sparkline else 0
        for point in metric.sparkline:
            trend.append(
                InsightTrendPoint(
                    label=point.label,
                    bar_value=point.value,
                    line_value=point.value * (1.02 if metric.status == "healthy" else 0.97),
                    delta_value=point.value - previous,
                )
            )
            previous = point.value

        metric_map[f"metric-{metric.code.lower().replace('_', '-')}"] = InsightDetailResponse(
            insight_id=f"metric-{metric.code.lower().replace('_', '-')}",
            title=metric.label,
            subtitle="Akademik performans merkezi KPI degisim analizi",
            status=metric.status,
            source_mode=center.source_mode,
            source_context=_source_context(center.source_mode),
            headline_value=metric.value,
            headline_delta=metric.delta,
            summary=f"{metric.label} KPI'i YOKSIS, Excel/JSON paketleri veya mock kanalindan gelen normalize edilmis verilerle ayni insight semasinda izlenir.",
            combo_trend=trend,
            change_breakdown=[
                InsightChangeItem(label="Aktif gosterge", value=metric.value, direction=metric.status, note=f"Son degisim {metric.delta}"),
                InsightChangeItem(label="Kaynak modu", value=center.source_mode, direction="info", note=center.last_updated),
                InsightChangeItem(label="Degisim sinyali", value=metric.status.upper(), direction=metric.status, note="Watch veya risk durumlari cockpit'te yanip sonen uyarilarla isaretlenir."),
            ],
            diagnostics=[
                InsightChangeItem(label="API mantigi", value="YOKSIS", direction="info", note="Kurumsal servis geldigi anda staging -> warehouse -> insight hattina akar."),
                InsightChangeItem(label="Dosya mantigi", value="Excel/JSON", direction="info", note="Yuklenen dosyalar ayni normalize semasina donusturulur."),
                InsightChangeItem(label="Mock mantigi", value="Mock", direction="info", note="Canli servis yoksa ayni KPI ekranini besleyen test verisi kullanilir."),
            ],
            alerts=[
                AlertItem(
                    id=f"{metric.code.lower()}-alert",
                    level="medium" if metric.status == "watch" else "low",
                    title=f"{metric.label} degisim akisi izleniyor",
                    owner="Karar Destek",
                    action="Detay combo chart ve veri kaynagi dagilimi ile dogrulayin.",
                )
            ],
        )

    alert_map = {
        f"alert-{alert.id}": InsightDetailResponse(
            insight_id=f"alert-{alert.id}",
            title=alert.title,
            subtitle=f"{alert.owner} tarafindan izlenen risk kaydi",
            status=alert.level.lower(),
            source_mode=center.source_mode,
            source_context=_source_context(center.source_mode),
            headline_value=alert.level.upper(),
            headline_delta="Kritik akis",
            summary=alert.action,
            combo_trend=[
                InsightTrendPoint(label=label, bar_value=value, line_value=value * 0.92, delta_value=delta)
                for label, value, delta in [("2022", 58, 0), ("2023", 61, 3), ("2024", 69, 8), ("2025", 74, 5), ("2026", 81, 7)]
            ],
            change_breakdown=[
                InsightChangeItem(label="Sorumlu", value=alert.owner, direction="info", note="Sahiplik bazli aksiyon"),
                InsightChangeItem(label="Seviye", value=alert.level.upper(), direction=alert.level.lower(), note=alert.title),
                InsightChangeItem(label="Aksiyon", value="Planlandi", direction="watch", note=alert.action),
            ],
            diagnostics=[
                InsightChangeItem(label="Risk izleme", value="Canli", direction="info", note="Watch ve risk akisinda dashboard blink durumu tetiklenir."),
                InsightChangeItem(label="Kaynak zinciri", value="Warehouse", direction="info", note="Alert kartlari normalize KPI ve kalite sonuclarindan turetilir."),
            ],
            alerts=[alert],
        )
        for alert in summary.alerts
    }

    source_map = {
        f"source-{_slug(source.source)}": InsightDetailResponse(
            insight_id=f"source-{_slug(source.source)}",
            title=source.source,
            subtitle="Veri kaynagi senkronizasyon sagligi",
            status=source.status.lower(),
            source_mode=center.source_mode,
            source_context=_source_context(center.source_mode),
            headline_value=source.status,
            headline_delta=source.freshness,
            summary=source.detail,
            combo_trend=[
                InsightTrendPoint(label=label, bar_value=value, line_value=value * 0.95, delta_value=delta)
                for label, value, delta in [("Pzt", 92, 0), ("Sal", 89, -3), ("Car", 84, -5), ("Per", 81, -3), ("Cum", 88, 7)]
            ],
            change_breakdown=[
                InsightChangeItem(label="Freshness", value=source.freshness, direction=source.status.lower(), note="Son veri tazelik durumu"),
                InsightChangeItem(label="Durum", value=source.status.upper(), direction=source.status.lower(), note=source.detail),
            ],
            diagnostics=[
                InsightChangeItem(label="YOKSIS akisi", value="Hazir", direction="info", note="Kurumsal endpoint geldiginde ayni health modeli kullanilir."),
                InsightChangeItem(label="Excel/JSON akisi", value="Hazir", direction="info", note="Dosya yukleme batch'leri freshness metriğine baglidir."),
            ],
            alerts=[
                AlertItem(
                    id=f"{_slug(source.source)}-health",
                    level="medium" if source.status.lower() == "watch" else "low",
                    title=f"{source.source} health izleniyor",
                    owner="Veri Yoneticisi",
                    action=source.detail,
                )
            ],
        )
        for source in summary.source_health
    }

    leader_map = {
        f"leader-{person.academic_id.lower()}": InsightDetailResponse(
            insight_id=f"leader-{person.academic_id.lower()}",
            title=person.name,
            subtitle=f"{person.title} | {person.department} degisim analizi",
            status="risk" if person.change < 0 else "healthy",
            source_mode=center.source_mode,
            source_context=_source_context(center.source_mode),
            headline_value=f"{person.score}",
            headline_delta=f"{person.change:+}",
            summary="Akademisyen bazli skor dalgalanmasi dashboard ve detay sayfasinda ayni mantikla izlenir.",
            combo_trend=[
                InsightTrendPoint(label=label, bar_value=value, line_value=value - 1.4, delta_value=delta)
                for label, value, delta in [("2022", 74, 0), ("2023", 78, 4), ("2024", 81, 3), ("2025", max(70, person.score - person.change), 2), ("2026", person.score, person.change)]
            ],
            change_breakdown=[
                InsightChangeItem(label="Toplam skor", value=f"{person.score}", direction="healthy", note="Guncel performans skoru"),
                InsightChangeItem(label="Donemsel degisim", value=f"{person.change:+}", direction="risk" if person.change < 0 else "healthy", note="Negatif degisimler cockpit'te pulse uyarisi verir."),
            ],
            diagnostics=[
                InsightChangeItem(label="Personel besleme", value="YOKSIS / Kurum", direction="info", note="Akademisyen kayitlari ileride canli kaynaktan beslenecek."),
                InsightChangeItem(label="Yayin besleme", value="Excel/JSON / Warehouse", direction="info", note="Yayin ve atif trendleri normalize edilerek birlestirilir."),
            ],
            alerts=[
                AlertItem(
                    id=f"{person.academic_id.lower()}-delta",
                    level="high" if person.change < 0 else "low",
                    title=f"{person.name} skor degisimi",
                    owner=person.department,
                    action="Negatif degisim varsa detay combo chart ve boyut skorlarini inceleyin.",
                )
            ],
        )
        for person in summary.top_performers
    }

    strip_map: dict[str, InsightDetailResponse] = {}
    for prefix, items, subtitle in [
        ("student", summary.student_metrics, "Stratejik egitim ve ogrenci gosterge analizi"),
        ("finance", summary.finance_metrics, "Stratejik mali gosterge analizi"),
        ("capacity", summary.capacity_metrics, "Fiziksel kaynak ve kapasite gosterge analizi"),
    ]:
        for item in items:
            strip_map[f"{prefix}-metric-{item.code.lower().replace('_', '-')}"] = InsightDetailResponse(
                insight_id=f"{prefix}-metric-{item.code.lower().replace('_', '-')}",
                title=item.label,
                subtitle=subtitle,
                status="watch" if item.delta.strip().startswith("-") else "healthy",
                source_mode=center.source_mode,
                source_context=_source_context(center.source_mode),
                headline_value=item.value,
                headline_delta=item.delta,
                summary=f"{item.label} degisimi detay grafikte bar ve line birlikte izlenir.",
                combo_trend=[
                    InsightTrendPoint(label=label, bar_value=value, line_value=value * 0.97, delta_value=delta)
                    for label, value, delta in [("2022", 52, 0), ("2023", 57, 5), ("2024", 61, 4), ("2025", 66, 5), ("2026", 63 if item.delta.strip().startswith('-') else 71, -3 if item.delta.strip().startswith('-') else 5)]
                ],
                change_breakdown=[
                    InsightChangeItem(label="Guncel deger", value=item.value, direction="info", note=item.label),
                    InsightChangeItem(label="Delta", value=item.delta, direction="watch" if item.delta.strip().startswith("-") else "healthy", note="Negatif degisimler dashboardda pulse ile vurgulanir."),
                ],
                diagnostics=[
                    InsightChangeItem(label="Kurumsal API", value="YOKSIS / OBS", direction="info", note="Canli veri geldiginde ayni insight karti korunur."),
                    InsightChangeItem(label="Dosya aktarimi", value="Excel/JSON", direction="info", note="Batch transform sonrasi ayni KPI modeli kullanilir."),
                ],
                alerts=[
                    AlertItem(
                        id=f"{prefix}-{item.code.lower()}",
                        level="medium" if item.delta.strip().startswith("-") else "low",
                        title=f"{item.label} degisim sinyali",
                        owner="Stratejik Izleme",
                        action="Negatif egilim varsa detay combo chart ile donemsel kirilimi inceleyin.",
                    )
                ],
            )

    finance_map = {
        f"finance-kpi-{_slug(kpi.label)}": InsightDetailResponse(
            insight_id=f"finance-kpi-{_slug(kpi.label)}",
            title=kpi.label,
            subtitle="Mali KPI degisim analizi",
            status=kpi.status.lower(),
            source_mode=center.source_mode,
            source_context=_source_context(center.source_mode),
            headline_value=kpi.value,
            headline_delta=kpi.delta,
            summary="Mali KPI detay ekraninda gelir-gider etkisi combo chart ile birlikte izlenir.",
            combo_trend=[
                InsightTrendPoint(label=label, bar_value=value, line_value=value * 0.98, delta_value=delta)
                for label, value, delta in [("2022", 44, 0), ("2023", 52, 8), ("2024", 61, 9), ("2025", 69, 8), ("2026", 74, 5)]
            ],
            change_breakdown=[
                InsightChangeItem(label="Metrik", value=kpi.value, direction=kpi.status.lower(), note=kpi.label),
                InsightChangeItem(label="Donem farki", value=kpi.delta, direction=kpi.status.lower(), note="Butce ve gelir degisimi birlikte izlenir."),
            ],
            diagnostics=[
                InsightChangeItem(label="Finans kaynagi", value="ERP / Excel / Warehouse", direction="info", note="Canli veya dosya bazli finans paketleri ayni veri modeline akar."),
            ],
            alerts=[],
        )
        for kpi in finance.kpis
    }

    insight_map = {}
    insight_map.update(metric_map)
    insight_map.update(alert_map)
    insight_map.update(source_map)
    insight_map.update(leader_map)
    insight_map.update(strip_map)
    insight_map.update(finance_map)

    if insight_id in insight_map:
        return insight_map[insight_id]

    return InsightDetailResponse(
        insight_id=insight_id,
        title="Degisim Detayi",
        subtitle="Genel dashboard insight kaydi",
        status="watch",
        source_mode=center.source_mode,
        source_context=_source_context(center.source_mode),
        headline_value="N/A",
        headline_delta="Izleniyor",
        summary="Bu kayit icin ozel detay semasi henuz tanimlanmadi; fakat endpoint mock, Excel/JSON ve YOKSIS kanallarini destekleyecek sekilde hazirdir.",
        combo_trend=[
            InsightTrendPoint(label=label, bar_value=value, line_value=value * 0.95, delta_value=delta)
            for label, value, delta in [("2022", 40, 0), ("2023", 47, 7), ("2024", 52, 5), ("2025", 58, 6), ("2026", 61, 3)]
        ],
        change_breakdown=[],
        diagnostics=[],
        alerts=[],
    )
