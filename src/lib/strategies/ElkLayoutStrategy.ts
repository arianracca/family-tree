import type { FamilyData } from "@/types/family";
import type { LayoutResult } from "@/types/graph";
import type { LayoutStrategy } from "@/lib/layoutStrategy";
import { computeElkLayout } from "@/lib/elkLayout";
import { transformToReactFlow } from "@/lib/graphTransform";

// ─── ElkLayoutStrategy ───────────────────────────────────────────────────────
//
// Implementación del layout jerárquico usando ELK.js.
// Encapsula el pipeline: computeElkLayout → transformToReactFlow.
//
// Esta es la estrategia por defecto del árbol familiar. Su cacheKey
// solo incluye la estructura (ids + generación + relaciones), ignorando
// campos visuales como photoUrl, para evitar recalcular ELK innecesariamente.

export class ElkLayoutStrategy implements LayoutStrategy {
  readonly name = "elk-hierarchical";

  async compute(familyData: FamilyData): Promise<LayoutResult> {
    const elkOutput = await computeElkLayout(familyData);
    return transformToReactFlow(familyData, elkOutput);
  }

  getCacheKey(familyData: FamilyData): string {
    const persons = familyData.persons
      .map((p) => `${p.id}:${p.generation}`)
      .join("|");

    const relations = familyData.relations
      .map((r) =>
        r.type === "parent-child"
          ? `pc:${r.from}-${r.to}`
          : `cp:${r.persons[0]}-${r.persons[1]}`
      )
      .join("|");

    return `${this.name}__${persons}__${relations}`;
  }
}

// Instancia singleton — no tiene estado interno, es segura compartirla.
export const elkLayoutStrategy = new ElkLayoutStrategy();