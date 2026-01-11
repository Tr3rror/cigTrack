import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TimePickerModal } from 'react-native-paper-dates';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';

const { width } = Dimensions.get('window');

// --- Helper for Display Format ---
const formatDisplayTime = (time24: string, format: '12h' | '24h') => {
  if (!time24) return "";
  if (format === '24h') return time24;
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
};

export default function Index() {
  const router = useRouter();

  // ??
  const insets = useSafeAreaInsets();
  
  // utility
  const { colors, isDark, isManualMode, timeFormat, commentsEnabled, longCigsEnabled } = useTheme();
  const { dailyData, addFraction } = useData();
  
  // const with set
  const [mode, setMode] = useState<'cig' | 'other'>('cig');
  const [percentRemaining, setPercentRemaining] = useState(100);
  const [comment, setComment] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visible, setVisible] = useState(false);
  
  // whidt for cigarette object and percentile in case of long
  const maxVal = longCigsEnabled ? 120 : 100;
  const dateStr = isManualMode ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const todayLogs = dailyData[dateStr]?.logs || [];

  // --- Logic: Find nearest session by TIME (not last added) ---  ?? to check
  const lastTimeLabel = useMemo(() => {
    const modeLogs = todayLogs.filter((l: any) => l.type === mode);
    if (modeLogs.length === 0) return "Nessuna sessione oggi";

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const nearest = modeLogs.reduce((prev: any, curr: any) => {
      const [ch, cm] = curr.time.split(':').map(Number);
      const [ph, pm] = prev.time.split(':').map(Number);
      return Math.abs(ch * 60 + cm - nowMin) < Math.abs(ph * 60 + pm - nowMin) ? curr : prev;
    });

    return `Ultima alle ${formatDisplayTime(nearest.time, timeFormat)}`;
  }, [todayLogs, mode, timeFormat]);

  // --- CORE FUNCTION: Save Log ---
  const saveLog = useCallback((h?: number, m?: number) => {
    let customTime;
    if (h !== undefined && m !== undefined) {
      customTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // addFraction handles the Day check (automatic vs manual sorting)
    addFraction(percentRemaining / 100, mode, dateStr, customTime, comment);

    // Reset state
    setComment('');
    setPercentRemaining(maxVal);
  }, [percentRemaining, mode, dateStr, comment, maxVal, addFraction]);

  // --- Handlers ---
  const onConfirmManual = useCallback(({ hours, minutes }: { hours: number; minutes: number }) => {
    setVisible(false);
    saveLog(hours, minutes);
  }, [saveLog]);

  const handlePressButton = () => {
    if (isManualMode) setVisible(true);
    else saveLog();
  };

  const handleTouchMove = (evt: any) => {
    const cigWidth = width * 0.85;
    const filterW = cigWidth * 0.25;
    const tobaccoW = cigWidth - filterW;
    let p = ((evt.nativeEvent.locationX - filterW) / tobaccoW) * maxVal;
    setPercentRemaining(Math.min(maxVal, Math.max(0, Math.round(p))));
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const paperTheme = useMemo(() => ({
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme : MD3LightTheme).colors,
      primary: colors.primary,
      surface: colors.card,
    },
  }), [isDark, colors]);

  const displayCount = dailyData[dateStr]?.[mode === 'cig' ? 'cigTotal' : 'otherTotal'] || 0;

  return (
    <PaperProvider theme={paperTheme}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.mainContainer, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.logo, { color: colors.primary }]}>CigTrack</Text>
            <TouchableOpacity onPress={() => router.push('/home')}>
              <Ionicons name="bar-chart-outline" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Manual Date Switcher */}
            {isManualMode && (
              <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => changeDate(-1)}>
                  <Ionicons name="chevron-back-circle" size={40} color={colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.dateLabel, { color: colors.text }]}>
                    {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '800' }}>MANUALE</Text>
                </View>
                <TouchableOpacity onPress={() => changeDate(1)}>
                  <Ionicons name="chevron-forward-circle" size={40} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.hint, { color: colors.accent }]}>{lastTimeLabel}</Text>

            {/* Main Score Display */}
            <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.scoreContent}
                onPress={() => setMode(mode === 'cig' ? 'other' : 'cig')}
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary} style={{ opacity: mode === 'other' ? 1 : 0 }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={[styles.modeTitle, { color: colors.accent }]}>{mode === 'cig' ? 'SIGARETTE 🚬' : 'ALTRO ✨'}</Text>
                  <Text style={[styles.mainNumber, { color: colors.text }]}>{Number(displayCount).toFixed(2)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} style={{ opacity: mode === 'cig' ? 1 : 0 }} />
              </TouchableOpacity>
            </View>

            {commentsEnabled && (
              <TextInput
                placeholder="Nota sessione..."
                placeholderTextColor={colors.accent}
                value={comment}
                onChangeText={setComment}
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.primary + '22' }]}
              />
            )}

            {/* Cigarette Slider */}
            <View style={styles.sliderArea}>
              <Text style={[styles.sliderValue, { color: colors.text }]}>
                Fumato: {(percentRemaining / 100).toFixed(2)} {percentRemaining > 100 ? '(XL)' : ''}
              </Text>
              <View style={styles.svgContainer} onStartShouldSetResponder={() => true} onResponderMove={handleTouchMove}>
                <Svg width={width * 0.85} height={60}>
                  <Rect x="0" y="0" width={width * 0.85} height={60} fill={isDark ? "#222" : "#eee"} rx={15} />
                  <Rect x="0" y="0" width={(width * 0.85) * 0.25} height={60} fill={colors.filter} rx={15} />
                  <Rect
                    x={(width * 0.85) * 0.25}
                    y="0"
                    width={((width * 0.85) * 0.75) * (percentRemaining / maxVal)}
                    height={60}
                    fill={colors.primary}
                    rx={5}
                  />
                </Svg>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: colors.primary }]}
            onPress={handlePressButton}
          >
            <Text style={styles.mainBtnText}>REGISTRA SESSIONE</Text>
          </TouchableOpacity>

          <TimePickerModal
            visible={visible}
            onDismiss={() => setVisible(false)}
            onConfirm={onConfirmManual}
            hours={new Date().getHours()}
            minutes={new Date().getMinutes()}
            use24HourClock={timeFormat === '24h'}
          />
        </View>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, paddingHorizontal: 25, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  logo: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  dateLabel: { fontSize: 20, fontWeight: '900' },
  hint: { fontSize: 13, fontWeight: '600', marginBottom: 15 },
  scoreCard: { width: '100%', paddingVertical: 35, borderRadius: 35, marginBottom: 25 },
  scoreContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  modeTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5 },
  mainNumber: { fontSize: 72, fontWeight: '900', marginTop: -5 },
  input: { width: '100%', padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 20, fontSize: 15 },
  sliderArea: { alignItems: 'center', width: '100%' },
  sliderValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  svgContainer: { height: 60, width: width * 0.85 },
  mainBtn: { height: 70, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 }
});