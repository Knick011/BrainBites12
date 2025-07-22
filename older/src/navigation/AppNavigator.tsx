import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '@screens/WelcomeScreen';
import { HomeScreen } from '@screens/HomeScreen';
import { QuizScreen } from '@screens/QuizScreen';
import { ResultsScreen } from '@screens/ResultsScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Quiz: { difficulty: 'easy' | 'medium' | 'hard' };
  Results: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};