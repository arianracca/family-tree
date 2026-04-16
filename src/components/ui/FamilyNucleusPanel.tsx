"use client";

import { useCallback } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import { useFamilyStore } from "@/store/useFamilyStore";
import type { FamilyNucleus } from "@/types/family";

/*
    Los puntos clave:

    PersonRow como botón navegable: cada persona en el panel es clickeable. Al hacer click llama a selectPerson + centerOnNode simultáneamente, actualizando la selección y moviendo el viewport del canvas hacia ese nodo. Permite navegar el árbol desde el panel sin tocar el canvas.
    partnerId derivado del nucleus: en lugar de pasar el partner como prop separado, se deriva del coupleIds filtrando el personId actual. Esto mantiene el panel agnóstico al orden en que ELK guardó los IDs.
    Animación panel-in: el panel entra desde la derecha con translateX(16px) → 0 y opacity 0 → 1. Es sutil pero da sensación de respuesta inmediata al click.
    Divisor con gradiente: la línea entre header y body usa un gradiente transparent → dorado → transparent que refuerza la paleta sin ser agresivo.
    Secciones vacías omitidas: si una persona no tiene pareja, padres o hijos, esa sección directamente no se renderiza. Más limpio que mostrar secciones vacías.
*/


// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

interface PersonRowProps {
  personId: string;
  role: "parent" | "child" | "partner";
}

// ─── Subcomponente: fila de persona ───────────────────────────────────────────

function PersonRow({ personId, role }: PersonRowProps) {
  const person = useFamilyStore((s) =>
    s.familyData.persons.find((p) => p.id === personId)
  );
  const selectPerson = useFamilyStore((s) => s.selectPerson);
  const centerOnNode = useTreeStore((s) => s.centerOnNode);

  if (!person) return null;

  const fullName = [person.nombre, person.apellidoPaterno, person.apellidoMaterno]
    .filter(Boolean)
    .join(" ");

  const initials =
    person.nombre.charAt(0).toUpperCase() +
    person.apellidoPaterno.charAt(0).toUpperCase();

  function handleClick() {
    selectPerson(person!.id);
    centerOnNode(person!.id);
  }

  return (
    <button
      className="person-row"
      data-role={role}
      data-alive={person.vivo}
      onClick={handleClick}
      type="button"
    >
      <span className="person-row__avatar">
        <span className="person-row__initials">{initials}</span>
        {!person.vivo && (
          <span className="person-row__deceased" aria-label="Fallecido">†</span>
        )}
      </span>

      <span className="person-row__info">
        <span className="person-row__name">{fullName}</span>
        <span className="person-row__role">{roleLabel[role]}</span>
      </span>

      <span className="person-row__arrow" aria-hidden="true">→</span>
    </button>
  );
}

const roleLabel: Record<PersonRowProps["role"], string> = {
  parent:  "Padre / Madre",
  child:   "Hijo / Hija",
  partner: "Pareja",
};

// ─── Subcomponente: sección ───────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="nucleus-section">
      <h3 className="nucleus-section__title">{title}</h3>
      <div className="nucleus-section__content">{children}</div>
    </section>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  nucleus: FamilyNucleus;
}

