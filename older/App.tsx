import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

const App: React.FC = () => {
  useEffect(() => {
    // Set status bar style
    StatusBar.setBarStyle('dark-content', true);
  }, []);
  
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;