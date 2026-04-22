import { activeRepository } from "@/lib/familyRepository";
import type { Person, Relation, CoupleRelation, ParentChildRelation } from "@/types/family";
import type { PersonFormData } from "@/hooks/usePersonForm";
import { ValidationError, IntegrityError } from "@/services/FamilyErrors";

export { ValidationError, IntegrityError };

// ─── Validación ───────────────────────────────────────────────────────────────

export function validatePersonForm(data: PersonFormData): string | null {
  if (!data.firstName.trim()) return "El Nombre es obligatorio.";
  if (!data.lastName.trim())  return "El Apellido es obligatorio.";
  if (data.generation === null)
    return "Definí la generación usando el selector de relación.";
  return null;
}

// ─── Builder de payload ───────────────────────────────────────────────────────

function buildPersonPayload(
  data: PersonFormData,
  id?: string
): Omit<Person, "id"> & { id?: string } {
  return {
    ...(id ? { id } : {}),
    firstName:      data.firstName.trim(),
    middleName:     data.middleName.trim()      || null,
    lastName:       data.lastName.trim(),
    motherLastName: data.motherLastName.trim()  || null,
    birthPlace:     data.birthPlace.trim()      || null,
    birthDate:      data.birthDate              || null,
    deathDate:      data.deathDate              || null,
    nationalities:  data.nationalities,
    city:           data.city.trim()            || null,
    isAlive:        data.isAlive,
    generation:     data.generation!,
    history:        data.history.trim()         || null,
    photoUrl:       data.photoUrl,
    customFields:   data.customFields.filter(
                      (f) => f.label.trim() && f.value.trim()
                    ),
  };
}

// ─── Sincronización de relaciones ─────────────────────────────────────────────

async function syncRelations(
  personId: string,
  formData: PersonFormData,
  currentRelations: Relation[]
): Promise<void> {
  const toRemove = currentRelations.filter((r) => {
    if (r.type === "parent-child")
      return r.from === personId || r.to === personId;
    if (r.type === "couple")
      return r.persons.includes(personId);
    return false;
  });

  for (const rel of toRemove) {
    await activeRepository.removeRelation(rel);
  }

  if (formData.coupleId) {
    await activeRepository.addRelation({
      type:    "couple",
      persons: [personId, formData.coupleId] as [string, string],
      active:  formData.coupleActive,
    });
  }

  for (const parentId of formData.parentIds) {
    await activeRepository.addRelation({
      type: "parent-child",
      from: parentId,
      to:   personId,
    });
  }

  for (const childId of formData.childrenIds) {
    await activeRepository.addRelation({
      type: "parent-child",
      from: personId,
      to:   childId,
    });
  }
}

// ─── Validación de integridad referencial ─────────────────────────────────────

function validateIntegrity(
  personId: string | undefined,
  formData: PersonFormData,
  allPersonIds: string[]
): void {
  if (formData.coupleId === personId) {
    throw new IntegrityError("Una persona no puede ser pareja de sí misma.");
  }
  if (formData.parentIds.includes(personId ?? "")) {
    throw new IntegrityError("Una persona no puede ser su propio padre.");
  }
  if (formData.childrenIds.includes(personId ?? "")) {
    throw new IntegrityError("Una persona no puede ser su propio hijo.");
  }

  const invalidIds = [
    ...(formData.coupleId ? [formData.coupleId] : []),
    ...formData.parentIds,
    ...formData.childrenIds,
  ].filter((id) => !allPersonIds.includes(id));

  if (invalidIds.length > 0) {
    throw new IntegrityError(
      `Referencias a personas inexistentes: ${invalidIds.join(", ")}`
    );
  }
}

// ─── FamilyService ────────────────────────────────────────────────────────────

export const FamilyService = {

  /**
   * Crea una persona nueva con sus relaciones.
   * @param id — ID opcional. Si se pasa, el repositorio/backend lo usa tal cual
   *             en lugar de generar uno nuevo. Necesario para restaurar personas
   *             eliminadas (DeletePersonCommand.undo) con el mismo ID original.
   */
  async createPerson(
    formData: PersonFormData,
    currentRelations: Relation[],
    allPersonIds: string[],
    id?: string
  ): Promise<Person> {
    const validationError = validatePersonForm(formData);
    if (validationError) throw new ValidationError(validationError);

    validateIntegrity(undefined, formData, allPersonIds);

    const payload = buildPersonPayload(formData, id);
    const created = await activeRepository.createPerson(payload);

    await syncRelations(created.id, formData, currentRelations);

    return created;
  },

  /**
   * Actualiza una persona existente y sincroniza sus relaciones.
   */
  async updatePerson(
    personId: string,
    formData: PersonFormData,
    currentRelations: Relation[],
    allPersonIds: string[]
  ): Promise<Person> {
    const validationError = validatePersonForm(formData);
    if (validationError) throw new ValidationError(validationError);

    validateIntegrity(personId, formData, allPersonIds);

    const payload = buildPersonPayload(formData);
    const updated = await activeRepository.updatePerson(personId, payload);

    await syncRelations(personId, formData, currentRelations);

    return updated;
  },

  /**
   * Elimina una persona y todas sus relaciones.
   */
  async deletePerson(personId: string): Promise<void> {
    await activeRepository.deletePerson(personId);
  },
};