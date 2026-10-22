import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AgriBusinessScreen from '../screens/AgriBusinessScreen';
import AgriBusinessLeadFormScreen from '../screens/AgriBusinessLeadFormScreen';

const Stack = createStackNavigator();

export default function AgriBusinessNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AgriBusinessList"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="AgriBusinessList" component={AgriBusinessScreen} />
      <Stack.Screen name="AgriBusinessLeadForm" component={AgriBusinessLeadFormScreen} />
    </Stack.Navigator>
  );
}
