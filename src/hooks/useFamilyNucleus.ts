import { useMemo } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore } from "@/store/useTreeStore";
import { computeFamilyNucleus } from "@/lib/familyNucleus";
import type { FamilyNucleus } from "@/types/family";

export function useFamilyNucleus(personId: string | null): FamilyNucleus | null {
  const familyData     = useFamilyStore((state) => state.familyData);
  const setHighlight   = useTreeStore((state) => state.setHighlight);
  const clearHighlight = useTreeStore((state) => state.clearHighlight);

  const nucleus = useMemo(() => {
    if (!personId) {
      clearHighlight();
      return null;
    }

    const result = computeFamilyNucleus(personId, familyData);

    if (!result) {
      clearHighlight();
      return null;
    }

    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();

    // ── Todos los padres (A + B) ──────────────────────────────────────────────
    const allParentIds = [...result.parentIdsA, ...result.parentIdsB];

    allParentIds.forEach((id) => nodeIds.add(id));
    result.childrenIds.forEach((id) => nodeIds.add(id));

    // ── Pareja central ────────────────────────────────────────────────────────
    if (result.coupleIds) {
      const [idA, idB] = result.coupleIds;
      nodeIds.add(idA);
      nodeIds.add(idB);
      nodeIds.add(`couple-${idA}-${idB}`);
      edgeIds.add(`couple-edge-${idA}-${idB}`);
    } else {
      nodeIds.add(personId);
    }

    const couples = familyData.relations.filter((r) => r.type === "couple");

    // ── CoupleNodes de los padres ─────────────────────────────────────────────
    for (const parentId of allParentIds) {
      const parentCouple = couples.find(
        (c) => c.type === "couple" && c.persons.includes(parentId)
      );
      if (parentCouple && parentCouple.type === "couple") {
        const [pA, pB] = parentCouple.persons;
        nodeIds.add(`couple-${pA}-${pB}`);
        nodeIds.add(pA);
        nodeIds.add(pB);
      }
    }

    // ── CoupleNodes de los hijos ──────────────────────────────────────────────
    for (const childId of result.childrenIds) {
      const childCouple = couples.find(
        (c) => c.type === "couple" && c.persons.includes(childId)
      );
      if (childCouple && childCouple.type === "couple") {
        const [cA, cB] = childCouple.persons;
        nodeIds.add(`couple-${cA}-${cB}`);
        nodeIds.add(cA);
        nodeIds.add(cB);
      }
    }

    // ── Edges parent-child relevantes ─────────────────────────────────────────
    familyData.relations
      .filter((r) => r.type === "parent-child")
      .forEach((r) => {
        if (r.type !== "parent-child") return;

        const fromInNucleus =
          nodeIds.has(r.from) ||
          allParentIds.includes(r.from) ||
          (result.coupleIds?.includes(r.from) ?? false);

        const toInNucleus =
          nodeIds.has(r.to) ||
          result.childrenIds.includes(r.to) ||
          (result.coupleIds?.includes(r.to) ?? false);

        if (fromInNucleus && toInNucleus) {
          const parentCouple = couples.find(
            (c) => c.type === "couple" && c.persons.includes(r.from)
          );
          const childCouple = couples.find(
            (c) => c.type === "couple" && c.persons.includes(r.to)
          );
          const sourceId = parentCouple
            ? `couple-${parentCouple.persons[0]}-${parentCouple.persons[1]}`
            : r.from;
          const targetId = childCouple
            ? `couple-${childCouple.persons[0]}-${childCouple.persons[1]}`
            : r.to;

          edgeIds.add(`edge-${sourceId}→${targetId}`);
        }
      });

    setHighlight({ nodeIds, edgeIds });

    return result;
  }, [personId, familyData, setHighlight, clearHighlight]);

  return nucleus;
}