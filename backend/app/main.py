"""FastAPI application entry point for OmniSolve."""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router as api_router
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="OmniSolve AI Unified Technical Analysis Platform Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Normalize FastAPI validation errors to standard contract."""
    # Extract first meaningful message
    errors = exc.errors()
    msg = errors[0].get("msg", "Validation error") if errors else "Validation error"
    loc = errors[0].get("loc", []) if errors else []
    field_name = loc[-1] if loc else "field"
    http_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
    return JSONResponse(
        status_code=http_422,
        content={
            "detail": {
                "code": "INVALID_REQUEST",
                "message": f"Invalid field '{field_name}': {msg}",
            }
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Normalize HTTPException responses to adhere to API contract."""
    if isinstance(exc.detail, dict) and "code" in exc.detail and "message" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
            }
        },
        headers=exc.headers,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch unhandled server errors without exposing stack traces or internal secrets."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred while processing the request.",
            }
        },
    )


# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint welcoming clients to OmniSolve."""
    return {
        "app": settings.APP_NAME,
        "service": settings.SERVICE_IDENTIFIER,
        "status": "online",
        "docs": "/docs",
    }
