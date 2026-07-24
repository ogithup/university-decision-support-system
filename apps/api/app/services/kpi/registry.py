from app.schemas.kpi import KpiSummaryCard


KPI_CATALOG = [
    {
        "code": "STU_TOTAL",
        "name": "Toplam Ogrenci Sayisi",
        "category": "education",
        "unit_of_measure": "student",
        "owner_module": "student_analytics",
        "formula": "active_students_count",
        "frequency": "daily",
    },
    {
        "code": "PRG_OCC_RATE",
        "name": "Program Doluluk Orani",
        "category": "education",
        "unit_of_measure": "percent",
        "owner_module": "student_analytics",
        "formula": "enrolled_count / quota * 100",
        "frequency": "daily",
    },
    {
        "code": "GRAD_RATE",
        "name": "Mezuniyet Orani",
        "category": "education",
        "unit_of_measure": "percent",
        "owner_module": "student_analytics",
        "formula": "graduated_students / cohort_size * 100",
        "frequency": "term",
    },
    {
        "code": "REV_EXP_BAL",
        "name": "Gelir Gider Dengesi",
        "category": "finance",
        "unit_of_measure": "TRY",
        "owner_module": "finance_analytics",
        "formula": "total_revenue - total_expense",
        "frequency": "monthly",
    },
    {
        "code": "COST_PER_STU",
        "name": "Ogrenci Basi Maliyet",
        "category": "finance",
        "unit_of_measure": "TRY",
        "owner_module": "finance_analytics",
        "formula": "total_expense / active_students_count",
        "frequency": "monthly",
    },
    {
        "code": "CITATION_TOTAL",
        "name": "Toplam Atif",
        "category": "research",
        "unit_of_measure": "count",
        "owner_module": "personnel_analytics",
        "formula": "sum(citation_count)",
        "frequency": "monthly",
    },
    {
        "code": "SPACE_UTIL",
        "name": "Fiziksel Kapasite Kullanim Orani",
        "category": "infrastructure",
        "unit_of_measure": "percent",
        "owner_module": "space_analytics",
        "formula": "used_hours / planned_hours * 100",
        "frequency": "daily",
    },
    {
        "code": "YOK_READY",
        "name": "YOK Veri Hazirlik Skoru",
        "category": "external_frameworks",
        "unit_of_measure": "percent",
        "owner_module": "external_readiness",
        "formula": "completed_indicators / total_indicators * 100",
        "frequency": "weekly",
    },
]


def build_kpi_summary_cards() -> list[KpiSummaryCard]:
    return [
        KpiSummaryCard(
            code="STU_TOTAL",
            title="Toplam Ogrenci",
            value="12,480",
            change_label="+4.2% yillik",
            trend="up",
            risk_level="low",
        ),
        KpiSummaryCard(
            code="PRG_OCC_RATE",
            title="Doluluk",
            value="%91.4",
            change_label="-1.1 puan",
            trend="down",
            risk_level="medium",
        ),
        KpiSummaryCard(
            code="REV_EXP_BAL",
            title="Gelir-Gider",
            value="+18.4M TRY",
            change_label="+6.8% aylik",
            trend="up",
            risk_level="low",
        ),
        KpiSummaryCard(
            code="YOK_READY",
            title="YOK Ready",
            value="%64",
            change_label="+7 puan",
            trend="up",
            risk_level="medium",
        ),
    ]

