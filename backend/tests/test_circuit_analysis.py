"""Tests for Circuit Analysis mode and Gemma 4 integration."""

import io
import json
from unittest.mock import AsyncMock, MagicMock, patch
from PIL import Image
import pytest
from fastapi.testclient import TestClient
from google.genai import errors

from app.config import settings
from app.main import app
from app.prompts.circuit import CIRCUIT_SYSTEM_INSTRUCTION, build_circuit_prompt
from app.schemas import CircuitResult, ConfidenceLevel, PossibleIssue, VisibleComponent
from app.services.gemini_service import GeminiService

client = TestClient(app)


def create_test_image(format_name: str = "PNG") -> bytes:
    """Helper to generate a minimal valid in-memory image."""
    buffer = io.BytesIO()
    image = Image.new("RGB", (64, 64), color="green")
    image.save(buffer, format=format_name)
    return buffer.getvalue()


MOCK_VALID_CIRCUIT_DATA = {
    "overview": "555 Timer in astable multivibrator configuration intended for square-wave generation.",
    "visible_components": [
        {
            "name": "Integrated Circuit",
            "visible_label": "NE555P",
            "notes": "8-pin DIP package installed in breadboard center.",
        },
        {
            "name": "Resistor",
            "visible_label": "R1 10k",
            "notes": "Connected between VCC rail and pin 7 (Discharge).",
        },
        {
            "name": "Electrolytic Capacitor",
            "visible_label": "C1 (unclear capacitance)",
            "notes": "Connected between pin 2 and GND; voltage rating legible as 25V.",
        },
    ],
    "connections": [
        "Pin 1 tied to breadboard ground rail.",
        "Pin 8 tied to breadboard +5V VCC rail.",
        "Pin 4 (Reset) tied to +5V VCC.",
        "Pins 2 and 6 tied together.",
    ],
    "possible_issues": [
        {
            "issue": "Potential reversed polarity on electrolytic capacitor C1.",
            "evidence": "Stripe indicating negative terminal appears oriented toward pin 2 rather than GND.",
            "confidence": "medium",
        }
    ],
    "suggested_checks": [
        "Disconnect power and inspect the negative polarity stripe on capacitor C1.",
        "Measure resistance of R1 using a multimeter to confirm 10k ohm value.",
        "Verify continuity between pin 4 and VCC rail with power disconnected.",
    ],
    "safety_notes": [
        "Ensure DC power supply is de-energized and disconnected before touching or rewiring components.",
        "Do not perform resistance or continuity measurements on an active, energized circuit.",
        "Electrolytic capacitors installed with reversed polarity may overheat or vent violently.",
    ],
    "limitations": [
        "Capacitor C1 capacitance value is obscured by component angle.",
        "Breadboard power supply source voltage cannot be verified from image alone.",
    ],
}


# ============================================================================
# A. Successful Circuit Analysis
# ============================================================================

