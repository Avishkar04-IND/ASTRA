import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { deriveKey, generateSalt } from '../lib/crypto';
import { useSession } from '../context/SessionContext';
import { Shield, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { user, sessionKey, setSessionKey } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If user is logged in AND has their session key derived, send them to dashboard
  if (user && sessionKey) {
    return <Navigate to="/profile" replace />;
  }

  const handleAuth = async (e, isSignup = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let authResponse;
      if (isSignup) {
        authResponse = await supabase.auth.signUp({ email, password });
      } else {
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      }

      if (authResponse.error) throw authResponse.error;

      const userId = authResponse.data.user.id;

      // Now we manage the cryptographic salt
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('key_derivation_salt')
        .eq('id', userId)
        .single();

      let saltBase64;
      if (profileErr && profileErr.code === 'PGRST116') {
        // No profile found, generate a new salt and insert
        saltBase64 = generateSalt();
        
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert([{ id: userId, email: email, key_derivation_salt: saltBase64 }]);
          
        if (insertErr) throw insertErr;
      } else if (profileErr) {
        throw profileErr;
      } else {
        saltBase64 = profileRow.key_derivation_salt;
      }

      // Derive the key in-memory
      const derivedKey = await deriveKey(password, saltBase64);
      
      // Store in React Context ONLY (never localStorage)
      setSessionKey(derivedKey);
      
      navigate('/profile');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          MahaSetu Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Your Zero-Knowledge Citizen Profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          
          {user && !sessionKey && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your session expired or the page was refreshed. Please re-enter your password to decrypt your vault.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Master Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={(e) => handleAuth(e, false)}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
              
              {!user && (
                <button
                  type="button"
                  onClick={(e) => handleAuth(e, true)}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Create Account
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
