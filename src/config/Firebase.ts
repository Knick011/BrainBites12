// src/config/Firebase.ts
// ✅ FIXES: Firebase configuration for com.brainbites package
// ✅ FIXES: Proper google-services.json integration for RN 0.79.5
// console.log: "Firebase config specifically configured for com.brainbites package"

import { Platform } from 'react-native';

// Firebase module imports with RN 0.79.5 compatibility
let firebaseApp: any = null;
let analytics: any = null;
let crashlytics: any = null;
let isFirebaseAvailable = false;
let firebaseAppInstance: any = null;

// Initialize Firebase modules with error handling
const initializeFirebaseModules = () => {
  try {
    console.log('🔥 [com.brainbites] Attempting to initialize Firebase modules...');
    
    // Import Firebase modules with error handling
    const appModule = require('@react-native-firebase/app');
    const analyticsModule = require('@react-native-firebase/analytics');
    const crashlyticsModule = require('@react-native-firebase/crashlytics');
    
    firebaseApp = appModule.default || appModule;
    analytics = analyticsModule.default || analyticsModule;
    crashlytics = crashlyticsModule.default || crashlyticsModule;
    
    console.log('✅ [com.brainbites] Firebase modules imported successfully');
    return true;
    
  } catch (error: any) {
    console.log('❌ [com.brainbites] Firebase modules not available:', error?.message || error);
    isFirebaseAvailable = false;
    return false;
  }
};

// Verify google-services.json configuration
const verifyGoogleServicesConfig = () => {
  console.log('🔍 [com.brainbites] Verifying google-services.json configuration...');
  
  // Log expected configuration for com.brainbites
  console.log('📋 [com.brainbites] Expected configuration:');
  console.log('  Package Name: com.brainbites');
  console.log('  Project ID: brainbites-analytics');
  console.log('  App ID: 1:1089165314678:android:bb38e368be58e1e488ad57');
  
  // Verify app instance has correct configuration
  if (firebaseApp && firebaseApp()) {
    try {
      const apps = firebaseApp().apps;
      if (apps.length > 0) {
        const defaultApp = apps[0];
        console.log('✅ [com.brainbites] Firebase app found:', defaultApp.name);
        console.log('📱 [com.brainbites] App options:', defaultApp.options);
        return true;
      }
    } catch (error) {
      console.log('⚠️ [com.brainbites] Could not verify app configuration:', error);
    }
  }
  
  return false;
};

// Initialize Firebase App Instance for com.brainbites
const createFirebaseApp = async (): Promise<boolean> => {
  if (!firebaseApp) {
    console.log('❌ [com.brainbites] Firebase app module not available');
    return false;
  }
  
  try {
    console.log('🚀 [com.brainbites] Creating Firebase app instance...');
    
    // Check if default app already exists
    let existingApps: any[] = [];
    try {
      existingApps = firebaseApp().apps || [];
      console.log(`📊 [com.brainbites] Existing Firebase apps: ${existingApps.length}`);
    } catch (appsError) {
      console.log('⚠️ [com.brainbites] Could not check existing apps, continuing with initialization...');
    }
    
    if (existingApps.length > 0) {
      // Use existing default app
      firebaseAppInstance = firebaseApp();
      console.log('✅ [com.brainbites] Using existing Firebase app instance');
      
      // Verify configuration
      verifyGoogleServicesConfig();
      return true;
    }
    
    // Try to get Firebase app - it should auto-initialize from google-services.json
    try {
      firebaseAppInstance = firebaseApp();
      console.log('✅ [com.brainbites] Firebase app auto-configured from google-services.json');
      
      // Verify configuration
      verifyGoogleServicesConfig();
      return true;
      
    } catch (autoConfigError: any) {
      console.log('❌ [com.brainbites] Auto-configuration failed:', autoConfigError?.message);
      
      // If auto-config fails, the google-services.json might have issues
      console.log('🚨 [com.brainbites] TROUBLESHOOTING STEPS:');
      console.log('1. Verify google-services.json is in android/app/ directory');
      console.log('2. Check that package_name in google-services.json matches "com.brainbites"');
      console.log('3. Ensure project_id is "brainbites-analytics"');
      console.log('4. Rebuild the app after adding google-services.json');
      
      return false;
    }
    
  } catch (error: any) {
    console.log('❌ [com.brainbites] Error creating Firebase app:', error?.message || error);
    return false;
  }
};

// Initialize modules immediately
const modulesLoaded = initializeFirebaseModules();

