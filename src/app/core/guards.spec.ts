import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ReplaySubject, Observable, firstValueFrom } from 'rxjs';
import { beforeEach, describe, it, expect } from 'vitest';
import { AuthService } from './auth.service';
import { authGuard, roleGuard } from './guards';
import { Session } from './models';
describe('restored auth guards', () => {
  let state: ReplaySubject<Session | null>;
  const restored: Session = {
    uid: 'alice',
    displayName: 'A',
    emailVerified: true,
    role: 'user',
  };
  beforeEach(() => {
    state = new ReplaySubject(1);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { currentUser$: state.asObservable() },
        },
      ],
    });
  });
  const invoke = (guard = authGuard) =>
    TestBed.runInInjectionContext(() =>
      guard(
        {} as ActivatedRouteSnapshot,
        { url: '/entry/a' } as RouterStateSnapshot,
      ),
    ) as Observable<boolean | UrlTree>;
  it('does not redirect before Firebase has restored its first real state', async () => {
    let emitted = false;
    const result = firstValueFrom(invoke()).then((value) => {
      emitted = true;
      return value;
    });
    await Promise.resolve();
    expect(emitted).toBe(false);
    state.next(restored);
    expect(await result).toBe(true);
  });
  it('redirects signed out sessions with their return URL', async () => {
    state.next(null);
    const tree = await firstValueFrom(invoke());
    expect(TestBed.inject(Router).serializeUrl(tree as UrlTree)).toBe(
      '/auth?returnUrl=%2Fentry%2Fa',
    );
  });
  it('allows verified roles and completes after one state', async () => {
    for (const role of ['user', 'editor', 'admin'] as const) {
      state.next({ ...restored, role });
      expect(await firstValueFrom(invoke(roleGuard))).toBe(true);
    }
  });
  it('sends unverified visitors to the verification explanation', async () => {
    state.next({ ...restored, emailVerified: false, role: 'visitor' });
    expect(
      TestBed.inject(Router).serializeUrl(
        (await firstValueFrom(invoke(roleGuard))) as UrlTree,
      ),
    ).toBe('/profile?verify=1');
  });
});
