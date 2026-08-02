import { ReactNode } from "react";
import Link from "next/link";

import styles from "./command-center-header.module.css";

const moduleTabs = [
  { id: "executive-summary", label: "Genel Bakis" },
  { id: "academic-performance-center", label: "Akademik" },
  { id: "faculty-analysis", label: "Fakulteler" },
  { id: "academic-collaboration", label: "Is Birlikleri" },
  { id: "finance-analysis", label: "Mali" },
  { id: "risk-early-warning", label: "Risk" },
  { id: "benchmark-area", label: "Benchmark" },
] as const;

export function CommandCenterHeader({
  activeLabel,
  actions,
}: {
  activeLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.stickyRail}>
      <div className={styles.railBrand}>
        <span className={styles.brandEyebrow}>ABU Command Center</span>
        <strong>Universite Stratejik Yonetim Kokpiti</strong>
      </div>
      <nav className={styles.moduleNav}>
        {moduleTabs.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard#${item.id}`}
            className={item.label === activeLabel ? styles.activeChip : styles.moduleChip}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>{actions}</div>
    </header>
  );
}
