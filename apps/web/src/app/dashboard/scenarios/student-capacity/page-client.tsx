"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import styles from "../../decision-support.module.css";
import {
  CapacityScenarioInput,
  SavedScenario,
  getCapacityBaseline,
  getDefaultCapacityScenarioInput,
} from "../../../../lib/decision-support";
import { calculateCapacityScenario } from "../../../../lib/decision-support-calculations";

const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const STORAGE_KEY = "abu-capacity-scenarios-v1";

const fieldDefinitions: Array<{ key: keyof CapacityScenarioInput; label: string; min: number; max: number; step: number }> = [
  { key: "totalStudents", label: "Toplam ogrenci", min: 4000, max: 20000, step: 10 },
  { key: "activeStudents", label: "Aktif ogrenci", min: 4000, max: 20000, step: 10 },
  { key: "newAdmissions", label: "Yeni kayit", min: 500, max: 5000, step: 10 },
  { key: "graduateCount", label: "Mezun sayisi", min: 300, max: 5000, step: 10 },
  { key: "growthPct", label: "Ogrenci buyume/azalis orani %", min: -30, max: 40, step: 1 },
  { key: "courseCount", label: "Ders sayisi", min: 100, max: 900, step: 5 },
  { key: "sectionCount", label: "Sube sayisi", min: 50, max: 600, step: 5 },
  { key: "averageClassSize", label: "Ortalama sinif buyuklugu", min: 10, max: 120, step: 1 },
  { key: "weeklyCourseHours", label: "Haftalik ders saati", min: 4, max: 32, step: 1 },
  { key: "labRequiredCourseRate", label: "Lab gerektiren ders orani %", min: 0, max: 100, step: 1 },
  { key: "labHoursPerCourse", label: "Ders basina lab saati", min: 0, max: 8, step: 1 },
  { key: "academicStaff", label: "Akademik personel", min: 30, max: 300, step: 1 },
  { key: "targetStudentsPerAcademic", label: "Hedef ogrenci/akademisyen", min: 5, max: 50, step: 1 },
  { key: "classroomCount", label: "Derslik sayisi", min: 2, max: 60, step: 1 },
  { key: "laboratoryCount", label: "Laboratuvar sayisi", min: 1, max: 40, step: 1 },
  { key: "classroomSeatCapacity", label: "Derslik kapasitesi", min: 20, max: 160, step: 1 },
  { key: "laboratorySeatCapacity", label: "Laboratuvar kapasitesi", min: 10, max: 80, step: 1 },
  { key: "availableWeeklyHours", label: "Kullanilabilir haftalik saat", min: 10, max: 90, step: 1 },
  { key: "maintenanceHoursLoss", label: "Bakim nedeniyle kaybedilen saat", min: 0, max: 60, step: 1 },
  { key: "averageTuition", label: "Ortalama ogrenim ucreti", min: 10000, max: 250000, step: 1000 },
  { key: "scholarshipRate", label: "Burslu ogrenci orani %", min: 0, max: 100, step: 1 },
];

