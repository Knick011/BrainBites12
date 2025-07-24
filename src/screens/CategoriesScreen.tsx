// src/screens/CategoriesScreen.tsx
// ✅ UPDATED: Now uses real categories from questionsData.ts with actual question counts
// ✅ UPDATED: Modern grid layout with CategoryCard component
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Animated,
  Platform,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import theme from '../styles/theme';
import SoundService from '../services/SoundService';
import CategoryCard from '../components/CategoryCard';
import { getAvailableCategories, CategoryInfo, getTotalQuestionsCount } from '../utils/categoryUtils';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Categories'>;

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<Animated.Value[]>([]);
  
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      
      // Get categories from real data
      const availableCategories = getAvailableCategories();
      const totalCount = getTotalQuestionsCount();
      
      setCategories(availableCategories || []);
      setTotalQuestions(totalCount || 0);
      
      // Initialize animation values for each category
      cardAnims.current = (availableCategories || []).map(() => new Animated.Value(0));
      
      console.log('📚 [CategoriesScreen] Loaded categories:', (availableCategories || []).length);
      
      // Start animations only if we have categories
      if (availableCategories && availableCategories.length > 0) {
        startAnimations();
      }
      
    } catch (error) {
      console.error('❌ [CategoriesScreen] Error loading categories:', error);
      // Set fallback empty state
      setCategories([]);
      setTotalQuestions(0);
    } finally {
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
    // Animate entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Stagger card animations
    const animations = cardAnims.current.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, animations).start();
  };
  
  const handleCategorySelect = (category: CategoryInfo) => {
    SoundService.playButtonPress();
    navigation.navigate('Quiz', { category: category.id });
  };
  
  const handleBack = () => {
    SoundService.playButtonPress();
    navigation.goBack();
  };
  
  const renderCategoryCard = ({ item, index }: { item: CategoryInfo; index: number }) => (
    <CategoryCard
      category={item}
      onPress={handleCategorySelect}
      animationValue={cardAnims.current[index]}
      delay={index * 100}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Choose a Category</Text>
          <Text style={styles.headerSubtitle}>
            {totalQuestions} total questions available
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>
      
      {categories.length > 0 ? (
        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="help-circle" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No categories available</Text>
          <Text style={styles.emptySubtext}>Please check your questions data</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  gridContainer: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-around',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});

export default CategoriesScreen;