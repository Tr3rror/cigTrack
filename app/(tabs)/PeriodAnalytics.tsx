import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerModal, registerTranslation } from 'react-native-paper-dates';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';

// Register both languages for the DatePicker
registerTranslation('it', {
  save: 'Salva',
  close: 'Chiudi',
  selectSingle: 'Data',
  selectMultiple: 'Date',
  selectRange: 'Intervallo',
  typeInDate: 'Inserisci data',
} as any);

registerTranslation('en', {
  save: 'Save',
  close: 'Close',
  selectSingle: 'Date',
  selectMultiple: 'Dates',
  selectRange: 'Range',
  typeInDate: 'Type in date',
} as any);

const formatTime = (t24: string, fmt: '12h' | '24h') => {
  if (fmt === '24h') return t24;
  const [h, m] = t24.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function PeriodAnalytics() {
  const { t } = useTranslation();
  const { colors, isDark, timeFormat, language } = useTheme();
  const { dailyData } = useData();
  const router = useRouter();
  const params = useLocalSearchParams();

  const currentParamMode = (params.initialMode as 'cig' | 'other') || 'cig';
  const [range, setRange] = useState<{ startDate: Date | undefined; endDate: Date | undefined }>({ 
    startDate: undefined, endDate: undefined 
  });
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cig' | 'other'>(currentParamMode);

  useEffect(() => {
    if (currentParamMode !== viewMode) {
      setViewMode(currentParamMode);
      setRange({ startDate: undefined, endDate: undefined });
    }
  }, [currentParamMode]);

  const stats = useMemo(() => {
    if (!range.startDate || !range.endDate) return null;
    
    let total = 0;
    const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const start = new Date(range.startDate).setHours(0,0,0,0);
    const end = new Date(range.endDate).setHours(23,59,59,999);

    const diffTime = Math.abs(end - start);
    const totalDaysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    Object.entries(dailyData).forEach(([dateStr, data]) => {
      const dTime = new Date(dateStr).getTime();
      if (dTime >= start && dTime <= end) {
        total += viewMode === 'cig' ? data.cigTotal : data.otherTotal;
        data.logs.forEach(log => {
          if (log.type !== viewMode) return;
          const hour = parseInt(log.time.split(':')[0], 10);
          if (hour < 8) buckets.night += log.amount;
          else if (hour < 12) buckets.morning += log.amount;
          else if (hour < 17) buckets.afternoon += log.amount;
          else buckets.evening += log.amount;
        });
      }
    });

    const maxVal = Math.max(buckets.morning, buckets.afternoon, buckets.evening, buckets.night);
    const labels = {
      night: `${t('night')} (${formatTime('00:00', timeFormat)}-${formatTime('08:00', timeFormat)})`,
      morning: `${t('morning')} (${formatTime('08:00', timeFormat)}-${formatTime('12:00', timeFormat)})`,
      afternoon: `${t('afternoon')} (${formatTime('12:00', timeFormat)}-${formatTime('17:00', timeFormat)})`,
      evening: `${t('evening')} (${formatTime('17:00', timeFormat)}-${formatTime('23:59', timeFormat)})`
    };

    let peakLabel = t('noneToday');
    if (maxVal > 0) {
      const topKey = Object.entries(buckets).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      peakLabel = labels[topKey as keyof typeof labels];
    }

    return { total, avg: total / totalDaysInRange, peakLabel };
  }, [dailyData, viewMode, range, timeFormat, t]);

  const customPaperTheme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
      primary: colors.primary,
      surface: isDark ? '#1A1A1A' : '#FFFFFF',
      onSurface: colors.text,
      surfaceVariant: isDark ? '#333333' : '#F0F0F0',
    },
  };

  const displayDate = (d: Date) => d.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US');

  return (
    <PaperProvider theme={customPaperTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={{alignItems: 'center'}}>
            <Text style={[styles.title, { color: colors.text }]}>{t('analysisTitle')}</Text>
            <Text style={{color: colors.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1}}>
              {viewMode === 'cig' ? t('cigTitle') : t('otherTitle')}
            </Text>
          </View>
          <View style={styles.headerBtn} />
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.rangePickerBtn, { backgroundColor: colors.card, borderColor: colors.primary + '44', borderWidth: 1 }]} 
          onPress={() => setOpen(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.rangePickerText, { color: colors.text }]}>
            {range.startDate && range.endDate 
              ? `${displayDate(range.startDate)} - ${displayDate(range.endDate)}`
              : t('selectRange')}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.accent} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {stats ? (
            <View style={styles.resultsContainer}>
              <View style={styles.summaryRow}>
                <View style={[styles.mainStat, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total.toFixed(0)}</Text>
                  <Text style={[styles.statLabel, { color: colors.accent }]}>{t('totMonth').split(' ')[0].toUpperCase()}</Text>
                </View>
                <View style={[styles.mainStat, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.avg.toFixed(1)}</Text>
                  <Text style={[styles.statLabel, { color: colors.accent }]}>{t('avgMonth').split(' ')[0].toUpperCase()} / GG</Text>
                </View>
              </View>

              <View style={[styles.peakCard, { backgroundColor: colors.card }]}>
                <View style={styles.peakHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FF450022' }]}>
                    <Ionicons name="flame" size={20} color="#FF4500" />
                  </View>
                  <Text style={[styles.peakTitle, { color: colors.text }]}>{t('peak')}</Text>
                </View>
                <Text style={[styles.peakTime, { color: colors.text }]}>{stats.peakLabel}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: '100%' }]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.bigIconCircle, { backgroundColor: colors.card }]}>
                <Ionicons name="analytics-outline" size={60} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noneToday')}</Text>
              <Text style={[styles.emptyText, { color: colors.accent }]}>{t('analysisSub')}</Text>
            </View>
          )}
        </ScrollView>

        <DatePickerModal
          locale={language}
          mode="range"
          visible={open}
          onDismiss={() => setOpen(false)}
          startDate={range.startDate}
          endDate={range.endDate}
          onConfirm={(p) => { setOpen(false); setRange(p); }}
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 70 },
  headerBtn: { width: 40, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
  rangePickerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60, borderRadius: 20, marginVertical: 20, gap: 12, elevation: 3 },
  rangePickerText: { flex: 1, fontWeight: '700', fontSize: 14 },
  resultsContainer: { gap: 16 },
  summaryRow: { flexDirection: 'row', gap: 16 },
  mainStat: { flex: 1, padding: 24, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 32, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: 'bold', marginTop: 4, opacity: 0.8 },
  peakCard: { padding: 24, borderRadius: 28, gap: 12 },
  peakHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  peakTitle: { fontSize: 16, fontWeight: '800' },
  peakTime: { fontSize: 18, fontWeight: '700', marginLeft: 4 },
  progressBarBg: { height: 6, width: '100%', backgroundColor: '#33333322', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressBarFill: { height: '100%' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  bigIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22, opacity: 0.7 }
});