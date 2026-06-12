/** Primer nombre para saludos (ej. "Carlos López" → "Carlos"). */
export function getFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function normalizeUserName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 48);
}

export function getPersonalGreeting(userName: string): string {
  const first = getFirstName(userName);
  return first ? `Hola, ${first}` : "";
}
