import React, { useRef, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_EXPANDED = SCREEN_HEIGHT * 0.9;
const SNAP_MID = SCREEN_HEIGHT * 0.6;

interface Props {
  selectedDay: string | null;
  onClose: () => void;
  logs: any[];
  colors: any;
  deleteLog: (day: string, id: string) => void;
}

export const LogDetailSheet = ({ selectedDay, onClose, logs, colors, deleteLog }: Props) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const animateTo = (to: number) => {
    lastOffset.current = to;
    Animated.spring(translateY, {
      toValue: -to,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (selectedDay) {
      animateTo(SNAP_MID);
    } else {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedDay]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        let newPos = lastOffset.current - g.dy;
        if (newPos > SNAP_EXPANDED) newPos = SNAP_EXPANDED + (newPos - SNAP_EXPANDED) * 0.2;
        translateY.setValue(-newPos);
      },
      onPanResponderRelease: (_, g) => {
        const current = lastOffset.current - g.dy;
        const velocity = g.vy;
        if (velocity < -0.5) animateTo(SNAP_EXPANDED);
        else if (velocity > 0.5) {
          if (current < SNAP_MID) onClose();
          else animateTo(SNAP_MID);
        } else {
          if (current > (SNAP_MID + SNAP_EXPANDED) / 2) animateTo(SNAP_EXPANDED);
          else if (current > SNAP_MID / 2) animateTo(SNAP_MID);
          else onClose();
        }
      },
    })
  ).current;

  return (
    <Modal visible={!!selectedDay} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              height: SNAP_EXPANDED,
              transform: [{ translateY }],
              bottom: -SNAP_EXPANDED,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
            <Text style={{ color: colors.accent, fontWeight: 'bold', marginTop: 10 }}>{selectedDay}</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {logs.length > 0 ? (
              logs.map((log) => (
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
  );
};

const styles = StyleSheet.create({
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