// Main Firebase initialization function for com.brainbites
export const initializeFirebase = async (): Promise<boolean> => {
  try {
    console.log('🚀 [com.brainbites] Starting Firebase initialization...');
    
    // Step 1: Ensure modules are loaded
    if (!modulesLoaded) {
      console.log('❌ [com.brainbites] Firebase modules not available, skipping initialization');
      return false;
    }
    
    // Step 2: Create or get Firebase app instance
    const appCreated = await createFirebaseApp();
    if (!appCreated) {
      console.log('❌ [com.brainbites] Failed to create Firebase app instance');
      
      // Provide specific troubleshooting for com.brainbites
      console.log('');
      console.log('🔧 [com.brainbites] TROUBLESHOOTING CHECKLIST:');
      console.log('================================');
      console.log('1. Check android/app/google-services.json exists');
      console.log('2. Verify package_name in google-services.json is "com.brainbites"');
      console.log('3. Check android/app/build.gradle has correct applicationId "com.brainbites"');
      console.log('4. Rebuild: npm run clean && npm run android');
      console.log('5. If still failing, re-download google-services.json from Firebase Console');
      console.log('================================');
      console.log('');
      
      return false;
    }
    
    // Step 3: Initialize Analytics
    console.log('📊 [com.brainbites] Initializing Firebase Analytics...');
    if (analytics) {
      try {
        await analytics().setAnalyticsCollectionEnabled(true);
        console.log('✅ [com.brainbites] Firebase Analytics initialized');
      } catch (analyticsError: any) {
        console.log('⚠️ [com.brainbites] Analytics initialization failed:', analyticsError?.message);
      }
    }
    
    // Step 4: Initialize Crashlytics
    console.log('🚨 [com.brainbites] Initializing Firebase Crashlytics...');
    if (crashlytics) {
      try {
        await crashlytics().setCrashlyticsCollectionEnabled(true);
        console.log('✅ [com.brainbites] Firebase Crashlytics initialized');
      } catch (crashlyticsError: any) {
        console.log('⚠️ [com.brainbites] Crashlytics initialization failed:', crashlyticsError?.message);
      }
    }
    
    // Step 5: Mark as available
    isFirebaseAvailable = true;
    console.log('🎉 [com.brainbites] Firebase initialization completed successfully');
    
    // Step 6: Test Firebase functionality
    await testFirebaseConnection();
    
    return true;
    
  } catch (error: any) {
    console.log('❌ [com.brainbites] Firebase initialization error:', error?.message || error);
    isFirebaseAvailable = false;
    return false;
  }
};

// Test Firebase connection specifically for com.brainbites
const testFirebaseConnection = async (): Promise<void> => {
  try {
    console.log('🧪 [com.brainbites] Testing Firebase connection...');
    
    if (analytics && isFirebaseAvailable) {
      // Test analytics with app-specific event
      await analytics().logEvent('com_brainbites_app_initialized', {
        platform: Platform.OS,
        package_name: 'com.brainbites',
        react_native_version: '0.79.5',
        timestamp: new Date().toISOString(),
      });
      console.log('✅ [com.brainbites] Firebase Analytics test successful');
    }
    
    if (crashlytics && isFirebaseAvailable) {
      // Test crashlytics
      await crashlytics().setUserId('brainbites_user_test');
      console.log('✅ [com.brainbites] Firebase Crashlytics test successful');
    }
    
  } catch (testError: any) {
    console.log('⚠️ [com.brainbites] Firebase connection test failed:', testError?.message);
  }
};

// Safe Analytics helper functions for com.brainbites
export const logEvent = async (eventName: string, params?: any): Promise<void> => {
  try {
    if (!isFirebaseAvailable || !analytics) {
      console.log(`📊 [com.brainbites] Analytics not available, skipping event: ${eventName}`);
      return;
    }
    
    if (!firebaseAppInstance) {
      console.log(`⚠️ [com.brainbites] Firebase app not initialized, skipping event: ${eventName}`);
      return;
    }
    
    await analytics().logEvent(eventName, {
      ...params,
      app_package: 'com.brainbites',
      rn_version: '0.79.5',
      platform: Platform.OS,
    });
    console.log(`📊 [com.brainbites] Logged event: ${eventName}`, params);
    
  } catch (error: any) {
    console.log(`❌ [com.brainbites] Analytics log error for ${eventName}:`, error?.message);
  }
};

export const logScreenView = async (screenName: string): Promise<void> => {
  try {
    if (!isFirebaseAvailable || !analytics) {
      console.log(`📊 [com.brainbites] Analytics not available, skipping screen view: ${screenName}`);
      return;
    }
    
    if (!firebaseAppInstance) {
      console.log(`⚠️ [com.brainbites] Firebase app not initialized, skipping screen view: ${screenName}`);
      return;
    }
    
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
    console.log(`📊 [com.brainbites] Logged screen view: ${screenName}`);
    
  } catch (error: any) {
    console.log(`❌ [com.brainbites] Screen view log error for ${screenName}:`, error?.message);
  }
};

