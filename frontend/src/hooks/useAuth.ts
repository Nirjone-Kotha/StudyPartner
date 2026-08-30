import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('funstore_token', token);
      localStorage.setItem('funstore_user', JSON.stringify(user));
    }
    set({ user, token, isHydrated: true });
  },
  updateUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('funstore_user', JSON.stringify(user));
    }
    set({ user });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('funstore_token');
      localStorage.removeItem('funstore_user');
    }
    set({ user: null, token: null, isHydrated: true });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('funstore_token');
    const raw = localStorage.getItem('funstore_user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        set({ user, token, isHydrated: true });
        return;
      } catch {
        // ignore
      }
    }
    set({ isHydrated: true });
  },
}));
