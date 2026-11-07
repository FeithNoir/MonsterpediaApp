import { describe, it, expect } from 'vitest';
import { resetWithoutEnumeration } from './auth.service';
describe('password reset privacy', () => {
  it('does not reveal whether a reset address is registered', async () => {
    await expect(
      resetWithoutEnumeration(async () => {
        throw { code: 'auth/user-not-found' };
      }),
    ).resolves.toBeUndefined();
    await expect(
      resetWithoutEnumeration(async () => {}),
    ).resolves.toBeUndefined();
  });
  it('still surfaces operational failures', async () => {
    await expect(
      resetWithoutEnumeration(async () => {
        throw { code: 'auth/network-request-failed' };
      }),
    ).rejects.toEqual({ code: 'auth/network-request-failed' });
  });
});
