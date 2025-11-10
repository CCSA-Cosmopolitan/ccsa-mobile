import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { farmInfoSchema } from '../utils/validation';
import { farmService } from '../services/farmService';
import { offlineSyncService } from '../services/offlineSyncService';
import { calculateFarmSizeFromPolygon, processFarmDataWithSize, validateFarmCoordinates } from '../utils/farmCalculations';
import LoadingScreen from './LoadingScreen';
import FarmInfoStep from '../components/forms/FarmInfoStep';
import SyncStatusModal from '../components/SyncStatusModal';

// Extended farm validation schema - making key fields required
const farmSchema = z.object({
  farmInfo: farmInfoSchema,
  farmLatitude: z.string().optional(),
  farmLongitude: z.string().optional(),
  farmPolygon: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    timestamp: z.string().optional(),
    accuracy: z.number().optional(),
  })).min(3, 'Farm boundary must have at least 3 points'), // Made required with minimum 3 points
  soilType: z.string().min(1, 'Soil type is required'),
  soilPH: z.string().optional(),
  soilFertility: z.string().min(1, 'Soil fertility information is required'),
  farmCoordinates: z.any().optional(),
  coordinateSystem: z.string().optional(),
  farmArea: z.string().optional(), // This will be calculated automatically
  farmElevation: z.string().optional(),
  year: z.string().min(1, 'Year is required'),
  yieldSeason: z.string().min(1, 'Yield season is required'),
  crop: z.string().optional(),
  quantity: z.string().min(1, 'Quantity information is required'),
}).passthrough(); // Allow additional fields that might be added by components

