import type { Person } from "@/types/family";

// ─── Tipo con claves lógicas — sin espacios, aptas para next-intl ────────────

export type RelationshipType =
  | "child_of"
  | "parent_of"
  | "partner_of"
  | "same_generation"
  | "nephew_of"
  | "uncle_of"
  | "cousin_of";

export const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  "child_of",
  "parent_of",
  "partner_of",
  "same_generation",
  "nephew_of",
  "uncle_of",
  "cousin_of",
];

// ─── Delta de generación por tipo de relación ─────────────────────────────────

const GENERATION_DELTA: Record<RelationshipType, number> = {
  child_of:        +1,
  parent_of:       -1,
  partner_of:       0,
  same_generation:  0,
  nephew_of:       +1,
  uncle_of:        -1,
  cousin_of:        0,
};

export function resolveGeneration(
  referencePersonId: string,
  relationship: RelationshipType,
  persons: Person[]
): number | null {
  const ref = persons.find((p) => p.id === referencePersonId);
  if (!ref) return null;
  return ref.generation + GENERATION_DELTA[relationship];
}