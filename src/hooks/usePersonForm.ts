import { useState, useCallback } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { ValidationError, IntegrityError } from "@/services/FamilyErrors";
import type { Person, Relation, CustomField, CoupleRelation, ParentChildRelation } from "@/types/family";

// ─── UI strings ───────────────────────────────────────────────────────────────

const UI = {
  errorFirstName:  "El Nombre es obligatorio.",
  errorLastName:   "El Apellido es obligatorio.",
  errorGeneration: "Definí la generación usando el selector de relación.",
  errorSave:       "Error al guardar.",
} as const;

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface PersonFormData {
  firstName:      string;
  middleName:     string;
  lastName:       string;
  motherLastName: string;
  birthPlace:     string;
  birthDate:      string;
  deathDate:      string;
  nationalities:  string[];
  city:           string;
  isAlive:        boolean;
  generation:     number | null;
  history:        string;
  photoUrl:       string | null;
  customFields:   CustomField[];
  coupleId:       string | null;
  coupleActive:   boolean;
  parentIds:      string[];
  childrenIds:    string[];
}

export type FormMode = "create" | "edit";

export interface UsePersonFormReturn {
  formData:          PersonFormData;
  mode:              FormMode;
  isSubmitting:      boolean;
  error:             string | null;
  setField:          <K extends keyof PersonFormData>(key: K, value: PersonFormData[K]) => void;
  setGeneration:     (gen: number) => void;
  addNationality:    (value: string) => void;
  removeNationality: (index: number) => void;
  addCustomField:    () => void;
  updateCustomField: (index: number, field: Partial<CustomField>) => void;
  removeCustomField: (index: number) => void;
  submit:            () => Promise<void>;
  reset:             () => void;
}

// ─── Builders de estado inicial ───────────────────────────────────────────────

export function emptyFormData(): PersonFormData {
  return {
    firstName: "", middleName: "", lastName: "", motherLastName: "",
    birthPlace: "", birthDate: "", deathDate: "",
    nationalities: [], city: "", isAlive: true, generation: null,
    history: "", photoUrl: null, customFields: [],
    coupleId: null, coupleActive: true, parentIds: [], childrenIds: [],
  };
}

export function personToFormData(
  person: Person,
  relations: Relation[]
): PersonFormData {
  const coupleRel = relations.find(
    (r): r is CoupleRelation =>
      r.type === "couple" && r.persons.includes(person.id)
  );
  const partnerId = coupleRel
    ? coupleRel.persons.find((id) => id !== person.id) ?? null
    : null;

  const parentIds = relations
    .filter((r): r is ParentChildRelation =>
      r.type === "parent-child" && r.to === person.id
    )
    .map((r) => r.from);

  const childrenIds = relations
    .filter((r): r is ParentChildRelation =>
      r.type === "parent-child" && r.from === person.id
    )
    .map((r) => r.to);

  return {
    firstName:      person.firstName,
    middleName:     person.middleName      ?? "",
    lastName:       person.lastName,
    motherLastName: person.motherLastName  ?? "",
    birthPlace:     person.birthPlace      ?? "",
    birthDate:      person.birthDate       ?? "",
    deathDate:      person.deathDate       ?? "",
    nationalities:  person.nationalities   ?? [],
    city:           person.city            ?? "",
    isAlive:        person.isAlive,
    generation:     person.generation,
    history:        person.history         ?? "",
    photoUrl:       person.photoUrl        ?? null,
    customFields:   person.customFields    ?? [],
    coupleId:       partnerId,
    coupleActive:   coupleRel?.active      ?? true,
    parentIds,
    childrenIds,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UsePersonFormOptions {
  mode:       FormMode;
  personId?:  string;
  onSuccess?: () => void;
}

export function usePersonForm({
  mode,
  personId,
  onSuccess,
}: UsePersonFormOptions): UsePersonFormReturn {

  const loadFamilyData = useFamilyStore((s) => s.loadFamilyData);

  // ── Estado inicial — lectura imperativa del store ────────────────────────
  const buildInitial = useCallback((): PersonFormData => {
    if (mode === "edit" && personId) {
      const { persons, relations } = useFamilyStore.getState().familyData;
      const person = persons.find((p) => p.id === personId);
      if (person) return personToFormData(person, relations);
    }
    return emptyFormData();
  }, [mode, personId]);

  const [formData,     setFormData]     = useState<PersonFormData>(buildInitial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── Setters de campos ────────────────────────────────────────────────────

  const setField = useCallback(
    <K extends keyof PersonFormData>(key: K, value: PersonFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }, []
  );

  const setGeneration = useCallback(
    (gen: number) => setFormData((p) => ({ ...p, generation: gen })), []
  );

  const addNationality = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFormData((p) => ({ ...p, nationalities: [...p.nationalities, trimmed] }));
  }, []);

  const removeNationality = useCallback(
    (i: number) => setFormData((p) => ({
      ...p,
      nationalities: p.nationalities.filter((_, idx) => idx !== i),
    })), []
  );

  const addCustomField = useCallback(
    () => setFormData((p) => ({
      ...p,
      customFields: [
        ...p.customFields,
        { key: `field_${Date.now()}`, label: "", value: "" },
      ],
    })), []
  );

  const updateCustomField = useCallback(
    (i: number, field: Partial<CustomField>) =>
      setFormData((p) => {
        const updated = [...p.customFields];
        updated[i] = { ...updated[i], ...field };
        return { ...p, customFields: updated };
      }), []
  );

  const removeCustomField = useCallback(
    (i: number) => setFormData((p) => ({
      ...p,
      customFields: p.customFields.filter((_, idx) => idx !== i),
    })), []
  );

// ── Submit — ejecuta vía Command Pattern para habilitar undo ────────────

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { relations, persons } = useFamilyStore.getState().familyData;
      const allPersonIds = persons.map((p) => p.id);
      const executeCommand = useFamilyStore.getState().executeCommand;

      if (mode === "create") {
        const { CreatePersonCommand } = await import("@/commands/CreatePersonCommand");
        await executeCommand(
          new CreatePersonCommand(formData, relations, allPersonIds)
        );
      } else {
        const person = persons.find((p) => p.id === personId);
        const displayName = person
          ? `${person.firstName} ${person.lastName}`
          : personId!;
        const { UpdatePersonCommand } = await import("@/commands/UpdatePersonCommand");
        await executeCommand(
          new UpdatePersonCommand(personId!, formData, relations, allPersonIds, displayName)
        );
      }

      onSuccess?.();

    } catch (err) {
      if (err instanceof ValidationError || err instanceof IntegrityError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : UI.errorSave);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, personId, onSuccess]);

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setFormData(buildInitial());
    setError(null);
  }, [buildInitial]);

  return {
    formData, mode, isSubmitting, error,
    setField, setGeneration,
    addNationality, removeNationality,
    addCustomField, updateCustomField, removeCustomField,
    submit, reset,
  };
}