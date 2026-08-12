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
import {
  identifyUser,
  resetAnalyticsUser,
  trackAccountCreated,
  trackSignedIn,
} from '@/services/analytics';

const GUEST_MODE_KEY = '@proofloop_guest_mode';
const PROFILE_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
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
  updateProfile: (displayName: string) => Promise<void>;
  clearProfileError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const previousUserRef = useRef<User | null>(null);
  const isExplicitSignOutRef = useRef(false);
  const lastProfileFetchRef = useRef<number>(0);

  const loadProfile = useCallback(async (userId: string) => {
    console.log('[AuthContext] loadProfile called');
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows returned — profile missing, attempt repair
        if (error.code === 'PGRST116') {
          console.log('[AuthContext] profile missing, creating...');
          const { data: userData } = await supabase.auth.getUser();
          const insertPayload = {
            id: userId,
            display_name: (userData?.user?.user_metadata?.display_name as string | undefined) ?? null,
            email: (userData?.user?.email) ?? null,
          };
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(insertPayload);
          if (insertError) {
            console.log('[AuthContext] profile repair insert failed');
            setProfileError('Could not load your profile. Please try again.');
            return;
          }
          // Re-fetch after insert
          const { data: repaired, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (refetchError || !repaired) {
            console.log('[AuthContext] profile repair re-fetch failed');
            setProfileError('Could not load your profile. Please try again.');
            return;
          }
          setProfile(repaired as Profile);
          setProfileError(null);
          lastProfileFetchRef.current = Date.now();
          return;
        }
        console.log('[AuthContext] loadProfile error');
        setProfileError('Could not load your profile. Please check your connection.');
        return;
      }

      setProfile(data as Profile);
      setProfileError(null);
      lastProfileFetchRef.current = Date.now();
    } catch {
      console.log('[AuthContext] loadProfile unexpected error');
      setProfileError('Something went wrong loading your profile.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    console.log('[AuthContext] fetchProfile called');
    await loadProfile(user.id);
  }, [user, loadProfile]);

  const updateProfile = useCallback(async (displayName: string) => {
    if (!user) return;
    const trimmed = displayName.trim();
    console.log('[AuthContext] updateProfile called');
    setProfileLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) {
        console.log('[AuthContext] updateProfile error');
        throw new Error('Could not save your profile. Please try again.');
      }
      // Re-fetch to get the latest data
      await loadProfile(user.id);
      console.log('[AuthContext] updateProfile success');
    } catch (err) {
      setProfileLoading(false);
      throw err;
    }
  }, [user, loadProfile]);

  const clearProfileError = useCallback(() => {
    setProfileError(null);
  }, []);

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
          console.log('[AuthContext] session restored');
          setUser(session.user);
          previousUserRef.current = session.user;
          await loadProfile(session.user.id);
        }
      } catch {
        console.log('[AuthContext] init error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const handleAppStateChange = (nextState: string) => {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh();
        // Foreground refresh: re-fetch profile if stale (> 5 min)
        const currentUser = previousUserRef.current;
        if (currentUser) {
          const elapsed = Date.now() - lastProfileFetchRef.current;
          if (elapsed > PROFILE_REFRESH_INTERVAL_MS) {
            console.log('[AuthContext] foreground refresh: profile stale, re-fetching');
            loadProfile(currentUser.id);
          }
        }
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
          identifyUser(session.user.id);
          await loadProfile(session.user.id);
        } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
          setUser(session.user);
          setRecoveryMode(true);
          previousUserRef.current = session.user;
        } else if (event === 'SIGNED_OUT') {
          if (!isExplicitSignOutRef.current && previousUserRef.current !== null) {
            setSessionExpired(true);
          }
          resetAnalyticsUser();
          setUser(null);
          setProfile(null);
          setProfileError(null);
          setRecoveryMode(false);
          previousUserRef.current = null;
          lastProfileFetchRef.current = 0;
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
      trackAccountCreated();
      return { requiresConfirmation };
    },
    []
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[AuthContext] signInWithEmail attempt');
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
    console.log('[AuthContext] signInWithEmail success');
    trackSignedIn();
    void data;
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
    setProfileError(null);
    previousUserRef.current = null;
    lastProfileFetchRef.current = 0;
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
    profileLoading,
    profileError,
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
    updateProfile,
    clearProfileError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
