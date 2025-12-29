import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  viewMode: 'cig' | 'other';
  colors: any;
  calendarDays: string[];
  dailyData: any;
  onDayPress: (day: string) => void;
}

export const CalendarView = ({ viewMode, colors, calendarDays, dailyData, onDayPress }: Props) => {
  const totalSlots = 31; 
  const placeholders = Array.from({ length: totalSlots - calendarDays.length });

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarGrid}>
        {/* Render Actual Days */}
        {calendarDays.map((d) => {
          const data = dailyData[d];
          const value = data ? (viewMode === 'cig' ? data.cigTotal : data.otherTotal) : 0;
          return (
            <TouchableOpacity
              key={d}
              style={[
                styles.dayCell, 
                { 
                  backgroundColor: colors.card, 
                  borderColor: value ? colors.primary : '#3331', 
                  borderWidth: value ? 2 : 1 
                }
              ]}
              onPress={() => onDayPress(d)}
            >
              <Text style={{ color: colors.accent, fontSize: 10 }}>{d.split('-')[2]}</Text>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '900', 
                color: value ? colors.text : colors.accent, 
                opacity: value ? 1 : 0.2 
              }}>
                {value || '-'}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Render Placeholder Cells to maintain fixed height */}
        {placeholders.map((_, i) => (
          <View key={`placeholder-${i}`} style={[styles.dayCell, { backgroundColor: 'transparent' }]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: { width: '100%', marginTop: 5 },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    justifyContent: 'center' 
  },
  dayCell: { 
    width: '17.5%',
    aspectRatio: 1, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
});