from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Smart Frota API", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(
        default="postgresql+psycopg2://smartfrota:smartfrota@localhost:5432/smartfrota",
        alias="DATABASE_URL",
    )
    secret_key: str = Field(default="change-me", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://localhost:4173",
        alias="CORS_ORIGINS",
    )
    auto_create_tables: bool = Field(default=True, alias="AUTO_CREATE_TABLES")
    seed_on_startup: bool = Field(default=True, alias="SEED_ON_STARTUP")
    rate_limit_auth: str = Field(default="10/minute", alias="RATE_LIMIT_AUTH")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
