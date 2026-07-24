create table if not exists meta_data_source (
    id uuid primary key default gen_random_uuid(),
    source_code varchar(50) unique not null,
    source_name varchar(200) not null,
    source_type varchar(50) not null,
    owner_unit varchar(200),
    refresh_frequency varchar(50),
    is_active boolean default true,
    created_at timestamp not null default now()
);

create table if not exists meta_ingestion_batch (
    id uuid primary key default gen_random_uuid(),
    source_id uuid not null references meta_data_source(id),
    batch_code varchar(100) not null,
    started_at timestamp not null default now(),
    finished_at timestamp,
    status varchar(30) not null,
    record_count integer default 0,
    checksum varchar(128),
    error_message text,
    created_by varchar(100)
);

create table if not exists meta_data_quality_rule (
    id uuid primary key default gen_random_uuid(),
    rule_code varchar(100) unique not null,
    rule_name varchar(200) not null,
    entity_name varchar(100) not null,
    severity varchar(20) not null,
    rule_expression text not null,
    is_active boolean default true
);

create table if not exists meta_data_quality_result (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references meta_ingestion_batch(id),
    rule_id uuid not null references meta_data_quality_rule(id),
    entity_name varchar(100) not null,
    failed_count integer not null default 0,
    status varchar(20) not null,
    sample_payload jsonb,
    created_at timestamp not null default now()
);

create table if not exists raw_yoksis_program (
    id bigserial primary key,
    batch_id uuid not null references meta_ingestion_batch(id),
    payload jsonb not null,
    fetched_at timestamp not null default now()
);

create table if not exists raw_yoksis_student (
    id bigserial primary key,
    batch_id uuid not null references meta_ingestion_batch(id),
    payload jsonb not null,
    fetched_at timestamp not null default now()
);

create table if not exists raw_yoksis_staff (
    id bigserial primary key,
    batch_id uuid not null references meta_ingestion_batch(id),
    payload jsonb not null,
    fetched_at timestamp not null default now()
);

