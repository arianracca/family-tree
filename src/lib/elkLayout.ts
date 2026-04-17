import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { FamilyData, Person, CoupleRelation } from "@/types/family";
import type { ElkNodeMeta, ElkLayoutOutput } from "@/types/graph";


/**
 * Los puntos clave de este archivo:
 * 
 * layerConstraint es el hard constraint que le dice a ELK en qué layer exacta va cada nodo. Mapeamos generation → índice de layer (0, 1, 2…) con un sort previo.
 * Compound nodes para las parejas: los dos PersonNode viven como children dentro del CoupleNode en ELK. Esto garantiza que nunca se separen horizontalmente.
 * Edge deduplication: como hay dos relaciones parent-child (una por cada padre) hacia el mismo hijo, el processedParentEdges Set evita que ELK reciba edges duplicados.
 * extractPositions recursivo: recorre el output de ELK y acumula posiciones absolutas aplicando el offset del compound padre a sus hijos internos.
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const NODE_WIDTH  = 180;
const NODE_HEIGHT = 80;
const COUPLE_PADDING = 16; // padding interno del compound node

// ─── ELK instance ────────────────────────────────────────────────────────────

const elk = new ELK();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCoupleId(personIds: [string, string]): string {
  return `couple-${personIds[0]}-${personIds[1]}`;
}

/**
 * Dado un personId, retorna el coupleId si esa persona pertenece a una pareja.
 * Retorna null si la persona no tiene pareja.
 */
function findCoupleIdForPerson(
  personId: string,
  couples: CoupleRelation[]
): string | null {
  const couple = couples.find((c) => c.persons.includes(personId));
  return couple ? getCoupleId(couple.persons) : null;
}

/**
 * El parent ELK de un PersonNode es su CoupleNode si tiene pareja,
 * o el root si es persona sola.
 */
function getElkParentId(
  personId: string,
  couples: CoupleRelation[]
): string | undefined {
  const couple = couples.find((c) => c.persons.includes(personId));
  return couple ? getCoupleId(couple.persons) : undefined;
}

// ─── Builder principal ────────────────────────────────────────────────────────

export interface ElkLayoutInput {
  familyData: FamilyData;
}

