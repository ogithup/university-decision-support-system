"use client";

import type { Route } from "next";
import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";

import { runScenario } from "../../lib/api";
import {
  AcademicPerformanceCenterResponse,
  DashboardSummaryResponse,
  FinanceSummaryResponse,
  ScenarioRunResponse,
} from "../../types/university";
import { AssistantPanel } from "./assistant-panel";
import styles from "./page.module.css";


const sidebarItems = [
  { id: "executive-summary", label: "Yonetici Ozeti" },
  { id: "academic-personnel", label: "Akademik Personel" },
  { id: "academic-performance", label: "Akademik Performans" },
  { id: "faculty-analysis", label: "Fakulte ve Bolum Analizi" },
  { id: "academic-collaboration", label: "Akademik Is Birlikleri" },
  { id: "finance-analysis", label: "Mali Analiz" },
  { id: "scenario-center", label: "Senaryo Merkezi" },
  { id: "risk-early-warning", label: "Risk ve Erken Uyarilar" },
  { id: "framework-indicators", label: "THE-QS-YOK Gostergeleri" },
  { id: "data-quality", label: "Veri Kalitesi" },
  { id: "settings", label: "Ayarlar" },
];

const scenarioPayloads: Record<string, { staff_growth_pct?: number; budget_change_pct?: number; scholarship_change_pct?: number }> = {
  student_growth: { staff_growth_pct: 8, budget_change_pct: 5 },
  tuition_scholarship: { scholarship_change_pct: 6, budget_change_pct: -3 },
  new_program: { staff_growth_pct: 12, budget_change_pct: 7 },
  economic_risk: { budget_change_pct: -8, scholarship_change_pct: 2 },
};

const configurableSections = [
  { id: "academic-performance-center", label: "Akademik Performans Merkezi" },
  { id: "academic-personnel", label: "Akademik Personel" },
  { id: "academic-performance", label: "Akademik Performans" },
  { id: "faculty-analysis", label: "Fakulte ve Bolum Analizi" },
  { id: "resource-strips", label: "Kaynak Gosterge Setleri" },
  { id: "program-sustainability", label: "Program Surdurulebilirlik" },
  { id: "strategic-monitoring", label: "Stratejik Izleme" },
  { id: "finance-analysis", label: "Mali Analiz" },
  { id: "benchmark-area", label: "Benchmark ve Karsilastirma" },
] as const;

const defaultVisibleSections = configurableSections.reduce<Record<string, boolean>>((acc, section) => {
  acc[section.id] = true;
  return acc;
}, {});

const defaultSectionSpans = configurableSections.reduce<Record<string, number>>((acc, section) => {
  acc[section.id] = 12;
  return acc;
}, {});

const sectionSizeLabels: Record<"wide" | "standard" | "compact", string> = {
  wide: "Genis",
  standard: "Standart",
  compact: "Kompakt",
};

function slugify(value: string) {
  return value.toLowerCase().replaceAll("%", "pct").replaceAll(" ", "-").replaceAll("_", "-").replaceAll("/", "-");
}

function isNegativeDelta(delta: string) {
  return delta.trim().startsWith("-");
}

function getInsightHref(kind: string, key: string): Route {
  return `/dashboard/insights/${kind}-${slugify(key)}` as Route;
}

function getStatusPulse(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "watch" || normalized === "medium") {
    return styles.pulseWatch;
  }
  if (normalized === "risk" || normalized === "high") {
    return styles.pulseRisk;
  }
  return "";
}

