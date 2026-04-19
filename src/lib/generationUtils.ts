import type { Person } from "@/types/family";

// ─── Exported types needed by GenerationPicker ──────────────────────────

export type RelationshipType =
  | "child of"
  | "parent of"
  | "partner of"
  | "same generation as"
  | "nephew/niece of"
  | "uncle/aunt of"
  | "cousin of";

export const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  "child of",
  "parent of",
  "partner of",
  "same generation as",
  "nephew/niece of",
  "uncle/aunt of",
  "cousin of",
];

// ─── Labels por idioma (preparado para i18n) ──────────────────────────────

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  "child of":           "Hijo/a de",
  "parent of":          "Padre/Madre de",
  "partner of":         "Pareja de",
  "same generation as": "Misma generación que",
  "nephew/niece of":    "Sobrino/a de",
  "uncle/aunt of":      "Tío/a de",
  "cousin of":          "Primo/a de",
};

// ─── Generation delta by relationship type ────────────────────────────────

const GENERATION_DELTA: Record<RelationshipType, number> = {
  "child of":           +1,
  "parent of":          -1,
  "partner of":          0,
  "same generation as":  0,
  "nephew/niece of":    +1,
  "uncle/aunt of":      -1,
  "cousin of":           0,
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