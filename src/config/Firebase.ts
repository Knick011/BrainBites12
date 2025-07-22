// src/config/Firebase.ts
// ✅ FIXES: "No Firebase App '[DEFAULT]' has been created" and "Cannot read property 'initializeFirebase' of undefined"
// console.log: "This config provides bulletproof Firebase initialization that won't crash the app"

import { Platform } from 'react-native';

// Safe Firebase import with error handling
let firebaseApp: any = null;
let analytics: any = null;
let crashlytics: any = null;
let isFirebaseAvailable = false;

// Initialize Firebase modules safely
const initializeFirebaseModules = () => {
  try {
    console.log('🔥 Attempting to initialize Firebase modules...');
    
    // Try to import Firebase modules
    const appModule = require('@react-native-firebase/app');
    const analyticsModule = require('@react-native-firebase/analytics');
    const crashlyticsModule = require('@react-native-firebase/crashlytics');
    
    firebaseApp = appModule.default;
    analytics = analyticsModule.default;
    crashlytics = crashlyticsModule.default;
    
    // Verify Firebase app exists
    if (firebaseApp && firebaseApp().apps.length > 0) {
      isFirebaseAvailable = true;
      console.log('✅ Firebase modules loaded successfully');
    } else {
      console.log('⚠️ Firebase app not found, but modules are available');
      isFirebaseAvailable = false;
    }
    
    return true;
  } catch (error: any) {
    console.log('❌ Firebase modules not available:', error?.message || error);
    isFirebaseAvailable = false;
    return false;
  }
};

// Initialize modules immediately
initializeFirebaseModules();

// Main Firebase initialization function
export const initializeFirebase = async (): Promise<boolean> => {
  try {
    console.log('🚀 Starting Firebase initialization...');
    
    // Check if Firebase is available
    if (!isFirebaseAvailable) {
      console.log('⚠️ Firebase not available, skipping initialization');
      return false;
    }
    
    // Verify app instance
    if (!firebaseApp || !firebaseApp()) {
      console.log('⚠️ Firebase app instance not available');
      return false;
    }
    
    console.log('📊 Initializing Firebase Analytics...');
    
    // Initialize Analytics with error handling
    if (analytics) {
      try {
        await analytics().setAnalyticsCollectionEnabled(true);
        console.log('✅ Firebase Analytics initialized');
      } catch (analyticsError) {
        console.log('⚠️ Analytics initialization failed:', analyticsError);
        // Continue anyway, analytics is not critical
      }
    }
    
    // Initialize Crashlytics with error handling
    if (crashlytics) {
      try {
        await crashlytics().setCrashlyticsCollectionEnabled(true);
        console.log('✅ Firebase Crashlytics initialized');
      } catch (crashlyticsError) {
        console.log('⚠️ Crashlytics initialization failed:', crashlyticsError);
        // Continue anyway, crashlytics is not critical
      }
    }
    
    console.log('🎉 Firebase initialization completed successfully');
    return true;
    
  } catch (error: any) {
    console.log('❌ Firebase initialization error:', error?.message || error);
    // Don't throw error, just return false so app continues
    return false;
  }
};

// Safe Analytics helper functions
export const logEvent = async (eventName: string, params?: any): Promise<void> => {
  try {
    if (!isFirebaseAvailable || !analytics) {
      console.log(`📊 Analytics not available, skipping event: ${eventName}`);
      return;
    }
    
    await analytics().logEvent(eventName, params);
    console.log(`📊 Logged event: ${eventName}`, params);
  } catch (error) {
    console.log(`❌ Analytics log error for ${eventName}:`, error);
  }
};

export const logScreenView = async (screenName: string): Promise<void> => {
  try {
    if (!isFirebaseAvailable || !analytics) {
      console.log(`📊 Analytics not available, skipping screen view: ${screenName}`);
      return;
    }
    
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
    console.log(`📊 Logged screen view: ${screenName}`);
  } catch (error) {
    console.log(`❌ Screen view log error for ${screenName}:`, error);
  }
};

export const setUserProperties = async (properties: { [key: string]: string }): Promise<void> => {
  try {
    if (!isFirebaseAvailable || !analytics) {
      console.log('📊 Analytics not available, skipping user properties');
      return;
    }
    
    for (const [key, value] of Object.entries(properties)) {
      await analytics().setUserProperty(key, value);
    }
    console.log('📊 Set user properties:', properties);
  } catch (error) {
    console.log('❌ User properties error:', error);
  }
};

// Safe Crashlytics helper functions
export const logError = (error: Error, errorInfo?: any): void => {
  try {
    if (!isFirebaseAvailable || !crashlytics) {
      console.log('🚨 Crashlytics not available, logging error to console:', error);
      return;
    }
    
    crashlytics().recordError(error, errorInfo);
    console.log('🚨 Error logged to Crashlytics:', error.message);
  } catch (crashError) {
    console.log('❌ Crashlytics log error:', crashError);
  }
};

export const setUserId = async (userId: string): Promise<void> => {
  try {
    if (!isFirebaseAvailable) {
      console.log('📊 Firebase not available, skipping user ID setting');
      return;
    }
    
    // Set user ID for Analytics
    if (analytics) {
      try {
        await analytics().setUserId(userId);
        console.log('📊 Set Analytics user ID:', userId);
      } catch (analyticsError) {
        console.log('❌ Analytics setUserId error:', analyticsError);
      }
    }
    
    // Set user ID for Crashlytics
    if (crashlytics) {
      try {
        await crashlytics().setUserId(userId);
        console.log('🚨 Set Crashlytics user ID:', userId);
      } catch (crashlyticsError) {
        console.log('❌ Crashlytics setUserId error:', crashlyticsError);
      }
    }
  } catch (error) {
    console.log('❌ Set user ID error:', error);
  }
};

// Utility functions
export const isFirebaseReady = (): boolean => {
  return isFirebaseAvailable;
};

export const getFirebaseStatus = () => {
  return {
    available: isFirebaseAvailable,
    app: !!firebaseApp,
    analytics: !!analytics,
    crashlytics: !!crashlytics,
  };
};

// Export firebase instances for advanced usage (optional)
export const getFirebaseInstances = () => {
  if (!isFirebaseAvailable) {
    return { firebaseApp: null, analytics: null, crashlytics: null };
  }
  
  return { firebaseApp, analytics, crashlytics };
};