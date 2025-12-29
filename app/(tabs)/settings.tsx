import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/C_Custom/ThemeContext';
import { ColorPickerModal } from '@/C_Custom/ColorPickerModal';

export default function Settings() {
  const {
    colors,
    setCustomColor,
    toggleTheme,
    isDark,
    saveThemeToSlot,
    applySlot,
    slots,
    activeSlot,
    resetTheme,
    timeFormat,
    toggleTimeFormat,
    isManualMode,      
    toggleManualMode,
    statsPrefs,
    toggleStat
  } = useTheme();

  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState(activeSlot !== null ? activeSlot : 0);

  useEffect(() => {
    if (activeSlot !== null) setSelectedSlot(activeSlot);
  }, [activeSlot]);

  const handleSlotSelect = (index: number) => {
    setSelectedSlot(index);
    if (slots[index]) applySlot(index);
  };

  const handleSave = async () => {
    await saveThemeToSlot(selectedSlot);
    Alert.alert("Salvato", `Tema salvato nello Slot ${selectedSlot + 1}`);
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
        
        {/* Colors Section */}
        <View style={styles.pickersSection}>
          <ColorPickerModal label="Primario" currentColor={colors.primary} labelColor={colors.primary} onSelect={(c) => setCustomColor('primary', c)} />
          <ColorPickerModal label="Sfondo" currentColor={colors.background} labelColor={colors.text} onSelect={(c) => setCustomColor('background', c)} />
          <ColorPickerModal label="Accento" currentColor={colors.accent} labelColor={colors.accent} onSelect={(c) => setCustomColor('accent', c)} />
        </View>

        {/* Slots Section */}
        <View style={styles.slotsSection}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Slot Temi Salvati</Text>
          <View style={styles.slotsRow}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity key={i} onPress={() => handleSlotSelect(i)} style={[styles.slotCard, { backgroundColor: colors.card, borderColor: selectedSlot === i ? colors.primary : 'transparent' }]}>
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
        </View>

        {/* Preferences Section */}
        <View style={styles.prefsSection}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Preferenze</Text>
          
          {/* Time Format */}
          <TouchableOpacity style={[styles.prefRow, { backgroundColor: colors.card, marginBottom: 12 }]} onPress={toggleTimeFormat}>
            <View>
              <Text style={[styles.prefLabel, { color: colors.text }]}>Formato Orario</Text>
              <Text style={{ color: colors.accent, fontSize: 12 }}>
                {timeFormat === '24h' ? '24 Ore (14:30)' : '12 Ore (2:30 PM)'}
              </Text>
            </View>
            <View style={[styles.formatBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.formatBadgeText}>{timeFormat.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>

          {/* Manual Mode */}
          <TouchableOpacity style={[styles.prefRow, { backgroundColor: colors.card, marginBottom: 12 }]} onPress={toggleManualMode}>
            <View>
              <Text style={[styles.prefLabel, { color: colors.text }]}>Cambio Giorno</Text>
              <Text style={{ color: colors.accent, fontSize: 12 }}>
                {isManualMode ? 'Manuale (Scegli la data)' : 'Automatico (Data corrente)'}
              </Text>
            </View>
            <Ionicons name={isManualMode ? "hand-right" : "sync"} size={24} color={colors.primary} />
          </TouchableOpacity>

           {/* Stats Grid Switches */}
           <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.prefLabel, { color: colors.text, marginBottom: 15 }]}>Mostra Statistiche</Text>
              <View style={styles.grid2x2}>
                <View style={styles.gridItem}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Totale 7gg</Text>
                  <Switch 
                    value={statsPrefs.show7dTotal} 
                    onValueChange={() => toggleStat('show7dTotal')} 
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={'#f4f3f4'}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Media 7gg</Text>
                  <Switch 
                    value={statsPrefs.show7dAvg} 
                    onValueChange={() => toggleStat('show7dAvg')} 
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={'#f4f3f4'}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Totale Mese</Text>
                  <Switch 
                    value={statsPrefs.showMonthTotal} 
                    onValueChange={() => toggleStat('showMonthTotal')} 
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={'#f4f3f4'}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Media Mese</Text>
                  <Switch 
                    value={statsPrefs.showMonthAvg} 
                    onValueChange={() => toggleStat('showMonthAvg')} 
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={'#f4f3f4'}
                  />
                </View>
              </View>
           </View>
        </View>

      </ScrollView>

      <View style={[styles.bottomContainer, { borderTopColor: colors.accent + '33', backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>SALVA IN SLOT {selectedSlot + 1}</Text>
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
  slotsSection: { marginTop: 10, marginBottom: 10 }, 
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 15 },
  slotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  slotCard: { width: '31%', padding: 10, borderRadius: 15, alignItems: 'center', borderWidth: 2 },
  slotIndicator: { width: 30, height: 30, borderRadius: 15, marginBottom: 8 },
  slotText: { fontSize: 12, fontWeight: 'bold' },
  emptyText: { fontSize: 9, opacity: 0.5 },
  prefsSection: { marginBottom: 30, marginTop: 20 },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20
  },
  prefLabel: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  formatBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  formatBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  statsContainer: { padding: 20, borderRadius: 20 },
  grid2x2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  switchLabel: { fontSize: 12, fontWeight: '600' },

  actionsSection: { gap: 15, alignItems: 'center' },
  resetBtn: { padding: 15 },
  resetText: { fontSize: 12, fontWeight: 'bold', color: 'gray', textDecorationLine: 'underline' },
  bottomContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
  saveBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});