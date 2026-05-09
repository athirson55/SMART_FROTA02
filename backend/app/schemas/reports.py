from datetime import datetime

from pydantic import BaseModel


class ReportPayload(BaseModel):
    generatedAt: datetime
    summary: dict
    items: list[dict]
