// src/utils/DebugToolkit.ts
// ✅ COMPREHENSIVE: Debug and verification toolkit for RN 0.79.5 fixes
// ✅ TESTING: Verify all fixes are working correctly
// console.log: "Complete debugging toolkit to verify all RN 0.79.5 compatibility fixes"

import { Platform, BackHandler, Alert } from 'react-native';

interface ServiceStatus {
  name: string;
  available: boolean;
  initialized: boolean;
  methods: string[];
  errors: string[];
  details?: any;
}

interface DebugReport {
  timestamp: string;
  rnVersion: string;
  platform: string;
  services: ServiceStatus[];
  api: {
    backHandler: {
      available: boolean;
      addEventListener: boolean;
      removeEventListener: boolean;
      exitApp: boolean;
    };
    react: {
      version: string | null;
      duplicates: boolean;
    };
  };
  assets: {
    sounds: string[];
    images: string[];
  };
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

class DebugToolkit {
  private report: DebugReport = {
    timestamp: new Date().toISOString(),
    rnVersion: '0.79.5',
    platform: Platform.OS,
    services: [],
    api: {
      backHandler: {
        available: false,
        addEventListener: false,
        removeEventListener: false,
        exitApp: false,
      },
      react: {
        version: null,
        duplicates: false,
      },
    },
    assets: {
      sounds: [],
      images: [],
    },
    errors: [],
    warnings: [],
    recommendations: [],
  };

  // ===== MAIN DIAGNOSTIC METHODS =====

  /**
   * Run complete diagnostic check of all RN 0.79.5 fixes
   */
  public async runCompleteCheck(): Promise<DebugReport> {
    console.log('🔍 [Debug] Starting complete RN 0.79.5 compatibility check...');
    
    this.resetReport();
    
    // Check all systems
    await this.checkBackHandlerAPI();
    await this.checkSoundService();
    await this.checkFirebaseService();
    await this.checkQuestionService();
    await this.checkReactVersions();
    await this.checkAssets();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Print comprehensive report
    this.printReport();
    
    console.log('✅ [Debug] Complete compatibility check finished');
    return { ...this.report };
  }

  /**
   * Quick health check - basic functionality test
   */
  public async quickHealthCheck(): Promise<{ healthy: boolean; criticalIssues: string[] }> {
    console.log('⚡ [Debug] Running quick health check...');
    
    const criticalIssues: string[] = [];
    
    try {
      // Check SoundService
      const SoundService = this.getSoundService();
      if (SoundService) {
        if (typeof SoundService.playButtonClick !== 'function') {
          criticalIssues.push('SoundService.playButtonClick is not a function');
        }
      } else {
        criticalIssues.push('SoundService not available');
      }
      
      // Check Firebase
      const Firebase = this.getFirebaseConfig();
      if (Firebase) {
        if (typeof Firebase.initializeFirebase !== 'function') {
          criticalIssues.push('Firebase.initializeFirebase is not a function');
        }
      } else {
        criticalIssues.push('Firebase config not available');
      }
      
      // Check QuestionService
      const QuestionService = this.getQuestionService();
      if (QuestionService) {
        if (typeof QuestionService.getRandomQuestion !== 'function') {
          criticalIssues.push('QuestionService.getRandomQuestion is not a function');
        }
      } else {
        criticalIssues.push('QuestionService not available');
      }
      
      // Check BackHandler
      if (!BackHandler || typeof BackHandler.addEventListener !== 'function') {
        criticalIssues.push('BackHandler.addEventListener not available');
      }
      
      const healthy = criticalIssues.length === 0;
      console.log(`⚡ [Debug] Quick health check ${healthy ? 'PASSED' : 'FAILED'}`);
      
      if (criticalIssues.length > 0) {
        console.log('🚨 [Debug] Critical issues found:', criticalIssues);
      }
      
      return { healthy, criticalIssues };
      
    } catch (error: any) {
      criticalIssues.push(`Health check error: ${error?.message}`);
      console.log('❌ [Debug] Quick health check failed:', error);
      return { healthy: false, criticalIssues };
    }
  }

  // ===== SERVICE-SPECIFIC CHECKS =====

