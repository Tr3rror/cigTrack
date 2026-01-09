import React, { useState } from 'react';
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Dimensions 
} from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';
import { useTheme } from '@/C_Custom/ThemeContext';

const { width } = Dimensions.get('window');

interface Props {
  label: string;
  currentColor: string;
  onSelect: (color: string) => void;
  labelColor: string;
}

export const ColorPickerModal = ({ label, currentColor, onSelect, labelColor }: Props) => {
  const { colors } = useTheme(); 
  const [modalVisible, setModalVisible] = useState(false);
  const [tempColor, setTempColor] = useState(currentColor);

  const handleColorChange = (color: string) => {
    setTempColor(color);
  };

  const handleConfirm = () => {
    onSelect(tempColor);
    setModalVisible(false);
  };

  return (
    <View style={styles.pickerRow}>
      <Text style={[styles.pickerLabel, { color: labelColor }]}>{label}</Text>
      <TouchableOpacity 
        onPress={() => {
          setTempColor(currentColor);
          setModalVisible(true);
        }} 
        style={[styles.previewCircle, { backgroundColor: currentColor }]} 
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Scegli Colore {label}</Text>
            
            <View style={styles.wheelWrapper}>
              <ColorPicker
                color={tempColor}
                onColorChangeComplete={handleColorChange}
                thumbSize={30}
                sliderSize={30}
                noSnap={true}
                row={false}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.text + '15' }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>ANNULLA</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.primary }]} 
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>CONFERMA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#8881', 
    padding: 15, 
    borderRadius: 20 
  },
  pickerLabel: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  previewCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#FFF', elevation: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    width: width * 0.9, 
    height: 450,
    borderRadius: 30, 
    padding: 25, 
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  wheelWrapper: { width: '100%', flex: 1, paddingVertical: 20 },
  buttonRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  cancelText: { fontWeight: 'bold', opacity: 0.7 },
  confirmText: { color: '#FFF', fontWeight: 'bold' },
});