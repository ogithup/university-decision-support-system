import Link from "next/link";
import { notFound } from "next/navigation";

import { CommandCenterHeader } from "../../../components/command-center-header";
import { fetchDashboardSummary, fetchFinanceSummary, fetchWorkspace } from "../../../../lib/api";
import styles from "./page.module.css";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const [workspace, summary, finance] = await Promise.all([
    fetchWorkspace(workspaceId).catch(() => null),
    fetchDashboardSummary().catch(() => null),
    fetchFinanceSummary().catch(() => null),
  ]);

  if (!workspace) {
    notFound();
  }

  const heroKpisSource = [
    summary?.kpis[0],
    summary?.kpis[1],
    finance?.kpis[0]
      ? {
          code: "FINANCE_BALANCE",
          label: finance.kpis[0].label,
          value: finance.kpis[0].value,
          delta: finance.kpis[0].delta,
          status: finance.kpis[0].status,
        }
      : null,
    summary?.kpis[7],
  ];
  const heroKpis = heroKpisSource.filter((kpi): kpi is NonNullable<(typeof heroKpisSource)[number]> => Boolean(kpi));

  const lineSeries = summary?.publication_trend ?? [];
  const lineMax = Math.max(...lineSeries.map((item) => item.value), 1);
  const waterfallItems = [
    ...(finance?.revenue_mix.map((item) => ({ ...item, direction: "positive" as const })) ?? []),
    ...(finance?.expense_mix.slice(0, 3).map((item) => ({ ...item, direction: "negative" as const })) ?? []),
  ];
  const waterfallMax = Math.max(...waterfallItems.map((item) => item.value), 1);

  return (
    <main className={styles.page}>
      <CommandCenterHeader
        activeLabel="Benchmark"
        actions={<Link href="/dashboard" className={styles.backLink}>Dashboard&apos;a Don</Link>}
      />

      <section className={styles.hero}>
        <div>
          <p className={styles.label}>Dinamik Analiz Workspace</p>
          <h1>{workspace.title}</h1>
          <p>{workspace.summary}</p>
        </div>
        <div className={styles.heroMeta}>
          <span>{workspace.academic_year}</span>
          <span>Workspace: {workspace.workspace_id}</span>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Varsayimlar</h2>
          <ul>
            {workspace.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </article>
        <article className={styles.card}>
          <h2>Filtreler</h2>
          <div className={styles.tags}>
            {Object.entries(workspace.filters).map(([key, value]) => (
              <span key={key}>
                {key}: {value ?? "tum"}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.kpiGrid}>
        {heroKpis.map((kpi) => (
          <article key={kpi.code} className={styles.kpiCard}>
            <p>{kpi.label}</p>
            <h3>{kpi.value}</h3>
            <div className={styles.kpiMeta}>
              <span>{kpi.delta}</span>
              <strong className={styles[`status_${kpi.status}`]}>{kpi.status}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.widgetGrid}>
        <article className={`${styles.widgetCard} ${styles.chartCard}`}>
          <div className={styles.widgetHeader}>
            <div>
              <p className={styles.widgetType}>line_chart</p>
              <h3>Uc Yillik Akademik Performans Trendi</h3>
            </div>
            <span>Yayin egilimi</span>
          </div>
          <div className={styles.lineChart}>
            {lineSeries.map((item) => (
              <div key={item.label} className={styles.linePointColumn}>
                <div className={styles.lineTrack}>
                  <div
                    className={styles.linePoint}
                    style={{ bottom: `${(item.value / lineMax) * 100}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                </div>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={`${styles.widgetCard} ${styles.chartCard}`}>
          <div className={styles.widgetHeader}>
            <div>
              <p className={styles.widgetType}>waterfall_chart</p>
              <h3>Maliyet ve Gelir Etki Akisi</h3>
            </div>
            <span>Sentetik butce etkisi</span>
          </div>
          <div className={styles.waterfallChart}>
            {waterfallItems.map((item) => (
              <div key={`${item.direction}-${item.label}`} className={styles.waterfallColumn}>
                <div className={styles.waterfallAxis} />
                <div
                  className={item.direction === "positive" ? styles.waterfallPositive : styles.waterfallNegative}
                  style={{ height: `${Math.max(18, (item.value / waterfallMax) * 130)}px` }}
                  title={`${item.label}: ${item.value}`}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <div>
              <p className={styles.widgetType}>risk_table</p>
              <h3>Risk Tablosu</h3>
            </div>
          </div>
          <div className={styles.riskTable}>
            {workspace.risks.map((risk) => (
              <div key={risk.id} className={styles.riskTableRow}>
                <strong>{risk.title}</strong>
                <span>{risk.owner}</span>
                <small>{risk.action}</small>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <div>
              <p className={styles.widgetType}>scenario_cards</p>
              <h3>Analiz Widget Plani</h3>
            </div>
          </div>
          <div className={styles.widgetList}>
            {workspace.widgets.map((widget) => (
              <div key={widget.metric} className={styles.widgetListItem}>
                <strong>{widget.title}</strong>
                <span>{widget.type}</span>
                <small>{widget.description}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Analiz Yorumu</h2>
          <div className={styles.narrative}>
            {workspace.narrative.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </article>
        <article className={styles.card}>
          <h2>Oncelikli Riskler</h2>
          <div className={styles.riskList}>
            {workspace.risks.map((risk) => (
              <div key={risk.id} className={styles.riskRow}>
                <strong>{risk.title}</strong>
                <span>{risk.action}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
