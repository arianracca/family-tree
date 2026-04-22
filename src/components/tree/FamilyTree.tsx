"use client";

import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Suspense, lazy } from "react";
import TreeCanvas from "./TreeCanvas";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFamilyNucleus } from "@/hooks/useFamilyNucleus";
import panelStyles from "@/components/ui/panel.module.css";
import styles from "@/components/tree/FamilyTree.module.css";

const FamilyNucleusPanel = lazy(
  () => import("@/components/ui/FamilyNucleusPanel")
);

const UI = {
  addPerson:      "Agregar persona",
  addPersonTitle: "Agregar persona al árbol",
  addBtn:         "+",
  undoBtn:        "Deshacer",
} as const;

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
  const canUndo          = useFamilyStore((s) => s.canUndo);  // ← aquí
  const undo             = useFamilyStore((s) => s.undo);     // ← aquí

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  useEffect(() => {
    if (selectedPersonId) setShowCreatePanel(false);
  }, [selectedPersonId]);

  useEffect(() => {                                           // ← aquí
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (canUndo) undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, undo]);

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

        <div className={styles.canvas} data-panel-open={panelOpen}>
          <TreeCanvas />
        </div>

        {showCreatePanel ? (
          <Suspense fallback={<PanelSkeleton />}>
            <FamilyNucleusPanel
              initialMode="create"
              onClose={() => setShowCreatePanel(false)}
            />
          </Suspense>
        ) : (
          <NucleusController />
        )}

        <button
          className={styles.undoBtn}
          onClick={undo}
          disabled={!canUndo}
          type="button"
          aria-label="Deshacer última acción"
          title="Deshacer"
        >
          ↩
        </button>

        <button
          className={styles.addBtn}
          onClick={() => setShowCreatePanel(true)}
          type="button"
          aria-label={UI.addPersonTitle}
          title={UI.addPerson}
        >
          {UI.addBtn}
        </button>

      </div>
    </ReactFlowProvider>
  );
}