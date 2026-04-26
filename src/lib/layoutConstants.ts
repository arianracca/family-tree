// ─── Constantes de dimensión de nodos ────────────────────────────────────────
// Fuente única de verdad para todas las dimensiones del layout.
// Importar desde acá en elkLayout.ts y graphTransform.ts.
// Si cambia cualquier dimensión, el cambio se propaga automáticamente.

export const NODE_WIDTH    = 180;
export const NODE_HEIGHT   = 80;

// ─── Constantes internas del CoupleNode ──────────────────────────────────────

export const COUPLE_PADDING = 12;   // padding interno del compound
export const COUPLE_GAP     = 16;   // separación entre los dos PersonNodes
export const COUPLE_WIDTH   = NODE_WIDTH * 2 + COUPLE_GAP + COUPLE_PADDING * 2; // 412
export const COUPLE_HEIGHT  = NODE_HEIGHT + COUPLE_PADDING * 2;                  // 104

// ─── Constantes de espaciado entre layers ────────────────────────────────────

export const LAYER_SPACING = 120;                        // espacio vertical entre generaciones
export const LAYER_HEIGHT  = NODE_HEIGHT + LAYER_SPACING; // 200 — usado para posicionar huérfanos