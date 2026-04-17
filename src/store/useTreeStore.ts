import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Viewport } from "@xyflow/react";
import type { AppNode, AppEdge, LayoutResult } from "@/types/graph";

/*
    Los puntos clave:

    layoutStatus como máquina de estados simple (idle → loading → success | error). El componente TreeCanvas lo usa para mostrar un spinner mientras ELK calcula o un mensaje de error si falla.
    activeNodeId vs selectedPersonId: son conceptos distintos. activeNodeId en useTreeStore es hover/foco del canvas (efecto visual inmediato). selectedPersonId en useFamilyStore es la selección semántica que abre el panel lateral.
    highlight con Set: cuando el usuario selecciona un núcleo familiar, se puebla con los IDs relevantes. Los selectores selectIsNodeHighlighted y selectIsEdgeHighlighted tienen una regla importante: si el Set está vacío significa "nada seleccionado → todo visible", y si tiene elementos significa "solo estos resaltados".
    centerOnNode: calcula el viewport necesario para centrar la cámara sobre un nodo específico. Útil cuando navegás desde el panel lateral hacia un nodo del árbol. Usa get() para leer el estado actual sin suscribirse.
*/

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

type LayoutStatus = "idle" | "loading" | "success" | "error";

interface HighlightState {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface TreeState {
  // Layout
  nodes: AppNode[];
  edges: AppEdge[];
  layoutStatus: LayoutStatus;
  layoutError: string | null;

  // Viewport
  viewport: Viewport;

  // Nodo activo (hover o foco de teclado — distinto a "seleccionado" del FamilyStore)
  activeNodeId: string | null;

  // Highlight — subgrafo resaltado al seleccionar un núcleo familiar
  highlight: HighlightState;

  // Acciones — layout
  setLayoutResult: (result: LayoutResult) => void;
  setLayoutStatus: (status: LayoutStatus, error?: string) => void;

  // Acciones — viewport
  setViewport: (viewport: Viewport) => void;
  resetViewport: () => void;

  // Acciones — nodo activo
  setActiveNodeId: (nodeId: string | null) => void;

  // Acciones — highlight
  setHighlight: (highlight: HighlightState) => void;
  clearHighlight: () => void;

  // Acciones — utilidades
  centerOnNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;

}

// ─── Valores por defecto ──────────────────────────────────────────────────────

const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

const EMPTY_HIGHLIGHT: HighlightState = {
  nodeIds: new Set(),
  edgeIds: new Set(),
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTreeStore = create<TreeState>()(
  immer((set, get) => ({
    // ── Estado inicial ──────────────────────────────────────────────────────

    nodes: [],
    edges: [],
    layoutStatus: "idle",
    layoutError: null,
    viewport: DEFAULT_VIEWPORT,
    activeNodeId: null,
    highlight: EMPTY_HIGHLIGHT,

    // ── Layout ──────────────────────────────────────────────────────────────

    setLayoutResult: (result) =>
      set((state) => {
        state.nodes = result.nodes as typeof state.nodes;
        state.edges = result.edges as typeof state.edges;
        state.layoutStatus = "success";
        state.layoutError = null;
      }),

    setLayoutStatus: (status, error) =>
      set((state) => {
        state.layoutStatus = status;
        state.layoutError = error ?? null;
      }),

    // ── Viewport ─────────────────────────────────────────────────────────────

    setViewport: (viewport) =>
      set((state) => {
        state.viewport = viewport;
      }),

    resetViewport: () =>
      set((state) => {
        state.viewport = DEFAULT_VIEWPORT;
      }),

    // ── Nodo activo ──────────────────────────────────────────────────────────

    setActiveNodeId: (nodeId) =>
      set((state) => {
        state.activeNodeId = nodeId;
      }),

    // ── Highlight ────────────────────────────────────────────────────────────

    setHighlight: (highlight) =>
      set((state) => {
        state.highlight.nodeIds = highlight.nodeIds;
        state.highlight.edgeIds = highlight.edgeIds;
      }),

    clearHighlight: () =>
      set((state) => {
        state.highlight.nodeIds = EMPTY_HIGHLIGHT.nodeIds;
        state.highlight.edgeIds = EMPTY_HIGHLIGHT.edgeIds;
      }),

    // ── Utilidades ───────────────────────────────────────────────────────────

    updateNodeData: (nodeId, data) =>
  set((state) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    node.data = { ...node.data, ...data };
  }),

    centerOnNode: (nodeId) => {
      const node = get().nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const x = -(node.position.x + (node.width ?? 180) / 2);
      const y = -(node.position.y + (node.height ?? 80) / 2);

      set((state) => {
        state.viewport = { x, y, zoom: state.viewport.zoom };
      });
    },
  }))
);

// ─── Selectores derivados ─────────────────────────────────────────────────────

export function selectIsNodeHighlighted(nodeId: string) {
  return (state: TreeState): boolean =>
    state.highlight.nodeIds.size === 0 ||
    state.highlight.nodeIds.has(nodeId);
}

export function selectIsEdgeHighlighted(edgeId: string) {
  return (state: TreeState): boolean =>
    state.highlight.edgeIds.size === 0 ||
    state.highlight.edgeIds.has(edgeId);
}

export function selectIsLayoutReady() {
  return (state: TreeState): boolean =>
    state.layoutStatus === "success" && state.nodes.length > 0;
}