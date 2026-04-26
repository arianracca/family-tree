// ─── DeletePersonCommand ──────────────────────────────────────────────────────
//
// execute() → elimina la persona, capturando snapshot completo antes
// undo()    → restaura la persona con el MISMO ID original + sus relaciones
//
// Requisito de backend: POST /api/family/persons debe aceptar `id` opcional.
// Con backend real y borrado lógico, el registro nunca se elimina físicamente
// hasta el proceso batch, por lo que la restauración por ID siempre es posible.
//
// Backlog: documentar el contrato de id opcional en el endpoint y agregar
// el proceso batch de limpieza (soft-delete → hard-delete) con ventana
// configurable (default: 30 días).

import { FamilyService } from "@/services/FamilyService";
import type { FamilyCommand, CommandResult, CommandSnapshot } from "./FamilyCommand";
import type { Relation } from "@/types/family";
import { personToFormData } from "@/hooks/usePersonForm";

export class DeletePersonCommand implements FamilyCommand {
  readonly description: string;

  private snapshot: CommandSnapshot | null = null;

  constructor(
    private readonly personId: string,
    personDisplayName: string
  ) {
    this.description = `Eliminar persona: ${personDisplayName}`;
  }

  async execute(): Promise<CommandResult> {
    // ── 1. Capturar snapshot ANTES de eliminar ─────────────────────────────
    const { persons, relations } = await this.getCurrentState();

    const person = persons.find((p) => p.id === this.personId);
    if (!person) {
      throw new Error(`DeletePersonCommand: persona ${this.personId} no encontrada.`);
    }

    const personRelations = relations.filter((r) => {
      if (r.type === "parent-child")
        return r.from === this.personId || r.to === this.personId;
      if (r.type === "couple")
        return r.persons.includes(this.personId);
      return false;
    });

    this.snapshot = { person, relations: personRelations };

    // ── 2. Eliminar ────────────────────────────────────────────────────────
    await FamilyService.deletePerson(this.personId);

    return { operation: "delete", personId: this.personId };
  }

  async undo(): Promise<void> {
    if (!this.snapshot) {
      throw new Error(
        "DeletePersonCommand: undo() llamado antes de execute(). Estado inválido."
      );
    }

    const { person, relations } = this.snapshot;
    const restoredFormData = personToFormData(person, relations);

    // Leer allPersonIds actuales del store para que validateIntegrity
    // pueda verificar las referencias del snapshot
    const { useFamilyStore } = await import("@/store/useFamilyStore");
    const { persons } = useFamilyStore.getState().familyData;
    const allPersonIds = persons.map((p) => p.id);

    await FamilyService.createPerson(
      restoredFormData,
      relations,      // relaciones del snapshot para syncRelations
      allPersonIds,   // ← IDs reales para validateIntegrity
      person.id       // ID original
    );
  }

  private async getCurrentState() {
    const { useFamilyStore } = await import("@/store/useFamilyStore");
    return useFamilyStore.getState().familyData;
  }
}