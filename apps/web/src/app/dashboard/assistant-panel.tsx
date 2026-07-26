"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createAnalysisWorkspace } from "../../lib/api";
import styles from "./page.module.css";


type Props = {
  prompts: string[];
};


export function AssistantPanel({ prompts }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(prompts[0] ?? "Bir stratejik soru sorun...");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const workspace = await createAnalysisWorkspace(prompt);
      router.push(`/analysis/workspaces/${workspace.workspace_id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Analiz olusturulamadi.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button type="button" className={styles.assistantLauncher} onClick={() => setIsOpen(true)}>
        AI Stratejik Analiz Asistani
      </button>
    );
  }

  return (
    <section className={styles.assistantShell}>
      <div className={styles.assistantHeader}>
        <div className={styles.assistantCopy}>
          <p className={styles.sectionLabel}>AI Stratejik Analiz Asistani</p>
          <h3>Hizli analiz olusturun</h3>
          <p>
            Ornek soru: “Muhendislik Fakultesinin son uc yillik akademik performansini ve maliyet
            degisimini karsilastir.”
          </p>
        </div>
        <button type="button" className={styles.assistantClose} onClick={() => setIsOpen(false)}>
          Kapat
        </button>
      </div>
      <form className={styles.assistantForm} onSubmit={handleSubmit}>
        <textarea
          className={styles.assistantInput}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          placeholder="Bir stratejik soru sorun..."
        />
        <div className={styles.assistantActions}>
          {prompts.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={styles.ghostChip}
              onClick={() => setPrompt(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className={styles.assistantFooter}>
          <button className={styles.primaryButton} type="submit" disabled={isLoading}>
            {isLoading ? "Analiz Olusturuluyor" : "Analiz Olustur"}
          </button>
          <span className={styles.helperText}>Ayrintili analiz yeni sayfada acilir.</span>
        </div>
        {error ? <p className={styles.errorText}>{error}</p> : null}
      </form>
    </section>
  );
}
