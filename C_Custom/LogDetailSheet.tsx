import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TouchableWithoutFeedback, TouchableOpacity, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINTS = { CLOSED: 0, HALF: -SCREEN_HEIGHT * 0.5, FULL: -SCREEN_HEIGHT * 0.85 };
const THRESHOLDS = { CLOSE: -SCREEN_HEIGHT * 0.2, EXPAND: -SCREEN_HEIGHT * 0.65 };

const formatTime = (t24: string, fmt: '12h' | '24h') => {
  if (fmt === '24h') return t24;
  const [h, m] = t24.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const LogDetailSheet = ({ selectedDay, onClose, logs, colors, deleteLog, timeFormat }: any) => {
  const { t } = useTranslation();
  const translateY = useSharedValue(0);
  const context = useSharedValue(0);

  const performClose = useCallback(() => { if (onClose) onClose(); }, [onClose]);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SNAP_POINTS.CLOSED, { duration: 250 }, (finished) => {
      if (finished) scheduleOnRN(performClose);
    });
  }, [performClose, translateY]);

  useEffect(() => {
    const onBackPress = () => { if (selectedDay) { closeSheet(); return true; } return false; };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [selectedDay, closeSheet]);

  useEffect(() => {
    if (selectedDay) translateY.value = withTiming(SNAP_POINTS.HALF, { duration: 300, easing: Easing.out(Easing.cubic) });
    else translateY.value = SNAP_POINTS.CLOSED;
  }, [selectedDay, translateY]);

  const panGesture = Gesture.Pan()
    .onStart(() => { context.value = translateY.value; })
    .onUpdate((e) => { translateY.value = Math.max(SNAP_POINTS.FULL, Math.min(context.value + e.translationY, 0)); })
    .onEnd((e) => {
      if (e.velocityY > 1000 || translateY.value > THRESHOLDS.CLOSE) {
        translateY.value = withTiming(SNAP_POINTS.CLOSED, { duration: 200 }, (f) => { if (f) scheduleOnRN(performClose); });
      } else if (translateY.value < THRESHOLDS.EXPAND || e.velocityY < -1000) {
        translateY.value = withTiming(SNAP_POINTS.FULL, { duration: 300 });
      } else {
        translateY.value = withTiming(SNAP_POINTS.HALF, { duration: 300 });
      }
    });

  const rSheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const rOverlayStyle = useAnimatedStyle(() => ({ opacity: translateY.value < 0 ? 1 : 0 }));

  if (!selectedDay) return null;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={closeSheet}><Animated.View style={[styles.overlay, rOverlayStyle]} /></TouchableWithoutFeedback>
      <Animated.View style={[styles.sheet, { backgroundColor: colors.card }, rSheetStyle]}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.dragZone}>
            <View style={styles.handleContainer}><View style={[styles.handle, { backgroundColor: colors.accent + '44' }]} /></View>
            <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>{t('homeStats')}</Text><Text style={[styles.dateSub, { color: colors.accent }]}>{selectedDay}</Text></View>
          </View>
        </GestureDetector>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {logs.length === 0 ? <Text style={[styles.emptyText, { color: colors.accent }]}>{t('noneToday')}</Text> : logs.map((log: any, index: number) => (
            <View key={index} style={[styles.logRow, { borderBottomColor: colors.background }]}>
              <View style={{ flex: 1 }}><Text style={[styles.logTime, { color: colors.text }]}>{formatTime(log.time, timeFormat)}</Text>{log.comment && <Text style={[styles.logComment, { color: colors.accent }]}>{log.comment}</Text>}</View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}><Text style={[styles.logAmount, { color: colors.primary }]}>+{log.amount}</Text>
              <TouchableOpacity onPress={() => deleteLog(selectedDay, log.date)}><Ionicons name="trash-outline" size={20} color="#FF4444" /></TouchableOpacity></View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { height: SCREEN_HEIGHT, width: '100%', position: 'absolute', top: SCREEN_HEIGHT, borderTopLeftRadius: 32, borderTopRightRadius: 32, elevation: 24, overflow: 'hidden' },
  dragZone: { paddingHorizontal: 24 },
  handleContainer: { alignItems: 'center', paddingVertical: 16 },
  handle: { width: 48, height: 6, borderRadius: 3 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900' },
  dateSub: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: SCREEN_HEIGHT * 0.6 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1 },
  logTime: { fontSize: 17, fontWeight: '700' },
  logComment: { fontSize: 13, marginTop: 4, opacity: 0.6 },
  logAmount: { fontSize: 19, fontWeight: '900' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, opacity: 0.5 },
});