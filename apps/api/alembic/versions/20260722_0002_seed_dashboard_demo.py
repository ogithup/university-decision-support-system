"""Seed initial dashboard demo data.

Revision ID: 20260722_0002
Revises: 20260722_0001
Create Date: 2026-07-22 15:20:00
"""

from alembic import op


revision = "20260722_0002"
down_revision = "20260722_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        insert into dim_time (date_key, full_date, year, quarter, month, month_name, week, day, academic_year, semester)
        values
            (20220901, '2022-09-01', 2022, 3, 9, 'September', 35, 1, '2022-2023', 'fall'),
            (20230901, '2023-09-01', 2023, 3, 9, 'September', 35, 1, '2023-2024', 'fall'),
            (20240901, '2024-09-01', 2024, 3, 9, 'September', 35, 1, '2024-2025', 'fall'),
            (20250901, '2025-09-01', 2025, 3, 9, 'September', 35, 1, '2025-2026', 'fall'),
            (20260701, '2026-07-01', 2026, 3, 7, 'July', 27, 1, '2025-2026', 'spring')
        on conflict (date_key) do nothing;
        """
    )
    op.execute(
        """
        insert into dim_unit (unit_code, unit_name, unit_type, is_academic)
        values ('MMF', 'Muhendislik ve Mimarlik Fakultesi', 'faculty', true)
        on conflict (unit_code) do nothing;
        """
    )
    op.execute(
        """
        insert into dim_program (program_code, program_name, unit_id, degree_level, language_code, education_type)
        select 'CENG', 'Bilgisayar Muhendisligi', u.id, 'bachelor', 'TR', 'day'
        from dim_unit u
        where u.unit_code = 'MMF'
        on conflict (program_code) do nothing;
        """
    )
    op.execute(
        """
        insert into dim_external_framework (framework_code, framework_name, methodology_year)
        values
            ('YOK', 'YOK University Monitoring', 2026),
            ('THE', 'Times Higher Education', 2026),
            ('QS', 'QS World University Rankings', 2026)
        on conflict (framework_code) do nothing;
        """
    )
    op.execute(
        """
        insert into dim_external_indicator (framework_id, indicator_code, indicator_name, category, weight)
        select f.id, concat(f.framework_code, '_READY'), concat(f.framework_name, ' readiness'), 'readiness', 1
        from dim_external_framework f
        where not exists (
            select 1 from dim_external_indicator i
            where i.framework_id = f.id and i.indicator_code = concat(f.framework_code, '_READY')
        );
        """
    )
    op.execute(
        """
        insert into dim_student (student_no, gender, nationality_code, scholarship_type, scholarship_rate, entry_year, current_status)
        values
            ('2022001', 'F', 'TR', 'none', 0, 2022, 'active'),
            ('2022002', 'M', 'TR', 'full', 100, 2022, 'active'),
            ('2023001', 'F', 'TR', 'partial', 50, 2023, 'active'),
            ('2024001', 'M', 'INT', 'none', 0, 2024, 'active'),
            ('2025001', 'F', 'TR', 'none', 0, 2025, 'active'),
            ('2026001', 'M', 'INT', 'partial', 25, 2026, 'active')
        on conflict (student_no) do nothing;
        """
    )
    op.execute(
        """
        insert into fact_student_enrollment (date_key, unit_id, program_id, student_id, enrollment_status, is_new_registration, is_graduated, is_dropout)
        select t.date_key, u.id, p.id, s.id, 'active',
               case when s.entry_year = t.year then true else false end,
               false,
               false
        from dim_time t
        cross join dim_unit u
        cross join dim_program p
        join dim_student s on s.entry_year <= t.year
        where u.unit_code = 'MMF'
          and p.program_code = 'CENG'
          and t.date_key in (20220901, 20230901, 20240901, 20250901, 20260701)
          and not exists (
              select 1 from fact_student_enrollment e
              where e.date_key = t.date_key and e.program_id = p.id and e.student_id = s.id
          );
        """
    )
    op.execute(
        """
        insert into fact_external_indicator_snapshot (
            date_key, framework_id, indicator_id, unit_id, actual_value,
            benchmark_turkiye, benchmark_peer, readiness_score, completeness_rate, status
        )
        select
            20260701,
            f.id,
            i.id,
            u.id,
            case f.framework_code when 'YOK' then 64 when 'THE' then 65 else 52 end,
            60,
            68,
            case f.framework_code when 'YOK' then 64 when 'THE' then 65 else 52 end,
            case f.framework_code when 'YOK' then 0.64 when 'THE' then 0.65 else 0.52 end,
            'partial'
        from dim_external_framework f
        join dim_external_indicator i on i.framework_id = f.id and i.indicator_code = concat(f.framework_code, '_READY')
        join dim_unit u on u.unit_code = 'MMF'
        where not exists (
            select 1 from fact_external_indicator_snapshot s
            where s.date_key = 20260701 and s.framework_id = f.id and s.indicator_id = i.id
        );
        """
    )
    op.execute(
        """
        insert into fact_kpi_snapshot (
            date_key, kpi_id, unit_id, program_id, actual_value, target_value,
            previous_year_value, university_average, yoy_change, achievement_rate, risk_level
        )
        select
            20260701,
            k.id,
            u.id,
            p.id,
            case k.kpi_code
                when 'STU_TOTAL' then 6
                when 'PRG_OCC_RATE' then 91.4
                when 'GRAD_RATE' then 78.0
                when 'REV_EXP_BAL' then 18400000
                when 'COST_PER_STU' then 95400
                when 'CITATION_TOTAL' then 1280
                when 'SPACE_UTIL' then 72.5
                when 'YOK_READY' then 64
            end,
            case k.kpi_code
                when 'STU_TOTAL' then 8
                when 'PRG_OCC_RATE' then 95
                when 'GRAD_RATE' then 82
                when 'REV_EXP_BAL' then 15000000
                when 'COST_PER_STU' then 90000
                when 'CITATION_TOTAL' then 1400
                when 'SPACE_UTIL' then 80
                when 'YOK_READY' then 75
            end,
            case k.kpi_code
                when 'STU_TOTAL' then 5
                when 'PRG_OCC_RATE' then 92.5
                when 'GRAD_RATE' then 76
                when 'REV_EXP_BAL' then 17200000
                when 'COST_PER_STU' then 93200
                when 'CITATION_TOTAL' then 1180
                when 'SPACE_UTIL' then 69
                when 'YOK_READY' then 57
            end,
            case k.kpi_code
                when 'STU_TOTAL' then 6
                when 'PRG_OCC_RATE' then 88
                when 'GRAD_RATE' then 73
                when 'REV_EXP_BAL' then 16100000
                when 'COST_PER_STU' then 97800
                when 'CITATION_TOTAL' then 1100
                when 'SPACE_UTIL' then 70
                when 'YOK_READY' then 60
            end,
            case k.kpi_code
                when 'STU_TOTAL' then 20
                when 'PRG_OCC_RATE' then -1.1
                when 'GRAD_RATE' then 2
                when 'REV_EXP_BAL' then 6.8
                when 'COST_PER_STU' then 2.4
                when 'CITATION_TOTAL' then 8.5
                when 'SPACE_UTIL' then 3.5
                when 'YOK_READY' then 7
            end,
            case k.kpi_code
                when 'STU_TOTAL' then 75
                when 'PRG_OCC_RATE' then 96
                when 'GRAD_RATE' then 95
                when 'REV_EXP_BAL' then 123
                when 'COST_PER_STU' then 94
                when 'CITATION_TOTAL' then 91
                when 'SPACE_UTIL' then 91
                when 'YOK_READY' then 85
            end,
            case k.kpi_code
                when 'PRG_OCC_RATE' then 'medium'
                when 'YOK_READY' then 'medium'
                else 'low'
            end
        from dim_kpi k
        join dim_unit u on u.unit_code = 'MMF'
        join dim_program p on p.program_code = 'CENG'
        where not exists (
            select 1 from fact_kpi_snapshot s
            where s.date_key = 20260701 and s.kpi_id = k.id and s.program_id = p.id
        );
        """
    )
    op.execute(
        """
        insert into risk_rule (rule_code, rule_name, entity_scope, condition_expression, severity, recommended_action)
        values
            ('LOW_OCCUPANCY', 'Program doluluk kritik esik alti', 'program', 'PRG_OCC_RATE < 85', 'medium', 'Kontenjan ve tanitim stratejisini gozden gecir'),
            ('YOK_GAP', 'YOK readiness eksik', 'university', 'YOK_READY < 70', 'medium', 'Eksik veri alanlarini tamamla')
        on conflict (rule_code) do nothing;
        """
    )
    op.execute(
        """
        insert into risk_alert (rule_id, unit_id, program_id, alert_title, alert_description, severity, status)
        select r.id, u.id, p.id, '3 programda doluluk kritik esigin altinda.', 'Kontenjan ve talep analizi gerekli.', 'medium', 'open'
        from risk_rule r
        join dim_unit u on u.unit_code = 'MMF'
        join dim_program p on p.program_code = 'CENG'
        where r.rule_code = 'LOW_OCCUPANCY'
          and not exists (
              select 1 from risk_alert a where a.alert_title = '3 programda doluluk kritik esigin altinda.'
          );
        """
    )
    op.execute(
        """
        insert into risk_alert (rule_id, unit_id, program_id, alert_title, alert_description, severity, status)
        select r.id, u.id, p.id, 'YOK indikator setinde 11 veri alani manuel dogrulama bekliyor.', 'Dis cerceve readiness eksigi mevcut.', 'medium', 'open'
        from risk_rule r
        join dim_unit u on u.unit_code = 'MMF'
        join dim_program p on p.program_code = 'CENG'
        where r.rule_code = 'YOK_GAP'
          and not exists (
              select 1 from risk_alert a where a.alert_title = 'YOK indikator setinde 11 veri alani manuel dogrulama bekliyor.'
          );
        """
    )


def downgrade() -> None:
    op.execute("delete from risk_alert where alert_title in ('3 programda doluluk kritik esigin altinda.', 'YOK indikator setinde 11 veri alani manuel dogrulama bekliyor.');")
    op.execute("delete from risk_rule where rule_code in ('LOW_OCCUPANCY', 'YOK_GAP');")
    op.execute("delete from fact_kpi_snapshot where date_key = 20260701;")
    op.execute("delete from fact_external_indicator_snapshot where date_key = 20260701;")
    op.execute("delete from fact_student_enrollment where date_key in (20220901, 20230901, 20240901, 20250901, 20260701);")
    op.execute("delete from dim_student where student_no in ('2022001', '2022002', '2023001', '2024001', '2025001', '2026001');")
    op.execute("delete from dim_external_indicator where indicator_code in ('YOK_READY', 'THE_READY', 'QS_READY');")
    op.execute("delete from dim_external_framework where framework_code in ('YOK', 'THE', 'QS');")
    op.execute("delete from dim_program where program_code = 'CENG';")
    op.execute("delete from dim_unit where unit_code = 'MMF';")
    op.execute("delete from dim_time where date_key in (20220901, 20230901, 20240901, 20250901, 20260701);")

