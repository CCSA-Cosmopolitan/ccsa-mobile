import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FarmerSearchScreen from '../screens/correction/FarmerSearchScreen';
import FarmerCorrectionDetailScreen from '../screens/correction/FarmerCorrectionDetailScreen';
import FarmerEditScreen from '../screens/correction/FarmerEditScreen';
import FarmCorrectionDetailScreen from '../screens/correction/FarmCorrectionDetailScreen';
import FarmEditScreen from '../screens/correction/FarmEditScreen';
import RefereeEditScreen from '../screens/correction/RefereeEditScreen';

const Stack = createStackNavigator();

export default function CorrectionNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f1f5f9' },
      }}
    >
      <Stack.Screen name="CorrectionSearch"      component={FarmerSearchScreen} />
      <Stack.Screen name="CorrectionDetail"      component={FarmerCorrectionDetailScreen} />
      <Stack.Screen name="CorrectionEdit"        component={FarmerEditScreen} />
      <Stack.Screen name="FarmCorrectionDetail"  component={FarmCorrectionDetailScreen} />
      <Stack.Screen name="FarmEdit"              component={FarmEditScreen} />
      <Stack.Screen name="RefereeEdit"           component={RefereeEditScreen} />
    </Stack.Navigator>
  );
}
