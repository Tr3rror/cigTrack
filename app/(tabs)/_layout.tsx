import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,    // Hides the top title/header
        tabBarStyle: { display: 'none' }, // Hides the bottom tab bar
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="modal" />
    </Tabs>
  );
}