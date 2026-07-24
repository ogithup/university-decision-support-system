from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from functools import lru_cache
import random
from uuid import uuid4

from app.schemas.academic import (
    AcademicDetail,
    AcademicListItem,
    AcademicScore,
    AcademicWork,
    AlertItem,
    AssistantAnalyzeResponse,
    ChartDatum,
    DashboardKpi,
    DashboardSummaryResponse,
    FinanceKpi,
    FinanceSummaryResponse,
    LeaderboardItem,
    OrganizationPerformance,
    ProgramHealthItem,
    ReadinessScoreItem,
    RiskMatrixItem,
    ScenarioRunRequest,
    ScenarioRunResponse,
    ScenarioTemplateItem,
    ScoreDimensions,
    StrategicGoalItem,
    SourceHealth,
    WorkspaceResponse,
    WorkspaceWidget,
)


WORKSPACES: dict[str, WorkspaceResponse] = {}


def _risk_level(score: float, completeness: float) -> str:
    if completeness < 0.75 or score < 68:
        return "high"
    if completeness < 0.85 or score < 78:
        return "medium"
    return "low"


@lru_cache(maxsize=1)
def _dataset() -> dict:
    rng = random.Random(24)
    faculties = [
        {
            "faculty_id": "FAC-ENG",
            "faculty": "Muhendislik ve Mimarlik Fakultesi",
            "departments": [
                ("DEP-CENG", "Bilgisayar Muhendisligi"),
                ("DEP-IE", "Endustri Muhendisligi"),
                ("DEP-EEE", "Elektrik Elektronik Muhendisligi"),
            ],
        },
        {
            "faculty_id": "FAC-BUS",
            "faculty": "Iktisadi Idari ve Sosyal Bilimler Fakultesi",
            "departments": [
                ("DEP-BUS", "Isletme"),
                ("DEP-PSY", "Psikoloji"),
                ("DEP-POLS", "Siyaset Bilimi"),
            ],
        },
        {
            "faculty_id": "FAC-ART",
            "faculty": "Sanat ve Tasarim Fakultesi",
            "departments": [
                ("DEP-VCD", "Gorsel Iletisim Tasarimi"),
                ("DEP-ARCH", "Ic Mimarlik"),
            ],
        },
    ]

    titles = ["Prof. Dr.", "Doc. Dr.", "Dr. Ogr. Uyesi", "Ogr. Gor.", "Ars. Gor."]
    names = [
        "Aylin", "Kemal", "Deniz", "Ekin", "Mert", "Selin", "Baris", "Ipek", "Burak", "Seda",
        "Onur", "Elif", "Can", "Pelin", "Mina", "Gizem", "Tolga", "Asli", "Cem", "Derya",
    ]
    surnames = [
        "Yildirim", "Kara", "Aydin", "Demir", "Sahin", "Kilic", "Acar", "Arslan", "Tekin", "Polat",
        "Keskin", "Tuna", "Erdem", "Dogan", "Bulut", "Tas", "Akin", "Ozcan", "Gunes", "Yaman",
    ]
    expertise_pool = {
        "DEP-CENG": ["AI", "Data Systems", "Cybersecurity", "Software Engineering"],
        "DEP-IE": ["Optimization", "Operations Research", "Supply Chain"],
        "DEP-EEE": ["Signal Processing", "Embedded Systems", "Energy Systems"],
        "DEP-BUS": ["Finance", "Strategy", "Innovation"],
        "DEP-PSY": ["Behavioral Science", "Learning Analytics", "Wellbeing"],
        "DEP-POLS": ["Policy", "Public Governance", "International Relations"],
        "DEP-VCD": ["Visual Storytelling", "UX", "Brand Systems"],
        "DEP-ARCH": ["Spatial Design", "Sustainability", "Material Studies"],
    }

    academics: list[dict] = []
    works_by_academic: dict[str, list[dict]] = defaultdict(list)

    academic_index = 1
    for faculty in faculties:
        for department_id, department in faculty["departments"]:
            for _ in range(5):
                name = f"{rng.choice(names)} {rng.choice(surnames)}"
                academic_id = f"ACA-{academic_index:05d}"
                publication_count = rng.randint(8, 30)
                citation_count = publication_count * rng.randint(6, 18)
                project_count = rng.randint(1, 7)
                teaching_load = round(rng.uniform(8, 18), 1)
                advisory_count = rng.randint(2, 12)
                collaboration_rate = round(rng.uniform(0.32, 0.88), 2)
                completeness = round(rng.uniform(0.76, 0.98), 2)

                dimensions = {
                    "research_productivity": round(rng.uniform(66, 94), 1),
                    "scientific_impact": round(rng.uniform(64, 92), 1),
                    "projects_and_innovation": round(rng.uniform(58, 90), 1),
                    "education_contribution": round(rng.uniform(68, 93), 1),
                    "collaboration": round(rng.uniform(60, 88), 1),
                    "institutional_contribution": round(rng.uniform(62, 90), 1),
                    "continuity": round(rng.uniform(59, 91), 1),
                }
                overall_score = round(
                    dimensions["research_productivity"] * 0.25
                    + dimensions["scientific_impact"] * 0.20
                    + dimensions["projects_and_innovation"] * 0.15
                    + dimensions["education_contribution"] * 0.15
                    + dimensions["collaboration"] * 0.10
                    + dimensions["institutional_contribution"] * 0.10
                    + dimensions["continuity"] * 0.05,
                    1,
                )
                previous_score = round(overall_score - rng.uniform(-5, 6), 1)
                change = round(overall_score - previous_score, 1)
                risk_level = _risk_level(overall_score, completeness)

                academic = {
                    "academic_id": academic_id,
                    "name": name,
                    "title": rng.choice(titles),
                    "faculty_id": faculty["faculty_id"],
                    "faculty": faculty["faculty"],
                    "department_id": department_id,
                    "department": department,
                    "academic_year": "2025-2026",
                    "bio": f"{name} icin sentetik akademik profil. Karar destek demonstrasyonu amaclidir.",
                    "expertise": rng.sample(expertise_pool[department_id], k=min(3, len(expertise_pool[department_id]))),
                    "publication_count": publication_count,
                    "citation_count": citation_count,
                    "project_count": project_count,
                    "international_collaboration_rate": collaboration_rate,
                    "teaching_load": teaching_load,
                    "advisory_count": advisory_count,
                    "data_completeness": completeness,
                    "overall_score": overall_score,
                    "previous_score": previous_score,
                    "change": change,
                    "risk_level": risk_level,
                    "dimensions": dimensions,
                }
                academics.append(academic)

                work_types = ["Article", "Conference", "Book Chapter", "Project", "Patent"]
                for work_index in range(rng.randint(4, 7)):
                    work_type = rng.choice(work_types)
                    works_by_academic[academic_id].append(
                        {
                            "work_id": f"WRK-{academic_id}-{work_index + 1}",
                            "academic_id": academic_id,
                            "title": f"{department} {work_type} Ciktisi {work_index + 1}",
                            "work_type": work_type,
                            "year": 2021 + (work_index % 5),
                            "impact_score": round(rng.uniform(48, 96), 1),
                            "collaboration_scope": rng.choice(["local", "national", "international"]),
                        }
                    )

                academic_index += 1

    finance = {
        "academic_year": "2025-2026",
        "kpis": [
            {"label": "Toplam Gelir", "value": "148.2M TRY", "delta": "+8.2%", "status": "healthy"},
            {"label": "Toplam Gider", "value": "131.7M TRY", "delta": "+6.4%", "status": "healthy"},
            {"label": "Ar-Ge Payi", "value": "%19.4", "delta": "+2.1 puan", "status": "healthy"},
            {"label": "Personel Gider Orani", "value": "%52.8", "delta": "+1.3 puan", "status": "watch"},
        ],
        "revenue_mix": [
            {"label": "Ogrenim", "value": 54},
            {"label": "Proje", "value": 24},
            {"label": "Sertifika", "value": 12},
            {"label": "Sanayi", "value": 10},
        ],
        "expense_mix": [
            {"label": "Akademik Personel", "value": 53},
            {"label": "Idari Personel", "value": 14},
            {"label": "Ar-Ge", "value": 16},
            {"label": "Enerji", "value": 9},
            {"label": "Teknoloji", "value": 8},
        ],
        "budget_variance": [
            {"label": "MMF", "value": 6.3},
            {"label": "IIBF", "value": -2.4},
            {"label": "Sanat", "value": 1.1},
        ],
    }

    alerts = [
        {
            "id": "ALR-001",
            "level": "medium",
            "title": "Iki bolumde bilimsel etki skoru hedefin altinda.",
            "owner": "Arastirma Koordinatorlugu",
            "action": "Atif ve ortak yayin plana alinmali.",
        },
        {
            "id": "ALR-002",
            "level": "high",
            "title": "Personel gider orani limit e yaklasti.",
            "owner": "Mali Isler",
            "action": "Yeni kadro senaryosu butce ile birlikte incelenmeli.",
        },
        {
            "id": "ALR-003",
            "level": "low",
            "title": "Veri kalitesi panelinde 4 eksik publication source etiketi var.",
            "owner": "Veri Yoneticisi",
            "action": "Source provenance alanlari tamamlanmali.",
        },
    ]

    return {
        "faculties": faculties,
        "academics": academics,
        "works_by_academic": works_by_academic,
        "finance": finance,
        "alerts": alerts,
    }


