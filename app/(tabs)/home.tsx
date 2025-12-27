import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useRef } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
// ✅ Using correct SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../C_Custom/DataContext';
import { useTheme } from '../../C_Custom/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// SNAP POINTS (Distance from the BOTTOM of the screen)
const SNAP_EXPANDED = SCREEN_HEIGHT * 0.9;
const SNAP_MID = SCREEN_HEIGHT * 0.6;
const SNAP_COLLAPSED = 0; 

export default function Home() {
  const { colors } = useTheme();
  const { dailyData, deleteLog } = useData();
  const router = useRouter();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cig' | 'other'>('cig');

  /* ---------------- BOTTOM SHEET ANIMATION ---------------- */
  // We start at 0 (bottom of screen)
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const animateTo = (to: number) => {
    lastOffset.current = to;
    Animated.spring(translateY, {
      toValue: -to, // Negative because we move UP from the bottom
      tension: 60,
      friction: 10,
      useNativeDriver: true, // Performance boost
    }).start();
  };

  const resetModal = () => {
    // Animate down then close
    Animated.timing(translateY, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedDay(null);
      lastOffset.current = 0;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        // g.dy is positive when dragging DOWN
        let newPos = lastOffset.current - g.dy;
        if (newPos > SNAP_EXPANDED) newPos = SNAP_EXPANDED + (newPos - SNAP_EXPANDED) * 0.2;
        translateY.setValue(-newPos);
      },
      onPanResponderRelease: (_, g) => {
        const current = lastOffset.current - g.dy;
        const velocity = g.vy;

        if (velocity < -0.5) {
          animateTo(SNAP_EXPANDED);
        } else if (velocity > 0.5) {
          if (current < SNAP_MID) resetModal();
          else animateTo(SNAP_MID);
        } else {
          if (current > (SNAP_MID + SNAP_EXPANDED) / 2) animateTo(SNAP_EXPANDED);
          else if (current > SNAP_MID / 2) animateTo(SNAP_MID);
          else resetModal();
        }
      },
    })
  ).current;

  /* ---------------- DATA LOGIC ---------------- */
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const calendarDays = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }), [daysInMonth]);

  const getWeeklyStats = () => {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayData = dailyData[dStr];
      if (dayData) total += viewMode === 'cig' ? dayData.cigTotal : dayData.otherTotal;
    }
    return total.toFixed(1);
  };

  const filteredLogsForModal = useMemo(() => {
    if (!selectedDay || !dailyData[selectedDay]) return [];
    return dailyData[selectedDay].logs.filter((l) => l.type === viewMode);
  }, [selectedDay, dailyData, viewMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Statistiche</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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

        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.statTitle, { color: colors.accent }]}>TOTALE ULTIMI 7 GIORNI</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{getWeeklyStats()}</Text>
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((d) => {
            const data = dailyData[d];
            const value = data ? (viewMode === 'cig' ? data.cigTotal : data.otherTotal) : 0;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayCell, { backgroundColor: colors.card, borderColor: value ? colors.primary : '#3333', borderWidth: value ? 2 : 1 }]}
                onPress={() => {
                  setSelectedDay(d);
                  animateTo(SNAP_MID);
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 10 }}>{d.split('-')[2]}</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: value ? colors.text : colors.accent, opacity: value ? 1 : 0.3 }}>
                  {value || '-'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ---------------- BOTTOM SHEET ---------------- */}
      <Modal visible={!!selectedDay} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={resetModal} />
          
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                height: SNAP_EXPANDED,
                transform: [{ translateY }], // Animating negative Y moves it up
                bottom: -SNAP_EXPANDED, // Position it initially off-screen at the bottom
              },
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
              <Text style={{ color: colors.accent, fontWeight: 'bold', marginTop: 10 }}>{selectedDay}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
              {filteredLogsForModal.length > 0 ? (
                filteredLogsForModal.map((log) => (
                  <View key={log.id} style={styles.logRow}>
                    <View>
                        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>{log.amount.toFixed(2)}</Text>
                        <Text style={{ color: colors.accent, fontSize: 12 }}>{log.time}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteLog(selectedDay!, log.id)} style={styles.trashBtn}>
                      <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.accent, textAlign: 'center', marginTop: 40 }}>Nessun dato</Text>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  title: { fontSize: 22, fontWeight: '900' },
  toggleContainer: { flexDirection: 'row', marginVertical: 20, borderRadius: 15, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: 15, alignItems: 'center' },
  statBox: { padding: 25, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  statTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  statValue: { fontSize: 42, fontWeight: '900' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  dayCell: { width: '17%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dragHandle: { alignItems: 'center', paddingTop: 15, paddingBottom: 20 },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#8885', borderRadius: 10 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#8882' },
  trashBtn: { padding: 10, backgroundColor: '#E74C3C15', borderRadius: 10 }
});