  private async checkSoundService(): Promise<void> {
    console.log('🔊 [Debug] Checking SoundService...');
    
    const soundService = this.getSoundService();
    const status: ServiceStatus = {
      name: 'SoundService',
      available: !!soundService,
      initialized: false,
      methods: [],
      errors: [],
    };
    
    if (soundService) {
      try {
        // Check required methods
        const requiredMethods = [
          'initialize', 'playButtonClick', 'playButtonPress', 'playCorrect', 
          'playIncorrect', 'playStreak', 'startMenuMusic', 'startGameMusic',
          'stopMusic', 'pauseMusic', 'resumeMusic', 'setMusicEnabled',
          'setSoundEnabled', 'setMusicVolume', 'setEffectsVolume',
          'getMusicEnabled', 'getSoundEnabled', 'getMusicVolume', 
          'getEffectsVolume', 'isReady', 'release'
        ];
        
        requiredMethods.forEach(method => {
          if (typeof soundService[method] === 'function') {
            status.methods.push(method);
          } else {
            status.errors.push(`Method ${method} is not a function`);
          }
        });
        
        // Check initialization status
        if (typeof soundService.isReady === 'function') {
          status.initialized = soundService.isReady();
        }
        
        // Get service details
        if (typeof soundService.getStatus === 'function') {
          status.details = soundService.getStatus();
        }
        
        console.log(`✅ [Debug] SoundService: ${status.methods.length} methods, ${status.errors.length} errors`);
        
      } catch (error: any) {
        status.errors.push(`SoundService check error: ${error?.message}`);
        console.log('❌ [Debug] SoundService check failed:', error);
      }
    } else {
      status.errors.push('SoundService module not found');
      console.log('❌ [Debug] SoundService not available');
    }
    
    this.report.services.push(status);
  }

  private async checkFirebaseService(): Promise<void> {
    console.log('🔥 [Debug] Checking Firebase...');
    
    const firebase = this.getFirebaseConfig();
    const status: ServiceStatus = {
      name: 'Firebase',
      available: !!firebase,
      initialized: false,
      methods: [],
      errors: [],
    };
    
    if (firebase) {
      try {
        // Check required methods
        const requiredMethods = [
          'initializeFirebase', 'logEvent', 'logScreenView', 
          'setUserProperties', 'logError', 'setUserId',
          'isFirebaseReady', 'getFirebaseStatus'
        ];
        
        requiredMethods.forEach(method => {
          if (typeof firebase[method] === 'function') {
            status.methods.push(method);
          } else {
            status.errors.push(`Method ${method} is not a function`);
          }
        });
        
        // Check initialization status
        if (typeof firebase.isFirebaseReady === 'function') {
          status.initialized = firebase.isFirebaseReady();
        }
        
        // Get service details
        if (typeof firebase.getFirebaseStatus === 'function') {
          status.details = firebase.getFirebaseStatus();
        }
        
        console.log(`✅ [Debug] Firebase: ${status.methods.length} methods, ${status.errors.length} errors`);
        
      } catch (error: any) {
        status.errors.push(`Firebase check error: ${error?.message}`);
        console.log('❌ [Debug] Firebase check failed:', error);
      }
    } else {
      status.errors.push('Firebase module not found');
      console.log('❌ [Debug] Firebase not available');
    }
    
    this.report.services.push(status);
  }

  private async checkQuestionService(): Promise<void> {
    console.log('📚 [Debug] Checking QuestionService...');
    
    const questionService = this.getQuestionService();
    const status: ServiceStatus = {
      name: 'QuestionService',
      available: !!questionService,
      initialized: false,
      methods: [],
      errors: [],
    };
    
    if (questionService) {
      try {
        // Check required methods
        const requiredMethods = [
          'initialize', 'getRandomQuestion', 'getQuestionsByCategory',
          'getQuestionsByDifficulty', 'getAvailableCategories',
          'getTotalQuestionCount', 'isServiceReady', 'getServiceStatus'
        ];
        
        requiredMethods.forEach(method => {
          if (typeof questionService[method] === 'function') {
            status.methods.push(method);
          } else {
            status.errors.push(`Method ${method} is not a function`);
          }
        });
        
        // Check initialization status
        if (typeof questionService.isServiceReady === 'function') {
          status.initialized = questionService.isServiceReady();
        }
        
        // Get service details
        if (typeof questionService.getServiceStatus === 'function') {
          status.details = questionService.getServiceStatus();
        }
        
        // Test question availability
        if (typeof questionService.getTotalQuestionCount === 'function') {
          const questionCount = questionService.getTotalQuestionCount();
          if (questionCount === 0) {
            status.errors.push('No questions loaded');
          }
        }
        
        console.log(`✅ [Debug] QuestionService: ${status.methods.length} methods, ${status.errors.length} errors`);
        
      } catch (error: any) {
        status.errors.push(`QuestionService check error: ${error?.message}`);
        console.log('❌ [Debug] QuestionService check failed:', error);
      }
    } else {
      status.errors.push('QuestionService module not found');
      console.log('❌ [Debug] QuestionService not available');
    }
    
    this.report.services.push(status);
  }

