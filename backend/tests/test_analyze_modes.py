"""Tests for screenshot analysis mode and mocked Gemma 4 provider integration."""

import io
import json
from unittest.mock import AsyncMock, MagicMock, patch
from PIL import Image
import pytest
from fastapi.testclient import TestClient
from google.genai import errors

from app.config import settings
from app.main import app
from app.schemas import CircuitResult, ConfidenceLevel, DocumentResult, ScreenshotResult
from app.services.gemini_service import GeminiService

client = TestClient(app)


def create_test_image(format_name: str = "PNG") -> bytes:
    """Helper to generate a minimal valid in-memory image."""
    buffer = io.BytesIO()
    image = Image.new("RGB", (32, 32), color="red")
    image.save(buffer, format=format_name)
    return buffer.getvalue()


MOCK_VALID_SCREENSHOT_DATA = {
    "issue_type": "ModuleNotFoundError",
    "summary": "Python runtime failed to find the 'requests' module.",
    "observed_evidence": [
        "Traceback (most recent call last):",
        "ModuleNotFoundError: No module named 'requests'",
    ],
    "likely_causes": [
        {
            "cause": "The 'requests' package is not installed in the active environment.",
            "rationale": "Python raised a ModuleNotFoundError upon import requests.",
            "confidence": "high",
        }
    ],
    "debugging_steps": [
        "Verify the active virtual environment using 'where python' or 'which python'.",
        "Install the missing dependency with 'pip install requests'.",
    ],
    "verification_steps": [
        "Run 'python -c \"import requests\"' to confirm successful resolution."
    ],
    "confidence": "high",
    "limitations": [
        "The screenshot does not display the terminal prompt or virtualenv indicator."
    ],
}


# ============================================================================
# Case A, B, C, D: Valid Screenshot Request with Mocked Model Output
# ============================================================================

def test_screenshot_analysis_success_with_mocked_provider():
    """Case A: Valid screenshot request with mocked valid model output."""
    png_bytes = create_test_image("PNG")

    with patch.object(
        GeminiService,
        "analyze_screenshot",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = ScreenshotResult.model_validate(MOCK_VALID_SCREENSHOT_DATA)

        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot", "context": "Occurs when launching app.py"},
            files={"file": ("error.png", png_bytes, "image/png")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "screenshot"
        assert data["warnings"] == []
        assert data["result"]["issue_type"] == "ModuleNotFoundError"
        assert data["result"]["confidence"] == "high"
        assert len(data["result"]["observed_evidence"]) == 2
        assert len(data["result"]["likely_causes"]) == 1


def test_screenshot_provider_receives_actual_bytes_mime_and_context():
    """Cases B, C, D: Actual image bytes, MIME type, and context reach provider."""
    jpeg_bytes = create_test_image("JPEG")
    context_text = "Running under Python 3.14 on Windows"

    with patch.object(
        GeminiService,
        "analyze_screenshot",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = ScreenshotResult.model_validate(MOCK_VALID_SCREENSHOT_DATA)

        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot", "context": context_text},
            files={"file": ("terminal.jpg", jpeg_bytes, "image/jpeg")},
        )

        assert response.status_code == 200
        mock_analyze.assert_called_once()
        call_kwargs = mock_analyze.call_args.kwargs
        # Case B: Actual image bytes reached provider
        assert call_kwargs["image_bytes"] == jpeg_bytes
        # Case C: Correct MIME type passed
        assert call_kwargs["mime_type"] == "image/jpeg"
        # Case D: Optional context reached provider
        assert call_kwargs["context"] == context_text


# ============================================================================
# Cases E, F, G: Validation Failure Rejection Before Provider Call
# ============================================================================

def test_invalid_image_rejected_before_provider():
    """Case E: Invalid image rejected before provider invocation."""
    corrupt_bytes = b"ThisIsNotAValidImageStream123456"

    with patch.object(GeminiService, "analyze_screenshot") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot"},
            files={"file": ("corrupt.png", corrupt_bytes, "image/png")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_FILE"
        mock_analyze.assert_not_called()


def test_unsupported_format_rejected_before_provider():
    """Case F: Unsupported format rejected before provider invocation."""
    with patch.object(GeminiService, "analyze_screenshot") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot"},
            files={"file": ("notes.txt", b"error log", "text/plain")},
        )
        assert response.status_code == 415
        assert response.json()["detail"]["code"] == "UNSUPPORTED_FILE"
        mock_analyze.assert_not_called()


def test_oversized_image_rejected_before_provider(monkeypatch):
    """Case G: Oversized image rejected before provider invocation."""
    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0)
    png_bytes = create_test_image("PNG")

    with patch.object(GeminiService, "analyze_screenshot") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot"},
            files={"file": ("large.png", png_bytes, "image/png")},
        )
        assert response.status_code == 413
        assert response.json()["detail"]["code"] == "FILE_TOO_LARGE"
        mock_analyze.assert_not_called()


