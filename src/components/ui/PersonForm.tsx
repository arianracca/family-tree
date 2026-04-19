"use client";

import { useState, useRef } from "react";
import { usePersonForm } from "@/hooks/usePersonForm";
import GenerationPicker from "@/components/ui/GenerationPicker";
import { useFamilyStore } from "@/store/useFamilyStore";
import type { FormMode } from "@/hooks/usePersonForm";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  mode:       FormMode;
  personId?:  string;
  onSuccess?: () => void;
  onCancel?:  () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="pf-section-title">{children}</h3>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pf-field">
      <label className="pf-field__label">{label}</label>
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PersonForm({ mode, personId, onSuccess, onCancel }: Props) {
  const persons = useFamilyStore((s) => s.familyData.persons);

  const {
  formData, isSubmitting, error,
  setField, setGeneration,
  addNationality, removeNationality,
  addCustomField, updateCustomField, removeCustomField,
  submit, reset,
} = usePersonForm({ mode, personId, onSuccess });

  // ── Nacionalidad input local ──────────────────────────────────────────────
const [nationalityInput, setNationalityInput] = useState("");

  function handleAddNationality() {
    if (!nationalityInput.trim()) return;
    addNationality(nationalityInput);
    setNationalityInput("");
  }

  // ── Personas disponibles para relaciones ──────────────────────────────────
  // Excluye a la persona que se está editando
  const otherPersons = persons.filter((p) => p.id !== personId);

  function getFullName(p: { firstName: string; lastName: string }) {
    return `${p.firstName} ${p.lastName}`;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="person-form">
      <div className="person-form__body">

        {/* ── Datos básicos ── */}
        <SectionTitle>Datos básicos</SectionTitle>

        <Field label="Nombre *">
          <input
            className="pf-input"
            value={formData.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder="Ej: Juan"
          />
        </Field>

        <Field label="Segundos nombres">
          <input
            className="pf-input"
            value={formData.middleName}
            onChange={(e) => setField("middleName", e.target.value)}
            placeholder="Opcional"
          />
        </Field>

        <Field label="Apellido *">
          <input
            className="pf-input"
            value={formData.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder="Ej: González"
          />
        </Field>

        <Field label="Apellido materno">
          <input
            className="pf-input"
            value={formData.motherLastName}
            onChange={(e) => setField("motherLastName", e.target.value)}
            placeholder="Opcional"
          />
        </Field>

        <Field label="¿Está vivo?">
          <div className="pf-toggle-row">
            <button
              type="button"
              className="pf-toggle"
              data-active={formData.isAlive}
              onClick={() => setField("isAlive", !formData.isAlive)}
            >
              <span className="pf-toggle__knob" />
            </button>
            <span className="pf-toggle__label">
              {formData.isAlive ? "Sí" : "No"}
            </span>
          </div>
        </Field>

        {/* ── Fechas y lugar ── */}
        <SectionTitle>Origen y fechas</SectionTitle>

        <Field label="Lugar de nacimiento">
          <input
            className="pf-input"
            value={formData.birthPlace}
            onChange={(e) => setField("birthPlace", e.target.value)}
            placeholder="Ej: Buenos Aires"
          />
        </Field>

        <Field label="Ciudad de residencia">
          <input
            className="pf-input"
            value={formData.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Ej: Córdoba"
          />
        </Field>

        <Field label="Fecha de nacimiento">
          <input
            className="pf-input"
            type="date"
            value={formData.birthDate ?? ""}
            onChange={(e) => setField("birthDate", e.target.value)}
          />
        </Field>

        {!formData.isAlive && (
          <Field label="Fecha de fallecimiento">
            <input
              className="pf-input"
              type="date"
              value={formData.deathDate ?? ""}
              onChange={(e) => setField("deathDate", e.target.value)}
            />
          </Field>
        )}

        <Field label="Nacionalidades">
          <div className="pf-chips">
            {formData.nationalities.map((n, i) => (
              <span key={i} className="pf-chip">
                {n}
                <button type="button" className="pf-chip__remove" onClick={() => removeNationality(i)}>×</button>
              </span>
            ))}
          </div>
          <div className="pf-chip-input-row">
            <input
              className="pf-input"
              value={nationalityInput}
              onChange={(e) => setNationalityInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddNationality(); } }}
              placeholder="Ej: Argentina — Enter para agregar"
            />
            <button type="button" className="pf-btn pf-btn--ghost" onClick={handleAddNationality}>+</button>
          </div>
        </Field>

        {/* ── Generación ── */}
        <SectionTitle>Generación *</SectionTitle>
        <GenerationPicker
          onGenerationResolved={setGeneration}
          currentGeneration={formData.generation}
        />
        {formData.generation !== null && (
          <p className="pf-gen-display">
            Generación asignada: <strong>{formData.generation}</strong>
          </p>
        )}

        {/* ── Relaciones ── */}
        <SectionTitle>Relaciones</SectionTitle>

        <Field label="Pareja">
          <select
            className="pf-input"
            value={formData.coupleId ?? ""}
            onChange={(e) =>
              setField("coupleId", e.target.value || null)
            }
          >
            <option value="">— sin pareja —</option>
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>
                {getFullName(p)}
              </option>
            ))}
          </select>
        </Field>

        {formData.coupleId && (
          <Field label="¿Pareja activa?">
            <div className="pf-toggle-row">
              <button
                type="button"
                className="pf-toggle"
                data-active={formData.coupleActive}
                onClick={() => setField("coupleActive", !formData.coupleActive)}
              >
                <span className="pf-toggle__knob" />
              </button>
              <span className="pf-toggle__label">
                {formData.coupleActive ? "Sí" : "No"}
              </span>
            </div>
          </Field>
        )}

        <Field label="Padres">
          <select
            className="pf-input"
            multiple
            size={Math.min(5, otherPersons.length)}
            value={formData.parentIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              setField("parentIds", selected);
            }}
          >
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>
                {getFullName(p)}
              </option>
            ))}
          </select>
          <span className="pf-hint">Ctrl+click para seleccionar múltiples</span>
        </Field>

        <Field label="Hijos">
          <select
            className="pf-input"
            multiple
            size={Math.min(5, otherPersons.length)}
            value={formData.childrenIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              setField("childrenIds", selected);
            }}
          >
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>
                {getFullName(p)}
              </option>
            ))}
          </select>
          <span className="pf-hint">Ctrl+click para seleccionar múltiples</span>
        </Field>

        {/* ── Historia ── */}
        <Field label="Biografía / Anécdotas">
          <textarea
            className="pf-input pf-input--textarea"
            value={formData.history ?? ""}
            onChange={(e) => setField("history", e.target.value)}
            placeholder="Escribí una biografía, anécdotas, recuerdos..."
            rows={5}
          />
        </Field>

        {/* ── Campos personalizados ── */}
        <SectionTitle>Campos personalizados</SectionTitle>

        {formData.customFields.map((field, i) => (
          <div key={field.key} className="pf-custom-field">
            <input
              className="pf-input pf-input--custom-label"
              value={field.label}
              onChange={(e) =>
                updateCustomField(i, { label: e.target.value })
              }
              placeholder="Nombre del campo (ej: Profesión)"
            />
            <input
              className="pf-input pf-input--custom-value"
              value={field.value}
              onChange={(e) =>
                updateCustomField(i, { value: e.target.value })
              }
              placeholder="Valor"
            />
            <button
              type="button"
              className="pf-btn pf-btn--remove"
              onClick={() => removeCustomField(i)}
              aria-label="Eliminar campo"
            >×</button>
          </div>
        ))}

        <button
          type="button"
          className="pf-btn pf-btn--ghost pf-btn--add-field"
          onClick={addCustomField}
        >
          + Agregar campo
        </button>

        {/* ── Error ── */}
        {error && <p className="pf-error">{error}</p>}

      </div>

      {/* ── Footer con acciones ── */}
      <div className="person-form__footer">
        <button
          type="button"
          className="pf-btn pf-btn--ghost"
          onClick={() => { reset(); onCancel?.(); }}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="pf-btn pf-btn--primary"
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Guardando…"
            : mode === "create"
            ? "Crear persona"
            : "Guardar cambios"}
        </button>
      </div>

      <style>{formStyles}</style>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const formStyles = `
  .person-form {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: Georgia, serif;
  }

  .person-form__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: #222 transparent;
  }

  .person-form__footer {
    flex-shrink: 0;
    padding: 16px 20px;
    border-top: 1px solid #1a1a1a;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* ── Section title ── */
  .pf-section-title {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c9a84c;
    font-weight: 400;
    padding-bottom: 6px;
    border-bottom: 1px solid #161616;
    margin: 4px 0 0;
  }

  /* ── Field ── */
  .pf-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .pf-field__label {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #444;
  }

  /* ── Input ── */
  .pf-input {
    width: 100%;
    background: #111;
    border: 1px solid #222;
    border-radius: 4px;
    color: #d0d0d0;
    font-family: Georgia, serif;
    font-size: 12px;
    padding: 7px 10px;
    box-sizing: border-box;
    transition: border-color 150ms ease;
    resize: none;
  }

  .pf-input:focus {
    outline: none;
    border-color: #c9a84c44;
  }

  .pf-input--textarea {
    resize: vertical;
    min-height: 80px;
  }

  .pf-hint {
    font-size: 10px;
    color: #333;
    font-style: italic;
  }

  /* ── Toggle ── */
  .pf-toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pf-toggle {
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 10px;
    border: none;
    background: #222;
    cursor: pointer;
    transition: background 150ms ease;
    padding: 0;
    flex-shrink: 0;
  }

  .pf-toggle[data-active='true'] {
    background: #c9a84c44;
    border: 1px solid #c9a84c66;
  }

  .pf-toggle__knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #555;
    transition: transform 150ms ease, background 150ms ease;
  }

  .pf-toggle[data-active='true'] .pf-toggle__knob {
    transform: translateX(16px);
    background: #c9a84c;
  }

  .pf-toggle__label {
    font-size: 12px;
    color: #888;
  }

  /* ── Chips ── */
  .pf-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .pf-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    font-size: 11px;
    color: #aaa;
  }

  .pf-chip__remove {
    background: none;
    border: none;
    color: #555;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    padding: 0;
    transition: color 150ms ease;
  }

  .pf-chip__remove:hover { color: #c9a84c; }

  .pf-chip-input-row {
    display: flex;
    gap: 6px;
  }

  .pf-chip-input-row .pf-input { flex: 1; }

  /* ── Custom fields ── */
  .pf-custom-field {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 6px;
    align-items: center;
  }

  .pf-btn--remove {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background: none;
    border: 1px solid #222;
    color: #555;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 150ms, color 150ms;
    flex-shrink: 0;
  }

  .pf-btn--remove:hover {
    border-color: #9a4a4a;
    color: #9a4a4a;
  }

  /* ── Generación ── */
  .pf-gen-display {
    font-size: 11px;
    color: #555;
    margin: 0;
  }

  .pf-gen-display strong { color: #c9a84c; }

  /* ── Botones ── */
  .pf-btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-family: Georgia, serif;
    font-size: 12px;
    cursor: pointer;
    transition: all 150ms ease;
    letter-spacing: 0.03em;
  }

  .pf-btn--primary {
    background: #c9a84c22;
    border: 1px solid #c9a84c66;
    color: #c9a84c;
  }

  .pf-btn--primary:hover:not(:disabled) {
    background: #c9a84c33;
    border-color: #c9a84c;
  }

  .pf-btn--primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pf-btn--ghost {
    background: none;
    border: 1px solid #222;
    color: #555;
  }

  .pf-btn--ghost:hover:not(:disabled) {
    border-color: #444;
    color: #888;
  }

  .pf-btn--add-field {
    align-self: flex-start;
    font-size: 11px;
    padding: 5px 12px;
  }

  /* ── Error ── */
  .pf-error {
    font-size: 11px;
    color: #9a4a4a;
    margin: 0;
    padding: 8px 10px;
    background: #1a0a0a;
    border: 1px solid #2a1010;
    border-radius: 4px;
  }
`;