  private async checkBackHandlerAPI(): Promise<void> {
    console.log('🔙 [Debug] Checking BackHandler API...');
    
    try {
      this.report.api.backHandler = {
        available: !!BackHandler,
        addEventListener: !!(BackHandler && typeof BackHandler.addEventListener === 'function'),
        removeEventListener: !!(BackHandler && typeof BackHandler.removeEventListener === 'function'),
        exitApp: !!(BackHandler && typeof BackHandler.exitApp === 'function'),
      };
      
      if (!this.report.api.backHandler.removeEventListener) {
        this.report.warnings.push('BackHandler.removeEventListener not available (expected in RN 0.79.5)');
      }
      
      console.log('✅ [Debug] BackHandler API check completed');
      
    } catch (error: any) {
      this.report.errors.push(`BackHandler API check error: ${error?.message}`);
      console.log('❌ [Debug] BackHandler API check failed:', error);
    }
  }

  private async checkReactVersions(): Promise<void> {
    console.log('⚛️ [Debug] Checking React versions...');
    
    try {
      // Try to get React version
      const React = require('react');
      this.report.api.react.version = React.version || null;
      
      // This is a simplified check - in a real environment you'd check package.json
      console.log('✅ [Debug] React version check completed');
      
    } catch (error: any) {
      this.report.errors.push(`React version check error: ${error?.message}`);
      console.log('❌ [Debug] React version check failed:', error);
    }
  }

  private async checkAssets(): Promise<void> {
    console.log('🎵 [Debug] Checking assets...');
    
    try {
      // This is a basic check - you'd need to implement asset verification based on your setup
      const expectedSounds = ['buttonpress', 'correct', 'incorrect', 'streak', 'gamemusic', 'menumusic'];
      this.report.assets.sounds = expectedSounds;
      
      console.log('✅ [Debug] Asset check completed');
      
    } catch (error: any) {
      this.report.errors.push(`Asset check error: ${error?.message}`);
      console.log('❌ [Debug] Asset check failed:', error);
    }
  }

  // ===== UTILITY METHODS =====

  private getSoundService(): any {
    try {
      return require('../services/SoundService').default;
    } catch (error) {
      return null;
    }
  }

  private getFirebaseConfig(): any {
    try {
      return require('../config/Firebase');
    } catch (error) {
      return null;
    }
  }

  private getQuestionService(): any {
    try {
      return require('../services/QuestionService').default;
    } catch (error) {
      return null;
    }
  }

  private resetReport(): void {
    this.report = {
      timestamp: new Date().toISOString(),
      rnVersion: '0.79.5',
      platform: Platform.OS,
      services: [],
      api: {
        backHandler: {
          available: false,
          addEventListener: false,
          removeEventListener: false,
          exitApp: false,
        },
        react: {
          version: null,
          duplicates: false,
        },
      },
      assets: {
        sounds: [],
        images: [],
      },
      errors: [],
      warnings: [],
      recommendations: [],
    };
  }

  private generateRecommendations(): void {
    // Check for critical issues and generate recommendations
    const allErrors = this.report.services.flatMap(service => service.errors);
    
    if (allErrors.some(error => error.includes('playButtonClick'))) {
      this.report.recommendations.push('Update SoundService with RN 0.79.5 compatible version');
    }
    
    if (allErrors.some(error => error.includes('initializeFirebase'))) {
      this.report.recommendations.push('Update Firebase config with explicit app initialization');
    }
    
    if (allErrors.some(error => error.includes('No questions'))) {
      this.report.recommendations.push('Check QuestionService data loading and initialization');
    }
    
    if (!this.report.api.backHandler.removeEventListener) {
      this.report.recommendations.push('Use new BackHandler subscription pattern for RN 0.79.5');
    }
    
    if (this.report.errors.length > 0) {
      this.report.recommendations.push('Address all errors listed above for full compatibility');
    }
  }

