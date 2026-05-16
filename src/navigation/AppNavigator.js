import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../store/AuthContext';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ApplyScreen from '../screens/ApplyScreen';
import AddFarmerScreen from '../screens/AddFarmerScreen';
import AddFarmScreen from '../screens/AddFarmScreen';
import FarmersListScreen from '../screens/FarmersListScreen';
import SearchFarmerScreen from '../screens/SearchFarmerScreen';
import CertificateScreen from '../screens/CertificateScreen';
import FarmerDetailsScreen from '../screens/FarmerDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LoadingScreen from '../screens/LoadingScreen';
import HomeScreen from '../screens/HomeScreen';
import CorrectionNavigator from './CorrectionNavigator';
import SurveyNavigator from './SurveyNavigator';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Bottom Tab Navigator for main screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AddFarmer') {
            iconName = focused ? 'person-add' : 'person-add-outline';
          } else if (route.name === 'FarmersList') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Certificate') {
            iconName = focused ? 'document' : 'document-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#013358',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="AddFarmer" 
        component={AddFarmerScreen} 
        options={{ title: 'Add Farmer' }}
      />
      <Tab.Screen 
        name="FarmersList" 
        component={FarmersListScreen} 
        options={{ title: 'View Farmers' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchFarmerScreen} 
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="Certificate" 
        component={CertificateScreen} 
        options={{ title: 'Certificate' }}
      />
    </Tab.Navigator>
  );
}

// Drawer Navigator for secondary navigation
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#013358',
        drawerInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#013358',
        },
        headerTintColor: '#fff',
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabNavigator} 
        options={{ 
          title: 'FIMS Dashboard',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="analytics-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Attendance" 
        component={AttendanceScreen} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}

// Temporary placeholder — replaced in later sprints when module navigators are built
function ComingSoonScreen({ route }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#475569' }}>
        {route.params?.title ?? 'Coming Soon'}
      </Text>
      <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
        This module is being prepared
      </Text>
    </View>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { user, loading, error } = useAuth();

  // Show loading screen while auth is initializing
  if (loading) {
    return <LoadingScreen />;
  }

  // Show error screen if auth initialization failed
  // if (error) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
  //       <Ionicons name="warning-outline" size={60} color="#ef4444" />
  //       <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 16, textAlign: 'center' }}>
  //         Authentication Service Error
  //       </Text>
  //       <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
  //         {error}
  //       </Text>
  //       <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, textAlign: 'center' }}>
  //         Please restart the app or check your network connection.
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated screens
        <>
          {/* Module hub — no back button so it acts as the root */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          {/* Farm Enrollment — existing flow, untouched */}
          <Stack.Screen
            name="EnrollmentApp"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
          {/* Data Correction — full module navigator */}
          <Stack.Screen
            name="CorrectionApp"
            component={CorrectionNavigator}
            options={{ headerShown: false }}
          />
          {/* Surveys — full navigator */}
          <Stack.Screen
            name="SurveyApp"
            component={SurveyNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="FarmerDetails" 
            component={FarmerDetailsScreen}
            options={{ headerShown: true, title: 'Farmer Details' }}
          />
          <Stack.Screen 
            name="AddFarm" 
            component={AddFarmScreen}
            options={{ 
              headerShown: true, 
              title: 'Add Farm',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="ChangePassword" 
            component={ChangePasswordScreen}
            options={{ 
              headerShown: true,
              title: 'Change Password',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="Certificate" 
            component={CertificateScreen}
            options={{ 
              headerShown: true,
              title: 'Certificate',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="AttendanceDetails" 
            component={AttendanceScreen}
            options={{ 
              headerShown: true,
              title: 'Attendance Tracking',
              headerBackTitle: 'Back'
            }}
          />
        </>
      ) : (
        // Unauthenticated screens
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Apply" component={ApplyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
