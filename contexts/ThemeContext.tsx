import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

export type AppearanceMode = 'system' | 'light' | 'dark';
type ThemeColors = typeof LIGHT_COLORS;

interface ThemeContextValue {
  appearanceMode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = '@invisiproof_appearance';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setAppearanceModeState(val);
      }
    });
  }, []);

  const setAppearanceMode = (mode: AppearanceMode) => {
    console.log('[ThemeContext] setAppearanceMode:', mode);
    setAppearanceModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  const isDark =
    appearanceMode === 'dark' ||
    (appearanceMode === 'system' && systemScheme === 'dark');
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ appearanceMode, setAppearanceMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
