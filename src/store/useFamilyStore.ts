import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { FamilyData, Person, Relation } from "@/types/family";

/*
    Los puntos clave:

    immer middleware: permite mutar el estado directamente dentro de los setters sin romper la inmutabilidad. Hace el código mucho más limpio, especialmente en removePerson donde hay que limpiar relaciones en cascada.
    Selección mutuamente excluyente: selectPerson limpia selectedCoupleId y viceversa. Así el panel lateral siempre sabe exactamente qué está mostrando.
    removePerson en cascada: cuando eliminás una persona, automáticamente limpia todas sus relaciones parent-child y couple asociadas. Evita datos huérfanos.
    Selectores fuera del store: selectPersonById, selectPersonsByGeneration y selectGenerations son factory functions que devolvés a useStore(selector). Esto evita que el componente se re-renderice ante cualquier cambio del store que no le compete.
*/

// ─── Datos iniciales ──────────────────────────────────────────────────────────

const INITIAL_DATA: FamilyData = {
  persons: [
    {
      id: "p1",
      nombre: "Helder",
      apellidoPaterno: "Racca",
      apellidoMaterno: "",
      fechaNacimiento: null,
      fechaFallecimiento: null,
      nacionalidades: [],
      ciudad: null,
      vivo: true,
      generation: 100000,
    },
    {
      id: "p2",
      nombre: "Nilde",
      apellidoPaterno: "Cambiaso",
      apellidoMaterno: "",
      fechaNacimiento: null,
      fechaFallecimiento: null,
      nacionalidades: [],
      ciudad: null,
      vivo: true,
      generation: 100000,
    },
    {
      id: "p3",
      nombre: "Malena",
      apellidoPaterno: "Racca",
      apellidoMaterno: "",
      vivo: true,
      generation: 100001,
    },
    {
      id: "p4",
      nombre: "Arian",
      apellidoPaterno: "Racca",
      apellidoMaterno: "",
      vivo: true,
      generation: 100001,
    },
    {
      id: "p5",
      nombre: "Arlene",
      apellidoPaterno: "Racca",
      apellidoMaterno: "",
      vivo: true,
      generation: 100001,
    },
    {
      id: "p6",
      nombre: "Jose Pablo",
      apellidoPaterno: "Cambiaso",
      apellidoMaterno: "",
      vivo: false,
      generation: 99999,
    },
    {
      id: "p7",
      nombre: "Edith Gladys",
      apellidoPaterno: "Soverchia",
      apellidoMaterno: "",
      vivo: false,
      generation: 99999,
    },
    {
      id: "p8",
      nombre: "Francisco",
      apellidoPaterno: "Racca",
      apellidoMaterno: "",
      vivo: false,
      generation: 99999,
    },
    {
      id: "p9",
      nombre: "Cladi",
      apellidoPaterno: "Tentella",
      apellidoMaterno: "",
      vivo: false,
      generation: 99999,
    },
    {
      id: "p10",
      nombre: "Armando",
      apellidoPaterno: "Tentella",
      apellidoMaterno: "",
      vivo: false,
      generation: 99998,
    },
    {
      id: "p11",
      nombre: "Rosa",
      apellidoPaterno: "Domizi",
      apellidoMaterno: "",
      vivo: false,
      generation: 99998,
    },
  ],
  relations: [
    { type: "parent-child", from: "p1", to: "p3" },
    { type: "parent-child", from: "p2", to: "p3" },
    { type: "parent-child", from: "p1", to: "p4" },
    { type: "parent-child", from: "p2", to: "p4" },
    { type: "parent-child", from: "p1", to: "p5" },
    { type: "parent-child", from: "p2", to: "p5" },
    { type: "parent-child", from: "p6", to: "p2" },
    { type: "parent-child", from: "p7", to: "p2" },
    { type: "parent-child", from: "p8", to: "p1" },
    { type: "parent-child", from: "p9", to: "p1" },
    { type: "parent-child", from: "p10", to: "p9" },
    { type: "parent-child", from: "p11", to: "p9" },
    { type: "couple", persons: ["p1", "p2"], active: true },
    { type: "couple", persons: ["p6", "p7"], active: false },
    { type: "couple", persons: ["p8", "p9"], active: false },
    { type: "couple", persons: ["p10", "p11"], active: false },
  ],
};

// ─── State shape ──────────────────────────────────────────────────────────────

interface FamilyState {
  // Datos
  familyData: FamilyData;

  // Selección activa
  selectedPersonId: string | null;
  selectedCoupleId: string | null;

  // Acciones — datos
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;
  addRelation: (relation: Relation) => void;
  removeRelation: (relation: Relation) => void;

  // Acciones — selección
  selectPerson: (personId: string | null) => void;
  selectCouple: (coupleId: string | null) => void;
  clearSelection: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFamilyStore = create<FamilyState>()(
  immer((set) => ({
    // ── Estado inicial ──────────────────────────────────────────────────────

    familyData: INITIAL_DATA,
    selectedPersonId: null,
    selectedCoupleId: null,

    // ── Acciones de datos ───────────────────────────────────────────────────

    addPerson: (person) =>
      set((state) => {
        state.familyData.persons.push(person);
      }),

    updatePerson: (id, updates) =>
      set((state) => {
        const index = state.familyData.persons.findIndex((p) => p.id === id);
        if (index === -1) return;
        state.familyData.persons[index] = {
          ...state.familyData.persons[index],
          ...updates,
        };
      }),

    removePerson: (id) =>
      set((state) => {
        // Eliminar persona
        state.familyData.persons = state.familyData.persons.filter(
          (p) => p.id !== id
        );
        // Eliminar todas las relaciones que la involucren
        state.familyData.relations = state.familyData.relations.filter((r) => {
          if (r.type === "parent-child") {
            return r.from !== id && r.to !== id;
          }
          if (r.type === "couple") {
            return !r.persons.includes(id);
          }
          return true;
        });
      }),

    addRelation: (relation) =>
      set((state) => {
        state.familyData.relations.push(relation);
      }),

    removeRelation: (relation) =>
      set((state) => {
        state.familyData.relations = state.familyData.relations.filter((r) => {
          if (r.type !== relation.type) return true;

          if (r.type === "parent-child" && relation.type === "parent-child") {
            return !(r.from === relation.from && r.to === relation.to);
          }
          if (r.type === "couple" && relation.type === "couple") {
            return !(
              r.persons[0] === relation.persons[0] &&
              r.persons[1] === relation.persons[1]
            );
          }
          return true;
        });
      }),

    // ── Acciones de selección ───────────────────────────────────────────────

    selectPerson: (personId) =>
      set((state) => {
        state.selectedPersonId = personId;
        state.selectedCoupleId = null; // mutuamente excluyentes
      }),

    selectCouple: (coupleId) =>
      set((state) => {
        state.selectedCoupleId = coupleId;
        state.selectedPersonId = null;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedPersonId = null;
        state.selectedCoupleId = null;
      }),
  }))
);

// ─── Selectores derivados ─────────────────────────────────────────────────────
//
// Se definen fuera del store para evitar re-renders innecesarios.
// Se usan con useShallow de Zustand cuando retornan objetos.

export function selectPersonById(id: string) {
  return (state: FamilyState): Person | undefined =>
    state.familyData.persons.find((p) => p.id === id);
}

export function selectPersonsByGeneration(generation: number) {
  return (state: FamilyState): Person[] =>
    state.familyData.persons.filter((p) => p.generation === generation);
}

export function selectGenerations() {
  return (state: FamilyState): number[] =>
    [...new Set(state.familyData.persons.map((p) => p.generation))].sort(
      (a, b) => a - b
    );
}