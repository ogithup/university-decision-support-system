import Link from "next/link";

import { fetchDashboardInsight } from "../../../../lib/api";
import { InsightDetailResponse } from "../../../../types/university";
import styles from "./page.module.css";


const fallbackInsight: InsightDetailResponse = {
  insight_id: "fallback",
  title: "Detay kaydi",
  subtitle: "Insight verisi gecici olarak alinmadi.",
  status: "watch",
  source_mode: "mock_fallback",
  source_context: {
    active_channel: "mock_connector",
    available_channels: ["yoksis_api", "excel_json_upload", "warehouse_live", "mock_connector"],
    refresh_policy: "Normalize edilen veri katmani tek ekran modeli kullanir.",
    provenance_note: "Kaynak kanali degisse bile insight layout'u sabit kalir.",
  },
  headline_value: "N/A",
  headline_delta: "Izleniyor",
  summary: "Detay endpoint yanit vermezse fallback ekran gosterilir.",
  combo_trend: [],
  change_breakdown: [],
  diagnostics: [],
  alerts: [],
};

function ComboChart({ points }: { points: InsightDetailResponse["combo_trend"] }) {
  const maxValue = Math.max(...points.map((point) => Math.max(point.bar_value, point.line_value)), 1);
  const linePath = points
    .map((point, index) => {
      const x = 40 + index * 110;
      const y = 250 - (point.line_value / maxValue) * 180;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className={styles.comboShell}>
      <svg viewBox="0 0 520 280" className={styles.comboChart} role="img" aria-label="Combo chart trend">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffc85a" />
            <stop offset="100%" stopColor="#7ec1ff" />
          </linearGradient>
        </defs>
        {points.map((point, index) => {
          const x = 20 + index * 110;
          const barHeight = (point.bar_value / maxValue) * 180;
          const y = 250 - barHeight;
          const lineY = 250 - (point.line_value / maxValue) * 180;
          return (
            <g key={point.label}>
              <rect x={x} y={y} width={40} height={barHeight} rx={12} fill="url(#barGradient)" opacity="0.9" />
              <circle cx={x + 20} cy={lineY} r={6} className={styles.linePoint} />
              <text x={x + 20} y={268} textAnchor="middle" className={styles.axisText}>{point.label}</text>
            </g>
          );
        })}
        <path d={linePath} className={styles.comboLine} />
      </svg>
      <div className={styles.comboLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendBar} />
          <small>Hacim / seviye</small>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendLine} />
          <small>Degisim ivmesi</small>
        </div>
      </div>
      <div className={styles.deltaStrip}>
        {points.map((point) => (
          <div key={point.label} className={styles.deltaCard}>
            <strong>{point.label}</strong>
            <span>{point.bar_value.toFixed(1)}</span>
            <small>{point.delta_value >= 0 ? "+" : ""}{point.delta_value.toFixed(1)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardInsightPage({ params }: { params: Promise<{ insightId: string }> }) {
  const { insightId } = await params;
  const insight = await fetchDashboardInsight(insightId).catch(() => fallbackInsight);

  return (
    <main className={styles.page}>
      <div className={styles.topActions}>
        <Link href="/dashboard" className={styles.backLink}>Dashboard&apos;a Don</Link>
      </div>

      <section className={`${styles.hero} ${styles[`hero_${insight.status}`] || ""}`}>
        <div>
          <p className={styles.sectionLabel}>Insight Detayi</p>
          <h1>{insight.title}</h1>
          <p>{insight.subtitle}</p>
          <p className={styles.summary}>{insight.summary}</p>
        </div>
        <div className={styles.heroMeta}>
          <div className={styles.heroValueCard}>
            <span>Guncel deger</span>
            <strong>{insight.headline_value}</strong>
            <small>{insight.headline_delta}</small>
          </div>
          <div className={styles.heroValueCard}>
            <span>Aktif kanal</span>
            <strong>{insight.source_context.active_channel}</strong>
            <small>{insight.source_mode}</small>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={`${styles.panel} ${styles.comboPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Combo Chart</p>
              <h2>Dalgalanma ve degisim izi</h2>
            </div>
          </div>
          <ComboChart points={insight.combo_trend} />
        </article>

        <article className={`${styles.panel} ${styles.sourcePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Kaynak Zinciri</p>
              <h2>Veri kanali mantigi</h2>
            </div>
          </div>
          <div className={styles.pillRow}>
            {insight.source_context.available_channels.map((channel) => (
              <span key={channel} className={channel === insight.source_context.active_channel ? styles.activePill : styles.pill}>
                {channel}
              </span>
            ))}
          </div>
          <p className={styles.bodyText}>{insight.source_context.refresh_policy}</p>
          <p className={styles.bodyText}>{insight.source_context.provenance_note}</p>
        </article>

        <article className={`${styles.panel} ${styles.breakdownPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Degisim Kirilimi</p>
              <h2>Basinca acilan teknik detay</h2>
            </div>
          </div>
          <div className={styles.infoList}>
            {insight.change_breakdown.map((item) => (
              <div key={`${item.label}-${item.value}`} className={`${styles.infoRow} ${styles[`state_${item.direction}`] || ""}`}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </div>
                <em>{item.value}</em>
              </div>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.diagnosticPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Teshis</p>
              <h2>API ve dosya akis mantigi</h2>
            </div>
          </div>
          <div className={styles.infoList}>
            {insight.diagnostics.map((item) => (
              <div key={`${item.label}-${item.value}`} className={styles.infoRow}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </div>
                <em>{item.value}</em>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panelFull}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Uyarilar</p>
              <h2>Risk ve watch akis sinyalleri</h2>
            </div>
          </div>
          <div className={styles.alertGrid}>
            {insight.alerts.map((alert) => (
              <div key={alert.id} className={`${styles.alertCard} ${styles[`state_${alert.level.toLowerCase()}`] || ""}`}>
                <div className={styles.alertHeader}>
                  <span>{alert.level}</span>
                  <strong>{alert.owner}</strong>
                </div>
                <p>{alert.title}</p>
                <small>{alert.action}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
