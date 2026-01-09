import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LogEntry } from './DataContext';
import { useTheme } from './ThemeContext'; // Import useTheme

export const LogDetailSheet = ({ selectedDay, onClose, logs, colors, deleteLog }: any) => {
  const { timeFormat } = useTheme(); // Access timeFormat

  if (!selectedDay) return null;

  // Function to format time based on display preference
  const formatTimeForDisplay = (time24: string) => {
    if (timeFormat === '24h') return time24;
    
    let [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <Modal visible={!!selectedDay} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
               Dettagli {selectedDay.split('-')[2]}/{selectedDay.split('-')[1]}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={30} color={colors.accent} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {logs.length === 0 ? (
                <Text style={{color: colors.accent, textAlign: 'center', marginTop: 20}}>Nessun dato.</Text>
            ) : (
                logs.map((log: LogEntry) => (
                    <View key={log.id} style={[styles.logRow, { borderBottomColor: colors.accent + '33' }]}>
                        <View style={{flex: 1}}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                {/* Applied formatTimeForDisplay here */}
                                <Text style={[styles.time, { color: colors.text }]}>
                                  {formatTimeForDisplay(log.time)}
                                </Text>
                                <Text style={[styles.amount, { color: colors.primary }]}>+{log.amount.toFixed(2)}</Text>
                                {log.manual && <Text style={{fontSize: 9, color: colors.accent, marginLeft: 5}}>(MAN)</Text>}
                            </View>
                            {log.comment && (
                                <Text style={{color: colors.accent, fontSize: 12, fontStyle: 'italic', marginTop: 2}}>
                                    "{log.comment}"
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => deleteLog(selectedDay, log.id)}>
                            <Ionicons name="trash-outline" size={20} color={'#ff4444'} />
                        </TouchableOpacity>
                    </View>
                ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { height: '50%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  time: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  amount: { fontSize: 16, fontWeight: 'bold' }
});