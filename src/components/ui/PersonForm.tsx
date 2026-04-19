"use client";

import { usePersonForm } from "@/hooks/usePersonForm";
import GenerationPicker from "@/components/ui/GenerationPicker";
import { useFamilyStore } from "@/store/useFamilyStore";
import type { FormMode } from "@/hooks/usePersonForm";
import styles from "@/components/ui/PersonForm.module.css";
import Toggle from "@/components/ui/primitives/Toggle";
import ChipInput from "@/components/ui/primitives/ChipInput";
import SectionTitle from "@/components/ui/primitives/SectionTitle";

const UI = {
  sectionBasic:       "Datos básicos",
  sectionOrigin:      "Origen y fechas",
  sectionGeneration:  "Generación *",
  sectionRelations:   "Relaciones",
  sectionCustom:      "Campos personalizados",
  firstName:          "Nombre *",
  middleName:         "Segundos nombres",
  lastName:           "Apellido *",
  motherLastName:     "Apellido materno",
  isAlive:            "¿Está vivo?",
  yes:                "Sí",
  no:                 "No",
  birthPlace:         "Lugar de nacimiento",
  city:               "Ciudad de residencia",
  birthDate:          "Fecha de nacimiento",
  deathDate:          "Fecha de fallecimiento",
  nationalities:      "Nacionalidades",
  nationalityPlaceholder: "Ej: Argentina — Enter para agregar",
  partner:            "Pareja",
  partnerActive:      "¿Pareja activa?",
  partnerNone:        "— sin pareja —",
  parents:            "Padres",
  children:           "Hijos",
  multiSelectHint:    "Ctrl+click para seleccionar múltiples",
  history:            "Biografía / Anécdotas",
  historyPlaceholder: "Escribí una biografía, anécdotas, recuerdos...",
  customFieldLabel:   "Nombre del campo (ej: Profesión)",
  customFieldValue:   "Valor",
  addCustomField:     "+ Agregar campo",
  removeCustomField:  "Eliminar campo",
  generationDisplay:  "Generación asignada:",
  cancel:             "Cancelar",
  create:             "Crear persona",
  save:               "Guardar cambios",
  saving:             "Guardando…",
  firstNamePlaceholder:      "Ej: Juan",
  middleNamePlaceholder:     "Opcional",
  lastNamePlaceholder:       "Ej: González",
  motherLastNamePlaceholder: "Opcional",
  birthPlacePlaceholder:     "Ej: Buenos Aires",
  cityPlaceholder:           "Ej: Córdoba",

} as const;

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

        <SectionTitle>{UI.sectionBasic}</SectionTitle>

        <Field label={UI.firstName}>
          <input
            className={styles.input}
            value={formData.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder={UI.firstNamePlaceholder}
          />
        </Field>

        <Field label={UI.middleName}>
          <input
            className={styles.input}
            value={formData.middleName}
            onChange={(e) => setField("middleName", e.target.value)}
            placeholder={UI.middleNamePlaceholder}
          />
        </Field>

        <Field label={UI.lastName}>
          <input
            className={styles.input}
            value={formData.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder={UI.lastNamePlaceholder}
          />
        </Field>

        <Field label={UI.motherLastName}>
          <input
            className={styles.input}
            value={formData.motherLastName}
            onChange={(e) => setField("motherLastName", e.target.value)}
            placeholder={UI.motherLastNamePlaceholder}
          />
        </Field>

        <Field label={UI.isAlive}>
          <Toggle
            value={formData.isAlive}
            onChange={(v) => setField("isAlive", v)}
            label={formData.isAlive ? UI.yes : UI.no}
          />
        </Field>

        <SectionTitle>{UI.sectionOrigin}</SectionTitle>

        <Field label={UI.birthPlace}>
          <input
            className={styles.input}
            value={formData.birthPlace}
            onChange={(e) => setField("birthPlace", e.target.value)}
            placeholder={UI.birthPlacePlaceholder}
          />
        </Field>

        <Field label={UI.city}>
          <input
            className={styles.input}
            value={formData.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder={UI.cityPlaceholder}
          />
        </Field>

        <Field label={UI.birthDate}>
          <input
            className={styles.input}
            type="date"
            value={formData.birthDate ?? ""}
            onChange={(e) => setField("birthDate", e.target.value)}
          />
        </Field>

        {!formData.isAlive && (
          <Field label={UI.isAlive}>

            <input
              className={styles.input}
              type="date"
              value={formData.deathDate ?? ""}
              onChange={(e) => setField("deathDate", e.target.value)}
            />
          </Field>
        )}

        <Field label={UI.nationalities}>
          <ChipInput
            values={formData.nationalities}
            onAdd={addNationality}
            onRemove={removeNationality}
            placeholder={UI.nationalityPlaceholder}
            inputClassName={styles.input}
          />
        </Field>

        <SectionTitle>{UI.sectionGeneration}</SectionTitle>
        <GenerationPicker
          onGenerationResolved={setGeneration}
          currentGeneration={formData.generation}
        />
        {formData.generation !== null && (
          <p className={styles.genDisplay}>
            {UI.generationDisplay} <strong>{formData.generation}</strong>
          </p>
        )}

        <SectionTitle>{UI.sectionRelations}</SectionTitle>

        <Field label={UI.partner}>
          <select
            className={styles.input}
            value={formData.coupleId ?? ""}
            onChange={(e) => setField("coupleId", e.target.value || null)}
          >
            <option value="">{UI.partnerNone}</option>
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>{getFullName(p)}</option>
            ))}
          </select>
        </Field>

        {formData.coupleId && (
          <Field label={UI.partnerActive}>
            <Toggle
              value={formData.coupleActive}
              onChange={(v) => setField("coupleActive", v)}
              label={formData.coupleActive ? UI.yes : UI.no}
            />
          </Field>
        )}

        <Field label={UI.parents}>
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
          <span className={styles.hint}>{UI.multiSelectHint}</span>
        </Field>

        <Field label={UI.children}>
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
          <span className={styles.hint}>{UI.multiSelectHint}</span>
        </Field>

        <Field label={UI.history}>
          <textarea
            className={`${styles.input} ${styles.inputTextarea}`}
            value={formData.history ?? ""}
            onChange={(e) => setField("history", e.target.value)}
            placeholder={UI.historyPlaceholder}
            rows={5}
          />
        </Field>

        <SectionTitle>{UI.sectionCustom}</SectionTitle>

        {formData.customFields.map((field, i) => (
          <div key={field.key} className={styles.customField}>
            <input
              className={styles.input}
              value={field.label}
              onChange={(e) => updateCustomField(i, { label: e.target.value })}
              placeholder={UI.customFieldLabel}
            />
            <input
              className={styles.input}
              value={field.value}
              onChange={(e) => updateCustomField(i, { value: e.target.value })}
              placeholder={UI.customFieldValue}
            />
            <button
              type="button"
              className={styles.btnRemove}
              onClick={() => removeCustomField(i)}
              aria-label={UI.removeCustomField}
            >×</button>
          </div>
        ))}

        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost} ${styles.btnAddField}`}
          onClick={addCustomField}
        >
          {UI.addCustomField}
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
          {UI.cancel}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? UI.saving : mode === "create" ? UI.create : UI.save}
        </button>
      </div>
    </div>
  );
}