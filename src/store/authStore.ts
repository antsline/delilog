import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/database';

interface AuthState {
  // 認証状態
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  // アクション
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  signOut: () => set({ 
    user: null, 
    session: null, 
    profile: null, 
    loading: false,
    error: null 
  }),
}));