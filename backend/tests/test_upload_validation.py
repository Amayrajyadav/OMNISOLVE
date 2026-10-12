"""Tests for upload validation, content inspection, size limits, and error codes."""

import io
from PIL import Image
import pymupdf
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.schemas import AnalysisMode
from app.services.validation_service import UploadValidationService

client = TestClient(app)


def create_test_image(format_name: str = "PNG") -> bytes:
    """Helper to generate a minimal valid in-memory image."""
    buffer = io.BytesIO()
    image = Image.new("RGB", (10, 10), color="blue")
    image.save(buffer, format=format_name)
    return buffer.getvalue()


def create_test_pdf() -> bytes:
    """Helper to generate a minimal valid single-page in-memory PDF."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "OmniSolve Test Document Content")
    return doc.tobytes()


# ============================================================================
# API Endpoint Validation Tests (POST /api/analyze)
# ============================================================================

def test_missing_file_rejected():
    """Verify that omitting the file parameter returns 422."""
    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["detail"]["code"] == "INVALID_REQUEST"


def test_invalid_mode_rejected():
    """Verify that an unsupported mode string returns 422 with INVALID_MODE."""
    png_bytes = create_test_image("PNG")
    response = client.post(
        "/api/analyze",
        data={"mode": "invalid_audio_mode"},
        files={"file": ("test.png", png_bytes, "image/png")},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["detail"]["code"] == "INVALID_MODE"


def test_unsupported_file_extension_for_screenshot_mode():
    """Verify uploading a text or PDF file to screenshot mode returns 415 UNSUPPORTED_FILE."""
    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
        files={"file": ("report.pdf", b"%PDF-1.4 dummy", "application/pdf")},
    )
    assert response.status_code == 415
    data = response.json()
    assert data["detail"]["code"] == "UNSUPPORTED_FILE"


def test_unsupported_file_extension_for_document_mode():
    """Verify uploading an image to document mode returns 415 UNSUPPORTED_FILE."""
    png_bytes = create_test_image("PNG")
    response = client.post(
        "/api/analyze",
        data={"mode": "document"},
        files={"file": ("screenshot.png", png_bytes, "image/png")},
    )
    assert response.status_code == 415
    data = response.json()
    assert data["detail"]["code"] == "UNSUPPORTED_FILE"


def test_corrupt_image_rejected():
    """Verify that an image file containing random invalid bytes returns 400 INVALID_FILE."""
    corrupt_bytes = b"NotARealPNGFileHeader1234567890"
    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
        files={"file": ("broken.png", corrupt_bytes, "image/png")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "INVALID_FILE"


def test_empty_file_rejected_for_screenshot():
    """Verify uploading an empty 0-byte file returns 400 INVALID_FILE."""
    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
        files={"file": ("empty.png", b"", "image/png")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "INVALID_FILE"


def test_empty_document_rejected():
    """Verify uploading an empty document returns 400 DOCUMENT_TEXT_EMPTY."""
    response = client.post(
        "/api/analyze",
        data={"mode": "document"},
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "DOCUMENT_TEXT_EMPTY"


def test_whitespace_only_text_rejected():
    """Verify a text document with only whitespace returns 400 DOCUMENT_TEXT_EMPTY."""
    response = client.post(
        "/api/analyze",
        data={"mode": "document"},
        files={"file": ("spaces.txt", b"   \n\n\t   ", "text/plain")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "DOCUMENT_TEXT_EMPTY"


def test_oversized_file_rejected(monkeypatch):
    """Verify file exceeding MAX_UPLOAD_MB is rejected with 413 FILE_TOO_LARGE."""
    # Temporarily set max upload to 1KB for fast testing
    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0)  # max_upload_bytes = 0
    png_bytes = create_test_image("PNG")

    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot"},
        files={"file": ("large.png", png_bytes, "image/png")},
    )
    assert response.status_code == 413
    data = response.json()
    assert data["detail"]["code"] == "FILE_TOO_LARGE"


def test_context_too_long_rejected():
    """Verify context exceeding 1000 chars returns 400 CONTEXT_TOO_LONG."""
    png_bytes = create_test_image("PNG")
    overlong_context = "x" * 1001

    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot", "context": overlong_context},
        files={"file": ("valid.png", png_bytes, "image/png")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "CONTEXT_TOO_LONG"


def test_question_too_long_rejected():
    """Verify question exceeding 1000 chars returns 400 QUESTION_TOO_LONG."""
    pdf_bytes = create_test_pdf()
    overlong_question = "q" * 1001

    response = client.post(
        "/api/analyze",
        data={"mode": "document", "question": overlong_question},
        files={"file": ("valid.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "QUESTION_TOO_LONG"


def test_valid_png_passes_validation_reaches_provider(monkeypatch):
    """Verify valid PNG passes validation (reaches provider, returns 503 when API key not configured)."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    png_bytes = create_test_image("PNG")
    response = client.post(
        "/api/analyze",
        data={"mode": "screenshot", "context": "Error occurs on line 42"},
        files={"file": ("code_error.png", png_bytes, "image/png")},
    )
    # Validation passed, provider reports unconfigured credentials safely
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["code"] == "MODEL_UNAVAILABLE"


def test_valid_jpeg_passes_validation_reaches_circuit_provider(monkeypatch):
    """Verify valid JPEG passes validation for circuit mode (reaches provider, returns 503 when API key not configured)."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    jpeg_bytes = create_test_image("JPEG")
    response = client.post(
        "/api/analyze",
        data={"mode": "circuit", "context": "555 timer on breadboard"},
        files={"file": ("schematic.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["code"] == "MODEL_UNAVAILABLE"


def test_valid_txt_passes_validation_reaches_document_provider(monkeypatch):
    """Verify valid TXT passes validation (reaches provider, returns 503 when API key not configured)."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    text_content = b"This is a valid technical log document from OmniSolve system."
    response = client.post(
        "/api/analyze",
        data={"mode": "document", "question": "What is the system status?"},
        files={"file": ("log.txt", text_content, "text/plain")},
    )
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["code"] == "MODEL_UNAVAILABLE"


def test_valid_pdf_passes_validation_reaches_document_provider(monkeypatch):
    """Verify valid PDF passes validation (reaches provider, returns 503 when API key not configured)."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    pdf_bytes = create_test_pdf()
    response = client.post(
        "/api/analyze",
        data={"mode": "document", "question": "Summarize the findings."},
        files={"file": ("report.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["code"] == "MODEL_UNAVAILABLE"




# ============================================================================
# Direct Unit Tests for UploadValidationService
# ============================================================================

def test_service_validate_image_detects_dimensions():
    """Verify service extracts width and height metadata from valid images."""
    png_bytes = create_test_image("PNG")
    mime, meta = UploadValidationService.validate_content(
        mode=AnalysisMode.SCREENSHOT,
        filename="test.png",
        file_bytes=png_bytes,
    )
    assert mime == "image/png"
    assert meta["width"] == 10
    assert meta["height"] == 10
    assert meta["format"] == "PNG"


def test_service_validate_pdf_detects_page_count():
    """Verify service extracts page count from valid PDF."""
    pdf_bytes = create_test_pdf()
    mime, meta = UploadValidationService.validate_content(
        mode=AnalysisMode.DOCUMENT,
        filename="sample.pdf",
        file_bytes=pdf_bytes,
    )
    assert mime == "application/pdf"
    assert meta["pages"] == 1
    assert meta["format"] == "PDF"
