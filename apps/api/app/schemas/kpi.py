from pydantic import BaseModel


class KpiCatalogItem(BaseModel):
    code: str
    name: str
    category: str
    unit_of_measure: str
    owner_module: str
    formula: str
    frequency: str


class KpiSummaryCard(BaseModel):
    code: str
    title: str
    value: str
    change_label: str
    trend: str
    risk_level: str

