"""Tests for chat endpoint and analysis_type frontend aliases."""

import io
from PIL import Image
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_test_image(format_name: str = "PNG") -> bytes:
    buffer = io.BytesIO()
    image = Image.new("RGB", (10, 10), color="blue")
    image.save(buffer, format=format_name)
    return buffer.getvalue()


def test_chat_endpoint_returns_200():
    """Verify POST /api/chat responds successfully with session_id and answer."""
    from unittest.mock import AsyncMock, patch
    from app.services.gemini_service import GeminiService

    with patch.object(GeminiService, "chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "Here is the step to fix the null pointer error: initialize state properly."

        response = client.post(
            "/api/chat",
            json={
                "session_id": "test_sess_123",
                "question": "How do I fix this null pointer error?",
                "analysis_type": "code_debugger",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "test_sess_123"
        assert "answer" in data
        assert isinstance(data["answer"], str)
        assert "null pointer" in data["answer"]


def test_chat_endpoint_auto_generates_session_id_if_omitted():
    """Verify POST /api/chat generates session_id if client omitted it."""
    from unittest.mock import AsyncMock, patch
    from app.services.gemini_service import GeminiService

    with patch.object(GeminiService, "chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "Operating voltage is typically 3.3V or 5V."

        response = client.post(
            "/api/chat",
            json={
                "question": "What is the recommended operating voltage?",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["session_id"].startswith("sess_")
        assert "Operating voltage" in data["answer"]


def test_analyze_with_analysis_type_alias():
    """Verify frontend alias 'code_debugger' is accepted without 'mode'."""
    from unittest.mock import AsyncMock, patch
    from app.schemas import ScreenshotResult
    from app.services.gemini_service import GeminiService

    png_bytes = create_test_image("PNG")
    mock_result = {
        "issue_type": "SyntaxError",
        "summary": "Unexpected token",
        "observed_evidence": ["Line 4: unexpected token"],
        "likely_causes": [{"cause": "Missing semicolon", "rationale": "Parser error", "confidence": "high"}],
        "debugging_steps": ["Add semicolon"],
        "verification_steps": ["Re-run code"],
        "confidence": "high",
        "limitations": [],
    }

    with patch.object(GeminiService, "analyze_screenshot", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = ScreenshotResult.model_validate(mock_result)

        response = client.post(
            "/api/analyze",
            data={"analysis_type": "code_debugger"},
            files={"file": ("error.png", png_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "screenshot"
        assert data["summary"] == "Unexpected token"
        assert "session_id" in data
