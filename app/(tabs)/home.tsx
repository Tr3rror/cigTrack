import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useData } from '../../C_Custom/DataContext';
import { useTheme } from '../../C_Custom/ThemeContext';

export default function Home() {
  const { colors } = useTheme();
  const { dailyData, deleteLog } = useData();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Statistiche</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mese Corrente</Text>
        <View style={styles.calendarGrid}>
          {calendarDays.map((dateStr) => {
            const data = dailyData[dateStr];
            return (
              <TouchableOpacity 
                key={dateStr} 
                style={[styles.dayCell, { backgroundColor: colors.card, borderColor: data ? colors.primary : 'transparent' }]}
                onPress={() => setSelectedDay(dateStr)}
              >
                <Text style={[styles.dayNumber, { color: colors.accent }]}>{dateStr.split('-')[2]}</Text>
                {data && (
                  <View style={styles.miniStats}>
                    <Text style={{ fontSize: 9, color: colors.primary }}>C:{data.cigTotal.toFixed(0)}</Text>
                    <Text style={{ fontSize: 9, color: colors.accent }}>O:{data.otherTotal.toFixed(0)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Modal visible={!!selectedDay} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Dettaglio {selectedDay}</Text>
                <TouchableOpacity onPress={() => setSelectedDay(null)}>
                  <Ionicons name="close-circle" size={32} color={colors.accent} />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                {dailyData[selectedDay!]?.logs.length ? (
                  dailyData[selectedDay!]?.logs.map((log) => (
                    <View key={log.id} style={styles.logRow}>
                      <View>
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                          {log.type === 'cig' ? '🚬' : '✨'} {log.amount.toFixed(2)}
                        </Text>
                        <Text style={{ color: colors.accent, fontSize: 12 }}>alle {log.time}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => deleteLog(selectedDay!, log.id)}
                        style={styles.trashBtn}
                      >
                        <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.accent, textAlign: 'center', marginTop: 30 }}>Nessun dato salvato.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, marginBottom: 15, fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCell: { width: '18%', aspectRatio: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  dayNumber: { fontSize: 10, position: 'absolute', top: 4, left: 6 },
  miniStats: { marginTop: 10, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { height: '60%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#8883' },
  trashBtn: { padding: 8, backgroundColor: '#E74C3C15', borderRadius: 10 }
});