export default function AddFarmScreen({ navigation, route }) {
  const { farmerId, farmer } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Safety check for farmer data
  React.useEffect(() => {
    if (!farmerId || !farmer) {
      Alert.alert(
        'Error',
        'Missing farmer information. Returning to farmers list.',
        [{ text: 'OK', onPress: () => navigation.navigate('FarmersList') }]
      );
    }
  }, [farmerId, farmer, navigation]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    // Load pending sync count
    loadPendingSyncCount();

    return () => unsubscribe();
  }, []);

  // Setup auto-sync when network becomes available
  useEffect(() => {
    const unsubscribe = offlineSyncService.setupNetworkListener(async (result) => {
      if (result.synced > 0) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.synced} farm(s) from offline storage.`,
          [{ text: 'OK' }]
        );
        loadPendingSyncCount();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadPendingSyncCount = async () => {
    try {
      const count = await offlineSyncService.getPendingCount();
      setPendingSyncCount(count);
    } catch (error) {
      console.error('Error loading pending sync count:', error);
    }
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      farmInfo: {
        farmLocation: '',
        farmSize: '',
        farmCategory: '',
        landforms: '',
        farmOwnership: '',
        state: '',
        localGovernment: '',
        farmingSeason: '',
        ward: '',
        pollingUnit: '',
        primaryCrop: '',
        secondaryCrop: [],
        farmingExperience: '',
        farmSeason: '',
        coordinates: null,
      },
      farmLatitude: '',
      farmLongitude: '',
      farmPolygon: [],
      soilType: '',
      soilPH: '',
      soilFertility: '',
      farmCoordinates: null,
      coordinateSystem: 'WGS84',
      farmArea: '',
      farmElevation: '',
      year: new Date().getFullYear().toString(),
      yieldSeason: '',
      crop: '',
      quantity: '',
    },
  });

  // Watch for farmPolygon changes and auto-calculate farm size
  const watchedPolygon = watch('farmPolygon');
  
  useEffect(() => {
    if (watchedPolygon && Array.isArray(watchedPolygon) && watchedPolygon.length > 0) {
      try {
        // Calculate farm size from polygon coordinates
        const calculatedSize = calculateFarmSizeFromPolygon(watchedPolygon);
        
        if (calculatedSize > 0) {
          // Update the farmSize field with calculated value
          setValue('farmInfo.farmSize', calculatedSize.toString());
        }
      } catch (error) {
        // Silently handle farm size calculation errors
        console.log('Farm size calculation error:', error);
      }
    }
  }, [watchedPolygon, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Safety check
      if (!farmerId || !farmer) {
        throw new Error('Missing farmer information');
      }

      // Flatten the nested farmInfo structure to match API expectations
      const flattenedData = {
        // Extract and flatten farmInfo fields
        farmSize: data.farmInfo?.farmSize || '',
        primaryCrop: data.farmInfo?.primaryCrop || '',
        produceCategory: data.farmInfo?.farmCategory || '',
        farmOwnership: data.farmInfo?.farmOwnership || '',
        farmState: data.farmInfo?.state || '',
        farmLocalGovernment: data.farmInfo?.localGovernment || '',
        farmingSeason: data.farmInfo?.farmSeason || '',
        farmWard: data.farmInfo?.ward || '',
        farmPollingUnit: data.farmInfo?.pollingUnit || '',
        secondaryCrop: Array.isArray(data.farmInfo?.secondaryCrop) 
          ? data.farmInfo.secondaryCrop.join(', ') 
          : (data.farmInfo?.secondaryCrop || ''),
        farmingExperience: data.farmInfo?.farmingExperience || '',
        
        // Coordinates from farmInfo
        farmLatitude: data.farmInfo?.coordinates?.latitude?.toString() || '',
        farmLongitude: data.farmInfo?.coordinates?.longitude?.toString() || '',
        
        // Top-level fields
        farmPolygon: data.farmPolygon || [],
        soilType: data.soilType || '',
        soilPH: data.soilPH || '',
        soilFertility: data.soilFertility || '',
        farmCoordinates: data.farmCoordinates || null,
        coordinateSystem: data.coordinateSystem || 'WGS84',
        farmArea: data.farmArea || '',
        farmElevation: data.farmElevation || '',
        year: data.year || '',
        yieldSeason: data.yieldSeason || '',
        crop: data.crop || '',
        quantity: data.quantity || '',
      };

      // Use the enhanced farm processing utility to handle data and calculate farm size
      const processedData = processFarmDataWithSize(flattenedData);

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const hasNetwork = netInfo.isConnected && netInfo.isInternetReachable;

      if (!hasNetwork) {
        // Save offline and notify user
        await offlineSyncService.saveFarmOffline(farmerId, processedData, farmer);
        await loadPendingSyncCount();
        
        Alert.alert(
          'Saved Offline',
          'No internet connection. Farm data has been saved locally and will sync automatically when you\'re back online.',
          [
            {
              text: 'View Sync Status',
              onPress: () => setSyncModalVisible(true)
            },
            { 
              text: 'Add Another Farm', 
              onPress: () => {
                navigation.replace('AddFarm', { farmerId, farmer });
              }
            },
            { 
              text: 'Done', 
              onPress: () => navigation.navigate('FarmerDetails', { farmerId, farmer })
            }
          ]
        );
      } else {
        // Try to sync online
        try {
          await farmService.createFarm(farmerId, processedData);
          
          Alert.alert(
            'Success', 
            'Farm added successfully!',
            [
              {
                text: 'Add Another Farm', 
                onPress: () => {
                  navigation.replace('AddFarm', { farmerId, farmer });
                }
              },
              { 
                text: 'View Farmer', 
                onPress: () => navigation.navigate('FarmerDetails', { farmerId, farmer })
              },
              { 
                text: 'Done (Add New Farmer)', 
                onPress: () => {
                  navigation.navigate('MainApp', { 
                    screen: 'MainTabs', 
                    params: { screen: 'AddFarmer' } 
                  });
                }
              }
            ]
          );
        } catch (networkError) {
          // If online submission fails, save offline as fallback
          console.log('Online submission failed, saving offline:', networkError);
          await offlineSyncService.saveFarmOffline(farmerId, processedData, farmer);
          await loadPendingSyncCount();
          
          Alert.alert(
            'Saved Offline',
            'Unable to reach server. Farm data has been saved locally and will sync when connection is restored.',
            [
              {
                text: 'View Sync Status',
                onPress: () => setSyncModalVisible(true)
              },
              { 
                text: 'OK',
                onPress: () => navigation.navigate('FarmerDetails', { farmerId, farmer })
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Farm creation error:', error);
      Alert.alert('Error', error.message || 'Failed to add farm');
    } finally {
      setLoading(false);
    }
  };

  // Add form validation error handler
  const onFormError = (errors) => {
    // Get first error message to show user
    const errorPaths = Object.keys(errors);
    const firstErrorPath = errorPaths[0];
    const firstError = errors[firstErrorPath];
    const errorMessage = firstError?.message || 'Please check the form for errors';
    
    Alert.alert(
      'Form Validation Error', 
      `${firstErrorPath}: ${errorMessage}\n\nTotal errors: ${errorPaths.length}`,
      [
        { text: 'Fix Errors', style: 'cancel' },
        { 
          text: 'Submit Anyway', 
          style: 'destructive',
          onPress: () => {
            // Force submission with current data
            const currentData = watch();
            onSubmit(currentData);
          }
        }
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Adding farm..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Network Status & Sync Indicator */}
        <View style={styles.statusBar}>
          <View style={[styles.networkIndicator, isOnline ? styles.online : styles.offline]}>
            <Ionicons name={isOnline ? 'wifi' : 'wifi-outline'} size={16} color="#ffffff" />
            <Text style={styles.networkText}>{isOnline ? 'Online' : 'Offline Mode'}</Text>
          </View>
          {pendingSyncCount > 0 && (
            <TouchableOpacity 
              style={styles.syncBadge} 
              onPress={() => setSyncModalVisible(true)}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#f59e0b" />
              <Text style={styles.syncBadgeText}>{pendingSyncCount} pending</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Farmer Info Summary */}
        <View style={styles.farmerSummary}>
          <Text style={styles.farmerSummaryTitle}>Adding farm for:</Text>
          <Text style={styles.farmerName}>
            {farmer?.firstName || 'Unknown'} {farmer?.lastName || 'Farmer'}
          </Text>
          <Text style={styles.farmerNin}>NIN: {farmer?.nin || 'Unknown'}</Text>
        </View>

        {/* Form */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            <FarmInfoStep
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              showTitle={false}
            />
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              // Try form submission
              const submitFunction = handleSubmit(onSubmit, onFormError);
              submitFunction();
            }}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding Farm...' : isOnline ? 'Add Farm' : 'Save Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Sync Status Modal */}
      <SyncStatusModal 
        visible={syncModalVisible} 
        onClose={() => {
          setSyncModalVisible(false);
          loadPendingSyncCount();
        }} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  online: {
    backgroundColor: '#10b981',
  },
  offline: {
    backgroundColor: '#ef4444',
  },
  networkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    gap: 4,
  },
  syncBadgeText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  farmerSummary: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  farmerSummaryTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  farmerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  farmerNin: {
    fontSize: 14,
    color: '#6b7280',
  },
  formContainer: {
    flex: 1,
  },
  formWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#013358',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
