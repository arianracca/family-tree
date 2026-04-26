"use client";

import { usePersonForm } from "@/hooks/usePersonForm";
import GenerationPicker from "@/components/ui/GenerationPicker";
import { useFamilyStore } from "@/store/useFamilyStore";
import type { FormMode } from "@/hooks/usePersonForm";
import styles from "@/components/ui/PersonForm.module.css";
import Toggle from "@/components/ui/primitives/Toggle";
import ChipInput from "@/components/ui/primitives/ChipInput";
import SectionTitle from "@/components/ui/primitives/SectionTitle";
import { useTranslations } from "next-intl";

interface Props {
  mode:       FormMode;
  personId?:  string;
  onSuccess?: () => void;
  onCancel?:  () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

export default function PersonForm({ mode, personId, onSuccess, onCancel }: Props) {
  const t       = useTranslations("form");
  const persons = useFamilyStore((s) => s.familyData.persons);

  const {
    formData, isSubmitting, error,
    setField, setGeneration,
    addNationality, removeNationality,
    addCustomField, updateCustomField, removeCustomField,
    submit, reset,
  } = usePersonForm({ mode, personId, onSuccess });

  const otherPersons = persons.filter((p) => p.id !== personId);

  function getFullName(p: { firstName: string; lastName: string }) {
    return `${p.firstName} ${p.lastName}`;
  }

  return (
    <div className={styles.form}>
      <div className={styles.body}>

        <SectionTitle>{t("sectionBasic")}</SectionTitle>

        <Field label={t("firstName")}>
          <input
            className={styles.input}
            value={formData.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder={t("firstNamePlaceholder")}
          />
        </Field>

        <Field label={t("middleName")}>
          <input
            className={styles.input}
            value={formData.middleName}
            onChange={(e) => setField("middleName", e.target.value)}
            placeholder={t("middleNamePlaceholder")}
          />
        </Field>

        <Field label={t("lastName")}>
          <input
            className={styles.input}
            value={formData.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder={t("lastNamePlaceholder")}
          />
        </Field>

        <Field label={t("motherLastName")}>
          <input
            className={styles.input}
            value={formData.motherLastName}
            onChange={(e) => setField("motherLastName", e.target.value)}
            placeholder={t("motherLastNamePlaceholder")}
          />
        </Field>

        <Field label={t("isAlive")}>
          <Toggle
            value={formData.isAlive}
            onChange={(v) => setField("isAlive", v)}
            label={formData.isAlive ? t("yes") : t("no")}
          />
        </Field>

        <SectionTitle>{t("sectionOrigin")}</SectionTitle>

        <Field label={t("birthPlace")}>
          <input
            className={styles.input}
            value={formData.birthPlace}
            onChange={(e) => setField("birthPlace", e.target.value)}
            placeholder={t("birthPlacePlaceholder")}
          />
        </Field>

        <Field label={t("city")}>
          <input
            className={styles.input}
            value={formData.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder={t("cityPlaceholder")}
          />
        </Field>

        <Field label={t("birthDate")}>
          <input
            className={styles.input}
            type="date"
            value={formData.birthDate ?? ""}
            onChange={(e) => setField("birthDate", e.target.value)}
          />
        </Field>

        {!formData.isAlive && (
          <Field label={t("deathDate")}>
            <input
              className={styles.input}
              type="date"
              value={formData.deathDate ?? ""}
              onChange={(e) => setField("deathDate", e.target.value)}
            />
          </Field>
        )}

        <Field label={t("nationalities")}>
          <ChipInput
            values={formData.nationalities}
            onAdd={addNationality}
            onRemove={removeNationality}
            placeholder={t("nationalityPlaceholder")}
            inputClassName={styles.input}
          />
        </Field>

        <SectionTitle>{t("sectionGeneration")}</SectionTitle>
        <GenerationPicker
          onGenerationResolved={setGeneration}
          currentGeneration={formData.generation}
        />
        {formData.generation !== null && (
          <p className={styles.genDisplay}>
            {t("generationDisplay")} <strong>{formData.generation}</strong>
          </p>
        )}

        <SectionTitle>{t("sectionRelations")}</SectionTitle>

        <Field label={t("partner")}>
          <select
            className={styles.input}
            value={formData.coupleId ?? ""}
            onChange={(e) => setField("coupleId", e.target.value || null)}
          >
            <option value="">{t("partnerNone")}</option>
            {otherPersons.map((p) => (
              <option key={p.id} value={p.id}>{getFullName(p)}</option>
            ))}
          </select>
        </Field>

        {formData.coupleId && (
          <Field label={t("partnerActive")}>
            <Toggle
              value={formData.coupleActive}
              onChange={(v) => setField("coupleActive", v)}
              label={formData.coupleActive ? t("yes") : t("no")}
            />
          </Field>
        )}

        <Field label={t("parents")}>
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
          <span className={styles.hint}>{t("multiSelectHint")}</span>
        </Field>

        <Field label={t("children")}>
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
          <span className={styles.hint}>{t("multiSelectHint")}</span>
        </Field>

        <Field label={t("history")}>
          <textarea
            className={`${styles.input} ${styles.inputTextarea}`}
            value={formData.history ?? ""}
            onChange={(e) => setField("history", e.target.value)}
            placeholder={t("historyPlaceholder")}
            rows={5}
          />
        </Field>

        <SectionTitle>{t("sectionCustom")}</SectionTitle>

        {formData.customFields.map((field, i) => (
          <div key={field.key} className={styles.customField}>
            <input
              className={styles.input}
              value={field.label}
              onChange={(e) => updateCustomField(i, { label: e.target.value })}
              placeholder={t("customFieldLabel")}
            />
            <input
              className={styles.input}
              value={field.value}
              onChange={(e) => updateCustomField(i, { value: e.target.value })}
              placeholder={t("customFieldValue")}
            />
            <button
              type="button"
              className={styles.btnRemove}
              onClick={() => removeCustomField(i)}
              aria-label={t("removeCustomField")}
            >×</button>
          </div>
        ))}

        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost} ${styles.btnAddField}`}
          onClick={addCustomField}
        >
          {t("addCustomField")}
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
          {t("cancel")}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("saving") : mode === "create" ? t("create") : t("save")}
        </button>
      </div>
    </div>
  );
}