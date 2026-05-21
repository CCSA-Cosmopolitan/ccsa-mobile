import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';

const PRIMARY = '#013358';
const BG = '#f1f5f9';

// ─── Reusable components ──────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: '#94a3b8',
      letterSpacing: 1, textTransform: 'uppercase',
      marginTop: 20, marginBottom: 10,
    }}>
      {title}
    </Text>
  );
}

function MenuItem({
  icon, label, sublabel, onPress, danger = false,
}: {
  icon: any;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: '#fff', borderRadius: 12,
        padding: 14, flexDirection: 'row', alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: danger ? '#fee2e2' : '#eff6ff',
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
      }}>
        <Ionicons name={icon} size={20} color={danger ? '#ef4444' : PRIMARY} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: danger ? '#ef4444' : '#0f172a' }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sublabel}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AgentProfileScreen({ navigation }: { navigation: any }) {
  const { user, signOut } = useAuth() as any;

  const rawName: string = user?.displayName || user?.email?.split('@')[0] || 'Field Agent';
  const email: string = user?.email || '';
  const initial = rawName[0].toUpperCase();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── Navy header ── */}
      <View style={{
        backgroundColor: PRIMARY,
        paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20,
      }}>
        {/* Back + label row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12, padding: 4 }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{
            color: '#93c5fd', fontSize: 11,
            fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
          }}>
            PROFILE
          </Text>
        </View>

        {/* Avatar + agent info */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
            marginRight: 16,
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{initial}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{rawName}</Text>
            <Text style={{ color: '#93c5fd', fontSize: 13, marginTop: 2 }}>{email}</Text>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
              paddingHorizontal: 10, paddingVertical: 3,
              alignSelf: 'flex-start', marginTop: 6,
            }}>
              <Text style={{ color: '#bfdbfe', fontSize: 11, fontWeight: '600' }}>Field Agent</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Menu ── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel title="Field Operations" />
        <MenuItem
          icon="time-outline"
          label="Attendance"
          sublabel="Check in / check out for today"
          onPress={() => navigation.navigate('AgentAttendance')}
        />

        <SectionLabel title="Account" />
        <MenuItem
          icon="key-outline"
          label="Change Password"
          sublabel="Update your login password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <MenuItem
          icon="help-circle-outline"
          label="Support"
          sublabel="Get help or contact support"
          onPress={() =>
            Alert.alert('Support', 'For support, contact:\nsupport@ccsaagric.gov.ng')
          }
        />
        <MenuItem
          icon="information-circle-outline"
          label="About"
          sublabel="CCSA FIMS v2.0"
          onPress={() =>
            Alert.alert(
              'About',
              'CCSA Farmers Information Management System\nVersion 2.0\n\n© 2025 CCSA',
            )
          }
        />

        <SectionLabel title="Session" />
        <MenuItem
          icon="log-out-outline"
          label="Sign Out"
          sublabel="Sign out of your account"
          onPress={handleSignOut}
          danger
        />
      </ScrollView>
    </View>
  );
}
