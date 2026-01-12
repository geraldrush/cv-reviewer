import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          // Fetch user tier from database
          const { data } = await supabase
            .from('users')
            .select('tier')
            .eq('id', user.id)
            .single();
          
          setUserTier(data?.tier || 'free');
        }
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase not configured. Please check your environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setUserTier('free');
  };

  const updateUserTier = (tier) => {
    setUserTier(tier);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userTier, 
      loading, 
      signInWithGoogle, 
      signOut,
      updateUserTier 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
