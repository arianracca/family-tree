import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { FamilyData, CoupleRelation } from "@/types/family";
import type { ElkNodeMeta, ElkLayoutOutput } from "@/types/graph";
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  COUPLE_PADDING,
  COUPLE_GAP,
  COUPLE_WIDTH,
  COUPLE_HEIGHT,
  LAYER_HEIGHT,
} from "@/lib/layoutConstants";

// ─── ELK instance ────────────────────────────────────────────────────────────

const elk = new ELK();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCoupleId(personIds: [string, string]): string {
  return `couple-${personIds[0]}-${personIds[1]}`;
}

function findCoupleIdForPerson(
  personId: string,
  couples: CoupleRelation[]
): string | null {
  const couple = couples.find((c) => c.persons.includes(personId));
  return couple ? getCoupleId(couple.persons) : null;
}

// ─── Builder principal ────────────────────────────────────────────────────────

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

  // ── 1. Mapa generation → layerIndex ──────────────────────────────────────
  // DEBE ir primero — los constructores de nodos lo necesitan
  const uniqueGenerations = [
    ...new Set(persons.map((p) => p.generation)),
  ].sort((a, b) => a - b);

  const generationToLayer = new Map<number, number>(
    uniqueGenerations.map((gen, idx) => [gen, idx])
  );

  // ── 2. Compound nodes (CoupleNodes) ──────────────────────────────────────

  const personsInCouple = new Set(couples.flatMap((c) => c.persons));

  const coupleElkNodes: ElkNode[] = couples.map((couple) => {
    const coupleId       = getCoupleId(couple.persons);

    const gen        = persons.find((p) => p.id === couple.persons[0])!.generation;
    const layerIndex = generationToLayer.get(gen) ?? 0;

    return {
      id: coupleId,
      width: COUPLE_WIDTH,
      height: COUPLE_HEIGHT,
    };
  });

// ── 3. PersonNodes sueltos (sin pareja) — sin layoutOptions ──────────────
  const soloPersonElkNodes: ElkNode[] = persons
    .filter((p) => !personsInCouple.has(p.id))
    .map((p) => ({
      id: p.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      // Sin layoutOptions — el layer se fuerza via phantom edges
    }));

