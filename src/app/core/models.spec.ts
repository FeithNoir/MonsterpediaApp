import { describe, it, expect } from 'vitest';
import {
  Entry,
  creatureOfDay,
  matchesSearch,
  safeReturnUrl,
  threatLabel,
} from './models';
const items = [
  { id: 'b', name: 'Basilisco' },
  { id: 'a', name: 'Alicanto' },
  { id: 'c', name: 'Cocatriz' },
] as Entry[];
describe('catalog helpers', () => {
  it('searches safely with nulls and malformed tags', () => {
    expect(matchesSearch({ name: 'Basilisco' }, 'BASI')).toBe(true);
    expect(matchesSearch({ tags: null } as unknown as Entry, 'bosque')).toBe(
      false,
    );
    expect(
      matchesSearch({ tags: [null, 'Bosque'] } as unknown as Entry, 'bosque'),
    ).toBe(true);
    expect(matchesSearch({}, 'unknown')).toBe(false);
  });
  it('searches species and description without case sensitivity', () => {
    expect(matchesSearch({ species: 'Reptil' }, 'reptil')).toBe(true);
    expect(matchesSearch({ description: 'Un ave del sur' }, 'AVE')).toBe(true);
  });
  it('has one threat scale', () => {
    expect([0, 2, 3, 5, 6, 7, 8, 10].map(threatLabel)).toEqual([
      'Bajo',
      'Bajo',
      'Medio',
      'Medio',
      'Alto',
      'Alto',
      'Crítico',
      'Crítico',
    ]);
  });
  it('picks the same creature regardless of input order throughout a UTC day', () => {
    expect(creatureOfDay(items, new Date('2026-11-07T00:00:00Z'))?.id).toBe(
      creatureOfDay([...items].reverse(), new Date('2026-11-07T23:59:59Z'))?.id,
    );
    expect(creatureOfDay([])).toBeUndefined();
  });
  it('rejects external and protocol-relative return URLs', () => {
    expect(safeReturnUrl('https://evil.test')).toBe('/profile');
    expect(safeReturnUrl('//evil.test')).toBe('/profile');
    expect(safeReturnUrl('/entry/a')).toBe('/entry/a');
    expect(safeReturnUrl(null)).toBe('/profile');
  });
});

describe('legacy document normalization', () => {
  it('normalizes missing values without carrying author email into the view model', async () => {
    const { normalizeEntry } = await import('./models');
    const normalized = normalizeEntry('old', {
      name: null,
      tags: null,
      commonNames: 7,
      content: 42,
      author: { email: 'private@example.test' },
      images: [null],
    });
    expect(normalized.name).toBe('Sin nombre');
    expect(normalized.tags).toEqual([]);
    expect(normalized.commonNames).toEqual([]);
    expect(normalized.content).toBe('');
    expect(normalized.images).toEqual([]);
    expect(normalized).not.toHaveProperty('author');
  });
});
