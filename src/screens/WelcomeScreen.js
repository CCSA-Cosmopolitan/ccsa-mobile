import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>CCSA FIMS</Text>
          <Text style={styles.subtitle}>
            Farmers Information Management System
          </Text>
          {/* <Text style={styles.description}>
            Register and manage Nigerian farmers' data with advanced features including geolocation, search, and certificate generation.
          </Text> */}
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="person-add" size={24} color="#013358" />
            <Text style={styles.featureText}>Register Farmers</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="location" size={24} color="#013358" />
            <Text style={styles.featureText}>GPS & Mapping</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="search" size={24} color="#013358" />
            <Text style={styles.featureText}>Search & Analytics</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="document" size={24} color="#013358" />
            <Text style={styles.featureText}>Generate Certificates</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity> */}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For Enrolment Agents Only
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  feature: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttons: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#013358',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#013358',
  },
  secondaryButtonText: {
    color: '#013358',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
