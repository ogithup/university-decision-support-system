from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "University Decision Support API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:3000"]
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "university_dss"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    yoksis_base_url: str | None = None
    yoksis_api_key: str | None = None
    yoksis_username: str | None = None
    yoksis_password: str | None = None
    yoksis_mock_enabled: bool = True
    yoksis_mock_auth_type: str = "api_key"
    yoksis_mock_api_key: str = "mock-yoksis-key"
    yoksis_mock_username: str = "mock-user"
    yoksis_mock_password: str = "mock-pass"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
