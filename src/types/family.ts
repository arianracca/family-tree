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
  coupleIds: [string, string] | null; // la pareja central (puede ser persona sola)
  parentIds: string[];                // padres de cada miembro de la pareja
  childrenIds: string[];              // hijos de la pareja
  personId: string;                   // persona desde la que se calculó el núcleo
}