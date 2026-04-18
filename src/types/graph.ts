import type { Node, Edge } from "@xyflow/react";

// ─── Tipos de nodos ReactFlow ────────────────────────────────────────────────

// Data que lleva un PersonNode
export interface PersonNodeData extends Record<string, unknown> {
  personId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  motherLastName?: string | null;
  isAlive: boolean;
  generation: number;
  isHighlighted?: boolean;
  photoUrl?: string | null; 

}

// Data que lleva un CoupleNode (compound: contiene dos personas)
export interface CoupleNodeData extends Record<string, unknown> {
  coupleId: string;         // ej: "couple-p1-p2"
  personIds: [string, string];
  active: boolean;
  generation: number;
  isHighlighted?: boolean;
}

// ─── Tipos de edges ReactFlow ────────────────────────────────────────────────

export interface ParentChildEdgeData extends Record<string, unknown> {
  fromGeneration: number;
  toGeneration: number;
}

export interface CoupleEdgeData extends Record<string, unknown> {
  active: boolean;
}

// ─── Nodos tipados para ReactFlow ────────────────────────────────────────────

export type PersonNode  = Node<PersonNodeData,  "person">;
export type CoupleNode  = Node<CoupleNodeData,  "couple">;
export type AppNode     = PersonNode | CoupleNode;

export type ParentChildEdge = Edge<ParentChildEdgeData, "parentChild">;
export type CoupleEdge      = Edge<CoupleEdgeData,      "couple">;
export type AppEdge         = ParentChildEdge | CoupleEdge;

// ─── Resultado del layout (output de graphTransform.ts) ──────────────────────

export interface LayoutResult {
  nodes: AppNode[];
  edges: AppEdge[];
}

// ─── Tipos internos de ELK ───────────────────────────────────────────────────

export interface ElkNodeMeta {
  id: string;
  nodeType: "person" | "couple";
  generation: number;
  // Para compound nodes (couple), los hijos ELK son los PersonNodes internos
  children?: ElkNodeMeta[];
}

// ─── Output del layout ELK (input de graphTransform.ts) ──────────────────────

export interface ElkLayoutOutput {
  positions: Map<string, { x: number; y: number; width: number; height: number }>;
  nodeMeta: Map<string, ElkNodeMeta>;
}