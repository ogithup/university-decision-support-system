from fastapi import APIRouter

from app.schemas.kpi import KpiCatalogItem, KpiSummaryCard
from app.services.kpi.registry import KPI_CATALOG, build_kpi_summary_cards


router = APIRouter()


@router.get("/catalog", response_model=list[KpiCatalogItem])
def get_kpi_catalog() -> list[KpiCatalogItem]:
    return [KpiCatalogItem(**item) for item in KPI_CATALOG]


@router.get("/summary", response_model=list[KpiSummaryCard])
def get_kpi_summary() -> list[KpiSummaryCard]:
    return build_kpi_summary_cards()

