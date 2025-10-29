import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NetworkStatus = ({ onRetry, style }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    checkConnectivity();
  }, []);

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsConnected(response.ok);
    } catch (error) {
      // console.log('Network check failed:', error.message);
      setIsConnected(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkConnectivity();
    if (onRetry) {
      await onRetry();
    }
    setIsRetrying(false);
  };

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Ionicons name="wifi-off" size={20} color="#ef4444" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>
            Check your network and try again
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetry}
          disabled={isRetrying}
        >
          <Text style={styles.retryText}>
            {isRetrying ? 'Checking...' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fee2e2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  subtitle: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NetworkStatus;
