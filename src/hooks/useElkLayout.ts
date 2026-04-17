import { useEffect, useRef, useMemo } from "react";
import { computeElkLayout } from "@/lib/elkLayout";
import { transformToReactFlow } from "@/lib/graphTransform";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore } from "@/store/useTreeStore";
import type { FamilyData } from "@/types/family";

export function useElkLayout() {
  const familyData      = useFamilyStore((state) => state.familyData);
  const setLayoutResult = useTreeStore((state) => state.setLayoutResult);
  const setLayoutStatus = useTreeStore((state) => state.setLayoutStatus);
  const updateNodeData  = useTreeStore((state) => state.updateNodeData);

  const abortRef = useRef<boolean>(false);

  // ── Huella estructural: solo lo que ELK necesita para calcular posiciones ──
  // photoUrl, vivo, nombres, etc. NO están acá.
  // Este memo solo cambia cuando cambia la estructura del árbol (personas/relaciones).
  const structuralKey = useMemo(() => {
    const personStructure = familyData.persons.map((p) => `${p.id}:${p.generation}`).join("|");
    const relationStructure = familyData.relations
      .map((r) =>
        r.type === "parent-child"
          ? `pc:${r.from}-${r.to}`
          : `cp:${r.persons[0]}-${r.persons[1]}`
      )
      .join("|");
    return `${personStructure}__${relationStructure}`;
  }, [familyData]);

  // ── ELK solo se recalcula cuando cambia la estructura ────────────────────
  useEffect(() => {
    abortRef.current = false;

    async function runLayout(data: FamilyData) {
      setLayoutStatus("loading");
      try {
        const elkOutput = await computeElkLayout(data);
        if (abortRef.current) return;

        const result = transformToReactFlow(data, elkOutput);
        if (abortRef.current) return;

        setLayoutResult(result);
      } catch (err) {
        if (abortRef.current) return;
        const message = err instanceof Error ? err.message : "ELK layout failed";
        setLayoutStatus("error", message);
        console.error("[useElkLayout] Layout error:", err);
      }
    }

    runLayout(familyData);

    return () => {
      abortRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structuralKey, setLayoutResult, setLayoutStatus]);
  // ↑ structuralKey en lugar de familyData — ELK no recalcula por photoUrl

  // ── Sincronizar datos de display cuando cambian sin cambio estructural ────
  // Cuando photoUrl (u otro campo visual) cambia, solo actualizamos
  // el data del nodo en ReactFlow directamente, sin pasar por ELK.
  useEffect(() => {
    for (const person of familyData.persons) {
      updateNodeData(person.id, {
        photoUrl:        person.photoUrl ?? null,
        vivo:            person.vivo,
        nombre:          person.nombre,
        apellidoPaterno: person.apellidoPaterno,
        apellidoMaterno: person.apellidoMaterno,
      });
    }
  }, [familyData.persons, updateNodeData]);
}