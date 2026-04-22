import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { activeRepository } from "@/lib/familyRepository";
import type { FamilyData, Person, Relation } from "@/types/family";
import type { FamilyCommand } from "@/commands/FamilyCommand";

const UI = {
  errorData: "Error al cargar los datos.",
} as const;

// ─── Tamaño máximo de la pila de undo ────────────────────────────────────────
const MAX_UNDO_STACK = 50;

interface FamilyState {
  familyData: FamilyData;
  isLoading: boolean;
  error: string | null;
  selectedPersonId: string | null;
  selectedCoupleId: string | null;

  // ── Command Pattern ─────────────────────────────────────────────────────────
  undoStack: FamilyCommand[];
  canUndo: boolean;

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

  // ── Command Pattern — acciones ──────────────────────────────────────────────
  executeCommand: (command: FamilyCommand) => Promise<void>;
  undo: () => Promise<void>;
}

const EMPTY_FAMILY_DATA: FamilyData = { persons: [], relations: [] };

export const useFamilyStore = create<FamilyState>()(
  immer((set, get) => ({
    // ── Estado inicial vacío — se puebla via loadFamilyData ──────────────────
    familyData: EMPTY_FAMILY_DATA,
    isLoading: false,
    error: null,
    selectedPersonId: null,
    selectedCoupleId: null,

    // ── Command Pattern — estado inicial ──────────────────────────────────────
    undoStack: [],
    canUndo: false,

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

    // ── executeCommand ────────────────────────────────────────────────────────
    // 1. Ejecuta el comando (llama FamilyService → repositorio → API)
    // 2. Actualiza familyData optimistamente sin recargar todo
    // 3. Sincroniza con el servidor para garantizar consistencia
    // 4. Empuja el comando a la pila de undo (máximo MAX_UNDO_STACK)
    //
    // Si execute() falla, el error se propaga al hook — nunca se pushea
    // a la pila un comando que no se ejecutó correctamente.

    executeCommand: async (command: FamilyCommand) => {
      const result = await command.execute();

      // ── Actualización optimista del store ──────────────────────────────────
      set((state) => {
        if (result.operation === "create") {
          state.familyData.persons.push(result.person);
        }

        if (result.operation === "update") {
          const idx = state.familyData.persons.findIndex(
            (p) => p.id === result.person.id
          );
          if (idx !== -1) state.familyData.persons[idx] = result.person;
        }

        if (result.operation === "delete") {
          state.familyData.persons = state.familyData.persons.filter(
            (p) => p.id !== result.personId
          );
          state.familyData.relations = state.familyData.relations.filter((r) => {
            if (r.type === "parent-child")
              return r.from !== result.personId && r.to !== result.personId;
            if (r.type === "couple")
              return !r.persons.includes(result.personId);
            return true;
          });
        }

        // Pila: mantiene los últimos MAX_UNDO_STACK comandos
        const newStack = [...state.undoStack, command].slice(-MAX_UNDO_STACK);
        state.undoStack = newStack;
        state.canUndo = true;
      });

      // ── Sincronización con el servidor ────────────────────────────────────
      // Garantiza que el store refleja el estado real del backend,
      // incluyendo IDs generados por el servidor y relaciones en cascada.
      await get().loadFamilyData();
    },

    // ── undo ──────────────────────────────────────────────────────────────────
    // Extrae el último comando y lo revierte.
    // Recarga desde el servidor para garantizar consistencia total.
    // Si undo() falla, limpia la pila entera para evitar estados corruptos.

    undo: async () => {
      const { undoStack } = get();
      if (undoStack.length === 0) return;

      const command = undoStack[undoStack.length - 1];

      try {
        await command.undo();
        await get().loadFamilyData();

        set((state) => {
          state.undoStack = state.undoStack.slice(0, -1);
          state.canUndo = state.undoStack.length > 0;
        });
      } catch (err) {
        // Pila limpia para evitar estados inconsistentes
        set((state) => {
          state.undoStack = [];
          state.canUndo = false;
        });
        throw err;
      }
    },

    // ── Acciones de datos directas (usadas internamente o por tests) ──────────
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

    // ── Selección ─────────────────────────────────────────────────────────────
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

// ── Selectores ────────────────────────────────────────────────────────────────

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