import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { activeRepository } from "@/lib/familyRepository";
import type { FamilyData, Person, Relation } from "@/types/family";

const UI = {
  errorData: "Error al cargar los datos.",
} as const;

interface FamilyState {
  familyData: FamilyData;
  isLoading: boolean;
  error: string | null;
  selectedPersonId: string | null;
  selectedCoupleId: string | null;

  // ── Carga de datos ──────────────────────────────────────────────────────────
  loadFamilyData: () => Promise<void>;

  // ── Acciones de datos ───────────────────────────────────────────────────────
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;
  addRelation: (relation: Relation) => void;
  removeRelation: (relation: Relation) => void;

  // ── Acciones de selección ───────────────────────────────────────────────────
  selectPerson: (personId: string | null) => void;
  selectCouple: (coupleId: string | null) => void;
  clearSelection: () => void;
}

const EMPTY_FAMILY_DATA: FamilyData = { persons: [], relations: [] };

export const useFamilyStore = create<FamilyState>()(
  immer((set) => ({
    // ── Estado inicial vacío — se puebla via loadFamilyData ──────────────────
    familyData: EMPTY_FAMILY_DATA,
    isLoading: false,
    error: null,
    selectedPersonId: null,
    selectedCoupleId: null,

    // ── Carga desde el provider ───────────────────────────────────────────────
    loadFamilyData: async () => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const data = await activeRepository.getAll();
        set((state) => { state.familyData = data; state.isLoading = false; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : UI.errorData;
          state.isLoading = false;
        });
      }
    },

    // ── Acciones de datos (sin cambios) ───────────────────────────────────────
    addPerson: (person) =>
      set((state) => { state.familyData.persons.push(person); }),

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
        state.familyData.persons = state.familyData.persons.filter((p) => p.id !== id);
        state.familyData.relations = state.familyData.relations.filter((r) => {
          if (r.type === "parent-child") return r.from !== id && r.to !== id;
          if (r.type === "couple") return !r.persons.includes(id);
          return true;
        });
      }),

    addRelation: (relation) =>
      set((state) => { state.familyData.relations.push(relation); }),

    removeRelation: (relation) =>
      set((state) => {
        state.familyData.relations = state.familyData.relations.filter((r) => {
          if (r.type !== relation.type) return true;
          if (r.type === "parent-child" && relation.type === "parent-child") {
            return !(r.from === relation.from && r.to === relation.to);
          }
          if (r.type === "couple" && relation.type === "couple") {
            return !(r.persons[0] === relation.persons[0] && r.persons[1] === relation.persons[1]);
          }
          return true;
        });
      }),

    // ── Selección (sin cambios) ───────────────────────────────────────────────
    selectPerson: (personId) =>
      set((state) => {
        state.selectedPersonId = personId;
        state.selectedCoupleId = null;
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

// ── Selectores (sin cambios) ──────────────────────────────────────────────────

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
    [...new Set(state.familyData.persons.map((p) => p.generation))].sort((a, b) => a - b);
}