import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '@styles/theme';
import { useAudio } from '@services/useAudio';

const { width } = Dimensions.get('window');

interface AnswerOptionsProps {
  options: string[];
  selectedAnswer: number | null;
  correctAnswer?: number;
  showResult: boolean;
  onSelectAnswer: (index: number) => void;
  disabled?: boolean;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSelectAnswer,
  disabled = false,
}) => {
  const { playSound } = useAudio();
  
  const handleSelectAnswer = (index: number) => {
    if (disabled || showResult) return;
    
    playSound('buttonClick');
    onSelectAnswer(index);
  };
  
  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.selectedOption : styles.defaultOption;
    }
    
    // Show results
    if (correctAnswer === index) {
      return styles.correctOption;
    }
    
    if (selectedAnswer === index && correctAnswer !== index) {
      return styles.incorrectOption;
    }
    
    return styles.defaultOption;
  };
  
  const getOptionColors = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index 
        ? ['#E3F2FD', '#BBDEFB'] 
        : ['#FFFFFF', '#F5F5F5'];
    }
    
    if (correctAnswer === index) {
      return ['#E8F5E8', '#C8E6C9'];
    }
    
    if (selectedAnswer === index && correctAnswer !== index) {
      return ['#FFEBEE', '#FFCDD2'];
    }
    
    return ['#FFFFFF', '#F5F5F5'];
  };
  
  const getIconName = (index: number) => {
    if (!showResult) return null;
    
    if (correctAnswer === index) {
      return 'check-circle';
    }
    
    if (selectedAnswer === index && correctAnswer !== index) {
      return 'cancel';
    }
    
    return null;
  };
  
  const getIconColor = (index: number) => {
    if (correctAnswer === index) {
      return theme.colors.success;
    }
    
    if (selectedAnswer === index && correctAnswer !== index) {
      return theme.colors.error;
    }
    
    return theme.colors.textMedium;
  };
  
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleSelectAnswer(index)}
          disabled={disabled || showResult}
          style={styles.optionWrapper}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getOptionColors(index)}
            style={[styles.optionContainer, getOptionStyle(index)]}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLabel}>
                <Text style={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              
              <Text style={styles.optionText}>{option}</Text>
              
              {getIconName(index) && (
                <Icon
                  name={getIconName(index)!}
                  size={24}
                  color={getIconColor(index)}
                  style={styles.resultIcon}
                />
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  optionWrapper: {
    marginBottom: theme.spacing.md,
  },
  optionContainer: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  defaultOption: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  correctOption: {
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  incorrectOption: {
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  optionLetter: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  optionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textDark,
    fontWeight: '500',
  },
  resultIcon: {
    marginLeft: theme.spacing.sm,
  },
});