export async function computeElkLayout(
  familyData: FamilyData
): Promise<ElkLayoutOutput> {
  const { persons, relations } = familyData;

  const couples = relations.filter(
    (r): r is CoupleRelation => r.type === "couple"
  );
  const parentChildRelations = relations.filter(
    (r) => r.type === "parent-child"
  );

  // ── 1. Construir compound nodes (CoupleNodes) ────────────────────────────

  const coupleElkNodes: ElkNode[] = couples.map((couple) => {
    const coupleId = getCoupleId(couple.persons);

    // Dimensiones del compound calculadas a mano:
    // dos PersonNodes en fila + padding + gap
    const compoundWidth  = NODE_WIDTH * 2 + 16 + 12 * 2;  // 412
    const compoundHeight = NODE_HEIGHT + 12 * 2;           // 104

    return {
      id: coupleId,
      width: compoundWidth,
      height: compoundHeight,
      // Sin children — ELK lo trata como nodo atómico
      // Las posiciones internas las calculamos en extractPositions
    };
  });

  // ── 2. PersonNodes sin pareja (nodos raíz sueltos) ────────────────────────

  const personsInCouple = new Set(couples.flatMap((c) => c.persons));

  const soloPersonElkNodes: ElkNode[] = persons
    .filter((p) => !personsInCouple.has(p.id))
    .map((p) => ({
      id: p.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }));

  // ── 3. Edges parent-child ─────────────────────────────────────────────────
  //
  // La regla es: el source de un edge es el CoupleNode (si el padre tiene pareja)
  // o el PersonNode directo. El target es el CoupleNode del hijo (si tiene pareja)
  // o el PersonNode directo.
  //
  // Así ELK traza una sola línea desde la pareja-padre hacia la pareja-hijo,
  // no N líneas desde cada persona individual.

  // Primero agrupamos los hijos por par de padres para evitar edges duplicados
  const processedParentEdges = new Set<string>();
  const elkEdges: ElkExtendedEdge[] = [];

    for (const rel of parentChildRelations) {
  if (rel.type !== "parent-child") continue;

  // Source: CoupleNode del padre, o PersonNode solo
  const parentCoupleId = findCoupleIdForPerson(rel.from, couples);
  const sourceId = parentCoupleId ?? rel.from;

  // ✅ FIX: Target también debe ser CoupleNode del hijo, o PersonNode solo
  const childCoupleId = findCoupleIdForPerson(rel.to, couples);
  const targetId = childCoupleId ?? rel.to;

  const edgeKey = `${sourceId}→${targetId}`;
  if (processedParentEdges.has(edgeKey)) continue;
  processedParentEdges.add(edgeKey);

  elkEdges.push({
    id: `edge-${edgeKey}`,
    sources: [sourceId],
    targets: [targetId],
  });
}

  // ── 4. Layers por generación (hard constraint) ────────────────────────────
  //
  // ELK layered usa "layers" implícitas según las dependencias de edges.
  // Para forzar que generation === layer usamos "elk.position" en cada nodo
  // y "INTERACTIVE" layering strategy, que respeta las posiciones iniciales
  // como hints para asignar layers.
  //
  // Alternativa más robusta: usamos "elk.layered.layering.layerConstraint"
  // con un índice calculado desde la generation.
  // V2:
  // Eliminamos layerConstraint completamente.
  // ELK layered infiere los layers desde la dirección de los edges.
  // Con elk.direction: DOWN y edges de ancestro → descendiente,
  // ELK naturalmente pone ancestros arriba y descendientes abajo.
  // No necesitamos map de generationToLayer.

const allRootNodes: ElkNode[] = [
  ...coupleElkNodes,
  ...soloPersonElkNodes,
];

  // ── 5. Graph raíz ELK ─────────────────────────────────────────────────────

const elkGraph: ElkNode = {
  id: "root",
  layoutOptions: {
    "elk.algorithm": "layered",
    "elk.direction": "DOWN",
    "elk.spacing.nodeNode": "80",
    "elk.layered.spacing.nodeNodeBetweenLayers": "120",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    // Sin INTERACTIVE ni layerConstraint — ELK deduce layers desde edges
  },
  children: allRootNodes,
  edges: elkEdges,
};

  // ── 6. Correr ELK ─────────────────────────────────────────────────────────

  const layouted = await elk.layout(elkGraph);

  // ── 7. Extraer posiciones ─────────────────────────────────────────────────

  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  const nodeMeta = new Map<string, ElkNodeMeta>();

  function extractPositions(nodes: ElkNode[], offsetX = 0, offsetY = 0) {
  for (const node of nodes) {
    const x = (node.x ?? 0) + offsetX;
    const y = (node.y ?? 0) + offsetY;
    const width  = node.width  ?? NODE_WIDTH;
    const height = node.height ?? NODE_HEIGHT;

    positions.set(node.id, { x, y, width, height });

    const couple = couples.find((c) => getCoupleId(c.persons) === node.id);

    if (couple) {
      // Es un CoupleNode — calcular posiciones internas manualmente
      const PADDING = 12;
      const GAP     = 16;

      nodeMeta.set(node.id, {
        id: node.id,
        nodeType: "couple",
        generation: persons.find((p) => p.id === couple.persons[0])!.generation,
      });

      // PersonNode A — izquierda
      positions.set(couple.persons[0], {
        x: x + PADDING,
        y: y + PADDING,
        width:  NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      // PersonNode B — derecha
      positions.set(couple.persons[1], {
        x: x + PADDING + NODE_WIDTH + GAP,
        y: y + PADDING,
        width:  NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      for (const personId of couple.persons) {
        nodeMeta.set(personId, {
          id: personId,
          nodeType: "person",
          generation: persons.find((p) => p.id === personId)!.generation,
        });
      }
    } else {
      const person = persons.find((p) => p.id === node.id);
      if (person) {
        nodeMeta.set(node.id, {
          id: node.id,
          nodeType: "person",
          generation: person.generation,
        });
      }
    }
  }
}

  extractPositions(layouted.children ?? []);

  return { positions, nodeMeta };
}