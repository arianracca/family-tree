"use client";

import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Suspense, lazy } from "react";
import TreeCanvas from "./TreeCanvas";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFamilyNucleus } from "@/hooks/useFamilyNucleus";
import PersonForm from "@/components/ui/PersonForm";
import { useTreeStore } from "@/store/useTreeStore";
import panelStyles from "@/components/ui/panel.module.css";
import styles from "@/components/tree/FamilyTree.module.css";

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
    <aside className={panelStyles.panel}>
      <div className={panelStyles.header}>
        <div className={panelStyles.titleGroup}>
          <span className={panelStyles.label}>Nueva persona</span>
          <h2 className={panelStyles.title}>Agregar al árbol</h2>
        </div>
        <button className={panelStyles.closeBtn} onClick={onClose} type="button">✕</button>
      </div>
      <div className={panelStyles.divider} />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <PersonForm mode="create" onSuccess={onClose} onCancel={onClose} />
      </div>
    </aside>
  );
}

// ─── PanelSkeleton ────────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <aside className={panelStyles.skeleton} aria-hidden="true">
      <div className={`${panelStyles.skeletonBar} ${panelStyles.skeletonBarTitle}`} />
      <div className={panelStyles.skeletonBar} />
      <div className={`${panelStyles.skeletonBar} ${panelStyles.skeletonBarShort}`} />
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
      <div className={styles.error}>
        <span>⚠ {error}</span>
      </div>
    );
  }

  const panelOpen = showCreatePanel || !!selectedPersonId;

  return (
    <ReactFlowProvider>
      <div className={styles.container}>

        {/* Canvas */}
        <div className={styles.canvas} data-panel-open={panelOpen}>
          <TreeCanvas />
        </div>

        {/* Panel lateral — create tiene prioridad sobre nucleus */}
        {showCreatePanel
          ? <CreatePanel onClose={() => setShowCreatePanel(false)} />
          : <NucleusController />
        }

        {/* Botón + — abajo a la izquierda */}
        <button
          className={styles.addBtn}
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
    </ReactFlowProvider>
  );
}