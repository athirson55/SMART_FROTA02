from pydantic import BaseModel, Field


class SystemSettingRead(BaseModel):
    id: str
    companyName: str
    timezone: str
    theme: str
    lowKmThreshold: int
    lowDaysThreshold: int
    emailNotifications: bool
    dashboardRefreshMinutes: int
    rawJson: str | None = None


class SystemSettingUpdate(BaseModel):
    companyName: str | None = Field(default=None, max_length=160)
    timezone: str | None = Field(default=None, max_length=80)
    theme: str | None = Field(default=None, max_length=40)
    lowKmThreshold: int | None = None
    lowDaysThreshold: int | None = None
    emailNotifications: bool | None = None
    dashboardRefreshMinutes: int | None = None
    rawJson: str | None = None
