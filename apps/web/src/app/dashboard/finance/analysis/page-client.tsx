"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import styles from "../../decision-support.module.css";
import {
  FinancialCategory,
  FinancialScenarioInput,
  SavedScenario,
  getDefaultFinancialScenarioInput,
  getFinancialBaseline,
} from "../../../../lib/decision-support";
import { applyFinancialScenario, calculateFinancialScenario } from "../../../../lib/decision-support-calculations";

const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

const STORAGE_KEY = "abu-finance-scenarios-v1";

const scenarioPresets: Array<{ label: string; patch: Partial<FinancialScenarioInput> }> = [
  { label: "Ogrenci sayisinda %10 azalma", patch: { scenarioName: "Ogrenci -10", studentCountDeltaPct: -10 } },
  { label: "Ogrenci sayisinda %10 artis", patch: { scenarioName: "Ogrenci +10", studentCountDeltaPct: 10 } },
  { label: "Ucret degisimi", patch: { scenarioName: "Ucret ayari", averageTuitionDeltaPct: 8 } },
  { label: "Burs orani artisi", patch: { scenarioName: "Burs baskisi", scholarshipRateDeltaPct: 14, averageScholarshipDeltaPct: 10 } },
  { label: "Akademik personel maliyet artisi", patch: { scenarioName: "Kadro maliyeti", academicStaffDeltaPct: 8, personnelCostDeltaPct: 7 } },
  { label: "Enerji maliyeti artisi", patch: { scenarioName: "Enerji riski", energyCostDeltaPct: 18 } },
  { label: "Proje gelirlerinde azalma", patch: { scenarioName: "Proje daralmasi", projectIncomeDeltaPct: -12, researchIncomeDeltaPct: -8 } },
  { label: "Arastirma gelirlerinde artis", patch: { scenarioName: "Ar-Ge ivmesi", projectIncomeDeltaPct: 12, researchIncomeDeltaPct: 16 } },
  { label: "Teknoloji ve laboratuvar yatirimi", patch: { scenarioName: "Teknoloji yatirimi", technologyInvestmentDeltaPct: 18 } },
  { label: "Ekonomik daralma senaryosu", patch: { scenarioName: "Ekonomik daralma", studentCountDeltaPct: -6, averageTuitionDeltaPct: -4, energyCostDeltaPct: 14, projectIncomeDeltaPct: -10 } },
  { label: "Dengeli buyume senaryosu", patch: { scenarioName: "Dengeli buyume", studentCountDeltaPct: 6, averageTuitionDeltaPct: 4, researchIncomeDeltaPct: 8 } },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DonutChart({ items }: { items: Array<{ label: string; amount: number; sharePct: number }> }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const colors = ["#56a8ff", "#45d1b8", "#ffc45d", "#8c88ff", "#7dd8f6", "#f38fb2", "#95a7bf"];
  let offset = 0;

  return (
    <div className={styles.donutLayout}>
      <svg viewBox="0 0 120 120" className={styles.svgChart} role="img" aria-label="Dagilim donut grafigi">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(130, 168, 206, 0.18)" strokeWidth="18" />
        {items.map((item, index) => {
          const dash = (item.sharePct / 100) * circumference;
          const circle = (
            <circle
              key={item.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
        <text x="60" y="58" textAnchor="middle" className={styles.axisText}>Toplam</text>
        <text x="60" y="74" textAnchor="middle" className={styles.axisText}>%100</text>
      </svg>
      <div className={styles.donutLegend}>
        {items.map((item, index) => (
          <div key={item.label} className={styles.legendRow}>
            <span className={styles.legendSwatch} style={{ background: colors[index % colors.length] }} />
            <span>{item.label}</span>
            <strong>%{item.sharePct}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function WaterfallChart({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return (
    <div className={styles.chartShell}>
      <svg viewBox="0 0 420 220" className={styles.svgChart} role="img" aria-label="Waterfall chart">
        {items.map((item, index) => {
          const x = 30 + index * 95;
          const height = (Math.abs(item.value) / max) * 120;
          const y = item.value >= 0 ? 160 - height : 160;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={44} height={height} rx={12} fill={item.value >= 0 ? "#45d1b8" : "#f38fb2"} />
              <text x={x + 22} y={194} textAnchor="middle" className={styles.axisText}>{item.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TrendChart({ items }: { items: Array<{ label: string; baseline: number; scenario: number }> }) {
  const max = Math.max(...items.flatMap((item) => [item.baseline, item.scenario]), 1);
  const baselinePath = items
    .map((item, index) => {
      const x = 24 + index * 30;
      const y = 160 - (item.baseline / max) * 120;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const scenarioPath = items
    .map((item, index) => {
      const x = 24 + index * 30;
      const y = 160 - (item.scenario / max) * 120;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className={styles.chartShell}>
      <svg viewBox="0 0 400 220" className={styles.svgChart} role="img" aria-label="Net butce trendi">
        <path d={baselinePath} fill="none" stroke="#95a7bf" strokeWidth="4" strokeLinecap="round" />
        <path d={scenarioPath} fill="none" stroke="#45d1b8" strokeWidth="4" strokeLinecap="round" />
        {items.map((item, index) => {
          const x = 24 + index * 30;
          const y = 160 - (item.scenario / max) * 120;
          return <circle key={item.label} cx={x} cy={y} r={4} fill="#45d1b8" stroke="#fff" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}

export function FinanceAnalysisClient() {
  const baseline = useMemo(() => getFinancialBaseline(), []);
  const [scenarioInput, setScenarioInput] = useState<FinancialScenarioInput>(getDefaultFinancialScenarioInput());
  const [categories, setCategories] = useState<FinancialCategory[]>(baseline.categories);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SavedScenario[];
      setSavedScenarios(parsed);
    } catch {
      setSavedScenarios([]);
    }
  }, []);

  useEffect(() => {
    const applied = applyFinancialScenario(baseline, scenarioInput);
    setCategories(applied);
  }, [baseline, scenarioInput]);

  const result = useMemo(
    () => calculateFinancialScenario(baseline, categories, scenarioInput, savedScenarios),
    [baseline, categories, scenarioInput, savedScenarios],
  );

  const isDirty = useMemo(
    () => categories.some((item) => item.scenarioAmount !== item.baselineAmount || item.active !== baseline.categories.find((base) => base.id === item.id)?.active),
    [baseline.categories, categories],
  );

  function updateScenarioField(field: keyof FinancialScenarioInput, value: number | boolean | string) {
    setScenarioInput((current) => ({ ...current, [field]: value }));
  }

  function updateCategoryAmount(categoryId: string, nextAmount: number) {
    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      return;
    }
    setCategories((current) => current.map((item) => (item.id === categoryId ? { ...item, scenarioAmount: roundAmount(nextAmount) } : item)));
    setScenarioInput((current) => ({ ...current, sourceMode: "manual" }));
  }

  function toggleCategory(categoryId: string) {
    setCategories((current) => current.map((item) => (item.id === categoryId ? { ...item, active: !item.active } : item)));
  }

  function resetCategory(categoryId: string) {
    setCategories((current) =>
      current.map((item) => {
        if (item.id !== categoryId) {
          return item;
        }
        const baselineItem = baseline.categories.find((base) => base.id === categoryId)!;
        return { ...item, scenarioAmount: baselineItem.baselineAmount, active: baselineItem.active };
      }),
    );
  }

  function resetScenario() {
    setScenarioInput(getDefaultFinancialScenarioInput());
    setCategories(baseline.categories);
    setStatusMessage("Tum girdiler baseline degerlere donduruldu.");
  }

  function normalizeDistribution(kind: "income" | "expense") {
    setCategories((current) => {
      const subset = current.filter((item) => item.kind === kind && item.active);
      const total = subset.reduce((acc, item) => acc + item.scenarioAmount, 0);
      const baselineTotal = baseline.categories.filter((item) => item.kind === kind && item.active).reduce((acc, item) => acc + item.baselineAmount, 0);
      if (total === 0) {
        return current;
      }
      return current.map((item) => {
        if (item.kind !== kind || !item.active) {
          return item;
        }
        return { ...item, scenarioAmount: roundAmount((item.scenarioAmount / total) * baselineTotal) };
      });
    });
    setStatusMessage(`${kind === "income" ? "Gelir" : "Gider"} dagilimi baseline toplamina oransal olarak normalize edildi.`);
  }

  function saveScenario() {
    const nextSaved = result.savedScenarios.map((item, index, array) => ({
      ...item,
      reference: index === array.length - 1,
      name: index === array.length - 1 ? scenarioInput.scenarioName : item.name,
    }));
    setSavedScenarios(nextSaved);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSaved));
    }
    setStatusMessage(`Senaryo kaydedildi: ${scenarioInput.scenarioName}`);
  }

  return (
    <main className={styles.page}>
      <header className={styles.stickyRail}>
        <div className={styles.railBrand}>
          <span className={styles.brandEyebrow}>ABU Command Center</span>
          <strong>Stratejik Mali Analiz</strong>
        </div>
        <nav className={styles.railLinks}>
          <a href="#kpis" className={styles.chip}>KPI</a>
          <a href="#inputs" className={styles.chip}>Gelir ve Gider</a>
          <a href="#distribution" className={styles.chip}>Dagilim</a>
          <a href="#comparison" className={styles.chip}>Karsilastirma</a>
        </nav>
        <div className={styles.railActionGroup}>
          <Link href="/dashboard" className={styles.linkButton}>Dashboard&apos;a Don</Link>
          <button type="button" className={styles.ghostButton} onClick={resetScenario}>Tum senaryoyu sifirla</button>
          <button type="button" className={styles.primaryButton} onClick={saveScenario}>Senaryoyu kaydet</button>
        </div>
      </header>

      <section className={styles.body}>
        <section className={styles.hero}>
          <article className={styles.panel}>
            <div className={styles.heroCopy}>
              <div>
                <p className={styles.sectionLabel}>Mali Detay</p>
                <h1 className={styles.heroTitle}>Stratejik Mali Analiz ve Butce Simulasyonu</h1>
                <p className={styles.heroSummary}>Gelir, gider, butce hedefi ve kaynak dagilimini karsilastirin; farkli varsayimlarin mali sonuclarini anlik olarak test edin.</p>
              </div>
              <div className={styles.heroMetaRail}>
                <span className={styles.sectionPill}>Donem: {baseline.selectedPeriod}</span>
                <span className={styles.sectionPill}>Fakulte: Tum Fakulteler</span>
                <span className={styles.sectionPill}>Bolum: Tum Bolumler</span>
                <span className={styles.sectionPill}>Veri kaynagi: {scenarioInput.sourceMode}</span>
                {isDirty ? <span className={styles.dirtyPill}>Kaydedilmemis degisiklikler</span> : null}
              </div>
            </div>
          </article>
          <aside className={styles.heroMeta}>
            <div className={styles.summaryTile}>
              <p className={styles.sectionLabel}>Senaryo Adi</p>
              <input className={styles.numberInput} value={scenarioInput.scenarioName} onChange={(event) => updateScenarioField("scenarioName", event.target.value)} />
            </div>
            <div className={styles.summaryTile}>
              <p className={styles.sectionLabel}>Son guncelleme</p>
              <strong>{baseline.lastUpdated.slice(0, 16).replace("T", " ")}</strong>
              <span className={styles.metaText}>Mock veri / manuel senaryo ayrimi korunur.</span>
            </div>
          </aside>
        </section>

        <section id="kpis" className={styles.stack}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>KPI Kartlari</p>
              <h2 className={styles.sectionTitle}>Mevcut durum ve senaryo farki</h2>
            </div>
          </div>
          <div className={styles.kpiGrid}>
            {result.scenarioMetrics.map((metric) => (
              <article key={metric.id} className={styles.kpiCard} title={metric.tooltip}>
                <span>{metric.label}</span>
                <strong className={styles.kpiValue}>
                  {metric.unit === "TRY" && metric.scenario !== null ? currency.format(metric.scenario) : metric.unit === "%" && metric.scenario !== null ? `%${metric.scenario.toFixed(1)}` : metric.scenario ?? "Veri gerekli"}
                </strong>
                <div className={styles.kpiMeta}>
                  <span>Baseline: {metric.unit === "TRY" && metric.baseline !== null ? currency.format(metric.baseline) : metric.unit === "%" && metric.baseline !== null ? `%${metric.baseline.toFixed(1)}` : metric.baseline ?? "Veri gerekli"}</span>
                  <span className={styles[`status_${metric.status}`]}>{metric.status}</span>
                </div>
                <div className={styles.kpiMeta}>
                  <span>Fark: {metric.absoluteDifference === null ? "Hesaplanamadi" : metric.unit === "TRY" ? currency.format(metric.absoluteDifference) : `${metric.absoluteDifference}`}</span>
                  <span>{metric.percentageDifference === null ? "Veri gerekli" : `%${metric.percentageDifference}`}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="inputs" className={styles.workspaceGrid}>
          <div className={styles.stack}>
            <article className={styles.tableCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>What-if Laboratuvari</p>
                  <h3 className={styles.cardTitle}>Hazir mali senaryolar</h3>
                </div>
              </div>
              <div className={styles.chipRow}>
                {scenarioPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={styles.chip}
                    onClick={() => setScenarioInput((current) => ({ ...current, ...preset.patch, sourceMode: "manual" }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </article>

            <article className={styles.tableCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Gelir Kalemleri</p>
                  <h3 className={styles.cardTitle}>Manuel giris ve slider baglantisi</h3>
                </div>
              </div>
              <div className={styles.tableStack}>
                {result.incomeItems.map((item) => (
                  <CategoryEditor key={item.id} item={item} total={result.scenarioMetrics.find((metric) => metric.id === "income_total")?.scenario || 1} onAmountChange={updateCategoryAmount} onToggle={toggleCategory} onReset={resetCategory} />
                ))}
              </div>
            </article>

            <article className={styles.tableCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Gider Kalemleri</p>
                  <h3 className={styles.cardTitle}>Senaryo butce girdileri</h3>
                </div>
              </div>
              <div className={styles.tableStack}>
                {result.expenseItems.map((item) => (
                  <CategoryEditor key={item.id} item={item} total={result.scenarioMetrics.find((metric) => metric.id === "expense_total")?.scenario || 1} onAmountChange={updateCategoryAmount} onToggle={toggleCategory} onReset={resetCategory} />
                ))}
              </div>
            </article>
          </div>

          <div className={styles.stack}>
            <article id="distribution" className={styles.chartCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Butce Dagilimi</p>
                  <h3 className={styles.cardTitle}>Gelir ve gider dagilim panelleri</h3>
                </div>
                <div className={styles.buttonRow}>
                  <button type="button" className={`${styles.chip} ${scenarioInput.percentageMode ? styles.chipActive : ""}`} onClick={() => updateScenarioField("percentageMode", !scenarioInput.percentageMode)}>
                    {scenarioInput.percentageMode ? "Yuzde modu" : "Tutar modu"}
                  </button>
                  <button type="button" className={styles.ghostButton} onClick={() => normalizeDistribution("income")}>Geliri normalize et</button>
                  <button type="button" className={styles.ghostButton} onClick={() => normalizeDistribution("expense")}>Gideri normalize et</button>
                </div>
              </div>
              <div className={styles.distributionGrid}>
                <div className={styles.donutCard}>
                  <strong>Gelir dagilimi</strong>
                  <DonutChart items={result.incomeDistribution} />
                </div>
                <div className={styles.donutCard}>
                  <strong>Gider dagilimi</strong>
                  <DonutChart items={result.expenseDistribution} />
                </div>
              </div>
              {result.warnings.map((warning) => (
                <p key={warning} className={styles.warningText}>{warning}</p>
              ))}
              {statusMessage ? <p className={styles.helperText}>{statusMessage}</p> : null}
            </article>

            <article className={styles.chartCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Grafikler</p>
                  <h3 className={styles.cardTitle}>Waterfall ve net butce trendi</h3>
                </div>
              </div>
              <div className={styles.chartGrid}>
                <div>
                  <WaterfallChart items={result.waterfall} />
                </div>
                <div>
                  <TrendChart items={result.monthlyNetFlow} />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="comparison" className={styles.comparisonGrid}>
          <article className={styles.tableCard}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Birimler</p>
                <h3 className={styles.cardTitle}>Fakulte ve bolum bazinda mali durum</h3>
              </div>
            </div>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>Birim</th>
                  <th>Gelir</th>
                  <th>Gider</th>
                  <th>Sapma %</th>
                  <th>Ogrenci basi maliyet</th>
                </tr>
              </thead>
              <tbody>
                {result.unitComparisons.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{currency.format(row.income)}</td>
                    <td>{currency.format(row.expense)}</td>
                    <td>{row.variancePct}%</td>
                    <td>{currency.format(row.studentCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className={styles.tableCard}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Senaryo Karsilastirma</p>
                <h3 className={styles.cardTitle}>Kaydedilen senaryolar</h3>
              </div>
            </div>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>Senaryo</th>
                  <th>Gelir</th>
                  <th>Gider</th>
                  <th>Net</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {savedScenarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyText}>Henuz kaydedilen senaryo yok.</td>
                  </tr>
                ) : (
                  savedScenarios.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reference ? `${row.name} (referans)` : row.name}</td>
                      <td>{currency.format(row.incomeTotal)}</td>
                      <td>{currency.format(row.expenseTotal)}</td>
                      <td>{currency.format(row.netBalance)}</td>
                      <td>{row.riskCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>
        </section>

        <section className={styles.riskGrid}>
          {result.risks.map((risk) => (
            <article key={risk.id} className={styles.riskCard}>
              <div className={styles.riskHeader}>
                <span className={`${styles.riskLevel} ${styles[`status_${risk.level}`]}`}>{risk.level}</span>
                <strong>{risk.owner}</strong>
              </div>
              <h3 className={styles.cardTitle}>{risk.title}</h3>
              <p className={styles.metaText}>{risk.probableCause}</p>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryTile}>
                  <strong>Mevcut</strong>
                  <span>{risk.currentValue}</span>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Senaryo</strong>
                  <span>{risk.scenarioValue}</span>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Esik</strong>
                  <span>{risk.thresholdLabel}</span>
                </div>
              </div>
              <p className={styles.metaText}>Etki: {risk.impact}</p>
              <p className={styles.metaText}>Aksiyon: {risk.action}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function roundAmount(value: number) {
  return Math.round(value);
}

function CategoryEditor({
  item,
  total,
  onAmountChange,
  onToggle,
  onReset,
}: {
  item: FinancialCategory;
  total: number;
  onAmountChange: (categoryId: string, nextAmount: number) => void;
  onToggle: (categoryId: string) => void;
  onReset: (categoryId: string) => void;
}) {
  const delta = item.scenarioAmount - item.baselineAmount;
  const share = total === 0 ? 0 : (item.scenarioAmount / total) * 100;
  const sliderMin = Math.max(0, item.baselineAmount * 0.4);
  const sliderMax = item.baselineAmount * 1.6 + 1;

  return (
    <div className={styles.categoryRow}>
      <div className={styles.categoryTop}>
        <div className={styles.categoryName}>
          <strong>{item.label}</strong>
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={item.active} onChange={() => onToggle(item.id)} />
            Aktif
          </label>
        </div>
        <div className={styles.valueBlock}>
          <span className={styles.fieldHint}>Baseline</span>
          <strong>{currency.format(item.baselineAmount)}</strong>
        </div>
        <div className={styles.valueBlock}>
          <span className={styles.fieldHint}>Senaryo</span>
          <input
            className={styles.numberInput}
            type="number"
            min={0}
            value={item.scenarioAmount}
            onChange={(event) => onAmountChange(item.id, Number(event.target.value))}
          />
        </div>
        <div className={styles.valueBlock}>
          <span className={styles.fieldHint}>Fark</span>
          <strong className={delta >= 0 ? styles.status_healthy : styles.status_risk}>{currency.format(delta)}</strong>
        </div>
        <div className={styles.valueBlock}>
          <span className={styles.fieldHint}>Pay</span>
          <strong>%{share.toFixed(1)}</strong>
        </div>
        <button type="button" className={styles.ghostButton} onClick={() => onReset(item.id)}>Mevcut degere don</button>
      </div>
      <div className={styles.rowControls}>
        <input
          className={styles.slider}
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={1000}
          value={item.scenarioAmount}
          onChange={(event) => onAmountChange(item.id, Number(event.target.value))}
        />
        <span className={styles.metaText}>{number.format(item.scenarioAmount)}</span>
      </div>
    </div>
  );
}
