// App.tsx - Modern React Native 0.79.5 compatible without Firebase
// ✅ FIXES: Firebase completely removed and replaced with modern service architecture
// ✅ FIXES: Modern audio and question services integrated
// console.log: "Modern App.tsx with Firebase removed and enhanced service integration"

import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, Alert, AppState } from 'react-native';
import SoundService from './src/services/SoundService';
import QuestionService from './src/services/QuestionService';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import LoadingScreen from './src/components/common/LoadingScreen';
import ErrorScreen from './src/components/common/ErrorScreen';
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

interface AppInitializationState {
  isInitializing: boolean;
  initializationComplete: boolean;
  services: {
    sound: 'success' | 'failed' | 'pending';
    questions: 'success' | 'failed' | 'pending';
  };
  criticalError: string | null;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppInitializationState>({
    isInitializing: true,
    initializationComplete: false,
    services: {
      sound: 'pending',
      questions: 'pending',
    },
    criticalError: null,
  });

  // Handle app state changes with RN 0.79.5 compatibility
  const handleAppStateChange = useCallback((nextAppState: string) => {
    console.log('📱 [Modern App] App state changed to:', nextAppState);
    
    if (nextAppState === 'background') {
      // Pause music when app goes to background
      SoundService.pauseMusic().catch(error => {
        console.log('⚠️ [Modern App] Failed to pause music on background:', error);
      });
    } else if (nextAppState === 'active') {
      // Resume music when app becomes active (optional)
      // Note: We don't auto-resume music as it might be annoying to users
      console.log('📱 [Modern App] App became active');
    }
  }, []);

  // Initialize app services
  const initializeApp = useCallback(async () => {
    console.log('🚀 [Modern App] Starting app initialization...');
    
    try {
      setAppState(prev => ({ ...prev, isInitializing: true }));

      // Initialize Sound Service
      console.log('🔊 [Modern App] Initializing SoundService...');
      setAppState(prev => ({ 
        ...prev, 
        services: { ...prev.services, sound: 'pending' } 
      }));
      
      try {
        const soundReady = await SoundService.initialize();
        if (soundReady) {
          console.log('✅ [Modern App] SoundService initialized successfully');
          setAppState(prev => ({ 
            ...prev, 
            services: { ...prev.services, sound: 'success' } 
          }));
        } else {
          console.log('⚠️ [Modern App] SoundService failed to initialize, continuing without audio');
          setAppState(prev => ({ 
            ...prev, 
            services: { ...prev.services, sound: 'failed' } 
          }));
        }
      } catch (soundError: any) {
        console.log('❌ [Modern App] SoundService initialization error:', soundError?.message || soundError);
        setAppState(prev => ({ 
          ...prev, 
          services: { ...prev.services, sound: 'failed' } 
        }));
      }

      // Initialize Question Service
      console.log('📚 [Modern App] Initializing QuestionService...');
      setAppState(prev => ({ 
        ...prev, 
        services: { ...prev.services, questions: 'pending' } 
      }));
      
      try {
        await QuestionService.initialize();
        const serviceStatus = QuestionService.getServiceStatus();
        
        if (serviceStatus.initialized && serviceStatus.totalQuestions > 0) {
          console.log('✅ [Modern App] QuestionService initialized successfully with', serviceStatus.totalQuestions, 'questions');
          setAppState(prev => ({ 
            ...prev, 
            services: { ...prev.services, questions: 'success' } 
          }));
        } else {
          throw new Error(`QuestionService initialization incomplete: ${JSON.stringify(serviceStatus)}`);
        }
      } catch (questionsError: any) {
        console.log('❌ [Modern App] QuestionService initialization error:', questionsError?.message || questionsError);
        setAppState(prev => ({ 
          ...prev, 
          services: { ...prev.services, questions: 'failed' },
          criticalError: 'Failed to load questions. The app may not function properly.'
        }));
      }

      // Complete initialization
      const allServices = {
        sound: appState.services.sound,
        questions: appState.services.questions,
      };
      
      const criticalServicesFailed = allServices.questions === 'failed';
      
      if (criticalServicesFailed) {
        console.log('🚨 [Modern App] Critical services failed, showing error state');
        setAppState(prev => ({ 
          ...prev,
          isInitializing: false,
          initializationComplete: false,
          criticalError: 'Failed to initialize critical app services. Please restart the app.'
        }));
      } else {
        console.log('🎉 [Modern App] App initialization completed successfully');
        setAppState(prev => ({ 
          ...prev,
          isInitializing: false,
          initializationComplete: true,
          criticalError: null
        }));
      }

    } catch (error: any) {
      console.log('❌ [Modern App] App initialization failed:', error?.message || error);
      setAppState(prev => ({ 
        ...prev,
        isInitializing: false,
        initializationComplete: false,
        criticalError: `App initialization failed: ${error?.message || 'Unknown error'}`
      }));
    }
  }, []);

  // Setup app state listener
  useEffect(() => {
    console.log('📱 [Modern App] Setting up app state listener');
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      console.log('📱 [Modern App] Cleaning up app state listener');
      subscription?.remove();
    };
  }, [handleAppStateChange]);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Show error screen if critical error
  if (appState.criticalError) {
    return (
      <ErrorBoundary>
        <ErrorScreen 
          message={appState.criticalError} 
          onRetry={initializeApp}
        />
      </ErrorBoundary>
    );
  }

  // Show loading screen during initialization
  if (appState.isInitializing) {
    return (
      <ErrorBoundary>
        <LoadingScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="DailyGoals" component={DailyGoalsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default App;