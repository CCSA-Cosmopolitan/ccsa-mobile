import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  navTarget: string;
  roles: string[];
  iconColor: string;
  iconBg: string;
}

// ─── Module registry ─────────────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: 'enrollment',
    title: 'Farm Enrollment',
    description: 'Register new farmers and capture farm data with NIN validation.',
    icon: 'leaf',
    navTarget: 'EnrollmentApp',
    roles: ['agent', 'admin'],
    iconColor: '#013358',
    iconBg: '#dbeafe',
  },
  {
    id: 'correction',
    title: 'Data Correction',
    description: 'Search, review and update existing farmer records.',
    icon: 'create-outline',
    navTarget: 'CorrectionApp',
    roles: ['data_correction_agent', 'admin'],
    iconColor: '#92400e',
    iconBg: '#fef3c7',
  },
  {
    id: 'survey',
    title: 'Surveys',
    description: 'Conduct questionnaires with registered farmers in the field.',
    icon: 'clipboard-outline',
    navTarget: 'SurveyApp',
    roles: ['survey_agent', 'admin'],
    iconColor: '#065f46',
    iconBg: '#d1fae5',
  },
];

const ROLE_LABELS: Record<string, string> = {
  agent: 'Enrollment Agent',
  data_correction_agent: 'Correction Agent',
  survey_agent: 'Survey Agent',
  admin: 'Administrator',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, signOut } = useAuth() as any;
  const role: string = user?.role ?? 'agent';

  const visibleModules = MODULES.filter((m) => m.roles.includes(role));

  // Single-module users skip the home screen entirely
  useEffect(() => {
    if (visibleModules.length === 1) {
      navigation.replace(visibleModules[0].navTarget);
    }
  }, []);

  const displayName: string =
    user?.firstName
      ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
      : user?.displayName ?? user?.email ?? 'Field Agent';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(); } catch {}
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar barStyle="light-content" backgroundColor="#013358" />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: '#013358',
          paddingTop: 52,
          paddingBottom: 32,
          paddingHorizontal: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: '#93c5fd', fontSize: 13, marginBottom: 4 }}>
              Welcome back
            </Text>
            <Text
              style={{ color: '#ffffff', fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {/* Role badge */}
            <View
              style={{
                marginTop: 10,
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#bfdbfe', fontSize: 12, fontWeight: '600' }}>
                {ROLE_LABELS[role] ?? role}
              </Text>
            </View>
          </View>

          {/* Sign-out button */}
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.75}
            style={{
              padding: 10,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 10,
              marginTop: 2,
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Module cards ── */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#94a3b8',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Your Modules
        </Text>

        {visibleModules.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            onPress={() => navigation.navigate(mod.navTarget)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: mod.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons name={mod.icon} size={26} color={mod.iconColor} />
            </View>

            {/* Text */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 3 }}>
                {mod.title}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 18 }}>
                {mod.description}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ))}

        {/* No modules assigned */}
        {visibleModules.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 72 }}>
            <Ionicons name="lock-closed-outline" size={52} color="#cbd5e1" />
            <Text
              style={{
                color: '#94a3b8',
                fontSize: 15,
                marginTop: 14,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              No modules are assigned to your account.{'\n'}Contact your administrator.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
