import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { DataProvider } from './DataContext';
import { ThemeProvider } from './ThemeContext';

import Home from '../app/(tabs)/home';
import Index from '../app/(tabs)/index';
import Settings from '../app/(tabs)/settings';

const Stack = createStackNavigator();

export default function App() {
  return (
    <DataProvider> 
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Index" component={Index} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Settings" component={Settings} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </DataProvider>
  );
}