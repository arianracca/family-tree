"use client";

import { usePersonForm } from "@/hooks/usePersonForm";
import GenerationPicker from "@/components/ui/GenerationPicker";
import { useFamilyStore } from "@/store/useFamilyStore";
import type { FormMode } from "@/hooks/usePersonForm";
import styles from "@/components/ui/PersonForm.module.css";
import Toggle from "@/components/ui/primitives/Toggle";
import ChipInput from "@/components/ui/primitives/ChipInput";
import SectionTitle from "@/components/ui/primitives/SectionTitle";


// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  mode:       FormMode;
  personId?:  string;
  onSuccess?: () => void;
  onCancel?:  () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
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

  // ── Personas disponibles para relaciones ──────────────────────────────────
  // Excluye a la persona que se está editando
  const otherPersons = persons.filter((p) => p.id !== personId);

  function getFullName(p: { firstName: string; lastName: string }) {
    return `${p.firstName} ${p.lastName}`;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.form}>
      <div className={styles.body}>

        <SectionTitle>Datos básicos</SectionTitle>

        <Field label="Nombre *">
          <input
            className={styles.input}
            value={formData.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder="Ej: Juan"
          />
        </Field>

        <Field label="Segundos nombres">
          <input
            className={styles.input}
            value={formData.middleName}
            onChange={(e) => setField("middleName", e.target.value)}
            placeholder="Opcional"
          />
        </Field>

        <Field label="Apellido *">
          <input
            className={styles.input}
            value={formData.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder="Ej: González"
          />
        </Field>

        <Field label="Apellido materno">
          <input
            className={styles.input}
            value={formData.motherLastName}
            onChange={(e) => setField("motherLastName", e.target.value)}
            placeholder="Opcional"
          />
        </Field>

        <Field label="¿Está vivo?">
          <Toggle
            value={formData.isAlive}
            onChange={(v) => setField("isAlive", v)}
            label={formData.isAlive ? "Sí" : "No"}
          />
        </Field>

        <SectionTitle>Origen y fechas</SectionTitle>

        <Field label="Lugar de nacimiento">
          <input
            className={styles.input}
            value={formData.birthPlace}
            onChange={(e) => setField("birthPlace", e.target.value)}
            placeholder="Ej: Buenos Aires"
          />
        </Field>

        <Field label="Ciudad de residencia">
          <input
            className={styles.input}
            value={formData.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Ej: Córdoba"
          />
        </Field>

        <Field label="Fecha de nacimiento">
          <input
            className={styles.input}
            type="date"
            value={formData.birthDate ?? ""}
            onChange={(e) => setField("birthDate", e.target.value)}
          />
        </Field>

        {!formData.isAlive && (
          <Field label="Fecha de fallecimiento">
            <input
              className={styles.input}
              type="date"
              value={formData.deathDate ?? ""}
              onChange={(e) => setField("deathDate", e.target.value)}
            />
          </Field>
        )}

        <Field label="Nacionalidades">
          <ChipInput
            values={formData.nationalities}
            onAdd={addNationality}
            onRemove={removeNationality}
            placeholder="Ej: Argentina — Enter para agregar"
            inputClassName={styles.input}
          />
        </Field>

        <SectionTitle>Generación *</SectionTitle>
        <GenerationPicker
          onGenerationResolved={setGeneration}
          currentGeneration={formData.generation}
        />
        {formData.generation !== null && (
          <p className={styles.genDisplay}>
            Generación asignada: <strong>{formData.generation}</strong>
          </p>
        )}

        <SectionTitle>Relaciones</SectionTitle>

        <Field label="Pareja">
          <select
            className={styles.input}
            value={formData.coupleId ?? ""}
            onChange={(e) => setField("coupleId", e.target.value || null)}
          >
            <option value="">— sin pareja —</option>
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>{getFullName(p)}</option>
            ))}
          </select>
        </Field>

        {formData.coupleId && (
          <Field label="¿Pareja activa?">
            <Toggle
              value={formData.coupleActive}
              onChange={(v) => setField("coupleActive", v)}
              label={formData.coupleActive ? "Sí" : "No"}
            />
          </Field>
        )}

        <Field label="Padres">
          <select
            className={styles.input}
            multiple
            size={Math.min(5, otherPersons.length)}
            value={formData.parentIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              setField("parentIds", selected);
            }}
          >
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>{getFullName(p)}</option>
            ))}
          </select>
          <span className={styles.hint}>Ctrl+click para seleccionar múltiples</span>
        </Field>

        <Field label="Hijos">
          <select
            className={styles.input}
            multiple
            size={Math.min(5, otherPersons.length)}
            value={formData.childrenIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              setField("childrenIds", selected);
            }}
          >
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>{getFullName(p)}</option>
            ))}
          </select>
          <span className={styles.hint}>Ctrl+click para seleccionar múltiples</span>
        </Field>

        <Field label="Biografía / Anécdotas">
          <textarea
            className={`${styles.input} ${styles.inputTextarea}`}
            value={formData.history ?? ""}
            onChange={(e) => setField("history", e.target.value)}
            placeholder="Escribí una biografía, anécdotas, recuerdos..."
            rows={5}
          />
        </Field>

        <SectionTitle>Campos personalizados</SectionTitle>

        {formData.customFields.map((field, i) => (
          <div key={field.key} className={styles.customField}>
            <input
              className={styles.input}
              value={field.label}
              onChange={(e) => updateCustomField(i, { label: e.target.value })}
              placeholder="Nombre del campo (ej: Profesión)"
            />
            <input
              className={styles.input}
              value={field.value}
              onChange={(e) => updateCustomField(i, { value: e.target.value })}
              placeholder="Valor"
            />
            <button
              type="button"
              className={styles.btnRemove}
              onClick={() => removeCustomField(i)}
              aria-label="Eliminar campo"
            >×</button>
          </div>
        ))}

        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost} ${styles.btnAddField}`}
          onClick={addCustomField}
        >
          + Agregar campo
        </button>

        {error && <p className={styles.error}>{error}</p>}

      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => { reset(); onCancel?.(); }}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
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
    </div>
  );
}