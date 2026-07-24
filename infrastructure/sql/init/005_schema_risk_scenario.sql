create table if not exists strategy_goal (
    id uuid primary key default gen_random_uuid(),
    goal_code varchar(50) unique not null,
    goal_name varchar(200) not null,
    owner_unit_id uuid references dim_unit(id),
    start_date date,
    end_date date,
    status varchar(30) default 'planned'
);

create table if not exists strategy_goal_kpi (
    id uuid primary key default gen_random_uuid(),
    goal_id uuid not null references strategy_goal(id),
    kpi_id uuid not null references dim_kpi(id),
    target_value numeric(18,4) not null,
    weight numeric(8,4) default 1
);

create table if not exists risk_rule (
    id uuid primary key default gen_random_uuid(),
    rule_code varchar(100) unique not null,
    rule_name varchar(200) not null,
    entity_scope varchar(50) not null,
    condition_expression text not null,
    severity varchar(20) not null,
    recommended_action text
);

create table if not exists risk_alert (
    id uuid primary key default gen_random_uuid(),
    rule_id uuid not null references risk_rule(id),
    detected_at timestamp not null default now(),
    unit_id uuid references dim_unit(id),
    program_id uuid references dim_program(id),
    alert_title varchar(200) not null,
    alert_description text,
    severity varchar(20) not null,
    status varchar(20) not null default 'open'
);

create table if not exists scenario_definition (
    id uuid primary key default gen_random_uuid(),
    scenario_code varchar(100) unique not null,
    scenario_name varchar(200) not null,
    scenario_type varchar(50) not null,
    created_by varchar(100) not null,
    created_at timestamp not null default now()
);

create table if not exists scenario_parameter (
    id uuid primary key default gen_random_uuid(),
    scenario_id uuid not null references scenario_definition(id),
    parameter_name varchar(100) not null,
    parameter_value numeric(18,4),
    parameter_text varchar(200)
);

create table if not exists scenario_result (
    id uuid primary key default gen_random_uuid(),
    scenario_id uuid not null references scenario_definition(id),
    result_scope varchar(50) not null,
    unit_id uuid references dim_unit(id),
    program_id uuid references dim_program(id),
    metric_code varchar(100) not null,
    base_value numeric(18,4),
    scenario_value numeric(18,4),
    delta_value numeric(18,4),
    calculated_at timestamp not null default now()
);

