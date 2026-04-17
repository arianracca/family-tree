"use client";

import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Suspense, lazy } from "react";
import TreeCanvas from "./TreeCanvas";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFamilyNucleus } from "@/hooks/useFamilyNucleus";

const FamilyNucleusPanel = lazy(
  () => import("@/components/ui/FamilyNucleusPanel")
);

function NucleusController() {
  const selectedPersonId = useFamilyStore((s) => s.selectedPersonId);
  const nucleus = useFamilyNucleus(selectedPersonId);
  if (!nucleus) return null;
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <FamilyNucleusPanel nucleus={nucleus} />
    </Suspense>
  );
}

function PanelSkeleton() {
  return (
    <aside className="panel-skeleton" aria-hidden="true">
      <div className="panel-skeleton__bar panel-skeleton__bar--title" />
      <div className="panel-skeleton__bar" />
      <div className="panel-skeleton__bar panel-skeleton__bar--short" />
      <style>{panelSkeletonStyles}</style>
    </aside>
  );
}

export default function FamilyTree() {
  const loadFamilyData = useFamilyStore((s) => s.loadFamilyData);
  const error          = useFamilyStore((s) => s.error);

  // ── Carga inicial — único punto de entrada de datos ──────────────────────
  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  if (error) {
    return (
      <div className="family-tree-error">
        <span>⚠ {error}</span>
        <style>{`
          .family-tree-error {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            font-family: Georgia, serif; font-size: 13px; color: #555;
            background: #080808;
          }
        `}</style>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="family-tree">
        <div className="family-tree__canvas">
          <TreeCanvas />
        </div>
        <NucleusController />
      </div>
      <style>{familyTreeStyles}</style>
    </ReactFlowProvider>
  );
}

const familyTreeStyles = `
  .family-tree {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    background: #080808;
  }
  .family-tree__canvas {
    flex: 1;
    min-width: 0;
    height: 100%;
  }
`;

const panelSkeletonStyles = `
  .panel-skeleton {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 300px;
    background: #0d0d0d;
    border-left: 1px solid #1a1a1a;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .panel-skeleton__bar {
    height: 12px;
    border-radius: 2px;
    background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }
  .panel-skeleton__bar--title { height: 18px; width: 60%; margin-bottom: 8px; }
  .panel-skeleton__bar--short { width: 40%; }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;