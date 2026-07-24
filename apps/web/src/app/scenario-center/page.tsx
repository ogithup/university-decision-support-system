"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { runScenario } from "../../lib/api";
import { ScenarioRunResponse } from "../../types/university";
import styles from "./page.module.css";


const scenarioTemplates = [
  {
    scenario_type: "student_growth",
    title: "Ogrenci Sayisi Senaryosu",
    description: "Ogrenci artis veya azalisinin kapasite, personel ve gelir uzerindeki etkisini izler.",
    payload: { staff_growth_pct: 8, budget_change_pct: 5 },
  },
  {
    scenario_type: "tuition_scholarship",
    title: "Ucret ve Burs Senaryosu",
    description: "Burs ve ucret politikasinin talep ve butce dengesini nasil etkiledigini inceler.",
    payload: { scholarship_change_pct: 6, budget_change_pct: -3 },
  },
  {
    scenario_type: "new_program",
    title: "Yeni Program Acma",
    description: "Yeni program yatiriminin kadro, kapasite ve maliyet etkisini hesaplar.",
    payload: { staff_growth_pct: 12, budget_change_pct: 7 },
  },
  {
    scenario_type: "economic_risk",
    title: "Ekonomik Risk Senaryosu",
    description: "Kur ve enflasyon baskisinin gelir-gider yapisina etkisini test eder.",
    payload: { budget_change_pct: -8, scholarship_change_pct: 2 },
  },
];

export default function ScenarioCenterPage() {
  const [activeScenario, setActiveScenario] = useState(scenarioTemplates[0]);
  const [result, setResult] = useState<ScenarioRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const riskCount = useMemo(() => result?.risks.length ?? 0, [result]);

  async function handleRunScenario() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await runScenario({
        scenario_type: activeScenario.scenario_type,
        academic_year: "2025-2026",
        faculty_id: "FAC-ENG",
        ...activeScenario.payload,
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
      <header className={styles.topbar}>
        <div>
          <p className={styles.sectionLabel}>Scenario Center</p>
          <h1>What-if Senaryo Workspace'i</h1>
          <p className={styles.subtitle}>Dashboard uzerinde yer kaplamayan senaryo kurgu ve sonuc merkezi.</p>
        </div>
        <div className={styles.topbarActions}>
          <Link href="/dashboard" className={styles.backLink}>Dashboard&apos;a Don</Link>
          <button type="button" className={styles.primaryButton} onClick={() => void handleRunScenario()} disabled={isLoading}>
            {isLoading ? "Calisiyor..." : "Senaryoyu Calistir"}
          </button>
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
              {Object.entries(activeScenario.payload).map(([key, value]) => (
                <span key={key}>{key}: {value}</span>
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
