import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionKey, setSessionKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We only check for an existing Supabase session.
    // However, if there's a session but NO sessionKey, we must force the user to re-authenticate
    // to derive the key again. The AES key is strictly ephemeral.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        setSessionKey(null); // Clear key on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    sessionKey,
    setSessionKey, // Called during login to store the derived key in memory
    loading,
    logout: async () => {
      await supabase.auth.signOut();
      setSessionKey(null);
    }
  };

  return (
    <SessionContext.Provider value={value}>
      {!loading && children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
