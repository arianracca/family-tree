"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
  applyNodeChanges,
  type NodeMouseHandler,
  type OnMove,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PersonNode from "./nodes/PersonNode";
import CoupleNode from "./nodes/CoupleNode";
import { useElkLayout } from "@/hooks/useElkLayout";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore, selectIsLayoutReady } from "@/store/useTreeStore";
import type { AppNode, AppEdge } from "@/types/graph";
import CoupleEdge from "./edges/CoupleEdge";
import type { EdgeTypes } from "@xyflow/react";

const edgeTypes: EdgeTypes = {
  couple: CoupleEdge,
};

/*
    Los puntos clave:

    nodeTypes fuera del componente: es crítico que nodeTypes sea una constante estable definida fuera del render. Si se define adentro, ReactFlow la trata como una referencia nueva en cada render y desmonta/remonta todos los nodos causando parpadeos.
    fitView manual con useEffect: en lugar de pasarle fitView a ReactFlow como prop (que lo ejecuta en cada cambio de nodos), usamos un useRef como flag para ejecutarlo una sola vez cuando el primer layout esté listo. El setTimeout(50ms) le da tiempo a ReactFlow de pintar los nodos antes de calcular el fit.
    nodesDraggable: false: el layout lo gestiona ELK exclusivamente. Permitir drag manual rompería el sistema de generaciones ya que los nodos volverían a posiciones ELK en el próximo recálculo.
    zoomOnScroll: false + panOnScroll: true: en un árbol genealógico el scroll natural es navegar verticalmente por generaciones, no hacer zoom. El zoom queda en pinch (mobile) y Ctrl+scroll.
    Loading overlay con backdrop-filter: el overlay de carga no bloquea completamente la vista, permite ver el árbol anterior (si existe) difuminado mientras ELK recalcula ante cambios de datos.
    Selección unificada: tanto el click en PersonNode como en CoupleNode llaman a selectPerson, manteniendo useFamilyStore como única fuente de verdad para la selección semántica.
*/

// ─── Registrar tipos de nodos y edges ────────────────────────────────────────

const nodeTypes = {
  person: PersonNode,
  couple: CoupleNode,
};

// ─── Componente interno (necesita ReactFlowProvider en el padre) ──────────────

function TreeCanvasInner() {
  const { fitView } = useReactFlow();
  const hasAutoFit = useRef(false);

  // ── Store: layout ───────────────────────────────────────────────────────────

  const nodes        = useTreeStore((s) => s.nodes) as AppNode[];
  const edges        = useTreeStore((s) => s.edges) as AppEdge[];
  const layoutStatus = useTreeStore((s) => s.layoutStatus);
  const isReady      = useTreeStore(selectIsLayoutReady());
  const setViewport  = useTreeStore((s) => s.setViewport);
  const setNodes = useTreeStore((s) => s.setNodes);


  // ── Store: selección ────────────────────────────────────────────────────────

  const selectPerson  = useFamilyStore((s) => s.selectPerson);
  const clearSelection = useFamilyStore((s) => s.clearSelection);

  // ── Iniciar layout con ELK ──────────────────────────────────────────────────

  useElkLayout();

  // ── Auto fit al primer layout exitoso ──────────────────────────────────────

  useEffect(() => {
    if (isReady && !hasAutoFit.current) {
      hasAutoFit.current = true;
      // Pequeño delay para que ReactFlow haya pintado los nodos
      setTimeout(() => {
        fitView({ padding: 0.15, duration: 600 });
      }, 50);
    }
  }, [isReady, fitView]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNodeClick: NodeMouseHandler<AppNode> = useCallback(
    (_, node) => {
      if (node.type === "person") {
        selectPerson(node.data.personId);
      } else if (node.type === "couple") {
        // Click en el compound: seleccionar la primera persona de la pareja
        // como entrada al núcleo familiar
        selectPerson(node.data.personIds[0]);
      }
    },
    [selectPerson]
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleMove: OnMove = useCallback(
    (_, viewport) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const handleNodesChange: OnNodesChange<AppNode> = useCallback(
  (changes) => {
    setNodes(applyNodeChanges(changes, nodes) as AppNode[]);
  },
  [nodes, setNodes]
);

  // ── Estados de UI ───────────────────────────────────────────────────────────

  if (layoutStatus === "error") {
    return (
      <div className="canvas-state canvas-state--error">
        <span className="canvas-state__icon">⚠</span>
        <p className="canvas-state__message">
          Error al calcular el layout del árbol.
        </p>
        <style>{canvasStateStyles}</style>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="tree-canvas">
      {/* Loading overlay */}
      {layoutStatus === "loading" && (
        <div className="tree-canvas__loading" aria-label="Calculando árbol...">
          <div className="tree-canvas__spinner" />
          <span className="tree-canvas__loading-label">
            Calculando árbol genealógico…
          </span>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onMove={handleMove}
        fitView={false}           // lo manejamos manualmente con useEffect
        minZoom={0.1}
        maxZoom={2}
        panOnScroll
        zoomOnScroll={false}      // evita zoom accidental con scroll
        zoomOnPinch
        nodesDraggable={false}    // el layout lo maneja ELK, no el usuario
        nodesConnectable={false}  // no permitir crear edges manualmente
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1e1e1e"
        />
      </ReactFlow>

      <style>{treeCanvasStyles}</style>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const treeCanvasStyles = `
  .tree-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    background: #080808;
  }

  /* Override ReactFlow para que el fondo sea consistente */
  .tree-canvas .react-flow {
    background: #080808;
  }

  .tree-canvas .react-flow__edge-path {
    stroke: #2a2a2a;
    stroke-width: 1.5;
  }

  .tree-canvas .react-flow__edge.selected .react-flow__edge-path,
  .tree-canvas .react-flow__edge:hover .react-flow__edge-path {
    stroke: #c9a84c88;
  }

  /* Loading overlay */
  .tree-canvas__loading {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: #080808ee;
    backdrop-filter: blur(4px);
  }

  .tree-canvas__spinner {
    width: 28px;
    height: 28px;
    border: 2px solid #1e1e1e;
    border-top-color: #c9a84c;
    border-radius: 50%;
    animation: spin 700ms linear infinite;
  }

  .tree-canvas__loading-label {
    font-family: 'Georgia', serif;
    font-size: 13px;
    color: #555;
    letter-spacing: 0.05em;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const canvasStateStyles = `
  .canvas-state {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #080808;
    font-family: 'Georgia', serif;
  }

  .canvas-state__icon {
    font-size: 24px;
    color: #555;
  }

  .canvas-state__message {
    font-size: 13px;
    color: #555;
    letter-spacing: 0.03em;
  }
`;

// ─── Export ───────────────────────────────────────────────────────────────────

export default TreeCanvasInner;