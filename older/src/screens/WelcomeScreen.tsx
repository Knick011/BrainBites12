import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MascotDisplay } from '@components/Mascot/MascotDisplay';
import { useMascotController } from '@components/Mascot/useMascotController';
import { useAudio } from '@services/useAudio';
import { theme } from '@styles/theme';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { showWelcome } = useMascotController();
  const { playMusic } = useAudio();
  
  useEffect(() => {
    // Play welcome music
    playMusic('menuMusic');
    
    // Show welcome message
    showWelcome();
    
    // Auto-navigate after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []); // Remove the dependencies that cause re-renders
  
  return (
    <LinearGradient
      colors={theme.colors.primary}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.appTitle}>BrainBites</Text>
          <Text style={styles.appSubtitle}>Learn • Play • Grow</Text>
        </View>
        
        <View style={styles.mascotContainer}>
          <MascotDisplay size="large" showMessage />
        </View>
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your learning adventure...</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: theme.fontSize.xxl * 1.5,
    fontWeight: '800',
    color: theme.colors.textDark,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textMedium,
    textAlign: 'center',
    letterSpacing: 1,
  },
  mascotContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMedium,
    fontWeight: '500',
    textAlign: 'center',
  },
});