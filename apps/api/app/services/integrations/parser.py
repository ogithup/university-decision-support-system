from dataclasses import dataclass

from app.models.meta import YoksisFieldMapping


FIELD_ALIASES = {
    "programs": {
        "source_record_id": ["id", "programId", "program_id", "kayitId"],
        "program_code": ["programCode", "program_code", "kod", "bolumKodu"],
        "program_name": ["programName", "program_name", "ad", "bolumAdi"],
        "unit_code": ["unitCode", "unit_code", "fakulteKodu", "birimKodu"],
        "degree_level": ["degreeLevel", "degree_level", "duzey"],
        "language_code": ["languageCode", "language_code", "dil"],
        "education_type": ["educationType", "education_type", "ogretimTuru"],
    },
    "students": {
        "source_record_id": ["id", "studentId", "student_id", "kayitId"],
        "student_no": ["studentNo", "student_no", "ogrenciNo"],
        "program_code": ["programCode", "program_code", "bolumKodu"],
        "unit_code": ["unitCode", "unit_code", "fakulteKodu", "birimKodu"],
        "gender": ["gender", "cinsiyet"],
        "nationality_code": ["nationalityCode", "nationality_code", "uyruk"],
        "scholarship_type": ["scholarshipType", "scholarship_type", "bursTuru"],
        "scholarship_rate": ["scholarshipRate", "scholarship_rate", "bursOrani"],
        "entry_year": ["entryYear", "entry_year", "girisYili"],
        "current_status": ["currentStatus", "current_status", "durum"],
    },
    "staff": {
        "source_record_id": ["id", "staffId", "staff_id", "kayitId"],
        "personnel_no": ["personnelNo", "personnel_no", "sicilNo"],
        "unit_code": ["unitCode", "unit_code", "birimKodu"],
        "title_code": ["titleCode", "title_code", "unvan"],
        "personnel_type": ["personnelType", "personnel_type", "personelTipi"],
        "employment_status": ["employmentStatus", "employment_status", "durum"],
        "hire_date_text": ["hireDate", "hire_date", "iseBaslamaTarihi"],
    },
}


@dataclass
class ParsedRecord:
    row: dict
    errors: list[str]


def _pick_value(payload: dict, candidate_fields: list[str]) -> object | None:
    for field in candidate_fields:
        if field in payload and payload[field] not in (None, ""):
            return payload[field]
    return None


def parse_records(
    resource: str,
    batch_id: str,
    records: list[dict],
    mappings: list[YoksisFieldMapping],
) -> list[ParsedRecord]:
    mapping_lookup = {mapping.target_field: mapping for mapping in mappings}
    aliases = FIELD_ALIASES[resource]
    parsed: list[ParsedRecord] = []

    for payload in records:
        row = {"batch_id": batch_id, "source_payload": payload}
        errors: list[str] = []

        for target_field, candidate_fields in aliases.items():
            mapping = mapping_lookup.get(target_field)
            if mapping:
                candidate_fields = [mapping.source_field]

            value = _pick_value(payload, candidate_fields)
            row[target_field] = value

            if mapping and mapping.is_required and value in (None, ""):
                errors.append(f"Missing required field for {target_field}")

        row["transform_status"] = "parsed" if not errors else "warning"
        row["transform_message"] = "; ".join(errors) if errors else None
        parsed.append(ParsedRecord(row=row, errors=errors))

    return parsed

