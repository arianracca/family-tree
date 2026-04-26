"use client";

import ParentChildEdge from "./edges/ParentChildEdge";
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
import { useLayout } from "@/hooks/useLayout";
import { elkLayoutStrategy } from "@/lib/strategies/ElkLayoutStrategy";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore, selectIsLayoutReady } from "@/store/useTreeStore";
import type { AppNode, AppEdge } from "@/types/graph";
import CoupleEdge from "./edges/CoupleEdge";
import type { EdgeTypes } from "@xyflow/react";
import styles from "./TreeCanvas.module.css";
import { useTranslations } from "next-intl";

const edgeTypes: EdgeTypes = {
  parentChild: ParentChildEdge,
  couple:      CoupleEdge,
};

const nodeTypes = {
  person: PersonNode,
  couple: CoupleNode,
};

function TreeCanvasInner() {
  const t      = useTranslations("tree");
  const tErrors = useTranslations("errors");

  const { fitView }  = useReactFlow();
  const hasAutoFit   = useRef(false);

  const nodes        = useTreeStore((s) => s.nodes) as AppNode[];
  const edges        = useTreeStore((s) => s.edges) as AppEdge[];
  const layoutStatus = useTreeStore((s) => s.layoutStatus);
  const isReady      = useTreeStore(selectIsLayoutReady());
  const setViewport  = useTreeStore((s) => s.setViewport);
  const setNodes     = useTreeStore((s) => s.setNodes);

  const selectPerson   = useFamilyStore((s) => s.selectPerson);
  const clearSelection = useFamilyStore((s) => s.clearSelection);

  useLayout(elkLayoutStrategy);

  useEffect(() => {
    if (isReady && !hasAutoFit.current) {
      hasAutoFit.current = true;
      setTimeout(() => fitView({ padding: 0.15, duration: 600 }), 50);
    }
  }, [isReady, fitView]);

  const handleNodeClick: NodeMouseHandler<AppNode> = useCallback(
    (_, node) => {
      if (node.type === "person") {
        selectPerson(node.data.personId);
      } else if (node.type === "couple") {
        selectPerson(node.data.personIds[0]);
      }
    },
    [selectPerson]
  );

  const handlePaneClick = useCallback(() => clearSelection(), [clearSelection]);

  const handleMove: OnMove = useCallback(
    (_, viewport) => setViewport(viewport),
    [setViewport]
  );

  const handleNodesChange: OnNodesChange<AppNode> = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes) as AppNode[]),
    [nodes, setNodes]
  );

  if (layoutStatus === "error") {
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠</span>
        <p className={styles.errorMessage}>{tErrors("errorLayout")}</p>
      </div>
    );
  }

  return (
    <div className={styles.canvas}>
      {layoutStatus === "loading" && (
        <div className={styles.loading} aria-label={t("loadingLabel")}>
          <div className={styles.spinner} />
          <span className={styles.loadingLabel}>{t("loadingLabel")}</span>
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
        fitView={false}
        minZoom={0.1}
        maxZoom={2}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--color-border-default)"
        />
      </ReactFlow>
    </div>
  );
}

export default TreeCanvasInner;