def list_academics(faculty_id: str | None = None, department_id: str | None = None) -> list[AcademicListItem]:
    academics = _dataset()["academics"]
    filtered = [
        academic
        for academic in academics
        if (not faculty_id or academic["faculty_id"] == faculty_id)
        and (not department_id or academic["department_id"] == department_id)
    ]
    return [AcademicListItem(**{k: academic[k] for k in AcademicListItem.model_fields}) for academic in filtered]


def get_academic_detail(academic_id: str) -> AcademicDetail | None:
    academic = next((item for item in _dataset()["academics"] if item["academic_id"] == academic_id), None)
    if not academic:
        return None
    score = get_academic_score(academic_id)
    payload = {**academic, "score": score}
    return AcademicDetail(**payload)


def get_academic_works(academic_id: str) -> list[AcademicWork]:
    works = _dataset()["works_by_academic"].get(academic_id, [])
    return [AcademicWork(**work) for work in works]


def get_academic_score(academic_id: str) -> AcademicScore | None:
    academic = next((item for item in _dataset()["academics"] if item["academic_id"] == academic_id), None)
    if not academic:
        return None
    return AcademicScore(
        academic_id=academic["academic_id"],
        name=academic["name"],
        faculty=academic["faculty"],
        department=academic["department"],
        period=academic["academic_year"],
        overall_score=academic["overall_score"],
        previous_score=academic["previous_score"],
        change=academic["change"],
        dimensions=ScoreDimensions(**academic["dimensions"]),
        data_completeness=academic["data_completeness"],
        risk_level=academic["risk_level"],
        calculated_at="2026-07-24T10:30:00+03:00",
        disclaimer=(
            "Bu skor karar destegi amaclidir; tek basina personel degerlendirme karari olarak kullanilamaz."
        ),
    )


