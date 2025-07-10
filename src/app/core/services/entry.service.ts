import { Injectable, inject } from '@angular/core';
import { collection, collectionData, deleteDoc, doc, docData, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { IEntry } from '../interfaces/entry.interface';

@Injectable({
  providedIn: 'root',
})
export class EntryService {
  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'entries');
  private entries: IEntry[] = [];

  constructor() {
    this.getEntries().subscribe(entries => {
      this.entries = entries;
    });
  }

  /**
   * Crear una nueva entrada
   */
  createEntry(entry: IEntry): Promise<void> {
    const newDocRef = doc(this.collectionRef, entry.id);
    return setDoc(newDocRef, entry as any);
  }

  /**
   * Obtener todas las entradas
   */
  getEntries(): Observable<IEntry[]> {
    return collectionData(this.collectionRef, { idField: 'id', }) as Observable<IEntry[]>;
  }

  /**
   * Obtener una entrada específica por ID
   */
  getEntryById(id: string): Observable<IEntry> {
    const entryDoc = doc(this.firestore, `entries/${id}`);
    return docData(entryDoc, { idField: 'id' }) as Observable<IEntry>;
  }

  /**
   * Actualizar una entrada existente
   */
  updateEntry(entry: IEntry): Promise<void> {
    const entryDoc = doc(this.firestore, `entries/${entry.id}`);
    return updateDoc(entryDoc, { ...entry }) as Promise<void>;
  }

  /**
   * Eliminar una entrada por ID
   */
  deleteEntry(id: string): Promise<void> {
    const entryDoc = doc(this.firestore, `entries/${id}`);
    return deleteDoc(entryDoc);
  }

  /**
   * Obtener una entrada aleatoria
   */
  getRandomEntry(): IEntry | undefined {
    if (this.entries.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.entries.length);
      return this.entries[randomIndex];
    }
    return undefined;
  }
}
