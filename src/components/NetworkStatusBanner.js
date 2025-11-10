import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { offlineCacheService } from '../services/offlineCacheService';

/**
 * Global Network Status Indicator
 * Shows a persistent banner at the top when offline
 */
export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-60));
  const [cacheStats, setCacheStats] = useState(null);

  useEffect(() => {
    // Initialize cache service and get initial status
    const init = async () => {
      await offlineCacheService.initialize();
      const online = await offlineCacheService.checkOnline();
      setIsOnline(online);
      setShowBanner(!online);
    };

    init();

    // Subscribe to network changes
    const unsubscribe = offlineCacheService.onNetworkChange((online) => {
      setIsOnline(online);
      
      if (!online) {
        // Going offline - show banner
        setShowBanner(true);
        slideDown();
        loadCacheStats();
      } else {
        // Going online - slide up banner after a delay
        setTimeout(() => {
          slideUp();
          setTimeout(() => setShowBanner(false), 300);
        }, 2000);
      }
    });

    return unsubscribe;
  }, []);

  const loadCacheStats = async () => {
    const stats = await offlineCacheService.getCacheStats();
    setCacheStats(stats);
  };

  const slideDown = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const slideUp = () => {
    Animated.spring(slideAnim, {
      toValue: -60,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        isOnline ? styles.bannerOnline : styles.bannerOffline,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={isOnline ? "cloud-done" : "cloud-offline"}
          size={20}
          color="#fff"
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isOnline ? "Back Online" : "Offline Mode"}
          </Text>
          <Text style={styles.subtitle}>
            {isOnline 
              ? "Connection restored. Syncing data..." 
              : "You can continue working. Data will sync when online."
            }
          </Text>
        </View>
        
        {!isOnline && cacheStats && (
          <TouchableOpacity
            style={styles.infoButton}
            onPress={loadCacheStats}
          >
            <Ionicons name="information-circle" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    paddingTop: 40, // Account for status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerOffline: {
    backgroundColor: '#f59e0b', // Amber
  },
  bannerOnline: {
    backgroundColor: '#10b981', // Green
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.95,
  },
  infoButton: {
    padding: 4,
  },
});
