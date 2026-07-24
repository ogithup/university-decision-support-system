"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  AcademicPerformanceCenterResponse,
  DashboardSummaryResponse,
  FinanceSummaryResponse,
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
  acc[section.id] = !["resource-strips", "strategic-monitoring"].includes(section.id);
  return acc;
}, {});

const defaultSectionSpans = configurableSections.reduce<Record<string, number>>((acc, section) => {
  const map: Record<string, number> = {
    "academic-performance-center": 12,
    "academic-personnel": 6,
    "academic-performance": 3,
    "faculty-analysis": 3,
    "resource-strips": 12,
    "program-sustainability": 12,
    "strategic-monitoring": 12,
    "finance-analysis": 7,
    "benchmark-area": 5,
  };
  acc[section.id] = map[section.id] ?? 12;
  return acc;
}, {});

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
  const linePath = items
    .map((item, index) => {
      const x = 48 + index * 94;
      const y = 210 - (item.value / max) * 150;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className={styles.trendColumns}>
      <svg viewBox="0 0 520 240" className={styles.trendSvg} role="img" aria-label="Combo trend">
        <defs>
          <linearGradient id="dashboardTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffc85a" />
            <stop offset="100%" stopColor="#7ec1ff" />
          </linearGradient>
        </defs>
        {items.map((item, index) => {
          const x = 24 + index * 94;
          const barHeight = Math.max(34, (item.value / max) * 150);
          const y = 210 - barHeight;
          const lineY = 210 - (item.value / max) * 150;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={48} height={barHeight} rx={18} className={styles.trendBar} fill="url(#dashboardTrendGradient)" />
              <circle cx={x + 24} cy={lineY} r={5} className={styles.trendMarker} />
              <text x={x + 24} y={232} textAnchor="middle" className={styles.trendAxisLabel}>{item.label}</text>
            </g>
          );
        })}
        <path d={linePath} className={styles.trendLine} />
      </svg>
    </div>
  );
}


