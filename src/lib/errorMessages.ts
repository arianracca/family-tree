import type { RelationshipType } from "@/lib/generationUtils";

export type ErrorCode =
  | "ERR_FIRST_NAME_REQUIRED"
  | "ERR_LAST_NAME_REQUIRED"
  | "ERR_GENERATION_REQUIRED"
  | "ERR_SELF_COUPLE"
  | "ERR_SELF_PARENT"
  | "ERR_SELF_CHILD"
  | "ERR_INVALID_REFERENCES"
  | "ERR_FETCH_DATA"
  | "ERR_CREATE_PERSON"
  | "ERR_UPDATE_PERSON"
  | "ERR_DELETE_PERSON"
  | "ERR_ADD_RELATION"
  | "ERR_REMOVE_RELATION"
  | "ERR_UPLOAD_AVATAR"
  | "ERR_DELETE_AVATAR";

export function resolveError(
  err: unknown,
  t: (key: string) => string
): string {
  const code = err instanceof Error ? err.message : "";
  try {
    return t(code);
  } catch {
    return t("fallback");
  }
}