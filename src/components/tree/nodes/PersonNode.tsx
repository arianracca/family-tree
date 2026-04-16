import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PersonNode as PersonNodeType } from "@/types/graph";

/*
    Los puntos clave:

    memo(): los nodos de ReactFlow se re-renderizan frecuentemente durante pan/zoom. memo garantiza que PersonNode solo se actualice cuando sus props cambien realmente.
    data-* attributes en lugar de clases dinámicas: usar data-alive, data-selected, data-dimmed como atributos CSS permite manejar todos los estados visuales desde CSS puro sin lógica de strings de clases en el JSX.
    Handles ocultos: los Handle de ReactFlow son necesarios para que los edges se conecten correctamente, pero visualmente los ocultamos con visibility: hidden. El diseño no usa conectores visibles en los nodos.
    Estética: fondo casi negro (#0f0f0f), acento dorado (#c9a84c), tipografía serif. Los fallecidos tienen todo en gris. La línea de acento izquierda aparece solo en hover/selección dando un efecto refinado sin ser ruidoso.
    isHighlighted: cuando hay un núcleo activo, los nodos fuera de él reciben data-dimmed='true' y se vuelven casi invisibles con opacity: 0.25 y pointer-events: none.
*/


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nombre: string, apellido: string): string {
  const first = nombre.trim().charAt(0).toUpperCase();
  const last  = apellido.trim().charAt(0).toUpperCase();
  return `${first}${last}`;
}

function formatFullName(
  nombre: string,
  apellidoPaterno: string,
  apellidoMaterno?: string
): string {
  return [nombre, apellidoPaterno, apellidoMaterno]
    .filter(Boolean)
    .join(" ");
}

// ─── Componente ───────────────────────────────────────────────────────────────

type Props = NodeProps<PersonNodeType>;

function PersonNode({ data, selected }: Props) {
  const {
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    vivo,
    isHighlighted = true,
  } = data;

  const initials  = getInitials(nombre, apellidoPaterno);
  const fullName  = formatFullName(nombre, apellidoPaterno, apellidoMaterno);
  const isDimmed  = !isHighlighted;

  return (
    <>
      {/* Handle superior — recibe edges de padres */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ visibility: "hidden" }}
      />

      <div
        data-selected={selected}
        data-alive={vivo}
        data-dimmed={isDimmed}
        className="person-node"
      >
        {/* Avatar con iniciales */}
        <div className="person-node__avatar">
          <span className="person-node__initials">{initials}</span>
          {!vivo && <span className="person-node__deceased-icon">†</span>}
        </div>

        {/* Info */}
        <div className="person-node__info">
          <span className="person-node__name">{fullName}</span>
        </div>
      </div>

      {/* Handle inferior — emite edges hacia hijos */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ visibility: "hidden" }}
      />

      <style>{`
        .person-node {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 180px;
          height: 80px;
          padding: 10px 14px;
          background: #0f0f0f;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          cursor: pointer;
          transition:
            border-color 150ms ease,
            box-shadow   150ms ease,
            opacity      200ms ease;
          box-sizing: border-box;
          font-family: 'Georgia', 'Times New Roman', serif;
          position: relative;
          overflow: hidden;
        }

        /* Línea de acento izquierda */
        .person-node::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #c9a84c;
          opacity: 0;
          transition: opacity 150ms ease;
        }

        .person-node[data-alive='true']::before  { background: #c9a84c; }
        .person-node[data-alive='false']::before { background: #555; }

        /* Estados */
        .person-node:hover,
        .person-node[data-selected='true'] {
          border-color: #c9a84c;
          box-shadow: 0 0 0 1px #c9a84c22, 0 4px 20px #00000088;
        }

        .person-node:hover::before,
        .person-node[data-selected='true']::before {
          opacity: 1;
        }

        .person-node[data-alive='false'] {
          border-color: #1e1e1e;
        }

        .person-node[data-alive='false']:hover,
        .person-node[data-alive='false'][data-selected='true'] {
          border-color: #555;
          box-shadow: 0 0 0 1px #55555522, 0 4px 20px #00000088;
        }

        /* Dimmed — cuando otro núcleo está activo */
        .person-node[data-dimmed='true'] {
          opacity: 0.25;
          pointer-events: none;
        }

        /* Avatar */
        .person-node__avatar {
          position: relative;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .person-node[data-alive='true'] .person-node__avatar {
          border-color: #c9a84c44;
        }

        /* Iniciales */
        .person-node__initials {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #c9a84c;
          line-height: 1;
          font-family: 'Georgia', serif;
        }

        .person-node[data-alive='false'] .person-node__initials {
          color: #555;
        }

        /* Ícono fallecido */
        .person-node__deceased-icon {
          position: absolute;
          bottom: -2px;
          right: -2px;
          font-size: 10px;
          color: #555;
          background: #0f0f0f;
          border-radius: 50%;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        /* Info */
        .person-node__info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .person-node__name {
          font-size: 12px;
          font-weight: 500;
          color: #e8e8e8;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.01em;
        }

        .person-node[data-alive='false'] .person-node__name {
          color: #666;
        }
      `}</style>
    </>
  );
}

export default memo(PersonNode);