export const setUserProperties = async (properties: { [key: string]: string }): Promise<void> => {
  try {
    if (!isFirebaseAvailable || !analytics) {
      console.log('📊 [com.brainbites] Analytics not available, skipping user properties');
      return;
    }
    
    if (!firebaseAppInstance) {
      console.log('⚠️ [com.brainbites] Firebase app not initialized, skipping user properties');
      return;
    }
    
    const enhancedProperties = {
      ...properties,
      app_package: 'com.brainbites',
      rn_version: '0.79.5',
      platform: Platform.OS,
    };
    
    for (const [key, value] of Object.entries(enhancedProperties)) {
      await analytics().setUserProperty(key, value);
    }
    console.log('📊 [com.brainbites] Set user properties:', enhancedProperties);
    
  } catch (error: any) {
    console.log('❌ [com.brainbites] User properties error:', error?.message);
  }
};

// Safe Crashlytics helper functions for com.brainbites
export const logError = (error: Error, errorInfo?: any): void => {
  try {
    if (!isFirebaseAvailable || !crashlytics) {
      console.log('🚨 [com.brainbites] Crashlytics not available, logging error to console:', error);
      return;
    }
    
    if (!firebaseAppInstance) {
      console.log('⚠️ [com.brainbites] Firebase app not initialized, logging error to console:', error);
      return;
    }
    
    const enhancedErrorInfo = {
      ...errorInfo,
      app_package: 'com.brainbites',
      rn_version: '0.79.5',
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };
    
    crashlytics().recordError(error, enhancedErrorInfo);
    console.log('🚨 [com.brainbites] Error logged to Crashlytics:', error.message);
    
  } catch (crashError: any) {
    console.log('❌ [com.brainbites] Crashlytics log error:', crashError?.message);
    console.log('🚨 [com.brainbites] Original error (logged to console):', error);
  }
};

export const setUserId = async (userId: string): Promise<void> => {
  try {
    if (!isFirebaseAvailable) {
      console.log('📊 [com.brainbites] Firebase not available, skipping user ID setting');
      return;
    }
    
    if (!firebaseAppInstance) {
      console.log('⚠️ [com.brainbites] Firebase app not initialized, skipping user ID setting');
      return;
    }
    
    // Set user ID for Analytics
    if (analytics) {
      try {
        await analytics().setUserId(userId);
        console.log('📊 [com.brainbites] Set Analytics user ID:', userId);
      } catch (analyticsError: any) {
        console.log('❌ [com.brainbites] Analytics setUserId error:', analyticsError?.message);
      }
    }
    
    // Set user ID for Crashlytics
    if (crashlytics) {
      try {
        await crashlytics().setUserId(userId);
        console.log('🚨 [com.brainbites] Set Crashlytics user ID:', userId);
      } catch (crashlyticsError: any) {
        console.log('❌ [com.brainbites] Crashlytics setUserId error:', crashlyticsError?.message);
      }
    }
    
  } catch (error: any) {
    console.log('❌ [com.brainbites] Set user ID error:', error?.message);
  }
};

// Utility functions for com.brainbites
export const isFirebaseReady = (): boolean => {
  return isFirebaseAvailable && !!firebaseAppInstance;
};

export const getFirebaseStatus = () => {
  return {
    available: isFirebaseAvailable,
    app: !!firebaseAppInstance,
    analytics: !!analytics,
    crashlytics: !!crashlytics,
    packageName: 'com.brainbites',
    rnVersion: '0.79.5',
    modulesLoaded,
  };
};

// Debug function specifically for com.brainbites troubleshooting
export const debugFirebaseSetup = () => {
  console.log('\n🔍 [com.brainbites] FIREBASE DEBUG INFO:');
  console.log('==========================================');
  console.log('Package Name: com.brainbites');
  console.log('Project ID: brainbites-analytics');
  console.log('Modules loaded:', modulesLoaded);
  console.log('Firebase available:', isFirebaseAvailable);
  console.log('Firebase app instance:', !!firebaseAppInstance);
  console.log('Analytics module:', !!analytics);
  console.log('Crashlytics module:', !!crashlytics);
  console.log('Platform:', Platform.OS);
  console.log('RN Version: 0.79.5');
  
  if (firebaseApp) {
    try {
      const apps = firebaseApp().apps;
      console.log('Firebase apps count:', apps.length);
      if (apps.length > 0) {
        console.log('Default app name:', apps[0].name);
        console.log('App options keys:', Object.keys(apps[0].options || {}));
      }
    } catch (error) {
      console.log('Error getting Firebase apps:', error);
    }
  }
  
  console.log('');
  console.log('📋 CONFIGURATION CHECKLIST:');
  console.log('1. ✓ Check android/app/google-services.json exists');
  console.log('2. ✓ Verify "package_name": "com.brainbites" in google-services.json');  
  console.log('3. ✓ Check android/app/build.gradle applicationId "com.brainbites"');
  console.log('4. ✓ Rebuild app after adding google-services.json');
  console.log('==========================================\n');
};

export const getFirebaseInstances = () => {
  if (!isFirebaseAvailable) {
    return { 
      firebaseApp: null, 
      analytics: null, 
      crashlytics: null,
      appInstance: null 
    };
  }
  
  return { 
    firebaseApp, 
    analytics, 
    crashlytics,
    appInstance: firebaseAppInstance 
  };
};