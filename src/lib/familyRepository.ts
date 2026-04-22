import type { FamilyData, Person, Relation } from "@/types/family";

const UI = {
  errorData:       "Error al cargar los datos.",
  errorCreate:     "Error al crear la persona.",
  errorUpdate:     "Error al actualizar la persona.",
  errorDelete:     "Error al eliminar la persona.",
  errorAddRel:     "Error al agregar la relación.",
  errorRemoveRel:  "Error al eliminar la relación.",
} as const;

// ─── Contrato ─────────────────────────────────────────────────────────────────
// Cuando llegue el backend REST, creás restRepository implementando
// esta misma interfaz y lo enchufás en activeRepository. Nada más cambia.

export interface FamilyRepository {
  getAll:         () => Promise<FamilyData>;
  createPerson:   (data: Omit<Person, "id">) => Promise<Person>;
  updatePerson:   (id: string, updates: Partial<Person>) => Promise<Person>;
  deletePerson:   (id: string) => Promise<void>;
  addRelation:    (relation: Relation) => Promise<void>;
  removeRelation: (relation: Relation) => Promise<void>;
  uploadAvatar:  (personId: string, firstName: string, lastName: string, file: File) => Promise<string>;
  deleteAvatar:  (personId: string) => Promise<string | null>;
}

// ─── Implementación API local (Next.js routes → JSON en disco) ────────────────

const apiRepository: FamilyRepository = {
  getAll: async () => {
    const res = await fetch("/api/family", { cache: "no-store" });
    if (!res.ok) throw new Error(UI.errorData);
    return res.json();
  },

  createPerson: async (data) => {
    const res = await fetch("/api/family/persons", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error(UI.errorCreate);
    return res.json();
  },

  updatePerson: async (id, updates) => {
    const res = await fetch("/api/family/persons/entity", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error(UI.errorUpdate);
    return res.json();
  },

  deletePerson: async (id) => {
    const res = await fetch("/api/family/persons/entity", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(UI.errorDelete);
  },

  addRelation: async (relation) => {
    const res = await fetch("/api/family/relations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(relation),
    });
    if (!res.ok) throw new Error(UI.errorAddRel);
  },

  removeRelation: async (relation) => {
    const res = await fetch("/api/family/relations", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(relation),
    });
    if (!res.ok) throw new Error(UI.errorRemoveRel);
  },

  uploadAvatar: async (personId, firstName, lastName, file) => {
    const formData = new FormData();
    formData.append("file",      file);
    formData.append("personId",  personId);
    formData.append("firstName", firstName);
    formData.append("lastName",  lastName);

    const res  = await fetch("/api/upload-avatar", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Error al subir el avatar.");
    return json.photoUrl as string;
  },

  deleteAvatar: async (personId) => {
    const res  = await fetch("/api/upload-avatar", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ personId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Error al eliminar el avatar.");
    return json.previousPhotoUrl as string | null;
  },
};



// ─── Implementación REST futura ───────────────────────────────────────────────
// export function createRestRepository(baseUrl: string): FamilyRepository {
//   return {
//     getAll:         () => fetch(`${baseUrl}/family`).then(r => r.json()),
//     createPerson:   (data) => fetch(`${baseUrl}/persons`, { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }).then(r => r.json()),
//     updatePerson:   (id, updates) => fetch(`${baseUrl}/persons/${id}`, { method: "PUT", body: JSON.stringify(updates), headers: { "Content-Type": "application/json" } }).then(r => r.json()),
//     deletePerson:   (id) => fetch(`${baseUrl}/persons/${id}`, { method: "DELETE" }).then(() => {}),
//     addRelation:    (rel) => fetch(`${baseUrl}/relations`, { method: "POST", body: JSON.stringify(rel), headers: { "Content-Type": "application/json" } }).then(() => {}),
//     removeRelation: (rel) => fetch(`${baseUrl}/relations`, { method: "DELETE", body: JSON.stringify(rel), headers: { "Content-Type": "application/json" } }).then(() => {}),
//   };
// }

// ─── Repository activo ────────────────────────────────────────────────────────
// Para cambiar a REST: export const activeRepository = createRestRepository("https://api.tudominio.com");

export const activeRepository: FamilyRepository = apiRepository;