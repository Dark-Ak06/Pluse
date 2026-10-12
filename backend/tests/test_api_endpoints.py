from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Сарыарқа" in data["region"]

def test_dashboard_overview():
    response = client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpi" in data
    assert data["kpi"]["total_objects"] == 127
    assert data["kpi"]["total_roads_km"] == 1588.0
    assert len(data["top_lagging_objects"]) <= 5
    assert len(data["top_problem_contractors"]) <= 5

def test_objects_list_and_filters():
    response = client.get("/api/v1/objects?district=Есіл ауданы")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    for obj in data:
        assert obj["district"] == "Есіл ауданы"

def test_roads_and_coverage():
    response = client.get("/api/v1/roads/coverage/monthly")
    assert response.status_code == 200
    data = response.json()
    assert data["total_km"] == 1588.0
    assert data["coverage_percent"] > 0

def test_contractors_discipline():
    response = client.get("/api/v1/contractors")
    assert response.status_code == 200
    contractors = response.json()
    assert len(contractors) == 5
    # Первый в списке должен быть системным нарушителем
    assert contractors[0]["is_systemic_problem"] is True

def test_assistant_query():
    response = client.post("/api/v1/assistant/query", json={"query": "какие объекты отстают в Есильском районе"})
    assert response.status_code == 200
    data = response.json()
    assert "Есильском" in data["answer"] or "Есіл" in data["answer"]
