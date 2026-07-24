create table if not exists dim_time (
    date_key integer primary key,
    full_date date not null,
    year integer not null,
    quarter integer not null,
    month integer not null,
    month_name varchar(20) not null,
    week integer not null,
    day integer not null,
    academic_year varchar(20),
    semester varchar(20)
);

create table if not exists dim_unit (
    id uuid primary key default gen_random_uuid(),
    unit_code varchar(50) unique not null,
    unit_name varchar(200) not null,
    unit_type varchar(50) not null,
    parent_unit_id uuid references dim_unit(id),
    is_academic boolean not null default false,
    is_active boolean not null default true
);

create table if not exists dim_program (
    id uuid primary key default gen_random_uuid(),
    program_code varchar(50) unique not null,
    program_name varchar(200) not null,
    unit_id uuid not null references dim_unit(id),
    degree_level varchar(30) not null,
    language_code varchar(10),
    education_type varchar(30),
    is_active boolean not null default true
);

create table if not exists dim_student (
    id uuid primary key default gen_random_uuid(),
    student_no varchar(50) unique,
    gender varchar(20),
    nationality_code varchar(10),
    scholarship_type varchar(50),
    scholarship_rate numeric(5,2),
    entry_year integer,
    current_status varchar(30),
    created_at timestamp not null default now()
);

create table if not exists dim_personnel (
    id uuid primary key default gen_random_uuid(),
    personnel_no varchar(50) unique,
    unit_id uuid references dim_unit(id),
    title_code varchar(30),
    personnel_type varchar(30),
    employment_status varchar(30),
    hire_date date,
    is_active boolean default true
);

create table if not exists dim_course (
    id uuid primary key default gen_random_uuid(),
    course_code varchar(50) unique not null,
    course_name varchar(200) not null,
    unit_id uuid references dim_unit(id),
    credit numeric(4,2),
    weekly_hours numeric(4,2),
    is_active boolean default true
);

create table if not exists dim_space (
    id uuid primary key default gen_random_uuid(),
    space_code varchar(50) unique not null,
    space_name varchar(200) not null,
    building_name varchar(200),
    campus_name varchar(200),
    space_type varchar(50),
    capacity integer,
    area_m2 numeric(12,2),
    owner_unit_id uuid references dim_unit(id),
    is_active boolean default true
);

create table if not exists dim_finance_account (
    id uuid primary key default gen_random_uuid(),
    account_code varchar(50) unique not null,
    account_name varchar(200) not null,
    account_group varchar(50) not null,
    parent_account_id uuid references dim_finance_account(id)
);

create table if not exists dim_kpi (
    id uuid primary key default gen_random_uuid(),
    kpi_code varchar(100) unique not null,
    kpi_name varchar(200) not null,
    category varchar(100) not null,
    unit_of_measure varchar(50) not null,
    owner_module varchar(100) not null,
    formula_text text not null,
    refresh_frequency varchar(50),
    risk_threshold_low numeric(18,4),
    risk_threshold_high numeric(18,4),
    is_active boolean default true
);

create table if not exists dim_external_framework (
    id uuid primary key default gen_random_uuid(),
    framework_code varchar(30) unique not null,
    framework_name varchar(100) not null,
    methodology_year integer not null
);

create table if not exists dim_external_indicator (
    id uuid primary key default gen_random_uuid(),
    framework_id uuid not null references dim_external_framework(id),
    indicator_code varchar(100) not null,
    indicator_name varchar(200) not null,
    category varchar(100),
    weight numeric(8,4),
    unique (framework_id, indicator_code)
);

