import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SurveyListScreen from '../screens/survey/SurveyListScreen';
import FarmerSelectScreen from '../screens/survey/FarmerSelectScreen';
import QuestionnaireScreen from '../screens/survey/QuestionnaireScreen';
import SurveyReviewScreen from '../screens/survey/SurveyReviewScreen';
import SurveyCompleteScreen from '../screens/survey/SurveyCompleteScreen';

const Stack = createStackNavigator();

const HEADER = {
  headerStyle: { backgroundColor: '#013358' },
  headerTintColor: '#ffffff',
  headerTitleStyle: { fontWeight: '600' as const },
};

export default function SurveyNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ cardStyle: { backgroundColor: '#f1f5f9' } }}
    >
      <Stack.Screen
        name="SurveyList"
        component={SurveyListScreen}
        options={{ ...HEADER, title: 'Surveys' }}
      />
      <Stack.Screen
        name="FarmerSelect"
        component={FarmerSelectScreen}
        options={{ ...HEADER, title: 'Select Farmer' }}
      />
      <Stack.Screen
        name="Questionnaire"
        component={QuestionnaireScreen}
        options={{ ...HEADER, title: 'Questionnaire' }}
      />
      <Stack.Screen
        name="SurveyReview"
        component={SurveyReviewScreen}
        options={{ ...HEADER, title: 'Review Answers' }}
      />
      <Stack.Screen
        name="SurveyComplete"
        component={SurveyCompleteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
