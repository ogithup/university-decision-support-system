"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  createCollectionJob,
  fetchAcademics,
  fetchCollectionJobItems,
  fetchCollectionJobs,
  fetchDataSourceHealth,
  importLocalAcademicsMaster,
  rebuildWarehouse,
  refreshAcademicData,
  uploadIntegrationFile,
  uploadYokAkademikHar,
  uploadYokAkademikHtmlPackage,
} from "../../../lib/api";
import { AcademicListItem, CollectionJob, CollectionJobItem, ProviderHealth } from "../../../types/university";
import styles from "../page.module.css";

const SECTION_OPTIONS = [
  { key: "profile", label: "Profil" },
  { key: "works", label: "Yayin ve calismalar" },
  { key: "projects", label: "Projeler" },
] as const;

const SOURCE_MODES = [
  { key: "auto", label: "Otomatik" },
  { key: "http", label: "HTTP" },
  { key: "browser", label: "Collector / Chromium" },
  { key: "mock", label: "Mock" },
] as const;

function formatJobMessage(job: CollectionJob) {
  return `Job olusturuldu: ${job.job_id} (${job.status})`;
}

export function SettingsClient() {
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [collectionJobs, setCollectionJobs] = useState<CollectionJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobItems, setSelectedJobItems] = useState<CollectionJobItem[]>([]);
  const [academics, setAcademics] = useState<AcademicListItem[]>([]);
  const [selectedAcademicId, setSelectedAcademicId] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>(["profile", "works", "projects"]);
  const [sourceMode, setSourceMode] = useState("auto");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAcademic = useMemo(
    () => academics.find((academic) => academic.academic_id === selectedAcademicId) || null,
    [academics, selectedAcademicId],
  );

  async function loadSettingsState() {
    const [health, jobs, academicList] = await Promise.all([
      fetchDataSourceHealth().catch(() => []),
      fetchCollectionJobs().catch(() => []),
      fetchAcademics().catch(() => []),
    ]);

    setProviderHealth(health);
    setCollectionJobs(jobs);
    setAcademics(academicList);
    setSelectedJobId((current) => current || jobs[0]?.job_id || null);
    setSelectedAcademicId((current) => current || academicList[0]?.academic_id || "");
  }

  useEffect(() => {
    void loadSettingsState();
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadItems() {
      if (!selectedJobId) {
        setSelectedJobItems([]);
        return;
      }
      const items = await fetchCollectionJobItems(selectedJobId).catch(() => []);
      if (alive) {
        setSelectedJobItems(items);
      }
    }

    void loadItems();
    return () => {
      alive = false;
    };
  }, [selectedJobId]);

  async function runAction(actionKey: string, runner: () => Promise<{ message?: string }>) {
    setActiveAction(actionKey);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const response = await runner();
      setStatusMessage(response.message || "Islem tamamlandi.");
      await loadSettingsState();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Islem basarisiz oldu.");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleFileUpload(sourceCode: string, actionKey: string, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    await runAction(actionKey, () => uploadIntegrationFile(sourceCode, "dashboard_admin", file));
  }

  async function handleHarOrPackageUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension === "zip") {
      await runAction("html-package", () => uploadYokAkademikHtmlPackage("dashboard_admin", file));
      return;
    }
    await runAction("html-package", () => uploadYokAkademikHar("dashboard_admin", file));
  }

  function toggleSection(sectionKey: string) {
    setSelectedSections((current) => {
      if (current.includes(sectionKey)) {
        return current.length === 1 ? current : current.filter((item) => item !== sectionKey);
      }
      return [...current, sectionKey];
    });
  }

  return (
    <main className={styles.commandCenter}>
      <header className={styles.stickyRail}>
        <div className={styles.railBrand}>
          <span className={styles.brandEyebrow}>ABU Command Center</span>
          <strong>Veri Kaynaklari ve Senkronizasyon</strong>
        </div>
        <nav className={styles.moduleNav}>
          <a href="#provider-health" className={styles.moduleChip}>
            Kaynaklar
          </a>
          <a href="#collector-mode" className={styles.moduleChip}>
            Collector
          </a>
          <a href="#data-flow" className={styles.moduleChip}>
            Import
          </a>
          <a href="#job-monitor" className={styles.moduleChip}>
            Joblar
          </a>
        </nav>
        <div className={styles.topRailActions}>
          <Link href="/dashboard" className={styles.topRailButton}>
            Dashboard
          </Link>
          <Link href="/scenario-center" className={styles.topRailButton}>
            Senaryo
          </Link>
        </div>
      </header>

      <section className={styles.pageFlow}>
        <section className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Ayarlar</p>
              <h1 className={styles.settingsTitle}>Command Center Yardimcilari</h1>
            </div>
            <span className={styles.sectionPill}>29 Temmuz 2026 durum ekrani</span>
          </div>
          <div className={styles.settingsGrid}>
            <article id="provider-health" className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Veri Modlari</p>
                  <h3>Veri kaynaklari ve senkronizasyon</h3>
                </div>
              </div>
              <div className={styles.healthStack}>
                {providerHealth.map((item) => (
                  <div
                    key={item.provider_name}
                    className={`${styles.healthRow} ${item.status === "blocked" ? styles.pulseRisk : item.status === "degraded" ? styles.pulseWatch : ""}`}
                  >
                    <div>
                      <b>{item.provider_name}</b>
                      <small>{item.detail}</small>
                    </div>
                    <div className={styles.sourceMeta}>
                      <strong>{item.status}</strong>
                      <small>{item.last_error_category || item.source_type}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article id="collector-mode" className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Collector Modu</p>
                  <h3>Chromium destekli yenileme akisi</h3>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <strong>Kaynak modu</strong>
                <div className={styles.chipRow}>
                  {SOURCE_MODES.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      className={`${styles.controlChip} ${sourceMode === mode.key ? styles.controlChipActive : ""}`}
                      onClick={() => setSourceMode(mode.key)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <small className={styles.helperText}>`browser` modu collector akisina ayrildi. `http` 403 verirse file-based fallback devam eder.</small>
              </div>
              <div className={styles.controlGroup}>
                <strong>Toplanacak bolumler</strong>
                <div className={styles.checkboxGrid}>
                  {SECTION_OPTIONS.map((section) => (
                    <label key={section.key} className={styles.checkboxCard}>
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(section.key)}
                        onChange={() => toggleSection(section.key)}
                      />
                      <span>{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.adminActionStack}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={activeAction === "collector-batch"}
                  onClick={() =>
                    void runAction("collector-batch", async () => {
                      const job = await createCollectionJob("dashboard_admin", {
                        sourceMode,
                        sections: selectedSections,
                      });
                      return { message: formatJobMessage(job) };
                    })
                  }
                >
                  {activeAction === "collector-batch" ? "Collector calisiyor..." : "Tum akademisyenler icin collector calistir"}
                </button>
              </div>
            </article>

            <article className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionLabel}>Tek Akademisyen</p>
                  <h3>Ilgili hocanin collectorunu calistir</h3>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label htmlFor="academic-select" className={styles.fieldLabel}>
                  Akademisyen sec
                </label>
                <select
                  id="academic-select"
                  className={styles.selectField}
                  value={selectedAcademicId}
                  onChange={(event) => setSelectedAcademicId(event.target.value)}
                >
                  {academics.map((academic) => (
                    <option key={academic.academic_id} value={academic.academic_id}>
                      {academic.name} | {academic.faculty} | {academic.department}
                    </option>
                  ))}
                </select>
                {selectedAcademic ? (
                  <div className={styles.utilityMeta}>
                    <span>{selectedAcademic.title}</span>
                    <span>Skor {selectedAcademic.overall_score}</span>
                  </div>
                ) : null}
              </div>
              <div className={styles.adminActionStack}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={activeAction === "collector-single" || !selectedAcademicId}
                  onClick={() =>
                    void runAction("collector-single", async () => {
                      const job = await refreshAcademicData(selectedAcademicId, "dashboard_admin", {
                        sourceMode,
                        sections: selectedSections,
                      });
                      return { message: formatJobMessage(job) };
                    })
                  }
                >
                  {activeAction === "collector-single" ? "Calisiyor..." : "Secili akademisyen collectorunu calistir"}
                </button>
              </div>
            </article>
          </div>
        </section>

        <section id="data-flow" className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Import</p>
              <h2>Dosya tabanli veri akisi</h2>
            </div>
          </div>
          <div className={styles.settingsGrid}>
            <article className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Warehouse ve master akislari</h3>
                </div>
              </div>
              <div className={styles.adminActionStack}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={activeAction === "academics-master"}
                  onClick={() => void runAction("academics-master", () => importLocalAcademicsMaster("dashboard_admin"))}
                >
                  {activeAction === "academics-master" ? "Calisiyor..." : "Akademisyen master yenile"}
                </button>
                <button
                  type="button"
                  className={styles.ghostChip}
                  disabled={activeAction === "warehouse-rebuild"}
                  onClick={() =>
                    void runAction("warehouse-rebuild", () => rebuildWarehouse("yok_akademik_all_files", "dashboard_admin"))
                  }
                >
                  {activeAction === "warehouse-rebuild" ? "Hesaplaniyor..." : "Warehouse yeniden hesapla"}
                </button>
              </div>
            </article>

            <article className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Yayin ve proje dosyalari</h3>
                </div>
              </div>
              <div className={styles.adminActionStack}>
                <label className={styles.fileAction}>
                  <span>Yayin verisi yukle</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(event) => {
                      void handleFileUpload("yok_akademik_publications_file", "publications-upload", event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className={styles.fileAction}>
                  <span>Proje verisi yukle</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(event) => {
                      void handleFileUpload("yok_akademik_projects_file", "projects-upload", event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </article>

            <article className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>HTML / HAR paketi</h3>
                </div>
              </div>
              <div className={styles.adminActionStack}>
                <label className={styles.fileAction}>
                  <span>HTML paketini veya HAR dosyasini ice al</span>
                  <input
                    type="file"
                    accept=".har,.zip"
                    onChange={(event) => {
                      void handleHarOrPackageUpload(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </article>
          </div>

          {statusMessage ? <p className={styles.helperText}>{statusMessage}</p> : null}
          {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}
        </section>

        <section id="job-monitor" className={styles.sectionStack}>
          <div className={styles.sectionTitleRow}>
            <div>
              <p className={styles.sectionLabel}>Izleme</p>
              <h2>Collection job ve item detaylari</h2>
            </div>
          </div>
          <div className={styles.settingsGrid}>
            <article className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Son refresh joblari</h3>
                </div>
              </div>
              <div className={styles.jobStack}>
                {collectionJobs.slice(0, 8).map((job) => (
                  <button key={job.job_id} type="button" className={styles.jobRow} onClick={() => setSelectedJobId(job.job_id)}>
                    <div>
                      <b>{job.job_type}</b>
                      <small>{job.provider_name || job.source_mode}</small>
                    </div>
                    <div className={styles.sourceMeta}>
                      <strong>{job.status}</strong>
                      <small>
                        {job.completed_items}/{job.total_items}
                      </small>
                    </div>
                  </button>
                ))}
                {collectionJobs.length === 0 ? <small className={styles.helperText}>Henuz collection job yok.</small> : null}
              </div>
            </article>

            <article className={`${styles.glassPanel} ${styles.settingsPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Secili job item detaylari</h3>
                </div>
              </div>
              <div className={styles.jobStack}>
                {selectedJobItems.slice(0, 16).map((item) => (
                  <div key={item.item_id} className={styles.jobRow}>
                    <div>
                      <b>{item.academic_id || "system"}</b>
                      <small>
                        {item.section_name} | {item.provider_name || item.source_mode || "unknown"}
                      </small>
                      {item.error_message ? <small>{item.error_message}</small> : null}
                    </div>
                    <div className={styles.sourceMeta}>
                      <strong>{item.status}</strong>
                      <small>{item.record_count} kayit</small>
                    </div>
                  </div>
                ))}
                {selectedJobItems.length === 0 ? <small className={styles.helperText}>Job secince item detaylari burada gorunur.</small> : null}
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
