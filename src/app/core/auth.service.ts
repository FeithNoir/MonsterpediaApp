import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  reload,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ReplaySubject } from 'rxjs';
import { FIREBASE } from './firebase';
import { Session } from './models';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private fb = inject(FIREBASE);
  readonly session = signal<Session | null>(null);
  readonly ready = signal(false);
  private state = new ReplaySubject<Session | null>(1);
  readonly currentUser$ = this.state.asObservable();
  constructor() {
    const unsub = onAuthStateChanged(this.fb.auth, async (user) => {
      if (!user) {
        this.publish(null);
        return;
      }
      await this.refreshRole();
    });
    inject(DestroyRef).onDestroy(unsub);
  }
  private publish(session: Session | null) {
    this.session.set(session);
    this.ready.set(true);
    this.state.next(session);
  }
  async refreshRole() {
    const user = this.fb.auth.currentUser;
    if (!user) {
      this.publish(null);
      return;
    }
    let role: Session['role'] = user.emailVerified ? 'user' : 'visitor';
    try {
      const [admin, editor] = await Promise.all([
        getDoc(doc(this.fb.db, 'admins', user.uid)),
        getDoc(doc(this.fb.db, 'editors', user.uid)),
      ]);
      if (admin.exists()) role = 'admin';
      else if (editor.exists()) role = 'editor';
    } catch {
      /* Fail closed: missing role access never grants privileges. */
    }
    if (this.fb.auth.currentUser?.uid !== user.uid) return;
    this.publish({
      uid: user.uid,
      displayName:
        user.displayName && !user.displayName.includes('@')
          ? user.displayName.slice(0, 80)
          : 'Naturalista',
      emailVerified: user.emailVerified,
      role,
    });
  }
  async login(email: string, password: string) {
    await signInWithEmailAndPassword(this.fb.auth, email, password);
    await this.refreshRole();
  }
  async register(email: string, password: string, displayName: string) {
    const { user } = await createUserWithEmailAndPassword(
      this.fb.auth,
      email,
      password,
    );
    await updateProfile(user, { displayName });
    await sendEmailVerification(user);
    await this.refreshRole();
  }
  async updateDisplayName(name: string) {
    const displayName = name.trim();
    if (!displayName || displayName.length > 80 || displayName.includes('@'))
      throw new Error('INVALID_NAME');
    if (this.fb.auth.currentUser) {
      await updateProfile(this.fb.auth.currentUser, { displayName });
      await this.refreshRole();
    }
  }
  async reloadUser() {
    if (this.fb.auth.currentUser) {
      await reload(this.fb.auth.currentUser);
      await this.fb.auth.currentUser.getIdToken(true);
    }
    await this.refreshRole();
  }
  async reset(email: string) {
    await resetWithoutEnumeration(() =>
      sendPasswordResetEmail(this.fb.auth, email),
    );
  }
  async verify() {
    if (this.fb.auth.currentUser)
      await sendEmailVerification(this.fb.auth.currentUser);
  }
  async logout() {
    await signOut(this.fb.auth);
  }
}
export function authError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Revisa el correo y la contraseña.',
    'auth/wrong-password': 'Revisa el correo y la contraseña.',
    'auth/user-not-found': 'Revisa el correo y la contraseña.',
    'auth/invalid-email': 'Escribe un correo válido.',
    'auth/email-already-in-use':
      'No se pudo crear la cuenta. Prueba iniciar sesión o recuperar tu contraseña.',
    'auth/weak-password': 'Usa una contraseña de al menos 8 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
    'auth/network-request-failed': 'No hay conexión. Intenta de nuevo.',
  };
  return (
    messages[code || ''] ||
    'No se pudo completar la operación. Intenta de nuevo.'
  );
}

export async function resetWithoutEnumeration(
  send: () => Promise<void>,
): Promise<void> {
  try {
    await send();
  } catch (err: unknown) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err;
  }
}
