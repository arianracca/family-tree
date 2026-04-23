import type { FamilyData } from "@/types/family";
import type { LayoutResult } from "@/types/graph";

// ─── LayoutStrategy ──────────────────────────────────────────────────────────
//
// Interfaz que toda estrategia de layout debe implementar.
// Una estrategia recibe FamilyData y devuelve nodos + edges listos
// para ReactFlow, sin que el consumidor sepa nada del algoritmo interno.

export interface LayoutStrategy {
  /** Nombre legible de la estrategia, usado para debugging y UI. */
  readonly name: string;

  /**
   * Calcula el layout completo para los datos familiares dados.
   * Devuelve una Promise porque algunas implementaciones (ej: ELK)
   * son asíncronas por naturaleza.
   */
  compute(familyData: FamilyData): Promise<LayoutResult>;

  /**
   * Clave de invalidación: string que representa los datos relevantes
   * para este algoritmo. Cuando cambia, useLayout vuelve a computar.
   * Si es null, se usa la huella estructural por defecto (persons + relations).
   */
  getCacheKey?(familyData: FamilyData): string;
}