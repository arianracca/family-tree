import type { FamilyData, CoupleRelation, Person } from "@/types/family";
import type {
  ElkLayoutOutput,
  AppNode,
  AppEdge,
  PersonNodeData,
  CoupleNodeData,
  ParentChildEdgeData,
  CoupleEdgeData,
  LayoutResult,
} from "@/types/graph";

/*
    Los puntos clave de este archivo:

    Posición relativa vs absoluta: los PersonNode dentro de un compound usan posición relativa al CoupleNode padre (personPos.x - pos.x). ReactFlow requiere esto cuando usás parentId.
    parentId + extent: "parent": estas dos props le dicen a ReactFlow que el PersonNode vive dentro del CoupleNode y no puede salirse de sus límites.
    Orden del array de nodos: ReactFlow necesita que el nodo padre (couple) aparezca antes que sus hijos (person) en el array, de lo contrario el compound no renderiza bien. Por eso el sort al final.
    Edges de pareja son internos al compound: conectan los dos PersonNode entre sí dentro del CoupleNode. Son decorativos, no afectan el layout de ELK.
    Deduplicación de edges es idéntica a elkLayout.ts para mantener consistencia.
*/

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCoupleId(personIds: [string, string]): string {
  return `couple-${personIds[0]}-${personIds[1]}`;
}

function findCoupleForPerson(
  personId: string,
  couples: CoupleRelation[]
): CoupleRelation | undefined {
  return couples.find((c) => c.persons.includes(personId));
}

// ─── Transform principal ──────────────────────────────────────────────────────

export function transformToReactFlow(
  familyData: FamilyData,
  elkOutput: ElkLayoutOutput
): LayoutResult {
  const { persons, relations } = familyData;
  const { positions, nodeMeta } = elkOutput;

  const couples = relations.filter(
    (r): r is CoupleRelation => r.type === "couple"
  );
  const parentChildRelations = relations.filter(
    (r) => r.type === "parent-child"
  );

  const nodes: AppNode[] = [];
  const edges: AppEdge[] = [];

  // ── 1. CoupleNodes (compound) ───────────────────────────────────────────────

  for (const couple of couples) {
    const coupleId = getCoupleId(couple.persons);
    const pos = positions.get(coupleId);
    const meta = nodeMeta.get(coupleId);

    if (!pos || !meta) continue;

    const coupleNodeData: CoupleNodeData = {
      coupleId,
      personIds: couple.persons,
      active: couple.active,
      generation: meta.generation,
    };

    nodes.push({
      id: coupleId,
      type: "couple",
      position: { x: pos.x, y: pos.y },
      data: coupleNodeData,
      // ReactFlow necesita width/height explícitos para compound nodes
      width: pos.width,
      height: pos.height,
      // Los PersonNodes internos son children de este nodo en ReactFlow
      // Se renderizan dentro del CoupleNode via su componente
      style: { width: pos.width, height: pos.height },
    });

    // ── 2. PersonNodes dentro del compound ─────────────────────────────────

    for (const personId of couple.persons) {
      const person = persons.find((p) => p.id === personId);
      if (!person) continue;

      const personPos = positions.get(personId);
      const personMeta = nodeMeta.get(personId);
      if (!personPos || !personMeta) continue;

      const personNodeData: PersonNodeData = {
        personId: person.id,
        nombre: person.nombre,
        apellidoPaterno: person.apellidoPaterno,
        apellidoMaterno: person.apellidoMaterno,
        vivo: person.vivo,
        generation: person.generation,
        photoUrl: person.photoUrl,
      };

      nodes.push({
        id: personId,
        type: "person",
        // La posición es relativa al CoupleNode padre
        position: {
          x: personPos.x - pos.x,
          y: personPos.y - pos.y,
        },
        data: personNodeData,
        width: personPos.width,
        height: personPos.height,
        // Declara que este nodo vive dentro del CoupleNode
        parentId: coupleId,
        extent: "parent",
      });
    }
  }

  // ── 3. PersonNodes sueltos (sin pareja) ────────────────────────────────────

  const personsInCouple = new Set(couples.flatMap((c) => c.persons));

  for (const person of persons) {
    if (personsInCouple.has(person.id)) continue;

    const pos = positions.get(person.id);
    const meta = nodeMeta.get(person.id);
    if (!pos || !meta) continue;

    const personNodeData: PersonNodeData = {
      personId: person.id,
      nombre: person.nombre,
      apellidoPaterno: person.apellidoPaterno,
      apellidoMaterno: person.apellidoMaterno,
      vivo: person.vivo,
      generation: person.generation,
    };

    nodes.push({
      id: person.id,
      type: "person",
      position: { x: pos.x, y: pos.y },
      data: personNodeData,
      width: pos.width,
      height: pos.height,
    });
  }

  // ── 4. Edges parent-child ──────────────────────────────────────────────────

  const processedEdges = new Set<string>();

  for (const rel of parentChildRelations) {
    if (rel.type !== "parent-child") continue;

    const parentCouple = findCoupleForPerson(rel.from, couples);

    // Source: sigue siendo el CoupleNode del padre (o PersonNode si está solo)
    const sourceId = parentCouple
      ? getCoupleId(parentCouple.persons)
      : rel.from;

    // Target: ahora apunta al PersonNode específico, NO al CoupleNode
    // Así la línea llega a Helder o a Nilde individualmente
    const targetId = rel.to;

    const edgeKey = `${sourceId}→${targetId}`;
    if (processedEdges.has(edgeKey)) continue;
    processedEdges.add(edgeKey);

    const fromPerson = persons.find((p) => p.id === rel.from)!;
    const toPerson   = persons.find((p) => p.id === rel.to)!;

    const edgeData: ParentChildEdgeData = {
      fromGeneration: fromPerson.generation,
      toGeneration:   toPerson.generation,
    };

    edges.push({
      id: `edge-${edgeKey}`,
      type: "parentChild",
      source: sourceId,
      target: targetId,
      data: edgeData,
      sourceHandle: "bottom",
      targetHandle: "top",
    });
  }

  // ── 5. Edges de pareja ─────────────────────────────────────────────────────
  //
  // Conectan los dos PersonNodes internos del CoupleNode.
  // Son decorativos dentro del compound: sólida = active, punteada = inactiva.

  for (const couple of couples) {
    const [idA, idB] = couple.persons;
    const edgeData: CoupleEdgeData = { active: couple.active };

    edges.push({
      id: `couple-edge-${idA}-${idB}`,
      type: "couple",
      source: idA,
      target: idB,
      data: edgeData,
    });
  }

  // ── 6. Ordenar nodos: compound antes que sus hijos ─────────────────────────
  //
  // ReactFlow requiere que el nodo padre aparezca antes en el array
  // que sus nodos hijos para renderizar correctamente el compound.

  const sortedNodes = [
    ...nodes.filter((n) => n.type === "couple"),
    ...nodes.filter((n) => n.type === "person"),
  ];

  return { nodes: sortedNodes, edges };
}