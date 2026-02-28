def test_get_services_returns_seeded_list(client) -> None:
    response = client.get("/services")

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) >= 5
    assert {item["category"] for item in payload} >= {
        "medicine",
        "clinic",
        "lab",
        "ambulance",
    }
