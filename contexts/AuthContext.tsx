import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { AppState } from 'react-native';
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
  recoveryMode: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ requiresConfirmation: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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
  const [recoveryMode, setRecoveryMode] = useState(false);
  const previousUserRef = useRef<User | null>(null);
  const isExplicitSignOutRef = useRef(false);

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

    const handleAppStateChange = (nextState: string) => {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[AuthContext] auth state change:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSessionExpired(false);
          previousUserRef.current = session.user;
          await loadProfile(session.user.id);
        } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
          setUser(session.user);
          setRecoveryMode(true);
          previousUserRef.current = session.user;
        } else if (event === 'SIGNED_OUT') {
          if (!isExplicitSignOutRef.current && previousUserRef.current !== null) {
            setSessionExpired(true);
          }
          setUser(null);
          setProfile(null);
          setRecoveryMode(false);
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
      appStateSub.remove();
    };
  }, [loadProfile]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string): Promise<{ requiresConfirmation: boolean }> => {
      const normalizedEmail = email.trim().toLowerCase();
      console.log('[AuthContext] signUpWithEmail attempt');
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
      const requiresConfirmation = !data.session;
      console.log('[AuthContext] signUpWithEmail success, requiresConfirmation:', requiresConfirmation);
      return { requiresConfirmation };
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
    // Clear guest mode on successful sign in
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
    console.log('[AuthContext] signInWithEmail success, user:', data.user?.id);
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AuthContext] signOut called');
    isExplicitSignOutRef.current = true;
    setSessionExpired(false);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('[AuthContext] signOut error:', error.message);
        isExplicitSignOutRef.current = false;
        throw error;
      }
    } finally {
      isExplicitSignOutRef.current = false;
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
    console.log('[AuthContext] sendPasswordReset initiated');
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: 'proofloop://reset-password',
    });
    if (error) {
      console.log('[AuthContext] sendPasswordReset error:', error.message);
      throw error;
    }
    console.log('[AuthContext] sendPasswordReset email sent');
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    console.log('[AuthContext] updatePassword called');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.log('[AuthContext] updatePassword error:', error.message);
      throw error;
    }
    setRecoveryMode(false);
    console.log('[AuthContext] updatePassword success');
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
    recoveryMode,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    sendPasswordReset,
    updatePassword,
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
