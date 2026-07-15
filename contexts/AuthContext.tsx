import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

const GUEST_MODE_KEY = '@proofloop_guest_mode';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  sessionExpired: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const previousUserRef = useRef<User | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    console.log('[AuthContext] fetchProfile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.log('[AuthContext] fetchProfile error:', error.message);
        return;
      }
      console.log('[AuthContext] profile loaded for user:', userId);
      setProfile(data as Profile);
    } catch (err) {
      console.log('[AuthContext] fetchProfile unexpected error');
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log('[AuthContext] initializing session');
      try {
        // Restore guest mode
        const guestVal = await AsyncStorage.getItem(GUEST_MODE_KEY);
        if (guestVal === 'true' && mounted) {
          setIsGuest(true);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          console.log('[AuthContext] session restored for user:', session.user.id);
          setUser(session.user);
          previousUserRef.current = session.user;
          await loadProfile(session.user.id);
        }
      } catch (err) {
        console.log('[AuthContext] init error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[AuthContext] auth state change:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSessionExpired(false);
          previousUserRef.current = session.user;
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          if (previousUserRef.current !== null) {
            // Had a user before — session expired or explicit sign-out
            // sessionExpired is set explicitly in signOut vs here
          }
          setUser(null);
          setProfile(null);
          previousUserRef.current = null;
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        } else if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      console.log('[AuthContext] signUpWithEmail attempt for email:', normalizedEmail);
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) {
        console.log('[AuthContext] signUpWithEmail error:', error.message);
        throw error;
      }
      console.log('[AuthContext] signUpWithEmail success, user:', data.user?.id);
    },
    []
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[AuthContext] signInWithEmail attempt for email:', normalizedEmail);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      console.log('[AuthContext] signInWithEmail error:', error.message);
      throw error;
    }
    console.log('[AuthContext] signInWithEmail success, user:', data.user?.id);
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AuthContext] signOut called');
    setSessionExpired(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('[AuthContext] signOut error:', error.message);
      throw error;
    }
    setUser(null);
    setProfile(null);
    previousUserRef.current = null;
    // Clear guest mode too
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
    console.log('[AuthContext] signOut complete');
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[AuthContext] sendPasswordReset for email:', normalizedEmail);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: 'proofloop://reset-password',
    });
    if (error) {
      console.log('[AuthContext] sendPasswordReset error:', error.message);
      throw error;
    }
    console.log('[AuthContext] sendPasswordReset email sent');
  }, []);

  const enterGuestMode = useCallback(async () => {
    console.log('[AuthContext] enterGuestMode');
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(async () => {
    console.log('[AuthContext] exitGuestMode');
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isGuest,
    sessionExpired,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    sendPasswordReset,
    enterGuestMode,
    exitGuestMode,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
