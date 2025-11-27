import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import PolygonMapMobile from '../PolygonMapMobile';

export default function FarmPolygonMapper({ onPolygonUpdate, initialPolygon = [] }) {
  const [isMapping, setIsMapping] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState(initialPolygon);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    onPolygonUpdate(polygonPoints);
  }, [polygonPoints]);

  useEffect(() => {
    // Start pulse animation when mapping
    if (isMapping) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isMapping) pulse();
        });
      };
      pulse();
    }
  }, [isMapping]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for farm mapping');
      return false;
    }
    return true;
  };

  const startMapping = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setIsMapping(true);
    setModalVisible(true);
    setPolygonPoints([]);
    
    // Start location tracking
    watchLocation();
  };

  const watchLocation = async () => {
    try {
      // Start continuous location tracking
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          });
        }
      );
      
      setLocationWatcher(watcher);
    } catch (error) {
      console.error('Error setting up location watcher:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const stopLocationWatching = () => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  const addPoint = async () => {
    if (!currentLocation) {
      Alert.alert('Location not available', 'Please wait for GPS to get your location');
      return;
    }

    const newPoint = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: new Date().toISOString(),
      accuracy: currentLocation.accuracy,
    };

    setPolygonPoints(prev => [...prev, newPoint]);
    
    Alert.alert(
      'Point Added',
      `Point ${polygonPoints.length + 1} added to farm boundary\nAccuracy: ${currentLocation.accuracy?.toFixed(1)}m`,
      [{ text: 'OK' }]
    );
  };

  const removeLastPoint = () => {
    if (polygonPoints.length > 0) {
      setPolygonPoints(prev => prev.slice(0, -1));
    }
  };

  const finishMapping = () => {
    if (polygonPoints.length < 3) {
      Alert.alert(
        'Insufficient Points',
        'Please add at least 3 points to create a farm boundary',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Complete Farm Mapping',
      `You have marked ${polygonPoints.length} boundary points. Do you want to finish mapping?`,
      [
        { text: 'Add More Points', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            setIsMapping(false);
            setModalVisible(false);
            stopLocationWatching();
            Alert.alert('Success', 'Farm boundary mapping completed!');
          }
        }
      ]
    );
  };

  const cancelMapping = () => {
    Alert.alert(
      'Cancel Mapping',
      'Are you sure you want to cancel? All marked points will be lost.',
      [
        { text: 'Continue Mapping', style: 'cancel' },
        {
          text: 'Cancel',
          onPress: () => {
            setPolygonPoints([]);
            setIsMapping(false);
            setModalVisible(false);
            stopLocationWatching();
          }
        }
      ]
    );
  };

  const calculateArea = () => {
    if (polygonPoints.length < 3) return 0;
    
    // Simple polygon area calculation (rough estimate)
    let area = 0;
    const points = polygonPoints;
    
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].latitude * points[j].longitude;
      area -= points[j].latitude * points[i].longitude;
    }
    
    return Math.abs(area) / 2 * 111320 * 111320; // Convert to square meters (rough)
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Farm Boundary Mapping</Text>
        <Text style={styles.subtitle}>
          {polygonPoints.length > 0 
            ? `${polygonPoints.length} points marked${polygonPoints.length >= 3 ? ` • Est. ${(calculateArea() / 10000).toFixed(2)} hectares` : ''}`
            : 'No boundary points marked'
          }
        </Text>
      </View>

      <TouchableOpacity
        style={styles.mapButton}
        onPress={startMapping}
      >
        <Ionicons name="map-outline" size={24} color="#ffffff" />
        <Text style={styles.mapButtonText}>
          {polygonPoints.length > 0 ? 'Update Farm Boundary' : 'Map Farm Boundary'}
        </Text>
      </TouchableOpacity>

      {polygonPoints.length > 0 && (
        <View style={styles.pointsList}>
          <Text style={styles.pointsTitle}>Boundary Points:</Text>
          {polygonPoints.slice(0, 3).map((point, index) => (
            <View key={index} style={styles.pointItem}>
              <Ionicons name="location" size={16} color="#10b981" />
              <Text style={styles.pointText}>
                Point {index + 1}: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
              </Text>
            </View>
          ))}
          {polygonPoints.length > 3 && (
            <Text style={styles.morePoints}>
              +{polygonPoints.length - 3} more points
            </Text>
          )}
        </View>
      )}

      {/* Polygon Preview */}
      {polygonPoints.length >= 3 && (
        <View style={styles.polygonPreview}>
          <Text style={styles.previewTitle}>Farm Boundary Preview:</Text>
          <View style={styles.polygonMapContainer}>
            <PolygonMapMobile 
              polygonData={polygonPoints}
              width={350}
              height={250}
              showCoordinates={false}
            />
          </View>
        </View>
      )}

      {/* Mapping Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={cancelMapping}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={cancelMapping} style={styles.cancelButton}>
              <Ionicons name="close" size={24} color="#ef4444" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Farm Boundary Mapping</Text>
            <TouchableOpacity onPress={finishMapping} style={styles.finishButton}>
              <Text style={styles.finishText}>Finish</Text>
              <Ionicons name="checkmark" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.instructionsCard}>
              <Ionicons name="information-circle" size={24} color="#013358" />
              <View style={styles.instructionsText}>
                <Text style={styles.instructionsTitle}>How to map your farm:</Text>
                <Text style={styles.instructionsStep}>1. Walk to each corner of your farm</Text>
                <Text style={styles.instructionsStep}>2. Tap "Add Point" at each corner</Text>
                <Text style={styles.instructionsStep}>3. Add at least 3 points to create a boundary</Text>
                <Text style={styles.instructionsStep}>4. Tap "Finish" when done</Text>
              </View>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Current Location:</Text>
                {currentLocation ? (
                  <View>
                    <Text style={styles.statusValue}>
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.accuracyText}>
                      Accuracy: {currentLocation.accuracy?.toFixed(1)}m
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.statusValue}>Getting location...</Text>
                )}
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Points Marked:</Text>
                <Text style={styles.statusValue}>{polygonPoints.length}</Text>
              </View>
              
              {polygonPoints.length >= 3 && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Estimated Area:</Text>
                  <Text style={styles.statusValue}>
                    {(calculateArea() / 10000).toFixed(2)} hectares
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <Animated.View style={{ transform: [{ scale: isMapping ? pulseAnim : 1 }] }}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.addPointButton]}
                  onPress={addPoint}
                  disabled={!currentLocation}
                >
                  <Ionicons name="add-circle" size={24} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Add Point</Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={[styles.actionButton, styles.removePointButton]}
                onPress={removeLastPoint}
                disabled={polygonPoints.length === 0}
              >
                <Ionicons name="remove-circle" size={24} color="#ffffff" />
                <Text style={styles.actionButtonText}>Remove Last</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.refreshButton]}
                onPress={watchLocation}
              >
                <Ionicons name="refresh" size={24} color="#ffffff" />
                <Text style={styles.actionButtonText}>Refresh GPS</Text>
              </TouchableOpacity>
            </View>

            {polygonPoints.length > 0 && (
              <View style={styles.pointsListModal}>
                <Text style={styles.pointsListTitle}>Marked Points:</Text>
                {polygonPoints.map((point, index) => (
                  <View key={index} style={styles.pointItemModal}>
                    <Text style={styles.pointNumber}>{index + 1}</Text>
                    <View style={styles.pointDetails}>
                      <Text style={styles.pointCoords}>
                        {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </Text>
                      <Text style={styles.pointTime}>
                        {new Date(point.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.pointAccuracy}>
                      ±{point.accuracy?.toFixed(1)}m
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#013358',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pointsList: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  pointsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  morePoints: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  polygonPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  polygonMapContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 80,
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  finishText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsStep: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    color: '#1f2937',
    fontFamily: 'monospace',
    textAlign: 'right',
    flex: 1,
  },
  accuracyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  addPointButton: {
    backgroundColor: '#10b981',
  },
  removePointButton: {
    backgroundColor: '#ef4444',
  },
  refreshButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  pointsListModal: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  pointsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  pointItemModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  pointNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#013358',
    width: 24,
  },
  pointDetails: {
    flex: 1,
    marginLeft: 12,
  },
  pointCoords: {
    fontSize: 14,
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  pointTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  pointAccuracy: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
