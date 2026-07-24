from pydantic import BaseModel


class DashboardCard(BaseModel):
    id: str
    title: str
    value: str
    subtitle: str
    risk_level: str


class ChartSeriesPoint(BaseModel):
    label: str
    value: float


class DashboardChart(BaseModel):
    id: str
    title: str
    chart_type: str
    series: list[ChartSeriesPoint]


class ExecutiveDashboardResponse(BaseModel):
    cards: list[DashboardCard]
    charts: list[DashboardChart]
    alerts: list[str]

