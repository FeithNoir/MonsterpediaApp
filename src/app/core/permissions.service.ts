import { Injectable } from '@angular/core';
import { Entry, Session } from './models';
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  canCreate(user: Session | null): boolean {
    return !!user?.emailVerified;
  }
  canEditArticle(
    user: Session | null,
    entry: Pick<Entry, 'authorId'>,
  ): boolean {
    return (
      !!user?.emailVerified &&
      (user.role === 'admin' || user.uid === entry.authorId)
    );
  }
  canDelete(user: Session | null): boolean {
    return !!user?.emailVerified && user.role === 'admin';
  }
}
