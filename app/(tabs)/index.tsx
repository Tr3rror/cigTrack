import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useData } from '../../C_Custom/DataContext';
import { useTheme } from '../../C_Custom/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { dailyData, addFraction } = useData();
  
  const [mode, setMode] = useState<'cig' | 'other'>('cig');
  const [smokedPercentage, setSmokedPercentage] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayData = dailyData[todayStr] || { cigTotal: 0, otherTotal: 0 };
  const displayCount = mode === 'cig' ? todayData.cigTotal : todayData.otherTotal;

  const cigWidth = width * 0.85;
  const filterWidth = cigWidth * 0.25;
  const bodyWidth = cigWidth - filterWidth;

  const handlePress = (evt: any) => {
    const locX = evt.nativeEvent.locationX;
    if (locX < filterWidth) return setSmokedPercentage(0);
    let p = ((locX - filterWidth) / bodyWidth) * 100;
    setSmokedPercentage(Math.round(Math.min(100, Math.max(0, p))));
  };

  const handleAction = () => {
    const finalAmount = smokedPercentage === 0 ? 1 : smokedPercentage / 100;
    addFraction(finalAmount, mode);
    setSmokedPercentage(0);
  };

  return (
    // SafeAreaView protegge il contenuto dal "notch" e dalla barra di stato
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        
        {/* Header con spazio dinamico per la barra di stato */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.push('/settings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Aumenta l'area cliccabile
          >
            <Ionicons name="settings-outline" size={28} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.logo, { color: colors.primary }]}>CigTrack</Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/home')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="bar-chart-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.primary + '33' }]}>
            <View style={styles.scoreRow}>
              <View style={styles.arrowSlot}>
                  {mode === 'other' && (
                  <TouchableOpacity onPress={() => setMode('cig')}>
                      <Ionicons name="chevron-back" size={32} color={colors.primary} />
                  </TouchableOpacity>
                  )}
              </View>

              <View style={styles.scoreContent}>
                <Text style={[styles.label, { color: colors.accent }]}>
                  {mode === 'cig' ? "Fumate oggi" : "Qualcosa altro"}
                </Text>
                <Text style={[styles.count, { color: colors.text }]}>{displayCount.toFixed(2)}</Text>
              </View>

              <View style={styles.arrowSlot}>
                  {mode === 'cig' && (
                  <TouchableOpacity onPress={() => setMode('other')}>
                      <Ionicons name="chevron-forward" size={32} color={colors.primary} />
                  </TouchableOpacity>
                  )}
              </View>
            </View>
          </View>

          <View style={styles.interactionArea}>
              <Text style={[styles.perc, { color: colors.text }]}>
                  {smokedPercentage === 0 ? "Default: 100%" : `${smokedPercentage}% selezionato`}
              </Text>
              
              <TouchableOpacity activeOpacity={1} onPress={handlePress} style={styles.cigContainer}>
                <Svg width={cigWidth} height={70}>
                    <Rect x="0" y="5" width={filterWidth} height={60} fill={colors.filter} rx={12} />
                    <Rect x={filterWidth} y="5" width={bodyWidth} height={60} fill={isDark ? "#333" : "#E0E0E0"} rx={12} />
                    <Rect x={filterWidth} y="5" width={(bodyWidth * smokedPercentage) / 100} height={60} fill={colors.primary} rx={2} />
                </Svg>
              </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleAction}
          >
            <Text style={styles.saveButtonText}>SALVA SESSIONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    // Padding extra per Android dove SafeAreaView non sempre gestisce la StatusBar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: 60,
    // Eliminato il marginTop eccessivo perché gestito da safeArea
  },
  logo: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scoreCard: { paddingVertical: 20, borderRadius: 25, width: '100%', elevation: 4, borderWidth: 1, marginBottom: height * 0.05 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  arrowSlot: { width: 40, alignItems: 'center' },
  scoreContent: { alignItems: 'center' },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  count: { fontSize: 56, fontWeight: 'bold' },
  interactionArea: { alignItems: 'center', width: '100%' },
  perc: { fontSize: 15, fontWeight: '500', opacity: 0.7, marginBottom: 10 },
  cigContainer: { marginVertical: 10 },
  footer: { paddingBottom: 30 },
  saveButton: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%' },
  saveButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 }
});