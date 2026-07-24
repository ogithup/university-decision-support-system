from fastapi import APIRouter

from app.api.v1.endpoints import (
    academics,
    dashboard,
    health,
    integrations,
    kpis,
    mock_yoksis,
    organization,
    support,
)


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(mock_yoksis.router, prefix="/mock/yoksis", tags=["mock-yoksis"])
api_router.include_router(academics.router, tags=["academics"])
api_router.include_router(organization.router, tags=["organization"])
api_router.include_router(support.router, tags=["support"])
api_router.include_router(kpis.router, prefix="/kpis", tags=["kpis"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
