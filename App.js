import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/store/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={styles.container}>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
              <NetworkStatusBanner />
              <StatusBar 
                style="dark" 
                backgroundColor="transparent"
                translucent={Platform.OS === 'android'}
              />
            </NavigationContainer>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
