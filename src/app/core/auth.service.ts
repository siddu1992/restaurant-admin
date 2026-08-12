import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import {
  AuthResponse,
  AuthUser,
  GoogleLoginRequest,
  LoginRequest,
  OwnerSignupRequest,
} from '../models';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.login(credentials).pipe(
      tap((response) => this.persistSession(response)),
    );
  }

  googleLogin(payload: GoogleLoginRequest): Observable<AuthResponse> {
    return this.api.googleLogin(payload).pipe(
      tap((response) => this.persistSession(response)),
    );
  }

  signupOwner(payload: OwnerSignupRequest): Observable<{ message: string }> {
    return this.api.restaurantOwnerSignup(payload);
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('restaurant');
    localStorage.removeItem('userProfile');
    this.userSubject.next(null);
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  handleUnauthorized(): void {
    this.logout(true);
  }

  private persistSession(response: AuthResponse): void {
    if (!response.token) {
      throw new Error('Authentication token missing from server response');
    }
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    // Keep legacy key used by older pages until they are migrated
    localStorage.setItem('userProfile', JSON.stringify(response.user));
    this.userSubject.next(response.user);
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('userProfile');
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
