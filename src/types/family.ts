// ─── Persona ────────────────────────────────────────────────────────────────
export interface Person {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  motherLastName?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  nationalities?: string[];
  city?: string | null;
  isAlive: boolean;
  generation: number;
  history?: string | null;
  photoUrl?: string | null;
  customFields?: CustomField[];
}

// ─── Campos personalizados (ejemplo: profesión, biografía, etc.) ─────────────
export interface CustomField {
  key: string;    // ej: "profesion"
  label: string;  // ej: "Profesión"
  value: string;
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