def _aggregate_by(key: str, entity_id: str) -> OrganizationPerformance | None:
    academics = [item for item in _dataset()["academics"] if item[f"{key}_id"] == entity_id]
    if not academics:
        return None
    entity_name = academics[0][key]
    trend = [
        ChartDatum(label="2022", value=round(sum(a["overall_score"] for a in academics) / len(academics) - 6, 1)),
        ChartDatum(label="2023", value=round(sum(a["overall_score"] for a in academics) / len(academics) - 3, 1)),
        ChartDatum(label="2024", value=round(sum(a["overall_score"] for a in academics) / len(academics) - 1.5, 1)),
        ChartDatum(label="2025", value=round(sum(a["overall_score"] for a in academics) / len(academics), 1)),
        ChartDatum(label="2026", value=round(sum(a["overall_score"] for a in academics) / len(academics) + 1.2, 1)),
    ]
    top_departments_counter = Counter(a["department"] for a in academics)
    risks = [AlertItem(**alert) for alert in _dataset()["alerts"][:2]]
    return OrganizationPerformance(
        entity_id=entity_id,
        entity_type=key,
        name=entity_name,
        academic_year="2025-2026",
        overall_score=round(sum(a["overall_score"] for a in academics) / len(academics), 1),
        publication_total=sum(a["publication_count"] for a in academics),
        citation_total=sum(a["citation_count"] for a in academics),
        project_total=sum(a["project_count"] for a in academics),
        average_score=round(sum(a["overall_score"] for a in academics) / len(academics), 1),
        staff_count=len(academics),
        trend=trend,
        top_departments=[ChartDatum(label=name, value=value) for name, value in top_departments_counter.most_common(4)],
        risks=risks,
    )


def get_department_performance(department_id: str) -> OrganizationPerformance | None:
    return _aggregate_by("department", department_id)


