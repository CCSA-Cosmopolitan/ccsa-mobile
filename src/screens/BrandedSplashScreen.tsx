import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import brand from '../theme/brand';

const { width } = Dimensions.get('window');

export default function BrandedSplashScreen({ navigation }: { navigation: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: false,
      }),
    ]).start();

    // Transition to module selection screen after delay
    const timer = setTimeout(() => {
      handleProceed();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const handleProceed = () => {
    navigation.replace('MainApp');
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.55],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#012440" />

      {/* Background Decorative Rings */}
      <View style={styles.bgGlow} />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleProceed}
        style={styles.content}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo Badge */}
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Platform Identity */}
          <Text style={styles.title}>CCSA FIMS</Text>
          <Text style={styles.subtitle}>Centre for Climate-Smart Agriculture</Text>

          <View style={styles.pill}>
            <Text style={styles.pillText}>FIELD OPERATIONS & INTERVENTIONS</Text>
          </View>

          <Text style={styles.missionText}>
            Empowering agricultural households, interventions, and sustainable energy across Africa.
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>

          <Text style={styles.loadingText}>Initializing secure field workspace…</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>COSMOPOLITAN UNIVERSITY • CCSA PLATFORM</Text>
        <Text style={styles.versionText}>v2.4.0 (Offline-Enabled Build)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#012440', // Deep Navy
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  animatedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoBadge: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoImage: {
    width: 76,
    height: 76,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    marginTop: 4,
    textAlign: 'center',
  },
  pill: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 1.2,
  },
  missionText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
    maxWidth: 280,
  },
  progressTrack: {
    width: width * 0.55,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 32,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  versionText: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
});
