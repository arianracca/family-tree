import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CoupleNode as CoupleNodeType } from "@/types/graph";
import styles from "./CoupleNode.module.css";


/*
    Los puntos clave:

    El compound no renderiza a sus hijos explícitamente: ReactFlow se encarga de renderizar los PersonNode dentro del CoupleNode automáticamente gracias al parentId + extent: "parent" definidos en graphTransform.ts. El CoupleNode solo provee el contenedor visual de fondo.
    Conector decorativo central: la línea entre los dos PersonNode no es un edge de ReactFlow sino un div absolutamente posicionado en el centro del compound. Sólida y dorada para parejas activas, punteada y gris para inactivas. Esto evita la complejidad de manejar un edge interno que ReactFlow podría redibujar en cada pan/zoom.
    useStore para zoom: se lee el zoom actual del store interno de ReactFlow. Está disponible para escalar elementos si en el futuro necesitás que el conector o las esquinas decorativas se adapten al nivel de zoom.
    Esquinas decorativas con ::before / ::after: dos esquinas diagonales opuestas (top-left y bottom-right) que aparecen en hover/selección. Dan la sensación de que el compound está "enmarcado" sin usar un borde completo que compita visualmente con los PersonNode internos.
    Handles en el compound, no en los PersonNodes: los edges parent-child conectan al CoupleNode como unidad. Por eso los handles top y bottom están acá y los PersonNode internos también los tienen pero solo para los edges de pareja internos.
*/

// ─── Componente ───────────────────────────────────────────────────────────────

type Props = NodeProps<CoupleNodeType>;

function CoupleNode({ data, selected }: Props) {
  const { active, isHighlighted = true } = data;
  const isDimmed = !isHighlighted;


  return (
    <>
      {/* Handle superior — recibe edges de generación anterior */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ visibility: "hidden" }}
      />

      <div
        data-selected={selected}
        data-active={active}
        data-dimmed={isDimmed}
        className={styles.node}
      >
        {/*
          El conector visual entre los dos PersonNodes.
          No es un edge de ReactFlow — es un elemento decorativo
          que simula la línea de pareja dentro del compound.
        */}
        <div
          className={styles.connector}
          data-active={active}
          aria-hidden="true"
        />

        {/*
          Los PersonNodes hijos se renderizan dentro de este contenedor
          automáticamente por ReactFlow gracias al parentId + extent="parent"
          definidos en graphTransform.ts.
          Este div es solo el fondo del compound.
        */}
      </div>

      {/* Handle inferior — emite edges hacia generación siguiente */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ visibility: "hidden" }}
      />
    </>
  );
}

export default memo(CoupleNode);