export function StudentCapacityClient() {
  const baseline = useMemo(() => getCapacityBaseline(), []);
  const [input, setInput] = useState<CapacityScenarioInput>(() => getDefaultCapacityScenarioInput(baseline));
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
      setSavedScenarios(JSON.parse(raw) as SavedScenario[]);
    } catch {
      setSavedScenarios([]);
    }
  }, []);

  const result = useMemo(() => calculateCapacityScenario(baseline, input, savedScenarios), [baseline, input, savedScenarios]);
  const isDirty = useMemo(() => {
    const defaults = getDefaultCapacityScenarioInput(baseline);
    return fieldDefinitions.some(({ key }) => input[key] !== defaults[key]);
  }, [baseline, input]);

  function updateField(key: keyof CapacityScenarioInput, value: string) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return;
    }
    setInput((current) => ({ ...current, [key]: numeric, sourceMode: "manual" }));
  }

  function resetScenario() {
    setInput(getDefaultCapacityScenarioInput(baseline));
    setStatusMessage("Ogrenci, personel ve kapasite senaryosu baseline degerlere donduruldu.");
  }

  function saveScenario() {
    const nextSaved = result.savedScenarios.map((item, index, array) => ({
      ...item,
      reference: index === array.length - 1,
      name: index === array.length - 1 ? input.scenarioName : item.name,
    }));
    setSavedScenarios(nextSaved);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSaved));
    }
    setStatusMessage(`Senaryo kaydedildi: ${input.scenarioName}`);
  }

  return (
    <main className={styles.page}>
      <header className={styles.stickyRail}>
        <div className={styles.railBrand}>
          <span className={styles.brandEyebrow}>ABU Command Center</span>
          <strong>Ogrenci, Personel ve Mekan Kapasitesi</strong>
        </div>
        <nav className={styles.railLinks}>
          <a href="#capacity-kpis" className={styles.chip}>KPI</a>
          <a href="#capacity-inputs" className={styles.chip}>Senaryo Girisleri</a>
          <a href="#capacity-results" className={styles.chip}>Sonuclar</a>
        </nav>
        <div className={styles.railActionGroup}>
          <Link href="/dashboard" className={styles.linkButton}>Dashboard&apos;a Don</Link>
          <button type="button" className={styles.ghostButton} onClick={resetScenario}>Baseline&apos;a don</button>
          <button type="button" className={styles.primaryButton} onClick={saveScenario}>Senaryoyu kaydet</button>
        </div>
      </header>

      <section className={styles.body}>
        <section className={styles.hero}>
          <article className={styles.panel}>
            <div className={styles.heroCopy}>
              <div>
                <p className={styles.sectionLabel}>Kapasite Senaryosu</p>
                <h1 className={styles.heroTitle}>Ogrenci, Personel ve Mekan Kapasitesi What-if Analizi</h1>
                <p className={styles.heroSummary}>Ogrenci sayisindaki degisimin gelir, maliyet, akademik kadro, derslik ve laboratuvar kapasitesi uzerindeki etkisini test edin.</p>
              </div>
              <div className={styles.heroMetaRail}>
                <span className={styles.sectionPill}>Donem: {baseline.selectedPeriod}</span>
                <span className={styles.sectionPill}>Veri kaynagi: {input.sourceMode}</span>
                <span className={styles.sectionPill}>Mock schedule heatmap</span>
                {isDirty ? <span className={styles.dirtyPill}>Kaydedilmemis degisiklikler</span> : null}
              </div>
            </div>
          </article>

          <aside className={styles.heroMeta}>
            <div className={styles.summaryTile}>
              <p className={styles.sectionLabel}>Senaryo Adi</p>
              <input className={styles.numberInput} value={input.scenarioName} onChange={(event) => setInput((current) => ({ ...current, scenarioName: event.target.value }))} />
            </div>
            <div className={styles.summaryTile}>
              <p className={styles.sectionLabel}>Son Guncelleme</p>
              <strong>{baseline.lastUpdated.slice(0, 16).replace("T", " ")}</strong>
              <span className={styles.metaText}>Baseline ve senaryo degerleri ayni provider sozlesmesinden gelir.</span>
            </div>
          </aside>
        </section>

        <section id="capacity-kpis" className={styles.stack}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>KPI Kartlari</p>
              <h2 className={styles.sectionTitle}>Gelir, personel ve kapasite etkisi</h2>
            </div>
          </div>
          <div className={styles.kpiGrid}>
            {result.metrics.map((metric) => (
              <article key={metric.id} className={styles.kpiCard} title={metric.tooltip}>
                <span>{metric.label}</span>
                <strong className={styles.kpiValue}>
                  {metric.unit === "TRY" && metric.scenario !== null ? currency.format(metric.scenario) : metric.unit === "%" && metric.scenario !== null ? `%${metric.scenario.toFixed(1)}` : metric.scenario ?? "Veri gerekli"}
                </strong>
                <div className={styles.kpiMeta}>
                  <span>{metric.baseline === null ? "Baseline yok" : metric.unit === "TRY" ? currency.format(metric.baseline) : metric.unit === "%" ? `%${metric.baseline.toFixed(1)}` : metric.baseline}</span>
                  <span className={styles[`status_${metric.status}`]}>{metric.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="capacity-inputs" className={styles.workspaceGrid}>
          <article className={styles.tableCard}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionLabel}>Senaryo Girisleri</p>
                <h3 className={styles.cardTitle}>Manuel alan ve slider senkronizasyonu</h3>
              </div>
            </div>
            <div className={styles.fieldGrid}>
              {fieldDefinitions.map((field) => (
                <div key={field.key} className={styles.fieldCard}>
                  <div className={styles.fieldCardHeader}>
                    <strong>{field.label}</strong>
                    <small className={styles.fieldHint}>Baseline: {String(getDefaultCapacityScenarioInput(baseline)[field.key])}</small>
                  </div>
                  <input
                    className={styles.numberInput}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={typeof input[field.key] === "number" ? input[field.key] : ""}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                  <input
                    className={styles.slider}
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={typeof input[field.key] === "number" ? input[field.key] : field.min}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </article>

          <div className={styles.stack}>
            <article className={styles.chartCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Tuition ve Personel</p>
                  <h3 className={styles.cardTitle}>Brut gelir, burs etkisi ve kadro ihtiyaci</h3>
                </div>
              </div>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryTile}>
                  <strong>Brut gelir</strong>
                  <span>{currency.format(result.tuitionImpact.grossTuition)}</span>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Tahmini burs</strong>
                  <span>{currency.format(result.tuitionImpact.estimatedScholarships)}</span>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Net tuition</strong>
                  <span>{currency.format(result.tuitionImpact.netTuition)}</span>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Gerekli akademik personel</strong>
                  <span>{result.staffNeed.requiredAcademicStaff}</span>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Ek kadro ihtiyaci</strong>
                  <span>{result.staffNeed.additionalNeed}</span>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Personel fazlasi</strong>
                  <span>{result.staffNeed.excessStaff}</span>
                </div>
              </div>
            </article>

            <article className={styles.chartCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Doluluk</p>
                  <h3 className={styles.cardTitle}>Derslik ve laboratuvar kapasite baskisi</h3>
                </div>
              </div>
              <div className={styles.stack}>
                <div>
                  <div className={styles.chartLabel}>
                    <span>Derslik doluluk</span>
                    <strong>{result.occupancy.classroomPct === null ? "Veri gerekli" : `%${result.occupancy.classroomPct}`}</strong>
                  </div>
                  <div className={styles.gaugeTrack}><div className={styles.gaugeFill} style={{ width: `${Math.min(100, result.occupancy.classroomPct || 0)}%` }} /></div>
                </div>
                <div>
                  <div className={styles.chartLabel}>
                    <span>Laboratuvar doluluk</span>
                    <strong>{result.occupancy.laboratoryPct === null ? "Veri gerekli" : `%${result.occupancy.laboratoryPct}`}</strong>
                  </div>
                  <div className={styles.gaugeTrack}><div className={styles.gaugeFill} style={{ width: `${Math.min(100, result.occupancy.laboratoryPct || 0)}%` }} /></div>
                </div>
                <div className={styles.summaryTile}>
                  <strong>Laboratuvar saat acigi / fazlasi</strong>
                  <span>{result.occupancy.labHoursGap} saat</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="capacity-results" className={styles.stack}>
          <div className={styles.chartGrid}>
            <article className={styles.chartCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Laboratuvarlar</p>
                  <h3 className={styles.cardTitle}>Tur bazinda kapasite kirilimi</h3>
                </div>
              </div>
              <div className={styles.matrixGrid}>
                {result.laboratoryBreakdown.map((lab) => (
                  <div key={lab.label} className={styles.matrixRow}>
                    <div>
                      <strong>{lab.label}</strong>
                      <div className={styles.metaText}>{lab.type}</div>
                    </div>
                    <div>
                      <div className={styles.gaugeTrack}>
                        <div className={styles.gaugeFill} style={{ width: `${Math.min(100, lab.utilizationPct)}%` }} />
                      </div>
                    </div>
                    <div>
                      <strong>%{lab.utilizationPct}</strong>
                      <div className={styles.metaText}>{lab.gapHours} saat acik</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.chartCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Heatmap</p>
                  <h3 className={styles.cardTitle}>Mock schedule laboratuvar kullanim isi haritasi</h3>
                </div>
              </div>
              <div className={styles.heatmap}>
                {["Pzt", "Sal", "Car", "Per", "Cum"].map((day) => (
                  <div key={day} className={styles.heatmapRow}>
                    <strong>{day}</strong>
                    {result.heatmap.filter((cell) => cell.day === day).map((cell) => (
                      <div
                        key={`${cell.day}-${cell.hour}`}
                        className={styles.heatmapCell}
                        style={{ background: `rgba(69, 209, 184, ${Math.max(0.15, cell.utilizationPct / 120)})` }}
                      >
                        {cell.hour} %{cell.utilizationPct}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className={styles.comparisonGrid}>
            <article className={styles.tableCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Fakulte Matrisi</p>
                  <h3 className={styles.cardTitle}>Ogrenci, maliyet ve kapasite baskisi</h3>
                </div>
              </div>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Birim</th>
                    <th>Aktif ogrenci</th>
                    <th>Ogrenci basi maliyet</th>
                    <th>Kapasite baskisi</th>
                  </tr>
                </thead>
                <tbody>
                  {result.facultyMatrix.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.activeStudents}</td>
                      <td>{currency.format(row.studentCost)}</td>
                      <td>%{row.capacityPressure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className={styles.tableCard}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Senaryo Karsilastirma</p>
                  <h3 className={styles.cardTitle}>Kaydedilen kapasite senaryolari</h3>
                </div>
              </div>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Senaryo</th>
                    <th>Ogrenci basi maliyet</th>
                    <th>Personel ihtiyaci</th>
                    <th>Lab doluluk</th>
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
                        <td>{row.studentCost ? currency.format(row.studentCost) : "Veri gerekli"}</td>
                        <td>{row.personnelNeed ?? "-"}</td>
                        <td>{row.laboratoryOccupancy ? `%${row.laboratoryOccupancy}` : "-"}</td>
                        <td>{row.riskCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </article>
          </div>

          <div className={styles.riskGrid}>
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
          </div>
          {statusMessage ? <p className={styles.helperText}>{statusMessage}</p> : null}
        </section>
      </section>
    </main>
  );
}
