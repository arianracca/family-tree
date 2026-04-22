import { activeRepository } from "@/lib/familyRepository";
import type { Person, Relation, CoupleRelation, ParentChildRelation } from "@/types/family";
import type { PersonFormData } from "@/hooks/usePersonForm";

// ─── Errores tipados ──────────────────────────────────────────────────────────
// Permite que los consumidores distingan errores de validación de errores
// de red sin hacer parsing de strings.

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class IntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrityError";
  }
}

// ─── Validación ───────────────────────────────────────────────────────────────
// Separada del servicio para que sea testeable de forma aislada.
// Retorna el primer error encontrado o null si los datos son válidos.

export function validatePersonForm(data: PersonFormData): string | null {
  if (!data.firstName.trim()) return "El Nombre es obligatorio.";
  if (!data.lastName.trim())  return "El Apellido es obligatorio.";
  if (data.generation === null)
    return "Definí la generación usando el selector de relación.";
  return null;
}

// ─── Builder de payload ───────────────────────────────────────────────────────
// Transforma PersonFormData (estado del formulario) en el shape que
// espera el repositorio. Centraliza el trimming y la normalización de nulos.

function buildPersonPayload(data: PersonFormData): Omit<Person, "id"> {
  return {
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
// Elimina todas las relaciones existentes de una persona y las recrea
// desde el estado actual del formulario. Estrategia replace-all para
// mantener la consistencia sin lógica de diff.

async function syncRelations(
  personId: string,
  formData: PersonFormData,
  currentRelations: Relation[]
): Promise<void> {
  // 1. Eliminar relaciones existentes de esta persona
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

  // 2. Crear relaciones nuevas desde el formulario

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
// Verifica que las relaciones del formulario no creen inconsistencias
// en el grafo familiar. Se ejecuta antes de cualquier escritura.

function validateIntegrity(
  personId: string | undefined,
  formData: PersonFormData,
  allPersonIds: string[]
): void {
  // Una persona no puede ser su propia pareja ni su propio padre/hijo
  if (formData.coupleId === personId) {
    throw new IntegrityError("Una persona no puede ser pareja de sí misma.");
  }

  if (formData.parentIds.includes(personId ?? "")) {
    throw new IntegrityError("Una persona no puede ser su propio padre.");
  }

  if (formData.childrenIds.includes(personId ?? "")) {
    throw new IntegrityError("Una persona no puede ser su propio hijo.");
  }

  // Los IDs referenciados deben existir en el dataset
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
// Punto de entrada público. Los hooks y componentes solo interactúan
// con este objeto — nunca con activeRepository directamente.

export const FamilyService = {

  /**
   * Crea una persona nueva con sus relaciones.
   * Retorna la persona creada con el ID asignado por el servidor.
   * Lanza ValidationError si los datos del formulario son inválidos.
   * Lanza IntegrityError si las relaciones crearían inconsistencias.
   */
  async createPerson(
    formData: PersonFormData,
    currentRelations: Relation[],
    allPersonIds: string[]
  ): Promise<Person> {
    const validationError = validatePersonForm(formData);
    if (validationError) throw new ValidationError(validationError);

    validateIntegrity(undefined, formData, allPersonIds);

    const payload = buildPersonPayload(formData);
    const created = await activeRepository.createPerson(payload);

    await syncRelations(created.id, formData, currentRelations);

    return created;
  },

  /**
   * Actualiza una persona existente y sincroniza sus relaciones.
   * Lanza ValidationError si los datos del formulario son inválidos.
   * Lanza IntegrityError si las relaciones crearían inconsistencias.
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
   * El repositorio maneja la limpieza de relaciones en cascada.
   */
  async deletePerson(personId: string): Promise<void> {
    await activeRepository.deletePerson(personId);
  },
};