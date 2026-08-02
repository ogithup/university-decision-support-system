"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CommandCenterHeader } from "../components/command-center-header";
import { runScenario } from "../../lib/api";
import { ScenarioRunResponse } from "../../types/university";
import styles from "./page.module.css";

type ScenarioPayload = {
  staff_growth_pct?: number;
  budget_change_pct?: number;
  scholarship_change_pct?: number;
};

const scenarioTemplates = [
  {
    scenario_type: "student_growth",
    title: "Ogrenci Sayisi Senaryosu",
    description: "Ogrenci artis veya azalisinin kapasite, personel ve gelir uzerindeki etkisini izler.",
    payload: { staff_growth_pct: 8, budget_change_pct: 5 } satisfies ScenarioPayload,
  },
  {
    scenario_type: "tuition_scholarship",
    title: "Ucret ve Burs Senaryosu",
    description: "Burs ve ucret politikasinin talep ve butce dengesini nasil etkiledigini inceler.",
    payload: { scholarship_change_pct: 6, budget_change_pct: -3 } satisfies ScenarioPayload,
  },
  {
    scenario_type: "new_program",
    title: "Yeni Program Acma",
    description: "Yeni program yatiriminin kadro, kapasite ve maliyet etkisini hesaplar.",
    payload: { staff_growth_pct: 12, budget_change_pct: 7 } satisfies ScenarioPayload,
  },
  {
    scenario_type: "economic_risk",
    title: "Ekonomik Risk Senaryosu",
    description: "Kur ve enflasyon baskisinin gelir-gider yapisina etkisini test eder.",
    payload: { budget_change_pct: -8, scholarship_change_pct: 2 } satisfies ScenarioPayload,
  },
];

const fieldLabels: Record<keyof ScenarioPayload, string> = {
  staff_growth_pct: "Personel degisimi (%)",
  budget_change_pct: "Butce degisimi (%)",
  scholarship_change_pct: "Burs / ucret etkisi (%)",
};

export default function ScenarioCenterPage() {
  const [activeScenario, setActiveScenario] = useState(scenarioTemplates[0]);
  const [manualPayload, setManualPayload] = useState<ScenarioPayload>(scenarioTemplates[0].payload);
  const [result, setResult] = useState<ScenarioRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const riskCount = useMemo(() => result?.risks.length ?? 0, [result]);
  const editableEntries = Object.entries(manualPayload) as Array<[keyof ScenarioPayload, number | undefined]>;

  useEffect(() => {
    setManualPayload(activeScenario.payload);
    setResult(null);
    setError(null);
  }, [activeScenario]);

  function updatePayloadField(field: keyof ScenarioPayload, value: string) {
    const numericValue = value === "" ? undefined : Number(value);
    setManualPayload((current) => ({
      ...current,
      [field]: Number.isNaN(numericValue) ? current[field] : numericValue,
    }));
  }

  async function handleRunScenario() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await runScenario({
        scenario_type: activeScenario.scenario_type,
        academic_year: "2025-2026",
        faculty_id: "FAC-ENG",
        ...manualPayload,
      });
      setResult(response);
    } catch (scenarioError) {
      setError(scenarioError instanceof Error ? scenarioError.message : "Senaryo calistirilamadi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <CommandCenterHeader
        activeLabel="Risk"
        actions={
          <>
          <Link href="/dashboard" className={styles.backLink}>Dashboard&apos;a Don</Link>
          <button type="button" className={styles.primaryButton} onClick={() => void handleRunScenario()} disabled={isLoading}>
            {isLoading ? "Calisiyor..." : "Senaryoyu Calistir"}
          </button>
          </>
        }
      />

      <header className={styles.topbar}>
        <div>
          <p className={styles.sectionLabel}>Scenario Center</p>
          <h1>What-if Senaryo Workspace'i</h1>
          <p className={styles.subtitle}>Ana dashboarddaki modern kokpit diliyle ayni tasarim sistemini kullanan senaryo kurgu ve sonuc merkezi.</p>
        </div>
        <div className={styles.topbarSummary}>
          <div className={styles.summaryBadge}>
            <strong>{editableEntries.length}</strong>
            <span>Manuel parametre</span>
          </div>
          <div className={styles.summaryBadge}>
            <strong>{riskCount}</strong>
            <span>Risk sinyali</span>
          </div>
        </div>
      </header>

      <section className={styles.layout}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Senaryo Kutuphanesi</p>
              <h2>Hazir what-if senaryolari</h2>
            </div>
          </div>
          <div className={styles.templateList}>
            {scenarioTemplates.map((scenario) => (
              <button
                key={scenario.scenario_type}
                type="button"
                className={scenario.scenario_type === activeScenario.scenario_type ? styles.templateActive : styles.templateCard}
                onClick={() => setActiveScenario(scenario)}
              >
                <strong>{scenario.title}</strong>
                <span>{scenario.description}</span>
              </button>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Aktif Kurgu</p>
              <h2>{activeScenario.title}</h2>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <strong>Senaryo Aciklamasi</strong>
            <p>{activeScenario.description}</p>
            <div className={styles.metaRow}>
              {editableEntries.map(([key, value]) => (
                <span key={key}>{fieldLabels[key]}: {value ?? "-"}</span>
              ))}
            </div>
          </div>
          <div className={styles.manualForm}>
            <div className={styles.formTitleRow}>
              <strong>Manuel Senaryo Parametreleri</strong>
              <small>Hazir kurgu degerlerini elle degistirip yeniden senaryo calistirabilirsiniz.</small>
            </div>
            <div className={styles.inputGrid}>
              {editableEntries.map(([field, value]) => (
                <label key={field} className={styles.inputCard}>
                  <span>{fieldLabels[field]}</span>
                  <input
                    type="number"
                    value={value ?? ""}
                    onChange={(event) => updatePayloadField(field, event.target.value)}
                    className={styles.inputField}
                  />
                </label>
              ))}
            </div>
          </div>
          {error ? <p className={styles.errorText}>{error}</p> : null}
          {result ? (
            <div className={styles.resultShell}>
              <div className={styles.resultHero}>
                <div>
                  <p className={styles.sectionLabel}>Sonuc</p>
                  <h3>{result.title}</h3>
                  <p>{result.summary}</p>
                </div>
                <div className={styles.resultMiniStats}>
                  <div className={styles.miniCard}>
                    <strong>{result.baseline.length}</strong>
                    <span>Baseline KPI</span>
                  </div>
                  <div className={styles.miniCard}>
                    <strong>{result.projected.length}</strong>
                    <span>Projected KPI</span>
                  </div>
                  <div className={styles.miniCard}>
                    <strong>{riskCount}</strong>
                    <span>Risk</span>
                  </div>
                </div>
              </div>

              <div className={styles.resultGrid}>
                <div className={styles.resultColumn}>
                  <h4>Baseline</h4>
                  {result.baseline.map((item) => (
                    <div key={item.code} className={styles.metricRow}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className={styles.resultColumn}>
                  <h4>Projected</h4>
                  {result.projected.map((item) => (
                    <div key={item.code} className={styles.metricRow}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.riskStack}>
                {result.risks.map((risk) => (
                  <div key={risk.id} className={styles.riskCard}>
                    <div className={styles.riskHeader}>
                      <span>{risk.level}</span>
                      <strong>{risk.owner}</strong>
                    </div>
                    <p>{risk.title}</p>
                    <small>{risk.action}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
