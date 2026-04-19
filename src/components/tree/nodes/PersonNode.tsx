import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PersonNode as PersonNodeType } from "@/types/graph";
import styles from "./PersonNode.module.css";


/*
    Los puntos clave:

    memo(): los nodos de ReactFlow se re-renderizan frecuentemente durante pan/zoom. memo garantiza que PersonNode solo se actualice cuando sus props cambien realmente.
    data-* attributes en lugar de clases dinámicas: usar data-alive, data-selected, data-dimmed como atributos CSS permite manejar todos los estados visuales desde CSS puro sin lógica de strings de clases en el JSX.
    Handles ocultos: los Handle de ReactFlow son necesarios para que los edges se conecten correctamente, pero visualmente los ocultamos con visibility: hidden. El diseño no usa conectores visibles en los nodos.
    Estética: fondo casi negro (#0f0f0f), acento dorado (#c9a84c), tipografía serif. Los fallecidos tienen todo en gris. La línea de acento izquierda aparece solo en hover/selección dando un efecto refinado sin ser ruidoso.
    isHighlighted: cuando hay un núcleo activo, los nodos fuera de él reciben data-dimmed='true' y se vuelven casi invisibles con opacity: 0.25 y pointer-events: none.
*/


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
  return firstName.trim().charAt(0).toUpperCase() + lastName.trim().charAt(0).toUpperCase();
}

function formatFullName(firstName: string, middleName?: string | null, lastName?: string, motherLastName?: string | null): string {
  return [firstName, middleName, lastName, motherLastName].filter(Boolean).join(" ");
}

// ─── Componente ───────────────────────────────────────────────────────────────

type Props = NodeProps<PersonNodeType>;

function PersonNode({ data, selected }: Props) {
  const {
    firstName,
    middleName,
    lastName,
    motherLastName,
    isAlive,
    isHighlighted = true,
  } = data;

  const initials  = getInitials(firstName, lastName);
  const fullName  = formatFullName(firstName, middleName, lastName, motherLastName);
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
        data-alive={isAlive}
        data-dimmed={isDimmed}
        className={styles.node}
      >
        {/* Avatar con iniciales o foto */}
      <div className={styles.avatar}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={firstName} className={styles.photo} />
          ) : (
            <span className={styles.initials}>{initials}</span>
          )}
          {!isAlive && <span className={styles.deceasedIcon}>†</span>}
      </div>

        {/* Info */}
        <div className={styles.info}>
          <span className={styles.name}>{fullName}</span>
        </div>
      </div>

      {/* Handle inferior — emite edges hacia hijos */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ visibility: "hidden" }}
      />
    </>
  );
}

export default memo(PersonNode);