def get_faculty_performance(faculty_id: str) -> OrganizationPerformance | None:
    return _aggregate_by("faculty", faculty_id)


def get_dashboard_summary() -> DashboardSummaryResponse:
    academics = _dataset()["academics"]
    publication_total = sum(a["publication_count"] for a in academics)
    citation_total = sum(a["citation_count"] for a in academics)
    projects_total = sum(a["project_count"] for a in academics)
    avg_publication = round(publication_total / len(academics), 1)
    assistant_prompts = [
        "Muhendislik Fakultesinin son uc yillik akademik performansini incele.",
        "Personel sayisi %10 artarsa maliyet ve arastirma kapasitesi nasil degisir?",
        "Dusuk veri tamamlilik oranina sahip akademisyenleri listele.",
    ]
    faculty_groups: dict[str, list[dict]] = defaultdict(list)
    for academic in academics:
        faculty_groups[academic["faculty"]].append(academic)

    faculty_scores = [
        ChartDatum(
            label=faculty,
            value=round(sum(item["overall_score"] for item in items) / len(items), 1),
        )
        for faculty, items in faculty_groups.items()
    ]

    work_distribution_counter = Counter(
        work["work_type"]
        for academic_id in _dataset()["works_by_academic"]
        for work in _dataset()["works_by_academic"][academic_id]
    )

    student_metrics = [
        DashboardKpi(code="STU_TOTAL", label="Toplam Ogrenci", value="12,480", delta="+4.2%", status="healthy"),
        DashboardKpi(code="STU_ACTIVE", label="Aktif Ogrenci", value="11,920", delta="+3.6%", status="healthy"),
        DashboardKpi(code="STU_GRAD", label="Mezuniyet Orani", value="%78", delta="+2 puan", status="healthy"),
        DashboardKpi(code="STU_LOSS", label="Kayit Kaybi", value="%6.1", delta="-0.8 puan", status="watch"),
    ]
    finance_metrics = [
        DashboardKpi(code="FIN_BAL", label="Gelir Gider Dengesi", value="+16.5M TRY", delta="+8.2%", status="healthy"),
        DashboardKpi(code="FIN_COST_STU", label="Ogrenci Basi Maliyet", value="10.6K TRY", delta="+4.1%", status="watch"),
        DashboardKpi(code="FIN_SCH", label="Burs Orani", value="%18.4", delta="+1.1 puan", status="watch"),
        DashboardKpi(code="FIN_RND", label="Arastirma Gelir Payi", value="%19.4", delta="+2.1 puan", status="healthy"),
    ]
    capacity_metrics = [
        DashboardKpi(code="CAP_CLASS", label="Derslik Doluluk", value="%83", delta="+5 puan", status="healthy"),
        DashboardKpi(code="CAP_LAB", label="Lab Kullanim", value="%76", delta="+4 puan", status="healthy"),
        DashboardKpi(code="CAP_SPACE", label="Kisi Basi Alan", value="14.2 m2", delta="-0.6", status="watch"),
        DashboardKpi(code="CAP_FUTURE", label="Ek Kapasite Ihtiyaci", value="3 lab", delta="2027 plan", status="watch"),
    ]
    program_health = [
        ProgramHealthItem(
            program_code="CENG",
            program_name="Bilgisayar Muhendisligi",
            sustainability_status="grow",
            demand_index=92,
            occupancy_rate=98,
            graduation_rate=81,
            employment_outlook=95,
            financial_balance=84,
            strategic_alignment=96,
            action_label="Buyutulebilir",
        ),
        ProgramHealthItem(
            program_code="IE",
            program_name="Endustri Muhendisligi",
            sustainability_status="strengthen",
            demand_index=78,
            occupancy_rate=88,
            graduation_rate=76,
            employment_outlook=82,
            financial_balance=74,
            strategic_alignment=83,
            action_label="Guclendirilmeli",
        ),
        ProgramHealthItem(
            program_code="VCD",
            program_name="Gorsel Iletisim Tasarimi",
            sustainability_status="restructure",
            demand_index=61,
            occupancy_rate=67,
            graduation_rate=72,
            employment_outlook=64,
            financial_balance=58,
            strategic_alignment=69,
            action_label="Yeniden yapilandirilmali",
        ),
        ProgramHealthItem(
            program_code="POLS",
            program_name="Siyaset Bilimi",
            sustainability_status="support",
            demand_index=58,
            occupancy_rate=63,
            graduation_rate=74,
            employment_outlook=60,
            financial_balance=55,
            strategic_alignment=80,
            action_label="Stratejik desteklenmeli",
        ),
    ]
    strategic_goals = [
        StrategicGoalItem(
            code="SG-01",
            title="Arastirma kalitesini artirma",
            current_value="%84",
            target_value="%90",
            progress_pct=84,
            risk_level="watch",
            owner="Arastirma Koordinatorlugu",
        ),
        StrategicGoalItem(
            code="SG-02",
            title="Uluslararasilasma hedefi",
            current_value="%61",
            target_value="%70",
            progress_pct=87,
            risk_level="watch",
            owner="Uluslararasi Ofis",
        ),
        StrategicGoalItem(
            code="SG-03",
            title="Mali surdurulebilirlik",
            current_value="%91",
            target_value="%92",
            progress_pct=99,
            risk_level="healthy",
            owner="Mali Isler",
        ),
    ]
    readiness_details = [
        ReadinessScoreItem(
            framework="THE",
            score=65,
            data_readiness_pct=71,
            benchmark_gap=9,
            note="Arastirma kalitesi ve doktora ciktisi veri tamamliligi artmali.",
        ),
        ReadinessScoreItem(
            framework="QS",
            score=52,
            data_readiness_pct=58,
            benchmark_gap=15,
            note="Isveren itibari ve mezun istihdam akisi zayif.",
        ),
        ReadinessScoreItem(
            framework="YOK",
            score=64,
            data_readiness_pct=74,
            benchmark_gap=8,
            note="Toplumsal katki ve surdurulebilirlik indikatorleri tamamlanmali.",
        ),
    ]
    scenario_templates = [
        ScenarioTemplateItem(
            scenario_type="student_growth",
            title="Ogrenci Sayisi Senaryosu",
            description="Ogrenci artis veya azalisinin gelir, kapasite ve personel etkisi.",
            key_driver="Ogrenci sayisi degisimi",
            expected_focus="Gelir, kapasite, akademik personel ihtiyaci",
        ),
        ScenarioTemplateItem(
            scenario_type="tuition_scholarship",
            title="Ucret ve Burs Senaryosu",
            description="Ucret ve burs politikasinin talep ve butceye etkisi.",
            key_driver="Burs ve ucret oranlari",
            expected_focus="Gelir dengesi ve doluluk",
        ),
        ScenarioTemplateItem(
            scenario_type="new_program",
            title="Yeni Program Acma",
            description="Yeni programin basi basa, personel ve fiziki alan etkisi.",
            key_driver="Yatirim ve kontenjan",
            expected_focus="Break-even, lab ve derslik yeterliligi",
        ),
        ScenarioTemplateItem(
            scenario_type="economic_risk",
            title="Ekonomik Risk Senaryosu",
            description="Enflasyon ve doviz kurunun gider yapisina etkisi.",
            key_driver="Enflasyon ve kur",
            expected_focus="Enerji, teknoloji ve laboratuvar maliyeti",
        ),
    ]
    risk_matrix = [
        RiskMatrixItem(
            risk_id="RSK-001",
            category="Ogrenci Talebi",
            title="Uc programda doluluk kritik esigin altinda",
            probability=0.78,
            impact=0.82,
            owner="Ogrenci Isleri",
            mitigation="Kontenjan ve tanitim stratejisi gozden gecirilmeli.",
        ),
        RiskMatrixItem(
            risk_id="RSK-002",
            category="Mali",
            title="Personel gider orani hedef bandin ustune cikiyor",
            probability=0.69,
            impact=0.88,
            owner="Mali Isler",
            mitigation="Yeni kadro kararlarini proje gelir planina bagla.",
        ),
        RiskMatrixItem(
            risk_id="RSK-003",
            category="Kapasite",
            title="Iki laboratuvarda 2027 donemi icin kapasite yetersizligi",
            probability=0.63,
            impact=0.76,
            owner="Yapi Isleri",
            mitigation="Vardiya ve yeni lab yatirim senaryosu hazirla.",
        ),
    ]

    return DashboardSummaryResponse(
        academic_year="2025-2026",
        selected_faculty="Tum Fakulteler",
        selected_department="Tum Bolumler",
        last_sync=(datetime(2026, 7, 24, 10, 45)).isoformat() + "+03:00",
        critical_alert_count=2,
        kpis=[
            DashboardKpi(code="STAFF_TOTAL", label="Toplam Akademik Personel", value=str(len(academics)), delta="+3 kadro", status="healthy"),
            DashboardKpi(code="PUB_TOTAL", label="Toplam Yayin", value=str(publication_total), delta="+12.4%", status="healthy"),
            DashboardKpi(code="CIT_TOTAL", label="Toplam Atif", value=str(citation_total), delta="+9.8%", status="healthy"),
            DashboardKpi(code="PUB_PER_ACAD", label="Akademisyen Basi Yayin", value=str(avg_publication), delta="+1.6", status="healthy"),
            DashboardKpi(code="COLLAB_INT", label="Uluslararasi Is Birligi", value="%61", delta="+4 puan", status="watch"),
            DashboardKpi(code="PROJ_ACTIVE", label="Aktif Proje", value=str(projects_total), delta="+5 proje", status="healthy"),
            DashboardKpi(code="TARGET_RATE", label="Hedef Gerceklesme", value="%84", delta="+6 puan", status="healthy"),
            DashboardKpi(code="KPI_RISK", label="Risk Altindaki KPI", value="4", delta="-1", status="watch"),
        ],
        student_metrics=student_metrics,
        finance_metrics=finance_metrics,
        capacity_metrics=capacity_metrics,
        publication_trend=[
            ChartDatum(label="2022", value=138),
            ChartDatum(label="2023", value=161),
            ChartDatum(label="2024", value=178),
            ChartDatum(label="2025", value=201),
            ChartDatum(label="2026", value=219),
        ],
        student_trend=[
            ChartDatum(label="2022", value=11480),
            ChartDatum(label="2023", value=11820),
            ChartDatum(label="2024", value=12090),
            ChartDatum(label="2025", value=12310),
            ChartDatum(label="2026", value=12480),
        ],
        occupancy_trend=[
            ChartDatum(label="2022", value=87),
            ChartDatum(label="2023", value=89),
            ChartDatum(label="2024", value=90),
            ChartDatum(label="2025", value=92),
            ChartDatum(label="2026", value=91),
        ],
        graduation_trend=[
            ChartDatum(label="2022", value=69),
            ChartDatum(label="2023", value=72),
            ChartDatum(label="2024", value=74),
            ChartDatum(label="2025", value=76),
            ChartDatum(label="2026", value=78),
        ],
        faculty_scores=faculty_scores,
        readiness_scores=[
            ChartDatum(label="THE", value=65),
            ChartDatum(label="QS", value=52),
            ChartDatum(label="YOK", value=64),
        ],
        capacity_utilization=[
            ChartDatum(label="Derslik", value=83),
            ChartDatum(label="Laboratuvar", value=76),
            ChartDatum(label="Kutuphane", value=68),
            ChartDatum(label="Ortak Alan", value=72),
        ],
        benchmark_comparison=[
            ChartDatum(label="Universite", value=78),
            ChartDatum(label="Turkiye Ortalama", value=71),
            ChartDatum(label="Benzer Univ.", value=74),
            ChartDatum(label="Hedef Rakip", value=82),
        ],
        work_distribution=[
            ChartDatum(label=label, value=value) for label, value in work_distribution_counter.most_common(5)
        ],
        top_performers=[
            LeaderboardItem(
                academic_id=item["academic_id"],
                name=item["name"],
                title=item["title"],
                department=item["department"],
                score=item["overall_score"],
                change=item["change"],
            )
            for item in sorted(academics, key=lambda row: row["overall_score"], reverse=True)[:6]
        ],
        source_health=[
            SourceHealth(source="Mock Academic Connector", status="healthy", freshness="2 dk", detail="Personel ve yayin verisi senkron."),
            SourceHealth(source="Mock Finance Connector", status="watch", freshness="15 dk", detail="Butce snapshot gecikmeli."),
            SourceHealth(source="YOK Mock Gateway", status="healthy", freshness="1 dk", detail="Mock servis yanit veriyor."),
        ],
        program_health=program_health,
        strategic_goals=strategic_goals,
        readiness_details=readiness_details,
        scenario_templates=scenario_templates,
        risk_matrix=risk_matrix,
        alerts=[AlertItem(**alert) for alert in _dataset()["alerts"]],
        assistant_prompts=assistant_prompts,
    )


