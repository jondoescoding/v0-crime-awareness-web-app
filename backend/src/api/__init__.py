"""API routers for the backend service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.reports import router as reports_router
from api.chat import router as chat_router
from api.wanted_persons import router as wanted_persons_router
from core import get_logger


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    logger = get_logger(__name__)
    app = FastAPI(title="Wanted Persons API", version="0.1.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(wanted_persons_router)
    app.include_router(reports_router)
    app.include_router(chat_router)
    logger.info("FastAPI application initialized")
    return app


app = create_app()
