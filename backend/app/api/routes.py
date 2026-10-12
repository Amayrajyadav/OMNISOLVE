"""API route endpoints for OmniSolve."""

from typing import List, Optional
import uuid
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.config import settings
from app.schemas import (
    AnalysisEnvelope,
    AnalysisMode,
    ChatRequest,
    ChatResponse,
    CircuitAnalysisResponse,
    DocumentAnalysisResponse,
    HealthResponse,
    ScreenshotAnalysisResponse,
)
from app.services.document_service import DocumentService
from app.services.gemini_service import GeminiService
from app.services.validation_service import UploadValidationService

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check endpoint",
    description="Confirms that the OmniSolve backend service is operational.",
)
async def health_check() -> HealthResponse:
    """
    Returns operational health status.
    Strictly verifies process health without exposing API keys, models, or internal configs.
    """
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_IDENTIFIER,
        model_available=has_key,
        provider=settings.GEMINI_MODEL,
    )


@router.post(
    "/analyze",
    response_model=AnalysisEnvelope,
    status_code=status.HTTP_200_OK,
    summary="Analyze uploaded screenshot, circuit, or document",
    description="Validates upload and delegates to mode-specific analysis.",
)
async def analyze_content(
    mode: Optional[str] = Form(None, description="Analysis mode: screenshot, circuit, or document"),
    analysis_type: Optional[str] = Form(None, description="Analysis mode alias from frontend"),
    file: Optional[UploadFile] = File(None, description="File to analyze"),
    files: Optional[List[UploadFile]] = File(None, description="Multi-file list"),
    context: Optional[str] = Form(None, description="Optional supplementary context"),
    question: Optional[str] = Form(None, description="Optional question for analysis"),
):
    """
    Unified analysis endpoint.
    1. Validates requested mode (supports both 'mode' and 'analysis_type').
    2. Validates string length bounds.
    3. Validates file size, extensions, and byte content without persisting to disk.
    4. Rejects invalid inputs before any external AI provider interaction.
    5. Dispatches to mode-specific provider analysis.
    """
    HTTP_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)

    # 1. Mode parameter validation
    requested_mode_str = mode if mode is not None else analysis_type
    if requested_mode_str is None:
        raise HTTPException(
            status_code=HTTP_422,
            detail={
                "code": "INVALID_REQUEST",
                "message": "Invalid field 'mode': Field required",
            },
        )

    validated_mode = UploadValidationService.validate_mode(requested_mode_str)

    # 2. File parameter validation
    target_file = file
    if target_file is None and files and len(files) > 0:
        target_file = files[0]

    if target_file is None:
        raise HTTPException(
            status_code=HTTP_422,
            detail={
                "code": "INVALID_REQUEST",
                "message": "Invalid field 'file': Field required",
            },
        )

    # 3. Text input validation
    UploadValidationService.validate_text_inputs(context=context, question=question)

    # 4. Read file bytes safely into memory
    file_bytes = await target_file.read()

    # 5. Content and format validation
    content_type, metadata = UploadValidationService.validate_content(
        mode=validated_mode,
        filename=target_file.filename,
        file_bytes=file_bytes,
    )

    session_id = f"sess_{uuid.uuid4().hex[:16]}"

    # 6. Route dispatch
    if validated_mode == AnalysisMode.SCREENSHOT:
        gemini_service = GeminiService()
        result = await gemini_service.analyze_screenshot(
            image_bytes=file_bytes,
            mime_type=content_type,
            context=context,
        )
        return ScreenshotAnalysisResponse(
            mode=AnalysisMode.SCREENSHOT,
            result=result,
            warnings=[],
            session_id=session_id,
            analysis_type="code_debugger",
            summary=result.summary,
        )

    elif validated_mode == AnalysisMode.CIRCUIT:
        gemini_service = GeminiService()
        result = await gemini_service.analyze_circuit(
            image_bytes=file_bytes,
            mime_type=content_type,
            context=context,
            question=question,
        )
        return CircuitAnalysisResponse(
            mode=AnalysisMode.CIRCUIT,
            result=result,
            warnings=[],
            session_id=session_id,
            analysis_type="circuit_analyzer",
            summary=result.overview,
        )

    elif validated_mode == AnalysisMode.DOCUMENT:
        # Extract text safely in-memory using PyMuPDF / text decoder
        extraction = DocumentService.extract_text(
            file_bytes=file_bytes,
            filename=target_file.filename,
        )

        gemini_service = GeminiService()
        result = await gemini_service.analyze_document(
            extracted_text=extraction.text,
            question=question,
            context=context,
            extraction_warnings=extraction.warnings,
        )

        # Merge extraction disclosures into response envelope warnings
        response_warnings = list(extraction.warnings)
        for w in result.warnings:
            if w not in response_warnings:
                response_warnings.append(w)

        return DocumentAnalysisResponse(
            mode=AnalysisMode.DOCUMENT,
            result=result,
            warnings=response_warnings,
            session_id=session_id,
            analysis_type="document_explainer",
            summary=result.summary,
        )


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Contextual follow-up chat",
    description="Responds to conversational questions pinned to an analysis session.",
)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    """
    Contextual chat endpoint.
    Passes questions and session context to Gemma 4 / Gemini model.
    """
    session_id = payload.session_id or f"sess_{uuid.uuid4().hex[:16]}"
    gemini_service = GeminiService()
    answer = await gemini_service.chat(
        question=payload.question,
        context=payload.context,
        analysis_type=payload.analysis_type,
    )
    return ChatResponse(
        session_id=session_id,
        answer=answer,
    )
