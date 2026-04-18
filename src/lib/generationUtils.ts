import type { Person } from "@/types/family";

// ─── Tipos exportados que GenerationPicker necesita ──────────────────────────

export type RelationshipType =
  | "hijo/a de"
  | "padre/madre de"
  | "pareja de"
  | "misma generación que"
  | "sobrino/a de"
  | "tío/a de"
  | "primo/a de";

export const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  "hijo/a de",
  "padre/madre de",
  "pareja de",
  "misma generación que",
  "sobrino/a de",
  "tío/a de",
  "primo/a de",
];

// ─── Delta de generación por tipo de relación ────────────────────────────────

const GENERATION_DELTA: Record<RelationshipType, number> = {
  "hijo/a de":           +1,
  "padre/madre de":      -1,
  "pareja de":            0,
  "misma generación que": 0,
  "sobrino/a de":        +1,
  "tío/a de":            -1,
  "primo/a de":           0,
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