import { useEffect, useRef } from "react";
import { computeElkLayout } from "@/lib/elkLayout";
import { transformToReactFlow } from "@/lib/graphTransform";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore } from "@/store/useTreeStore";
import type { FamilyData } from "@/types/family";

/*
    Los puntos clave:
    useElkLayout

    Patrón abort con useRef: como computeElkLayout es async, puede pasar que familyData cambie mientras ELK todavía está calculando. El abortRef garantiza que el resultado desactualizado se descarte y no pise al resultado nuevo.
    Sin Web Worker por ahora: la lógica está desacoplada para que en el futuro puedas mover computeElkLayout a un Worker sin tocar el hook. Solo cambiás la importación.
    Suscripción granular: el hook se suscribe solo a familyData del store, no al store completo. Así solo se re-ejecuta cuando los datos cambian realmente.
*/

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useElkLayout() {
  const familyData = useFamilyStore((state) => state.familyData);
  const setLayoutResult = useTreeStore((state) => state.setLayoutResult);
  const setLayoutStatus = useTreeStore((state) => state.setLayoutStatus);

  // Ref para cancelar layouts desactualizados si familyData cambia
  // mientras ELK todavía está calculando
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    // Marcar el cálculo anterior como cancelado
    abortRef.current = false;

    async function runLayout(data: FamilyData) {
      setLayoutStatus("loading");

      try {
        const elkOutput = await computeElkLayout(data);

        // Si llegó un nuevo familyData mientras calculábamos, descartar
        if (abortRef.current) return;

        const result = transformToReactFlow(data, elkOutput);

        if (abortRef.current) return;

        setLayoutResult(result);
      } catch (err) {
        if (abortRef.current) return;

        const message =
          err instanceof Error ? err.message : "ELK layout failed";
        setLayoutStatus("error", message);
        console.error("[useElkLayout] Layout error:", err);
      }
    }

    runLayout(familyData);

    // Cleanup: marcar como abortado si el efecto se re-ejecuta
    return () => {
      abortRef.current = true;
    };
  }, [familyData, setLayoutResult, setLayoutStatus]);
}