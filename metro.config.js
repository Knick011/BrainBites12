// metro.config.js
// ✅ FIXES: Metro configuration for RN 0.79.5 compatibility
// ✅ FIXES: Asset resolution issues, module loading problems
// Updated for React Native 0.79.5 with enhanced asset and module resolution

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for React Native 0.79.5
 * Addresses common issues with asset loading and module resolution
 */
const config = {
  // ===== RESOLVER CONFIGURATION =====
  resolver: {
    // Asset extensions that Metro should handle
    assetExts: [
      // Default React Native assets
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp',
      // Audio files for react-native-sound compatibility
      'mp3', 'wav', 'aac', 'm4a', 'ogg',
      // Video files  
      'mp4', 'mov', 'avi', 'mkv',
      // Font files
      'ttf', 'otf', 'woff', 'woff2',
      // Other assets
      'zip', 'pdf', 'json', 'txt', 'bin'
    ],
    
    // Source extensions Metro should resolve
    sourceExts: [
      'js', 'jsx', 'ts', 'tsx', 'json',
      // Additional extensions for RN 0.79.5
      'cjs', 'mjs'
    ],

    // Platform-specific extensions for better resolution
    platforms: ['ios', 'android', 'web', 'native'],

    // Custom resolver for better module resolution in RN 0.79.5
    resolverMainFields: ['react-native', 'browser', 'main'],

    // Block list to avoid resolving problematic modules
    blockList: [
      // Block common problematic patterns
      /.*\/__tests__\/.*/,
      /.*\/test\/.*/,
      /.*\.test\.(js|ts|tsx)$/,
      /.*\.spec\.(js|ts|tsx)$/,
    ],

    // Node modules that should be resolved from project root
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],

    // Alias configuration for better compatibility
    alias: {
      // React Native Sound compatibility
      'react-native-sound': path.resolve(__dirname, 'node_modules/react-native-sound'),
    },
  },

  // ===== TRANSFORMER CONFIGURATION =====
  transformer: {
    // Asset transformer configuration
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
    
    // Enable inline requires for better performance  
    inlineRequires: true,
    
    // Additional transformer options for RN 0.79.5
    allowOptionalDependencies: true,
    
    // Transform options for better compatibility
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },

  // ===== WATCHER CONFIGURATION =====
  watcher: {
    // File patterns to watch for changes
    watchman: {
      // Use Watchman for better file watching performance
      deferStates: ['hg.update', 'hg.update2'],
    },
    
    // Additional paths to watch
    additionalExts: ['cjs', 'mjs'],
  },

  // ===== PROJECT CONFIGURATION =====
  projectRoot: __dirname,
  
  // Watch folders for changes
  watchFolders: [
    // Add any additional folders to watch
    path.resolve(__dirname, 'src'),
  ],

  // ===== DEBUGGING CONFIGURATION =====
  
  // Enhanced logging for troubleshooting
  reporter: {
    // Log more details during development
    update: (event) => {
      if (event.type === 'bundle_build_started') {
        console.log('📦 [Metro] Bundle build started...');
      } else if (event.type === 'bundle_build_done') {
        console.log('✅ [Metro] Bundle build completed');
      } else if (event.type === 'bundle_build_failed') {
        console.log('❌ [Metro] Bundle build failed:', event.error);
      }
    },
  },
};

// Get default Metro config for RN 0.79.5
const defaultConfig = getDefaultConfig(__dirname);

// Merge our custom config with defaults
const finalConfig = mergeConfig(defaultConfig, config);

// Log configuration for debugging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 [Metro] Using React Native 0.79.5 optimized configuration');
  console.log('📁 [Metro] Project root:', finalConfig.projectRoot);
  console.log('📦 [Metro] Asset extensions:', finalConfig.resolver.assetExts.slice(0, 10), '...');
  console.log('🔍 [Metro] Source extensions:', finalConfig.resolver.sourceExts);
}

// Export configuration
module.exports = finalConfig;
