from api.index import app


def test_vercel_runtime_entrypoint_imports_and_registers_required_routes():
    paths = {
        path
        for route in app.routes
        if (path := getattr(route, "path", None)) is not None
    }

    assert "/health" in paths
    assert "/api/v1/payment-context/{payment_record_id}/validate" in paths
    assert "/api/v1/reception/bookings/today" in paths