def get_finance_summary() -> FinanceSummaryResponse:
    finance = _dataset()["finance"]
    return FinanceSummaryResponse(
        academic_year=finance["academic_year"],
        kpis=[FinanceKpi(**kpi) for kpi in finance["kpis"]],
        revenue_mix=[ChartDatum(**item) for item in finance["revenue_mix"]],
        expense_mix=[ChartDatum(**item) for item in finance["expense_mix"]],
        budget_variance=[ChartDatum(**item) for item in finance["budget_variance"]],
    )


def get_alerts() -> list[AlertItem]:
    return [AlertItem(**alert) for alert in _dataset()["alerts"]]


def run_scenario(request: ScenarioRunRequest) -> ScenarioRunResponse:
    baseline = get_dashboard_summary().kpis[:4]
    projected = []
    for kpi in baseline:
        projected_value = kpi.value
        if kpi.code == "STAFF_TOTAL":
            projected_value = str(int(kpi.value) + round(int(kpi.value) * request.staff_growth_pct / 100))
        elif kpi.code == "PUB_TOTAL":
            projected_value = str(int(kpi.value) + round(request.staff_growth_pct * 1.8))
        elif kpi.code == "CIT_TOTAL":
            projected_value = str(int(kpi.value) + round(request.staff_growth_pct * 9))
        projected.append(DashboardKpi(code=kpi.code, label=kpi.label, value=projected_value, delta=kpi.delta, status=kpi.status))

    risks = [
        AlertItem(
            id="SCN-001",
            level="medium",
            title="Personel artisi ile birlikte personel gider orani yukselebilir.",
            owner="Senaryo Merkezi",
            action="Mali denge ve proje geliri birlikte izlenmeli.",
        )
    ]
    return ScenarioRunResponse(
        scenario_id=f"SCN-{uuid4().hex[:8]}",
        title="Akademik Personel Artis Senaryosu",
        summary="Sentetik mock hesaplama ile personel artisinin etki analizi uretildi.",
        baseline=baseline,
        projected=projected,
        risks=risks,
    )


