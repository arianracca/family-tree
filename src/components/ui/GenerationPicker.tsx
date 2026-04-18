// En cambio importá desde generationUtils:
import {
  type RelationshipType,
  RELATIONSHIP_OPTIONS,
  resolveGeneration,
} from "@/lib/generationUtils";
import type { Person } from "@/types/family";

function resolveGeneration(
  referencePersonId: string,
  relationship: RelationshipType,
  persons: Person[]
): number {
  const ref = persons.find((p) => p.id === referencePersonId)!;
  const delta: Record<RelationshipType, number> = {
    "hijo/a de":        +1,
    "padre/madre de":   -1,
    "pareja de":         0,
    "misma generación que": 0,
    "sobrino/a de":     +1,
    "tío/a de":         -1,
    "primo/a de":        0,
  };
  return ref.generation + delta[relationship];
}