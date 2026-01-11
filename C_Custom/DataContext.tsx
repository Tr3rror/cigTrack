import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type LogEntry = {
  date: string;
  amount: number;
  time: string;
  type: 'cig' | 'other';
  comment?: string;
};

type DataContextType = {
  dailyData: DailyData;
  addFraction: (amount: number, type: 'cig' | 'other', customDate?: string, manualTime?: string, comment?: string) => void;
  deleteLog: (dateStr: string, logId: string) => void;
  isLoading: boolean;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

type DayDetail = { cigTotal: number; otherTotal: number; logs: LogEntry[] };
type DailyData = { [date: string]: DayDetail };

export function DataProvider({ children }: { children: React.ReactNode }) {

  const [dailyData, setDailyData] = useState<DailyData>({});
  const [isLoading, setIsLoading] = useState(true);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getCurrentYear = () => new Date().getFullYear().toString();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const storedDaily = await AsyncStorage.getItem('dailyData_v3');
      let parsedDaily: DailyData = storedDaily ? JSON.parse(storedDaily) : {};
      
      // start
      let hasChanges = false;
      Object.keys(parsedDaily).forEach(dateKey => {
        parsedDaily[dateKey].logs = parsedDaily[dateKey].logs.map(log => {
          if ((log as any).manual !== undefined) {
            const { manual, ...rest } = log as any; 
            hasChanges = true;
            return rest; 
          }
          return log;
        });
      });
      if (hasChanges) {
        await AsyncStorage.setItem('dailyData_v3', JSON.stringify(parsedDaily));
      }
      // end

      setDailyData(parsedDaily);
    } finally { setIsLoading(false); }
  };

  const addFraction = async (amount: number, type: 'cig' | 'other', customDate?: string, manualTime?: string, comment?: string) => {
    const todayStr = getTodayStr();
    const targetDate = customDate || todayStr; 
    
    const isManualAction = !!customDate; 
    const isManualPast = isManualAction && targetDate !== todayStr;

    let timeString = manualTime;
    if (!timeString) {
      const now = new Date();
      timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    const current = dailyData[targetDate] || { cigTotal: 0, otherTotal: 0, logs: [] };

    const newLog: LogEntry = {
      date: Date.now().toString(),
      amount,
      time: timeString,
      type,
      comment: comment || undefined
    };

    const combinedLogs = [...current.logs, newLog];

    let updatedLogs: LogEntry[];

    if (isManualPast) {
      updatedLogs = combinedLogs.sort((a, b) => {
        const getAdjustedMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          const adjustedHour = h < 8 ? h + 24 : h; 
          return adjustedHour * 60 + m;
        };

        return getAdjustedMinutes(a.time) - getAdjustedMinutes(b.time);
      });
    } else {
      updatedLogs = combinedLogs.sort((a, b) => a.time.localeCompare(b.time));
    }

    const newData = {
      ...dailyData,
      [targetDate]: {
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

    const filteredLogs = dayData.logs.filter(l => l.date !== logId);

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
    <DataContext.Provider value={{ dailyData, addFraction, deleteLog, isLoading }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};