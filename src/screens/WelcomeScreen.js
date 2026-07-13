import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import brand from '../theme/brand';

const MODULES = [
  {
    key: 'agribusiness',
    icon: 'business-outline',
    title: 'Agri-Business',
    desc: 'Partner onboarding and stakeholder opportunities',
  },
  {
    key: 'enrollment',
    icon: 'leaf-outline',
    title: 'Farm Enrollment',
    desc: 'Register farmers and capture farm data',
  },
  {
    key: 'correction',
    icon: 'create-outline',
    title: 'Data Correction',
    desc: 'Review and update existing farmer records',
  },
  {
    key: 'survey',
    icon: 'clipboard-outline',
    title: 'Surveys',
    desc: 'Conduct structured field questionnaires',
  },
];

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={brand.colors.white} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
        {/* Logo + brand */}
        <View style={styles.brand}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>CCSA FIMS</Text>
          <Text style={styles.brandSub}>Field Operations Platform</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Module list */}
        <Text style={styles.sectionLabel}>Select a module to continue</Text>

        {MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.key}
            style={styles.moduleRow}
            onPress={() => navigation.navigate('Login', { module: mod.key })}
            activeOpacity={0.7}
          >
            <View style={styles.moduleIconWrap}>
              <Ionicons name={mod.icon} size={22} color={brand.colors.primary} />
            </View>
            <View style={styles.moduleBody}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleDesc}>{mod.desc}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        ))}

        {/* Apply button */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => navigation.navigate('Apply')}
          activeOpacity={0.7}
        >
          <Text style={styles.applyButtonText}>Apply as Field Agent</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.colors.white,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  inner: {
    width: '100%',
    alignItems: 'center',
  },

  // Brand
  brand: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.colors.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandSub: {
    fontSize: 13,
    color: brand.colors.gray,
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: brand.colors.lightGray,
    marginBottom: 24,
    width: '100%',
  },

  sectionLabel: {
    fontSize: 12,
    color: brand.colors.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
    width: '100%',
  },

  // Module rows
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    width: '100%',
    borderWidth: 1.5,
    borderColor: brand.colors.primaryLight,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: brand.colors.white,
  },
  moduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: brand.colors.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  moduleBody: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.colors.text,
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 12,
    color: brand.colors.darkGray,
    lineHeight: 17,
  },

  // Apply button
  applyButton: {
    marginTop: 24,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.colors.primaryLight,
    alignItems: 'center',
    backgroundColor: brand.colors.white,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.colors.darkGray,
  },
});

