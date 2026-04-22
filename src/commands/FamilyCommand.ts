// ─── FamilyCommand — interfaz base ───────────────────────────────────────────
//
// Cada comando encapsula una operación reversible sobre el árbol familiar.
// Los comandos concretos operan SIEMPRE a través de FamilyService, nunca
// directamente sobre el repositorio, garantizando que la lógica de negocio
// se aplica de forma consistente tanto en execute() como en undo().
//
// Principios aplicados:
//   SRP  — cada comando conoce exactamente una operación y su inversa
//   OCP  — agregar un comando nuevo = archivo nuevo, sin tocar el store
//   DIP  — el store depende de esta interfaz, no de implementaciones concretas

import type { Person, Relation } from "@/types/family";

// ─── Resultado de execute() ───────────────────────────────────────────────────
// Discriminated union: permite al store actuar distinto según la operación
// sin hacer instanceof sobre los comandos concretos.

export type CommandResult =
  | { operation: "create"; person: Person }
  | { operation: "update"; person: Person; previousPerson: Person }
  | { operation: "delete"; personId: string };

// ─── Snapshot para undo ───────────────────────────────────────────────────────
// Se captura ANTES de cualquier escritura. Contiene todo lo necesario para
// reconstruir el estado anterior, incluyendo el ID original de la persona.
// Esto permite que DeletePersonCommand restaure con el mismo ID, lo que
// requiere que el endpoint POST /api/family/persons acepte id opcional.

export interface CommandSnapshot {
  person: Person;
  relations: Relation[]; // solo las relaciones que involucran a esta persona
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

export interface FamilyCommand {
  /** Etiqueta legible para logs y futura UI de historial. */
  readonly description: string;

  /**
   * Ejecuta la operación contra FamilyService.
   * El store llama a este método y usa el resultado para actualizar
   * familyData de forma optimista sin necesidad de recargar todo.
   */
  execute(): Promise<CommandResult>;

  /**
   * Revierte la operación ejecutada previamente.
   * Solo se puede llamar después de execute(). El store garantiza este orden.
   * En caso de error de red, lanza una excepción — el store la captura
   * y limpia el undoStack para evitar estados inconsistentes.
   */
  undo(): Promise<void>;
}