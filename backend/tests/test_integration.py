"""End-to-end integration tests for OmniSolve API, multi-mode routing, and CORS."""

import io
from unittest.mock import AsyncMock, patch
from PIL import Image
import pymupdf
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.schemas import (
    CircuitResult,
    DocumentResult,
    ScreenshotResult,
)
from app.services.gemini_service import GeminiService

client = TestClient(app, raise_server_exceptions=False)


def create_test_png() -> bytes:
    """Generate a minimal valid PNG image."""
    buffer = io.BytesIO()
    img = Image.new("RGB", (30, 30), color="blue")
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def create_test_pdf() -> bytes:
    """Generate a minimal valid PDF document."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "OmniSolve Integration Test Document")
    buf = doc.tobytes()
    doc.close()
    return buf


MOCK_SCREENSHOT_RESULT = {
    "issue_type": "IndexError",
    "summary": "List index out of range in loop.",
    "observed_evidence": ["IndexError: list index out of range on line 12"],
    "likely_causes": [
        {
            "cause": "Loop upper bound exceeds list length.",
            "rationale": "Index evaluated to len(items) instead of len(items)-1.",
            "confidence": "high",
        }
    ],
    "debugging_steps": ["Check list length before indexing."],
    "verification_steps": ["Rerun script with valid indices."],
    "confidence": "high",
    "limitations": ["Input array contents not visible."],
}

MOCK_CIRCUIT_RESULT = {
    "overview": "555 Timer in astable multivibrator mode.",
    "visible_components": [
        {
            "name": "NE555 Timer",
            "visible_label": "U1 NE555P",
            "notes": "DIP-8 package installed on breadboard.",
        }
    ],
    "connections": ["Pin 8 to VCC", "Pin 1 to GND"],
    "possible_issues": [
        {
            "issue": "Pin 4 floating.",
            "evidence": "No visible connection to VCC.",
            "confidence": "medium",
        }
    ],
    "suggested_checks": ["Measure voltage on pin 4 with circuit de-energized."],
    "safety_notes": ["De-energize circuit before adjusting wiring."],
    "limitations": ["C1 capacitor value not legible."],
}

MOCK_DOCUMENT_RESULT = {
    "document_title": "OmniSolve Guide",
    "summary": "Unified analysis platform documentation.",
    "key_points": ["Supports screenshot, circuit, and document modes."],
    "important_terms": [
        {
            "term": "Gemma 4",
            "explanation": "Open multimodal model family from Google.",
        }
    ],
    "answer": "OmniSolve supports three modes.",
    "source_notes": ["--- Page 1 ---"],
    "warnings": [],
    "limitations": ["No OCR performed."],
}


# ============================================================================
# 1. Multi-Mode End-to-End Analysis Integration
# ============================================================================

def test_integration_screenshot_mode_e2e():
    """Verify screenshot analysis succeeds through POST /api/analyze with expected envelope."""
    png_bytes = create_test_png()

    with patch.object(
        GeminiService,
        "analyze_screenshot",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = ScreenshotResult.model_validate(MOCK_SCREENSHOT_RESULT)

        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot", "context": "Python 3.14 bug"},
            files={"file": ("error.png", png_bytes, "image/png")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "screenshot"
        assert data["result"]["issue_type"] == "IndexError"
        assert data["warnings"] == []
        mock_analyze.assert_called_once()


def test_integration_circuit_mode_e2e():
    """Verify circuit analysis succeeds through POST /api/analyze with expected envelope."""
    png_bytes = create_test_png()

    with patch.object(
        GeminiService,
        "analyze_circuit",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = CircuitResult.model_validate(MOCK_CIRCUIT_RESULT)

        response = client.post(
            "/api/analyze",
            data={
                "mode": "circuit",
                "context": "5V breadboard",
                "question": "Is pin 4 connected?",
            },
            files={"file": ("breadboard.png", png_bytes, "image/png")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "circuit"
        assert "555 Timer" in data["result"]["overview"]
        assert len(data["result"]["visible_components"]) == 1
        mock_analyze.assert_called_once()


def test_integration_document_mode_pdf_e2e():
    """Verify PDF document analysis succeeds through POST /api/analyze with expected envelope."""
    pdf_bytes = create_test_pdf()

    with patch.object(
        GeminiService,
        "analyze_document",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = DocumentResult.model_validate(MOCK_DOCUMENT_RESULT)

        response = client.post(
            "/api/analyze",
            data={
                "mode": "document",
                "question": "How many modes are supported?",
            },
            files={"file": ("spec.pdf", pdf_bytes, "application/pdf")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "document"
        assert data["result"]["document_title"] == "OmniSolve Guide"
        assert data["result"]["answer"] == "OmniSolve supports three modes."
        mock_analyze.assert_called_once()


def test_integration_document_mode_txt_e2e():
    """Verify TXT document analysis succeeds through POST /api/analyze."""
    txt_bytes = b"OmniSolve Technical Overview: TXT document analysis test."

    with patch.object(
        GeminiService,
        "analyze_document",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = DocumentResult.model_validate(MOCK_DOCUMENT_RESULT)

        response = client.post(
            "/api/analyze",
            data={"mode": "document", "question": "Summarize content"},
            files={"file": ("overview.txt", txt_bytes, "text/plain")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "document"
        assert data["result"]["document_title"] == "OmniSolve Guide"
        mock_analyze.assert_called_once()


# ============================================================================
# 2. Mode Isolation & Dispatch Integrity
# ============================================================================

def test_integration_mode_dispatch_isolation():
    """Ensure that selecting screenshot mode never calls circuit or document services."""
    png_bytes = create_test_png()

    with (
        patch.object(GeminiService, "analyze_screenshot", new_callable=AsyncMock) as mock_screen,
        patch.object(GeminiService, "analyze_circuit", new_callable=AsyncMock) as mock_circ,
        patch.object(GeminiService, "analyze_document", new_callable=AsyncMock) as mock_doc,
    ):
        mock_screen.return_value = ScreenshotResult.model_validate(MOCK_SCREENSHOT_RESULT)

        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot"},
            files={"file": ("img.png", png_bytes, "image/png")},
        )
        assert response.status_code == 200
        mock_screen.assert_called_once()
        mock_circ.assert_not_called()
        mock_doc.assert_not_called()


# ============================================================================
# 3. CORS & Preflight Verification
# ============================================================================

def test_cors_preflight_allowed_origin():
    """Verify CORS preflight OPTIONS request from configured allowed origin receives 200 with headers."""
    response = client.options(
        "/api/analyze",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


def test_cors_allowed_origin_in_request():
    """Verify standard GET request from configured origin includes Access-Control-Allow-Origin."""
    response = client.get(
        "/api/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_disallowed_origin_behavior():
    """Verify unauthorized origin does not receive Access-Control-Allow-Origin header."""
    response = client.get(
        "/api/health",
        headers={"Origin": "http://unauthorized-attacker.example.com"},
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


# ============================================================================
# 4. Error Isolation & Secret Safeguard
# ============================================================================

def test_integration_secrets_never_exposed_in_errors(monkeypatch):
    """Confirm server secrets and internal keys are never exposed in error payloads."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "SuperSecretKey999")
    png_bytes = create_test_png()

    with patch.object(
        GeminiService,
        "analyze_screenshot",
        side_effect=Exception("Internal database or provider explosion"),
    ):
        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot"},
            files={"file": ("img.png", png_bytes, "image/png")},
        )
        assert response.status_code == 500
        body = response.text
        assert "SuperSecretKey999" not in body
        assert "Internal database or provider explosion" not in body
        assert response.json()["detail"]["code"] == "INTERNAL_ERROR"


