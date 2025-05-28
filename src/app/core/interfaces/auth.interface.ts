export interface IUser {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterCredentials extends ILoginCredentials {
  displayName?: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  user?: IUser;
  error?: any;
}