// ── 4. Separar nodos conectados de huérfanos ─────────────────────────────

  const processedParentEdges = new Set<string>();
  const elkEdges: ElkExtendedEdge[] = [];

  for (const rel of parentChildRelations) {
    if (rel.type !== "parent-child") continue;

    const parentCoupleId = findCoupleIdForPerson(rel.from, couples);
    const sourceId       = parentCoupleId ?? rel.from;
    const childCoupleId  = findCoupleIdForPerson(rel.to, couples);
    const targetId       = childCoupleId ?? rel.to;

    const edgeKey = `${sourceId}→${targetId}`;
    if (processedParentEdges.has(edgeKey)) continue;
    processedParentEdges.add(edgeKey);

    elkEdges.push({
      id: `edge-${edgeKey}`,
      sources: [sourceId],
      targets: [targetId],
    });
  }

  // Nodos que participan en al menos un edge real
  const nodesWithEdges = new Set<string>();
  for (const edge of elkEdges) {
    edge.sources.forEach((s) => nodesWithEdges.add(s));
    edge.targets.forEach((t) => nodesWithEdges.add(t));
  }

  // Separar nodos ELK en conectados vs huérfanos
  const connectedNodes  = [...coupleElkNodes, ...soloPersonElkNodes]
    .filter((n) => nodesWithEdges.has(n.id));
  const orphanNodes     = [...coupleElkNodes, ...soloPersonElkNodes]
    .filter((n) => !nodesWithEdges.has(n.id));

  // ── 5. Graph raíz ELK — solo nodos conectados ─────────────────────────────

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm":                              "layered",
      "elk.direction":                              "DOWN",
      "elk.spacing.nodeNode":                       "80",
      "elk.layered.spacing.nodeNodeBetweenLayers":  "120",
      "elk.edgeRouting":                            "ORTHOGONAL",
      "elk.layered.nodePlacement.strategy":         "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy":  "LAYER_SWEEP",

      "elk.layered.crossingMinimization.greedySwitch.type":   "TWO_SIDED",
      "elk.layered.thoroughness":                             "10",
    },
    children: connectedNodes,
    edges: elkEdges,
  };

  // ── 6. Correr ELK ─────────────────────────────────────────────────────────

  const layouted = await elk.layout(elkGraph);

  // ── 7. Extraer posiciones de nodos conectados ─────────────────────────────

  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  const nodeMeta  = new Map<string, ElkNodeMeta>();

  function extractPositions(nodes: ElkNode[], offsetX = 0, offsetY = 0) {
    for (const node of nodes) {
      const x      = (node.x ?? 0) + offsetX;
      const y      = (node.y ?? 0) + offsetY;
      const width  = node.width  ?? NODE_WIDTH;
      const height = node.height ?? NODE_HEIGHT;

      positions.set(node.id, { x, y, width, height });

      const couple = couples.find((c) => getCoupleId(c.persons) === node.id);

      if (couple) {
        const PADDING = COUPLE_PADDING;
        const GAP     = COUPLE_GAP;

        nodeMeta.set(node.id, {
          id: node.id,
          nodeType: "couple",
          generation: persons.find((p) => p.id === couple.persons[0])!.generation,
        });

        positions.set(couple.persons[0], {
          x: x + PADDING,
          y: y + PADDING,
          width:  NODE_WIDTH,
          height: NODE_HEIGHT,
        });

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

// ── 8. Posicionar nodos huérfanos manualmente ─────────────────────────────
  //
  // En lugar de calcular Y desde layerIndex * LAYER_HEIGHT (que no coincide
  // con el padding interno que ELK agrega), leemos la Y real de un nodo
  // conectado de la misma generación y la usamos como referencia exacta.

  // Construir mapa generation → Y real desde CoupleNodes (no PersonNodes)
  // El CoupleNode es la referencia correcta — su Y es la Y visual del layer
  const generationToRealY = new Map<number, number>();

  for (const [nodeId, pos] of positions) {
    const meta = nodeMeta.get(nodeId);
    if (!meta) continue;
    if (generationToRealY.has(meta.generation)) continue;
    if (meta.nodeType !== "couple") continue;  // ← solo CoupleNodes como referencia

    generationToRealY.set(meta.generation, pos.y);
  }

  // Para generaciones sin nodo conectado de referencia, interpolamos
  // desde las generaciones vecinas conocidas
  for (const gen of uniqueGenerations) {
    if (generationToRealY.has(gen)) continue;

    const layerIndex = generationToLayer.get(gen) ?? 0;

    // Buscar generación anterior y siguiente con Y conocida
    const prevGen = uniqueGenerations
      .filter((g) => g < gen && generationToRealY.has(g))
      .at(-1);
    const nextGen = uniqueGenerations
      .find((g) => g > gen && generationToRealY.has(g));

    if (prevGen !== undefined && nextGen !== undefined) {
      const prevY     = generationToRealY.get(prevGen)!;
      const nextY     = generationToRealY.get(nextGen)!;
      const prevIdx   = generationToLayer.get(prevGen)!;
      const nextIdx   = generationToLayer.get(nextGen)!;
      const ratio     = (layerIndex - prevIdx) / (nextIdx - prevIdx);
      generationToRealY.set(gen, prevY + (nextY - prevY) * ratio);
    } else if (prevGen !== undefined) {
      const prevY   = generationToRealY.get(prevGen)!;
      const prevIdx = generationToLayer.get(prevGen)!;
      generationToRealY.set(gen, prevY + (layerIndex - prevIdx) * LAYER_HEIGHT);
    } else if (nextGen !== undefined) {
      const nextY   = generationToRealY.get(nextGen)!;
      const nextIdx = generationToLayer.get(nextGen)!;
      generationToRealY.set(gen, nextY - (nextIdx - layerIndex) * LAYER_HEIGHT);
    } else {
      generationToRealY.set(gen, layerIndex * LAYER_HEIGHT);
    }
  }

  // X mínima del árbol conectado para poner huérfanos a su izquierda
  let minX = 0;
  for (const [, pos] of positions) {
    if (pos.x < minX) minX = pos.x;
  }
  const ORPHAN_MARGIN = 80;
  let orphanCursorX = minX - ORPHAN_MARGIN;

  for (const orphan of orphanNodes) {// Primero posicionar orphan-couples, después orphan-solos
// para que los solos puedan usar los couples como referencia Y
const orphanCouples = orphanNodes.filter((n) =>
  couples.some((c) => getCoupleId(c.persons) === n.id)
);
const orphanSolos = orphanNodes.filter((n) =>
  !couples.some((c) => getCoupleId(c.persons) === n.id)
);

for (const orphan of [...orphanCouples, ...orphanSolos]) {
  const couple = couples.find((c) => getCoupleId(c.persons) === orphan.id);
  const gen = couple
    ? persons.find((p) => p.id === couple.persons[0])!.generation
    : persons.find((p) => p.id === orphan.id)!.generation;

  const y = generationToRealY.get(gen) ?? 0;

  const orphanWidth = orphan.width ?? NODE_WIDTH;
  orphanCursorX -= orphanWidth;
  const x = orphanCursorX;
  orphanCursorX -= ORPHAN_MARGIN;

  if (couple) {
    const PADDING = COUPLE_PADDING;
    const GAP     = COUPLE_GAP;

    nodeMeta.set(orphan.id, { id: orphan.id, nodeType: "couple", generation: gen });

    positions.set(orphan.id, {
      x, y,
      width:  orphanWidth,
      height: orphan.height ?? NODE_HEIGHT,
    });

    positions.set(couple.persons[0], {
      x: x + PADDING, y: y + PADDING,
      width: NODE_WIDTH, height: NODE_HEIGHT,
    });
    positions.set(couple.persons[1], {
      x: x + PADDING + NODE_WIDTH + GAP, y: y + PADDING,
      width: NODE_WIDTH, height: NODE_HEIGHT,
    });
    for (const personId of couple.persons) {
      nodeMeta.set(personId, { id: personId, nodeType: "person", generation: gen });
    }
  } else {
    const person = persons.find((p) => p.id === orphan.id);
    if (person) {
      nodeMeta.set(orphan.id, { id: orphan.id, nodeType: "person", generation: gen });
    }

    // Buscar CoupleNode de la misma generación ya posicionado (ahora sí existe)
    let referenceY = y;
    for (const [nodeId, pos] of positions) {
      const meta = nodeMeta.get(nodeId);
      if (meta?.nodeType === "couple" && meta.generation === gen) {
        referenceY = pos.y + (pos.height - NODE_HEIGHT) / 2;
        break;
      }
    }

    positions.set(orphan.id, {
      x,
      y: referenceY,
      width:  orphanWidth,
      height: orphan.height ?? NODE_HEIGHT,
    });
  }
}
  }

  return { positions, nodeMeta };
}