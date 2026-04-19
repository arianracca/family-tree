import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CoupleNode as CoupleNodeType } from "@/types/graph";

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
        className="couple-node"
      >
        {/*
          El conector visual entre los dos PersonNodes.
          No es un edge de ReactFlow — es un elemento decorativo
          que simula la línea de pareja dentro del compound.
        */}
        <div
          className="couple-node__connector"
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

      <style>{`
        .couple-node {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          border: 1px solid #1e1e1e;
          background: #0a0a0a;
          transition:
            border-color 150ms ease,
            box-shadow   150ms ease,
            opacity      200ms ease;
          box-sizing: border-box;
        }

        /* Activa: borde sutil dorado */
        .couple-node[data-active='true'] {
          border-color: #c9a84c22;
        }

        /* Inactiva: borde gris muy tenue */
        .couple-node[data-active='false'] {
          border-color: #1a1a1a;
        }

        /* Seleccionado */
        .couple-node[data-selected='true'] {
          border-color: #c9a84c44;
          box-shadow: 0 0 0 1px #c9a84c11, 0 8px 32px #00000099;
        }

        /* Dimmed */
        .couple-node[data-dimmed='true'] {
          opacity: 0.2;
          pointer-events: none;
        }

        /* Conector decorativo entre los dos PersonNodes */
        .couple-node__connector {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 1px;
          z-index: 1;
          pointer-events: none;
        }

        /* Pareja activa: línea sólida dorada */
        .couple-node__connector[data-active='true'] {
          background: #c9a84c88;
        }

        /* Pareja inactiva: línea punteada gris */
        .couple-node__connector[data-active='false'] {
          background: none;
          border-top: 1px dashed #444;
        }

        /* Esquinas decorativas — marca los bordes del compound */
        .couple-node::before,
        .couple-node::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          pointer-events: none;
          transition: opacity 150ms ease;
          opacity: 0;
        }

        .couple-node::before {
          top: -1px;
          left: -1px;
          border-top: 1px solid #c9a84c;
          border-left: 1px solid #c9a84c;
          border-radius: 2px 0 0 0;
        }

        .couple-node::after {
          bottom: -1px;
          right: -1px;
          border-bottom: 1px solid #c9a84c;
          border-right: 1px solid #c9a84c;
          border-radius: 0 0 2px 0;
        }

        .couple-node[data-active='true']:hover::before,
        .couple-node[data-active='true']:hover::after,
        .couple-node[data-active='true'][data-selected='true']::before,
        .couple-node[data-active='true'][data-selected='true']::after {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

export default memo(CoupleNode);