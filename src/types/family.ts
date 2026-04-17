// ─── Persona ────────────────────────────────────────────────────────────────

export interface Person {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaNacimiento?: string | null;
  fechaFallecimiento?: string | null;
  nacionalidades?: string[];
  ciudad?: string | null;
  vivo: boolean;
  generation: number; // Ancla: 100000. Padres < 100000, hijos > 100000
  photoUrl?: string | null;   // ← nuevo: URL, ruta /public, o base64

}

// ─── Relaciones ──────────────────────────────────────────────────────────────

export interface ParentChildRelation {
  type: "parent-child";
  from: string; // id del padre/madre
  to: string;   // id del hijo/a
}

export interface CoupleRelation {
  type: "couple";
  persons: [string, string]; // [idA, idB]
  active: boolean;
}

export type Relation = ParentChildRelation | CoupleRelation;

// ─── Dataset completo ────────────────────────────────────────────────────────

export interface FamilyData {
  persons: Person[];
  relations: Relation[];
}

// ─── Núcleo familiar (resultado de familyNucleus.ts) ────────────────────────

export interface FamilyNucleus {
  personId: string;
  coupleIds: [string, string] | null;
  // ❌ antes: parentIds: string[]
  // ✅ ahora: separados por miembro de la pareja
  parentIdsA: string[];   // padres del primer miembro (o de la persona sola)
  parentIdsB: string[];   // padres del segundo miembro (vacío si no hay pareja)
  childrenIds: string[];
}