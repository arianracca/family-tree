// ─── CreatePersonCommand ──────────────────────────────────────────────────────
//
// execute() → crea la persona vía FamilyService, guarda el ID asignado
// undo()    → elimina la persona recién creada (sin snapshot previo necesario,
//             ya que antes de execute() la persona no existía)

import { FamilyService } from "@/services/FamilyService";
import type { FamilyCommand, CommandResult } from "./FamilyCommand";
import type { Relation } from "@/types/family";
import type { PersonFormData } from "@/hooks/usePersonForm";

export class CreatePersonCommand implements FamilyCommand {
  readonly description: string;

  // ID asignado por el servidor tras execute(). Necesario para undo().
  // Es null antes de llamar a execute().
  private createdPersonId: string | null = null;

  constructor(
    private readonly formData: PersonFormData,
    private readonly currentRelations: Relation[],
    private readonly allPersonIds: string[]
  ) {
    this.description = `Crear persona: ${formData.firstName} ${formData.lastName}`;
  }

  async execute(): Promise<CommandResult> {
    const person = await FamilyService.createPerson(
      this.formData,
      this.currentRelations,
      this.allPersonIds
    );

    // Guardamos el ID para que undo() sepa qué eliminar
    this.createdPersonId = person.id;

    return { operation: "create", person };
  }

  async undo(): Promise<void> {
    if (!this.createdPersonId) {
      throw new Error(
        "CreatePersonCommand: undo() llamado antes de execute(). Estado inválido."
      );
    }

    await FamilyService.deletePerson(this.createdPersonId);
  }
}