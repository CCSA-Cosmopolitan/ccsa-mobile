import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import brand from '../theme/brand';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2-column grid spacing

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  navTarget: string;
  roles: string[];
}

// ─── Module registry ─────────────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: 'household',
    title: 'Household Capture',
    subtitle: 'Family leaders, dependents, PUE energy & networks',
    category: 'COMMUNITY AID',
    icon: 'home-outline',
    navTarget: 'HouseholdApp',
    roles: ['household_agent', 'admin', 'manager'],
  },
  {
    id: 'enrollment',
    title: 'Farm Enrollment',
    subtitle: 'Farmers registration, land polygons & identity',
    category: 'CORE FIELD',
    icon: 'leaf-outline',
    navTarget: 'EnrollmentApp',
    roles: ['agent', 'admin', 'manager'],
  },
  {
    id: 'survey',
    title: 'Field Surveys',
    subtitle: 'Project questionnaires & field assessments',
    category: 'MONITORING',
    icon: 'clipboard-outline',
    navTarget: 'SurveyApp',
    roles: ['survey_agent', 'admin', 'manager'],
  },
  {
    id: 'correction',
    title: 'Data Correction',
    subtitle: 'Audit, verify and resolve data exceptions',
    category: 'DATA AUDIT',
    icon: 'pencil-outline',
    navTarget: 'CorrectionApp',
    roles: ['data_correction_agent', 'admin', 'manager'],
  },
  {
    id: 'agribusiness',
    title: 'Agri-Business',
    subtitle: 'Commercial stakeholders & KYB onboarding',
    category: 'COMMERCIAL',
    icon: 'business-outline',
    navTarget: 'AgriBusinessApp',
    roles: ['agri_business_agent', 'manager', 'admin'],
  },
  {
    id: 'zora',
    title: 'Zora Agronomist',
    subtitle: 'Agronomic guidance, diagnosis & weather AI',
    category: 'AGRI ADVISORY',
    icon: 'sparkles-outline',
    navTarget: 'ZoraApp',
    roles: ['agent', 'household_agent', 'data_correction_agent', 'survey_agent', 'agri_business_agent', 'manager', 'admin'],
  },
];

const ROLE_LABELS: Record<string, string> = {
  agent: 'Field Enrollment Agent',
  household_agent: 'Household Enrollment Agent',
  data_correction_agent: 'Data Correction Agent',
  survey_agent: 'Field Survey Agent',
  agri_business_agent: 'Agri-Business Officer',
  manager: 'Field Operations Manager',
  admin: 'System Administrator',
};

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, signOut } = useAuth() as any;
  const role: string = user?.role ?? 'agent';

  // Visible modules for the user's role
  const visibleModules = MODULES.filter((m) => m.roles.includes(role));

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
          try {
            await signOut();
          } catch {}
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#012440" />

      {/* ── Modern Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{ROLE_LABELS[role] ?? role}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.75}
            style={styles.signOutBtn}
          >
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Grid View ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SELECT MODULE</Text>
          <Text style={styles.sectionSubtitle}>
            {visibleModules.length} operational modules available
          </Text>
        </View>

        {/* 2-Column Grid */}
        <View style={styles.grid}>
          {visibleModules.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              onPress={() => navigation.navigate(mod.navTarget)}
              activeOpacity={0.85}
              style={styles.gridCard}
            >
              {/* Top Row: Category Tag & Icon */}
              <View style={styles.cardHeader}>
                <View style={styles.badgeTag}>
                  <Text style={styles.badgeText}>{mod.category}</Text>
                </View>
                <View style={styles.iconBox}>
                  <Ionicons name={mod.icon} size={22} color="#013358" />
                </View>
              </View>

              {/* Text Information */}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{mod.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {mod.subtitle}
                </Text>
              </View>

              {/* Footer Action */}
              <View style={styles.cardFooter}>
                <Text style={styles.openText}>Open module</Text>
                <Ionicons name="chevron-forward" size={14} color="#013358" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* No modules assigned fallback */}
        {visibleModules.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="lock-closed-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>
              No operational modules are assigned to your role.{'\n'}Please contact your field supervisor.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#012440',
    paddingTop: 52,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  name: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  roleBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleText: {
    color: '#bae6fd',
    fontSize: 11,
    fontWeight: '600',
  },
  signOutBtn: {
    padding: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#475569',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f0f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dceaf3',
  },
  cardBody: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  openText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#013358',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
