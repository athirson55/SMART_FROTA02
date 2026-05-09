from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class SimpleRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, paths: set[str], limit: int, window_seconds: int = 60):
        super().__init__(app)
        self.paths = paths
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits = defaultdict(deque)
        self._lock = Lock()

    async def dispatch(self, request: Request, call_next):
        if request.url.path not in self.paths:
            return await call_next(request)

        client_ip = request.client.host if request.client else "anonymous"
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=self.window_seconds)

        with self._lock:
            bucket = self._hits[(client_ip, request.url.path)]
            while bucket and bucket[0] < window_start:
                bucket.popleft()
            if len(bucket) >= self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "message": "Muitas tentativas. Tente novamente em instantes.", "data": None},
                )
            bucket.append(now)

        return await call_next(request)
