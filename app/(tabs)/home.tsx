import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';
import { CalendarView } from '@/C_Custom/CalendarView';
import { LogDetailSheet } from '@/C_Custom/LogDetailSheet';

const { width } = Dimensions.get('window');

export default function Home() {
  const { colors, statsPrefs } = useTheme();
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

  // Logic: Statistics Calculation for the Grid
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    
    // 7 Days
    let sum7d = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const data = dailyData[dStr];
      if (data) {
        sum7d += viewMode === 'cig' ? data.cigTotal : data.otherTotal;
      }
    }

    // Month
    let sumMonth = 0;
    Object.keys(dailyData).forEach(key => {
      if (key.startsWith(currentMonthPrefix)) {
        sumMonth += viewMode === 'cig' ? dailyData[key].cigTotal : dailyData[key].otherTotal;
      }
    });

    const dayOfMonth = today.getDate();
    return {
      sum7d,
      avg7d: sum7d / 7,
      sumMonth,
      avgMonth: dayOfMonth > 0 ? sumMonth / dayOfMonth : 0
    };
  }, [dailyData, viewMode]);

  // Logic: Prepare active stats based on user switches
  const activeStats = useMemo(() => {
    const list = [];
    if (statsPrefs.show7dTotal) list.push({ label: 'Tot 7gg', value: stats.sum7d.toFixed(1), isMonth: false });
    if (statsPrefs.show7dAvg)   list.push({ label: 'Media 7gg', value: stats.avg7d.toFixed(1), isMonth: false });
    if (statsPrefs.showMonthTotal) list.push({ label: 'Tot Mese', value: stats.sumMonth.toFixed(1), isMonth: true });
    if (statsPrefs.showMonthAvg)   list.push({ label: 'Media Mese', value: stats.avgMonth.toFixed(1), isMonth: true });
    return list;
  }, [statsPrefs, stats]);

  // Logic: Generate days for the current viewed month
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => 
      `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    );
  }, [viewDate]);

  // Logic: Previous Year Average
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

  // --- Grid Component ---
  const SmartStatsGrid = ({ activeStats, colors }: { activeStats: any[], colors: any }) => {
    if (activeStats.length === 0) return null;
  
    const StatBox = ({ item }: any) => (
      <View style={[styles.statBox, { backgroundColor: colors.card }]}>
        <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
        <Text style={[styles.statLabel, { color: colors.accent }]}>{item.label}</Text>
      </View>
    );
  
    if (activeStats.length === 1) {
      return (
        <View style={styles.statsContainer}>
          <StatBox item={activeStats[0]} />
        </View>
      );
    }
  
    if (activeStats.length === 2) {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatBox item={activeStats[0]} />
            <View style={{ width: 10 }} />
            <StatBox item={activeStats[1]} />
          </View>
        </View>
      );
    }
  
    if (activeStats.length === 3) {
      const monthItems = activeStats.filter(i => i.isMonth);
      const dayItems = activeStats.filter(i => !i.isMonth);
      const isTwoMonth = monthItems.length === 2;
      return (
        <View style={styles.statsContainer}>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
             <StatBox item={isTwoMonth ? dayItems[0] : monthItems[0]} />
          </View>
          <View style={styles.statsRow}>
             <StatBox item={isTwoMonth ? monthItems[0] : dayItems[0]} />
             <View style={{ width: 10 }} />
             <StatBox item={isTwoMonth ? monthItems[1] : dayItems[1]} />
          </View>
        </View>
      );
    }
  
    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statsRow, { marginBottom: 10 }]}>
           <StatBox item={activeStats[0]} />
           <View style={{ width: 10 }} />
           <StatBox item={activeStats[1]} />
        </View>
        <View style={styles.statsRow}>
           <StatBox item={activeStats[2]} />
           <View style={{ width: 10 }} />
           <StatBox item={activeStats[3]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Statistiche</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
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

        <SmartStatsGrid activeStats={activeStats} colors={colors} />

        <View style={styles.monthLabelContainer}>
          <Text style={[styles.monthLabel, { color: colors.primary }]}>
            {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase()}
          </Text>
        </View>

        <CalendarView
          viewMode={viewMode}
          colors={colors}
          calendarDays={calendarDays}
          dailyData={dailyData}
          onDayPress={setSelectedDay}
        />

        <View style={[styles.newYearCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <Text style={[styles.newYearTitle, { color: colors.text }]}>🎄 CAPODANNO</Text>
          <Text style={[styles.newYearText, { color: colors.accent }]}>
            {lastYearAvg ? `L'anno scorso la tua media era di ${lastYearAvg} al giorno.` : "Aspetteremo capodanno 🎇"}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.fixedNav, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>PREC.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={() => changeMonth(1)}>
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
  toggleContainer: { flexDirection: 'row', marginBottom: 20, borderRadius: 15, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: 15, alignItems: 'center' },
  monthLabelContainer: { height: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  monthLabel: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  newYearCard: { padding: 18, borderRadius: 15, borderLeftWidth: 5, marginTop: 20 },
  newYearTitle: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  newYearText: { fontSize: 13, fontStyle: 'italic' },
  fixedNav: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  navBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 50, borderWidth: 2, elevation: 4 },
  navText: { fontWeight: '800', marginHorizontal: 4 },
  statsContainer: { width: '100%', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.7 }
});