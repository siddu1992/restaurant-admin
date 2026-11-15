export type UserRole =
  | 'customer'
  | 'admin'
  | 'superadmin'
  | 'restaurant_owner'
  | 'delivery';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  role: UserRole;
  isPhoneVerified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OwnerSignupRequest {
  ownerName: string;
  email: string;
  password: string;
  phone: string;
}

export interface GoogleLoginRequest {
  email: string;
  name: string;
  picture: string;
  googleId: string;
  accessToken?: string;
  idToken?: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
  restaurant?: {
    id: string;
    name: string;
    address?: string;
    cuisine?: string;
  };
}
