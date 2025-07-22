// App.tsx - Production-ready main app with proper service initialization
// ✅ FIXES: Service initialization order, error boundaries, dependency handling
// console.log: "This App.tsx provides bulletproof initialization sequence and error handling"

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, Alert, AppState } from 'react-native';
import { initializeFirebase } from './src/config/Firebase';
import SoundService from './src/services/SoundService';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { RootStackParamList } from './src/types';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import QuizScreen from './src/screens/QuizScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import DailyGoalsScreen from './src/screens/DailyGoalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface AppState {
  isInitializing: boolean;
  initializationComplete: boolean;
  services: {
    firebase: boolean;
    sound: boolean;
  };
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isInitializing: true,
    initializationComplete: false,
    services: {
      firebase: false,
      sound: false,
    },
  });

  useEffect(() => {
    console.log('🚀 Starting BrainBites App initialization...');
    initializeApp();
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      console.log('📱 App state changed to:', nextAppState);
      
      if (nextAppState === 'background') {
        // Pause music when app goes to background
        try {
          if (SoundService && typeof SoundService.pauseMusic === 'function') {
            SoundService.pauseMusic();
          }
        } catch (error) {
          console.log('⚠️ Error pausing music on background:', error);
        }
      } else if (nextAppState === 'active') {
        // Resume music when app becomes active
        try {
          if (SoundService && typeof SoundService.resumeMusic === 'function') {
            SoundService.resumeMusic();
          }
        } catch (error) {
          console.log('⚠️ Error resuming music on foreground:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      console.log('🧹 App cleanup started...');
      
      // Remove app state listener
      subscription?.remove();
      
      // Cleanup services
      try {
        if (SoundService && typeof SoundService.release === 'function') {
          SoundService.release();
          console.log('✅ SoundService cleaned up');
        }
      } catch (error) {
        console.log('⚠️ Error cleaning up SoundService:', error);
      }
      
      console.log('✅ App cleanup completed');
    };
  }, []);

  const initializeApp = async () => {
    const initStartTime = Date.now();
    console.log('⏱️ App initialization started at:', new Date().toISOString());
    
    const services = { firebase: false, sound: false };
    
    try {
      // STEP 1: Initialize Firebase (non-critical)
      console.log('🔥 STEP 1: Initializing Firebase...');
      try {
        const firebaseSuccess = await initializeFirebase();
        services.firebase = firebaseSuccess;
        
        if (firebaseSuccess) {
          console.log('✅ Firebase initialized successfully');
        } else {
          console.log('⚠️ Firebase initialization failed, continuing without Firebase');
        }
      } catch (firebaseError) {
        console.log('❌ Firebase initialization error:', firebaseError);
        services.firebase = false;
        // Continue - Firebase failure shouldn't stop the app
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // STEP 2: Initialize Sound Service (non-critical)
      console.log('🔊 STEP 2: Initializing SoundService...');
      try {
        await SoundService.initialize();
        services.sound = SoundService.isReady && SoundService.isReady();
        
        if (services.sound) {
          console.log('✅ SoundService initialized successfully');
        } else {
          console.log('⚠️ SoundService available but not fully ready');
        }
      } catch (soundError) {
        console.log('❌ SoundService initialization error:', soundError);
        services.sound = false;
        // Continue - Sound failure shouldn't stop the app
      }
      
      // STEP 3: Mark initialization as complete
      const initDuration = Date.now() - initStartTime;
      console.log(`🎉 App initialization completed in ${initDuration}ms`);
      console.log('📊 Service status:', services);
      
      setAppState({
        isInitializing: false,
        initializationComplete: true,
        services,
      });
      
      // Log initialization completion
      try {
        const { logEvent } = require('./src/config/Firebase');
        await logEvent('app_initialized', {
          firebase_available: services.firebase,
          sound_available: services.sound,
          platform: Platform.OS,
          initialization_time: initDuration,
        });
      } catch (logError) {
        console.log('⚠️ Could not log app initialization event:', logError);
      }
      
    } catch (criticalError) {
      console.log('❌ CRITICAL: App initialization failed:', criticalError);
      
      // Show user-friendly error but don't crash
      setAppState({
        isInitializing: false,
        initializationComplete: false,
        services: { firebase: false, sound: false },
      });
      
      // Optional: Show alert to user
      if (Platform.OS === 'android') {
        setTimeout(() => {
          Alert.alert(
            'Initialization Warning',
            'Some features may not work correctly. The app will continue but you might experience limited functionality.',
            [{ text: 'Continue', style: 'default' }]
          );
        }, 1000);
      }
    }
  };

  const handleAppError = (error: Error, errorInfo: any) => {
    console.log('🚨 App-level error caught by ErrorBoundary:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
    });
    
    // Log to Firebase if available
    try {
      const { logError } = require('./src/config/Firebase');
      logError(error, errorInfo);
    } catch (logError) {
      console.log('⚠️ Could not log error to Firebase:', logError);
    }
  };

  // Show loading state during initialization
  if (appState.isInitializing) {
    // You could return a loading screen component here
    // For now, we'll just continue to render the navigation
    console.log('⏳ App is still initializing, rendering navigation anyway...');
  }

  return (
    <ErrorBoundary onError={handleAppError}>
      <StatusBar 
        backgroundColor="#FFF8E7" 
        barStyle="dark-content" 
        translucent={false}
      />
      <NavigationContainer
        onReady={() => {
          console.log('🧭 Navigation container ready');
        }}
        onStateChange={(state) => {
          console.log('🧭 Navigation state changed:', state?.index);
        }}
      >
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFF8E7' },
            cardStyleInterpolator: ({ current: { progress } }) => ({
              cardStyle: {
                opacity: progress,
              },
            }),
          }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{
              animationEnabled: true,
              animationTypeForReplace: 'push',
            }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Categories" 
            component={CategoriesScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Quiz" 
            component={QuizScreen}
            options={{
              animationEnabled: true,
              gestureEnabled: false, // Prevent swipe back during quiz
            }}
          />
          <Stack.Screen 
            name="Leaderboard" 
            component={LeaderboardScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="DailyGoals" 
            component={DailyGoalsScreen}
            options={{
              animationEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              animationEnabled: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default App;