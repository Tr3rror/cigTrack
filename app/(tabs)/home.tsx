import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { useData } from '@/C_Custom/DataContext';
import { useTheme } from '@/C_Custom/ThemeContext';
import { CalendarView } from '@/C_Custom/CalendarView';
import { LogDetailSheet } from '@/C_Custom/LogDetailSheet';

export default function Home() {
  const { colors, statsPrefs, isDark } = useTheme();
  const { dailyData, deleteLog, archives } = useData();
  const router = useRouter();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cig' | 'other'>('cig');
  const [viewDate, setViewDate] = useState(new Date());

  // --- Helpers ---
  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  // --- Statistics Logic (Standard 7d & Month) ---
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    
    let sum7d = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const data = dailyData[dStr];
      if (data) sum7d += viewMode === 'cig' ? data.cigTotal : data.otherTotal;
    }

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

  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

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

  return (
    <PaperProvider theme={{ ...paperTheme, colors: { ...paperTheme.colors, primary: colors.primary } }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={30} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.modeToggle}>
              <TouchableOpacity 
                onPress={() => setViewMode('cig')} 
                style={[styles.modeBtn, viewMode === 'cig' && { backgroundColor: colors.primary }]}
              >
                  <Text style={[styles.modeText, { color: viewMode === 'cig' ? '#FFF' : colors.text }]}>🚬 Sigarette</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setViewMode('other')} 
                style={[styles.modeBtn, viewMode === 'other' && { backgroundColor: colors.primary }]}
              >
                  <Text style={[styles.modeText, { color: viewMode === 'other' ? '#FFF' : colors.text }]}>✨ Altro</Text>
              </TouchableOpacity>
          </View>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* NAVIGATION TO PERIOD ANALYTICS */}
          <TouchableOpacity 
            style={[styles.analyticsLink, { backgroundColor: colors.card }]} 
            onPress={() => router.push('/PeriodAnalytics')}
          >
            <View style={styles.analyticsLinkContent}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="stats-chart" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.linkTitle, { color: colors.text }]}>Analisi Periodo</Text>
                <Text style={[styles.linkSub, { color: colors.accent }]}>Scegli un intervallo e vedi i picchi</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.accent} />
          </TouchableOpacity>

          {/* STANDARD STATS GRID */}
          <View style={styles.statsGrid}>
             <View style={styles.statsRow}>
                {statsPrefs.show7dTotal && (
                  <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.sum7d.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.accent }]}>TOT 7GG</Text>
                  </View>
                )}
                {statsPrefs.show7dAvg && (
                  <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.avg7d.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.accent }]}>MEDIA 7GG</Text>
                  </View>
                )}
             </View>
             
             <View style={[styles.statsRow, { marginTop: 12 }]}>
                {statsPrefs.showMonthTotal && (
                  <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.sumMonth.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.accent }]}>TOT MESE</Text>
                  </View>
                )}
                {statsPrefs.showMonthAvg && (
                  <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.avgMonth.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.accent }]}>MEDIA MESE</Text>
                  </View>
                )}
             </View>
          </View>

          {/* CALENDAR CONTROLS */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <CalendarView
            viewMode={viewMode}
            colors={colors}
            calendarDays={calendarDays}
            dailyData={dailyData}
            onDayPress={setSelectedDay}
          />

        </ScrollView>

        <LogDetailSheet 
          selectedDay={selectedDay} 
          onClose={() => setSelectedDay(null)} 
          logs={filteredLogs} 
          colors={colors} 
          deleteLog={deleteLog} 
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 15 
  },
  modeToggle: { 
    flexDirection: 'row', 
    backgroundColor: '#33333315', 
    borderRadius: 25, 
    padding: 4,
    flex: 1,
    marginHorizontal: 20
  },
  modeBtn: { 
    flex: 1, 
    paddingVertical: 8, 
    borderRadius: 20, 
    alignItems: 'center' 
  },
  modeText: { fontSize: 13, fontWeight: 'bold' },
  
  // Analytics Link Card
  analyticsLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderRadius: 20, 
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  analyticsLinkContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  linkTitle: { fontSize: 15, fontWeight: '800' },
  linkSub: { fontSize: 11, marginTop: 2 },

  // Stats Grid
  statsGrid: { marginVertical: 15 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { 
    flex: 1, 
    padding: 18, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },

  // Calendar
  calendarHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 25, 
    marginBottom: 15 
  },
  monthLabel: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});