// src/components/CategoryCard.tsx
// Category card component for quiz category selection

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategoryInfo } from '../utils/categoryUtils';

interface CategoryCardProps {
  category: CategoryInfo;
  onPress: (category: CategoryInfo) => void;
  animationValue?: Animated.Value;
  delay?: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
  animationValue,
  delay = 0
}) => {
  const handlePress = () => {
    onPress(category);
  };

  const animatedStyle = animationValue ? {
    opacity: animationValue,
    transform: [
      {
        translateY: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0]
        })
      },
      {
        scale: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1]
        })
      }
    ]
  } : {};

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={category.gradient}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconContainer}>
            <Icon 
              name={category.icon} 
              size={32} 
              color="white" 
              style={styles.icon}
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {category.displayName}
            </Text>
            <Text style={styles.questionCount}>
              {category.questionCount} question{category.questionCount !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <Icon name="chevron-right" size={24} color="rgba(255, 255, 255, 0.8)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    minWidth: 160,
    maxWidth: 200,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  questionCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  arrowContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});

export default CategoryCard; 