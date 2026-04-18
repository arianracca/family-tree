import { useState, useCallback, useMemo } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { createLocalRepository } from "@/lib/familyRepository";
import type { Person, Relation, CustomField, CoupleRelation, ParentChildRelation } from "@/types/family";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PersonFormData {
  firstName:    string;
  middleName:   string;
  lastName:     string;
  motherLastName: string;
  birthPlace:   string;
  birthDate:    string;
  deathDate:    string;
  nationalities: string[];
  city:         string;
  isAlive:      boolean;
  generation:   number | null;
  history:      string;
  photoUrl:     string | null;
  customFields: CustomField[];
  coupleId:     string | null;
  coupleActive: boolean;
  parentIds:    string[];
  childrenIds:  string[];
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

// ─── Valores por defecto ──────────────────────────────────────────────────────

export function emptyFormData(): PersonFormData {
  return {
    firstName: "", middleName: "", lastName: "", motherLastName: "",
    birthPlace: "", birthDate: "", deathDate: "",
    nationalities: [], city: "", isAlive: true, generation: null,
    history: "", photoUrl: null, customFields: [],
    coupleId: null, coupleActive: true, parentIds: [], childrenIds: [],
  };
}

export function personToFormData(person: Person, relations: Relation[]): PersonFormData {
  const coupleRel = relations.find(
    (r): r is CoupleRelation => r.type === "couple" && r.persons.includes(person.id)
  );
  const partnerId = coupleRel
    ? coupleRel.persons.find((id) => id !== person.id) ?? null
    : null;

  const parentIds = relations
    .filter((r): r is ParentChildRelation => r.type === "parent-child" && r.to === person.id)
    .map((r) => r.from);

  const childrenIds = relations
    .filter((r): r is ParentChildRelation => r.type === "parent-child" && r.from === person.id)
    .map((r) => r.to);

  return {
    firstName:      person.firstName,
    middleName:     person.middleName     ?? "",
    lastName:       person.lastName,
    motherLastName: person.motherLastName ?? "",
    birthPlace:     person.birthPlace     ?? "",
    birthDate:      person.birthDate      ?? "",
    deathDate:      person.deathDate      ?? "",
    nationalities:  person.nationalities  ?? [],
    city:           person.city           ?? "",
    isAlive:        person.isAlive,
    generation:     person.generation,
    history:        person.history        ?? "",
    photoUrl:       person.photoUrl       ?? null,
    customFields:   person.customFields   ?? [],
    coupleId:       partnerId,
    coupleActive:   coupleRel?.active     ?? true,
    parentIds,
    childrenIds,
  };
}

function validate(data: PersonFormData): string | null {
  if (!data.firstName.trim()) return "El nombre es obligatorio.";
  if (!data.lastName.trim())  return "El apellido es obligatorio.";
  if (data.generation === null) return "Definí la generación usando el selector de relación.";
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UsePersonFormOptions {
  mode:       FormMode;
  personId?:  string;
  onSuccess?: () => void;
}

export function usePersonForm({ mode, personId, onSuccess }: UsePersonFormOptions): UsePersonFormReturn {
  const persons   = useFamilyStore((s) => s.familyData.persons);
  const relations = useFamilyStore((s) => s.familyData.relations);

  // Acciones atómicas — referencias estables en Zustand
  const addPerson      = useFamilyStore((s) => s.addPerson);
  const updatePerson   = useFamilyStore((s) => s.updatePerson);
  const removePerson   = useFamilyStore((s) => s.removePerson);
  const addRelation    = useFamilyStore((s) => s.addRelation);
  const removeRelation = useFamilyStore((s) => s.removeRelation);
  const loadFamilyData = useFamilyStore((s) => s.loadFamilyData);


  // Repository estable
  const repository = useMemo(
    () => createLocalRepository(
      () => ({ familyData: useFamilyStore.getState().familyData }),
      { addPerson, updatePerson, removePerson, addRelation, removeRelation }
    ),
    [addPerson, updatePerson, removePerson, addRelation, removeRelation]
  );

  const buildInitial = useCallback((): PersonFormData => {
    if (mode === "edit" && personId) {
      const person = useFamilyStore.getState().familyData.persons.find((p) => p.id === personId);
      if (person) return personToFormData(person, useFamilyStore.getState().familyData.relations);
    }
    return emptyFormData();
  }, [mode, personId]);

  const [formData,     setFormData]     = useState<PersonFormData>(buildInitial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const setField = useCallback(
    <K extends keyof PersonFormData>(key: K, value: PersonFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }, []
  );

  const setGeneration      = useCallback((gen: number) => setFormData((p) => ({ ...p, generation: gen })), []);
  const addNationality    = useCallback((value: string) => {
    const t = value.trim(); if (!t) return;
    setFormData((p) => ({ ...p, nationalities: [...p.nationalities, t] }));
  }, []);
  const removeNationality = useCallback((i: number) =>
  setFormData((p) => ({ ...p, nationalities: p.nationalities.filter((_, idx) => idx !== i) })), []);
  const addCustomField     = useCallback(() =>
    setFormData((p) => ({ ...p, customFields: [...p.customFields, { key: `field_${Date.now()}`, label: "", value: "" }] })), []);
  const updateCustomField = useCallback((i: number, field: Partial<CustomField>) =>
    setFormData((p) => {
      const updated = [...p.customFields];
      updated[i] = { ...updated[i], ...field };
      return { ...p, customFields: updated };
    }), []);
  const removeCustomField  = useCallback((i: number) =>
    setFormData((p) => ({ ...p, customFields: p.customFields.filter((_, idx) => idx !== i) })), []);

  const submit = useCallback(async () => {
    const validationError = validate(formData);
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const personPayload: Omit<Person, "id"> = {
        firstName:      formData.firstName.trim(),
        middleName:     formData.middleName.trim()     || null,
        lastName:       formData.lastName.trim(),
        motherLastName: formData.motherLastName.trim() || null,
        birthPlace:     formData.birthPlace.trim()     || null,
        birthDate:      formData.birthDate             || null,
        deathDate:      formData.deathDate             || null,
        nationalities:  formData.nationalities,
        city:           formData.city.trim()           || null,
        isAlive:        formData.isAlive,
        generation:     formData.generation!,
        history:        formData.history.trim()        || null,
        photoUrl:       formData.photoUrl,
        customFields:   formData.customFields.filter((f) => f.label.trim() && f.value.trim()),
      };

      let savedId: string;
      if (mode === "create") {
        const created = await repository.createPerson(personPayload);
        savedId = created.id;
      } else {
        await repository.updatePerson(personId!, personPayload);
        savedId = personId!;
      }

      // Leer relaciones actuales del store directamente (no del closure)
      const currentRelations = useFamilyStore.getState().familyData.relations;
      const existingRelations = currentRelations.filter((r) => {
        if (r.type === "parent-child") return r.from === savedId || r.to === savedId;
        if (r.type === "couple")       return r.persons.includes(savedId);
        return false;
      });

      for (const rel of existingRelations) await repository.removeRelation(rel);

      if (formData.coupleId) {
        await repository.addRelation({
          type: "couple",
          persons: [savedId, formData.coupleId] as [string, string],
          active: formData.coupleActive,
        });
      }
      for (const parentId of formData.parentIds) {
        await repository.addRelation({ type: "parent-child", from: parentId, to: savedId });
      }
      for (const childId of formData.childrenIds) {
        await repository.addRelation({ type: "parent-child", from: savedId, to: childId });
      }
    
      await loadFamilyData(); 
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, personId, repository, loadFamilyData, onSuccess]);

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