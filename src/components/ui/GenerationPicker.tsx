"use client";

import { useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import {
  type RelationshipType,
  RELATIONSHIP_OPTIONS,
  resolveGeneration,
} from "@/lib/generationUtils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Llamado cuando se resuelve una generación válida */
  onGenerationResolved: (generation: number) => void;
  /** Generación actual (para mostrar el valor previo en edición) */
  currentGeneration?: number | null;
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

  const [referenceId,   setReferenceId]   = useState<string>("");
  const [relationship,  setRelationship]  = useState<RelationshipType>("misma generación que");
  const [resolved,      setResolved]      = useState<number | null>(currentGeneration ?? null);
  const [error,         setError]         = useState<string | null>(null);

  // ── Cuando cambia referencia o relación, recalcular ──────────────────────

  function handleResolve(
    refId: string,
    rel: RelationshipType
  ) {
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
    <div className="gen-picker">
      <label className="gen-picker__label">Generación</label>

      <div className="gen-picker__row">
        {/* Selector de relación */}
        <select
          className="gen-picker__select gen-picker__select--rel"
          value={relationship}
          onChange={handleRelationshipChange}
        >
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Selector de persona de referencia */}
        <select
          className="gen-picker__select gen-picker__select--person"
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

      {/* Resultado */}
      <div className="gen-picker__result" data-state={resolved !== null ? "resolved" : "empty"}>
        {resolved !== null ? (
          <>
            <span className="gen-picker__result-label">Generación calculada:</span>
            <span className="gen-picker__result-value">{resolved}</span>
          </>
        ) : (
          <span className="gen-picker__result-hint">
            Seleccioná una persona de referencia
          </span>
        )}
      </div>

      {error && <p className="gen-picker__error">{error}</p>}

      <style>{styles}</style>
    </div>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = `
  .gen-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gen-picker__label {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #444;
  }

  .gen-picker__row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .gen-picker__select {
    width: 100%;
    background: #111;
    border: 1px solid #222;
    border-radius: 4px;
    color: #d0d0d0;
    font-family: Georgia, serif;
    font-size: 12px;
    padding: 7px 10px;
    cursor: pointer;
    transition: border-color 150ms ease;
    appearance: none;
  }

  .gen-picker__select:focus {
    outline: none;
    border-color: #c9a84c44;
  }

  .gen-picker__result {
    padding: 8px 10px;
    border-radius: 4px;
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
  }

  .gen-picker__result-label {
    font-size: 10px;
    color: #444;
    letter-spacing: 0.04em;
  }

  .gen-picker__result-value {
    font-size: 13px;
    color: #c9a84c;
    font-family: Georgia, serif;
    font-weight: 600;
  }

  .gen-picker__result-hint {
    font-size: 11px;
    color: #333;
    font-style: italic;
  }

  .gen-picker__error {
    font-size: 11px;
    color: #9a4a4a;
    margin: 0;
  }
`;