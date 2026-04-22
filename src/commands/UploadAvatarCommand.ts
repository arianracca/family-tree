// ─── UploadAvatarCommand ──────────────────────────────────────────────────────
//
// Cubre dos operaciones simétricas:
//
//   upload: sube un archivo nuevo → undo restaura photoUrl anterior
//   delete: pone photoUrl null    → undo restaura photoUrl anterior
//
// En ambos casos el undo es idéntico: hacer PUT a la persona con la
// photoUrl del snapshot. El archivo físico siempre sigue en disco
// (numeración incremental en upload, sin borrado físico en delete).
//
// CommandResult reutiliza operation "update" porque el store ya sabe
// cómo aplicar una actualización parcial de persona.

import { AvatarService } from "@/services/AvatarService";
import { activeRepository } from "@/lib/familyRepository";
import type { FamilyCommand, CommandResult } from "./FamilyCommand";

type AvatarOperation = "upload" | "delete";

export class UploadAvatarCommand implements FamilyCommand {
  readonly description: string;

  private previousPhotoUrl: string | null = null;

  constructor(
    private readonly operation:  AvatarOperation,
    private readonly personId:   string,
    private readonly firstName:  string,
    private readonly lastName:   string,
    private readonly file?:      File        // solo para "upload"
  ) {
    this.description = operation === "upload"
      ? `Subir avatar: ${firstName} ${lastName}`
      : `Eliminar avatar: ${firstName} ${lastName}`;
  }

  async execute(): Promise<CommandResult> {
    // ── 1. Capturar photoUrl anterior antes de cualquier escritura ─────────
    const { useFamilyStore } = await import("@/store/useFamilyStore");
    const { persons } = useFamilyStore.getState().familyData;
    const person = persons.find((p) => p.id === this.personId);

    this.previousPhotoUrl = person?.photoUrl ?? null;

    // ── 2. Ejecutar operación ──────────────────────────────────────────────
    let newPhotoUrl: string | null;

    if (this.operation === "upload") {
      if (!this.file) throw new Error("UploadAvatarCommand: file requerido para upload.");
      newPhotoUrl = await AvatarService.uploadAvatar(
        this.personId, this.firstName, this.lastName, this.file
      );
    } else {
      await AvatarService.deleteAvatar(this.personId);
      newPhotoUrl = null;
    }

    // ── 3. Construir Person actualizada para el store ──────────────────────
    if (!person) throw new Error(`UploadAvatarCommand: persona ${this.personId} no encontrada.`);

    const updatedPerson = { ...person, photoUrl: newPhotoUrl };

    return {
      operation: "update",
      person:         updatedPerson,
      previousPerson: person,
    };
  }

  async undo(): Promise<void> {
    // Restaurar photoUrl anterior directamente vía repositorio.
    // No pasa por FamilyService porque no hay lógica de negocio adicional —
    // es una escritura directa de un campo que ya fue validado en execute().
    await activeRepository.updatePerson(this.personId, {
      photoUrl: this.previousPhotoUrl,
    });
  }
}