"""Tests for Document Analysis mode, text extraction service, and Gemma 4 integration."""

import json
from unittest.mock import AsyncMock, MagicMock, patch
import pymupdf
import pytest
from fastapi.testclient import TestClient
from google.genai import errors

from app.config import settings
from app.main import app
from app.prompts.document import build_document_prompt
from app.schemas import DocumentResult, ImportantTerm
from app.services.document_service import DocumentExtractionResult, DocumentService
from app.services.gemini_service import GeminiService

client = TestClient(app)


def create_pdf_with_pages(page_contents: list[str], encrypt_password: str = None) -> bytes:
    """Helper to create synthetic in-memory PDFs with arbitrary page text."""
    doc = pymupdf.open()
    for text in page_contents:
        page = doc.new_page()
        if text.strip():
            page.insert_text((50, 72), text)

    if encrypt_password:
        # Encrypt with owner and user passwords
        perm = int(
            pymupdf.PDF_PERM_ACCESSIBILITY
            | pymupdf.PDF_PERM_PRINT
            | pymupdf.PDF_PERM_COPY
            | pymupdf.PDF_PERM_ANNOTATE
        )
        buffer = doc.tobytes(
            encryption=pymupdf.PDF_ENCRYPT_AES_256,
            owner_pw=encrypt_password,
            user_pw=encrypt_password,
            permissions=perm,
        )
    else:
        buffer = doc.tobytes()

    doc.close()
    return buffer


MOCK_VALID_DOCUMENT_DATA = {
    "document_title": "Project OmniSolve Architectural Specification",
    "summary": "This document specifies the unified 3-mode AI architecture for OmniSolve.",
    "key_points": [
        "OmniSolve supports Screenshot, Circuit, and Document analysis modes.",
        "Server-side Python FastAPI handles validation, extraction, and model integration.",
        "The model must never fabricate information outside the extracted document text.",
    ],
    "important_terms": [
        {
            "term": "Multimodal Inference",
            "explanation": "Processing combined image, text, and document modalities in a unified backend.",
        }
    ],
    "answer": "OmniSolve supports three primary modes: Screenshot, Circuit, and Document Analysis.",
    "source_notes": ["--- Page 1 ---, Section 2 Architecture"],
    "warnings": [],
    "limitations": ["Document figures and diagrams were not OCR-processed."],
}


# ============================================================================
# A. PDF Extraction Unit Tests
# ============================================================================

def test_extract_pdf_valid_single_page():
    """Verify text extraction from a valid single-page PDF."""
    pdf_bytes = create_pdf_with_pages(["OmniSolve Section 1: Overview"])
    res = DocumentService.extract_text(pdf_bytes, filename="spec.pdf")
    assert res.doc_type == "PDF"
    assert res.total_pages == 1
    assert "OmniSolve Section 1: Overview" in res.text
    assert not res.is_truncated
    assert len(res.empty_pages) == 0


def test_extract_pdf_multi_page_with_page_markers():
    """Verify multi-page PDF extraction formats traceable page markers."""
    pdf_bytes = create_pdf_with_pages([
        "Page 1 Content: Introduction",
        "Page 2 Content: Architecture",
        "Page 3 Content: Conclusion",
    ])
    res = DocumentService.extract_text(pdf_bytes, filename="doc.pdf")
    assert res.total_pages == 3
    assert "--- Page 1 ---" in res.text
    assert "Page 1 Content: Introduction" in res.text
    assert "--- Page 2 ---" in res.text
    assert "Page 2 Content: Architecture" in res.text
    assert "--- Page 3 ---" in res.text
    assert "Page 3 Content: Conclusion" in res.text


def test_extract_pdf_with_empty_or_scanned_pages():
    """Verify PDF with empty pages detects empty pages and discloses extraction warning."""
    pdf_bytes = create_pdf_with_pages([
        "Page 1 has machine-readable text.",
        "",  # Empty or image-only page
        "Page 3 has conclusion text.",
    ])
    res = DocumentService.extract_text(pdf_bytes, filename="scan_mix.pdf")
    assert res.total_pages == 3
    assert res.empty_pages == [2]
    assert len(res.warnings) == 1
    assert "Pages [2] contained no machine-readable text" in res.warnings[0]


def test_extract_pdf_all_empty_or_scanned_rejected():
    """Verify PDF containing 0 machine-readable text is rejected with 400 DOCUMENT_TEXT_EMPTY."""
    pdf_bytes = create_pdf_with_pages(["", "   ", "\n\n"])
    with pytest.raises(Exception) as exc_info:
        DocumentService.extract_text(pdf_bytes, filename="blank_scanned.pdf")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "DOCUMENT_TEXT_EMPTY"
    assert "OCR" in exc_info.value.detail["message"]