# ============================================================================
# Cases H, I, J: Configuration, Timeout, and Authentication Errors
# ============================================================================

def test_missing_api_key_returns_safe_error(monkeypatch):
    """Case H: Missing API key returns safe 503 error."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    png_bytes = create_test_image("PNG")

    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
        files={"file": ("screen.png", png_bytes, "image/png")},
    )
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["code"] == "MODEL_UNAVAILABLE"
    # Never leak keys or internals
    assert "api_key" not in response.text


@pytest.mark.asyncio
async def test_provider_timeout_returns_safe_error():
    """Case I: Provider timeout returns 504 MODEL_TIMEOUT."""
    service = GeminiService(api_key="test_key")

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=TimeoutError("Request timed out"))

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await service.analyze_screenshot(
                image_bytes=b"dummy",
                mime_type="image/png",
            )
        assert exc_info.value.status_code == 504
        assert exc_info.value.detail["code"] == "MODEL_TIMEOUT"


@pytest.mark.asyncio
async def test_provider_auth_error_returns_safe_error():
    """Case J: Provider auth error (401/403) returns 502 MODEL_UNAVAILABLE."""
    service = GeminiService(api_key="test_key")

    api_err = errors.APIError(401, "API_KEY_INVALID", {})
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=api_err)

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await service.analyze_screenshot(
                image_bytes=b"dummy",
                mime_type="image/png",
            )
        assert exc_info.value.status_code == 502
        assert exc_info.value.detail["code"] == "MODEL_UNAVAILABLE"


# ============================================================================
# Cases K, L, M: Malformed Output, Schema Invalidation, No Fake Success
# ============================================================================

def test_malformed_json_rejected_safely():
    """Case K: Malformed model JSON output returns 502 MODEL_OUTPUT_INVALID."""
    service = GeminiService(api_key="test_key")
    with pytest.raises(Exception) as exc_info:
        service._parse_and_validate_screenshot_output("This is not JSON at all {broken")
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["code"] == "MODEL_OUTPUT_INVALID"


def test_schema_invalid_output_rejected_safely():
    """Case L: JSON missing required fields or invalid confidence returns 502 MODEL_OUTPUT_INVALID."""
    service = GeminiService(api_key="test_key")
    # Missing required 'summary' and 'confidence'
    invalid_data = json.dumps({"issue_type": "SyntaxError", "observed_evidence": []})
    with pytest.raises(Exception) as exc_info:
        service._parse_and_validate_screenshot_output(invalid_data)
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["code"] == "MODEL_OUTPUT_INVALID"


def test_provider_failure_never_creates_fake_success(monkeypatch):
    """Case M: Provider failure returns error, never fabricating HTTP 200 success."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "mock_key")
    png_bytes = create_test_image("PNG")

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(
        side_effect=errors.APIError(500, "Internal Server Error", {})
    )

    with patch.object(GeminiService, "_get_client", return_value=mock_client):
        response = client.post(
            "/api/analyze",
            data={"mode": "screenshot"},
            files={"file": ("error.png", png_bytes, "image/png")},
        )
        assert response.status_code == 502
        assert response.json()["detail"]["code"] == "MODEL_UNAVAILABLE"
        assert "result" not in response.json()


