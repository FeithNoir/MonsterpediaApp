import { InjectionToken } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { environment } from '../../environments/environment';
// Modular SDK calls are not AngularFire wrappers: no implicit injection-context subscriptions.
// Emulators are compile-time opt-in; production cannot be switched with a query parameter.
export function createFirebase() {
  const app = initializeApp(environment.firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  if (environment.useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }
  return { app, auth, db, storage };
}
export const FIREBASE = new InjectionToken<ReturnType<typeof createFirebase>>(
  'Firebase',
  { providedIn: 'root', factory: createFirebase },
);
