"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import {
  type RelationshipType,
  RELATIONSHIP_OPTIONS,
  resolveGeneration,
} from "@/lib/generationUtils";
import styles from "./GenerationPicker.module.css";

interface Props {
  onGenerationResolved: (generation: number) => void;
  currentGeneration?:   number | null;
}

function getFullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`;
}

export default function GenerationPicker({
  onGenerationResolved,
  currentGeneration,
}: Props) {
  const t = useTranslations("generation");
  const persons = useFamilyStore((s) => s.familyData.persons);

  const [referenceId,  setReferenceId]  = useState<string>("");
  const [relationship, setRelationship] = useState<RelationshipType>("same_generation");
  const [resolved,     setResolved]     = useState<number | null>(currentGeneration ?? null);
  const [error,        setError]        = useState<string | null>(null);

  function handleResolve(refId: string, rel: RelationshipType) {
    if (!refId) {
      setResolved(null);
      setError(null);
      return;
    }
    const result = resolveGeneration(refId, rel, persons);
    if (result === null) {
      setError(t("calcError"));
      setResolved(null);
      return;
    }
    setError(null);
    setResolved(result);
    onGenerationResolved(result);
  }

  function handleReferenceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const refId = e.target.value;
    setReferenceId(refId);
    handleResolve(refId, relationship);
  }

  function handleRelationshipChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const rel = e.target.value as RelationshipType;
    setRelationship(rel);
    handleResolve(referenceId, rel);
  }

  return (
    <div className={styles.picker}>
      <label className={styles.label}>{t("label")}</label>

      <div className={styles.row}>
        <select
          className={styles.select}
          value={relationship}
          onChange={handleRelationshipChange}
        >
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(opt)}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={referenceId}
          onChange={handleReferenceChange}
        >
          <option value="">{t("choosePersonHint")}</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {getFullName(p)}
            </option>
          ))}
        </select>
      </div>

      <div
        className={styles.result}
        data-state={resolved !== null ? "resolved" : "empty"}
      >
        {resolved !== null ? (
          <>
            <span className={styles.resultLabel}>{t("calculatedLabel")}</span>
            <span className={styles.resultValue}>{resolved}</span>
          </>
        ) : (
          <span className={styles.resultHint}>{t("referenceHint")}</span>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}