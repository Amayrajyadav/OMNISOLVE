"""Document processing and text extraction service for PDF and TXT files."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional
from fastapi import HTTPException, status
import pymupdf

from app.config import settings


@dataclass
class DocumentExtractionResult:
    """Internal representation of extracted document content and metadata."""
    text: str
    doc_type: str
    total_pages: Optional[int] = None
    empty_pages: List[int] = field(default_factory=list)
    is_truncated: bool = False
    char_count: int = 0
    warnings: List[str] = field(default_factory=list)


class DocumentService:
    """Service responsible for memory-safe text extraction from PDF and TXT uploads."""

    @classmethod
    def extract_text(
        cls,
        file_bytes: bytes,
        filename: Optional[str] = None,
        max_chars: Optional[int] = None,
    ) -> DocumentExtractionResult:
        """
        Extracts text safely from file bytes based on detected file type.
        Applies character boundaries, discloses truncation, and handles unreadable pages.
        """
        limit = max_chars or settings.MAX_DOCUMENT_CHARS
        suffix = Path(filename).suffix.lower() if filename else ""

        is_pdf = suffix == ".pdf" or file_bytes[:1024].lstrip().startswith(b"%PDF")

        if is_pdf:
            return cls._extract_from_pdf(file_bytes, limit)
        else:
            return cls._extract_from_txt(file_bytes, limit)

    @classmethod
    def _extract_from_pdf(cls, file_bytes: bytes, max_chars: int) -> DocumentExtractionResult:
        """Extracts text page-by-page from PDF bytes using PyMuPDF."""
        try:
            doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_FILE",
                    "message": "Uploaded PDF is corrupt or could not be parsed.",
                },
            )

        if doc.is_encrypted:
            doc.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_FILE",
                    "message": "The uploaded PDF is encrypted or password-protected and cannot be read.",
                },
            )

        total_pages = len(doc)
        if total_pages == 0:
            doc.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DOCUMENT_TEXT_EMPTY",
                    "message": "The uploaded PDF document contains no pages.",
                },
            )

        page_texts: List[str] = []
        empty_pages: List[int] = []
        warnings: List[str] = []

        for p_idx in range(total_pages):
            page_num = p_idx + 1
            try:
                page = doc[p_idx]
                raw_page_text = page.get_text().strip()
                if raw_page_text:
                    page_texts.append(f"--- Page {page_num} ---\n{raw_page_text}\n")
                else:
                    empty_pages.append(page_num)
            except Exception:
                empty_pages.append(page_num)

        doc.close()

        if empty_pages:
            if len(empty_pages) == total_pages:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "DOCUMENT_TEXT_EMPTY",
                        "message": "The uploaded PDF contains no extractable text. Scanned documents requiring OCR are not supported in MVP.",
                    },
                )
            else:
                warnings.append(
                    f"Pages {empty_pages} contained no machine-readable text (may contain scanned images or diagrams without OCR)."
                )

        full_extracted_text = "\n".join(page_texts).strip()
        if not full_extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DOCUMENT_TEXT_EMPTY",
                    "message": "The uploaded PDF document contains no extractable text.",
                },
            )

        is_truncated = False
        original_length = len(full_extracted_text)
        if original_length > max_chars:
            full_extracted_text = full_extracted_text[:max_chars]
            is_truncated = True
            warnings.append(
                f"Document text exceeded limit of {max_chars} characters and was truncated (original length: {original_length} characters)."
            )

        return DocumentExtractionResult(
            text=full_extracted_text,
            doc_type="PDF",
            total_pages=total_pages,
            empty_pages=empty_pages,
            is_truncated=is_truncated,
            char_count=len(full_extracted_text),
            warnings=warnings,
        )

    @classmethod
    def _extract_from_txt(cls, file_bytes: bytes, max_chars: int) -> DocumentExtractionResult:
        """Extracts text safely from plain text bytes."""
        try:
            try:
                text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                text = file_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_FILE",
                    "message": "Uploaded text document could not be decoded safely.",
                },
            )

        stripped_text = text.strip()
        if not stripped_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DOCUMENT_TEXT_EMPTY",
                    "message": "The uploaded text file is empty or contains only whitespace.",
                },
            )

        is_truncated = False
        warnings: List[str] = []
        original_length = len(stripped_text)

        if original_length > max_chars:
            stripped_text = stripped_text[:max_chars]
            is_truncated = True
            warnings.append(
                f"Document text exceeded limit of {max_chars} characters and was truncated (original length: {original_length} characters)."
            )

        return DocumentExtractionResult(
            text=stripped_text,
            doc_type="TXT",
            total_pages=1,
            empty_pages=[],
            is_truncated=is_truncated,
            char_count=len(stripped_text),
            warnings=warnings,
        )
