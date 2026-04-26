import { activeRepository } from "@/lib/familyRepository";

// ─── AvatarService ────────────────────────────────────────────────────────────
//
// Encapsula las operaciones de avatar siguiendo el mismo patrón que FamilyService.
// Los comandos operan siempre a través de este servicio, nunca directamente
// sobre el repositorio ni sobre fetch.

export const AvatarService = {

  /**
   * Sube un nuevo avatar. Devuelve la photoUrl nueva (con cache buster).
   * El archivo anterior NO se sobreescribe — el backend usa numeración
   * incremental (00.Avatar.webp, 01.Avatar.webp, …), por lo que el undo
   * puede restaurar la URL anterior apuntando al archivo que sigue en disco.
   */
  async uploadAvatar(
    personId:  string,
    firstName: string,
    lastName:  string,
    file:      File
  ): Promise<string> {
    return activeRepository.uploadAvatar(personId, firstName, lastName, file);
  },

  /**
   * Elimina el avatar de una persona (pone photoUrl: null en el JSON).
   * El archivo físico NO se borra — eso es responsabilidad del batch.
   * Devuelve la previousPhotoUrl para que el comando pueda hacer undo.
   */
  async deleteAvatar(personId: string): Promise<string | null> {
    return activeRepository.deleteAvatar(personId);
  },
};