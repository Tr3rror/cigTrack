import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LogDetailSheet = ({ selectedDay, onClose, logs, colors, deleteLog }: any) => {
  if (!selectedDay) return null;

  return (
    <Modal visible={!!selectedDay} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Transparent area at the top to tap and close */}
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
        
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Visual Slider Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.accent + '44' }]} />
          </View>

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Dettagli Giorno</Text>
              <Text style={[styles.dateSub, { color: colors.accent }]}>{selectedDay}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {logs.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.accent }]}>Nessuna registrazione per questa categoria.</Text>
            ) : (
              logs.map((log: any, index: number) => (
                <View key={index} style={[styles.logRow, { borderBottomColor: colors.background }]}>
                  <View style={styles.logMain}>
                    <Text style={[styles.logTime, { color: colors.text }]}>{log.time}</Text>
                    {log.comment && <Text style={[styles.logComment, { color: colors.accent }]}>{log.comment}</Text>}
                  </View>
                  <View style={styles.logRight}>
                    <Text style={[styles.logAmount, { color: colors.primary }]}>+{log.amount}</Text>
                    <TouchableOpacity onPress={() => deleteLog(selectedDay, log.date)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={20} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
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
  dismissArea: { flex: 1 },
  sheet: { 
    height: '60%', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 20
  },
  handleContainer: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 5, borderRadius: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900' },
  dateSub: { fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  logMain: { flex: 1 },
  logTime: { fontSize: 16, fontWeight: '700' },
  logComment: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  logRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  logAmount: { fontSize: 18, fontWeight: '900' },
  deleteBtn: { padding: 5 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 14 }
});