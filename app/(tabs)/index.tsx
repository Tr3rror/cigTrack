import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TimePickerModal } from 'react-native-paper-dates';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';

const { width } = Dimensions.get('window');

// --- Helper Functions ---
const formatDisplayTime = (time24: string, format: '12h' | '24h') => {
  if (format === '24h') return time24;
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
};

// --- Sub-Components ---
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
        <Text style={[styles.label, { color: colors.accent }]}>{mode === 'cig' ? "Fumate🚬" : "Altro✨"}</Text>
        <Text style={[styles.count, { color: colors.text }]}>{Number(displayCount).toFixed(2)}</Text>
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

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, isManualMode, timeFormat, commentsEnabled, longCigsEnabled } = useTheme();
  const { dailyData, addFraction } = useData();

  const [mode, setMode] = useState<'cig' | 'other'>('cig');
  const [percentRemaining, setPercentRemaining] = useState(100);
  const [comment, setComment] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visible, setVisible] = useState(false);

  const maxVal = longCigsEnabled ? 120 : 100;

  useEffect(() => {
    setPercentRemaining(maxVal);
  }, [maxVal]);

  const paperTheme = useMemo(() => ({
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme : MD3LightTheme).colors,
      primary: colors.primary,
      surface: colors.card,
      onSurface: colors.text,
    },
  }), [isDark, colors]);

  const dateStr = useMemo(() => {
    return isManualMode
      ? selectedDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
  }, [isManualMode, selectedDate]);

  const todayData = dailyData[dateStr] || { cigTotal: 0, otherTotal: 0, logs: [] };
  const displayCount = mode === 'cig' ? todayData.cigTotal : todayData.otherTotal;
  const modeLogs = useMemo(() => todayData.logs.filter((l: any) => l.type === mode), [todayData.logs, mode]);

  const lastTimeLabel = modeLogs.length > 0
    ? `Ultima alle ${formatDisplayTime(modeLogs[modeLogs.length - 1].time, timeFormat)}`
    : "Nessuna sessione oggi";

  const saveLog = (customH?: number, customM?: number) => {
    const amountSmoked = percentRemaining / 100;
    let time24 = undefined;

    if (customH !== undefined && customM !== undefined) {
      time24 = `${customH.toString().padStart(2, '0')}:${customM.toString().padStart(2, '0')}`;
    }

    addFraction(amountSmoked, mode, isManualMode ? dateStr : undefined, time24, commentsEnabled ? comment : undefined);

    if (time24) Alert.alert("Salvato", `Registrata alle ${formatDisplayTime(time24, timeFormat)}`);

    setPercentRemaining(maxVal);
    setComment('');
  };

  const onConfirmManual = useCallback(({ hours, minutes }: { hours: number; minutes: number }) => {
    setVisible(false);
    saveLog(hours, minutes);
  }, [percentRemaining, mode, dateStr, comment, maxVal]);

  const handlePressButton = () => {
    if (isManualMode) setVisible(true);
    else saveLog();
  };

  const handleTouchMove = (evt: any) => {
    const locX = evt.nativeEvent.locationX;
    const relativeX = Math.max(0, locX - filterWidth);
    let p = (relativeX / tobaccoWidth) * maxVal;
    p = Math.min(maxVal, Math.max(0, p));
    setPercentRemaining(Math.round(p));
  };


  const cigWidth = width * 0.85;
  const FILTER_RATIO = 0.25;
  const filterWidth = cigWidth * FILTER_RATIO;
  const tobaccoWidth = cigWidth * (1 - FILTER_RATIO);

  const filledWidth = (tobaccoWidth * percentRemaining) / maxVal;


  return (
    <PaperProvider theme={paperTheme}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <Header colors={colors} router={router} />

          <View style={styles.mainContent}>
            {isManualMode && (
              <ManualDateSelector
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                colors={colors}
              />
            )}

            <Text style={[styles.lastSmokedText, { color: colors.accent }]}>{lastTimeLabel}</Text>

            <ScoreCard mode={mode} setMode={setMode} displayCount={displayCount} colors={colors} />

            {commentsEnabled && (
              <TextInput
                placeholder="Aggiungi commento..."
                placeholderTextColor={colors.accent}
                value={comment}
                onChangeText={setComment}
                style={[styles.commentInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.primary + '44' }]}
              />
            )}

            <View style={styles.interactionArea}>
              <Text style={[styles.perc, { color: colors.text }]}>
                Quantità: {(percentRemaining / 100).toFixed(2)}
                {longCigsEnabled && percentRemaining > 100 ? ' (XL)' : ''}
              </Text>

              <View
                style={styles.cigContainer}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderMove={handleTouchMove}
                onResponderRelease={handleTouchMove}
              >
                <Svg width={cigWidth} height={70}>
                  <Rect x="0" y="5" width={cigWidth} height={60} fill={isDark ? "#333" : "#E0E0E0"} rx={12} />
                  <Rect x="0" y="5" width={cigWidth * 0.25} height={60} fill={colors.filter} rx={12} />
                  <Rect x={(cigWidth * 0.25) - 5} y="5" width={10} height={60} fill={colors.filter} />
                  <Rect
                    x={filterWidth}
                    y="5"
                    width={filledWidth}
                    height={60}
                    fill={percentRemaining > 100 ? colors.accent : colors.primary}
                    rx={12}
                  />

                </Svg>
              </View>
              <Text style={{ color: colors.accent, fontSize: 10, marginTop: 5 }}>
                Trascina per modificare quantità (Max: {maxVal}%)
              </Text>
            </View>
          </View>

          <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handlePressButton}>
              <Text style={styles.saveButtonText}>
                {percentRemaining === maxVal ? "AGGIUNGI UNA INTERA" : "AGGIUNGI PARTE"}
              </Text>
            </TouchableOpacity>
          </View>

          <TimePickerModal
            visible={visible}
            onDismiss={() => setVisible(false)}
            onConfirm={onConfirmManual}
            hours={new Date().getHours()}
            minutes={new Date().getMinutes()}
            label="Seleziona orario"
            use24HourClock={timeFormat === '24h'}
          />
        </View>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  logo: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lastSmokedText: { fontSize: 14, fontWeight: '600', marginBottom: 20 },
  scoreCard: { paddingVertical: 30, borderRadius: 25, width: '100%', elevation: 4, borderWidth: 1, marginBottom: 20 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  arrowSlot: { width: 40, alignItems: 'center' },
  scoreContent: { alignItems: 'center' },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
  count: { fontSize: 60, fontWeight: 'bold' },
  interactionArea: { alignItems: 'center', width: '100%', marginTop: 20 },
  perc: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  cigContainer: { marginVertical: 10 },
  commentInput: { width: '100%', padding: 15, borderRadius: 15, borderWidth: 1, marginBottom: 15, fontSize: 14 },
  footer: { width: '100%' },
  saveButton: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%' },
  saveButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  dateTextContainer: { alignItems: 'center' },
  dateTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
});