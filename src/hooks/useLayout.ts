"use client";

import { useEffect, useRef, useMemo } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore } from "@/store/useTreeStore";
import type { FamilyData } from "@/types/family";
import type { LayoutStrategy } from "@/lib/layoutStrategy";

// ─── useLayout ───────────────────────────────────────────────────────────────
//
// Hook genérico de layout. Recibe cualquier LayoutStrategy y la ejecuta
// cuando los datos relevantes cambian. La lógica de invalidación del caché
// se delega a la estrategia vía getCacheKey(), con un fallback estructural
// si la estrategia no lo implementa.
//
// La sincronización de campos visuales (photoUrl, isAlive, etc.) se mantiene
// aquí como responsabilidad del hook, no de la estrategia, porque es
// independiente del algoritmo de layout.

export function useLayout(strategy: LayoutStrategy) {
  const familyData      = useFamilyStore((state) => state.familyData);
  const setLayoutResult = useTreeStore((state) => state.setLayoutResult);
  const setLayoutStatus = useTreeStore((state) => state.setLayoutStatus);
  const updateNodeData  = useTreeStore((state) => state.updateNodeData);

  const abortRef = useRef<boolean>(false);

  // ── Clave de caché: delegada a la estrategia o fallback estructural ────────
  const cacheKey = useMemo(() => {
    if (strategy.getCacheKey) {
      return strategy.getCacheKey(familyData);
    }
    // Fallback: huella estructural genérica
    return defaultStructuralKey(familyData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyData, strategy]);
  // ↑ strategy es estable (singleton o ref), pero lo incluimos para correctitud

  // ── Recalcular layout cuando cambia la clave ──────────────────────────────
  useEffect(() => {
    abortRef.current = false;

    async function runLayout() {
      setLayoutStatus("loading");
      try {
        const result = await strategy.compute(familyData);
        if (abortRef.current) return;
        setLayoutResult(result);
      } catch (err) {
        if (abortRef.current) return;
        const message = err instanceof Error ? err.message : "Layout failed";
        setLayoutStatus("error", message);
        console.error(`[useLayout:${strategy.name}] Error:`, err);
      }
    }

    runLayout();

    return () => {
      abortRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, setLayoutResult, setLayoutStatus]);
  // ↑ cacheKey abstrae familyData — no ponemos familyData directamente

  // ── Sincronizar campos visuales sin recalcular el layout ──────────────────
  // photoUrl, isAlive, firstName, etc. cambian sin afectar la estructura.
  // Actualizamos el data del nodo en ReactFlow directamente.
  useEffect(() => {
    for (const person of familyData.persons) {
      updateNodeData(person.id, {
        photoUrl:       person.photoUrl      ?? null,
        isAlive:        person.isAlive,
        firstName:      person.firstName,
        middleName:     person.middleName    ?? null,
        lastName:       person.lastName,
        motherLastName: person.motherLastName ?? null,
      });
    }
  }, [familyData.persons, updateNodeData]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultStructuralKey(familyData: FamilyData): string {
  const persons = familyData.persons
    .map((p) => `${p.id}:${p.generation}`)
    .join("|");

  const relations = familyData.relations
    .map((r) =>
      r.type === "parent-child"
        ? `pc:${r.from}-${r.to}`
        : `cp:${r.persons[0]}-${r.persons[1]}`
    )
    .join("|");

  return `default__${persons}__${relations}`;
}