from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.settings import SystemSetting


def get_or_create_settings(db: Session) -> SystemSetting:
    settings = db.scalar(select(SystemSetting).order_by(SystemSetting.created_at.asc()))
    if settings:
        return settings
    settings = SystemSetting()
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def serialize_settings(settings: SystemSetting) -> dict:
    return {
        "id": settings.id,
        "companyName": settings.company_name,
        "timezone": settings.timezone,
        "theme": settings.theme,
        "lowKmThreshold": settings.low_km_threshold,
        "lowDaysThreshold": settings.low_days_threshold,
        "emailNotifications": settings.email_notifications,
        "dashboardRefreshMinutes": settings.dashboard_refresh_minutes,
        "rawJson": settings.raw_json,
        "createdAt": settings.created_at,
        "updatedAt": settings.updated_at,
    }


def update_settings(settings: SystemSetting, data: dict) -> SystemSetting:
    mapping = {
        "companyName": "company_name",
        "timezone": "timezone",
        "theme": "theme",
        "lowKmThreshold": "low_km_threshold",
        "lowDaysThreshold": "low_days_threshold",
        "emailNotifications": "email_notifications",
        "dashboardRefreshMinutes": "dashboard_refresh_minutes",
        "rawJson": "raw_json",
    }
    for key, value in data.items():
        field = mapping.get(key)
        if field is not None:
            setattr(settings, field, value)
    return settings
