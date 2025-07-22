import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useMascotStore } from '../../store/mascotStore';
import { theme } from '@styles/theme';

const { width } = Dimensions.get('window');

const mascotImages = {
  happy: require('../../assets/mascot/happy.png'),
  excited: require('../../assets/mascot/excited.png'),
  sad: require('../../assets/mascot/sad.png'),
  depressed: require('../../assets/mascot/depressed.png'),
  below: require('../../assets/mascot/below.png'),
  gamemode: require('../../assets/mascot/gamemode.png'),
};

interface MascotDisplayProps {
  size?: 'small' | 'medium' | 'large';
  showMessage?: boolean;
}

export const MascotDisplay: React.FC<MascotDisplayProps> = ({
  size = 'medium',
  showMessage = true,
}) => {
  const { currentEmotion, message, isVisible, isAnimating } = useMascotStore();
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60 };
      case 'medium':
        return { width: 100, height: 100 };
      case 'large':
        return { width: 120, height: 120 };
      default:
        return { width: 100, height: 100 };
    }
  };
  
  useEffect(() => {
    if (isAnimating) {
      // Bounce animation
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Message slide in
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isAnimating]);
  
  if (!isVisible) return null;
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.mascotContainer,
          {
            transform: [{ scale: bounceAnim }],
          },
        ]}
      >
        <Image
          source={mascotImages[currentEmotion]}
          style={[styles.mascotImage, getSizeStyle()]}
          resizeMode="contain"
        />
      </Animated.View>
      
      {showMessage && message && (
        <Animated.View
          style={[
            styles.messageContainer,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    borderRadius: theme.borderRadius.lg,
  },
  messageContainer: {
    marginTop: theme.spacing.sm,
    maxWidth: width * 0.8,
  },
  messageBubble: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textDark,
    textAlign: 'center',
    fontWeight: '500',
  },
});