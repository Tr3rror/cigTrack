import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert, 
  Modal, 
  Dimensions 
} from 'react-native';
// ✅ THE MODERN FIX: Import SafeAreaView from the context library, NOT react-native
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../C_Custom/ThemeContext';

const { width } = Dimensions.get('window');

// Logic to convert HSL to Hex
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0').toUpperCase();
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Circular Picker Component
const CircularColorPicker = ({ label, currentColor, onSelect, labelColor }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(100);

  const wheelDots = Array.from({ length: 36 }).map((_, i) => {
    const angle = (i * 10) * (Math.PI / 180);
    const radius = 100;
    const x = radius * Math.cos(angle) + 110; 
    const y = radius * Math.sin(angle) + 110;
    return { hue: i * 10, x, y };
  });

  return (
    <View style={styles.pickerRow}>
      <Text style={[styles.pickerLabel, { color: labelColor }]}>{label}</Text>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)} 
        style={[styles.previewCircle, { backgroundColor: currentColor }]} 
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scegli Colore</Text>
            
            <View style={styles.wheelContainer}>
                {wheelDots.map((dot, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => { 
                            const hex = hslToHex(dot.hue, sat, 50);
                            setHue(dot.hue); 
                            onSelect(hex); 
                        }}
                        style={[
                            styles.wheelDot, 
                            { 
                                backgroundColor: `hsl(${dot.hue}, 100%, 50%)`,
                                left: dot.x, top: dot.y 
                            }
                        ]}
                    />
                ))}
                <View style={[styles.centerPreview, { backgroundColor: currentColor }]} />
            </View>

            <Text style={styles.sliderLabel}>Saturazione / Luminosità</Text>
            <View style={styles.sliderContainer}>
                {Array.from({ length: 10 }).map((_, i) => {
                    const val = i * 10;
                    return (
                        <TouchableOpacity 
                            key={i} 
                            style={[styles.sliderBlock, { backgroundColor: `hsl(${hue}, ${sat}%, ${val}%)` }]}
                            onPress={() => { onSelect(hslToHex(hue, sat, val)); }}
                        />
                    );
                })}
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.confirmText}>FATTO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function Settings() {
  const { colors, setCustomColor, toggleTheme, isDark, saveThemeToSlot, applySlot, slots, resetTheme } = useTheme();
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState(0);

  const handleSave = async () => {
    await saveThemeToSlot(selectedSlot);
    Alert.alert("Salvato", `Tema salvato nello Slot ${selectedSlot + 1}`);
  };

  const handleConfirmUse = () => {
      applySlot(selectedSlot);
      Alert.alert("Applicato", "Il tema è ora attivo.");
  };

  const handleReset = () => {
    Alert.alert("Reset", "Tornare al tema di default?", [
        { text: "Annulla" },
        { text: "Sì", onPress: () => resetTheme() }
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons name={isDark ? "sunny" : "moon"} size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.pickersSection}>
            <CircularColorPicker 
                label="Primario" 
                currentColor={colors.primary} 
                labelColor={colors.primary} 
                onSelect={(c: string) => setCustomColor('primary', c)} 
            />
            <CircularColorPicker 
                label="Sfondo" 
                currentColor={colors.background} 
                labelColor={colors.text} 
                onSelect={(c: string) => setCustomColor('background', c)} 
            />
            <CircularColorPicker 
                label="Accento" 
                currentColor={colors.accent} 
                labelColor={colors.accent} 
                onSelect={(c: string) => setCustomColor('accent', c)} 
            />
        </View>

        <View style={styles.slotsSection}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Slot Temi Salvati</Text>
          <View style={styles.slotsRow}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => setSelectedSlot(i)}
                style={[
                  styles.slotCard, 
                  { backgroundColor: colors.card, borderColor: selectedSlot === i ? colors.primary : 'transparent' }
                ]}
              >
                <View style={[styles.slotIndicator, { backgroundColor: slots[i]?.primary || '#888' }]} />
                <Text style={[styles.slotText, { color: colors.text }]}>Slot {i + 1}</Text>
                {!slots[i] && <Text style={styles.emptyText}>Vuoto</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetText}>RIPRISTINA DEFAULT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.useBtn, { backgroundColor: colors.card, borderColor: colors.primary }]} 
                onPress={handleConfirmUse}
            >
                <Text style={[styles.useBtnText, { color: colors.primary }]}>USA TEMA {selectedSlot + 1}</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Sticky Bottom Button Container */}
      <View style={[styles.bottomContainer, { borderTopColor: colors.accent + '33', backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>SALVA MODIFICHE IN SLOT {selectedSlot + 1}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  
  pickersSection: { gap: 20, marginBottom: 30 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#8881', padding: 15, borderRadius: 20 },
  pickerLabel: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  previewCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#FFF', elevation: 3 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.9, backgroundColor: '#FFF', borderRadius: 30, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  wheelContainer: { width: 250, height: 250, position: 'relative', marginBottom: 30 },
  wheelDot: { width: 30, height: 30, borderRadius: 15, position: 'absolute' },
  centerPreview: { position: 'absolute', width: 80, height: 80, borderRadius: 40, top: 85, left: 85, borderWidth: 4, borderColor: '#FFF', elevation: 5 },
  sliderContainer: { flexDirection: 'row', width: '100%', height: 40, borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  sliderBlock: { flex: 1, height: '100%' },
  sliderLabel: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#333', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 20 },
  confirmText: { color: '#FFF', fontWeight: 'bold' },

  slotsSection: { marginTop: 10, marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 15 },
  slotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  slotCard: { width: '31%', padding: 10, borderRadius: 15, alignItems: 'center', borderWidth: 2 },
  slotIndicator: { width: 30, height: 30, borderRadius: 15, marginBottom: 8 },
  slotText: { fontSize: 12, fontWeight: 'bold' },
  emptyText: { fontSize: 9, opacity: 0.5 },

  actionsSection: { gap: 15 },
  resetBtn: { padding: 15, alignItems: 'center' },
  resetText: { fontSize: 12, fontWeight: 'bold', color: 'gray', textDecorationLine: 'underline' },
  useBtn: { padding: 15, borderRadius: 15, borderWidth: 2, alignItems: 'center' },
  useBtnText: { fontWeight: 'bold', fontSize: 14 },

  bottomContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
  saveBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});