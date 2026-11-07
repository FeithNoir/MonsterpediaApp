import { Timestamp } from 'firebase/firestore';
export type Role = 'visitor' | 'user' | 'editor' | 'admin';
export interface Session {
  uid: string;
  displayName: string;
  emailVerified: boolean;
  role: Role;
}
export interface Entry {
  id: string;
  name: string;
  description: string;
  species: string;
  alignment: string;
  longevity: string;
  content: string;
  commonNames: string[];
  clasification: string[];
  tags: string[];
  images: string[];
  threatLevel: number;
  authorId: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}
export type EntryContent = Pick<
  Entry,
  | 'name'
  | 'description'
  | 'species'
  | 'alignment'
  | 'longevity'
  | 'content'
  | 'commonNames'
  | 'clasification'
  | 'tags'
  | 'images'
  | 'threatLevel'
>;
export interface Revision {
  id: string;
  snapshot: Omit<Entry, 'id'>;
  editorId: string;
  createdAt: Timestamp;
}
export const THREAT_MAX = 10;
export function threatLabel(value: number): string {
  return value >= 8
    ? 'Crítico'
    : value >= 6
      ? 'Alto'
      : value >= 3
        ? 'Medio'
        : 'Bajo';
}
export function matchesSearch(entry: Partial<Entry>, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('es');
  return [
    entry.name,
    entry.description,
    entry.species,
    ...(Array.isArray(entry.tags) ? entry.tags : []),
  ].some(
    (value) =>
      typeof value === 'string' && value.toLocaleLowerCase('es').includes(q),
  );
}
export function creatureOfDay(
  entries: Entry[],
  date = new Date(),
): Entry | undefined {
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id, 'en'));
  let hash = 0;
  for (const char of date.toISOString().slice(0, 10))
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return sorted[hash % sorted.length];
}
export function safeReturnUrl(url: string | null): string {
  return url?.startsWith('/') &&
    !url.startsWith('//') &&
    !url.startsWith('/auth')
    ? url
    : '/profile';
}

export function normalizeEntry(
  id: string,
  raw: Record<string, unknown>,
): Entry {
  const text = (key: string, fallback = '') =>
    typeof raw[key] === 'string' ? (raw[key] as string) : fallback;
  const strings = (key: string) =>
    Array.isArray(raw[key])
      ? (raw[key] as unknown[]).filter(
          (v): v is string => typeof v === 'string',
        )
      : [];
  const time = (key: string) =>
    raw[key] instanceof Timestamp
      ? (raw[key] as Timestamp)
      : Timestamp.fromMillis(0);
  return {
    id,
    name: text('name', 'Sin nombre'),
    description: text('description'),
    species: text('species', 'Sin clasificar'),
    alignment: text('alignment', 'Desconocido'),
    longevity: text('longevity', 'Desconocida'),
    content: text('content'),
    commonNames: strings('commonNames'),
    clasification: strings('clasification'),
    tags: strings('tags'),
    images: strings('images'),
    threatLevel:
      typeof raw['threatLevel'] === 'number' &&
      Number.isFinite(raw['threatLevel'])
        ? Math.max(0, Math.min(10, raw['threatLevel']))
        : 0,
    authorId: text('authorId'),
    displayName: text('displayName', 'Archivo Monsterpedia'),
    createdAt: time('createdAt'),
    updatedAt: time('updatedAt'),
    version:
      typeof raw['version'] === 'number' && Number.isInteger(raw['version'])
        ? raw['version']
        : 0,
  };
}
