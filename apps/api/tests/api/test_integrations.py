from fastapi.testclient import TestClient

from app.api.deps import get_db
from app.main import app


def test_yoksis_connectivity_endpoint_exposes_mode() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/integrations/yoksis/connectivity")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"configured", "not_configured"}
    assert payload["mode"] in {"live", "sample_payload"}


def test_readiness_endpoint() -> None:
    class FakeSession:
        def execute(self, *_args, **_kwargs) -> None:
            return None

        def close(self) -> None:
            return None

    def override_get_db():
        yield FakeSession()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    response = client.get("/api/v1/health/ready")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["database"] == "ok"
