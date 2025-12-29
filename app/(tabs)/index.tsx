import React, { useState, useMemo, useCallback } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TimePickerModal } from 'react-native-paper-dates';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';

const { width, height } = Dimensions.get('window');

// --- Helper Functions ---

const formatDisplayTime = (time24: string, format: '12h' | '24h') => {
  if (format === '24h') return time24;
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
};

// --- Components ---

const Header = ({ colors, router }: any) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => router.push('/settings')}>
      <Ionicons name="settings-outline" size={28} color={colors.text} />
    </TouchableOpacity>
    <Text style={[styles.logo, { color: colors.primary }]}>CigTrack</Text>
    <TouchableOpacity onPress={() => router.push('/home')}>
      <Ionicons name="bar-chart-outline" size={28} color={colors.text} />
    </TouchableOpacity>
  </View>
);

const ManualDateSelector = ({ selectedDate, setSelectedDate, colors }: any) => {
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  return (
    <View style={styles.dateSelector}>
      <TouchableOpacity onPress={() => changeDate(-1)}>
        <Ionicons name="chevron-back-circle" size={42} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.dateTextContainer}>
        <Text style={[styles.dateTitle, { color: colors.text }]}>
          {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).toUpperCase()}
        </Text>
        <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800', marginTop: 4 }}>MODALITÀ MANUALE</Text>
      </View>
      <TouchableOpacity onPress={() => changeDate(1)}>
        <Ionicons name="chevron-forward-circle" size={42} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const ScoreCard = ({ mode, setMode, displayCount, colors }: any) => (
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
        <Text style={[styles.label, { color: colors.accent }]}>{mode === 'cig' ? "Fumate" : "Altro"}</Text>
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
);

