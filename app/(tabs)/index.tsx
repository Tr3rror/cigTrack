import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { Dimensions, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { useData } from '../../C_Custom/DataContext';
import { useTheme } from '../../C_Custom/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { dailyData, addFraction } = useData();
  
  const [mode, setMode] = useState<'cig' | 'other'>('cig');
  const [percentRemaining, setPercentRemaining] = useState(100);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayData = dailyData[todayStr] || { cigTotal: 0, otherTotal: 0, logs: [] };
  const displayCount = mode === 'cig' ? todayData.cigTotal : todayData.otherTotal;

  // Fix: Filter last log based on current mode
  const modeLogs = useMemo(() => todayData.logs.filter(l => l.type === mode), [todayData.logs, mode]);
  const lastLog = modeLogs[modeLogs.length - 1];
  const lastTimeLabel = lastLog ? `Ultima alle ${lastLog.time}` : "Nessuna sessione oggi";

  const cigWidth = width * 0.85;
  const filterWidth = cigWidth * 0.25;
  const bodyWidth = cigWidth - filterWidth;

  const handlePress = (evt: any) => {
    const locX = evt.nativeEvent.locationX;
    if (locX < filterWidth) return setPercentRemaining(0);
    let p = ((locX - filterWidth) / bodyWidth) * 100;
    setPercentRemaining(Math.round(Math.min(100, Math.max(0, p))));
  };

  const handleAction = () => {
    let amountSmoked = percentRemaining === 100 ? 1 : (100 - percentRemaining) / 100;
    addFraction(amountSmoked, mode);
    setPercentRemaining(100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.logo, { color: colors.primary }]}>CigTrack</Text>
        <TouchableOpacity onPress={() => router.push('/home')}>
          <Ionicons name="bar-chart-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <Text style={[styles.lastSmokedText, { color: colors.accent }]}>{lastTimeLabel}</Text>

        <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.primary + '33' }]}>
          <View style={styles.scoreRow}>
            <View style={styles.arrowSlot}>
                {mode === 'other' && (
                <TouchableOpacity onPress={() => setMode('cig')}>
                    <Ionicons name="chevron-back" size={32} color={colors.primary} />
                </TouchableOpacity>
                )}
            </View>

            <View style={styles.scoreContent}>
              <Text style={[styles.label, { color: colors.accent }]}>
                {mode === 'cig' ? "Fumate oggi" : "Altro"}
              </Text>
              <Text style={[styles.count, { color: colors.text }]}>{displayCount.toFixed(2)}</Text>
            </View>

            <View style={styles.arrowSlot}>
                {mode === 'cig' && (
                <TouchableOpacity onPress={() => setMode('other')}>
                    <Ionicons name="chevron-forward" size={32} color={colors.primary} />
                </TouchableOpacity>
                )}
            </View>
          </View>
        </View>

        <View style={styles.interactionArea}>
            <Text style={[styles.perc, { color: colors.text }]}>
              Smoked: {100 - percentRemaining}%
            </Text>
            
            <TouchableOpacity activeOpacity={1} onPress={handlePress} style={styles.cigContainer}>
              <Svg width={cigWidth} height={70}>
                  <Rect x="0" y="5" width={filterWidth} height={60} fill={colors.filter || '#E67E22'} rx={12} />
                  <Rect x={filterWidth} y="5" width={bodyWidth} height={60} fill={isDark ? "#333" : "#E0E0E0"} rx={12} />
                  <Rect 
                      x={filterWidth} 
                      y="5" 
                      width={(bodyWidth * percentRemaining) / 100} 
                      height={60} 
                      fill={colors.primary} 
                      rx={2} 
                  />
              </Svg>
            </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleAction}
        >
          <Text style={styles.saveButtonText}>
              {percentRemaining === 100 ? "AGGIUNGI UNA INTERA" : "AGGIUNGI PARTE FUMATA"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  logo: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lastSmokedText: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  scoreCard: { paddingVertical: 20, borderRadius: 25, width: '100%', elevation: 4, borderWidth: 1, marginBottom: height * 0.05 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  arrowSlot: { width: 40, alignItems: 'center' },
  scoreContent: { alignItems: 'center' },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  count: { fontSize: 56, fontWeight: 'bold' },
  interactionArea: { alignItems: 'center', width: '100%' },
  perc: { fontSize: 15, fontWeight: '500', opacity: 0.7, marginBottom: 10 },
  cigContainer: { marginVertical: 10 },
  footer: { width: '100%' },
  saveButton: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%' },
  saveButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 }
});