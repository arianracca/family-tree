// ─── UpdatePersonCommand ──────────────────────────────────────────────────────
//
// execute() → actualiza la persona vía FamilyService
// undo()    → restaura el estado anterior usando el snapshot capturado
//             antes de execute(). El snapshot incluye datos y relaciones.

import { FamilyService } from "@/services/FamilyService";
import type { FamilyCommand, CommandResult, CommandSnapshot } from "./FamilyCommand";
import type { Relation } from "@/types/family";
import type { PersonFormData } from "@/hooks/usePersonForm";
import { personToFormData } from "@/hooks/usePersonForm";

export class UpdatePersonCommand implements FamilyCommand {
  readonly description: string;

  // Snapshot capturado en execute() antes de cualquier escritura.
  // Contiene persona anterior + sus relaciones para restauración exacta.
  private snapshot: CommandSnapshot | null = null;

  constructor(
    private readonly personId: string,
    private readonly formData: PersonFormData,
    private readonly currentRelations: Relation[],
    private readonly allPersonIds: string[],
    // Nombre legible capturado antes de la edición para el log
    personDisplayName: string
  ) {
    this.description = `Editar persona: ${personDisplayName}`;
  }

  async execute(): Promise<CommandResult> {
    // ── 1. Capturar snapshot ANTES de escribir ─────────────────────────────
    const { persons, relations } = await this.getCurrentState();

    const previousPerson = persons.find((p) => p.id === this.personId);
    if (!previousPerson) {
      throw new Error(`UpdatePersonCommand: persona ${this.personId} no encontrada.`);
    }

    const previousRelations = relations.filter((r) => {
      if (r.type === "parent-child")
        return r.from === this.personId || r.to === this.personId;
      if (r.type === "couple")
        return r.persons.includes(this.personId);
      return false;
    });

    this.snapshot = { person: previousPerson, relations: previousRelations };

    // ── 2. Ejecutar la actualización ───────────────────────────────────────
    const updated = await FamilyService.updatePerson(
      this.personId,
      this.formData,
      this.currentRelations,
      this.allPersonIds
    );

    return {
      operation: "update",
      person: updated,
      previousPerson,
    };
  }

  async undo(): Promise<void> {
    if (!this.snapshot) {
      throw new Error(
        "UpdatePersonCommand: undo() llamado antes de execute(). Estado inválido."
      );
    }

    const { person, relations } = this.snapshot;
    const restoredFormData = personToFormData(person, relations);

    // Leer las relaciones ACTUALES del store para que syncRelations
    // sepa qué eliminar antes de restaurar el snapshot
    const { useFamilyStore } = await import("@/store/useFamilyStore");
    const { relations: liveRelations, persons } = useFamilyStore.getState().familyData;
    const allPersonIds = persons.map((p) => p.id);

    await FamilyService.updatePerson(
      this.personId,
      restoredFormData,
      liveRelations,   // ← relaciones vivas para la limpieza
      allPersonIds
    );
  }

  // ── Helper: lectura imperativa del store sin crear dependencia circular ──
  private async getCurrentState() {
    // Importación dinámica para evitar dependencia circular
    // store → command → store. El store nunca importa comandos concretos.
    const { useFamilyStore } = await import("@/store/useFamilyStore");
    return useFamilyStore.getState().familyData;
  }
}