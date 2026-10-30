'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LoginPage } from './LoginPage';

interface AuthGateProps {
  children: (props: {
    user: User;
    session: Session | null;
    signOut: () => Promise<void>;
  }) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session verification and real-time auth listener
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        // 1. Fetch current authenticated user
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // 2. Fetch current session if user exists
        if (currentUser) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (isMounted) {
            setUser(currentUser);
            setSession(currentSession);
          }
        } else if (isMounted) {
          setUser(null);
          setSession(null);
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
        if (isMounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // 3. Subscribe to real-time auth state changes
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    try {
      if (isSupabaseConfigured()) {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return;

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
              setSession(newSession);
              setUser(newSession?.user ?? null);
              setIsLoading(false);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setSession(null);
              setIsLoading(false);
            }
          }
        );
        authListener = data;
      }
    } catch (err) {
      console.warn('Auth state listener notice:', err);
    }

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setUser(null);
      setSession(null);
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      {/* 1. Loading State: Branded skeleton / spinner to prevent login flash */}
      {isLoading && (
        <motion.div
          key="auth-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] p-6 selection:bg-indigo-100"
        >
          {/* Ambient background glow */}
          <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 text-white font-black animate-pulse">
              <Layers className="w-7 h-7 text-white" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="font-extrabold text-[18px] text-[#0F1535] tracking-tight">
                  BrandMesh
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[13px] text-[#4A5173] font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Verifying secure enterprise session...</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Logged Out State: Split-screen Login Page */}
      {!isLoading && !user && (
        <motion.div
          key="auth-logged-out"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-h-screen"
        >
          <LoginPage />
        </motion.div>
      )}

      {/* 3. Logged In State: Authenticated Workspace & Dashboard */}
      {!isLoading && user && (
        <motion.div
          key="auth-logged-in"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-h-screen"
        >
          {children({ user, session, signOut: handleSignOut })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
