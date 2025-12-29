import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type LogEntry = { id: string; amount: number; time: string; type: 'cig' | 'other'; manual?: boolean; };
type DayDetail = { cigTotal: number; otherTotal: number; logs: LogEntry[] };
type DailyData = { [date: string]: DayDetail };
type YearlyArchive = { [year: string]: { cigAvg: number; otherAvg: number; totalDaysRecorded: number } };

type DataContextType = {
  dailyData: DailyData;
  addFraction: (amount: number, type: 'cig' | 'other', customDate?: string, manualTime?: string) => void;
  deleteLog: (dateStr: string, logId: string) => void;
  archives: YearlyArchive;
  isLoading: boolean;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Removed useTheme() here. We always save in 24h format now.
  
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [archives, setArchives] = useState<YearlyArchive>({});
  const [isLoading, setIsLoading] = useState(true);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getCurrentYear = () => new Date().getFullYear().toString();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const storedDaily = await AsyncStorage.getItem('dailyData_v3');
      const storedArchives = await AsyncStorage.getItem('yearlyArchives_v3');

      let parsedDaily: DailyData = storedDaily ? JSON.parse(storedDaily) : {};
      let parsedArchives: YearlyArchive = storedArchives ? JSON.parse(storedArchives) : {};

      const currentYear = getCurrentYear();
      const yearsInDaily = Object.keys(parsedDaily).map(date => date.split('-')[0]);
      const oldYears = yearsInDaily.filter(y => y !== currentYear);

      if (oldYears.length > 0) {
        oldYears.forEach(year => {
          if (parsedArchives[year]) return;

          const daysOfYear = Object.entries(parsedDaily).filter(([date]) => date.startsWith(year));
          const totalDays = daysOfYear.length;

          if (totalDays > 0) {
            const totalCig = daysOfYear.reduce((acc, [, data]) => acc + data.cigTotal, 0);
            const totalOther = daysOfYear.reduce((acc, [, data]) => acc + data.otherTotal, 0);

            parsedArchives[year] = {
              cigAvg: parseFloat((totalCig / totalDays).toFixed(2)),
              otherAvg: parseFloat((totalOther / totalDays).toFixed(2)),
              totalDaysRecorded: totalDays
            };
          }
          daysOfYear.forEach(([date]) => delete parsedDaily[date]);
        });
        await AsyncStorage.setItem('dailyData_v3', JSON.stringify(parsedDaily));
        await AsyncStorage.setItem('yearlyArchives_v3', JSON.stringify(parsedArchives));
      }

      setDailyData(parsedDaily);
      setArchives(parsedArchives);
    } finally { setIsLoading(false); }
  };

  const addFraction = async (amount: number, type: 'cig' | 'other', customDate?: string, manualTime?: string) => {
    const today = customDate || getTodayStr();
    const isManualAction = !!customDate;

    const current = dailyData[today] || { cigTotal: 0, otherTotal: 0, logs: [] };

    let timeString = manualTime;

    if (!timeString) {
      // ALWAYS generate 24h format (HH:MM) for storage
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      timeString = `${hours}:${minutes}`;
    }

    const newLog: LogEntry = {
      id: Date.now().toString(),
      amount,
      time: timeString, // Stored as "14:30" regardless of settings
      type,
      manual: isManualAction
    };

    const updatedLogs = [...current.logs, newLog];

    const newData = {
      ...dailyData,
      [today]: {
        cigTotal: type === 'cig' ? parseFloat((current.cigTotal + amount).toFixed(2)) : current.cigTotal,
        otherTotal: type === 'other' ? parseFloat((current.otherTotal + amount).toFixed(2)) : current.otherTotal,
        logs: updatedLogs
      }
    };

    setDailyData(newData);
    await AsyncStorage.setItem('dailyData_v3', JSON.stringify(newData));
  };

  const deleteLog = async (dateStr: string, logId: string) => {
    const dayData = dailyData[dateStr];
    if (!dayData) return;

    const filteredLogs = dayData.logs.filter(l => l.id !== logId);

    const newCigTotal = filteredLogs.filter(l => l.type === 'cig').reduce((acc, curr) => acc + curr.amount, 0);
    const newOtherTotal = filteredLogs.filter(l => l.type === 'other').reduce((acc, curr) => acc + curr.amount, 0);

    const newData = {
      ...dailyData,
      [dateStr]: {
        cigTotal: parseFloat(newCigTotal.toFixed(2)),
        otherTotal: parseFloat(newOtherTotal.toFixed(2)),
        logs: filteredLogs
      }
    };

    setDailyData(newData);
    await AsyncStorage.setItem('dailyData_v3', JSON.stringify(newData));
  };

  return (
    <DataContext.Provider value={{ dailyData, addFraction, deleteLog, archives, isLoading }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};