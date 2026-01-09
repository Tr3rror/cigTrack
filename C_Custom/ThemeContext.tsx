import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeColors = { primary: string; bgLight: string; bgDark: string; accent: string };

type StatsPrefs = {
  show7dTotal: boolean;
  show7dAvg: boolean;
  showMonthTotal: boolean;
  showMonthAvg: boolean;
};

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  resetTheme: () => void;
  colors: { background: string; text: string; primary: string; accent: string; card: string; filter: string };
  setCustomColor: (key: 'primary' | 'background' | 'accent', color: string) => void;
  saveThemeToSlot: (slotIndex: number) => Promise<void>;
  applySlot: (slotIndex: number) => void;
  slots: (ThemeColors | null)[];
  activeSlot: number | null;
  timeFormat: '12h' | '24h';
  toggleTimeFormat: () => void;
  isManualMode: boolean;
  toggleManualMode: () => void;
  
  // Stats Logic
  statsPrefs: StatsPrefs;
  toggleStat: (key: keyof StatsPrefs) => void;

  // New Features
  commentsEnabled: boolean;
  toggleComments: () => void;
  longCigsEnabled: boolean;
  toggleLongCigs: () => void;
  showPeriod: boolean;
  toggleShowPeriod: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_COLORS: ThemeColors = { primary: '#FF4500', bgLight: '#F8F9FA', bgDark: '#121212', accent: '#6C757D' };
const DEFAULT_STATS: StatsPrefs = { show7dTotal: false, show7dAvg: false, showMonthTotal: false, showMonthAvg: false };

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();

  // Initialize new states
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [longCigsEnabled, setLongCigsEnabled] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);

  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [customColors, setCustomColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [slots, setSlots] = useState<(ThemeColors | null)[]>([null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [isManualMode, setIsManualMode] = useState(false);
  const [statsPrefs, setStatsPrefs] = useState<StatsPrefs>(DEFAULT_STATS);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('current_theme');
        if (savedTheme) setCustomColors(JSON.parse(savedTheme));

        const savedSlots = await AsyncStorage.getItem('theme_slots');
        if (savedSlots) setSlots(JSON.parse(savedSlots));

        const savedActiveSlot = await AsyncStorage.getItem('active_slot_index');
        if (savedActiveSlot !== null) setActiveSlot(parseInt(savedActiveSlot, 10));

        const savedIsDark = await AsyncStorage.getItem('is_dark_mode');
        setIsDark(savedIsDark !== null ? JSON.parse(savedIsDark) : systemScheme === 'dark');

        const savedFormat = await AsyncStorage.getItem('time_format');
        if (savedFormat) setTimeFormat(savedFormat as '12h' | '24h');

        const savedManual = await AsyncStorage.getItem('is_manual_mode');
        if (savedManual !== null) setIsManualMode(JSON.parse(savedManual));

        const savedStats = await AsyncStorage.getItem('stats_prefs');
        if (savedStats) setStatsPrefs(JSON.parse(savedStats));

        // --- LOAD NEW FEATURES ---
        const savedComments = await AsyncStorage.getItem('prefs_comments');
        if (savedComments !== null) setCommentsEnabled(JSON.parse(savedComments));

        const savedLongCigs = await AsyncStorage.getItem('prefs_longcigs');
        if (savedLongCigs !== null) setLongCigsEnabled(JSON.parse(savedLongCigs));

        const savedPeriod = await AsyncStorage.getItem('prefs_period');
        if (savedPeriod !== null) setShowPeriod(JSON.parse(savedPeriod));

      } catch (e) {
        console.error("Theme Load Error", e);
      }
    };
    loadPersistedData();
  }, [systemScheme]);

  // --- TOGGLE FUNCTIONS WITH PERSISTENCE ---

  const toggleComments = () => {
    setCommentsEnabled(prev => {
      const newVal = !prev;
      AsyncStorage.setItem('prefs_comments', JSON.stringify(newVal));
      return newVal;
    });
  };

  const toggleLongCigs = () => {
    setLongCigsEnabled(prev => {
      const newVal = !prev;
      AsyncStorage.setItem('prefs_longcigs', JSON.stringify(newVal));
      return newVal;
    });
  };

  const toggleShowPeriod = () => {
    setShowPeriod(prev => {
      const newVal = !prev;
      AsyncStorage.setItem('prefs_period', JSON.stringify(newVal));
      return newVal;
    });
  };

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

  const toggleStat = (key: keyof StatsPrefs) => {
    setStatsPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem('stats_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  const resetTheme = () => {
    setCustomColors(DEFAULT_COLORS);
    setActiveSlot(null);
    AsyncStorage.setItem('current_theme', JSON.stringify(DEFAULT_COLORS));
    AsyncStorage.removeItem('active_slot_index');

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
    setActiveSlot(null);
    AsyncStorage.removeItem('active_slot_index');
  };

  const saveThemeToSlot = async (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...customColors };
    setSlots(newSlots);
    await AsyncStorage.setItem('theme_slots', JSON.stringify(newSlots));
    setActiveSlot(index);
    await AsyncStorage.setItem('active_slot_index', index.toString());
  };

  const applySlot = (index: number) => {
    const selected = slots[index];
    if (selected) {
      setCustomColors(selected);
      setActiveSlot(index);
      AsyncStorage.setItem('current_theme', JSON.stringify(selected));
      AsyncStorage.setItem('active_slot_index', index.toString());
    }
  };

  const theme: ThemeContextType = {
    isDark, toggleTheme, resetTheme, setCustomColor, saveThemeToSlot, applySlot, slots, activeSlot,
    timeFormat, toggleTimeFormat,
    isManualMode, toggleManualMode,
    statsPrefs, toggleStat, 
    colors: {
      background: isDark ? customColors.bgDark : customColors.bgLight,
      text: isDark ? '#FFFFFF' : '#212529',
      primary: customColors.primary,
      accent: customColors.accent,
      card: isDark ? '#1E1E1E' : '#FFFFFF',
      filter: '#D2691E',
    },
    // Export new features
    commentsEnabled, toggleComments,
    longCigsEnabled, toggleLongCigs,
    showPeriod, toggleShowPeriod
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};