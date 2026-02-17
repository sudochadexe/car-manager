'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User, Dealership } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  dealership: Dealership | null;
  loading: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const storedUser = localStorage.getItem('car_manager_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Fetch dealership
        const { data: dealershipData } = await supabase
          .from('dealerships')
          .select('*')
          .eq('id', userData.dealership_id)
          .single();
        
        if (dealershipData) {
          setDealership(dealershipData);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(pin: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('active', true)
        .single();

      if (error || !data) {
        console.error('Login error:', error);
        return false;
      }

      setUser(data);
      localStorage.setItem('car_manager_user', JSON.stringify(data));

      // Fetch dealership
      const { data: dealershipData } = await supabase
        .from('dealerships')
        .select('*')
        .eq('id', data.dealership_id)
        .single();

      if (dealershipData) {
        setDealership(dealershipData);
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function logout() {
    setUser(null);
    setDealership(null);
    localStorage.removeItem('car_manager_user');
  }

  return (
    <AuthContext.Provider value={{ user, dealership, loading, login, logout }}>
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
