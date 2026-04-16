import type { FamilyData, FamilyNucleus, CoupleRelation } from "@/types/family";

/*
    Los puntos clave:

    getChildrenOfCouple usa intersección de Sets: los hijos de una pareja son exactamente los que tienen a ambos como padres. Usar un Set + filter es O(n) y evita falsos positivos en familias ensambladas donde una persona puede tener hijos de relaciones anteriores.
    getParentsOfCouple usa unión: a diferencia de los hijos, los padres de cada miembro de la pareja son independientes. Se unifican con Set para deduplicar el caso (muy raro pero válido) donde dos miembros de una pareja comparten un ancestro.
    Dos casos bien separados: persona con pareja y persona sola. Esto es importante porque useFamilyNucleus.ts y el panel lateral necesitan saber si renderizar un CoupleNode o un PersonNode como centro del núcleo.
    getNucleusPersonIds: utilidad de conveniencia que aplana el núcleo a un Set<string>. La usan los componentes que solo necesitan saber "¿este nodo pertenece al núcleo activo?" sin necesitar la estructura completa.
    getNucleusGeneration: helper simple para que el viewport pueda hacer scroll inicial a la generación de la persona seleccionada.
*/

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCoupleForPerson(
  personId: string,
  couples: CoupleRelation[]
): CoupleRelation | undefined {
  return couples.find((c) => c.persons.includes(personId));
}

function getParentsOf(
  personId: string,
  familyData: FamilyData
): string[] {
  return familyData.relations
    .filter((r) => r.type === "parent-child" && r.to === personId)
    .map((r) => (r.type === "parent-child" ? r.from : ""))
    .filter(Boolean);
}

function getChildrenOf(
  personId: string,
  familyData: FamilyData
): string[] {
  return familyData.relations
    .filter((r) => r.type === "parent-child" && r.from === personId)
    .map((r) => (r.type === "parent-child" ? r.to : ""))
    .filter(Boolean);
}

function getChildrenOfCouple(
  personIds: [string, string],
  familyData: FamilyData
): string[] {
  const [idA, idB] = personIds;

  // Los hijos de la pareja son los que tienen a AMBOS como padres
  const childrenOfA = new Set(getChildrenOf(idA, familyData));
  const childrenOfB = new Set(getChildrenOf(idB, familyData));

  return [...childrenOfA].filter((id) => childrenOfB.has(id));
}

function getParentsOfCouple(
  personIds: [string, string],
  familyData: FamilyData
): string[] {
  const [idA, idB] = personIds;

  // Retornamos los padres de cada miembro de la pareja por separado
  // (no es un AND como en hijos, cada uno tiene sus propios padres)
  const parentsOfA = getParentsOf(idA, familyData);
  const parentsOfB = getParentsOf(idB, familyData);

  // Deduplicar por si comparten algún padre (caso raro pero posible)
  return [...new Set([...parentsOfA, ...parentsOfB])];
}

// ─── Algoritmo principal ──────────────────────────────────────────────────────

/**
 * Dado un personId, calcula su núcleo familiar:
 * - Su pareja (si tiene)
 * - Los padres de ambos miembros de la pareja
 * - Los hijos en común
 *
 * Si la persona no existe en el dataset retorna null.
 */
export function computeFamilyNucleus(
  personId: string,
  familyData: FamilyData
): FamilyNucleus | null {
  const person = familyData.persons.find((p) => p.id === personId);
  if (!person) return null;

  const couples = familyData.relations.filter(
    (r): r is CoupleRelation => r.type === "couple"
  );

  const couple = getCoupleForPerson(personId, couples);

  // ── Caso 1: persona con pareja ────────────────────────────────────────────

  if (couple) {
    const coupleIds = couple.persons;
    const parentIds = getParentsOfCouple(coupleIds, familyData);
    const childrenIds = getChildrenOfCouple(coupleIds, familyData);

    return {
      personId,
      coupleIds,
      parentIds,
      childrenIds,
    };
  }

  // ── Caso 2: persona sin pareja ────────────────────────────────────────────

  const parentIds = getParentsOf(personId, familyData);
  const childrenIds = getChildrenOf(personId, familyData);

  return {
    personId,
    coupleIds: null,
    parentIds,
    childrenIds,
  };
}

// ─── Utilidades exportadas ────────────────────────────────────────────────────

/**
 * Retorna todos los personIds que pertenecen al núcleo familiar de una persona,
 * incluyendo a la persona misma. Útil para filtrar rápido sin el objeto completo.
 */
export function getNucleusPersonIds(
  personId: string,
  familyData: FamilyData
): Set<string> {
  const nucleus = computeFamilyNucleus(personId, familyData);
  if (!nucleus) return new Set([personId]);

  const ids = new Set<string>();

  ids.add(personId);

  if (nucleus.coupleIds) {
    nucleus.coupleIds.forEach((id) => ids.add(id));
  }

  nucleus.parentIds.forEach((id) => ids.add(id));
  nucleus.childrenIds.forEach((id) => ids.add(id));

  return ids;
}

/**
 * Dado un personId, retorna la generación base del núcleo.
 * Útil para calcular el scroll inicial del viewport.
 */
export function getNucleusGeneration(
  personId: string,
  familyData: FamilyData
): number | null {
  const person = familyData.persons.find((p) => p.id === personId);
  return person?.generation ?? null;
}