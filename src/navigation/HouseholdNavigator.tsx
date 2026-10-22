import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import HouseholdCaptureScreen from '../screens/household/HouseholdCaptureScreen';
import HouseholdListScreen from '../screens/household/HouseholdListScreen';
import HouseholdSearchScreen from '../screens/household/HouseholdSearchScreen';
import HouseholdSlipScreen from '../screens/household/HouseholdSlipScreen';
import HouseholdDetailsScreen from '../screens/household/HouseholdDetailsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HouseholdAccessDeniedScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.deniedContainer}>
      <View style={styles.deniedIconBox}>
        <Ionicons name="lock-closed" size={40} color="#dc2626" />
      </View>
      <Text style={styles.deniedTitle}>Access Restricted</Text>
      <Text style={styles.deniedDesc}>
        Household enrollment is restricted specifically to Household Enrollment Agents.
      </Text>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.navigate('MainApp')}
      >
        <Ionicons name="arrow-back" size={16} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.backBtnText}>Return to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Footer Tab Navigator matching MainTabNavigator ──
function HouseholdTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'HouseholdCapture') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HouseholdList') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'HouseholdSearch') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'HouseholdSlip') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#013358',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HouseholdCapture"
        component={HouseholdCaptureScreen}
        options={{ title: 'Add Household' }}
      />
      <Tab.Screen
        name="HouseholdList"
        component={HouseholdListScreen}
        options={{ title: 'View Households' }}
      />
      <Tab.Screen
        name="HouseholdSearch"
        component={HouseholdSearchScreen}
        options={{ title: 'Search' }}
      />
      <Tab.Screen
        name="HouseholdSlip"
        component={HouseholdSlipScreen}
        options={{ title: 'Dwelling Slip' }}
      />
    </Tab.Navigator>
  );
}

export default function HouseholdNavigator() {
  const { user } = useAuth() as any;
  const role = user?.role;
  const isAuthorized =
    role === 'household_agent' || role === 'agent' || role === 'admin' || role === 'manager';

  if (!isAuthorized) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#f8fafc' } }}>
        <Stack.Screen name="HouseholdAccessDenied" component={HouseholdAccessDeniedScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="HouseholdTabs"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="HouseholdTabs" component={HouseholdTabNavigator} />
      <Stack.Screen
        name="HouseholdDetails"
        component={HouseholdDetailsScreen}
        options={{
          headerShown: true,
          title: 'Household Details',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#013358',
        }}
      />
      <Stack.Screen
        name="HouseholdSlip"
        component={HouseholdSlipScreen}
        options={{
          headerShown: true,
          title: 'Dwelling Slip',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#013358',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  deniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#f8fafc',
  },
  deniedIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  deniedDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#013358',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