def test_extract_pdf_corrupt_rejected():
    """Verify corrupt PDF bytes are rejected with 400 INVALID_FILE."""
    corrupt_bytes = b"%PDF-1.4 NotARealPDFStreamCorrupted1234567890"
    with pytest.raises(Exception) as exc_info:
        DocumentService.extract_text(corrupt_bytes, filename="broken.pdf")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "INVALID_FILE"


def test_extract_pdf_encrypted_rejected():
    """Verify encrypted/locked PDF is rejected safely with 400 INVALID_FILE."""
    locked_pdf_bytes = create_pdf_with_pages(["Secret Classified Plan"], encrypt_password="securepassword123")
    with pytest.raises(Exception) as exc_info:
        DocumentService.extract_text(locked_pdf_bytes, filename="locked.pdf")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "INVALID_FILE"
    assert "encrypted" in exc_info.value.detail["message"].lower()


def test_extract_pdf_exceeding_max_chars_truncated():
    """Verify PDF exceeding max characters is truncated deterministically with warning."""
    long_text = "OmniSolve Architecture Section " * 100
    pdf_bytes = create_pdf_with_pages([long_text])
    res = DocumentService.extract_text(pdf_bytes, filename="long.pdf", max_chars=100)
    assert res.is_truncated is True
    assert len(res.text) == 100
    assert any("truncated" in w.lower() for w in res.warnings)


# ============================================================================
# B. TXT Extraction Unit Tests
# ============================================================================

def test_extract_txt_valid_utf8():
    """Verify valid UTF-8 text extraction."""
    txt_bytes = "Technical Report: All systems nominal.".encode("utf-8")
    res = DocumentService.extract_text(txt_bytes, filename="report.txt")
    assert res.doc_type == "TXT"
    assert res.text == "Technical Report: All systems nominal."
    assert not res.is_truncated


def test_extract_txt_unicode_special_characters():
    """Verify extraction of unicode characters, emojis, and symbols."""
    unicode_text = "System Metrics: ΔV = 4.2 km/s, T = 298.15 K, Status: ✔️ Operational, π ≈ 3.14159"
    txt_bytes = unicode_text.encode("utf-8")
    res = DocumentService.extract_text(txt_bytes, filename="metrics.txt")
    assert res.text == unicode_text


def test_extract_txt_latin1_fallback():
    """Verify Latin-1 encoded text fallback extraction."""
    # Byte 0xE9 is 'é' in Latin-1, invalid in strict UTF-8
    latin1_bytes = b"Resume de l'analyse: Succes"
    res = DocumentService.extract_text(latin1_bytes, filename="resume.txt")
    assert "Resume" in res.text


def test_extract_txt_empty_or_whitespace_rejected():
    """Verify whitespace-only or empty TXT file is rejected with 400 DOCUMENT_TEXT_EMPTY."""
    with pytest.raises(Exception) as exc_info:
        DocumentService.extract_text(b"   \t\n   ", filename="empty.txt")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "DOCUMENT_TEXT_EMPTY"


def test_extract_txt_exceeding_max_chars_truncated():
    """Verify TXT exceeding max characters is truncated with warning."""
    long_txt = "Data Log Line Entry " * 200
    txt_bytes = long_txt.encode("utf-8")
    res = DocumentService.extract_text(txt_bytes, filename="big.txt", max_chars=150)
    assert res.is_truncated is True
    assert len(res.text) == 150
    assert any("truncated" in w.lower() for w in res.warnings)


# ============================================================================
# C. Successful Document Analysis API Tests (Mocked Provider)
# ============================================================================