def test_integration_health_endpoint_verified():
    """Verify GET /api/health returns operational status with correct service identifier."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "omnisolve-ai"


# ============================================================================
# 5. E2E Edge Cases & Input Validation
# ============================================================================

def test_integration_invalid_mode_rejected():
    """Verify invalid mode receives 422 Unprocessable Content with INVALID_MODE code."""
    png_bytes = create_test_png()
    response = client.post(
        "/api/analyze",
        data={"mode": "quantum_simulator"},
        files={"file": ("test.png", png_bytes, "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "INVALID_MODE"


def test_integration_unsupported_file_extension_rejected():
    """Verify invalid extension for requested mode receives 415 UNSUPPORTED_FILE."""
    txt_bytes = b"Just some plain text"
    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
        files={"file": ("error.txt", txt_bytes, "text/plain")},
    )
    assert response.status_code == 415
    assert response.json()["detail"]["code"] == "UNSUPPORTED_FILE"


def test_integration_empty_document_rejected():
    """Verify empty document receives 400 DOCUMENT_TEXT_EMPTY."""
    response = client.post(
        "/api/analyze",
        data={"mode": "document", "question": "What is this?"},
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "DOCUMENT_TEXT_EMPTY"


def test_integration_oversized_upload_rejected():
    """Verify payload exceeding max_upload_bytes receives 413 FILE_TOO_LARGE."""
    oversized = b"X" * (settings.max_upload_bytes + 1024)
    response = client.post(
        "/api/analyze",
        data={"mode": "document", "question": "Analyze big file"},
        files={"file": ("huge.txt", oversized, "text/plain")},
    )
    assert response.status_code == 413
    assert response.json()["detail"]["code"] == "FILE_TOO_LARGE"


def test_integration_missing_api_key_returns_503(monkeypatch):
    """Verify missing GEMINI_API_KEY returns safe 503 MODEL_UNAVAILABLE without crashing."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    png_bytes = create_test_png()
    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
        files={"file": ("test.png", png_bytes, "image/png")},
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "MODEL_UNAVAILABLE"


def test_integration_provider_timeout_returns_504():
    """Verify provider timeout propagates as 504 GATEWAY_TIMEOUT."""
    from fastapi import HTTPException
    with patch.object(
        GeminiService,
        "analyze_screenshot",
        side_effect=HTTPException(
            status_code=504,
            detail={"code": "GATEWAY_TIMEOUT", "message": "Model provider timed out."},
        ),
    ):
        png_bytes = create_test_png()
        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot"},
            files={"file": ("test.png", png_bytes, "image/png")},
        )
        assert response.status_code == 504
        assert response.json()["detail"]["code"] == "GATEWAY_TIMEOUT"


def test_integration_document_truncation_warning_envelope():
    """Verify truncation warnings from document analysis propagate into response envelope."""
    from app.services.document_service import DocumentExtractionResult, DocumentService
    pdf_bytes = create_test_pdf()

    mock_extraction = DocumentExtractionResult(
        text="Extracted text from oversized PDF",
        doc_type="pdf",
        total_pages=5,
        is_truncated=True,
        char_count=30000,
        warnings=["Document truncated: exceeds maximum character limit."],
    )

    with (
        patch.object(DocumentService, "extract_text", return_value=mock_extraction),
        patch.object(GeminiService, "analyze_document", new_callable=AsyncMock) as mock_doc,
    ):
        mock_doc.return_value = DocumentResult.model_validate(MOCK_DOCUMENT_RESULT)
        response = client.post(
            "/api/analyze",
            data={"mode": "document", "question": "Question?"},
            files={"file": ("large.pdf", pdf_bytes, "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["warnings"]) >= 1
        assert "truncated" in data["warnings"][0].lower()
