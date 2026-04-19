"use client";

import { useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import {
  type RelationshipType,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_LABELS,
  resolveGeneration,
} from "@/lib/generationUtils";
import styles from "./GenerationPicker.module.css";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onGenerationResolved: (generation: number) => void;
  currentGeneration?:   number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GenerationPicker({
  onGenerationResolved,
  currentGeneration,
}: Props) {
  const persons = useFamilyStore((s) => s.familyData.persons);

  const [referenceId,  setReferenceId]  = useState<string>("");
  const [relationship, setRelationship] = useState<RelationshipType>("same generation as");
  const [resolved,     setResolved]     = useState<number | null>(currentGeneration ?? null);
  const [error,        setError]        = useState<string | null>(null);

  // ── Recalcular cuando cambia referencia o relación ────────────────────────

  function handleResolve(refId: string, rel: RelationshipType) {
    if (!refId) {
      setResolved(null);
      setError(null);
      return;
    }

    const result = resolveGeneration(refId, rel, persons);

    if (result === null) {
      setError("No se pudo calcular la generación.");
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.picker}>
      <label className={styles.label}>Generación</label>

      <div className={styles.row}>
        <select
          className={styles.select}
          value={relationship}
          onChange={handleRelationshipChange}
        >
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {RELATIONSHIP_LABELS[opt]}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={referenceId}
          onChange={handleReferenceChange}
        >
          <option value="">— elegir persona —</option>
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
            <span className={styles.resultLabel}>Generación calculada:</span>
            <span className={styles.resultValue}>{resolved}</span>
          </>
        ) : (
          <span className={styles.resultHint}>
            Seleccioná una persona de referencia
          </span>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}