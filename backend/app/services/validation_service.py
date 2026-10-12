"""Validation service for uploads, modes, and input parameters."""

import io
from pathlib import Path
from typing import Optional, Tuple
from fastapi import HTTPException
from PIL import Image
import pymupdf

from app.config import settings
from app.schemas import AnalysisMode

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".txt"}


class UploadValidationService:
    """Validates files, modes, and parameters prior to any AI model interaction."""

    @staticmethod
    def validate_mode(mode_str: str) -> AnalysisMode:
        """Validate that the requested mode is a supported AnalysisMode."""
        if not mode_str or not isinstance(mode_str, str):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "INVALID_MODE",
                    "message": f"Invalid analysis mode '{mode_str}'. Supported modes: screenshot, circuit, document.",
                },
            )
        normalized = mode_str.lower().strip()
        alias_map = {
            "code_debugger": AnalysisMode.SCREENSHOT,
            "circuit_analyzer": AnalysisMode.CIRCUIT,
            "document_explainer": AnalysisMode.DOCUMENT,
        }
        if normalized in alias_map:
            return alias_map[normalized]
        try:
            return AnalysisMode(normalized)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "INVALID_MODE",
                    "message": f"Invalid analysis mode '{mode_str}'. Supported modes: screenshot, circuit, document.",
                },
            )

    @staticmethod
    def validate_text_inputs(
        context: Optional[str] = None,
        question: Optional[str] = None,
    ) -> None:
        """Enforce maximum lengths on context and question strings."""
        max_chars = settings.MAX_TEXT_INPUT_CHARS
        if context is not None and len(context) > max_chars:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "CONTEXT_TOO_LONG",
                    "message": f"Context exceeds maximum allowed length of {max_chars} characters.",
                },
            )
        if question is not None and len(question) > max_chars:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "QUESTION_TOO_LONG",
                    "message": f"Question exceeds maximum allowed length of {max_chars} characters.",
                },
            )

    @staticmethod
    def validate_file_size(file_bytes: bytes) -> None:
        """Ensure file size does not exceed the configured maximum threshold."""
        max_bytes = settings.max_upload_bytes
        if len(file_bytes) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail={
                    "code": "FILE_TOO_LARGE",
                    "message": f"Uploaded file size ({len(file_bytes)} bytes) exceeds the maximum limit of {settings.MAX_UPLOAD_MB}MB.",
                },
            )

    @classmethod
    def validate_content(
        cls,
        mode: AnalysisMode,
        filename: Optional[str],
        file_bytes: bytes,
    ) -> Tuple[str, dict]:
        """
        Validate file extension and actual file content bytes for the given mode.
        Returns a tuple of (detected_content_type, metadata_dict).
        """
        # 1. Enforce size limit
        cls.validate_file_size(file_bytes)

        # 2. Check for empty file
        if len(file_bytes) == 0:
            if mode == AnalysisMode.DOCUMENT:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "DOCUMENT_TEXT_EMPTY",
                        "message": "The uploaded document is empty.",
                    },
                )
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "INVALID_FILE",
                    "message": "The uploaded file is empty.",
                },
            )

        suffix = Path(filename).suffix.lower() if filename else ""

        # 3. Route validation based on mode
        if mode in (AnalysisMode.SCREENSHOT, AnalysisMode.CIRCUIT):
            return cls._validate_image(mode, suffix, file_bytes)
        elif mode == AnalysisMode.DOCUMENT:
            return cls._validate_document(suffix, file_bytes)
        else:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "INVALID_MODE",
                    "message": f"Unsupported analysis mode: {mode}",
                },
            )

    @classmethod
    def _validate_image(
        cls,
        mode: AnalysisMode,
        suffix: str,
        file_bytes: bytes,
    ) -> Tuple[str, dict]:
        """Validate images using extension checks and Pillow byte inspection."""
        if suffix and suffix not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail={
                    "code": "UNSUPPORTED_FILE",
                    "message": f"File extension '{suffix}' is not supported for {mode.value} analysis. Allowed: PNG, JPG, JPEG.",
                },
            )

        try:
            image_stream = io.BytesIO(file_bytes)
            with Image.open(image_stream) as img:
                img_format = img.format
                if img_format not in ("PNG", "JPEG"):
                    raise HTTPException(
                        status_code=415,
                        detail={
                            "code": "UNSUPPORTED_FILE",
                            "message": f"Detected image format '{img_format}' is not supported. Allowed: PNG, JPEG.",
                        },
                    )
                img.verify()
                width, height = img.size
                mime_type = "image/png" if img_format == "PNG" else "image/jpeg"
                return mime_type, {
                    "format": img_format,
                    "width": width,
                    "height": height,
                    "size_bytes": len(file_bytes),
                }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "INVALID_FILE",
                    "message": "Uploaded image is corrupt or could not be decoded.",
                },
            )

    @classmethod
    def _validate_document(
        cls,
        suffix: str,
        file_bytes: bytes,
    ) -> Tuple[str, dict]:
        """Validate documents (PDF or TXT) via magic bytes and parser verification."""
        if suffix and suffix not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail={
                    "code": "UNSUPPORTED_FILE",
                    "message": f"File extension '{suffix}' is not supported for document analysis. Allowed: PDF, TXT.",
                },
            )

        # Check if PDF
        is_pdf = suffix == ".pdf" or file_bytes[:1024].lstrip().startswith(b"%PDF")
        if is_pdf:
            try:
                doc = pymupdf.open(stream=file_bytes, filetype="pdf")
                page_count = len(doc)
                if page_count == 0:
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "code": "DOCUMENT_TEXT_EMPTY",
                            "message": "The uploaded PDF document contains no pages.",
                        },
                    )
                return "application/pdf", {
                    "format": "PDF",
                    "pages": page_count,
                    "size_bytes": len(file_bytes),
                }
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "INVALID_FILE",
                        "message": "Uploaded PDF is corrupt or invalid.",
                    },
                )

        # Otherwise validate as TXT
        if b"\x00" in file_bytes:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "INVALID_FILE",
                    "message": "Uploaded file appears to be binary data and is not a valid text document.",
                },
            )

        try:
            try:
                decoded_text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                decoded_text = file_bytes.decode("latin-1")

            if not decoded_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "DOCUMENT_TEXT_EMPTY",
                        "message": "The uploaded text file is empty or contains only whitespace.",
                    },
                )
            return "text/plain", {
                "format": "TXT",
                "char_count": len(decoded_text),
                "size_bytes": len(file_bytes),
            }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "INVALID_FILE",
                    "message": "Uploaded text file could not be decoded.",
                },
            )
