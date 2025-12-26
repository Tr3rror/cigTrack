import { Stack } from 'expo-router';
// Update these paths to where you moved the files
import { DataProvider } from '../C_Custom/DataContext';
import { ThemeProvider } from '../C_Custom/ThemeContext'; 

export default function RootLayout() {
  return (
    <DataProvider>
      <ThemeProvider>
        <Stack>
          {/* This matches the (tabs) folder name */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </DataProvider>
  );
}