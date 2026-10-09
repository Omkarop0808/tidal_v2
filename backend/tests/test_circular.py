from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_circular_manifests_lifecycle():
    # 1. Fetch existing manifests
    res = client.get("/api/v1/recovery/manifests")
    assert res.status_code == 200
    manifests = res.json()
    assert isinstance(manifests, list)
    assert len(manifests) > 0
    
    first_id = manifests[0]["id"]
    
    # 2. Sign manifest
    sign_res = client.post("/api/v1/recovery/sign-manifest", json={
        "manifest_id": first_id,
        "upcycler_facility": "Lucro Plastecycle Pvt Ltd"
    })
    assert sign_res.status_code == 200
    assert sign_res.json()["signed"] is True

def test_model_retrain_history():
    res = client.get("/api/v1/ml/retrain-history")
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) > 0
