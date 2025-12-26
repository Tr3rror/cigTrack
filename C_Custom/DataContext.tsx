import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type LogEntry = { id: string; amount: number; time: string; type: 'cig' | 'other' };
type DayDetail = { cigTotal: number; otherTotal: number; logs: LogEntry[] };
type DailyData = { [date: string]: DayDetail };
type YearlyArchive = { [year: string]: { cigTotal: number; otherTotal: number } };

type DataContextType = {
  dailyData: DailyData;
  addFraction: (amount: number, type: 'cig' | 'other') => void;
  deleteLog: (dateStr: string, logId: string) => void;
  archives: YearlyArchive;
  isLoading: boolean;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [archives, setArchives] = useState<YearlyArchive>({});
  const [isLoading, setIsLoading] = useState(true);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const storedDaily = await AsyncStorage.getItem('dailyData_v3');
      const storedArchives = await AsyncStorage.getItem('yearlyArchives_v3');
      if (storedDaily) setDailyData(JSON.parse(storedDaily));
      if (storedArchives) setArchives(JSON.parse(storedArchives));
    } finally { setIsLoading(false); }
  };

  const addFraction = async (amount: number, type: 'cig' | 'other') => {
    const today = getTodayStr();
    const current = dailyData[today] || { cigTotal: 0, otherTotal: 0, logs: [] };
    
    const newLog: LogEntry = { 
      id: Date.now().toString(), 
      amount, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      type 
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
    
    // Ricalcolo totale esatto dai log rimanenti
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