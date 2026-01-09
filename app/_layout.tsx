
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/C_Custom/ThemeContext';
import { DataProvider } from '@/C_Custom/DataContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DataProvider>
        <Stack screenOptions={{ headerShown: false }}>
        </Stack>
      </DataProvider>
    </ThemeProvider>
  );
}