import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';
import { CalendarView } from '@/C_Custom/CalendarView';
import { LogDetailSheet } from '@/C_Custom/LogDetailSheet';

export default function Home() {
  const { colors } = useTheme();
  const { dailyData, deleteLog } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cig' | 'other'>('cig');
  const [viewDate, setViewDate] = useState(new Date());

  // Navigation Logic
  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  // Logic: Last 7 Days Statistics
  const stats7Days = useMemo(() => {
    let total = 0;
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (dailyData[ds]) {
        total += viewMode === 'cig' ? dailyData[ds].cigTotal : dailyData[ds].otherTotal;
      }
    }
    return { total: total.toFixed(1), avg: (total / 7).toFixed(2) };
  }, [dailyData, viewMode]);

  // Logic: Generate days for the current viewed month
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => 
      `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    );
  }, [viewDate]);

  // Logic: Previous Year Average for New Year's Eve
  const lastYearAvg = useMemo(() => {
    const prevYear = new Date().getFullYear() - 1;
    let total = 0;
    let daysWithData = 0;
    Object.keys(dailyData).forEach(date => {
      if (date.startsWith(`${prevYear}`)) {
        total += viewMode === 'cig' ? dailyData[date].cigTotal : dailyData[date].otherTotal;
        daysWithData++;
      }
    });
    return daysWithData > 0 ? (total / daysWithData).toFixed(2) : null;
  }, [dailyData, viewMode]);

  const filteredLogs = useMemo(() => {
    if (!selectedDay || !dailyData[selectedDay]) return [];
    return dailyData[selectedDay].logs.filter((l) => l.type === viewMode);
  }, [selectedDay, dailyData, viewMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Statistiche</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 140 }} // Space to scroll past fixed buttons
      >
        {/* Toggle Mode */}
        <View style={styles.toggleContainer}>
          {(['cig', 'other'] as const).map((m) => (
            <TouchableOpacity 
              key={m} 
              style={[styles.toggleBtn, { backgroundColor: viewMode === m ? colors.primary : colors.card }]} 
              onPress={() => setViewMode(m)}
            >
              <Text style={{ color: viewMode === m ? '#FFF' : colors.text, fontWeight: '900' }}>
                {m === 'cig' ? 'SIGARETTE 🚬' : 'ALTRO ✨'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 7-Day Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statLabel, { color: colors.accent }]}>TOTALE 7gg</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats7Days.total}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statLabel, { color: colors.accent }]}>MEDIA 7gg</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats7Days.avg}</Text>
          </View>
        </View>

        {/* Month Label */}
        <View style={styles.monthLabelContainer}>
          <Text style={[styles.monthLabel, { color: colors.primary }]}>
            {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase()}
          </Text>
        </View>

        {/* Calendar Grid */}
        <CalendarView
          viewMode={viewMode}
          colors={colors}
          calendarDays={calendarDays}
          dailyData={dailyData}
          onDayPress={setSelectedDay}
        />

        {/* New Year's Eve Card */}
        <View style={[styles.newYearCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <Text style={[styles.newYearTitle, { color: colors.text }]}>🎄 CAPODANNO</Text>
          <Text style={[styles.newYearText, { color: colors.accent }]}>
            {lastYearAvg ? `L'anno scorso la tua media era di ${lastYearAvg} al giorno.` : "Aspetteremo capodanno 🎇"}
          </Text>
        </View>
      </ScrollView>

      {/* FIXED NAVIGATION BUTTONS */}
      <View style={[styles.fixedNav, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.primary }]} 
          onPress={() => changeMonth(-1)}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>PREC.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.primary }]} 
          onPress={() => changeMonth(1)}
        >
          <Text style={[styles.navText, { color: colors.primary }]}>SUCC.</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <LogDetailSheet selectedDay={selectedDay} onClose={() => setSelectedDay(null)} logs={filteredLogs} colors={colors} deleteLog={deleteLog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  title: { fontSize: 22, fontWeight: '900' },
  toggleContainer: { flexDirection: 'row', marginBottom: 15, borderRadius: 15, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: 15, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  statBox: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: '900' },
  monthLabelContainer: { height: 35, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  newYearCard: { padding: 18, borderRadius: 15, borderLeftWidth: 5 },
  newYearTitle: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  newYearText: { fontSize: 13, fontStyle: 'italic' },
  fixedNav: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  navBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 50, borderWidth: 2, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  navText: { fontWeight: '800', marginHorizontal: 4 }
});