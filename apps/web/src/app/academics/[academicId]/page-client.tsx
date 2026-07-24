"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AcademicDetail, AcademicWork } from "../../../types/university";
import styles from "./page.module.css";


function scoreTone(score: number) {
  if (score >= 82) {
    return styles.toneExcellent;
  }
  if (score >= 74) {
    return styles.toneHealthy;
  }
  if (score >= 66) {
    return styles.toneWatch;
  }
  return styles.toneCritical;
}


export function AcademicDetailClient({
  academic,
  works,
}: {
  academic: AcademicDetail;
  works: AcademicWork[];
}) {
  const dimensions = Object.entries(academic.score.dimensions);
  const riskPulse = academic.score.risk_level !== "low" || academic.score.data_completeness < 0.82;
  const themeTone = scoreTone(academic.score.overall_score);

  const yearlyImpact = useMemo(() => {
    const years = [2022, 2023, 2024, 2025, 2026];
    return years.map((year, index) => {
      const value = Math.max(48, academic.score.overall_score - 8 + index * 2.4 + academic.score.change);
      return { year, value: Number(value.toFixed(1)) };
    });
  }, [academic.score.change, academic.score.overall_score]);

  const maxTrend = Math.max(...yearlyImpact.map((item) => item.value), 1);

  return (
    <main className={styles.page}>
      <Link href="/dashboard" className={styles.backLink}>
        Dashboard'a Don
      </Link>

      <section className={`${styles.headerCard} ${themeTone} ${riskPulse ? styles.pulseRisk : ""}`}>
        <div>
          <p className={styles.label}>Akademisyen Profili</p>
          <h1>{academic.name}</h1>
          <p className={styles.meta}>
            {academic.title} | {academic.faculty} | {academic.department}
          </p>
          <p className={styles.bio}>{academic.bio}</p>
        </div>
        <div className={styles.headerAside}>
          <div className={styles.scoreHero}>
            <span>Genel Skor</span>
            <strong>{academic.score.overall_score}</strong>
            <small>
              Onceki doneme gore {academic.score.change >= 0 ? "+" : ""}
              {academic.score.change}
            </small>
          </div>
          <div className={`${styles.statusBeacon} ${riskPulse ? styles.beaconCritical : styles.beaconHealthy}`}>
            <span>Risk Durumu</span>
            <strong>{academic.score.risk_level}</strong>
            <small>Veri tamamlilik: %{Math.round(academic.score.data_completeness * 100)}</small>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Temel Gosterge Kartlari</h2>
          <div className={styles.metrics}>
            <div className={scoreTone(academic.publication_count * 3.4)}>
              <strong>{academic.publication_count}</strong>
              <span>Yayin</span>
            </div>
            <div className={scoreTone(academic.citation_count / 4.5)}>
              <strong>{academic.citation_count}</strong>
              <span>Atif</span>
            </div>
            <div className={scoreTone(academic.project_count * 12)}>
              <strong>{academic.project_count}</strong>
              <span>Proje</span>
            </div>
            <div className={scoreTone(academic.international_collaboration_rate * 100)}>
              <strong>%{Math.round(academic.international_collaboration_rate * 100)}</strong>
              <span>Uluslararasi Is Birligi</span>
            </div>
            <div className={scoreTone(100 - academic.teaching_load * 3)}>
              <strong>{academic.teaching_load}</strong>
              <span>Ders Yuku</span>
            </div>
            <div className={scoreTone(academic.advisory_count * 10)}>
              <strong>{academic.advisory_count}</strong>
              <span>Danismanlik</span>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <h2>Alt Boyut Skorlari</h2>
          <div className={styles.dimensionList}>
            {dimensions.map(([key, value]) => (
              <div key={key} className={styles.dimensionRow}>
                <span>{key.replaceAll("_", " ")}</span>
                <div className={styles.dimensionTrack}>
                  <div className={`${styles.dimensionFill} ${scoreTone(value)}`} style={{ width: `${value}%` }} />
                </div>
                <strong className={scoreTone(value)}>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Performans Etki Trendi</h2>
          <div className={styles.trendChart}>
            {yearlyImpact.map((item) => (
              <div key={item.year} className={styles.trendColumn}>
                <div
                  className={`${styles.trendBar} ${scoreTone(item.value)}`}
                  style={{ height: `${Math.max(30, (item.value / maxTrend) * 180)}px` }}
                  title={`${item.year}: ${item.value}`}
                />
                <strong>{item.year}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <h2>Uzmanlik ve Veri Durumu</h2>
          <div className={styles.tags}>
            {academic.expertise.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.insightBlocks}>
            <div className={styles.insightCard}>
              <strong>Hesaplama Donemi</strong>
              <span>{academic.score.period}</span>
            </div>
            <div className={styles.insightCard}>
              <strong>Hesaplanma Tarihi</strong>
              <span>{academic.score.calculated_at}</span>
            </div>
          </div>
          <p className={styles.disclaimer}>{academic.score.disclaimer}</p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Akademik Cikti Zaman Cizelgesi</h2>
          <div className={styles.workList}>
            {works.map((work) => (
              <div key={work.work_id} className={styles.workRow}>
                <div>
                  <strong>{work.title}</strong>
                  <span>
                    {work.work_type} | {work.collaboration_scope}
                  </span>
                </div>
                <div className={styles.workMeta}>
                  <strong>{work.year}</strong>
                  <small>Etki {work.impact_score}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
