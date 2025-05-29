import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, User, updateProfile, signOut, onAuthStateChanged, getIdToken, reload } from '@angular/fire/auth';
import { BehaviorSubject, catchError, from, map, Observable, switchMap, throwError } from 'rxjs';
import { IAuthResponse, ILoginCredentials, IRegisterCredentials, IUser } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);

  // Observable del usuario actual
  public currentUser$ = this.currentUserSubject.asObservable();

  // Observable para verificar si el usuario está autenticado
  public isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));

  constructor() {
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUserSubject.next(this.mapFirebaseUser(user));
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  public login(credentials: ILoginCredentials): Observable<IAuthResponse> {
    return from(
      signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      )
    ).pipe(
      map((userCredential) => ({
        success: true,
        message: 'Inicio de sesión exitoso',
        user: this.mapFirebaseUser(userCredential.user),
      })),
      catchError((error) => {
        return throwError(() => ({
          success: false,
          message: this.getErrorMessage(error.code),
          error,
        }));
      })
    );
  }

  /**
   * Registrar nuevo usuario
   */
  public register(credentials: IRegisterCredentials): Observable<IAuthResponse> {
    return from(
      createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      )
    ).pipe(
      switchMap((userCredential) => {
        // Si se proporciona displayName, actualizar el perfil
        if (credentials.displayName) {
          return from(
            updateProfile(userCredential.user, {
              displayName: credentials.displayName,
            })
          ).pipe(map(() => userCredential));
        }
        return from([userCredential]);
      }),
      switchMap((userCredential) => {
        // Enviar email de verificación automáticamente
        return this.sendVerificationEmail().pipe(
          map(() => ({
            success: true,
            message:
              'Usuario registrado exitosamente. Se ha enviado un email de verificación.',
            user: this.mapFirebaseUser(userCredential.user),
          }))
        );
      }),
      catchError((error) => {
        return throwError(() => ({
          success: false,
          message: this.getErrorMessage(error.code),
          error,
        }));
      })
    );
  }

  /**
   * Actualizar el perfil del usuario actual
   */
  public updateUserProfile(data: { displayName?: string; photoURL?: string;}): Observable<IAuthResponse> {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      return throwError(() => ({ success: false, message: 'No hay usuario autenticado', }));
    }

    return from(updateProfile(currentUser, data)).pipe(
      switchMap(() => this.reloadUser()),
            map((user) => ({
        success: true,
        message: 'Perfil actualizado exitosamente',
        user: user ?? undefined,
      })),
      catchError((error) => {
        return throwError(() => ({
          success: false,
          message: this.getErrorMessage(error.code),
          error,
        }));
      })
    );
  }

  /**
   * Enviar email para restablecer contraseña
   */
  public forgotPassword(email: string): Observable<IAuthResponse> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      map(() => ({
        success: true,
        message: 'Se ha enviado un email para restablecer tu contraseña',
      })),
      catchError((error) => {
        return throwError(() => ({
          success: false,
          message: this.getErrorMessage(error.code),
          error,
        }));
      })
    );
  }

  /**
   * Renovar token del usuario actual
   */
  public renewUserToken(forceRefresh: boolean = true): Observable<string> {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }

    return from(getIdToken(currentUser, forceRefresh)).pipe(
      catchError((error) => {
        console.error('Error renovando token:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Enviar email de confirmación/verificación
   */
  public sendConfirmationEmail(): Observable<IAuthResponse> {
    return this.sendVerificationEmail();
  }

  /**
   * Enviar email de verificación al usuario actual
   */
  public sendVerificationEmail(): Observable<IAuthResponse> {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      return throwError(() => ({
        success: false,
        message: 'No hay usuario autenticado',
      }));
    }

    if (currentUser.emailVerified) {
      return from([
        {
          success: true,
          message: 'El email ya está verificado',
        },
      ]);
    }

    return from(sendEmailVerification(currentUser)).pipe(
      map(() => ({
        success: true,
        message: 'Email de verificación enviado exitosamente',
      })),
      catchError((error) => {
        return throwError(() => ({
          success: false,
          message: this.getErrorMessage(error.code),
          error,
        }));
      })
    );
  }

  /**
   * Cerrar sesión
   */
  public logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Recargar información del usuario actual
   */
  public reloadUser(): Observable<IUser | null> {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      return from([null]);
    }

    return from(reload(currentUser)).pipe(
      map(() => {
        const updatedUser = this.mapFirebaseUser(currentUser);
        this.currentUserSubject.next(updatedUser);
        return updatedUser;
      }),
      catchError((error) => {
        console.error('Error recargando usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener el usuario actual
   */
  public getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario actual tiene el email verificado
   */
  public isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user ? user.emailVerified : false;
  }

  /**
   * Obtener token del usuario actual
   */
  public getCurrentUserToken(): Observable<string | null> {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      return from([null]);
    }

    return this.renewUserToken(false);
  }

  /**
   * Mapear usuario de Firebase a nuestro formato
   */
  private mapFirebaseUser(user: User): IUser {
    return {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
    };
  }

  /**
   * Obtener mensaje de error legible
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No se encontró un usuario con este email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'El formato del email es inválido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests':
        'Demasiados intentos fallidos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/user-token-expired':
        'La sesión ha expirado. Inicia sesión nuevamente',
      'auth/requires-recent-login':
        'Esta operación requiere autenticación reciente',
    };

    return errorMessages[errorCode] || 'Ha ocurrido un error inesperado';
  }
}
