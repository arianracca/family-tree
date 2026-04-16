"use client";

import { ReactFlowProvider } from "@xyflow/react";
import TreeCanvas from "./TreeCanvas";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFamilyNucleus } from "@/hooks/useFamilyNucleus";

/*
    Los puntos clave:

    ReactFlowProvider en el nivel más alto: wrappea tanto el canvas como el NucleusController. Esto es importante porque en el futuro el panel lateral puede necesitar acceder al store interno de ReactFlow (por ejemplo, para hacer fitView al núcleo seleccionado desde el panel).
    NucleusController separado del canvas: si useFamilyNucleus viviera dentro de TreeCanvas o FamilyTree directamente, cada cambio de selección causaría un re-render del canvas completo. Al aislarlo en su propio subcomponente, el re-render queda contenido.
    lazy + Suspense para FamilyNucleusPanel: el panel lateral es un componente pesado (tiene lógica de visualización del núcleo, listas de personas, etc). Con lazy se carga solo cuando se necesita por primera vez. El PanelSkeleton actúa de fallback durante ese instante.
    PanelSkeleton con shimmer: en lugar de un spinner genérico, el skeleton refleja la forma real del panel con barras animadas. Reduce el perceived loading time porque el usuario ve estructura antes que contenido.
    Layout con flex: el canvas toma todo el espacio con flex: 1. El panel lateral se posiciona absolute sobre él. Esto evita que el canvas se redimensione al abrir/cerrar el panel, lo que causaría un recálculo del viewport de ReactFlow.
*/

// ─── Panel lateral ────────────────────────────────────────────────────────────
// Importación lazy para no bloquear el canvas mientras carga

import { Suspense, lazy } from "react";
const FamilyNucleusPanel = lazy(
  () => import("@/components/ui/FamilyNucleusPanel")
);

// ─── Subcomponente que consume el nucleus ─────────────────────────────────────
// Separado de FamilyTree para que el hook no re-renderice el canvas

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

// ─── Skeleton del panel ───────────────────────────────────────────────────────

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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FamilyTree() {
  return (
    <ReactFlowProvider>
      <div className="family-tree">
        {/*
          TreeCanvas ocupa todo el espacio disponible.
          ReactFlowProvider debe wrappear TreeCanvas para que
          useReactFlow() y useStore() funcionen dentro de él.
        */}
        <div className="family-tree__canvas">
          <TreeCanvas />
        </div>

        {/*
          NucleusController vive fuera del canvas pero dentro del Provider.
          Así puede leer el store de ReactFlow si lo necesita en el futuro
          (por ejemplo, para hacer fitView al núcleo seleccionado).
        */}
        <NucleusController />
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
    transition: margin-right 280ms cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const panelSkeletonStyles = `
  .panel-skeleton {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 320px;
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
    background: linear-gradient(
      90deg,
      #1a1a1a 25%,
      #222 50%,
      #1a1a1a 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }

  .panel-skeleton__bar--title {
    height: 18px;
    width: 60%;
    margin-bottom: 8px;
  }

  .panel-skeleton__bar--short {
    width: 40%;
  }

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;