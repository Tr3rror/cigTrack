import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';
import { CalendarView } from '@/C_Custom/CalendarView';
import { LogDetailSheet } from '@/C_Custom/LogDetailSheet';

export default function Home() {
  const { t } = useTranslation();
  const { colors, statsPrefs, isDark, timeFormat, language } = useTheme();
  const { dailyData, deleteLog } = useData();
  const router = useRouter();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cig' | 'other'>('cig');
  const [viewDate, setViewDate] = useState(new Date());

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const formatDisplayTime = (time24: string, format: '12h' | '24h') => {
    if (format === '24h') return time24;
    const [h, m] = time24.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    const periodBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    let sum7d = 0;
    let sumMonth = 0;

    Object.entries(dailyData).forEach(([date, data]) => {
      const value = viewMode === 'cig' ? data.cigTotal : data.otherTotal;
      if (date.startsWith(currentMonthPrefix)) sumMonth += value;

      const diffDays = Math.floor((today.getTime() - new Date(date).getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        sum7d += value;
        data.logs.forEach(log => {
          if (log.type !== viewMode) return;
          const hour = parseInt(log.time.split(':')[0], 10);
          if (hour < 8) periodBuckets.night += log.amount;
          else if (hour < 12) periodBuckets.morning += log.amount;
          else if (hour < 17) periodBuckets.afternoon += log.amount;
          else periodBuckets.evening += log.amount;
        });
      }
    });

    const peakKey = Object.entries(periodBuckets).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const peakLabels: Record<string, string> = {
      night: `${t('night')} (${formatDisplayTime('00:00', timeFormat)})`,
      morning: `${t('morning')} (${formatDisplayTime('08:00', timeFormat)})`,
      afternoon: `${t('afternoon')} (${formatDisplayTime('12:00', timeFormat)})`,
      evening: `${t('evening')} (${formatDisplayTime('17:00', timeFormat)})`
    };

    return {
      sum7d,
      avg7d: sum7d / 7,
      sumMonth,
      avgMonth: today.getDate() > 0 ? sumMonth / today.getDate() : 0,
      peakPeriodLabel: sum7d > 0 ? peakLabels[peakKey] : "---"
    };
  }, [dailyData, viewMode, timeFormat, t]);

  const filteredLogs = useMemo(() => {
    if (!selectedDay || !dailyData[selectedDay]) return [];
    return dailyData[selectedDay].logs.filter((l) => l.type === viewMode);
  }, [selectedDay, dailyData, viewMode]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) =>
      `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    );
  }, [viewDate]);

  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={{ ...paperTheme, colors: { ...paperTheme.colors, primary: colors.primary } }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.modeToggle}>
            <TouchableOpacity onPress={() => setViewMode('cig')} style={[styles.modeBtn, viewMode === 'cig' && { backgroundColor: colors.primary }]}>
              <Text style={[styles.modeText, { color: viewMode === 'cig' ? '#FFF' : colors.text }]}>{t('cigMode')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode('other')} style={[styles.modeBtn, viewMode === 'other' && { backgroundColor: colors.primary }]}>
              <Text style={[styles.modeText, { color: viewMode === 'other' ? '#FFF' : colors.text }]}>{t('otherMode')}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          <TouchableOpacity style={[styles.analyticsLink, { backgroundColor: colors.card }]} onPress={() => router.push({ pathname: '/PeriodAnalytics', params: { initialMode: viewMode } })}>
            <View style={styles.analyticsLinkContent}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="stats-chart" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.linkTitle, { color: colors.text }]}>{t('analysisTitle')}</Text>
                <Text style={[styles.linkSub, { color: colors.text }]}>{t('analysisSub')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              {statsPrefs.show7dTotal && (
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.sum7d.toFixed(1)}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>{t('tot7d')}</Text>
                </View>
              )}
              {statsPrefs.show7dAvg && (
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.avg7d.toFixed(1)}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>{t('avg7d')}</Text>
                </View>
              )}
            </View>

            <View style={[styles.statsRow, { marginTop: 10 }]}>
              {statsPrefs.showMonthTotal && (
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.sumMonth.toFixed(1)}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>{t('totMonth')}</Text>
                </View>
              )}
              {statsPrefs.showMonthAvg && (
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.avgMonth.toFixed(1)}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>{t('avgMonth')}</Text>
                </View>
              )}
            </View>

            {statsPrefs.showPeriod && (
              <View style={[styles.statsRow, { marginTop: 10 }]}>
                <View style={[styles.statBox, { backgroundColor: colors.card, flexDirection: 'row', gap: 12 }]}>
                  <Ionicons name="time-outline" size={22} color={colors.primary} />
                  <View>
                    <Text style={[styles.statValue, { color: colors.text, fontSize: 15 }]}>{stats.peakPeriodLabel}</Text>
                    <Text style={[styles.statLabel, { color: colors.text }]}>{t('peak7d')}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {viewDate.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <CalendarView viewMode={viewMode} colors={colors} calendarDays={calendarDays} dailyData={dailyData} onDayPress={setSelectedDay} />
        </ScrollView>

        <LogDetailSheet selectedDay={selectedDay} onClose={() => setSelectedDay(null)} logs={filteredLogs} colors={colors} deleteLog={deleteLog} />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#88888820', borderRadius: 25, padding: 4, flex: 1, marginLeft: 15 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  modeText: { fontSize: 13, fontWeight: '800' },
  analyticsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 20, marginVertical: 8 },
  analyticsLinkContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  linkTitle: { fontSize: 14, fontWeight: '800' },
  linkSub: { fontSize: 10, marginTop: 1 },
  statsGrid: { marginVertical: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  monthLabel: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});