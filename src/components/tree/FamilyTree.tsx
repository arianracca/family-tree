"use client";

import { resolveError } from "@/lib/errorMessages";
import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Suspense, lazy } from "react";
import TreeCanvas from "./TreeCanvas";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFamilyNucleus } from "@/hooks/useFamilyNucleus";
import panelStyles from "@/components/ui/panel.module.css";
import styles from "@/components/tree/FamilyTree.module.css";
import { useTranslations } from "next-intl";

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
    <aside className={panelStyles.skeleton} aria-hidden="true">
      <div className={`${panelStyles.skeletonBar} ${panelStyles.skeletonBarTitle}`} />
      <div className={panelStyles.skeletonBar} />
      <div className={`${panelStyles.skeletonBar} ${panelStyles.skeletonBarShort}`} />
    </aside>
  );
}

export default function FamilyTree() {
  const t      = useTranslations("tree");
  const tErrors = useTranslations("errors");

  const loadFamilyData   = useFamilyStore((s) => s.loadFamilyData);
  const error            = useFamilyStore((s) => s.error);
  const selectedPersonId = useFamilyStore((s) => s.selectedPersonId);
  const canUndo          = useFamilyStore((s) => s.canUndo);
  const undo             = useFamilyStore((s) => s.undo);

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  useEffect(() => {
    if (selectedPersonId) setShowCreatePanel(false);
  }, [selectedPersonId]);

  useEffect(() => {
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
        <span>⚠ {resolveError(error, tErrors)}</span>
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
          aria-label={t("undoAriaLabel")}
          title={t("undoBtn")}
        >
          ⎌
        </button>

        <button
          className={styles.addBtn}
          onClick={() => setShowCreatePanel(true)}
          type="button"
          aria-label={t("addPersonTitle")}
          title={t("addPerson")}
        >
          +
        </button>

      </div>
    </ReactFlowProvider>
  );
}