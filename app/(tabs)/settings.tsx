import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/C_Custom/ThemeContext';
import { ColorPickerModal } from '@/C_Custom/ColorPickerModal';

export default function Settings() {
  const {
    colors, setCustomColor, toggleTheme, isDark, saveThemeToSlot,
    applySlot, slots, activeSlot, resetTheme, timeFormat,
    toggleTimeFormat, isManualMode, toggleManualMode, statsPrefs,
    toggleStat, commentsEnabled, toggleComments, longCigsEnabled, toggleLongCigs
  } = useTheme();

  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState(activeSlot !== null ? activeSlot : 0);

  // Helper for Toggles to fix the scale error
  const RenderSwitch = ({ value, onValueChange }: any) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#767577', true: colors.primary }}
      style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
    />
  );

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

  // Internal Settings Helpers
  const SettingItem = ({ label, sub, right, colors }: any) => (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: colors.accent }]}>{sub}</Text>
      </View>
      {right}
    </View>
  );

  const MiniStat = ({ label, val, onToggle, colors }: any) => (
    <View style={styles.miniStatItem}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <Switch value={val} onValueChange={onToggle} style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }} trackColor={{ false: '#767577', true: colors.primary }} />
    </View>
  );

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
          <ColorPickerModal label="Primario" currentColor={colors.primary} labelColor={colors.primary} onSelect={(c) => setCustomColor('primary', c)} />
          <ColorPickerModal label="Sfondo" currentColor={colors.background} labelColor={colors.text} onSelect={(c) => setCustomColor('background', c)} />
          <ColorPickerModal label="Accento" currentColor={colors.accent} labelColor={colors.accent} onSelect={(c) => setCustomColor('accent', c)} />
        </View>

        <View style={styles.slotsSection}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Slot Temi Salvati</Text>
          <View style={styles.slotsRow}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSlotSelect(i)}
                style={[
                  styles.slotCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedSlot === i ? colors.primary : 'transparent'
                  }
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
        </View>

        <View style={styles.prefsSection}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Funzionalità</Text>

          <View style={[styles.prefRow, { backgroundColor: colors.card, marginBottom: 12 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Formato Orario (Display)</Text>
            <TouchableOpacity onPress={toggleTimeFormat} style={[styles.toggleBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.toggleBtnText}>{timeFormat === '24h' ? '24H' : '12H'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.prefRow, { backgroundColor: colors.card, marginBottom: 12 }]}>
            <View>
              <Text style={[styles.prefLabel, { color: colors.text }]}>Commenti</Text>
              <Text style={{ color: colors.accent, fontSize: 10 }}>Aggiungi note alle registrazioni</Text>
            </View>
            <Switch
              value={commentsEnabled}
              onValueChange={toggleComments}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          <View style={[styles.prefRow, { backgroundColor: colors.card, marginBottom: 12 }]}>
            <View>
              <Text style={[styles.prefLabel, { color: colors.text }]}>Sigarette Lunghe</Text>
              <Text style={{ color: colors.accent, fontSize: 10 }}>Max 120% (1.20) invece di 100%</Text>
            </View>
            <Switch
              value={longCigsEnabled}
              onValueChange={toggleLongCigs}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={[styles.prefRow, { backgroundColor: colors.card, marginBottom: 12 }]} onPress={toggleManualMode}>
            <View>
              <Text style={[styles.prefLabel, { color: colors.text }]}>Cambio Giorno</Text>
              <Text style={{ color: colors.accent, fontSize: 10 }}>
                {isManualMode ? 'Manuale (Scegli la data)' : 'Automatico (Data corrente)'}
              </Text>
            </View>
            <Ionicons name={isManualMode ? "hand-right" : "sync"} size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.prefsSection}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Statistiche in Home</Text>
          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <SettingItem label="Periodo di Picco" sub="Fascia oraria 7gg" right={<RenderSwitch value={statsPrefs.showPeriod} onValueChange={() => toggleStat('showPeriod')} />} colors={colors} />
              <View style={styles.gridStats}>
                <MiniStat label="Tot 7gg" val={statsPrefs.show7dTotal} onToggle={() => toggleStat('show7dTotal')} colors={colors} />
                <MiniStat label="Media 7gg" val={statsPrefs.show7dAvg} onToggle={() => toggleStat('show7dAvg')} colors={colors} />
                <MiniStat label="Tot Mese" val={statsPrefs.showMonthTotal} onToggle={() => toggleStat('showMonthTotal')} colors={colors} />
                <MiniStat label="Media Mese" val={statsPrefs.showMonthAvg} onToggle={() => toggleStat('showMonthAvg')} colors={colors} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '900' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5 },
  card: { borderRadius: 24, padding: 18, marginBottom: 25 },
  pickersRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#00000010', marginVertical: 15 },
  cardSubLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  slotsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  slotCard: { flex: 1, padding: 10, borderRadius: 15, borderWidth: 2, alignItems: 'center' },
  slotIndicator: { width: 22, height: 22, borderRadius: 11, marginBottom: 5 },
  slotText: { fontSize: 11, fontWeight: 'bold' },
  saveSlotBtn: { height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveSlotText: { color: 'white', fontWeight: '800', fontSize: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 16, fontWeight: '700' },
  rowSub: { fontSize: 11, opacity: 0.7 },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  miniBtnText: { color: 'white', fontSize: 10, fontWeight: '900' },
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, borderTopWidth: 1, borderTopColor: '#00000010', paddingTop: 10 },
  miniStatItem: { width: '50%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 5 },
  resetBtn: { alignSelf: 'center', marginTop: 10 },
  resetText: { color: 'gray', fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' },
  pickersSection: { gap: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 15 },
  prefsSection: { marginBottom: 30 },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15 },
  prefLabel: { fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  statsContainer: { padding: 15, borderRadius: 15 },
  grid2x2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  switchLabel: { fontSize: 11, fontWeight: '600' },
  actionsSection: { gap: 15, alignItems: 'center' },
  bottomContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
  saveBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  slotsSection: { marginTop: 10, marginBottom: 30 },
  emptyText: { fontSize: 9, opacity: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15 },
  label: { fontSize: 16, fontWeight: '600' },
  toggleBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  toggleBtnText: { color: 'white', fontWeight: 'bold' },
});