function ScoreMatrix({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className={styles.scoreMatrix}>
      {items.map((item) => (
        <div key={item.label} className={styles.scoreMatrixRow}>
          <div>
            <strong>{item.label}</strong>
          </div>
          <div className={styles.scoreMatrixTrack}>
            <div className={styles.scoreMatrixFill} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function RiskMetricRail({ items }: { items: AcademicPerformanceCenterResponse["metrics"] }) {
  const filtered = items.filter((item) => item.status !== "healthy");
  return (
    <div className={styles.riskMetricRail}>
      {filtered.map((item) => (
        <Link
          key={item.code}
          href={getInsightHref("metric", item.code)}
          className={`${styles.riskMetricCard} ${styles.interactiveCard} ${getStatusPulse(item.status)}`}
        >
          <strong>{item.label}</strong>
          <span>{item.value}</span>
          <small>{item.delta}</small>
        </Link>
      ))}
    </div>
  );
}

function ExecutiveSparkline({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const width = 260;
  const height = 72;
  const linePath = items
    .map((item, index) => {
      const x = 16 + (index * (width - 32)) / Math.max(items.length - 1, 1);
      const y = height - 14 - (item.value / max) * 38;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.executiveSparkline} role="img" aria-label="Executive sparkline">
      <defs>
        <linearGradient id="executiveSparklineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7ec1ff" />
          <stop offset="100%" stopColor="#74ddc3" />
        </linearGradient>
      </defs>
      {items.map((item, index) => {
        const x = 16 + (index * (width - 32)) / Math.max(items.length - 1, 1);
        const y = height - 14 - (item.value / max) * 38;
        return <circle key={item.label} cx={x} cy={y} r={3.5} className={styles.executiveSparkPoint} />;
      })}
      <path d={linePath} className={styles.executiveSparkPath} />
    </svg>
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(defaultVisibleSections);
  const [sectionSpans, setSectionSpans] = useState<Record<string, number>>(defaultSectionSpans);
  const [sectionRowSpans, setSectionRowSpans] = useState<Record<string, number>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const executiveScore = Math.round(summary.faculty_scores.reduce((acc, item) => acc + item.value, 0) / Math.max(summary.faculty_scores.length, 1));
  const watchCount = academicCenter.metrics.filter((metric) => metric.status === "watch").length + summary.source_health.filter((source) => source.status.toLowerCase() === "watch").length;
  const riskCount = summary.alerts.filter((alert) => alert.level.toLowerCase() === "high").length;
  const alertCoverage = Math.max(100 - riskCount * 9 - watchCount * 4, 58);

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

  const settingsPanel = (
    <article className={`${styles.panel} ${styles.settingsFlyout}`}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionLabel}>Ayarlar</p>
          <h3>Kokpit Ayarlari</h3>
        </div>
        <button type="button" className={styles.assistantClose} onClick={() => setIsSettingsOpen(false)}>
          Kapat
        </button>
      </div>
      <div className={styles.settingsFlyoutBody}>
        <div className={styles.utilityCard}>
          <strong>Gorunum Ayarlari</strong>
          <small>Hangi birlesik modullerin dashboardda kalacagini secin.</small>
          <div className={styles.settingsToggleList}>
            {configurableSections.filter((section) => !["resource-strips", "strategic-monitoring"].includes(section.id)).map((section) => (
              <div key={section.id} className={styles.settingsToggleRow}>
                <button
                  type="button"
                  className={visibleSections[section.id] ? styles.toggleOn : styles.toggleOff}
                  onClick={() => toggleSection(section.id)}
                >
                  {section.label}
                </button>
                <small>{visibleSections[section.id] ? "Gorunur" : "Gizli"}</small>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.utilityCard}>
          <strong>Veri Yenileme</strong>
          <small>YOKSIS, dosya yukleme ve warehouse batch akis profilleri birlikte izleniyor.</small>
          <div className={styles.utilityMeta}>
            <span>Warehouse Live</span>
            <span>Excel / JSON</span>
            <span>Mock Fallback</span>
          </div>
        </div>
      </div>
    </article>
  );

  const show = {
    center: visibleSections["academic-performance-center"],
    leadership: visibleSections["academic-personnel"],
    risk: visibleSections["academic-performance"],
    faculty: visibleSections["faculty-analysis"],
    finance: visibleSections["finance-analysis"],
    benchmark: visibleSections["benchmark-area"],
    strategy: visibleSections["program-sustainability"],
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
          {sidebarItems.map((item, index) => {
            const className = index === 0 ? styles.activeNavItem : styles.navItem;
            const label = sidebarOpen ? item.label : item.label.slice(0, 2);

            if (item.id === "scenario-center") {
              return (
                <Link key={item.id} href="/scenario-center" className={className} title={item.label}>
                  {label}
                </Link>
              );
            }

            if (item.id === "settings") {
              return (
                <button
                  key={item.id}
                  type="button"
                  className={className}
                  title={item.label}
                  onClick={() => setIsSettingsOpen((current) => !current)}
                >
                  {label}
                </button>
              );
            }

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={className}
                title={item.label}
              >
                {label}
              </a>
            );
          })}
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
          <div className={styles.topbarMain}>
            <div>
              <p className={styles.sectionLabel}>Yonetici Gostergesi</p>
              <h2>Akademik Personel Performansi ve Stratejik Izleme Cockpit&apos;i</h2>
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
            <div className={styles.topbarSignalStrip}>
              <div className={styles.signalBand}>
                <small>Yayin momentumu</small>
                <ExecutiveSparkline items={summary.publication_trend} />
              </div>
              <div className={styles.signalBand}>
                <small>Alarm kapsama skoru</small>
                <strong>%{alertCoverage}</strong>
                <span>Risk, watch ve veri akisi birlikte normalize edilir.</span>
              </div>
            </div>
          </div>
          <div className={styles.executiveRail}>
            <div className={styles.executiveMiniCard}>
              <small>Genel skor</small>
              <strong>{executiveScore}</strong>
              <span>Fakulte ortalamasi</span>
            </div>
            <div className={`${styles.executiveMiniCard} ${watchCount > 0 ? styles.pulseWatch : ""}`}>
              <small>Watch</small>
              <strong>{watchCount}</strong>
              <span>Izlenen sinyal</span>
            </div>
            <div className={`${styles.executiveMiniCard} ${riskCount > 0 ? styles.pulseRisk : ""}`}>
              <small>Risk</small>
              <strong>{riskCount}</strong>
              <span>Kritik akis</span>
            </div>
          </div>
        </header>

        <section className={styles.masterCockpit}>
          {show.center ? (
            <section id="academic-performance-center" className={styles.compactKpiSection}>
              <div className={styles.compactKpiHeader}>
                <div>
                  <p className={styles.sectionLabel}>Akademik Performans Merkezi</p>
                  <h3>Akademik uretkenlik, proje ve stratejik hedef gorunumu</h3>
                </div>
                <span className={styles.centerMeta}>
                  {academicCenter.source_mode === "warehouse_live" ? "Canli warehouse akisi" : "Mock fallback modu"}
                </span>
              </div>
              <div className={styles.compactKpiRow}>
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
          ) : null}

          <section className={styles.cockpitMainGrid}>
            {show.leadership ? (
              <article id="academic-personnel" className={`${styles.panel} ${styles.masterLeadershipPanel}`}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Liderlik Sinyalleri</p>
                    <h3>En Yuksek Performansli Akademisyenler</h3>
                  </div>
                  <span>Detay sayfasina gidin</span>
                </div>
                <div className={styles.masterLeadershipTop}>
                  <div className={styles.masterTrendMini}>
                    <TrendColumns items={summary.publication_trend} />
                  </div>
                  <div className={styles.masterLeadershipNote}>
                    <strong>Bu ana panel dashboardun odak noktasi.</strong>
                    <span>Akademik liderlik, etki dalgalanmasi ve dusus sinyalleri ayni blokta okunur.</span>
                  </div>
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
            ) : null}

            <div className={styles.cockpitSideRail}>
              {show.faculty ? (
                <article id="faculty-analysis" className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <p className={styles.sectionLabel}>Fakulte ve Bolum Analizi</p>
                      <h3>Fakulte Performans Matrisi</h3>
                    </div>
                  </div>
                  <ScoreMatrix items={summary.faculty_scores} />
                </article>
              ) : null}

              {show.risk ? (
                <article id="risk-early-warning" className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <p className={styles.sectionLabel}>Risk Corridor</p>
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
                  <div className={styles.watchChipRail}>
                    {academicCenter.metrics.filter((item) => item.status !== "healthy").slice(0, 2).map((item) => (
                      <Link
                        key={item.code}
                        href={getInsightHref("metric", item.code)}
                        className={`${styles.riskMetricCard} ${styles.interactiveCard} ${getStatusPulse(item.status)}`}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                        <small>{item.delta}</small>
                      </Link>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>
          </section>

          <section className={styles.cockpitBottomGrid}>
            {show.finance ? (
              <article id="finance-analysis" className={`${styles.panel} ${styles.financePanelCompact}`}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Mali Analiz</p>
                    <h3>Gelir, gider, sapma ve kapasite</h3>
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
                  <div>
                    <h4>Kapasite Kullanimi</h4>
                    <MiniBars items={summary.capacity_utilization} />
                  </div>
                </div>
              </article>
            ) : null}

            {show.benchmark ? (
              <article id="benchmark-area" className={`${styles.panel} ${styles.benchmarkCompactPanel}`}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Benchmark + Data Trust</p>
                    <h3>Benchmark, veri sagligi ve AI tetik</h3>
                  </div>
                </div>
                <div className={styles.benchmarkCompactGrid}>
                  <div className={styles.noteCard}>
                    <strong>Universite Benchmark</strong>
                    <MiniBars items={summary.benchmark_comparison} />
                  </div>
                  <div className={styles.noteCard}>
                    <strong>Veri Kaynagi Sagligi</strong>
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
                  </div>
                  <div className={styles.noteCard}>
                    <strong>AI Analiz Tetikleri</strong>
                    <div className={styles.promptStack}>
                      {summary.assistant_prompts.slice(0, 2).map((prompt) => (
                        <span key={prompt}>{prompt}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.noteCard}>
                    <strong>Kokpit Durumu</strong>
                    <span>Watch akis: {watchCount}</span>
                    <span>Risk akis: {riskCount}</span>
                    <small>Erken uyari, veri kalitesi ve KPI sinyalleri tek noktada okunur.</small>
                  </div>
                </div>
              </article>
            ) : null}
          </section>

          {show.strategy ? (
            <section id="framework-indicators" className={styles.strategyStripShell}>
              <article className={`${styles.panel} ${styles.strategyStripPanel}`}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Alt Serit</p>
                    <h3>Program, hedef, benchmark ve kaynak ozetleri</h3>
                  </div>
                </div>
                <div className={styles.strategySummaryGrid}>
                  <div className={styles.noteCard}>
                    <strong>Program Matrisi</strong>
                    <span>{summary.program_health.length} karar sinyali</span>
                    <small>Buyutulebilir, guclendirilmeli ve desteklenecek programlar tek ozet kartta tutulur.</small>
                  </div>
                  <div className={styles.noteCard}>
                    <strong>THE / QS / YOK</strong>
                    <span>{summary.readiness_details.length} gap kaydi</span>
                    <small>Hazirlik oranlari ve benchmark aciklari sadece stratejik ozet seviyesinde kalir.</small>
                  </div>
                  <div className={styles.noteCard}>
                    <strong>Hedef Izleme</strong>
                    <span>{summary.strategic_goals.length} kritik hedef</span>
                    <small>Asil detay ayri rapor ekranina gider, dashboardda sadece kritik ilerleme ozetlenir.</small>
                  </div>
                  <div className={styles.noteCard}>
                    <strong>Kaynak Setleri</strong>
                    <span>3 mini grup</span>
                    <small>Ogrenci, mali ve kapasite setleri cockpit alt seridinde kompakt sunulur.</small>
                  </div>
                  <div className={styles.noteCard}>
                    <strong>Scenario CTA</strong>
                    <span>What-if butonu</span>
                    <small>Senaryo Merkezi ana panellerden cikarildi; hizli eylem olarak tutulur.</small>
                  </div>
                  <div className={styles.noteCard}>
                    <strong>Ayarlar CTA</strong>
                    <span>Konfigurasyon butonu</span>
                    <small>Ayarlar buyuk panel olmaz; gorunum ve profil secimi utility dock icine tasinir.</small>
                  </div>
                </div>
              </article>
            </section>
          ) : null}
        </section>

        <div className={styles.cockpitUtilityIcons}>
          <Link href="/scenario-center" className={styles.cockpitIconButton} title="Senaryo Merkezi">
            <span>SC</span>
            <small>Senaryo</small>
          </Link>
          <button
            id="settings"
            type="button"
            className={styles.cockpitIconButton}
            title="Ayarlar"
            onClick={() => setIsSettingsOpen((current) => !current)}
          >
            <span>AY</span>
            <small>Ayar</small>
          </button>
        </div>

        {isSettingsOpen ? settingsPanel : null}

        <AssistantPanel prompts={summary.assistant_prompts} />
      </section>
    </main>
  );
}
