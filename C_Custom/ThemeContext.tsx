import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n'; // Path to your i18n file

type ThemeColors = { 
  primary: string; 
  bgLight: string; 
  bgDark: string; 
  accent: string;
  cardLight: string;
  cardDark: string;
  textLight: string;
  textDark: string;
};

export type StatsPrefs = {
  show7dTotal: boolean; show7dAvg: boolean;
  showMonthTotal: boolean; showMonthAvg: boolean; showPeriod: boolean;
};

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  resetTheme: () => void;
  colors: {
    [x: string]: string; background: string; text: string; primary: string; accent: string; card: string; border: string 
};
  setCustomColor: (key: keyof ThemeColors, color: string) => void;
  saveThemeToSlot: (slotIndex: number) => Promise<void>;
  applySlot: (slotIndex: number) => void;
  slots: (ThemeColors | null)[];
  activeSlot: number | null;
  timeFormat: '12h' | '24h';
  toggleTimeFormat: () => void;
  isManualMode: boolean;
  toggleManualMode: () => void;
  statsPrefs: StatsPrefs;
  toggleStat: (key: keyof StatsPrefs) => void;
  commentsEnabled: boolean;
  toggleComments: () => void;
  longCigsEnabled: boolean;
  toggleLongCigs: () => void;
  language: string;
  changeLanguage: (lng: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_COLORS: ThemeColors = { 
  primary: '#FF5733', 
  bgLight: '#FDFDFD', 
  bgDark: '#12141C',  
  accent: '#7A869A', 
  cardLight: '#FFFFFF', 
  cardDark: '#1C1F26', 
  textLight: '#1A1A1A', 
  textDark: '#E4E6EB'
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [customColors, setCustomColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [slots, setSlots] = useState<(ThemeColors | null)[]>([null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [isManualMode, setIsManualMode] = useState(false);
  const [statsPrefs, setStatsPrefs] = useState<StatsPrefs>({ show7dTotal: false, show7dAvg: false, showMonthTotal: false, showMonthAvg: false, showPeriod: false });
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [longCigsEnabled, setLongCigsEnabled] = useState(false);
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const res = await AsyncStorage.multiGet([
          'current_theme', 'theme_slots', 'active_slot_index', 'is_dark_mode', 
          'time_format', 'is_manual_mode', 'stats_prefs', 'prefs_comments', 'prefs_longcigs', 'app_lang'
        ]);
        
        const data: any = Object.fromEntries(res);
        if (data.current_theme) setCustomColors(JSON.parse(data.current_theme));
        if (data.theme_slots) setSlots(JSON.parse(data.theme_slots));
        if (data.active_slot_index) setActiveSlot(parseInt(data.active_slot_index));
        if (data.is_dark_mode) setIsDark(JSON.parse(data.is_dark_mode));
        if (data.time_format) setTimeFormat(data.time_format);
        if (data.is_manual_mode) setIsManualMode(JSON.parse(data.is_manual_mode));
        if (data.stats_prefs) setStatsPrefs(JSON.parse(data.stats_prefs));
        if (data.prefs_comments) setCommentsEnabled(JSON.parse(data.prefs_comments));
        if (data.prefs_longcigs) setLongCigsEnabled(JSON.parse(data.prefs_longcigs));
        if (data.app_lang) {
          setLanguage(data.app_lang);
          i18n.changeLanguage(data.app_lang);
        }
      } catch (e) { console.error(e); }
    };
    loadPersistedData();
  }, []);

  const changeLanguage = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
    AsyncStorage.setItem('app_lang', lng);
  };

  const setCustomColor = (key: keyof ThemeColors, color: string) => {
    setCustomColors(prev => {
      const updated = { ...prev, [key]: color };
      AsyncStorage.setItem('current_theme', JSON.stringify(updated));
      return updated;
    });
    setActiveSlot(null);
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const newVal = !prev;
      AsyncStorage.setItem('is_dark_mode', JSON.stringify(newVal));
      return newVal;
    });
  };

  const theme: ThemeContextType = {
    isDark, 
    toggleTheme,
    colors: {
      background: isDark ? customColors.bgDark : customColors.bgLight,
      text: isDark ? customColors.textDark : customColors.textLight,
      primary: customColors.primary,
      accent: customColors.accent,
      card: isDark ? customColors.cardDark : customColors.cardLight,
      border: isDark ? '#333333' : '#E0E0E0',
    },
    resetTheme: () => {
      setCustomColors(DEFAULT_COLORS);
      setIsDark(systemScheme === 'dark');
      AsyncStorage.removeItem('current_theme');
      // You might also want to reset other prefs here if desired
    },
    setCustomColor,
    saveThemeToSlot: async (index) => {
      const newSlots = [...slots]; newSlots[index] = { ...customColors };
      setSlots(newSlots);
      await AsyncStorage.setItem('theme_slots', JSON.stringify(newSlots));
      setActiveSlot(index);
      await AsyncStorage.setItem('active_slot_index', index.toString());
    },
    applySlot: (index) => {
      if (slots[index]) {
        setCustomColors(slots[index]!);
        setActiveSlot(index);
        AsyncStorage.setItem('active_slot_index', index.toString());
      }
    },
    slots, 
    activeSlot, 
    
    // --- FIXED TOGGLES BELOW ---
    
    timeFormat, 
    toggleTimeFormat: () => setTimeFormat(prev => {
        const newVal = prev === '24h' ? '12h' : '24h';
        AsyncStorage.setItem('time_format', newVal);
        return newVal;
    }),

    isManualMode, 
    toggleManualMode: () => setIsManualMode(prev => {
        const newVal = !prev;
        AsyncStorage.setItem('is_manual_mode', JSON.stringify(newVal));
        return newVal;
    }),

    statsPrefs,
    toggleStat: (key) => setStatsPrefs(prev => {
        const newVal = { ...prev, [key]: !prev[key] };
        AsyncStorage.setItem('stats_prefs', JSON.stringify(newVal));
        return newVal;
    }),

    commentsEnabled,
    toggleComments: () => setCommentsEnabled(prev => {
        const newVal = !prev;
        AsyncStorage.setItem('prefs_comments', JSON.stringify(newVal));
        return newVal;
    }),

    longCigsEnabled,
    toggleLongCigs: () => setLongCigsEnabled(prev => {
        const newVal = !prev;
        AsyncStorage.setItem('prefs_longcigs', JSON.stringify(newVal));
        return newVal;
    }),

    language, 
    changeLanguage
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
