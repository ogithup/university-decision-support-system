from fastapi.testclient import TestClient

from app.main import app


def test_mock_yoksis_health() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/mock/yoksis/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["service"] == "mock_yoksis"


def test_mock_yoksis_programs_requires_auth() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/mock/yoksis/programs")
    assert response.status_code == 401


def test_mock_yoksis_programs_with_api_key() -> None:
    client = TestClient(app)
    response = client.get(
        "/api/v1/mock/yoksis/programs",
        headers={"Authorization": "Bearer mock-yoksis-key"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["resource"] == "programs"
    assert len(payload["records"]) >= 1
