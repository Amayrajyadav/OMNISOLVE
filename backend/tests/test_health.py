"""Tests for the health check and root endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app)


def test_health_endpoint_success():
    """Verify GET /api/health returns 200 with expected service name."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "omnisolve-ai"


def test_health_endpoint_no_secrets_exposed():
    """Verify that health check never exposes configuration secrets or model keys."""
    response = client.get("/api/health")
    assert response.status_code == 200
    content_str = response.text
    # Must not contain private settings or sensitive keys
    assert "GEMINI_API_KEY" not in content_str
    assert "GEMINI_MODEL" not in content_str
    assert "api_key" not in content_str
    assert settings.GEMINI_API_KEY not in content_str if settings.GEMINI_API_KEY else True


def test_root_endpoint_success():
    """Verify root / endpoint returns operational status and service identifier."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "OmniSolve"
    assert data["service"] == "omnisolve-ai"
    assert data["status"] == "online"
