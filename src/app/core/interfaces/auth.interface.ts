import { UserRole } from '../enums/user-role.enum';

export interface IUser {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  role: UserRole;
  isActive: boolean;
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
