import base64
from datetime import datetime, UTC

from fastapi import APIRouter, Header, HTTPException, status

from app.core.config import settings


router = APIRouter()


def _validate_mock_auth(authorization: str | None) -> None:
    if not settings.yoksis_mock_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mock YOKSIS is disabled.")

    if settings.yoksis_mock_auth_type == "none":
        return

    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header.")

    if settings.yoksis_mock_auth_type == "api_key":
        expected = f"Bearer {settings.yoksis_mock_api_key}"
        if authorization != expected:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid mock API key.")
        return

    if settings.yoksis_mock_auth_type == "basic_auth":
        if not authorization.startswith("Basic "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth scheme.")
        encoded = authorization.split(" ", 1)[1]
        decoded = base64.b64decode(encoded).decode("utf-8")
        expected = f"{settings.yoksis_mock_username}:{settings.yoksis_mock_password}"
        if decoded != expected:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid mock basic auth.")
        return

    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unsupported mock auth type.")


@router.get("/health")
def mock_health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "mock_yoksis",
        "auth_type": settings.yoksis_mock_auth_type,
    }


@router.get("/programs")
def mock_programs(authorization: str | None = Header(default=None)) -> dict:
    _validate_mock_auth(authorization)
    return {
        "source": "mock_yoksis",
        "resource": "programs",
        "generated_at": datetime.now(UTC).isoformat(),
        "records": [
            {
                "id": "program-001",
                "programCode": "CENG",
                "programName": "Bilgisayar Muhendisligi",
                "unitCode": "MMF",
                "degreeLevel": "bachelor",
                "languageCode": "TR",
                "educationType": "day",
            },
            {
                "id": "program-002",
                "programCode": "IE",
                "programName": "Endustri Muhendisligi",
                "unitCode": "MMF",
                "degreeLevel": "bachelor",
                "languageCode": "EN",
                "educationType": "day",
            },
        ],
    }


@router.get("/students")
def mock_students(authorization: str | None = Header(default=None)) -> dict:
    _validate_mock_auth(authorization)
    return {
        "source": "mock_yoksis",
        "resource": "students",
        "generated_at": datetime.now(UTC).isoformat(),
        "data": [
            {
                "id": "student-001",
                "studentNo": "2026001",
                "programCode": "CENG",
                "unitCode": "MMF",
                "gender": "M",
                "nationalityCode": "INT",
                "scholarshipType": "partial",
                "scholarshipRate": 25,
                "entryYear": 2026,
                "currentStatus": "active",
            },
            {
                "id": "student-002",
                "studentNo": "2025008",
                "programCode": "IE",
                "unitCode": "MMF",
                "gender": "F",
                "nationalityCode": "TR",
                "scholarshipType": "none",
                "scholarshipRate": 0,
                "entryYear": 2025,
                "currentStatus": "active",
            },
        ],
    }


@router.get("/staff")
def mock_staff(authorization: str | None = Header(default=None)) -> dict:
    _validate_mock_auth(authorization)
    return {
        "source": "mock_yoksis",
        "resource": "staff",
        "generated_at": datetime.now(UTC).isoformat(),
        "results": [
            {
                "id": "staff-001",
                "personnelNo": "A102",
                "unitCode": "MMF",
                "titleCode": "prof",
                "personnelType": "academic",
                "employmentStatus": "active",
                "hireDate": "2021-09-01",
            },
            {
                "id": "staff-002",
                "personnelNo": "A103",
                "unitCode": "MMF",
                "titleCode": "assoc_prof",
                "personnelType": "academic",
                "employmentStatus": "active",
                "hireDate": "2022-02-15",
            },
        ],
    }

