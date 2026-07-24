insert into dim_kpi (
    kpi_code,
    kpi_name,
    category,
    unit_of_measure,
    owner_module,
    formula_text,
    refresh_frequency,
    risk_threshold_low,
    risk_threshold_high
) values
    ('STU_TOTAL', 'Toplam Ogrenci Sayisi', 'education', 'student', 'student_analytics', 'active_students_count', 'daily', null, null),
    ('PRG_OCC_RATE', 'Program Doluluk Orani', 'education', 'percent', 'student_analytics', 'enrolled_count / quota * 100', 'daily', 70, 90),
    ('GRAD_RATE', 'Mezuniyet Orani', 'education', 'percent', 'student_analytics', 'graduated_students / cohort_size * 100', 'term', 50, 80),
    ('REV_EXP_BAL', 'Gelir Gider Dengesi', 'finance', 'TRY', 'finance_analytics', 'total_revenue - total_expense', 'monthly', null, null),
    ('COST_PER_STU', 'Ogrenci Basi Maliyet', 'finance', 'TRY', 'finance_analytics', 'total_expense / active_students_count', 'monthly', null, null),
    ('CITATION_TOTAL', 'Toplam Atif', 'research', 'count', 'personnel_analytics', 'sum(citation_count)', 'monthly', null, null),
    ('SPACE_UTIL', 'Fiziksel Kapasite Kullanim Orani', 'infrastructure', 'percent', 'space_analytics', 'used_hours / planned_hours * 100', 'daily', 40, 85),
    ('YOK_READY', 'YOK Veri Hazirlik Skoru', 'external_frameworks', 'percent', 'external_readiness', 'completed_indicators / total_indicators * 100', 'weekly', 50, 75)
on conflict (kpi_code) do nothing;

