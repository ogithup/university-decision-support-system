"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import { AcademicPerformanceCenterResponse, DashboardSummaryResponse, FinanceSummaryResponse } from "../../types/university";
import { AssistantPanel } from "./assistant-panel";
import styles from "./page.module.css";

const moduleTabs = [
  { id: "executive-summary", label: "Genel Bakis" },
  { id: "academic-performance-center", label: "Akademik" },
  { id: "faculty-analysis", label: "Fakulteler" },
  { id: "academic-collaboration", label: "Is Birlikleri" },
  { id: "finance-analysis", label: "Mali" },
  { id: "risk-early-warning", label: "Risk" },
  { id: "benchmark-area", label: "Benchmark" },
] as const;

function slugify(value: string) {
  return value.toLowerCase().replaceAll("%", "pct").replaceAll(" ", "-").replaceAll("_", "-").replaceAll("/", "-");
}

function getInsightHref(kind: string, key: string): Route {
  return `/dashboard/insights/${kind}-${slugify(key)}` as Route;
}

function getResourceDetailHref(group: "student" | "finance" | "capacity"): Route {
  if (group === "finance") {
    return "/dashboard/finance/analysis" as Route;
  }
  return "/dashboard/scenarios/student-capacity" as Route;
}

function getStatusPulse(status: string, stylesMap: Record<string, string>) {
  const normalized = status.toLowerCase();
  if (normalized === "watch" || normalized === "medium") {
    return stylesMap.pulseWatch;
  }
  if (normalized === "risk" || normalized === "high") {
    return stylesMap.pulseRisk;
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

function ExecutiveSparkline({ items }: { items: Array<{ label: string; value: number }> }) {
  const safeItems = items.length > 0 ? items : [{ label: "0", value: 0 }];
  const max = Math.max(...safeItems.map((item) => item.value), 1);
  const width = 320;
  const height = 84;
  const linePath = safeItems
    .map((item, index) => {
      const x = 18 + (index * (width - 36)) / Math.max(safeItems.length - 1, 1);
      const y = height - 14 - (item.value / max) * 42;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.executiveSparkline} role="img" aria-label="Publication trend sparkline">
      <defs>
        <linearGradient id="commandCenterSparkStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#55a8ff" />
          <stop offset="100%" stopColor="#45d1b8" />
        </linearGradient>
      </defs>
      {safeItems.map((item, index) => {
        const x = 18 + (index * (width - 36)) / Math.max(safeItems.length - 1, 1);
        const y = height - 14 - (item.value / max) * 42;
        return <circle key={`${item.label}-${index}`} cx={x} cy={y} r={4} className={styles.executiveSparkPoint} />;
      })}
      <path d={linePath} className={styles.executiveSparkPath} />
    </svg>
  );
}

function ScoreMatrix({ items }: { items: Array<{ id?: string | null; label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className={styles.scoreMatrix}>
      {items.map((item) => (
        <Link
          key={item.id || item.label}
          href={(item.id ? `/faculties/${item.id}` : getInsightHref("faculty", item.label)) as Route}
          className={`${styles.scoreMatrixRow} ${styles.interactiveCard}`}
        >
          <strong>{item.label}</strong>
          <div className={styles.scoreMatrixTrack}>
            <div className={styles.scoreMatrixFill} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <span>{item.value}</span>
        </Link>
      ))}
    </div>
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
  const executiveScore = Math.round(summary.faculty_scores.reduce((acc, item) => acc + item.value, 0) / Math.max(summary.faculty_scores.length, 1));
  const watchCount =
    academicCenter.metrics.filter((metric) => metric.status === "watch").length +
    summary.source_health.filter((source) => source.status.toLowerCase() === "watch").length;
  const riskCount = summary.alerts.filter((alert) => alert.level.toLowerCase() === "high").length;
  const alertCoverage = Math.max(100 - riskCount * 9 - watchCount * 4, 58);

  const collaborationSignals = useMemo(() => {
    const collaborationMetric = academicCenter.metrics.find((metric) => metric.label.toLowerCase().includes("birligi"));
    return {
      collaborationMetric,
      sourceHealth: summary.source_health.slice(0, 3),
      workloads: summary.work_distribution.slice(0, 4),
    };
  }, [academicCenter.metrics, summary.source_health, summary.work_distribution]);

  return (
    <main className={styles.commandCenter}>
      <header className={styles.stickyRail}>
        <div className={styles.railBrand}>
          <span className={styles.brandEyebrow}>ABU Command Center</span>
          <strong>Universite Stratejik Yonetim Kokpiti</strong>
        </div>
        <nav className={styles.moduleNav}>
          {moduleTabs.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={styles.moduleChip}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.topRailActions}>
          <Link href="/scenario-center" className={styles.topRailButton}>
            Senaryo
          </Link>
          <Link href={"/dashboard/settings" as Route} className={styles.topRailButton}>
            Ayarlar
          </Link>
        </div>
      </header>

      <section className={styles.pageFlow}>
        <section id="executive-summary" className={styles.heroSection}>
          <article className={`${styles.glassPanel} ${styles.heroOverview}`}>
            <div className={styles.heroHeader}>
              <div>
                <p className={styles.sectionLabel}>Yonetici Ozeti</p>
                <h1>University Command Center</h1>
                <p className={styles.heroSummary}>Akademik performans, mali akis, risk ve benchmark sinyalleri tek karar ekraninda birlestirilir.</p>
              </div>
              <div className={styles.heroMetaRail}>
                <span>{academicCenter.period || summary.academic_year}</span>
                <span>{academicCenter.faculty || summary.selected_faculty}</span>
                <span>{summary.selected_department}</span>
                <span>{academicCenter.source_mode === "warehouse_live" ? "Warehouse Live" : "Mock Fallback"}</span>
              </div>
            </div>
            <div className={styles.heroVisualRow}>
              <div className={styles.heroTrendCard}>
                <small>Yayin momentumu</small>
                <ExecutiveSparkline items={summary.publication_trend} />
              </div>
              <div className={styles.heroSignalCard}>
                <small>Alarm kapsama skoru</small>
                <strong>%{alertCoverage}</strong>
                <span>Risk, watch ve veri akis sinyalleri normalize edilerek tek executive pulse olarak okunur.</span>
              </div>
            </div>
          </article>

          <aside className={styles.heroSideStack}>
            <article className={styles.metricPillar}>
              <small>Genel skor</small>
              <strong>{executiveScore}</strong>
              <span>Fakulte ortalamasi</span>
            </article>
            <article className={`${styles.metricPillar} ${watchCount > 0 ? styles.pulseWatch : ""}`}>
              <small>Watch</small>
              <strong>{watchCount}</strong>
              <span>Izlenen sinyal</span>
            </article>
            <article className={`${styles.metricPillar} ${riskCount > 0 ? styles.pulseRisk : ""}`}>
              <small>Risk</small>
              <strong>{riskCount}</strong>
              <span>Kritik akis</span>
            </article>
          </aside>
        </section>

        <section id="academic-performance-center" className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Akademik</p>
              <h2>Akademik performans merkezi</h2>
            </div>
            <span className={styles.sectionPill}>
              {academicCenter.source_mode === "warehouse_live" ? "Canli warehouse akisi" : "Mock fallback modu"}
            </span>
          </div>
          <div className={styles.kpiRibbon}>
            {academicCenter.metrics.map((kpi) => (
              <Link
                key={kpi.code}
                href={getInsightHref("metric", kpi.code)}
                className={`${styles.kpiTile} ${styles.interactiveCard} ${getStatusPulse(kpi.status, styles)}`}
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

        <section className={styles.coreGrid}>
          <article id="academic-personnel" className={`${styles.glassPanel} ${styles.featurePanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Akademik</p>
                <h3>Liderlik sinyalleri</h3>
              </div>
              <Link href={"/dashboard/insights/leaderboard-overview" as Route} className={styles.detailLink}>
                Detay
              </Link>
            </div>
            <div className={styles.featureVisual}>
              <ExecutiveSparkline items={summary.publication_trend} />
            </div>
            <div className={styles.leaderboardCardGrid}>
              {summary.top_performers.slice(0, 5).map((person) => (
                <Link
                  key={person.academic_id}
                  href={`/academics/${person.academic_id}` as Route}
                  className={`${styles.leaderCard} ${styles.interactiveCard} ${person.change < 0 ? styles.pulseRisk : ""}`}
                >
                  <div className={styles.leaderCardHeader}>
                    <div>
                      <strong>{person.name}</strong>
                      <span>{person.title}</span>
                    </div>
                    <div className={styles.leaderScoreBadge}>
                      <strong>{person.score}</strong>
                      <small>Genel skor</small>
                    </div>
                  </div>
                  <div className={styles.leaderCardBody}>
                    <span>{person.department}</span>
                    <div className={styles.leaderMiniBars}>
                      <div>
                        <small>Arastirma</small>
                        <div className={styles.leaderMiniTrack}>
                          <div className={styles.leaderMiniFill} style={{ width: `${Math.min(100, person.score)}%` }} />
                        </div>
                      </div>
                      <div>
                        <small>Egitim</small>
                        <div className={styles.leaderMiniTrack}>
                          <div className={styles.leaderMiniFill} style={{ width: `${Math.min(100, person.score - 8)}%` }} />
                        </div>
                      </div>
                      <div>
                        <small>Momentum</small>
                        <div className={styles.leaderMiniTrack}>
                          <div className={styles.leaderMiniFill} style={{ width: `${Math.min(100, Math.max(12, person.score + person.change * 4))}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.leaderCardFooter}>
                    <span>Top 5 liderlik sinyali</span>
                    <strong className={person.change < 0 ? styles.negativeDelta : styles.positiveDelta}>
                      {person.change >= 0 ? "+" : ""}
                      {person.change}
                    </strong>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article id="faculty-analysis" className={`${styles.glassPanel} ${styles.featurePanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Fakulteler</p>
                <h3>Fakulte performans matrisi</h3>
              </div>
            </div>
            <ScoreMatrix items={summary.faculty_scores} />
          </article>
        </section>

        <section id="academic-collaboration" className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Is Birlikleri</p>
              <h2>Is birlikleri ve veri bagimlilik akisi</h2>
            </div>
          </div>
          <div className={styles.collaborationGrid}>
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Uluslararasilasma sinyali</h3>
              </div>
              {collaborationSignals.collaborationMetric ? (
                <Link
                  href={getInsightHref("metric", collaborationSignals.collaborationMetric.code)}
                  className={`${styles.signalHighlight} ${styles.interactiveCard} ${getStatusPulse(collaborationSignals.collaborationMetric.status, styles)}`}
                >
                  <strong>{collaborationSignals.collaborationMetric.value}</strong>
                  <span>{collaborationSignals.collaborationMetric.label}</span>
                  <small>{collaborationSignals.collaborationMetric.delta}</small>
                </Link>
              ) : (
                <div className={styles.signalHighlight}>
                  <strong>-</strong>
                  <span>Is birligi verisi bekleniyor</span>
                </div>
              )}
            </article>

            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Dagilim</h3>
              </div>
              <MiniBars items={collaborationSignals.workloads} />
            </article>

            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Kaynak bagimliligi</h3>
              </div>
              <div className={styles.sourceList}>
                {collaborationSignals.sourceHealth.map((source) => (
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
          </div>
        </section>

        <section id="finance-analysis" className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Mali</p>
              <h2>Gelir, gider ve kapasite komut paneli</h2>
            </div>
            <Link href={"/dashboard/finance/analysis" as Route} className={styles.detailLink}>
              Mali detaylari gor
            </Link>
            <span className={styles.sectionPill}>{finance.academic_year}</span>
          </div>
          <div className={styles.financeGrid}>
            <article className={`${styles.glassPanel} ${styles.financeSummaryPanel}`}>
              <div className={styles.financeKpis}>
                {finance.kpis.map((kpi) => (
                  <Link
                    key={kpi.label}
                    href={"/dashboard/finance/analysis" as Route}
                    className={`${styles.financeKpiCard} ${styles.interactiveCard} ${getStatusPulse(kpi.status, styles)}`}
                  >
                    <strong>{kpi.label}</strong>
                    <span>{kpi.value}</span>
                    <small>{kpi.delta}</small>
                  </Link>
                ))}
              </div>
            </article>
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Gelir karmasi</h3>
              </div>
              <MiniBars items={finance.revenue_mix} />
            </article>
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Gider karmasi</h3>
              </div>
              <MiniBars items={finance.expense_mix} />
            </article>
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Butce sapmasi</h3>
              </div>
              <MiniBars items={finance.budget_variance} />
            </article>
          </div>
        </section>

        <section id="risk-early-warning" className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Risk</p>
              <h2>Erken uyari koridoru</h2>
            </div>
          </div>
          <div className={styles.riskGrid}>
            <article className={`${styles.glassPanel} ${styles.riskColumn}`}>
              <div className={styles.alertStack}>
                {summary.alerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={getInsightHref("alert", alert.id)}
                    className={`${styles.alertCard} ${styles.interactiveCard} ${getStatusPulse(alert.level, styles)}`}
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
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Risk altindaki KPI rail</h3>
              </div>
              <div className={styles.riskMetricRail}>
                {academicCenter.metrics
                  .filter((item) => item.status !== "healthy")
                  .map((item) => (
                    <Link
                      key={item.code}
                      href={getInsightHref("metric", item.code)}
                      className={`${styles.riskMetricCard} ${styles.interactiveCard} ${getStatusPulse(item.status, styles)}`}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                      <small>{item.delta}</small>
                    </Link>
                  ))}
              </div>
            </article>
          </div>
        </section>

        <section id="benchmark-area" className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Benchmark</p>
              <h2>Benchmark, AI ve stratejik kaynak baglantilari</h2>
            </div>
          </div>
          <div className={styles.benchmarkGrid}>
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Universite benchmark</h3>
              </div>
              <MiniBars items={summary.benchmark_comparison} />
            </article>
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>AI hizli analiz tetikleri</h3>
              </div>
              <div className={styles.promptStack}>
                {summary.assistant_prompts.slice(0, 3).map((prompt) => (
                  <span key={prompt}>{prompt}</span>
                ))}
              </div>
            </article>
            <article className={styles.glassPanel}>
              <div className={styles.panelHeader}>
                <h3>Kaynak setleri</h3>
              </div>
              <div className={styles.resourceTriptych}>
                <div className={styles.miniMetricGroup}>
                  <strong>Ogrenci</strong>
                  {summary.student_metrics.slice(0, 2).map((item) => (
                    <Link key={item.code} href={getResourceDetailHref("student")} className={`${styles.metricLine} ${styles.interactiveCard}`}>
                      <span>{item.label}</span>
                      <b>{item.value}</b>
                    </Link>
                  ))}
                </div>
                <div className={styles.miniMetricGroup}>
                  <strong>Mali</strong>
                  {summary.finance_metrics.slice(0, 2).map((item) => (
                    <Link key={item.code} href={getResourceDetailHref("finance")} className={`${styles.metricLine} ${styles.interactiveCard}`}>
                      <span>{item.label}</span>
                      <b>{item.value}</b>
                    </Link>
                  ))}
                </div>
                <div className={styles.miniMetricGroup}>
                  <strong>Kapasite</strong>
                  {summary.capacity_metrics.slice(0, 2).map((item) => (
                    <Link key={item.code} href={getResourceDetailHref("capacity")} className={`${styles.metricLine} ${styles.interactiveCard}`}>
                      <span>{item.label}</span>
                      <b>{item.value}</b>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>

      <AssistantPanel prompts={summary.assistant_prompts} />
    </main>
  );
}