def test_circuit_analysis_success_with_mocked_provider():
    """Case A: Valid image and mocked provider return HTTP 200 with standard envelope."""
    png_bytes = create_test_image("PNG")

    with patch.object(
        GeminiService,
        "analyze_circuit",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = CircuitResult.model_validate(MOCK_VALID_CIRCUIT_DATA)

        response = client.post(
            "/api/analyze",
            data={
                "mode": "circuit",
                "context": "Low voltage breadboard prototype",
                "question": "Why is the LED not blinking?",
            },
            files={"file": ("circuit.png", png_bytes, "image/png")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "circuit"
        assert data["warnings"] == []
        res = data["result"]
        assert "555 Timer" in res["overview"]
        assert len(res["visible_components"]) == 3
        assert res["visible_components"][0]["name"] == "Integrated Circuit"
        assert len(res["connections"]) == 4
        assert len(res["possible_issues"]) == 1
        assert res["possible_issues"][0]["confidence"] == "medium"
        assert len(res["suggested_checks"]) == 3
        assert len(res["safety_notes"]) == 3
        assert len(res["limitations"]) == 2


# ============================================================================
# B. Correct Provider Inputs
# ============================================================================

def test_circuit_provider_receives_exact_bytes_mime_context_and_question():
    """Case B: Image bytes, MIME type, context, and question reach GeminiService."""
    jpeg_bytes = create_test_image("JPEG")
    context_text = "Operating from 9V battery rail"
    question_text = "Is the transistor pinout correct?"

    with patch.object(
        GeminiService,
        "analyze_circuit",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = CircuitResult.model_validate(MOCK_VALID_CIRCUIT_DATA)

        response = client.post(
            "/api/analyze",
            data={
                "mode": "circuit",
                "context": context_text,
                "question": question_text,
            },
            files={"file": ("schematic.jpg", jpeg_bytes, "image/jpeg")},
        )

        assert response.status_code == 200
        mock_analyze.assert_called_once()
        kwargs = mock_analyze.call_args.kwargs
        assert kwargs["image_bytes"] == jpeg_bytes
        assert kwargs["mime_type"] == "image/jpeg"
        assert kwargs["context"] == context_text
        assert kwargs["question"] == question_text


# ============================================================================
# C. Validation Failures (Provider Not Called)
# ============================================================================

def test_circuit_missing_file_rejected():
    """Missing file parameter is rejected without calling provider."""
    with patch.object(GeminiService, "analyze_circuit") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit"},
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "INVALID_REQUEST"
        mock_analyze.assert_not_called()


def test_circuit_empty_image_rejected():
    """0-byte empty file is rejected without calling provider."""
    with patch.object(GeminiService, "analyze_circuit") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit"},
            files={"file": ("empty.png", b"", "image/png")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_FILE"
        mock_analyze.assert_not_called()


def test_circuit_corrupt_image_rejected():
    """Corrupt image stream is rejected without calling provider."""
    with patch.object(GeminiService, "analyze_circuit") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit"},
            files={"file": ("broken.png", b"NotAValidPNGStream987654", "image/png")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "INVALID_FILE"
        mock_analyze.assert_not_called()


def test_circuit_unsupported_extension_rejected():
    """Uploading PDF to circuit mode is rejected without calling provider."""
    with patch.object(GeminiService, "analyze_circuit") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit"},
            files={"file": ("schematic.pdf", b"%PDF-1.4 dummy", "application/pdf")},
        )
        assert response.status_code == 415
        assert response.json()["detail"]["code"] == "UNSUPPORTED_FILE"
        mock_analyze.assert_not_called()


def test_circuit_oversized_image_rejected(monkeypatch):
    """File exceeding configured size is rejected without calling provider."""
    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0)
    png_bytes = create_test_image("PNG")

    with patch.object(GeminiService, "analyze_circuit") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit"},
            files={"file": ("large.png", png_bytes, "image/png")},
        )
        assert response.status_code == 413
        assert response.json()["detail"]["code"] == "FILE_TOO_LARGE"
        mock_analyze.assert_not_called()


def test_circuit_overlong_context_rejected():
    """Context exceeding 1000 chars is rejected without calling provider."""
    png_bytes = create_test_image("PNG")
    with patch.object(GeminiService, "analyze_circuit") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit", "context": "c" * 1001},
            files={"file": ("circuit.png", png_bytes, "image/png")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "CONTEXT_TOO_LONG"
        mock_analyze.assert_not_called()


def test_circuit_overlong_question_rejected():
    """Question exceeding 1000 chars is rejected without calling provider."""
    png_bytes = create_test_image("PNG")
    with patch.object(GeminiService, "analyze_circuit") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit", "question": "q" * 1001},
            files={"file": ("circuit.png", png_bytes, "image/png")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "QUESTION_TOO_LONG"
        mock_analyze.assert_not_called()


# ============================================================================
# D. Provider Failures & Safe Secret Isolation
# ============================================================================

def test_circuit_missing_api_key_returns_safe_503(monkeypatch):
    """Missing API key returns 503 without leaking secrets."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    png_bytes = create_test_image("PNG")

    response = client.post(
        "/api/analyze",
        data={"mode": "circuit"},
        files={"file": ("circuit.png", png_bytes, "image/png")},
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "MODEL_UNAVAILABLE"
    assert "api_key" not in response.text


@pytest.mark.asyncio
async def test_circuit_provider_timeout_returns_safe_504():
    """Provider timeout maps to 504 MODEL_TIMEOUT."""
    service = GeminiService(api_key="test_key")
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=TimeoutError("Request timed out"))

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await service.analyze_circuit(
                image_bytes=b"dummy",
                mime_type="image/png",
            )
        assert exc_info.value.status_code == 504
        assert exc_info.value.detail["code"] == "MODEL_TIMEOUT"


@pytest.mark.asyncio
async def test_circuit_provider_auth_error_returns_safe_502():
    """Provider 401/403 maps to 502 MODEL_UNAVAILABLE."""
    service = GeminiService(api_key="test_key")
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(
        side_effect=errors.APIError(401, "API_KEY_INVALID", {})
    )

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await service.analyze_circuit(
                image_bytes=b"dummy",
                mime_type="image/png",
            )
        assert exc_info.value.status_code == 502
        assert exc_info.value.detail["code"] == "MODEL_UNAVAILABLE"


@pytest.mark.asyncio
async def test_circuit_provider_rate_limit_returns_safe_502():
    """Provider 429 maps to 502 MODEL_UNAVAILABLE."""
    service = GeminiService(api_key="test_key")
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(
        side_effect=errors.APIError(429, "RESOURCE_EXHAUSTED", {})
    )

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await service.analyze_circuit(
                image_bytes=b"dummy",
                mime_type="image/png",
            )
        assert exc_info.value.status_code == 502
        assert exc_info.value.detail["code"] == "MODEL_UNAVAILABLE"


def test_circuit_provider_failure_never_creates_fake_success(monkeypatch):
    """Provider failure never results in fabricated HTTP 200."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "mock_key")
    png_bytes = create_test_image("PNG")

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(
        side_effect=errors.APIError(500, "Internal Server Error", {})
    )

    with patch.object(GeminiService, "_get_client", return_value=mock_client):
        response = client.post(
            "/api/analyze",
            data={"mode": "circuit"},
            files={"file": ("circuit.png", png_bytes, "image/png")},
        )
        assert response.status_code == 502
        assert response.json()["detail"]["code"] == "MODEL_UNAVAILABLE"
        assert "result" not in response.json()


# ============================================================================
# E. Invalid Model Output Handling
# ============================================================================

def test_circuit_malformed_json_rejected():
    """Malformed non-JSON output returns 502 MODEL_OUTPUT_INVALID."""
    service = GeminiService(api_key="test_key")
    with pytest.raises(Exception) as exc_info:
        service._parse_and_validate_circuit_output("Not JSON { broken")
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["code"] == "MODEL_OUTPUT_INVALID"


def test_circuit_missing_required_fields_rejected():
    """Missing required 'overview' field returns 502 MODEL_OUTPUT_INVALID."""
    service = GeminiService(api_key="test_key")
    invalid_data = json.dumps({"visible_components": []})
    with pytest.raises(Exception) as exc_info:
        service._parse_and_validate_circuit_output(invalid_data)
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["code"] == "MODEL_OUTPUT_INVALID"


def test_circuit_invalid_confidence_enum_rejected():
    """Invalid confidence rating ('absolute') returns 502 MODEL_OUTPUT_INVALID."""
    service = GeminiService(api_key="test_key")
    bad_data = {
        **MOCK_VALID_CIRCUIT_DATA,
        "possible_issues": [
            {
                "issue": "Bad wire",
                "evidence": "Visible gap",
                "confidence": "extreme",
            }
        ],
    }
    with pytest.raises(Exception) as exc_info:
        service._parse_and_validate_circuit_output(json.dumps(bad_data))
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["code"] == "MODEL_OUTPUT_INVALID"


# ============================================================================
# F. Anti-Hallucination & Electrical Safety Prompt Verification
# ============================================================================

def test_circuit_prompt_contains_anti_hallucination_rules():
    """Verify circuit prompt prohibits simulation claims, mandates uncertainty, and separates evidence."""
    prompt = build_circuit_prompt()
    prompt_lower = prompt.lower()

    # Must prohibit claiming simulation or instrument measurement
    assert "simulat" in prompt_lower
    assert "measure" in prompt_lower

    # Must require uncertainty for unreadable/ambiguous components
    assert "unreadable" in prompt_lower or "uncertain" in prompt_lower or "ambiguous" in prompt_lower

    # Must separate visible evidence from inference
    assert "evidence" in prompt_lower


def test_circuit_prompt_contains_electrical_safety_rules():
    """Verify circuit prompt contains electrical safety requirements."""
    prompt = build_circuit_prompt()
    prompt_lower = prompt.lower()

    # Must address mains / high voltage / de-energizing
    assert "mains" in prompt_lower or "voltage" in prompt_lower
    assert "power" in prompt_lower
    assert "disconnect" in prompt_lower or "de-energize" in prompt_lower
    assert "safe" in prompt_lower


def test_circuit_prompt_includes_user_context_and_question():
    """Verify prompt builder safely includes context and question."""
    ctx = "Custom 12V automotive circuit"
    q = "Where should the flyback diode go?"
    built = build_circuit_prompt(context=ctx, question=q)
    assert ctx in built
    assert q in built
