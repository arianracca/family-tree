import type { FamilyData } from "@/types/family";
import { FAMILY_DATA } from "../../data/familyData";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. INTERFAZ DEL PROVIDER
// Defines el contrato que cualquier fuente de datos debe cumplir.
// Hoy: JSON local. Mañana: REST API, Supabase, GraphQL, etc.
// ─────────────────────────────────────────────────────────────────────────────

export interface DataProvider {
  getFamilyData: () => Promise<FamilyData>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. IMPLEMENTACIÓN LOCAL (JSON estático)
// Cuando quieras enchufar un backend, creás una nueva implementación
// de DataProvider y la pasás a createDataProvider() sin tocar nada más.
// ─────────────────────────────────────────────────────────────────────────────

const localProvider: DataProvider = {
  getFamilyData: async () => {
    // Simula latencia de red para que el loading state sea visible en dev
    // Remové esto en producción o cuando tengas un backend real
    if (process.env.NODE_ENV === "development") {
      await new Promise((r) => setTimeout(r, 300));
    }
    return FAMILY_DATA;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3. PROVIDER ACTIVO
// Cambiá localProvider por tu implementación de backend acá.
// ─────────────────────────────────────────────────────────────────────────────

export const dataProvider: DataProvider = localProvider;

// ─────────────────────────────────────────────────────────────────────────────
// § 4. EJEMPLO — cómo sería un REST provider cuando lo necesites
// ─────────────────────────────────────────────────────────────────────────────

// export const restProvider: DataProvider = {
//   getFamilyData: async () => {
//     const res = await fetch("/api/family");
//     if (!res.ok) throw new Error("Failed to fetch family data");
//     return res.json();
//   },
// };