from app.repositories.integration_repository import IntegrationRepository


def run_required_field_audit(
    repo: IntegrationRepository,
    *,
    batch_id: str,
    resource: str,
    parsed_rows: list[dict],
) -> int:
    rules = repo.get_quality_rules(resource)
    total_failures = 0

    for rule in rules:
        target_field = rule.rule_expression.replace("required:", "", 1)
        failed_rows = [row for row in parsed_rows if not row.get(target_field)]
        failed_count = len(failed_rows)
        total_failures += failed_count
        repo.create_quality_result(
            batch_id=batch_id,
            rule_id=rule.id,
            entity_name=resource,
            failed_count=failed_count,
            status="failed" if failed_count else "passed",
            sample_payload=failed_rows[0] if failed_rows else None,
        )

    return total_failures