export default function FamilyNucleusPanel({ nucleus }: Props) {
  const { personId, coupleIds, parentIds, childrenIds } = nucleus;

  const clearSelection = useFamilyStore((s) => s.clearSelection);
  const clearHighlight = useTreeStore((s) => s.clearHighlight);

  const person = useFamilyStore((s) =>
    s.familyData.persons.find((p) => p.id === personId)
  );

  const handleClose = useCallback(() => {
    clearSelection();
    clearHighlight();
  }, [clearSelection, clearHighlight]);

  if (!person) return null;

  const fullName = [person.nombre, person.apellidoPaterno, person.apellidoMaterno]
    .filter(Boolean)
    .join(" ");

  // El partner es el otro miembro de la pareja (distinto a personId)
  const partnerId = coupleIds?.find((id) => id !== personId) ?? null;

  return (
    <aside className="nucleus-panel">
      {/* Header */}
      <div className="nucleus-panel__header">
        <div className="nucleus-panel__title-group">
          <span className="nucleus-panel__label">Núcleo familiar</span>
          <h2 className="nucleus-panel__name">{fullName}</h2>
        </div>
        <button
          className="nucleus-panel__close"
          onClick={handleClose}
          type="button"
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      {/* Divisor */}
      <div className="nucleus-panel__divider" />

      {/* Contenido */}
      <div className="nucleus-panel__body">

        {/* Pareja */}
        {partnerId && (
          <Section title="Pareja">
            <PersonRow personId={partnerId} role="partner" />
          </Section>
        )}

        {/* Padres */}
        {parentIds.length > 0 && (
          <Section title="Padres">
            {parentIds.map((id) => (
              <PersonRow key={id} personId={id} role="parent" />
            ))}
          </Section>
        )}

        {/* Hijos */}
        {childrenIds.length > 0 && (
          <Section title="Hijos">
            {childrenIds.map((id) => (
              <PersonRow key={id} personId={id} role="child" />
            ))}
          </Section>
        )}

        {/* Sin relaciones */}
        {!partnerId && parentIds.length === 0 && childrenIds.length === 0 && (
          <p className="nucleus-panel__empty">
            Sin relaciones registradas.
          </p>
        )}
      </div>

      <style>{panelStyles}</style>
    </aside>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const panelStyles = `
  .nucleus-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 300px;
    background: #0d0d0d;
    border-left: 1px solid #1a1a1a;
    display: flex;
    flex-direction: column;
    z-index: 10;
    animation: panel-in 250ms cubic-bezier(0.4, 0, 0.2, 1) both;
    font-family: 'Georgia', serif;
  }

  @keyframes panel-in {
    from {
      opacity: 0;
      transform: translateX(16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Header */
  .nucleus-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 20px 20px;
    gap: 12px;
    flex-shrink: 0;
  }

  .nucleus-panel__title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .nucleus-panel__label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9a84c;
    font-family: 'Georgia', serif;
  }

  .nucleus-panel__name {
    font-size: 18px;
    font-weight: 400;
    color: #e8e8e8;
    line-height: 1.3;
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nucleus-panel__close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    background: none;
    border: 1px solid #222;
    border-radius: 4px;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 150ms ease, color 150ms ease;
    margin-top: 2px;
  }

  .nucleus-panel__close:hover {
    border-color: #444;
    color: #e8e8e8;
  }

  /* Divisor */
  .nucleus-panel__divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      #c9a84c44 30%,
      #c9a84c44 70%,
      transparent
    );
    flex-shrink: 0;
    margin: 0 20px;
  }

  /* Body */
  .nucleus-panel__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    scrollbar-width: thin;
    scrollbar-color: #222 transparent;
  }

  .nucleus-panel__empty {
    font-size: 12px;
    color: #444;
    letter-spacing: 0.03em;
    text-align: center;
    padding: 24px 0;
  }

  /* Sección */
  .nucleus-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nucleus-section__title {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #444;
    font-weight: 400;
    padding-bottom: 6px;
    border-bottom: 1px solid #161616;
  }

  .nucleus-section__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* PersonRow */
  .person-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: none;
    border: 1px solid transparent;
    border-radius: 5px;
    cursor: pointer;
    transition:
      background  150ms ease,
      border-color 150ms ease;
    text-align: left;
  }

  .person-row:hover {
    background: #111;
    border-color: #1e1e1e;
  }

  .person-row[data-role='partner']:hover {
    border-color: #c9a84c22;
  }

  /* Avatar */
  .person-row__avatar {
    position: relative;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #141414;
    border: 1px solid #222;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .person-row[data-role='partner'] .person-row__avatar {
    border-color: #c9a84c33;
  }

  .person-row__initials {
    font-size: 11px;
    font-weight: 600;
    color: #c9a84c;
    letter-spacing: 0.04em;
  }

  .person-row[data-alive='false'] .person-row__initials {
    color: #444;
  }

  .person-row__deceased {
    position: absolute;
    bottom: -2px;
    right: -2px;
    font-size: 9px;
    color: #444;
    background: #0d0d0d;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  /* Info */
  .person-row__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .person-row__name {
    font-size: 12px;
    color: #d0d0d0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.01em;
  }

  .person-row[data-alive='false'] .person-row__name {
    color: #555;
  }

  .person-row__role {
    font-size: 10px;
    color: #383838;
    letter-spacing: 0.04em;
  }

  /* Flecha */
  .person-row__arrow {
    flex-shrink: 0;
    font-size: 11px;
    color: #2a2a2a;
    transition: color 150ms ease, transform 150ms ease;
  }

  .person-row:hover .person-row__arrow {
    color: #c9a84c88;
    transform: translateX(2px);
  }
`;