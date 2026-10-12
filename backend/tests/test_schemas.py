"""Tests for Pydantic response and error schemas."""

import pytest
from pydantic import ValidationError

from app.schemas import (
    AnalysisMode,
    CircuitAnalysisResponse,
    CircuitResult,
    ConfidenceLevel,
    DocumentAnalysisResponse,
    DocumentResult,
    ErrorDetail,
    ErrorResponse,
    HealthResponse,
    ImportantTerm,
    LikelyCause,
    PossibleIssue,
    ScreenshotAnalysisResponse,
    ScreenshotResult,
    VisibleComponent,
)


def test_confidence_level_values():
    """Verify supported qualitative confidence values."""
    assert ConfidenceLevel.LOW == "low"
    assert ConfidenceLevel.MEDIUM == "medium"
    assert ConfidenceLevel.HIGH == "high"

    with pytest.raises(ValueError):
        ConfidenceLevel("very_high")


def test_screenshot_result_schema_valid():
    """Verify ScreenshotResult schema with valid fields."""
    result = ScreenshotResult(
        issue_type="ImportError",
        summary="Module not found during runtime execution.",
        observed_evidence=["Traceback indicates No module named 'fastapi'"],
        likely_causes=[
            LikelyCause(
                cause="The package is not installed in the active environment.",
                rationale="The traceback indicates an unresolved import.",
                confidence=ConfidenceLevel.HIGH,
            )
        ],
        debugging_steps=["Activate virtual environment", "Run pip install fastapi"],
        verification_steps=["Run python -c 'import fastapi'"],
        confidence=ConfidenceLevel.HIGH,
        limitations=["Screenshot does not reveal the active virtualenv path."],
    )
    assert result.issue_type == "ImportError"
    assert len(result.likely_causes) == 1
    assert result.confidence == ConfidenceLevel.HIGH

    # Envelope validation
    envelope = ScreenshotAnalysisResponse(result=result, warnings=[])
    assert envelope.mode == AnalysisMode.SCREENSHOT
    assert envelope.result.issue_type == "ImportError"


def test_screenshot_result_schema_missing_required():
    """Verify ScreenshotResult rejects missing required fields."""
    with pytest.raises(ValidationError):
        # Missing confidence and summary
        ScreenshotResult(
            issue_type="SyntaxError",
            observed_evidence=[],
        )


def test_circuit_result_schema_valid():
    """Verify CircuitResult schema with valid fields."""
    result = CircuitResult(
        overview="555 Timer Astable Multivibrator circuit.",
        visible_components=[
            VisibleComponent(
                name="IC 555",
                visible_label="NE555P",
                notes="Standard 8-pin DIP package.",
            ),
            VisibleComponent(
                name="Resistor",
                visible_label="R1 10k",
                notes="Connected between VCC and pin 7.",
            ),
        ],
        connections=["Pin 1 connected to GND", "Pin 8 connected to +5V"],
        possible_issues=[
            PossibleIssue(
                issue="Pin 4 (Reset) appears unconnected or floating.",
                evidence="Trace from pin 4 does not terminate at VCC.",
                confidence=ConfidenceLevel.MEDIUM,
            )
        ],
        suggested_checks=["Measure DC voltage on pin 4 with a multimeter."],
        safety_notes=["Low DC voltage circuit, safe for breadboard testing."],
        limitations=["Component values on C1 are partially illegible."],
    )
    assert result.overview.startswith("555 Timer")
    assert len(result.visible_components) == 2
    assert result.possible_issues[0].confidence == ConfidenceLevel.MEDIUM

    # Envelope validation
    envelope = CircuitAnalysisResponse(result=result)
    assert envelope.mode == AnalysisMode.CIRCUIT
    assert envelope.warnings == []


def test_document_result_schema_valid():
    """Verify DocumentResult schema with valid fields."""
    result = DocumentResult(
        document_title="Technical Requirements Specification",
        summary="A comprehensive architectural overview of OmniSolve platform.",
        key_points=["Unified 3-mode workflow", "Gemma 4 model integration", "Strict security boundaries"],
        important_terms=[
            ImportantTerm(
                term="Multivibrator",
                explanation="An electronic circuit used to implement a two-state system.",
            )
        ],
        answer="The document outlines 3 modes for the MVP.",
        source_notes=["Section 2, Page 4"],
        warnings=["Text truncated after 30,000 characters."],
        limitations=["Scanned diagrams could not be OCR-processed."],
    )
    assert result.document_title == "Technical Requirements Specification"
    assert len(result.key_points) == 3
    assert len(result.important_terms) == 1

    # Envelope validation
    envelope = DocumentAnalysisResponse(result=result, warnings=["Notice: truncated"])
    assert envelope.mode == AnalysisMode.DOCUMENT
    assert len(envelope.warnings) == 1


def test_error_envelope_schema():
    """Verify ErrorResponse conforms to the error envelope defined in API_CONTRACT.md."""
    err = ErrorResponse(
        detail=ErrorDetail(
            code="UNSUPPORTED_FILE",
            message="This file type is not supported for the selected mode.",
        )
    )
    dumped = err.model_dump()
    assert dumped == {
        "detail": {
            "code": "UNSUPPORTED_FILE",
            "message": "This file type is not supported for the selected mode.",
        }
    }
