"""Backend entrypoint to launch FastAPI application."""

from __future__ import annotations

import uvicorn

from api import app


def main() -> None:
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
    main()
