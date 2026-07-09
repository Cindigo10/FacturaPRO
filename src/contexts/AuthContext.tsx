import { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';

// Mock user for development - bypasses login
const mockUser: User = {
  id: '26aadc63-f3ba-4254-b43f-7c4369d6d7c0',
  email: 'kaitlynperez1905@gmail.com',
  fullName: 'Kaitlyn Perez',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: () => {} }}>
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