// --- Main Screen ---

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, isManualMode, timeFormat, statsPrefs } = useTheme();
  const { dailyData, addFraction } = useData();

  const [mode, setMode] = useState<'cig' | 'other'>('cig');
  const [percentRemaining, setPercentRemaining] = useState(100);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visible, setVisible] = useState(false);

  const paperTheme = useMemo(() => ({
    ...isDark ? MD3DarkTheme : MD3LightTheme,
    colors: {
      ...(isDark ? MD3DarkTheme : MD3LightTheme).colors,
      primary: colors.primary,
      onPrimary: '#FFFFFF',
      primaryContainer: isDark ? '#333' : '#eee',
      onPrimaryContainer: colors.primary,
      surface: colors.card,
      onSurface: colors.text,
    },
  }), [isDark, colors]);

  const dateStr = isManualMode
    ? selectedDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const todayData = dailyData[dateStr] || { cigTotal: 0, otherTotal: 0, logs: [] };
  const displayCount = mode === 'cig' ? todayData.cigTotal : todayData.otherTotal;
  const modeLogs = useMemo(() => todayData.logs.filter((l: any) => l.type === mode), [todayData.logs, mode]);
  const lastTimeLabel = modeLogs.length > 0 
    ? `Ultima alle ${formatDisplayTime(modeLogs[modeLogs.length - 1].time, timeFormat)}` 
    : "Nessuna sessione oggi";

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7); // YYYY-MM
    
    // 1. Last 7 Days
    let sum7d = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayData = dailyData[dStr];
      if (dayData) {
        sum7d += mode === 'cig' ? dayData.cigTotal : dayData.otherTotal;
      }
    }
    const avg7d = sum7d / 7;

    // 2. Month Total
    let sumMonth = 0;
    let daysRecordedInMonth = 0;
    Object.keys(dailyData).forEach(key => {
      if (key.startsWith(currentMonthPrefix)) {
        sumMonth += mode === 'cig' ? dailyData[key].cigTotal : dailyData[key].otherTotal;
        daysRecordedInMonth++;
      }
    });
    // Calculate avg based on day of month (e.g. if today is 5th, avg over 5 days)
    const dayOfMonth = today.getDate();
    const avgMonth = dayOfMonth > 0 ? sumMonth / dayOfMonth : 0;

    return { sum7d, avg7d, sumMonth, avgMonth };
  }, [dailyData, mode]);

  // --- Prepare Active Stats List ---
  const activeStats = useMemo(() => {
    const list = [];
    if (statsPrefs.show7dTotal) list.push({ id: '7dt', label: 'Tot 7gg', value: stats.sum7d.toFixed(1), isMonth: false });
    if (statsPrefs.show7dAvg)   list.push({ id: '7da', label: 'Media 7gg', value: stats.avg7d.toFixed(1), isMonth: false });
    if (statsPrefs.showMonthTotal) list.push({ id: 'mot', label: 'Tot Mese', value: stats.sumMonth.toFixed(1), isMonth: true });
    if (statsPrefs.showMonthAvg)   list.push({ id: 'moa', label: 'Media Mese', value: stats.avgMonth.toFixed(1), isMonth: true });
    return list;
  }, [statsPrefs, stats]);

  const onConfirmManual = useCallback(({ hours, minutes }: { hours: number; minutes: number }) => {
    setVisible(false);
    const amountSmoked = percentRemaining === 100 ? 1 : (100 - percentRemaining) / 100;
    const hoursStr = hours.toString().padStart(2, '0');
    const minStr = minutes.toString().padStart(2, '0');
    const time24 = `${hoursStr}:${minStr}`;
    addFraction(amountSmoked, mode, dateStr, time24);
    Alert.alert("Salvato", `Registrata alle ${formatDisplayTime(time24, timeFormat)}`);
    setPercentRemaining(100);
  }, [percentRemaining, mode, dateStr, timeFormat, addFraction]);

  const handlePressButton = () => {
    if (isManualMode) setVisible(true);
    else {
        const amountSmoked = percentRemaining === 100 ? 1 : (100 - percentRemaining) / 100;
        addFraction(amountSmoked, mode, undefined, undefined);
        setPercentRemaining(100);
    }
  };

  const handlePressSlider = (evt: any) => {
    const cigWidth = width * 0.85;
    const filterWidth = cigWidth * 0.25;
    const bodyWidth = cigWidth - filterWidth;
    const locX = evt.nativeEvent.locationX;
    if (locX < filterWidth) return setPercentRemaining(0);
    let p = ((locX - filterWidth) / bodyWidth) * 100;
    setPercentRemaining(Math.round(Math.min(100, Math.max(0, p))));
  };

  return (
    <PaperProvider theme={paperTheme}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Header colors={colors} router={router} />

        <View style={styles.mainContent}>
          {isManualMode && (
            <ManualDateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} colors={colors} />
          )}

          <TimePickerModal
            visible={visible}
            onDismiss={() => setVisible(false)}
            onConfirm={onConfirmManual}
            hours={new Date().getHours()}
            minutes={new Date().getMinutes()}
            label="Seleziona orario"
            cancelLabel="Annulla"
            confirmLabel="Salva"
            use24HourClock={timeFormat === '24h'}
            locale="it"
          />

          <Text style={[styles.lastSmokedText, { color: colors.accent }]}>{lastTimeLabel}</Text>

          <ScoreCard mode={mode} setMode={setMode} displayCount={displayCount} colors={colors} />

          <View style={styles.interactionArea}>
            <Text style={[styles.perc, { color: colors.text }]}>Fumato: {100 - percentRemaining}%</Text>
            <TouchableOpacity activeOpacity={1} onPress={handlePressSlider} style={styles.cigContainer}>
              <Svg width={width * 0.85} height={70}>
                <Rect x="0" y="5" width={(width * 0.85) * 0.25} height={60} fill={colors.filter} rx={12} />
                <Rect x={(width * 0.85) * 0.25} y="5" width={(width * 0.85) * 0.75} height={60} fill={isDark ? "#333" : "#E0E0E0"} rx={12} />
                <Rect x={(width * 0.85) * 0.25} y="5" width={((width * 0.85) * 0.75 * percentRemaining) / 100} height={60} fill={colors.primary} rx={2} />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handlePressButton}>
            <Text style={styles.saveButtonText}>
              {percentRemaining === 100 ? "AGGIUNGI UNA INTERA" : "AGGIUNGI PARTE FUMATA"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  logo: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 30, paddingHorizontal: 10 },
  dateTextContainer: { alignItems: 'center' },
  dateTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  lastSmokedText: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 10 }, // Added marginTop for spacing from Grid
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
  saveButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});