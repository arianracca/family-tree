import type { FamilyData, Person, Relation } from "@/types/family";

// ─── Contrato — lo que cualquier implementación debe cumplir ──────────────────
// Hoy: memoria (store Zustand como fuente de verdad en runtime)
// Mañana: REST, Supabase, GraphQL — solo cambiás la implementación activa

export interface FamilyRepository {
  // Lectura
  getAll:         () => Promise<FamilyData>;

  // Personas
  createPerson:   (data: Omit<Person, "id">) => Promise<Person>;
  updatePerson:   (id: string, updates: Partial<Person>) => Promise<Person>;
  deletePerson:   (id: string) => Promise<void>;

  // Relaciones
  addRelation:    (relation: Relation) => Promise<void>;
  removeRelation: (relation: Relation) => Promise<void>;
}

// ─── Implementación local — opera sobre el store en memoria ───────────────────
// El store de Zustand es la persistencia en runtime.
// familyData.ts es solo el seed inicial (se carga una vez al arrancar).

export function createLocalRepository(
  getState: () => { familyData: FamilyData },
  actions: {
    addPerson:      (p: Person) => void;
    updatePerson:   (id: string, updates: Partial<Person>) => void;
    removePerson:   (id: string) => void;
    addRelation:    (r: Relation) => void;
    removeRelation: (r: Relation) => void;
  }
): FamilyRepository {
  return {
    getAll: async () => {
      if (process.env.NODE_ENV === "development") {
        await new Promise((r) => setTimeout(r, 300));
      }
      return getState().familyData;
    },

    createPerson: async (data) => {
      const id = `p${Date.now()}`;
      const person: Person = { id, ...data };
      actions.addPerson(person);
      return person;
    },

    updatePerson: async (id, updates) => {
      actions.updatePerson(id, updates);
      const updated = getState().familyData.persons.find((p) => p.id === id);
      if (!updated) throw new Error(`Person ${id} not found`);
      return updated;
    },

    deletePerson: async (id) => {
      actions.removePerson(id);
    },

    addRelation: async (relation) => {
      actions.addRelation(relation);
    },

    removeRelation: async (relation) => {
      actions.removeRelation(relation);
    },
  };
}

// ─── Implementación REST — para cuando tengas backend ────────────────────────
// export function createRestRepository(baseUrl: string): FamilyRepository {
//   return {
//     getAll: async () => {
//       const res = await fetch(`${baseUrl}/family`);
//       if (!res.ok) throw new Error("Failed to fetch");
//       return res.json();
//     },
//     createPerson: async (data) => {
//       const res = await fetch(`${baseUrl}/persons`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });
//       return res.json();
//     },
//     // ... resto de métodos
//   };
// }