from app.schemas.dashboard import ChartSeriesPoint, DashboardCard, DashboardChart, ExecutiveDashboardResponse


def get_executive_dashboard() -> ExecutiveDashboardResponse:
    cards = [
        DashboardCard(
            id="students",
            title="Toplam Ogrenci",
            value="12,480",
            subtitle="+4.2% yillik degisim",
            risk_level="low",
        ),
        DashboardCard(
            id="occupancy",
            title="Program Doluluk",
            value="%91.4",
            subtitle="-1.1 puan gecen yila gore",
            risk_level="medium",
        ),
        DashboardCard(
            id="finance",
            title="Gelir-Gider Dengesi",
            value="+18.4M TRY",
            subtitle="Aylik gerceklesme pozitif",
            risk_level="low",
        ),
        DashboardCard(
            id="yok",
            title="YOK Hazirlik",
            value="%64",
            subtitle="Eksik indikator odagi gerekli",
            risk_level="medium",
        ),
    ]

    charts = [
        DashboardChart(
            id="student-trend",
            title="Ogrenci Trend",
            chart_type="line",
            series=[
                ChartSeriesPoint(label="2022", value=11210),
                ChartSeriesPoint(label="2023", value=11600),
                ChartSeriesPoint(label="2024", value=11940),
                ChartSeriesPoint(label="2025", value=12310),
                ChartSeriesPoint(label="2026", value=12480),
            ],
        ),
        DashboardChart(
            id="readiness",
            title="Dis Cerceve Hazirlik",
            chart_type="bar",
            series=[
                ChartSeriesPoint(label="YOK", value=64),
                ChartSeriesPoint(label="THE", value=65),
                ChartSeriesPoint(label="QS", value=52),
            ],
        ),
    ]

    alerts = [
        "3 programda doluluk kritik esigin altinda.",
        "2 fakultede butce gerceklesme plandan sapti.",
        "YOK indikator setinde 11 veri alani manuel dogrulama bekliyor.",
    ]

    return ExecutiveDashboardResponse(cards=cards, charts=charts, alerts=alerts)
