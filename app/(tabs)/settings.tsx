import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/C_Custom/ThemeContext';
import { ColorPickerModal } from '@/C_Custom/ColorPickerModal';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const {
    colors, setCustomColor, toggleTheme, isDark, saveThemeToSlot,
    applySlot, slots, activeSlot, resetTheme, timeFormat,
    toggleTimeFormat, isManualMode, toggleManualMode, statsPrefs,
    toggleStat, commentsEnabled, toggleComments, longCigsEnabled, 
    toggleLongCigs, language, changeLanguage
  } = useTheme();

  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState(activeSlot !== null ? activeSlot : 0);

  useEffect(() => {
    if (activeSlot !== null) setSelectedSlot(activeSlot);
  }, [activeSlot]);

  // Optimized Switch for visibility
  const RenderSwitch = ({ value, onValueChange }: any) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: isDark ? '#444' : '#D1D1D6', true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#3e3e3e"
      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
    />
  );

  const SettingItem = ({ label, sub, right }: any) => (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: colors.accent }]}>{sub}</Text>
      </View>
      {right}
    </View>
  );

  const MiniStat = ({ label, val, onToggle }: any) => (
    <View style={styles.miniStatItem}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <RenderSwitch value={val} onValueChange={onToggle} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <Ionicons name={isDark ? "sunny" : "moon"} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION: APPEARANCE (WYSIWYG Mode) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('appearance')}</Text>
          <View style={styles.pickersGrid}>
            
            {/* Primary: Row is Card Color, Label is Primary */}
            <ColorPickerModal 
              label={t('primary')} 
              currentColor={colors.primary} 
              onSelect={(c) => setCustomColor('primary', c)} 
              labelColor={colors.primary} 
              containerColor={colors.card}
            />

            {/* Background: Row background IS the theme background color */}
            <ColorPickerModal 
              label={t('bg')} 
              currentColor={colors.background} 
              onSelect={(c) => setCustomColor(isDark ? 'bgDark' : 'bgLight', c)} 
              labelColor={colors.text} 
              containerColor={colors.card} 
            />

            {/* Card: Row background IS the theme card color */}
            <ColorPickerModal 
              label={t('card')} 
              currentColor={colors.card} 
              onSelect={(c) => setCustomColor(isDark ? 'cardDark' : 'cardLight', c)} 
              labelColor={colors.text} 
              containerColor={colors.card} 
            />

            {/* Text: Row is Card Color, Label IS the theme text color */}
            <ColorPickerModal 
              label={t('text')} 
              currentColor={colors.text} 
              onSelect={(c) => setCustomColor(isDark ? 'textDark' : 'textLight', c)} 
              labelColor={colors.text} 
              containerColor={colors.card}
            />

            {/* Accent: Row is Card Color, Label IS the theme accent color */}
            <ColorPickerModal 
              label={t('accent')} 
              currentColor={colors.accent} 
              onSelect={(c) => setCustomColor('accent', c)} 
              labelColor={colors.accent} 
              containerColor={colors.card}
            />
          </View>
        </View>

        {/* SECTION: SLOTS */}
        <View style={styles.slotsSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('slots')}</Text>
          <View style={styles.slotsRow}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => { setSelectedSlot(i); if(slots[i]) applySlot(i); }}
                style={[styles.slotCard, { 
                    backgroundColor: colors.card, 
                    borderColor: selectedSlot === i ? colors.primary : colors.accent + '22' 
                }]}
              >
                <View style={[styles.slotIndicator, { backgroundColor: slots[i]?.primary || (isDark ? '#333' : '#CCC') }]} />
                <Text style={[styles.slotText, { color: colors.text }]}>SLOT {i + 1}</Text>
                {!slots[i] && <Text style={[styles.emptyText, {color: colors.accent}]}>{t('empty')}</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={() => Alert.alert(t('reset'), "", [{text: "No"}, {text: "Yes", onPress: resetTheme}])}>
            <Text style={[styles.resetText, { color: colors.accent }]}>{t('reset')}</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION: LANGUAGE & FEATURES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('features')}</Text>
          
          <View style={[styles.prefRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.prefLabel, { color: colors.text }]}>{t('lang')}</Text>
            <View style={styles.langToggle}>
              <TouchableOpacity onPress={() => changeLanguage('it')}><Text style={[styles.langText, { color: language === 'it' ? colors.primary : colors.accent }]}>ITA</Text></TouchableOpacity>
              <View style={[styles.vDivider, { backgroundColor: colors.accent + '44' }]} />
              <TouchableOpacity onPress={() => changeLanguage('en')}><Text style={[styles.langText, { color: language === 'en' ? colors.primary : colors.accent }]}>ENG</Text></TouchableOpacity>
            </View>
          </View>

          <View style={[styles.prefRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.prefLabel, { color: colors.text }]}>{t('timeFmt')}</Text>
            <TouchableOpacity onPress={toggleTimeFormat} style={[styles.toggleBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.toggleBadgeText}>{timeFormat}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.prefRow, { backgroundColor: colors.card }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.prefLabel, { color: colors.text }]}>{t('comments')}</Text>
              <Text style={[styles.subText, { color: colors.accent }]}>{t('commentsSub')}</Text>
            </View>
            <RenderSwitch value={commentsEnabled} onValueChange={toggleComments} />
          </View>

          <View style={[styles.prefRow, { backgroundColor: colors.card }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.prefLabel, { color: colors.text }]}>{t('longCigs')}</Text>
              <Text style={[styles.subText, { color: colors.accent }]}>{t('longCigsSub')}</Text>
            </View>
            <RenderSwitch value={longCigsEnabled} onValueChange={toggleLongCigs} />
          </View>

          <TouchableOpacity style={[styles.prefRow, { backgroundColor: colors.card }]} onPress={toggleManualMode}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefLabel, { color: colors.text }]}>{t('dayChange')}</Text>
              <Text style={[styles.subText, { color: colors.accent }]}>{isManualMode ? t('manual') : t('auto')}</Text>
            </View>
            <Ionicons name={isManualMode ? "hand-right" : "sync"} size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* SECTION: HOME STATS GRID */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('homeStats')}</Text>
          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <SettingItem 
              label={t('peak')} 
              sub={t('peakSub')} 
              right={<RenderSwitch value={statsPrefs.showPeriod} onValueChange={() => toggleStat('showPeriod')} />} 
            />
            <View style={[styles.gridStats, { borderTopColor: colors.accent + '22' }]}>
              <MiniStat label={t('tot7d')} val={statsPrefs.show7dTotal} onToggle={() => toggleStat('show7dTotal')} />
              <MiniStat label={t('avg7d')} val={statsPrefs.show7dAvg} onToggle={() => toggleStat('show7dAvg')} />
              <MiniStat label={t('totMonth')} val={statsPrefs.showMonthTotal} onToggle={() => toggleStat('showMonthTotal')} />
              <MiniStat label={t('avgMonth')} val={statsPrefs.showMonthAvg} onToggle={() => toggleStat('showMonthAvg')} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.accent + '22' }]}>
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
          onPress={async () => { await saveThemeToSlot(selectedSlot); Alert.alert("Success"); }}
        >
          <Text style={styles.saveBtnText}>{t('saveSlot')} {selectedSlot + 1}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  themeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  title: { fontSize: 22, fontWeight: '900' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1.5 },
  pickersGrid: { gap: 10 },
  slotsSection: { marginBottom: 25 },
  slotsRow: { flexDirection: 'row', gap: 10 },
  slotCard: { flex: 1, padding: 12, borderRadius: 18, borderWidth: 2, alignItems: 'center' },
  slotIndicator: { width: 20, height: 20, borderRadius: 10, marginBottom: 6 },
  slotText: { fontSize: 10, fontWeight: '900' },
  emptyText: { fontSize: 9, fontWeight: '600' },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 10 },
  prefLabel: { fontWeight: '800', fontSize: 15 },
  subText: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langText: { fontSize: 13, fontWeight: '900' },
  vDivider: { width: 2, height: 14 },
  toggleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  toggleBadgeText: { color: 'white', fontWeight: '900', fontSize: 11 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  rowLabel: { fontSize: 16, fontWeight: '800' },
  rowSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statsContainer: { padding: 16, borderRadius: 22 },
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  miniStatItem: { width: '50%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 4 },
  resetBtn: { alignSelf: 'center', marginTop: 20 },
  resetText: { fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
  bottomContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
  saveBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});