# ============================================================================
# Gemma Model Output Adaptation & Markdown Handling
# ============================================================================

@pytest.mark.asyncio
async def test_gemma_invocation_omits_unsupported_structured_output_options():
    """Verify Gemma model invocations do not include unsupported response_schema or response_mime_type."""
    service = GeminiService(api_key="mock_key", model="gemma-4-31b-it")

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps(MOCK_VALID_SCREENSHOT_DATA)
    mock_client.aio.models.generate_content.return_value = mock_response

    with patch.object(service, "_get_client", return_value=mock_client):
        await service._execute_model_call(
            contents=["test prompt"],
            response_schema=ScreenshotResult,
        )

        mock_client.aio.models.generate_content.assert_called_once()
        call_kwargs = mock_client.aio.models.generate_content.call_args.kwargs
        config = call_kwargs.get("config")
        # Gemma models must NOT have response_schema or response_mime_type configured
        assert config is None or getattr(config, "response_schema", None) is None
        assert config is None or getattr(config, "response_mime_type", None) is None


def test_markdown_fenced_json_parsing_for_all_modes():
    """Verify markdown-fenced json (```json ... ```) parses properly into ScreenshotResult."""
    service = GeminiService(api_key="mock_key")
    fenced_text = f"```json\n{json.dumps(MOCK_VALID_SCREENSHOT_DATA)}\n```"

    result = service._parse_and_validate_screenshot_output(fenced_text)
    assert isinstance(result, ScreenshotResult)
    assert result.issue_type == "ModuleNotFoundError"
    assert result.confidence == ConfidenceLevel.HIGH


def test_conversational_wrapped_json_parsing():
    """Verify conversational text wrapping a json block parses properly."""
    service = GeminiService(api_key="mock_key")
    wrapped_text = f"Here is the requested debugging analysis:\n```json\n{json.dumps(MOCK_VALID_SCREENSHOT_DATA)}\n```\nHope this helps!"

    result = service._parse_and_validate_screenshot_output(wrapped_text)
    assert isinstance(result, ScreenshotResult)
    assert result.issue_type == "ModuleNotFoundError"


def test_circuit_markdown_fenced_and_wrapped_json_parsing():
    """Verify markdown-fenced json parses properly into CircuitResult."""
    service = GeminiService(api_key="mock_key")
    mock_data = {
        "overview": "5V LED circuit with series current-limiting resistor.",
        "visible_components": [
            {"name": "Resistor", "visible_label": "220 Ohm", "notes": "Series resistor"}
        ],
        "connections": ["VCC to Resistor to Anode"],
        "possible_issues": [],
        "suggested_checks": ["Measure voltage drop across diode"],
        "safety_notes": ["De-energize circuit before component replacement"],
        "limitations": ["Component tolerance is unverified"],
    }
    wrapped_text = f"Here is the circuit breakdown:\n```json\n{json.dumps(mock_data)}\n```\nEnd of analysis."

    result = service._parse_and_validate_circuit_output(wrapped_text)
    assert isinstance(result, CircuitResult)
    assert result.overview == "5V LED circuit with series current-limiting resistor."
    assert len(result.visible_components) == 1
    assert result.visible_components[0].name == "Resistor"


def test_document_markdown_fenced_and_wrapped_json_parsing():
    """Verify markdown-fenced json parses properly into DocumentResult."""
    service = GeminiService(api_key="mock_key")
    mock_data = {
        "document_title": "Server Specs",
        "summary": "Technical server specification document.",
        "key_points": ["Database runs on port 5432"],
        "important_terms": [
            {"term": "PostgreSQL", "explanation": "Relational database server"}
        ],
        "answer": "Port 5432.",
        "source_notes": ["--- Page 1 ---"],
        "warnings": [],
        "limitations": [],
    }
    wrapped_text = f"Analysis follows:\n```json\n{json.dumps(mock_data)}\n```"

    result = service._parse_and_validate_document_output(wrapped_text)
    assert isinstance(result, DocumentResult)
    assert result.document_title == "Server Specs"
    assert result.answer == "Port 5432."