def analyze_prompt(prompt: str, academic_year: str, faculty_id: str | None, department_id: str | None) -> AssistantAnalyzeResponse:
    workspace_id = f"WS-{uuid4().hex[:8]}"
    title = "Muhendislik Fakultesi Personel ve Butce Analizi"
    schema = {
        "title": title,
        "filters": ["academic_year", "faculty", "department"],
        "widgets": [
            {"type": "kpi_card", "metric": "overall_score"},
            {"type": "line_chart", "metric": "publication_trend"},
            {"type": "waterfall_chart", "metric": "budget_impact"},
            {"type": "risk_table", "metric": "risk_items"},
        ],
    }
    workspace = WorkspaceResponse(
        workspace_id=workspace_id,
        title=title,
        summary=f"'{prompt}' sorusu icin aciklanabilir stratejik analiz alani olusturuldu.",
        academic_year=academic_year,
        filters={"faculty_id": faculty_id, "department_id": department_id},
        assumptions=[
            "Personel artisi yayin uretkenligini dogrusal etkiler varsayildi.",
            "Butce degisimi mali risk panosuna etki eder.",
            "Eksik veri durumlari karar destegi uyarisi olarak korunur.",
        ],
        widgets=[
            WorkspaceWidget(type="kpi_card", title="Personel Maliyeti", metric="personnel_cost_change", description="Senaryo sonrasi personel maliyet etkisi"),
            WorkspaceWidget(type="line_chart", title="Arastirma Uretimi", metric="research_output_projection", description="Uc yillik output projeksiyonu"),
            WorkspaceWidget(type="waterfall_chart", title="Butce Etkisi", metric="budget_impact", description="Gelir gider etkisi"),
            WorkspaceWidget(type="risk_table", title="Riskler", metric="scenario_risks", description="Senaryo kaynakli riskler"),
        ],
        narrative=[
            "Analiz akademik performans, personel artisi ve mali etkiyi birlikte ele alir.",
            "Veri kaynagi mock connector uzerinden saglandigi icin sonuc sentetiktir.",
        ],
        risks=get_alerts()[:2],
    )
    WORKSPACES[workspace_id] = workspace
    return AssistantAnalyzeResponse(
        workspace_id=workspace_id,
        title=title,
        summary=workspace.summary,
        confidence="medium",
        workspace_schema=schema,
    )


def get_workspace(workspace_id: str) -> WorkspaceResponse | None:
    return WORKSPACES.get(workspace_id)