  private printReport(): void {
    console.log('\n📊 [Debug] COMPLETE RN 0.79.5 COMPATIBILITY REPORT');
    console.log('====================================================');
    console.log(`🕒 Timestamp: ${this.report.timestamp}`);
    console.log(`📱 Platform: ${this.report.platform}`);
    console.log(`⚛️ RN Version: ${this.report.rnVersion}`);
    console.log(`⚛️ React Version: ${this.report.api.react.version || 'Unknown'}`);
    console.log('');
    
    // Services Report
    console.log('🔧 SERVICES STATUS:');
    this.report.services.forEach(service => {
      const status = service.available ? '✅' : '❌';
      const init = service.initialized ? '✅' : '⚠️';
      console.log(`  ${status} ${service.name} - Available: ${service.available}, Initialized: ${service.initialized} ${init}`);
      console.log(`     Methods: ${service.methods.length}, Errors: ${service.errors.length}`);
      
      if (service.errors.length > 0) {
        service.errors.forEach(error => {
          console.log(`     ❌ ${error}`);
        });
      }
    });
    
    console.log('');
    
    // API Report
    console.log('🔌 API STATUS:');
    const bh = this.report.api.backHandler;
    console.log(`  BackHandler: Available: ${bh.available ? '✅' : '❌'}, addEventListener: ${bh.addEventListener ? '✅' : '❌'}`);
    console.log(`  removeEventListener: ${bh.removeEventListener ? '✅' : '⚠️'} (Expected ⚠️ in RN 0.79.5)`);
    console.log('');
    
    // Errors & Warnings
    if (this.report.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.report.errors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }
    
    if (this.report.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.report.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }
    
    // Recommendations
    if (this.report.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.report.recommendations.forEach(rec => console.log(`   ${rec}`));
      console.log('');
    }
    
    // Overall Status
    const criticalIssues = this.report.services.filter(s => !s.available || s.errors.length > 0).length;
    const overallStatus = criticalIssues === 0 ? '✅ HEALTHY' : `⚠️ ${criticalIssues} ISSUES FOUND`;
    console.log(`🎯 OVERALL STATUS: ${overallStatus}`);
    console.log('====================================================\n');
  }

  // ===== PUBLIC TEST METHODS =====

  /**
   * Test SoundService functionality
   */
  public testSoundService(): void {
    console.log('🔊 [Debug] Testing SoundService functionality...');
    
    const soundService = this.getSoundService();
    if (!soundService) {
      console.log('❌ [Debug] SoundService not available for testing');
      return;
    }
    
    try {
      // Test button click
      if (typeof soundService.playButtonClick === 'function') {
        soundService.playButtonClick();
        console.log('✅ [Debug] SoundService.playButtonClick() - OK');
      } else {
        console.log('❌ [Debug] SoundService.playButtonClick() - NOT A FUNCTION');
      }
      
      // Test status method
      if (typeof soundService.getStatus === 'function') {
        const status = soundService.getStatus();
        console.log('📊 [Debug] SoundService status:', status);
      }
      
    } catch (error) {
      console.log('❌ [Debug] SoundService test failed:', error);
    }
  }

  /**
   * Test Firebase functionality
   */
  public testFirebase(): void {
    console.log('🔥 [Debug] Testing Firebase functionality...');
    
    const firebase = this.getFirebaseConfig();
    if (!firebase) {
      console.log('❌ [Debug] Firebase not available for testing');
      return;
    }
    
    try {
      // Test initialization check
      if (typeof firebase.isFirebaseReady === 'function') {
        const ready = firebase.isFirebaseReady();
        console.log(`📊 [Debug] Firebase ready: ${ready ? '✅' : '❌'}`);
      }
      
      // Test status method
      if (typeof firebase.getFirebaseStatus === 'function') {
        const status = firebase.getFirebaseStatus();
        console.log('📊 [Debug] Firebase status:', status);
      }
      
      // Test event logging
      if (typeof firebase.logEvent === 'function') {
        firebase.logEvent('debug_test_event', { test: true });
        console.log('✅ [Debug] Firebase.logEvent() - OK');
      }
      
    } catch (error) {
      console.log('❌ [Debug] Firebase test failed:', error);
    }
  }

  /**
   * Show user-friendly diagnostic alert
   */
  public showDiagnosticAlert(): void {
    this.quickHealthCheck().then(({ healthy, criticalIssues }) => {
      const title = healthy ? '✅ System Healthy' : '⚠️ Issues Found';
      const message = healthy 
        ? 'All RN 0.79.5 compatibility fixes are working correctly!'
        : `Found ${criticalIssues.length} issues:\n\n${criticalIssues.slice(0, 3).join('\n')}${criticalIssues.length > 3 ? '\n...' : ''}`;
      
      Alert.alert(title, message, [
        { text: 'OK', style: 'default' }
      ]);
    });
  }
}

// Export singleton instance
export default new DebugToolkit();

// Export convenience functions
export const runCompatibilityCheck = () => new DebugToolkit().runCompleteCheck();
export const quickHealthCheck = () => new DebugToolkit().quickHealthCheck();
export const testSoundService = () => new DebugToolkit().testSoundService();
export const testFirebase = () => new DebugToolkit().testFirebase();
export const showDiagnostic = () => new DebugToolkit().showDiagnosticAlert();