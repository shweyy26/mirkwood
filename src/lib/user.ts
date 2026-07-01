/**
 * There are no accounts yet - every row is stamped with this fixed id so the
 * schema is already shaped for multi-user support. When real auth is added,
 * replace this with the signed-in user's id (e.g. from a session/cookie).
 */
export const DEFAULT_USER_ID = "local-user";

export function getCurrentUserId(): string {
  return DEFAULT_USER_ID;
}
