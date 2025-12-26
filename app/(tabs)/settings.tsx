import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useTheme } from '../../C_Custom/ThemeContext';

const { width } = Dimensions.get('window');

// Utility to convert HSL to Hex for the theme context
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const CustomColorPicker = ({ label, currentColor, onSelect }: any) => {
  const [hue, setHue] = useState(0);
  const [lum, setLum] = useState(50);

  const updateColor = (newHue: number, newLum: number) => {
    const hex = hslToHex(newHue, 100, newLum);
    onSelect(hex);
  };

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerRow}>
        {/* Preview Circle */}
        <View style={[styles.previewCircle, { backgroundColor: currentColor }]} />
        
        <View style={styles.controlsColumn}>
          {/* Hue Slider (Color) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.sliderTrack}
          >
            {Array.from({ length: 36 }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { setHue(i * 10); updateColor(i * 10, lum); }}
                style={[styles.hueBit, { backgroundColor: `hsl(${i * 10}, 100%, 50%)` }]}
              />
            ))}
          </ScrollView>

          {/* Luminance Slider (Tone) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.sliderTrack}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { setLum(i * 5); updateColor(hue, i * 5); }}
                style={[styles.hueBit, { backgroundColor: `hsl(${hue}, 100%, ${i * 5}%)`, width: 25 }]}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default function Settings() {
  const { colors, setCustomColor, toggleTheme, isDark } = useTheme();
  const router = useRouter();

  const resetDefaults = () => {
    setCustomColor('primary', '#FF4500');
    setCustomColor('background', isDark ? '#121212' : '#FFFFFF');
    setCustomColor('accent', '#808080');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <View style={styles.headerRight}>
            <TouchableOpacity onPress={resetDefaults} style={styles.resetBtn}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 12}}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny" : "moon"} size={26} color={colors.text} />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
          <CustomColorPicker 
            label="Colore Principale" 
            currentColor={colors.primary} 
            onSelect={(color: string) => setCustomColor('primary', color)} 
          />

          <CustomColorPicker 
            label="Colore Sfondo" 
            currentColor={colors.background} 
            onSelect={(color: string) => setCustomColor('background', color)} 
          />

          <CustomColorPicker 
            label="Dettagli & Testi" 
            currentColor={colors.accent} 
            onSelect={(color: string) => setCustomColor('accent', color)} 
          />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 30 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  title: { fontSize: 22, fontWeight: 'bold' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8882', padding: 8, borderRadius: 10 },
  
  pickerContainer: { marginBottom: 40 },
  pickerLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', opacity: 0.5, marginBottom: 15, marginLeft: 5 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  previewCircle: { width: 60, height: 60, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  controlsColumn: { flex: 1, gap: 10 },
  sliderTrack: { flexDirection: 'row', height: 25, borderRadius: 5, overflow: 'hidden' },
  hueBit: { width: 15, height: '100%' }
});