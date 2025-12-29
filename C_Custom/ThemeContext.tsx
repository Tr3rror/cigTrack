import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeColors = { primary: string; bgLight: string; bgDark: string; accent: string };

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  resetTheme: () => void;
  colors: { background: string; text: string; primary: string; accent: string; card: string; filter: string };
  setCustomColor: (key: 'primary' | 'background' | 'accent', color: string) => void;
  saveThemeToSlot: (slotIndex: number) => Promise<void>;
  applySlot: (slotIndex: number) => void;
  slots: (ThemeColors | null)[];
  // New Time Format Types
  timeFormat: '12h' | '24h';
  toggleTimeFormat: () => void;
  isManualMode: boolean;       
  toggleManualMode: () => void; 
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_COLORS: ThemeColors = { primary: '#FF4500', bgLight: '#F8F9FA', bgDark: '#121212', accent: '#6C757D' };

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [customColors, setCustomColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [slots, setSlots] = useState<(ThemeColors | null)[]>([null, null, null]);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [isManualMode, setIsManualMode] = useState(false);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('current_theme');
        if (savedTheme) setCustomColors(JSON.parse(savedTheme));

        const savedSlots = await AsyncStorage.getItem('theme_slots');
        if (savedSlots) setSlots(JSON.parse(savedSlots));

        const savedIsDark = await AsyncStorage.getItem('is_dark_mode');
        setIsDark(savedIsDark !== null ? JSON.parse(savedIsDark) : systemScheme === 'dark');

        const savedFormat = await AsyncStorage.getItem('time_format');
        if (savedFormat) setTimeFormat(savedFormat as '12h' | '24h');

        // Load Manual Mode Preference
        const savedManual = await AsyncStorage.getItem('is_manual_mode');
        if (savedManual !== null) setIsManualMode(JSON.parse(savedManual));

      } catch (e) {
        console.error("Theme Load Error", e);
      }
    };
    loadPersistedData();
  }, [systemScheme]);

  const toggleManualMode = () => {
    setIsManualMode(prev => {
      const newVal = !prev;
      AsyncStorage.setItem('is_manual_mode', JSON.stringify(newVal));
      return newVal;
    });
  };

  const toggleTheme = () => {
    setIsDark(prev => {
        const newVal = !prev;
        AsyncStorage.setItem('is_dark_mode', JSON.stringify(newVal));
        return newVal;
    });
  };

  const toggleTimeFormat = () => {
    setTimeFormat(prev => {
        const newVal = prev === '24h' ? '12h' : '24h';
        AsyncStorage.setItem('time_format', newVal);
        return newVal;
    });
  };

  const resetTheme = () => {
    setCustomColors(DEFAULT_COLORS);
    AsyncStorage.setItem('current_theme', JSON.stringify(DEFAULT_COLORS));
    
    const sysDefault = systemScheme === 'dark';
    setIsDark(sysDefault);
    AsyncStorage.removeItem('is_dark_mode');
  };

  const setCustomColor = (key: 'primary' | 'background' | 'accent', color: string) => {
    setCustomColors(prev => {
      const updated = key === 'background' 
        ? { ...prev, [isDark ? 'bgDark' : 'bgLight']: color } 
        : { ...prev, [key]: color };
      AsyncStorage.setItem('current_theme', JSON.stringify(updated));
      return updated;
    });
  };

  const saveThemeToSlot = async (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...customColors };
    setSlots(newSlots);
    await AsyncStorage.setItem('theme_slots', JSON.stringify(newSlots));
  };

  const applySlot = (index: number) => {
    const selected = slots[index];
    if (selected) {
      setCustomColors(selected);
      AsyncStorage.setItem('current_theme', JSON.stringify(selected));
    }
  };

  const theme: ThemeContextType = {
    isDark, toggleTheme, resetTheme, setCustomColor, saveThemeToSlot, applySlot, slots,
    timeFormat, toggleTimeFormat,
    isManualMode, toggleManualMode, // Fixed formatting here
    colors: {
      background: isDark ? customColors.bgDark : customColors.bgLight,
      text: isDark ? '#FFFFFF' : '#212529',
      primary: customColors.primary,
      accent: customColors.accent,
      card: isDark ? '#1E1E1E' : '#FFFFFF',
      filter: '#D2691E',
    }
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};