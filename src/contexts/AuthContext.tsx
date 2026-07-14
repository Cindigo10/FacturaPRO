import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseConfigError, isSupabaseReady, supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(supabaseUser: SupabaseUser, profile: any | null): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    fullName: profile?.full_name || supabaseUser.user_metadata?.full_name || '',
    role: profile?.role || 'consulta',
    createdAt: profile?.created_at || new Date().toISOString(),
    updatedAt: profile?.updated_at || new Date().toISOString(),
  };
}

async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseReady()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(mapUser(session.user, profile));
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(mapUser(session.user, profile));
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const configError = getSupabaseConfigError();
    if (configError) {
      return { error: { message: configError } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.session?.user) {
      const profile = await loadProfile(data.session.user.id);
      setUser(mapUser(data.session.user, profile));
    }

    return { error: error ? { message: error.message } : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
