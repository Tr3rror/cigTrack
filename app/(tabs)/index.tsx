import React, { useState, useMemo, useCallback } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TimePickerModal } from 'react-native-paper-dates';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';

const { width } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { colors, isDark, isManualMode, timeFormat, commentsEnabled, language } = useTheme();
  const { dailyData, addFraction } = useData();

  const [mode, setMode] = useState<'cig' | 'other'>('cig');
  const [comment, setComment] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visible, setVisible] = useState(false);
  const [fillerPos, setFillerPos] = useState(100); 

  const cigWidth = width * 0.85;
  const filterWidth = cigWidth * 0.25;
  const tobaccoWidth = cigWidth - filterWidth;

  const percentRemaining = useMemo(() => {
    if (fillerPos >= 100 || fillerPos <= 0) return 100;
    return 100 - fillerPos;
  }, [fillerPos]);

  const dateStr = isManualMode ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const todayLogs = dailyData[dateStr]?.logs || [];

  const lastTimeLabel = useMemo(() => {
    const modeLogs = todayLogs.filter((l: any) => l.type === mode);
    if (modeLogs.length === 0) return t('noneToday');
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const nearest = modeLogs.reduce((prev: any, curr: any) => {
      const [ch, cm] = curr.time.split(':').map(Number);
      const [ph, pm] = prev.time.split(':').map(Number);
      return Math.abs(ch * 60 + cm - nowMin) < Math.abs(ph * 60 + pm - nowMin) ? curr : prev;
    });
    return `${t('lastAt')} ${formatDisplayTime(nearest.time, timeFormat)}`;
  }, [todayLogs, mode, timeFormat, t]);

  const saveLog = useCallback((h?: number, m?: number) => {
    let customTime;
    if (h !== undefined && m !== undefined) {
      customTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    addFraction(percentRemaining / 100, mode, dateStr, customTime, comment);
    setComment('');
    setFillerPos(100); 
  }, [percentRemaining, mode, dateStr, comment, addFraction]);

  const updateFillerFromX = (locationX: number) => {
    const relativeX = locationX - filterWidth;
    let newPos = Math.round((relativeX / tobaccoWidth) * 100);
    if (newPos > 100) newPos = 100;
    if (newPos < 0) newPos = 0;
    setFillerPos(newPos);
  };

  const handleTouch = (evt: any) => updateFillerFromX(evt.nativeEvent.locationX);

  const onConfirmManual = useCallback(({ hours, minutes }: { hours: number; minutes: number }) => {
    setVisible(false);
    saveLog(hours, minutes);
  }, [saveLog]);

  const handlePressButton = () => isManualMode ? setVisible(true) : saveLog();

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
  const visualFillWidth = (fillerPos / 100) * tobaccoWidth;

  return (
    <PaperProvider theme={paperTheme}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.mainContainer, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.backBtn}>
              <Ionicons name="settings-outline" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.logo, { color: colors.primary }]}>CigTrack</Text>
            <TouchableOpacity onPress={() => router.push('/home')} style={styles.themeBtn}>
              <Ionicons name="bar-chart-outline" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {isManualMode && (
              <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => changeDate(-1)}>
                  <Ionicons name="chevron-back-circle" size={40} color={colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.dateLabel, { color: colors.text }]}>
                    {selectedDate.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '800' }}>{t('manualLabel')}</Text>
                </View>
                <TouchableOpacity onPress={() => changeDate(1)}>
                  <Ionicons name="chevron-forward-circle" size={40} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.hint, { color: colors.accent }]}>{lastTimeLabel}</Text>

            <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.scoreContent} onPress={() => setMode(mode === 'cig' ? 'other' : 'cig')}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} style={{ opacity: mode === 'other' ? 1 : 0 }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={[styles.modeTitle, { color: colors.accent }]}>{mode === 'cig' ? t('cigTitle') : t('otherTitle')}</Text>
                  <Text style={[styles.mainNumber, { color: colors.text }]}>{Number(displayCount).toFixed(2)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} style={{ opacity: mode === 'cig' ? 1 : 0 }} />
              </TouchableOpacity>
            </View>

            {commentsEnabled && (
              <TextInput
                placeholder={t('notePlaceholder')}
                placeholderTextColor={colors.accent}
                value={comment}
                onChangeText={setComment}
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.primary + '22' }]}
              />
            )}

            <View style={styles.sliderArea}>
              <Text style={[styles.sliderValue, { color: colors.text }]}>{percentRemaining}%</Text>
              <View style={styles.svgContainer} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={handleTouch} onResponderMove={handleTouch}>
                <Svg width={cigWidth} height={60}>
                  <Rect x="0" y="0" width={cigWidth} height={60} fill={isDark ? "#333" : "#e0e0e0"} rx={15} />
                  <Rect x={filterWidth} y="0" width={visualFillWidth} height={60} fill={colors.primary} />
                  <Rect x="0" y="0" width={filterWidth} height={60} fill={colors.filter || '#E1A95F'} rx={15} />
                  <Rect x={filterWidth - 1} y="0" width={2} height={60} fill="rgba(0,0,0,0.1)" />
                </Svg>
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.mainBtn, { backgroundColor: colors.primary }]} onPress={handlePressButton}>
            <Text style={styles.mainBtnText}>{t('registerBtn')}</Text>
          </TouchableOpacity>

          <TimePickerModal visible={visible} onDismiss={() => setVisible(false)} onConfirm={onConfirmManual} hours={new Date().getHours()} minutes={new Date().getMinutes()} use24HourClock={timeFormat === '24h'} />
        </View>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, paddingHorizontal: 25, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  themeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
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
  sliderValue: { fontSize: 22, fontWeight: '900', marginBottom: 15 },
  svgContainer: { height: 60, width: width * 0.85 },
  mainBtn: { height: 70, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 }
});