def test_document_analysis_pdf_success_with_mocked_provider():
    """Case C: Valid PDF upload and mocked provider return HTTP 200 with DocumentResult envelope."""
    pdf_bytes = create_pdf_with_pages(["OmniSolve supports three modes: Screenshot, Circuit, and Document."])

    with patch.object(
        GeminiService,
        "analyze_document",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = DocumentResult.model_validate(MOCK_VALID_DOCUMENT_DATA)

        response = client.post(
            "/api/analyze",
            data={
                "mode": "document",
                "question": "What modes are supported?",
                "context": "Reviewing system capabilities",
            },
            files={"file": ("spec.pdf", pdf_bytes, "application/pdf")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "document"
        assert isinstance(data["warnings"], list)
        res = data["result"]
        assert res["document_title"] == "Project OmniSolve Architectural Specification"
        assert len(res["key_points"]) == 3
        assert len(res["important_terms"]) == 1
        assert "three primary modes" in res["answer"]
        assert len(res["source_notes"]) == 1
        assert len(res["limitations"]) == 1


def test_document_analysis_txt_success_with_mocked_provider():
    """Case C: Valid TXT upload and mocked provider return HTTP 200."""
    txt_bytes = b"Server Error Logs: Database connection pool exhausted on port 5432."

    with patch.object(
        GeminiService,
        "analyze_document",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = DocumentResult.model_validate(MOCK_VALID_DOCUMENT_DATA)

        response = client.post(
            "/api/analyze",
            data={
                "mode": "document",
                "question": "What port failed?",
            },
            files={"file": ("server.txt", txt_bytes, "text/plain")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "document"
        assert data["result"]["document_title"] == "Project OmniSolve Architectural Specification"


def test_document_provider_receives_extracted_text_question_and_context():
    """Verify GeminiService receives exact extracted text, question, context, and extraction warnings."""
    pdf_bytes = create_pdf_with_pages(["Chapter 1: Ground Truth Analysis."])
    question_text = "What is Chapter 1 about?"
    context_text = "Academic paper review"

    with patch.object(
        GeminiService,
        "analyze_document",
        new_callable=AsyncMock,
    ) as mock_analyze:
        mock_analyze.return_value = DocumentResult.model_validate(MOCK_VALID_DOCUMENT_DATA)

        response = client.post(
            "/api/analyze",
            data={
                "mode": "document",
                "question": question_text,
                "context": context_text,
            },
            files={"file": ("paper.pdf", pdf_bytes, "application/pdf")},
        )

        assert response.status_code == 200
        mock_analyze.assert_called_once()
        kwargs = mock_analyze.call_args.kwargs
        assert "Chapter 1: Ground Truth Analysis." in kwargs["extracted_text"]
        assert kwargs["question"] == question_text
        assert kwargs["context"] == context_text
        assert isinstance(kwargs["extraction_warnings"], list)


def test_document_truncation_warning_propagates_to_response_envelope():
    """Verify that when extraction triggers a truncation warning, it appears in response warnings."""
    # Force max document chars to small limit for testing
    long_text = "A" * 500
    txt_bytes = long_text.encode("utf-8")

    with patch.object(settings, "MAX_DOCUMENT_CHARS", 100):
        with patch.object(
            GeminiService,
            "analyze_document",
            new_callable=AsyncMock,
        ) as mock_analyze:
            mock_analyze.return_value = DocumentResult.model_validate(MOCK_VALID_DOCUMENT_DATA)

            response = client.post(
                "/api/analyze",
                data={"mode": "document"},
                files={"file": ("long.txt", txt_bytes, "text/plain")},
            )

            assert response.status_code == 200
            data = response.json()
            assert any("truncated" in w.lower() for w in data["warnings"])


# ============================================================================
# D. Validation Barriers (Provider Not Called)
# ============================================================================

def test_document_missing_file_rejected():
    """Missing file is rejected before provider call."""
    with patch.object(GeminiService, "analyze_document") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "document"},
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "INVALID_REQUEST"
        mock_analyze.assert_not_called()


def test_document_unsupported_extension_rejected():
    """Uploading image (PNG) to document mode is rejected with 415 UNSUPPORTED_FILE."""
    with patch.object(GeminiService, "analyze_document") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "document"},
            files={"file": ("screenshot.png", b"dummy png bytes", "image/png")},
        )
        assert response.status_code == 415
        assert response.json()["detail"]["code"] == "UNSUPPORTED_FILE"
        mock_analyze.assert_not_called()


def test_document_empty_file_rejected():
    """Uploading 0-byte document is rejected with 400 DOCUMENT_TEXT_EMPTY."""
    with patch.object(GeminiService, "analyze_document") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "document"},
            files={"file": ("empty.txt", b"", "text/plain")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "DOCUMENT_TEXT_EMPTY"
        mock_analyze.assert_not_called()


def test_document_oversized_file_rejected(monkeypatch):
    """Document exceeding upload limit is rejected before provider invocation."""
    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0)
    txt_bytes = b"Some valid document text content."

    with patch.object(GeminiService, "analyze_document") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "document"},
            files={"file": ("oversized.txt", txt_bytes, "text/plain")},
        )
        assert response.status_code == 413
        assert response.json()["detail"]["code"] == "FILE_TOO_LARGE"
        mock_analyze.assert_not_called()


