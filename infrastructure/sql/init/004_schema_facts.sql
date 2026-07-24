create table if not exists fact_student_enrollment (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    unit_id uuid not null references dim_unit(id),
    program_id uuid not null references dim_program(id),
    student_id uuid not null references dim_student(id),
    enrollment_status varchar(30) not null,
    is_new_registration boolean default false,
    is_graduated boolean default false,
    is_dropout boolean default false,
    graduation_duration_term integer
);

create table if not exists fact_program_quota (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    program_id uuid not null references dim_program(id),
    quota integer not null,
    placed_count integer default 0,
    enrolled_count integer default 0,
    occupancy_rate numeric(8,4),
    base_score numeric(10,2),
    success_rank integer
);

create table if not exists fact_course_load (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    course_id uuid not null references dim_course(id),
    personnel_id uuid references dim_personnel(id),
    program_id uuid references dim_program(id),
    student_count integer not null,
    weekly_hours numeric(8,2) not null,
    section_count integer default 1
);

create table if not exists fact_personnel_performance (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    personnel_id uuid not null references dim_personnel(id),
    unit_id uuid not null references dim_unit(id),
    publication_count integer default 0,
    citation_count integer default 0,
    project_count integer default 0,
    patent_count integer default 0,
    thesis_supervision_count integer default 0,
    teaching_load_hours numeric(10,2) default 0,
    performance_score numeric(12,4)
);

create table if not exists fact_space_utilization (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    space_id uuid not null references dim_space(id),
    planned_hours numeric(10,2) default 0,
    used_hours numeric(10,2) default 0,
    utilization_rate numeric(8,4),
    assigned_unit_id uuid references dim_unit(id)
);

create table if not exists fact_finance_actual (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    unit_id uuid references dim_unit(id),
    program_id uuid references dim_program(id),
    account_id uuid not null references dim_finance_account(id),
    amount numeric(18,2) not null,
    currency_code varchar(10) default 'TRY'
);

create table if not exists fact_finance_budget (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    unit_id uuid references dim_unit(id),
    program_id uuid references dim_program(id),
    account_id uuid not null references dim_finance_account(id),
    budget_amount numeric(18,2) not null,
    currency_code varchar(10) default 'TRY'
);

create table if not exists fact_kpi_snapshot (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    kpi_id uuid not null references dim_kpi(id),
    unit_id uuid references dim_unit(id),
    program_id uuid references dim_program(id),
    actual_value numeric(18,4),
    target_value numeric(18,4),
    previous_year_value numeric(18,4),
    university_average numeric(18,4),
    yoy_change numeric(18,4),
    achievement_rate numeric(18,4),
    risk_level varchar(20),
    calculated_at timestamp not null default now()
);

create table if not exists fact_external_indicator_snapshot (
    id bigserial primary key,
    date_key integer not null references dim_time(date_key),
    framework_id uuid not null references dim_external_framework(id),
    indicator_id uuid not null references dim_external_indicator(id),
    unit_id uuid references dim_unit(id),
    actual_value numeric(18,4),
    benchmark_turkiye numeric(18,4),
    benchmark_peer numeric(18,4),
    readiness_score numeric(8,4),
    completeness_rate numeric(8,4),
    status varchar(30)
);

