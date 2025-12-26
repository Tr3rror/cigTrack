import React, { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: { 
    background: string; 
    text: string; 
    primary: string; 
    accent: string; 
    card: string; 
    filter: string 
  };
  setCustomColor: (key: 'primary' | 'background' | 'accent', color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Valori predefiniti per il reset
const DEFAULT_COLORS = {
  primary: '#FF4500',
  bgLight: '#F8F9FA',
  bgDark: '#121212',
  accent: '#6C757D',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [customColors, setCustomColors] = useState(DEFAULT_COLORS);

  const toggleTheme = () => setIsDark(prev => !prev);

  const setCustomColor = (key: 'primary' | 'background' | 'accent', color: string) => {
    setCustomColors(prev => {
      if (key === 'background') {
        // Se stiamo cambiando il background, aggiorna solo quello relativo alla modalità attuale
        return isDark 
          ? { ...prev, bgDark: color } 
          : { ...prev, bgLight: color };
      }
      return { ...prev, [key]: color };
    });
  };

  const theme: ThemeContextType = {
    isDark,
    toggleTheme,
    setCustomColor,
    colors: {
      background: isDark ? customColors.bgDark : customColors.bgLight,
      text: isDark ? '#FFFFFF' : '#212529',
      primary: customColors.primary,
      accent: customColors.accent,
      card: isDark ? '#1E1E1E' : '#FFFFFF',
      filter: '#D2691E',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};