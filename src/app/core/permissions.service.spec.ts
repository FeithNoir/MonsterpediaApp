import { describe, it, expect } from 'vitest';
import { PermissionsService } from './permissions.service';
import { Session } from './models';
const user = (role: Session['role'], verified = true): Session => ({
  uid: 'alice',
  displayName: 'Naturalista',
  emailVerified: verified,
  role,
});
describe('permission matrix', () => {
  const p = new PermissionsService();
  it('anonymous and unverified accounts cannot write', () => {
    for (const u of [null, user('visitor', false), user('admin', false)]) {
      expect(p.canCreate(u)).toBe(false);
      expect(p.canEditArticle(u, { authorId: 'alice' })).toBe(false);
      expect(p.canDelete(u)).toBe(false);
    }
  });
  it('normal verified users and editors edit their own only', () => {
    for (const role of ['user', 'editor'] as const) {
      expect(p.canCreate(user(role))).toBe(true);
      expect(p.canEditArticle(user(role), { authorId: 'alice' })).toBe(true);
      expect(p.canEditArticle(user(role), { authorId: 'bob' })).toBe(false);
      expect(p.canDelete(user(role))).toBe(false);
    }
  });
  it('verified admin can edit any entry and delete', () => {
    expect(p.canEditArticle(user('admin'), { authorId: 'bob' })).toBe(true);
    expect(p.canDelete(user('admin'))).toBe(true);
  });
});
