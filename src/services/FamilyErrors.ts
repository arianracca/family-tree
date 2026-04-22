// ─── Errores tipados del dominio ──────────────────────────────────────────────
// Separados de FamilyService para que cualquier capa (hooks, comandos, UI)
// pueda importarlos sin crear dependencia transitiva con el servicio completo.
//
// SRP: este archivo tiene una sola razón de cambio — la taxonomía de errores.

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