def test_document_overlong_question_rejected():
    """Question exceeding 1000 characters is rejected before provider invocation."""
    txt_bytes = b"Valid document content."
    with patch.object(GeminiService, "analyze_document") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "document", "question": "q" * 1001},
            files={"file": ("doc.txt", txt_bytes, "text/plain")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "QUESTION_TOO_LONG"
        mock_analyze.assert_not_called()


def test_document_overlong_context_rejected():
    """Context exceeding 1000 characters is rejected before provider invocation."""
    txt_bytes = b"Valid document content."
    with patch.object(GeminiService, "analyze_document") as mock_analyze:
        response = client.post(
            "/api/analyze",
            data={"mode": "document", "context": "c" * 1001},
            files={"file": ("doc.txt", txt_bytes, "text/plain")},
        )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "CONTEXT_TOO_LONG"
        mock_analyze.assert_not_called()


# ============================================================================
# E. Provider Failure Error Mapping & Secret Isolation
# ============================================================================

def test_document_missing_api_key_returns_safe_503(monkeypatch):
    """Missing API key returns 503 without leaking keys."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    txt_bytes = b"Valid document text."

    response = client.post(
        "/api/analyze",
        data={"mode": "document"},
        files={"file": ("doc.txt", txt_bytes, "text/plain")},
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "MODEL_UNAVAILABLE"
    assert "api_key" not in response.text


@pytest.mark.asyncio
async def test_document_provider_timeout_returns_safe_504():
    """Provider timeout returns 504 MODEL_TIMEOUT."""
    service = GeminiService(api_key="test_key")
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=TimeoutError("Request timed out"))

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await service.analyze_document(
                extracted_text="Some document text",
                question="What is this?",
            )
        assert exc_info.value.status_code == 504
        assert exc_info.value.detail["code"] == "MODEL_TIMEOUT"


@pytest.mark.asyncio
async def test_document_provider_auth_error_returns_safe_502():
    """Provider 401/403 returns 502 MODEL_UNAVAILABLE."""
    service = GeminiService(api_key="test_key")
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(
        side_effect=errors.APIError(401, "API_KEY_INVALID", {})
    )

    with patch.object(service, "_get_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await service.analyze_document(extracted_text="Some document text")
        assert exc_info.value.status_code == 502
        assert exc_info.value.detail["code"] == "MODEL_UNAVAILABLE"


def test_document_malformed_json_rejected():
    """Malformed non-JSON output returns 502 MODEL_OUTPUT_INVALID."""
    service = GeminiService(api_key="test_key")
    with pytest.raises(Exception) as exc_info:
        service._parse_and_validate_document_output("Broken JSON { invalid")
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["code"] == "MODEL_OUTPUT_INVALID"


def test_document_missing_required_fields_rejected():
    """Missing required 'summary' returns 502 MODEL_OUTPUT_INVALID."""
    service = GeminiService(api_key="test_key")
    invalid_data = json.dumps({"document_title": "Title", "key_points": []})
    with pytest.raises(Exception) as exc_info:
        service._parse_and_validate_document_output(invalid_data)
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["code"] == "MODEL_OUTPUT_INVALID"


def test_document_provider_failure_never_creates_fake_success(monkeypatch):
    """Provider 500 failure never results in fabricated HTTP 200."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "mock_key")
    txt_bytes = b"Valid document text."

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(
        side_effect=errors.APIError(500, "Internal Server Error", {})
    )

    with patch.object(GeminiService, "_get_client", return_value=mock_client):
        response = client.post(
            "/api/analyze",
            data={"mode": "document"},
            files={"file": ("doc.txt", txt_bytes, "text/plain")},
        )
        assert response.status_code == 502
        assert response.json()["detail"]["code"] == "MODEL_UNAVAILABLE"
        assert "result" not in response.json()


# ============================================================================
# F. Grounding and Prompt Behavior
# ============================================================================

def test_document_prompt_contains_grounding_and_untrusted_rules():
    """Verify document prompt requires strict grounding and prompt injection defense."""
    prompt = build_document_prompt(extracted_text="Sample text content")
    prompt_lower = prompt.lower()

    # Grounding requirements
    assert "grounded" in prompt_lower
    assert "cannot be established" in prompt_lower or "not contained" in prompt_lower

    # Untrusted data / prompt injection defense
    assert "untrusted" in prompt_lower

    # Citations and quotations restrictions
    assert "citation" in prompt_lower or "page" in prompt_lower
    assert "invent" in prompt_lower


def test_document_prompt_incorporates_question_and_context():
    """Verify prompt builder properly embeds extracted text, user question, and context."""
    text = "Machine Learning System Log"
    q = "Why did loss diverge?"
    ctx = "Epoch 4 training run"
    warns = ["Document text exceeded limit and was truncated."]

    built = build_document_prompt(
        extracted_text=text,
        question=q,
        context=ctx,
        extraction_warnings=warns,
    )
    assert text in built
    assert q in built
    assert ctx in built
    assert warns[0] in built
