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
import AgriBusinessScreen from '../screens/AgriBusinessScreen';
import AgriBusinessLeadFormScreen from '../screens/AgriBusinessLeadFormScreen';
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
import EditProfileScreen from '../screens/EditProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import ZoraScreen from '../screens/ZoraScreen';
import CorrectionNavigator from './CorrectionNavigator';
import SurveyNavigator from './SurveyNavigator';
import HouseholdNavigator from './HouseholdNavigator';
import HouseholdDetailsScreen from '../screens/household/HouseholdDetailsScreen';
import HouseholdSlipScreen from '../screens/household/HouseholdSlipScreen';
import BrandedSplashScreen from '../screens/BrandedSplashScreen';


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

import AgriBusinessNavigator from './AgriBusinessNavigator';

// Drawer Navigator for secondary navigation
function DrawerNavigator() {
  const { user } = useAuth();
  const role = user?.role;
  const isSuper = role === 'admin' || role === 'manager';

  const initialRoute =
    role === 'household_agent'
      ? 'HouseholdApp'
      : role === 'agri_business_agent'
      ? 'AgriBusinessApp'
      : role === 'survey_agent'
      ? 'SurveyApp'
      : role === 'data_correction_agent'
      ? 'CorrectionApp'
      : 'MainTabs';

  const canAccessFarmers = isSuper || role === 'agent' || !role;
  const canAccessHouseholds = isSuper || role === 'household_agent';
  const canAccessAgriBusiness = isSuper || role === 'agri_business_agent';
  const canAccessSurveys = isSuper || role === 'survey_agent';
  const canAccessCorrections = isSuper || role === 'data_correction_agent';

  return (
    <Drawer.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        drawerActiveTintColor: '#013358',
        drawerInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#013358',
        },
        headerTintColor: '#fff',
      }}
    >
      {canAccessFarmers && (
        <Drawer.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{ 
            title: 'Farmer Enrollment',
            drawerIcon: ({ color }) => <Ionicons name="leaf-outline" size={22} color={color} />
          }}
        />
      )}
      {canAccessHouseholds && (
        <Drawer.Screen 
          name="HouseholdApp" 
          component={HouseholdNavigator} 
          options={{ 
            title: 'Household Enrollment',
            drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
          }}
        />
      )}
      {canAccessAgriBusiness && (
        <Drawer.Screen 
          name="AgriBusinessApp" 
          component={AgriBusinessNavigator} 
          options={{ 
            title: 'Agri-Business Directory',
            drawerIcon: ({ color }) => <Ionicons name="business-outline" size={22} color={color} />
          }}
        />
      )}
      {canAccessSurveys && (
        <Drawer.Screen 
          name="SurveyApp" 
          component={SurveyNavigator} 
          options={{ 
            title: 'Field Surveys',
            drawerIcon: ({ color }) => <Ionicons name="clipboard-outline" size={22} color={color} />
          }}
        />
      )}
      {canAccessCorrections && (
        <Drawer.Screen 
          name="CorrectionApp" 
          component={CorrectionNavigator} 
          options={{ 
            title: 'Data Correction',
            drawerIcon: ({ color }) => <Ionicons name="pencil-outline" size={22} color={color} />
          }}
        />
      )}
      <Drawer.Screen 
        name="ZoraAI" 
        component={ZoraScreen} 
        options={{ 
          title: 'Zora AI Agronomist',
          drawerIcon: ({ color }) => <Ionicons name="sparkles" size={22} color="#059669" />
        }}
      />
      <Drawer.Screen 
        name="Attendance" 
        component={AttendanceScreen} 
        options={{ 
          drawerIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />
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
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />
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
          {/* Main App with drawer — direct access without intermediate module hub */}
          <Stack.Screen
            name="MainApp"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
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
            name="ZoraApp"
            component={ZoraScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AgriBusinessApp"
            component={AgriBusinessNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HouseholdApp"
            component={HouseholdNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AgriBusinessLeadForm"
            component={AgriBusinessLeadFormScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="FarmerDetails" 
            component={FarmerDetailsScreen}
            options={{ headerShown: true, title: 'Farmer Details' }}
          />
          <Stack.Screen 
            name="HouseholdDetails" 
            component={HouseholdDetailsScreen}
            options={{ 
              headerShown: true, 
              title: 'Household Details',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="HouseholdSlip" 
            component={HouseholdSlipScreen}
            options={{ 
              headerShown: true, 
              title: 'Dwelling Slip',
              headerBackTitle: 'Back'
            }}
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
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ 
              headerShown: true,
              title: 'Edit Profile',
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
