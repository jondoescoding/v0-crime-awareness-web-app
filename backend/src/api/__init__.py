"""API routers for the backend service."""

from fastapi import FastAPI

from api.wanted_persons import router as wanted_persons_router
from core import get_logger


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    logger = get_logger(__name__)
    app = FastAPI(title="Wanted Persons API", version="0.1.0")
    app.include_router(wanted_persons_router)
    logger.info("FastAPI application initialized")
    return app


app = create_app()
