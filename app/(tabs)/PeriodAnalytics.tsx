import React, { useState, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerModal } from 'react-native-paper-dates';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';

export default function PeriodAnalytics() {
  const { colors, isDark } = useTheme();
  const { dailyData } = useData();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'cig' | 'other'>('cig');
  const [range, setRange] = useState<{ startDate: Date | undefined; endDate: Date | undefined }>({ startDate: undefined, endDate: undefined });
  const [open, setOpen] = useState(false);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    if (!range.startDate || !range.endDate) return null;
    
    let total = 0;
    let daysWithLogs = 0;
    const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    
    const start = range.startDate.getTime();
    const end = range.endDate.getTime();

    Object.entries(dailyData).forEach(([dateStr, data]) => {
      const dTime = new Date(dateStr).getTime();
      if (dTime >= start && dTime <= end) {
        const val = viewMode === 'cig' ? data.cigTotal : data.otherTotal;
        total += val;
        if (val > 0) daysWithLogs++;

        // Calculate Peak times within this specific range
        data.logs.forEach(log => {
          if (log.type !== viewMode) return;
          const hour = parseInt(log.time.split(':')[0], 10);
          if (hour >= 0 && hour < 8) buckets.night += log.amount;
          else if (hour >= 8 && hour < 12) buckets.morning += log.amount;
          else if (hour >= 12 && hour < 17) buckets.afternoon += log.amount;
          else buckets.evening += log.amount;
        });
      }
    });

    const maxVal = Math.max(buckets.morning, buckets.afternoon, buckets.evening, buckets.night);
    let peakLabel = "Nessun dato";
    if (maxVal > 0) {
      if (buckets.night === maxVal) peakLabel = "NOTTE FONDA (00-08)";
      else if (buckets.morning === maxVal) peakLabel = "MATTINA (08-12)";
      else if (buckets.afternoon === maxVal) peakLabel = "POMERIGGIO (12-17)";
      else peakLabel = "SERA (17-24)";
    }

    return { total, avg: daysWithLogs ? total / daysWithLogs : 0, peakLabel, peakVal: maxVal };
  }, [dailyData, viewMode, range]);

  const onConfirm = useCallback(({ startDate, endDate }: any) => {
    setOpen(false);
    setRange({ startDate, endDate });
  }, []);

  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={{ ...paperTheme, colors: { ...paperTheme.colors, primary: colors.primary } }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Analisi Periodo</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Range Picker Button */}
        <TouchableOpacity 
          style={[styles.rangePickerBtn, { backgroundColor: colors.primary }]} 
          onPress={() => setOpen(true)}
        >
          <Ionicons name="calendar" size={20} color="white" />
          <Text style={styles.rangePickerText}>
            {range.startDate ? "MODIFICA PERIODO" : "SCEGLI IL PERIODO"}
          </Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {stats ? (
            <View style={styles.resultsContainer}>
              <View style={styles.summaryRow}>
                <View style={[styles.mainStat, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total.toFixed(1)}</Text>
                  <Text style={[styles.statLabel, { color: colors.accent }]}>TOTALE UNITÀ</Text>
                </View>
                <View style={[styles.mainStat, { backgroundColor: colors.card }]}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stats.avg.toFixed(2)}</Text>
                  <Text style={[styles.statLabel, { color: colors.accent }]}>MEDIA GIORNALIERA</Text>
                </View>
              </View>

              {/* Peak Card Layout */}
              
              <View style={[styles.peakCard, { backgroundColor: colors.card }]}>
                <View style={styles.peakHeader}>
                  <Ionicons name="flame" size={24} color="#FF4500" />
                  <Text style={[styles.peakTitle, { color: colors.text }]}>Fascia di Picco</Text>
                </View>
                <Text style={[styles.peakTime, { color: colors.primary }]}>{stats.peakLabel}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: '100%' }]} />
                </View>
                <Text style={[styles.peakSub, { color: colors.accent }]}>
                  In questo periodo hai fumato {stats.peakVal.toFixed(1)} unità in questa fascia.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics" size={80} color={colors.accent + '44'} />
              <Text style={[styles.emptyText, { color: colors.accent }]}>Seleziona un intervallo di date per visualizzare le statistiche avanzate.</Text>
            </View>
          )}
        </ScrollView>

        <DatePickerModal
          locale="it"
          mode="range"
          visible={open}
          onDismiss={() => setOpen(false)}
          startDate={range.startDate}
          endDate={range.endDate}
          onConfirm={onConfirm}
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  rangePickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 55, 
    borderRadius: 16, 
    marginVertical: 20, 
    gap: 10,
    elevation: 4
  },
  rangePickerText: { color: 'white', fontWeight: '900', letterSpacing: 1 },
  resultsContainer: { gap: 15 },
  summaryRow: { flexDirection: 'row', gap: 15 },
  mainStat: { flex: 1, padding: 25, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  peakCard: { padding: 25, borderRadius: 24, gap: 10 },
  peakHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  peakTitle: { fontSize: 16, fontWeight: 'bold' },
  peakTime: { fontSize: 22, fontWeight: '900' },
  progressBarBg: { height: 8, width: '100%', backgroundColor: '#33333333', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  peakSub: { fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 20, lineHeight: 22 }
});