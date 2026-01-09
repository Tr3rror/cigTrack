import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,    
        tabBarStyle: { display: 'none' }, 
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="PeriodAnalytics" />
    </Tabs>
  );
}