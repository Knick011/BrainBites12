// App.tsx - RN 0.79.5 Compatible with All Critical Fixes Integrated
// ✅ FIXES: Integrates all RN 0.79.5 compatibility fixes
// ✅ FIXES: Proper initialization sequence with error handling
// console.log: "App.tsx with integrated RN 0.79.5 fixes and bulletproof initialization"

import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, Alert, AppState } from 'react-native';
import { initializeFirebase, debugFirebaseSetup } from './src/config/Firebase';
import SoundService from './src/services/SoundService';
import QuestionService from './src/services/QuestionService';
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

interface AppInitializationState {
  isInitializing: boolean;
  initializationComplete: boolean;
  services: {
    firebase: 'success' | 'failed' | 'pending';
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
      firebase: 'pending',
      sound: 'pending', 
      questions: 'pending',
    },
    criticalError: null,
  });

  // Handle app state changes with RN 0.79.5 compatibility
  const handleAppStateChange = useCallback((nextAppState: string) => {
    console.log('📱 [RN 0.79.5] App state changed to:', nextAppState);
    
    try {
      if (nextAppState === 'background') {
        // Pause music when app goes to background
        if (SoundService && typeof SoundService.pauseMusic === 'function') {
          SoundService.pauseMusic();
        }
      } else if (nextAppState === 'active') {
        // Resume music when app becomes active
        if (SoundService && typeof SoundService.resumeMusic === 'function') {
          SoundService.resumeMusic();
        }
      }
    } catch (error) {
      console.log('⚠️ [RN 0.79.5] Error handling app state change:', error);
    }
  }, []);

  // Initialize all services with RN 0.79.5 compatibility
  const initializeApp = useCallback(async () => {
    const initStartTime = Date.now();
    console.log('🚀 [RN 0.79.5] Starting BrainBites App initialization...');
    console.log('⏰ [RN 0.79.5] Initialization started at:', new Date().toISOString());
    
    const services = {
      firebase: 'pending' as const,
      sound: 'pending' as const,
      questions: 'pending' as const,
    };
    
    try {
      // STEP 1: Initialize Firebase (non-critical)
      console.log('🔥 [RN 0.79.5] STEP 1: Initializing Firebase...');
      try {
        const firebaseSuccess = await initializeFirebase();
        services.firebase = firebaseSuccess ? 'success' : 'failed';
        
        if (firebaseSuccess) {
          console.log('✅ [RN 0.79.5] Firebase initialized successfully');
        } else {
          console.log('⚠️ [RN 0.79.5] Firebase initialization failed, app will continue');
        }
      } catch (firebaseError: any) {
        console.log('❌ [RN 0.79.5] Firebase initialization error:', firebaseError?.message);
        services.firebase = 'failed';
        
        // Debug Firebase setup on failure
        if (__DEV__) {
          debugFirebaseSetup();
        }
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // STEP 2: Initialize Sound Service (non-critical)
      console.log('🔊 [RN 0.79.5] STEP 2: Initializing SoundService...');
      try {
        await SoundService.initialize();
        const soundReady = SoundService.isReady && SoundService.isReady();
        services.sound = soundReady ? 'success' : 'failed';
        
        if (soundReady) {
          console.log('✅ [RN 0.79.5] SoundService initialized successfully');
        } else {
          console.log('⚠️ [RN 0.79.5] SoundService initialized but not fully ready');
        }
        
        // Log sound service status for debugging
        if (__DEV__ && SoundService.getStatus) {
          console.log('🔍 [RN 0.79.5] SoundService status:', SoundService.getStatus());
        }
      } catch (soundError: any) {
        console.log('❌ [RN 0.79.5] SoundService initialization error:', soundError?.message);
        services.sound = 'failed';
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // STEP 3: Initialize Question Service (CRITICAL)
      console.log('📚 [RN 0.79.5] STEP 3: Initializing QuestionService...');
      try {
        await QuestionService.initialize();
        const questionsReady = QuestionService.isServiceReady && QuestionService.isServiceReady();
        services.questions = questionsReady ? 'success' : 'failed';
        
        if (questionsReady) {
          console.log('✅ [RN 0.79.5] QuestionService initialized successfully');
          console.log('📊 [RN 0.79.5] Total questions loaded:', QuestionService.getTotalQuestionCount());
        } else {
          console.log('❌ [RN 0.79.5] QuestionService not ready after initialization');
        }
        
        // Debug question service status
        if (__DEV__ && QuestionService.debugService) {
          QuestionService.debugService();
        }
      } catch (questionError: any) {
        console.log('❌ [RN 0.79.5] QuestionService initialization error:', questionError?.message);
        services.questions = 'failed';
        
        // Questions are critical - show user warning but don't fail completely
        console.log('🚨 [RN 0.79.5] CRITICAL: Questions failed to load - quiz functionality may be limited');
      }
      
      // STEP 4: Finalize initialization
      const initDuration = Date.now() - initStartTime;
      console.log(`🎉 [RN 0.79.5] App initialization completed in ${initDuration}ms`);
      console.log('📊 [RN 0.79.5] Final service status:', services);
      
      // Check if critical services are available
      const criticalServicesOk = services.questions === 'success';
      
      if (!criticalServicesOk) {
        console.log('⚠️ [RN 0.79.5] Some critical services failed, but app will continue');
      }
      
      setAppState({
        isInitializing: false,
        initializationComplete: true,
        services,
        criticalError: null,
      });
      
      // Log initialization completion to Firebase (if available)
      try {
        if (services.firebase === 'success') {
          const { logEvent } = require('./src/config/Firebase');
          await logEvent('app_initialized_rn_0795', {
            firebase_available: services.firebase === 'success',
            sound_available: services.sound === 'success',
            questions_available: services.questions === 'success',
            platform: Platform.OS,
            initialization_time: initDuration,
            rn_version: '0.79.5',
          });
        }
      } catch (logError) {
        console.log('⚠️ [RN 0.79.5] Could not log initialization event:', logError);
      }
      
    } catch (criticalError: any) {
      console.log('❌ [RN 0.79.5] CRITICAL: App initialization failed:', criticalError?.message);
      
      setAppState({
        isInitializing: false,
        initializationComplete: false,
        services: { firebase: 'failed', sound: 'failed', questions: 'failed' },
        criticalError: criticalError?.message || 'Unknown initialization error',
      });
      
      // Show user-friendly error after delay
      setTimeout(() => {
        Alert.alert(
          'Initialization Warning',
          'Some app features may not work correctly. You can still use the app, but functionality may be limited.',
          [{ text: 'Continue', style: 'default' }]
        );
      }, 1000);
    }
  }, []);

  // Main initialization effect
  useEffect(() => {
    console.log('🚀 [RN 0.79.5] App component mounted, starting initialization...');
    initializeApp();
    
    // Set up app state listener with RN 0.79.5 compatibility
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      console.log('🧹 [RN 0.79.5] App cleanup started...');
      
      // Remove app state listener
      if (subscription) {
        subscription.remove();
      }
      
      // Cleanup services
      try {
        if (SoundService && typeof SoundService.release === 'function') {
          SoundService.release();
          console.log('✅ [RN 0.79.5] SoundService cleaned up');
        }
      } catch (error) {
        console.log('⚠️ [RN 0.79.5] Error cleaning up SoundService:', error);
      }
      
      console.log('✅ [RN 0.79.5] App cleanup completed');
    };
  }, [initializeApp, handleAppStateChange]);

  // Error handler for ErrorBoundary
  const handleAppError = useCallback((error: Error, errorInfo: any) => {
    console.log('🚨 [RN 0.79.5] App-level error caught by ErrorBoundary:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
    });
    
    // Log to Firebase if available
    try {
      if (appState.services.firebase === 'success') {
        const { logError } = require('./src/config/Firebase');
        logError(error, {
          ...errorInfo,
          rn_version: '0.79.5',
          app_state: appState,
        });
      }
    } catch (logError) {
      console.log('⚠️ [RN 0.79.5] Could not log error to Firebase:', logError);
    }
  }, [appState]);

  // Navigation ready handler
  const handleNavigationReady = useCallback(() => {
    console.log('🧭 [RN 0.79.5] Navigation container ready');
    
    // Log initial screen view
    try {
      if (appState.services.firebase === 'success') {
        const { logScreenView } = require('./src/config/Firebase');
        logScreenView('Welcome').catch((error: any) => {
          console.log('⚠️ [RN 0.79.5] Could not log initial screen view:', error);
        });
      }
    } catch (error) {
      console.log('⚠️ [RN 0.79.5] Error logging initial screen view:', error);
    }
  }, [appState.services.firebase]);

  // Navigation state change handler  
  const handleNavigationStateChange = useCallback((state: any) => {
    console.log('🧭 [RN 0.79.5] Navigation state changed:', state?.index);
  }, []);

  return (
    <ErrorBoundary onError={handleAppError}>
      <StatusBar 
        backgroundColor="#FFF8E7" 
        barStyle="dark-content" 
        translucent={false}
      />
      <NavigationContainer
        onReady={handleNavigationReady}
        onStateChange={handleNavigationStateChange}
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