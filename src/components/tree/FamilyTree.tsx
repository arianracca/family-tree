"use client";

import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Suspense, lazy } from "react";
import TreeCanvas from "./TreeCanvas";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFamilyNucleus } from "@/hooks/useFamilyNucleus";
import PersonForm from "@/components/ui/PersonForm";
import { useTreeStore } from "@/store/useTreeStore";

const FamilyNucleusPanel = lazy(
  () => import("@/components/ui/FamilyNucleusPanel")
);

// ─── NucleusController ────────────────────────────────────────────────────────

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

// ─── CreatePanel ──────────────────────────────────────────────────────────────

function CreatePanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="nucleus-panel">
      <div className="nucleus-panel__header">
        <div className="nucleus-panel__title-group">
          <span className="nucleus-panel__label">Nueva persona</span>
          <h2 className="nucleus-panel__name">Agregar al árbol</h2>
        </div>
        <button
          className="nucleus-panel__close"
          onClick={onClose}
          type="button"
          aria-label="Cerrar"
        >✕</button>
      </div>
      <div className="nucleus-panel__divider" />
      {/* ↓ wrapper igual que en edit */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <PersonForm mode="create" onSuccess={onClose} onCancel={onClose} />
      </div>
      <style>{createPanelStyles}</style>
    </aside>
  );
}

// ─── PanelSkeleton ────────────────────────────────────────────────────────────

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

// ─── FamilyTree ───────────────────────────────────────────────────────────────

export default function FamilyTree() {
  const loadFamilyData   = useFamilyStore((s) => s.loadFamilyData);
  const error            = useFamilyStore((s) => s.error);
  const selectedPersonId = useFamilyStore((s) => s.selectedPersonId);

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  // Cerrar create panel si el usuario selecciona una persona
  useEffect(() => {
    if (selectedPersonId) setShowCreatePanel(false);
  }, [selectedPersonId]);

  if (error) {
    return (
      <div className="family-tree-error">
        <span>⚠ {error}</span>
        <style>{`
          .family-tree-error {
            width:100%;height:100%;display:flex;align-items:center;
            justify-content:center;font-family:Georgia,serif;
            font-size:13px;color:#555;background:#080808;
          }
        `}</style>
      </div>
    );
  }

  const panelOpen = showCreatePanel || !!selectedPersonId;

  return (
    <ReactFlowProvider>
      <div className="family-tree">

        {/* Canvas */}
        <div className="family-tree__canvas" data-panel-open={panelOpen}>
          <TreeCanvas />
        </div>

        {/* Panel lateral — create tiene prioridad sobre nucleus */}
        {showCreatePanel
          ? <CreatePanel onClose={() => setShowCreatePanel(false)} />
          : <NucleusController />
        }

        {/* Botón + — abajo a la izquierda */}
        <button
          className="family-tree__add-btn"
          onClick={() => {
            setShowCreatePanel(true);
          }}
          type="button"
          aria-label="Agregar persona"
          title="Agregar persona al árbol"
        >
          +
        </button>

      </div>
      <style>{familyTreeStyles}</style>
    </ReactFlowProvider>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
    transition: flex 250ms ease;
  }

  /* Botón agregar — abajo izquierda */
  .family-tree__add-btn {
    position: absolute;
    bottom: 28px;
    left: 28px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #111;
    border: 1px solid #2a2a2a;
    color: #c9a84c;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    transition: border-color 150ms, background 150ms, transform 150ms;
    box-shadow: 0 4px 20px #00000066;
    font-family: Georgia, serif;
  }

  .family-tree__add-btn:hover {
    border-color: #c9a84c66;
    background: #161616;
    transform: scale(1.08);
  }

  .family-tree__add-btn:active {
    transform: scale(0.96);
  }
`;

const createPanelStyles = `
  .nucleus-panel {
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 300px;
    background: #0d0d0d;
    border-left: 1px solid #1a1a1a;
    display: flex;
    flex-direction: column;
    z-index: 10;
    animation: panel-in 250ms cubic-bezier(0.4,0,0.2,1) both;
    font-family: Georgia, serif;
  }

  @keyframes panel-in {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .nucleus-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 16px 16px;
    gap: 8px;
    flex-shrink: 0;
  }

  .nucleus-panel__title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nucleus-panel__label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9a84c;
  }

  .nucleus-panel__name {
    font-size: 16px;
    font-weight: 400;
    color: #e8e8e8;
  }

  .nucleus-panel__close {
    width: 28px;
    height: 28px;
    background: none;
    border: 1px solid #222;
    border-radius: 4px;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 150ms, color 150ms;
    flex-shrink: 0;
  }

  .nucleus-panel__close:hover { border-color: #444; color: #e8e8e8; }

  .nucleus-panel__divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c44 30%, #c9a84c44 70%, transparent);
    flex-shrink: 0;
    margin: 0 16px;
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