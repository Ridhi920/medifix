def test_create_booking_success(client) -> None:
    services = client.get("/services").json()
    service_id = services[0]["id"]

    payload = {
        "patient_name": "Ridhi",
        "contact_phone": "9999999999",
        "service_id": service_id,
        "scheduled_at": "2026-02-10T10:30:00Z",
        "location": "Bengaluru",
        "notes": "Need quick confirmation",
    }

    response = client.post("/bookings", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["service_id"] == service_id
    assert data["status"] == "requested"


def test_create_booking_invalid_service(client) -> None:
    payload = {
        "patient_name": "Ridhi",
        "contact_phone": "9999999999",
        "service_id": "missing",
    }

    response = client.post("/bookings", json=payload)

    assert response.status_code == 400
