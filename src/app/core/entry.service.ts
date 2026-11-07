import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  runTransaction,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FIREBASE } from './firebase';
import { AuthService } from './auth.service';
import { Entry, EntryContent, Revision, normalizeEntry } from './models';
@Injectable({ providedIn: 'root' })
export class EntryService {
  private fb = inject(FIREBASE);
  private auth = inject(AuthService);
  readonly entries = signal<Entry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor() {
    const unsub = onSnapshot(
      collection(this.fb.db, 'entries'),
      (snapshot) => {
        this.entries.set(
          snapshot.docs.map((d) => normalizeEntry(d.id, d.data())),
        );
        this.loading.set(false);
        this.error.set('');
      },
      () => {
        this.error.set(
          'No se pudo abrir el catálogo. Revisa la conexión e intenta de nuevo.',
        );
        this.loading.set(false);
      },
    );
    inject(DestroyRef).onDestroy(unsub);
  }
  watchRevisions(
    id: string,
    next: (items: Revision[]) => void,
    error: () => void,
  ) {
    return onSnapshot(
      query(
        collection(this.fb.db, 'entries', id, 'revisions'),
        orderBy('createdAt', 'desc'),
        limit(5),
      ),
      (snap) =>
        next(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Revision)),
      error,
    );
  }
  newId(): string {
    return doc(collection(this.fb.db, 'entries')).id;
  }
  async create(id: string, content: EntryContent) {
    const user = this.auth.session();
    if (!user?.emailVerified)
      throw new Error('Verifica tu correo antes de publicar.');
    await setDoc(doc(this.fb.db, 'entries', id), {
      ...content,
      authorId: user.uid,
      displayName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
    });
  }
  async update(original: Entry, content: EntryContent) {
    const user = this.auth.session();
    if (!user?.emailVerified)
      throw new Error('Verifica tu correo antes de guardar.');
    await runTransaction(this.fb.db, async (tx) => {
      const target = doc(this.fb.db, 'entries', original.id);
      const current = await tx.get(target);
      const old = current.data();
      if (
        !old ||
        old['version'] !== original.version ||
        !old['updatedAt']?.isEqual(original.updatedAt)
      )
        throw new Error('CONFLICT');
      tx.set(doc(target, 'revisions', String(original.version)), {
        snapshot: old,
        editorId: user.uid,
        createdAt: serverTimestamp(),
      });
      // Content is explicitly whitelisted by the editor; identity and creation date are never copied from its form.
      tx.update(target, {
        ...content,
        updatedAt: serverTimestamp(),
        version: original.version + 1,
      });
    });
  }
  async delete(id: string) {
    await deleteDoc(doc(this.fb.db, 'entries', id));
  }
  async upload(file: File, id: string): Promise<string> {
    const user = this.auth.session();
    if (!user?.emailVerified)
      throw new Error('Verifica tu correo para adjuntar imágenes.');
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
        file.type,
      ) ||
      file.size > 5 * 1024 * 1024
    )
      throw new Error('Usa JPG, PNG, WebP o GIF de máximo 5 MB.');
    const target = ref(
      this.fb.storage,
      `users/${user.uid}/entries/${id}/${crypto.randomUUID()}`,
    );
    await uploadBytes(target, file, { contentType: file.type });
    return getDownloadURL(target);
  }
}