function MiniBars({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <div className={styles.miniBarChart}>
      {items.map((item) => (
        <div key={item.label} className={styles.miniBarRow}>
          <span>{item.label}</span>
          <div className={styles.miniBarTrack}>
            <div className={styles.miniBarFill} style={{ width: `${Math.min(100, item.value)}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}


function TrendColumns({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className={styles.trendColumns}>
      {items.map((item) => (
        <div key={item.label} className={styles.trendColumn}>
          <div
            className={styles.trendBar}
            style={{ height: `${Math.max(24, (item.value / max) * 180)}px` }}
            title={`${item.label}: ${item.value}`}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}


function MetricStrip({ title, items, prefix }: { title: string; items: DashboardSummaryResponse["kpis"]; prefix: string }) {
  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionLabel}>Gosterge Seti</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className={styles.metricStrip}>
        {items.map((kpi) => (
          <Link
            key={kpi.code}
            href={getInsightHref(`${prefix}-metric`, kpi.code)}
            className={`${styles.metricStripCard} ${styles.interactiveCard} ${isNegativeDelta(kpi.delta) ? styles.pulseWatch : ""}`}
          >
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.delta}</small>
          </Link>
        ))}
      </div>
    </article>
  );
}


export function DashboardClient({
  summary,
  finance,
  academicCenter,
}: {
  summary: DashboardSummaryResponse;
  finance: FinanceSummaryResponse;
  academicCenter: AcademicPerformanceCenterResponse;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scenarioResult, setScenarioResult] = useState<ScenarioRunResponse | null>(null);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(defaultVisibleSections);
  const [sectionSpans, setSectionSpans] = useState<Record<string, number>>(defaultSectionSpans);
  const [sectionRowSpans, setSectionRowSpans] = useState<Record<string, number>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    try {
      const savedVisible = globalThis.localStorage.getItem("dashboard-visible-sections");
      if (savedVisible) {
        const parsed = JSON.parse(savedVisible) as Record<string, boolean>;
        setVisibleSections({ ...defaultVisibleSections, ...parsed });
      }

      const savedSpans = globalThis.localStorage.getItem("dashboard-section-spans");
      if (savedSpans) {
        const parsed = JSON.parse(savedSpans) as Record<string, number>;
        setSectionSpans({ ...defaultSectionSpans, ...parsed });
      }
    } catch {
      setVisibleSections(defaultVisibleSections);
      setSectionSpans(defaultSectionSpans);
    }
  }, []);

  useEffect(() => {
    const rowUnit = 12;
    const rowGap = 18;
    const observer = new ResizeObserver((entries) => {
      setSectionRowSpans((current) => {
        const next = { ...current };
        let changed = false;

        for (const entry of entries) {
          const sectionId = entry.target.getAttribute("data-section-id");
          if (!sectionId) {
            continue;
          }
          const measuredHeight = entry.contentRect.height;
          const rowSpan = Math.max(18, Math.ceil((measuredHeight + rowGap) / (rowUnit + rowGap)));
          if (next[sectionId] !== rowSpan) {
            next[sectionId] = rowSpan;
            changed = true;
          }
        }

        return changed ? next : current;
      });
    });

    for (const section of configurableSections) {
      const node = sectionRefs.current[section.id];
      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [visibleSections, sectionSpans]);

  function toggleSection(sectionId: string) {
    setVisibleSections((current) => {
      const next = { ...current, [sectionId]: !current[sectionId] };
      globalThis.localStorage.setItem("dashboard-visible-sections", JSON.stringify(next));
      return next;
    });
  }

  function updateSectionSpan(sectionId: string, span: number) {
    setSectionSpans((current) => {
      const next = { ...current, [sectionId]: span };
      globalThis.localStorage.setItem("dashboard-section-spans", JSON.stringify(next));
      return next;
    });
  }

  async function handleScenarioRun(scenarioType: string) {
    setLoadingScenario(scenarioType);
    setScenarioError(null);
    try {
      const result = await runScenario({
        scenario_type: scenarioType,
        academic_year: summary.academic_year,
        ...scenarioPayloads[scenarioType],
      });
      setScenarioResult(result);
    } catch (error) {
      setScenarioError(error instanceof Error ? error.message : "Senaryo calistirilamadi.");
    } finally {
      setLoadingScenario(null);
    }
  }

  function getPresetSpan(preset: "compact" | "standard" | "wide") {
    if (preset === "compact") {
      return 4;
    }
    if (preset === "standard") {
      return 6;
    }
    return 12;
  }

  function getSpanLabel(span: number) {
    if (span <= 4) {
      return "compact";
    }
    if (span <= 8) {
      return "standard";
    }
    return "wide";
  }

  function renderSectionShell(sectionId: string, title: string, content: ReactNode) {
    const effectiveSpan = sectionSpans[sectionId] ?? 12;
    const activePreset = getSpanLabel(effectiveSpan);

    return (
      <div
        key={sectionId}
        id={sectionId}
        className={styles.layoutSection}
        data-section-id={sectionId}
        ref={(node) => {
          sectionRefs.current[sectionId] = node;
        }}
        style={{
          ["--section-span" as string]: effectiveSpan,
          ["--section-row-span" as string]: sectionRowSpans[sectionId] ?? 24,
        }}
      >
        {content}
      </div>
    );
  }

  const settingsPanel = (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionLabel}>Ayarlar</p>
          <h3>Kokpit Konfigurasyonu</h3>
        </div>
      </div>
      <div className={styles.settingsList}>
        <div className={styles.settingsControlCard}>
          <strong>Canli dashboard bilesenleri</strong>
          <small>Kullanici icin onemli bloklari dashboard'a ekleyin veya gizleyin.</small>
          <div className={styles.toggleGrid}>
            {configurableSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={visibleSections[section.id] ? styles.toggleOn : styles.toggleOff}
                onClick={() => toggleSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingsControlCard}>
          <strong>Blok boyut profilleri</strong>
          <small>Her dashboard blogu icin kompakt, standart veya genis yerlesim secin.</small>
          <div className={styles.sectionSizeList}>
            {configurableSections.map((section) => (
              <div key={section.id} className={styles.sectionSizeRow}>
                <span>{section.label}</span>
                <div className={styles.sizeControls}>
                  {(["compact", "standard", "wide"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={getSpanLabel(sectionSpans[section.id] ?? 12) === size ? styles.toggleOn : styles.toggleOff}
                      onClick={() => updateSectionSpan(section.id, getPresetSpan(size))}
                    >
                      {sectionSizeLabels[size]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.noteCard}>
          <strong>Gosterge agirliklari</strong>
          <small>Bolum bazli KPI agirliklari admin panelinden yonetilecek sekilde tasarlandi.</small>
        </div>
        <div className={styles.noteCard}>
          <strong>Veri yenileme profili</strong>
          <small>YOKSIS, dosya yukleme ve warehouse batch akislari ayri izleniyor.</small>
        </div>
      </div>
    </article>
  );

  const sectionRegistry: Record<string, { title: string; content: ReactNode }> = {
    "academic-performance-center": {
      title: "Akademik Performans Merkezi",
      content: (
        <section className={styles.performanceCenter}>
          <div className={styles.performanceCenterHeader}>
            <div>
              <p className={styles.sectionLabel}>Akademik Performans Merkezi</p>
              <h3>Akademik uretkenlik, proje ve stratejik hedef gorunumu</h3>
            </div>
            <span className={styles.centerMeta}>
              {academicCenter.source_mode === "warehouse_live" ? "Canli warehouse akisi" : "Mock fallback modu"}
            </span>
          </div>
          <div className={styles.compactKpiGrid}>
            {academicCenter.metrics.map((kpi) => (
              <Link
                key={kpi.code}
                href={getInsightHref("metric", kpi.code)}
                className={`${styles.kpiCard} ${styles.interactiveCard} ${getStatusPulse(kpi.status)}`}
              >
                <p>{kpi.label}</p>
                <h3>{kpi.value}</h3>
                <div className={styles.kpiMeta}>
                  <span>{kpi.delta}</span>
                  <span className={styles[`status_${kpi.status}`]}>{kpi.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ),
    },
    "academic-personnel": {
      title: "Akademik Personel",
      content: (
        <section className={styles.primaryGrid}>
          <article className={`${styles.panel} ${styles.heroPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Trend</p>
                <h3>Yillik Yayin Egilimi</h3>
              </div>
              <span>2022-2026</span>
            </div>
            <TrendColumns items={summary.publication_trend} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Karsilastirma</p>
                <h3>Fakulte Performans Skorlari</h3>
              </div>
            </div>
            <MiniBars items={summary.faculty_scores} />
          </article>

          <article id="risk-early-warning" className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Risk</p>
                <h3>Kritik Uyarilar</h3>
              </div>
            </div>
            <div className={styles.alertStack}>
              {summary.alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={getInsightHref("alert", alert.id)}
                  className={`${styles.alertCard} ${styles.interactiveCard} ${getStatusPulse(alert.level)}`}
                >
                  <div className={styles.alertHeader}>
                    <span className={styles[`level_${alert.level.toLowerCase()}`]}>{alert.level}</span>
                    <strong>{alert.owner}</strong>
                  </div>
                  <p>{alert.title}</p>
                  <small>{alert.action}</small>
                </Link>
              ))}
            </div>
          </article>
        </section>
      ),
    },
    "academic-performance": {
      title: "Akademik Performans",
      content: (
        <section className={styles.secondaryGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Ogrenci Analizi</p>
                <h3>Toplam Ogrenci Degisim Trendi</h3>
              </div>
            </div>
            <TrendColumns items={summary.student_trend} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Programlar</p>
                <h3>Doluluk Orani Trendi</h3>
              </div>
            </div>
            <MiniBars items={summary.occupancy_trend} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Mezuniyet</p>
                <h3>Mezuniyet Orani</h3>
              </div>
            </div>
            <MiniBars items={summary.graduation_trend} />
          </article>
        </section>
      ),
    },
    "faculty-analysis": {
      title: "Fakulte ve Bolum Analizi",
      content: (
        <section className={styles.secondaryGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Liderlik Tablosu</p>
                <h3>En Yuksek Performansli Akademisyenler</h3>
              </div>
              <span>Detay sayfasina gidin</span>
            </div>
            <div className={styles.leaderboard}>
              {summary.top_performers.map((person) => (
                <Link
                  key={person.academic_id}
                  href={getInsightHref("leader", person.academic_id)}
                  className={`${styles.leaderRow} ${styles.interactiveCard} ${person.change < 0 ? styles.pulseRisk : ""}`}
                >
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.title} | {person.department}</span>
                  </div>
                  <div className={styles.leaderMetrics}>
                    <strong>{person.score}</strong>
                    <span className={person.change < 0 ? styles.negativeDelta : ""}>{person.change >= 0 ? "+" : ""}{person.change}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article id="academic-collaboration" className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Dagilim</p>
                <h3>Akademik Cikti Turu</h3>
              </div>
            </div>
            <MiniBars items={summary.work_distribution} />
          </article>

          <article id="data-quality" className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Senkronizasyon</p>
                <h3>Veri Kaynagi Sagligi</h3>
              </div>
            </div>
            <div className={styles.sourceList}>
              {summary.source_health.map((source) => (
                <Link
                  key={source.source}
                  href={getInsightHref("source", source.source)}
                  className={`${styles.sourceRow} ${styles.interactiveCard} ${source.status.toLowerCase() === "watch" ? styles.pulseWatch : ""}`}
                >
                  <div>
                    <strong>{source.source}</strong>
                    <span>{source.detail}</span>
                  </div>
                  <div className={styles.sourceMeta}>
                    <strong>{source.status}</strong>
                    <small>{source.freshness}</small>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>
      ),
    },
    "resource-strips": {
      title: "Kaynak Gosterge Setleri",
      content: (
        <section className={styles.tertiaryGrid}>
          <MetricStrip title="Stratejik Egitim ve Ogrenci Gostergeleri" items={summary.student_metrics} prefix="student" />
          <MetricStrip title="Stratejik Mali Gostergeler" items={summary.finance_metrics} prefix="finance" />
          <MetricStrip title="Fiziksel Kaynak ve Kapasite Gostergeleri" items={summary.capacity_metrics} prefix="capacity" />
        </section>
      ),
    },
    "program-sustainability": {
      title: "Program Surdurulebilirlik",
      content: (
        <section className={styles.tertiaryGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Program Surdurulebilirlik</p>
                <h3>Program Karar Matrisi</h3>
              </div>
            </div>
            <div className={styles.programTable}>
              {summary.program_health.map((program) => (
                <div key={program.program_code} className={styles.programRow}>
                  <div>
                    <strong>{program.program_name}</strong>
                    <span>{program.action_label}</span>
                  </div>
                  <div className={styles.programMetrics}>
                    <span>Talep {program.demand_index}</span>
                    <span>Doluluk %{program.occupancy_rate}</span>
                    <span>Mezuniyet %{program.graduation_rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article id="framework-indicators" className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Benchmark</p>
                <h3>THE, QS ve YOK Hazirlik</h3>
              </div>
            </div>
            <MiniBars items={summary.readiness_scores} />
            <div className={styles.readinessNotes}>
              {summary.readiness_details.map((item) => (
                <div key={item.framework} className={styles.noteCard}>
                  <strong>{item.framework}</strong>
                  <span>Hazirlik %{item.data_readiness_pct} | Gap {item.benchmark_gap}</span>
                  <small>{item.note}</small>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Fiziksel Kaynak</p>
                <h3>Kapasite Kullanim Oranlari</h3>
              </div>
            </div>
            <MiniBars items={summary.capacity_utilization} />
          </article>
        </section>
      ),
    },
    "strategic-monitoring": {
      title: "Stratejik Izleme",
      content: (
        <section className={styles.tertiaryGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Stratejik Plan</p>
                <h3>Hedef Gerceklesme Izleme</h3>
              </div>
            </div>
            <div className={styles.goalList}>
              {summary.strategic_goals.map((goal) => (
                <div key={goal.code} className={styles.goalRow}>
                  <div>
                    <strong>{goal.title}</strong>
                    <span>{goal.owner}</span>
                  </div>
                  <div className={styles.goalMeta}>
                    <strong>{goal.current_value}</strong>
                    <small>Hedef {goal.target_value}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article id="scenario-center" className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Senaryo Merkezi</p>
                <h3>What-if Senaryo Kokpiti</h3>
              </div>
            </div>
            <div className={styles.scenarioList}>
              {summary.scenario_templates.map((scenario) => (
                <button
                  key={scenario.scenario_type}
                  type="button"
                  className={styles.scenarioActionCard}
                  onClick={() => void handleScenarioRun(scenario.scenario_type)}
                  disabled={loadingScenario !== null}
                >
                  <strong>{scenario.title}</strong>
                  <span>{scenario.key_driver}</span>
                  <small>{scenario.description}</small>
                  <em>
                    {loadingScenario === scenario.scenario_type ? "Calisiyor..." : "Senaryoyu Uygula"}
                  </em>
                </button>
              ))}
            </div>
            {scenarioError ? <p className={styles.errorText}>{scenarioError}</p> : null}
            {scenarioResult ? (
              <div className={styles.scenarioResult}>
                <div className={styles.resultHeader}>
                  <strong>{scenarioResult.title}</strong>
                  <span>{scenarioResult.scenario_id}</span>
                </div>
                <p>{scenarioResult.summary}</p>
                <div className={styles.resultGrid}>
                  <div className={styles.resultColumn}>
                    <h4>Baseline</h4>
                    {scenarioResult.baseline.map((kpi) => (
                      <div key={kpi.code} className={styles.resultRow}>
                        <span>{kpi.label}</span>
                        <strong>{kpi.value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className={styles.resultColumn}>
                    <h4>Projected</h4>
                    {scenarioResult.projected.map((kpi) => (
                      <div key={kpi.code} className={styles.resultRow}>
                        <span>{kpi.label}</span>
                        <strong>{kpi.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Risk Matrisi</p>
                <h3>Erken Uyari ve Kritik Riskler</h3>
              </div>
            </div>
            <div className={styles.riskList}>
              {summary.risk_matrix.map((risk) => (
                <div key={risk.risk_id} className={styles.noteCard}>
                  <strong>{risk.title}</strong>
                  <span>{risk.category} | P {risk.probability} | I {risk.impact}</span>
                  <small>{risk.mitigation}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      ),
    },
    "finance-analysis": {
      title: "Mali Analiz",
      content: (
        <section className={styles.financeSection}>
          <article className={`${styles.panel} ${styles.financePanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Mali Analiz</p>
                <h3>Sentetik Butce ve Gelir-Gider Gorunumu</h3>
              </div>
              <span>{finance.academic_year}</span>
            </div>
            <div className={styles.financeKpis}>
              {finance.kpis.map((kpi) => (
                <Link
                  key={kpi.label}
                  href={getInsightHref("finance-kpi", kpi.label)}
                  className={`${styles.financeKpiCard} ${styles.interactiveCard} ${getStatusPulse(kpi.status)}`}
                >
                  <strong>{kpi.label}</strong>
                  <span>{kpi.value}</span>
                  <small>{kpi.delta}</small>
                </Link>
              ))}
            </div>
            <div className={styles.financeCharts}>
              <div>
                <h4>Gelir Karmasi</h4>
                <MiniBars items={finance.revenue_mix} />
              </div>
              <div>
                <h4>Gider Karmasi</h4>
                <MiniBars items={finance.expense_mix} />
              </div>
              <div>
                <h4>Butce Sapmasi</h4>
                <MiniBars items={finance.budget_variance} />
              </div>
            </div>
          </article>
        </section>
      ),
    },
    "benchmark-area": {
      title: "Benchmark ve Karsilastirma",
      content: (
        <section className={styles.secondaryGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Karsilastirma</p>
                <h3>Universite Benchmark Skorlari</h3>
              </div>
            </div>
            <MiniBars items={summary.benchmark_comparison} />
          </article>
        </section>
      ),
    },
  };

  return (
    <main className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarTop}>
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={sidebarOpen ? "Menuyu daralt" : "Menuyu genislet"}
          >
            {sidebarOpen ? "<<" : ">>"}
          </button>
          {sidebarOpen ? (
            <div className={styles.brandBlock}>
              <p className={styles.sectionLabel}>ABU Strategic Cockpit</p>
              <h1>Karar Destek Merkezi</h1>
              <span>Ana dashboard ve stratejik kokpit</span>
            </div>
          ) : null}
        </div>

        <nav className={styles.navList}>
          {sidebarItems.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={index === 0 ? styles.activeNavItem : styles.navItem}
              title={item.label}
            >
              {sidebarOpen ? item.label : item.label.slice(0, 2)}
            </a>
          ))}
        </nav>

        {sidebarOpen ? (
          <div className={styles.sidebarNote}>
            <strong>Veri Kaynagi Durumu</strong>
            <p>Dashboard local warehouse ve mock YOKSIS akisiyla calisiyor.</p>
          </div>
        ) : null}
      </aside>

      <section className={styles.content}>
        <header id="executive-summary" className={styles.topbar}>
          <div>
            <p className={styles.sectionLabel}>Yonetici Gostergesi</p>
            <h2>Akademik Personel Performansi ve Stratejik Izleme Cockpit'i</h2>
            <p className={styles.topbarText}>
              Son senkron: {summary.last_sync} | Kritik uyari: {summary.critical_alert_count}
            </p>
          </div>
          <div className={styles.filterChips}>
            <span>{academicCenter.period || summary.academic_year}</span>
            <span>{academicCenter.faculty || summary.selected_faculty}</span>
            <span>{summary.selected_department}</span>
            <span>{academicCenter.source_mode === "warehouse_live" ? "Warehouse Live" : "Mock Fallback"}</span>
          </div>
        </header>

        <div className={styles.dashboardFlow}>
          {configurableSections
            .map((section) => section.id)
            .filter((sectionId) => visibleSections[sectionId])
            .map((sectionId) => renderSectionShell(sectionId, sectionRegistry[sectionId].title, sectionRegistry[sectionId].content))}

          <div id="settings" className={styles.layoutSection} style={{ ["--section-span" as string]: 12 }}>
            {settingsPanel}
          </div>
        </div>

        <AssistantPanel prompts={summary.assistant_prompts} />
      </section>
    </main>
  );
}
